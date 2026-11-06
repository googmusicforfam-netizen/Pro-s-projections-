import React, { useState, useMemo } from 'react';
import { SlateMeta, Sport, Site } from '../types';
import { formatGameTime } from '../utils/timeFormat';
import {
  CalendarDays,
  X,
  Filter,
  Clock,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface UpcomingSlatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  upcomingSlates: SlateMeta[];
  onSelectSlate: (slateId: string, sport: Sport, site: Site) => void;
}

export const UpcomingSlatesModal: React.FC<UpcomingSlatesModalProps> = ({
  isOpen,
  onClose,
  upcomingSlates,
  onSelectSlate,
}) => {
  const [selectedSportFilter, setSelectedSportFilter] = useState<string>('ALL');
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('ALL');

  const filteredSlates = useMemo(() => {
    return upcomingSlates.filter((slate) => {
      if (selectedSportFilter !== 'ALL' && slate.sport !== selectedSportFilter) {
        return false;
      }
      if (selectedSiteFilter !== 'ALL' && slate.site !== selectedSiteFilter) {
        return false;
      }
      return true;
    });
  }, [upcomingSlates, selectedSportFilter, selectedSiteFilter]);

  // Group by dayLabel
  const groupedByDate = useMemo(() => {
    const groups: Record<string, SlateMeta[]> = {};
    filteredSlates.forEach((s) => {
      const key = s.dayLabel || s.date;
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    return groups;
  }, [filteredSlates]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#0d131f] border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <CalendarDays className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white font-display">
                Next 7 Days DFS Slates Calendar
              </h2>
              <p className="text-xs text-slate-400">
                Official DraftKings & FanDuel tournament slates across NBA, NFL, NHL, and NASCAR.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold border border-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Strip */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Sport Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-slate-400 font-semibold mr-1">Sport:</span>
            {['ALL', 'nfl', 'nba', 'nhl', 'nascar'].map((sp) => (
              <button
                key={sp}
                onClick={() => setSelectedSportFilter(sp)}
                className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all whitespace-nowrap min-h-[34px] ${
                  selectedSportFilter === sp
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {sp === 'ALL' ? 'All Sports' : sp}
              </button>
            ))}
          </div>

          {/* Site Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold mr-1">Site:</span>
            {['ALL', 'draftkings', 'fanduel'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedSiteFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap min-h-[34px] ${
                  selectedSiteFilter === st
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {st === 'ALL' ? 'Both Sites' : st === 'draftkings' ? 'DraftKings' : 'FanDuel'}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body: Calendar List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {Object.entries(groupedByDate).length > 0 ? (
            Object.entries(groupedByDate).map(([dayLabel, slatesList]) => (
              <div key={dayLabel} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-200 font-display">
                    {dayLabel}
                  </h3>
                  <span className="text-xs font-mono text-slate-500">
                    ({slatesList.length} slate{slatesList.length > 1 ? 's' : ''})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {slatesList.map((s) => (
                    <div
                      key={s.id}
                      className="bg-slate-900/90 border border-slate-800/90 hover:border-emerald-500/60 rounded-2xl p-4 shadow-md transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono">
                              {s.sport.toUpperCase()}
                            </span>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                                s.site === 'draftkings'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-sky-950 text-sky-300 border border-sky-500/30'
                              }`}
                            >
                              {s.site === 'draftkings' ? 'DraftKings' : 'FanDuel'}
                            </span>
                          </div>

                          {s.isCaptainMode && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                              Showdown
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-white font-display mt-2 group-hover:text-emerald-400 transition-colors">
                          {s.slateName}
                        </h4>

                        <div className="text-xs text-slate-400 mt-1 font-mono space-y-0.5">
                          <p>
                            Games: <strong className="text-slate-300">{s.gameCount}</strong> · First Lock: <strong className="text-slate-300">{formatGameTime(s.firstGameTime)}</strong>
                          </p>
                          <p className="text-slate-500 truncate">{s.gameSummary}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onSelectSlate(s.id, s.sport, s.site);
                          onClose();
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[38px]"
                      >
                        <span>Open Projections & Optimizer</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Clock className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">No slates match your filter</p>
              <p className="text-xs text-slate-500">Try changing your sport or site filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
