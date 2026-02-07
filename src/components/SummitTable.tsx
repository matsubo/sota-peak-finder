/**
 * Summit Table Component
 * Displays paginated summit results with vintage radio aesthetic
 */

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { SotaSummit } from '../utils/sotaDatabase';
import { getAssociationFlag } from '../utils/countryFlags';

interface SummitTableProps {
  summits: SotaSummit[];
  totalSummits: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  loading: boolean;
  onAssociationClick?: (association: string) => void;
}

export function SummitTable({
  summits,
  totalSummits,
  currentPage,
  onPageChange,
  loading,
  onAssociationClick,
}: SummitTableProps) {
  const { t } = useTranslation();

  const pageSize = 20;
  const totalPages = Math.ceil(totalSummits / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalSummits);

  // Activation count color coding
  const getActivationColor = (activations: number) => {
    if (activations === 0) return 'text-gray-500';
    if (activations <= 10) return 'text-green-400';
    if (activations <= 100) return 'text-amber-400';
    return 'text-cyan-400';
  };

  if (loading) {
    return (
      <div className="card-technical p-6">
        <div className="flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 font-mono-data">Loading summits...</span>
        </div>
      </div>
    );
  }

  if (summits.length === 0) {
    return (
      <div className="card-technical p-8 text-center">
        <p className="text-gray-400 font-mono-data mb-4">{t('summits.noResults')}</p>
        <p className="text-sm text-gray-500 font-mono-data">{t('summits.tryReset')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Table Header */}
      <div className="card-technical p-3">
        <p className="text-xs text-gray-400 font-mono-data">
          {t('summits.showing', { start: startIndex, end: endIndex, total: totalSummits.toLocaleString() })}
        </p>
        {totalSummits > 10000 && (
          <p className="text-xs text-amber-400 font-mono-data mt-1">
            ⚠ {t('summits.largeResultSet', { count: totalSummits })}
          </p>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block card-technical overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-teal-500/30 bg-black/40">
                <th className="px-3 py-2 text-left text-xs font-semibold text-vfd-green font-mono-data">#</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-vfd-green font-mono-data">REF</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-vfd-green font-mono-data">NAME</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-vfd-green font-mono-data">ASSOCIATION</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-vfd-green font-mono-data">ALT</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-vfd-green font-mono-data">PTS</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-vfd-green font-mono-data">ACT</th>
              </tr>
            </thead>
            <tbody>
              {summits.map((summit, index) => (
                <tr
                  key={summit.id}
                  className="border-b border-teal-500/10 hover:bg-teal-500/10 transition-colors"
                >
                  <td className="px-3 py-2 text-xs text-gray-500 font-mono-data">
                    {startIndex + index}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      to={`/summit/${summit.ref.toLowerCase().replace(/\//g, '-')}`}
                      className="text-sm text-amber-400 hover:text-amber-300 font-mono-data transition-colors"
                    >
                      {summit.ref}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-200 font-mono-data">
                    {summit.name}
                  </td>
                  <td className="px-3 py-2">
                    {onAssociationClick ? (
                      <button
                        onClick={() => onAssociationClick(summit.association)}
                        className="text-sm text-teal-400 hover:text-teal-300 font-mono-data transition-colors flex items-center gap-1.5"
                      >
                        <span className="text-base">{getAssociationFlag(summit.association)}</span>
                        <span>{summit.association}</span>
                      </button>
                    ) : (
                      <span className="text-sm text-teal-400 font-mono-data flex items-center gap-1.5">
                        <span className="text-base">{getAssociationFlag(summit.association)}</span>
                        <span>{summit.association}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-300 font-mono-data text-right">
                    {summit.altitude}m
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-300 font-mono-data text-right">
                    {summit.points}pt
                  </td>
                  <td className={`px-3 py-2 text-sm font-mono-data text-right ${getActivationColor(summit.activations)}`}>
                    {summit.activations}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-2">
        {summits.map((summit, index) => (
          <div key={summit.id} className="card-technical p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <Link
                  to={`/summit/${summit.ref.toLowerCase().replace(/\//g, '-')}`}
                  className="text-sm text-amber-400 hover:text-amber-300 font-mono-data transition-colors block"
                >
                  {summit.ref}
                </Link>
                <p className="text-sm text-gray-200 font-mono-data truncate mt-0.5">
                  {summit.name}
                </p>
              </div>
              <span className="text-xs text-gray-500 font-mono-data">
                #{startIndex + index}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Association: </span>
                <span className="text-teal-400 font-mono-data inline-flex items-center gap-1">
                  <span className="text-sm">{getAssociationFlag(summit.association)}</span>
                  <span>{summit.association}</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-gray-500">Altitude: </span>
                <span className="text-gray-300 font-mono-data">{summit.altitude}m</span>
              </div>
              <div>
                <span className="text-gray-500">Points: </span>
                <span className="text-gray-300 font-mono-data">{summit.points}pt</span>
              </div>
              <div className="text-right">
                <span className="text-gray-500">Activations: </span>
                <span className={`font-mono-data ${getActivationColor(summit.activations)}`}>
                  {summit.activations}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="card-technical p-3 flex items-center justify-between">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 bg-black/60 border border-teal-500/40 rounded hover:bg-teal-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4 text-teal-400" />
            <span className="text-sm text-gray-300 font-mono-data">Prev</span>
          </button>

          <div className="text-sm text-gray-400 font-mono-data">
            {t('summits.page')} {currentPage} {t('summits.of')} {totalPages}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 bg-black/60 border border-teal-500/40 rounded hover:bg-teal-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <span className="text-sm text-gray-300 font-mono-data">Next</span>
            <ChevronRight className="w-4 h-4 text-teal-400" />
          </button>
        </div>
      )}
    </div>
  );
}
