/**
 * Summits List Page
 * Browse and filter all SOTA summits worldwide
 */

import { useState, useEffect } from 'react';
import { useSummitFilters } from '../hooks/useSummitFilters';
import { SummitFilters } from '../components/SummitFilters';
import { SummitTable } from '../components/SummitTable';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export function SummitsListPage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sotaBuildDate, setSotaBuildDate] = useState<string | null>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load database metadata
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const { sotaDatabase } = await import('../utils/sotaDatabase');
        await sotaDatabase.init();
        const metadata = await sotaDatabase.getMetadata();
        if (metadata.buildDate) {
          setSotaBuildDate(metadata.buildDate);
        }
      } catch (error) {
        console.warn('Failed to load database metadata:', error);
      }
    };
    loadMetadata();
  }, []);

  const {
    filters,
    setFilters,
    resetFilters,
    summits,
    totalSummits,
    loading,
    error,
    countries,
    associations,
    regions,
    filterRanges,
  } = useSummitFilters();

  const handleAssociationClick = (association: string) => {
    setFilters({ association, region: '' });
  };

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-5 relative z-10">
      <div className="mx-auto max-w-6xl">
        <Header isOnline={isOnline} />

        {/* Main Content */}
        <main className="space-y-4">
        {/* Error Message */}
        {error && (
          <div className="card-technical p-4 border-red-500/40 bg-red-500/10">
            <p className="text-red-400 font-mono-data text-sm">
              ❌ Error: {error.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-3 py-1 bg-black/60 border border-red-500/40 rounded hover:bg-red-500/20 transition-colors text-red-400 font-mono-data text-xs"
            >
              Retry
            </button>
          </div>
        )}

        {/* Filters */}
        <SummitFilters
          filters={filters}
          setFilters={setFilters}
          resetFilters={resetFilters}
          countries={countries}
          associations={associations}
          regions={regions}
          filterRanges={filterRanges}
        />

        {/* Results Table */}
        <SummitTable
          summits={summits}
          totalSummits={totalSummits}
          currentPage={filters.page}
          onPageChange={(page) => setFilters({ page })}
          loading={loading}
          onAssociationClick={handleAssociationClick}
        />
        </main>

        <Footer isOnline={isOnline} sotaCount={totalSummits} sotaBuildDate={sotaBuildDate} />
      </div>
    </div>
  );
}
