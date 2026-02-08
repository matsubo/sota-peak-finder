/**
 * Summit Filters Hook
 * Manages filter state, URL sync, and database queries for summit list page
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { sotaDatabase, type SotaSummit } from '../utils/sotaDatabase';

export interface FilterState {
  association: string;
  region: string;
  minAltitude: number;
  maxAltitude: number;
  minPoints: number;
  maxPoints: number;
  minActivations: number;
  maxActivations: number | undefined;
  searchText: string;
  sortBy: 'name' | 'altitude' | 'points' | 'activations' | 'ref';
  sortOrder: 'asc' | 'desc';
  page: number;
}

export interface FilterRanges {
  minAltitude: number;
  maxAltitude: number;
  maxActivations: number;
}

const DEFAULT_FILTERS: FilterState = {
  association: '',
  region: '',
  minAltitude: 0,
  maxAltitude: 9000,
  minPoints: 1,
  maxPoints: 10,
  minActivations: 0,
  maxActivations: undefined,
  searchText: '',
  sortBy: 'name',
  sortOrder: 'asc',
  page: 1,
};

export function useSummitFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFiltersState] = useState<FilterState>(DEFAULT_FILTERS);
  const [summits, setSummits] = useState<SotaSummit[]>([]);
  const [totalSummits, setTotalSummits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [associations, setAssociations] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [filterRanges, setFilterRanges] = useState<FilterRanges>({
    minAltitude: 0,
    maxAltitude: 9000,
    maxActivations: 500,
  });
  const searchDebounceTimer = useRef<number | null>(null);

  // Load initial data (associations and filter ranges)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await sotaDatabase.init();
        const [assocs, ranges] = await Promise.all([
          sotaDatabase.getAssociations(),
          sotaDatabase.getFilterRanges(),
        ]);
        setAssociations(assocs);
        setFilterRanges(ranges);

        // Update default max altitude from DB
        setFiltersState(prev => ({
          ...prev,
          maxAltitude: ranges.maxAltitude,
        }));
      } catch (err) {
        console.error('Failed to load initial data:', err);
        setError(err as Error);
      }
    };

    loadInitialData();
  }, []);

  // Read filters from URL on mount
  useEffect(() => {
    const urlFilters: Partial<FilterState> = {};

    // Handle "unactivated" shortcut parameter
    const unactivated = searchParams.get('unactivated');
    if (unactivated === 'true') {
      urlFilters.minActivations = 0;
      urlFilters.maxActivations = 0;
      urlFilters.sortBy = 'points';
      urlFilters.sortOrder = 'desc';
    }

    const association = searchParams.get('association');
    if (association) urlFilters.association = association;

    const region = searchParams.get('region');
    if (region) urlFilters.region = region;

    const minAltitude = searchParams.get('minAltitude');
    if (minAltitude) urlFilters.minAltitude = parseInt(minAltitude, 10);

    const maxAltitude = searchParams.get('maxAltitude');
    if (maxAltitude) urlFilters.maxAltitude = parseInt(maxAltitude, 10);

    const minPoints = searchParams.get('minPoints');
    if (minPoints) urlFilters.minPoints = parseInt(minPoints, 10);

    const maxPoints = searchParams.get('maxPoints');
    if (maxPoints) urlFilters.maxPoints = parseInt(maxPoints, 10);

    const minActivations = searchParams.get('minActivations');
    if (minActivations) urlFilters.minActivations = parseInt(minActivations, 10);

    const maxActivations = searchParams.get('maxActivations');
    if (maxActivations) urlFilters.maxActivations = parseInt(maxActivations, 10);

    const searchText = searchParams.get('search');
    if (searchText) urlFilters.searchText = searchText;

    const sortBy = searchParams.get('sortBy') as FilterState['sortBy'];
    if (sortBy && ['name', 'altitude', 'points', 'activations', 'ref'].includes(sortBy)) {
      urlFilters.sortBy = sortBy;
    }

    const sortOrder = searchParams.get('sortOrder') as FilterState['sortOrder'];
    if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
      urlFilters.sortOrder = sortOrder;
    }

    const page = searchParams.get('page');
    if (page) urlFilters.page = parseInt(page, 10);

    if (Object.keys(urlFilters).length > 0) {
      setFiltersState(prev => ({ ...prev, ...urlFilters }));
    }
  }, [searchParams]);

  // Load regions when association changes
  useEffect(() => {
    if (filters.association) {
      const loadRegions = async () => {
        try {
          const regs = await sotaDatabase.getRegionsByAssociation(filters.association);
          setRegions(regs);
        } catch (err) {
          console.error('Failed to load regions:', err);
        }
      };
      loadRegions();
    } else {
      setRegions([]);
      // Clear region when association is cleared
      if (filters.region) {
        setFiltersState(prev => ({ ...prev, region: '' }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.association]); // filters.region is intentionally omitted to avoid infinite loops

  // Debounced search query
  const performSearch = useCallback(async (currentFilters: FilterState) => {
    setLoading(true);
    setError(null);

    try {
      const offset = (currentFilters.page - 1) * 20;
      const result = await sotaDatabase.searchSummits({
        association: currentFilters.association || undefined,
        region: currentFilters.region || undefined,
        minAltitude: currentFilters.minAltitude,
        maxAltitude: currentFilters.maxAltitude,
        minPoints: currentFilters.minPoints,
        maxPoints: currentFilters.maxPoints,
        minActivations: currentFilters.minActivations,
        maxActivations: currentFilters.maxActivations,
        searchText: currentFilters.searchText || undefined,
        sortBy: currentFilters.sortBy,
        sortOrder: currentFilters.sortOrder,
        offset,
        limit: 20,
      });

      setSummits(result.summits);
      setTotalSummits(result.total);
    } catch (err) {
      console.error('Search failed:', err);
      setError(err as Error);
      setSummits([]);
      setTotalSummits(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger search when filters change (with debounce for search text)
  useEffect(() => {
    // Clear existing debounce timer
    if (searchDebounceTimer.current) {
      window.clearTimeout(searchDebounceTimer.current);
    }

    // Debounce search text changes
    const timer = window.setTimeout(() => {
      performSearch(filters);
    }, filters.searchText ? 300 : 0);

    searchDebounceTimer.current = timer;

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [filters, performSearch]);

  // Update URL when filters change
  useEffect(() => {
    const params = new window.URLSearchParams();

    if (filters.association) params.set('association', filters.association);
    if (filters.region) params.set('region', filters.region);
    if (filters.minAltitude !== DEFAULT_FILTERS.minAltitude) {
      params.set('minAltitude', filters.minAltitude.toString());
    }
    if (filters.maxAltitude !== filterRanges.maxAltitude) {
      params.set('maxAltitude', filters.maxAltitude.toString());
    }
    if (filters.minPoints !== DEFAULT_FILTERS.minPoints) {
      params.set('minPoints', filters.minPoints.toString());
    }
    if (filters.maxPoints !== DEFAULT_FILTERS.maxPoints) {
      params.set('maxPoints', filters.maxPoints.toString());
    }
    if (filters.minActivations !== DEFAULT_FILTERS.minActivations) {
      params.set('minActivations', filters.minActivations.toString());
    }
    if (filters.maxActivations !== undefined) {
      params.set('maxActivations', filters.maxActivations.toString());
    }
    if (filters.searchText) params.set('search', filters.searchText);
    if (filters.sortBy !== DEFAULT_FILTERS.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder !== DEFAULT_FILTERS.sortOrder) params.set('sortOrder', filters.sortOrder);
    if (filters.page !== DEFAULT_FILTERS.page) params.set('page', filters.page.toString());

    setSearchParams(params, { replace: true });
  }, [filters, filterRanges.maxAltitude, setSearchParams]);

  const setFilters = useCallback((updates: Partial<FilterState>) => {
    setFiltersState(prev => {
      const newFilters = { ...prev, ...updates };

      // Reset page to 1 when filters change (except when page itself is being updated)
      if (!('page' in updates) && Object.keys(updates).length > 0) {
        newFilters.page = 1;
      }

      return newFilters;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({
      ...DEFAULT_FILTERS,
      maxAltitude: filterRanges.maxAltitude,
    });
  }, [filterRanges.maxAltitude]);

  return {
    filters,
    setFilters,
    resetFilters,
    summits,
    totalSummits,
    loading,
    error,
    associations,
    regions,
    filterRanges,
  };
}
