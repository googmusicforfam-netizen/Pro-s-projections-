import React, { useState } from 'react';
import { Sport, Site, SportSlate } from '../types';
import { formatLastUpdated, RefreshIntervalInfo } from '../utils/timeFormat';
import { RefreshCw, ShieldAlert, Sparkles, ExternalLink, ChevronDown, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  currentSport: Sport;
  onSelectSport: (sport: Sport) => void;
  currentSite: Site;
  onToggleSite: (site: Site) => void;
  slate: SportSlate | null;
  refreshInfo: RefreshIntervalInfo;
  secondsUntilNextRefresh: number;
  isRefreshing: boolean;
  onRefreshNow: () => void;
  recentChanges: string[];
}

export const Header: React.FC<HeaderProps> = ({
  currentSport,
  onSelectSport,
  currentSite,
  onToggleSite,
  slate,
  refreshInfo,
  secondsUntilNextRefresh,
  isRefreshing,
  onRefreshNow,
  recentChanges,
}) => {
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [showChangesBanner, setShowChangesBanner] = useState(true);

  // Sports list with active status check:
  // Rule: "Only show a sport when it has games or a race on today's slate. If there's no NASCAR race today, don't show NASCAR at all."
  // Active today (Nov 5, 2026): NBA (in-season), NFL (TNF), NHL (in-season).
  // MLB (offseason), NASCAR (no Thursday race).
  const availableSports: { id: Sport; label: string; activeToday: boolean }[] = [
    { id: 'nba', label: 'NBA', activeToday: true },
    { id: 'nfl', label: 'NFL', activeToday: true },
    { id: 'nhl', label: 'NHL', activeToday: true },
    { id: 'mlb', label: 'MLB', activeToday: false },
    { id: 'nascar', label: 'NASCAR', activeToday: false },
  ];

  const activeSportsList = availableSports.filter((s) => s.activeToday);

  return (
    <header className="sticky top-0 z-30 bg-[#0d131f]/95 backdrop-blur-md border-b border-slate-800/80">
      {/* Top Bar Zone: Brand, Site Switcher, Refresh Status */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-emerald-500/20">
            PRO
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white font-display leading-tight flex items-center gap-1.5">
              PROS PROJECTIONS
              <span className="text-[10px] font-semibold tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                2026 DFS
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 leading-none hidden sm:block">
              Tournament GPP Analytics & Optimizer
            </p>
          </div>
        </div>

        {/* Site Switcher Toggle (DraftKings vs FanDuel) */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 p-0.5 rounded-lg shrink-0">
          <button
            onClick={() => onToggleSite('draftkings')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap min-h-[36px] flex items-center ${
              currentSite === 'draftkings'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            DraftKings
          </button>
          <button
            onClick={() => onToggleSite('fanduel')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap min-h-[36px] flex items-center ${
              currentSite === 'fanduel'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            FanDuel
          </button>
        </div>

        {/* Refresh Now Button & Schedule Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRefreshNow}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-medium text-slate-200 rounded-lg border border-slate-700/80 transition-all min-h-[38px]"
            title="Force refresh projections with live 2026 web search"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Now</span>
            <span className="sm:hidden">Sync</span>
          </button>

          {/* Sources & Last Updated Trigger */}
          <button
            onClick={() => setShowSourcesModal(!showSourcesModal)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800 rounded-lg min-h-[38px]"
          >
            <span className="hidden md:inline">Sources</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Sport Selector Bar (Only sports with games today!) */}
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between border-t border-slate-800/40 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mr-1">
            Active Today:
          </span>
          {activeSportsList.map((sport) => {
            const isSelected = currentSport === sport.id;
            return (
              <button
                key={sport.id}
                onClick={() => onSelectSport(sport.id)}
                className={`px-3 py-1.5 rounded-md font-semibold text-xs transition-all whitespace-nowrap min-h-[34px] flex items-center gap-1 ${
                  isSelected
                    ? 'bg-slate-100 text-slate-900 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
                }`}
              >
                {sport.label}
                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-normal">
                  Live Slate
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Countdown & Timing status */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span>
              {refreshInfo.isLockedSlate
                ? 'Slate Started (Players Locked)'
                : `Next auto-refresh in ${secondsUntilNextRefresh}s`}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">{refreshInfo.label}</span>
          </div>
          {slate && (
            <span className="text-slate-400">
              Updated: <span className="text-slate-300 font-mono">{formatLastUpdated(slate.lastUpdated)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Recent Changes Highlight Banner */}
      {recentChanges.length > 0 && showChangesBanner && (
        <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900/90 to-cyan-950/70 border-t border-emerald-500/30 px-4 py-1.5 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-semibold text-emerald-400">Latest Slate Update:</span>
            <span className="text-slate-200 truncate">{recentChanges[0]}</span>
          </div>
          <button
            onClick={() => setShowChangesBanner(false)}
            className="text-slate-400 hover:text-slate-200 text-xs px-2 py-0.5 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sources & Last Updated Popover Modal */}
      {showSourcesModal && slate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-display">
                Data Sources & Grounding Verification
              </h3>
              <button
                onClick={() => setShowSourcesModal(false)}
                className="text-slate-400 hover:text-white p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div>
                <span className="text-slate-400 font-semibold block mb-1">Current Slate Season:</span>
                <p className="text-emerald-400 font-mono font-medium">{slate.seasonContext}</p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1">Last Grounded & Verified:</span>
                <p className="font-mono text-slate-200">{formatLastUpdated(slate.lastUpdated)} (Local Time)</p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1.5">Primary Grounded Sources:</span>
                <ul className="space-y-1.5">
                  {slate.sources.map((src, i) => (
                    <li key={i} className="flex items-center gap-2 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{src}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/60 text-[11px] text-slate-400 leading-relaxed">
                <span className="font-semibold text-slate-300 block mb-1">Grounding & Freshness Rules:</span>
                Projections are cross-checked strictly for the 2026 season against Fantasy Fuel, confirmed starting lineups, starting goalies, late injury wire reports, and consensus Vegas lines.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSourcesModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
