import React from 'react';
import { SportSlate, SlateMeta, Site, Sport } from '../types';
import { formatGameTime } from '../utils/timeFormat';
import {
  CalendarDays,
  Clock,
  Lock,
  Radio,
  ChevronRight,
  Sparkles,
  Zap,
  Layers,
} from 'lucide-react';

interface SlateSelectorProps {
  slates: SportSlate[];
  selectedSlateId: string;
  onSelectSlate: (slateId: string) => void;
  onOpenUpcomingModal: () => void;
  currentSport: Sport;
  currentSite: Site;
  newSlateAlert?: string | null;
}

export const SlateSelector: React.FC<SlateSelectorProps> = ({
  slates,
  selectedSlateId,
  onSelectSlate,
  onOpenUpcomingModal,
  currentSport,
  currentSite,
  newSlateAlert,
}) => {
  // Sort slates:
  // Active/Upcoming soonest first; Locked slates moved to the bottom!
  const sortedSlates = React.useMemo(() => {
    const list = [...slates];
    list.sort((a, b) => {
      // 1. If one is locked and the other is not, non-locked comes first
      if (a.status === 'Locked' && b.status !== 'Locked') return 1;
      if (b.status === 'Locked' && a.status !== 'Locked') return -1;

      // 2. Otherwise sort by start time ascending (soonest first)
      return new Date(a.firstGameTime).getTime() - new Date(b.firstGameTime).getTime();
    });
    return list;
  }, [slates]);

  const getStatusBadge = (status: 'Upcoming' | 'Live' | 'Locked') => {
    if (status === 'Live') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Live
        </span>
      );
    }
    if (status === 'Locked') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
          <Lock className="w-3 h-3 text-slate-400" />
          Locked
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-sky-950/80 text-sky-400 border border-sky-500/30">
        <Clock className="w-3 h-3 text-sky-400" />
        Upcoming
      </span>
    );
  };

  const getFormatBadge = (format: string, isCaptainMode: boolean) => {
    if (isCaptainMode) {
      return (
        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/30">
          Showdown 1.5x
        </span>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#0b101c] border-b border-slate-800/80">
      {/* Alert when new slate is discovered */}
      {newSlateAlert && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 px-4 py-1.5 text-xs text-emerald-300 flex items-center justify-between border-b border-emerald-500/30">
          <div className="flex items-center gap-2 overflow-hidden">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-semibold text-emerald-400">Lobby Update:</span>
            <span className="truncate">{newSlateAlert}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Header Row: Label + 7-Day Calendar Button */}
          <div className="flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-display">
                Select Slate:
              </span>
            </div>

            {/* 7-Day Upcoming Slates Trigger */}
            <button
              onClick={onOpenUpcomingModal}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-400 hover:text-sky-300 border border-slate-800 min-h-[34px] transition-all"
            >
              <CalendarDays className="w-3.5 h-3.5 text-sky-400" />
              <span>Next 7 Days Slates</span>
            </button>
          </div>

          {/* Slate Chips Bar (DraftKings & FanDuel formatted labels) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {sortedSlates.map((s) => {
              const isSelected = s.id === selectedSlateId;
              const isLocked = s.status === 'Locked';

              return (
                <button
                  key={s.id}
                  onClick={() => onSelectSlate(s.id)}
                  className={`flex flex-col text-left px-3.5 py-2 rounded-xl transition-all whitespace-nowrap min-h-[46px] shrink-0 border ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                      : isLocked
                      ? 'bg-slate-950/60 border-slate-800/60 text-slate-500 opacity-60 hover:opacity-90'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold font-display ${
                        isSelected ? 'text-white' : 'text-slate-200'
                      }`}
                    >
                      {s.slateName}
                    </span>
                    {getStatusBadge(s.status)}
                    {getFormatBadge(s.format, s.isCaptainMode)}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                    <span>{s.dayLabel}</span>
                    <span>·</span>
                    <span className="text-slate-400">{s.gameSummary}</span>
                    <span>·</span>
                    <span className="text-slate-400">{s.rosterSlots.length} roster slots</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
