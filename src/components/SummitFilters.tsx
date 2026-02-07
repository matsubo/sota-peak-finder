/**
 * Summit Filters Component
 * Filter control panel with vintage radio aesthetic
 */

import { useTranslation } from 'react-i18next';
import { Search, RotateCcw, ArrowUpDown } from 'lucide-react';
import type { FilterState, FilterRanges } from '../hooks/useSummitFilters';

interface SummitFiltersProps {
  filters: FilterState;
  setFilters: (updates: Partial<FilterState>) => void;
  resetFilters: () => void;
  associations: string[];
  regions: string[];
  filterRanges: FilterRanges;
}

export function SummitFilters({
  filters,
  setFilters,
  resetFilters,
  associations,
  regions,
  filterRanges,
}: SummitFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="card-technical p-3 space-y-3">
      <h2 className="text-sm font-semibold text-vfd-green font-display uppercase tracking-wide flex items-center gap-2">
        <Search className="w-4 h-4" />
        {t('summits.filters')}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Association */}
        <div>
          <label className="block text-xs text-gray-400 mb-1 font-mono-data">
            {t('summits.association')}
          </label>
          <select
            value={filters.association}
            onChange={(e) => setFilters({ association: e.target.value, region: '' })}
            className="w-full bg-black/60 border border-teal-500/40 rounded px-2 py-1.5 text-sm text-gray-100 font-mono-data focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50"
          >
            <option value="">{t('summits.allAssociations')}</option>
            {associations.map((assoc) => (
              <option key={assoc} value={assoc}>
                {assoc}
              </option>
            ))}
          </select>
        </div>

        {/* Region */}
        <div>
          <label className="block text-xs text-gray-400 mb-1 font-mono-data">
            {t('summits.region')}
          </label>
          <select
            value={filters.region}
            onChange={(e) => setFilters({ region: e.target.value })}
            disabled={!filters.association || regions.length === 0}
            className="w-full bg-black/60 border border-teal-500/40 rounded px-2 py-1.5 text-sm text-gray-100 font-mono-data focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">{t('summits.allRegions')}</option>
            {regions.map((reg) => (
              <option key={reg} value={reg}>
                {reg}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-xs text-gray-400 mb-1 font-mono-data">
            {t('summits.sortBy')}
          </label>
          <div className="flex gap-1">
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ sortBy: e.target.value as FilterState['sortBy'] })}
              className="flex-1 bg-black/60 border border-teal-500/40 rounded px-2 py-1.5 text-sm text-gray-100 font-mono-data focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50"
            >
              <option value="name">{t('summits.sortName')}</option>
              <option value="altitude">{t('summits.sortAltitude')}</option>
              <option value="points">{t('summits.sortPoints')}</option>
              <option value="activations">{t('summits.sortActivations')}</option>
              <option value="ref">{t('summits.sortRef')}</option>
            </select>
            <button
              onClick={() => setFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
              className="px-2 py-1.5 bg-black/60 border border-teal-500/40 rounded hover:bg-teal-500/20 transition-colors"
              title={filters.sortOrder === 'asc' ? t('summits.ascending') : t('summits.descending')}
            >
              <ArrowUpDown className={`w-4 h-4 text-teal-400 transition-transform ${filters.sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div>
          <label className="block text-xs text-gray-400 mb-1 font-mono-data">
            {t('summits.search')}
          </label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={filters.searchText}
              onChange={(e) => setFilters({ searchText: e.target.value })}
              placeholder={t('summits.searchPlaceholder')}
              className="w-full bg-black/60 border border-teal-500/40 rounded pl-8 pr-2 py-1.5 text-sm text-gray-100 font-mono-data placeholder:text-gray-600 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50"
            />
          </div>
        </div>
      </div>

      {/* Altitude Range */}
      <div>
        <label className="block text-xs text-gray-400 mb-1 font-mono-data">
          {t('summits.altitude')}: {filters.minAltitude}m - {filters.maxAltitude}m
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="range"
            min={filterRanges.minAltitude}
            max={filterRanges.maxAltitude}
            value={filters.minAltitude}
            onChange={(e) => setFilters({ minAltitude: parseInt(e.target.value, 10) })}
            className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
          />
          <input
            type="range"
            min={filterRanges.minAltitude}
            max={filterRanges.maxAltitude}
            value={filters.maxAltitude}
            onChange={(e) => setFilters({ maxAltitude: parseInt(e.target.value, 10) })}
            className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
          />
        </div>
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => setFilters({ minAltitude: 0, maxAltitude: 500 })}
            className="px-2 py-0.5 text-xs bg-black/60 border border-teal-500/40 rounded hover:bg-teal-500/20 transition-colors text-gray-300 font-mono-data"
          >
            0-500m
          </button>
          <button
            onClick={() => setFilters({ minAltitude: 500, maxAltitude: 1500 })}
            className="px-2 py-0.5 text-xs bg-black/60 border border-teal-500/40 rounded hover:bg-teal-500/20 transition-colors text-gray-300 font-mono-data"
          >
            500-1500m
          </button>
          <button
            onClick={() => setFilters({ minAltitude: 1500, maxAltitude: 3000 })}
            className="px-2 py-0.5 text-xs bg-black/60 border border-teal-500/40 rounded hover:bg-teal-500/20 transition-colors text-gray-300 font-mono-data"
          >
            1500-3000m
          </button>
          <button
            onClick={() => setFilters({ minAltitude: 3000, maxAltitude: filterRanges.maxAltitude })}
            className="px-2 py-0.5 text-xs bg-black/60 border border-teal-500/40 rounded hover:bg-teal-500/20 transition-colors text-gray-300 font-mono-data"
          >
            3000m+
          </button>
        </div>
      </div>

      {/* Points Range */}
      <div>
        <label className="block text-xs text-gray-400 mb-1 font-mono-data">
          {t('summits.points')}: {filters.minPoints}pt - {filters.maxPoints}pt
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="range"
            min={1}
            max={10}
            value={filters.minPoints}
            onChange={(e) => setFilters({ minPoints: parseInt(e.target.value, 10) })}
            className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <input
            type="range"
            min={1}
            max={10}
            value={filters.maxPoints}
            onChange={(e) => setFilters({ maxPoints: parseInt(e.target.value, 10) })}
            className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
        </div>
      </div>

      {/* Activations */}
      <div>
        <label className="block text-xs text-gray-400 mb-1 font-mono-data">
          {t('summits.activations')}: {filters.minActivations}+
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="range"
            min={0}
            max={Math.min(500, filterRanges.maxActivations)}
            step={10}
            value={filters.minActivations}
            onChange={(e) => setFilters({ minActivations: parseInt(e.target.value, 10) })}
            className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setFilters({ minActivations: 0 })}
              className="px-2 py-0.5 text-xs bg-black/60 border border-teal-500/40 rounded hover:bg-teal-500/20 transition-colors text-gray-300 font-mono-data whitespace-nowrap"
            >
              {t('summits.unactivated')}
            </button>
            <button
              onClick={() => setFilters({ minActivations: 100 })}
              className="px-2 py-0.5 text-xs bg-black/60 border border-teal-500/40 rounded hover:bg-teal-500/20 transition-colors text-gray-300 font-mono-data whitespace-nowrap"
            >
              {t('summits.popular')}
            </button>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <div className="flex justify-end">
        <button
          onClick={resetFilters}
          className="px-4 py-1.5 bg-black/60 border border-amber-500/40 rounded hover:bg-amber-500/20 transition-colors text-amber-400 font-mono-data text-sm flex items-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {t('summits.resetFilters')}
        </button>
      </div>
    </div>
  );
}
