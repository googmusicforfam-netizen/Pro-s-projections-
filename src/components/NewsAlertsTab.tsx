import React, { useState } from 'react';
import { NewsItem, Sport } from '../types';
import { formatLastUpdated } from '../utils/timeFormat';
import { ShieldAlert, AlertTriangle, CheckCircle2, UserCheck, Flame, Filter, Zap } from 'lucide-react';

interface NewsAlertsTabProps {
  news: NewsItem[];
  highPriorityAlert?: {
    id: string;
    player: string;
    team: string;
    headline: string;
    replacementRecommendation: string;
  };
  sport: Sport;
}

export const NewsAlertsTab: React.FC<NewsAlertsTabProps> = ({
  news,
  highPriorityAlert,
  sport,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [dismissedAlert, setDismissedAlert] = useState(false);

  const filteredNews = news.filter((item) => {
    if (filterType === 'ALL') return true;
    return item.type === filterType;
  });

  const getAlertIcon = (type: NewsItem['type']) => {
    switch (type) {
      case 'OUT_ALERT':
      case 'SCRATCH':
        return <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />;
      case 'LINEUP_CONFIRMED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'STARTING_GOALIE':
        return <UserCheck className="w-5 h-5 text-cyan-400 shrink-0" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* High Priority Ruled Out Banner Alert (Prompt requirement: banner alert when a top-value player is ruled out) */}
      {highPriorityAlert && !dismissedAlert && (
        <div className="bg-gradient-to-r from-rose-950/90 via-slate-900 to-rose-950/90 border-2 border-rose-500/80 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden animate-pulse">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-slate-950 font-black flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/40">
                OUT
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-500/40 font-mono">
                    High Priority Ruled Out Alert
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {highPriorityAlert.team}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-white mt-1 font-display">
                  {highPriorityAlert.headline}
                </h3>

                <div className="mt-2 text-xs sm:text-sm text-rose-200 bg-rose-950/60 p-3 rounded-xl border border-rose-500/30">
                  <strong className="text-emerald-400 block mb-0.5">
                    Recommended Tournament Pivot:
                  </strong>
                  {highPriorityAlert.replacementRecommendation}
                </div>
              </div>
            </div>

            <button
              onClick={() => setDismissedAlert(true)}
              className="text-slate-400 hover:text-white p-1 text-sm font-bold"
              title="Dismiss alert"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Filter Strip */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white font-display">
            Live 2026 Injury, Lineup & Scratch Wire
          </h2>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px] transition-all ${
              filterType === 'ALL'
                ? 'bg-slate-200 text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Updates
          </button>
          <button
            onClick={() => setFilterType('OUT_ALERT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px] transition-all ${
              filterType === 'OUT_ALERT'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Scratches & Out
          </button>
          <button
            onClick={() => setFilterType('LINEUP_CONFIRMED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px] transition-all ${
              filterType === 'LINEUP_CONFIRMED'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Confirmed Lineups
          </button>
        </div>
      </div>

      {/* News Feed List */}
      <div className="space-y-3">
        {filteredNews.map((item) => (
          <div
            key={item.id}
            className={`bg-slate-900/90 border rounded-2xl p-4 sm:p-5 shadow-lg space-y-2.5 transition-all ${
              item.isTopValuePlay
                ? 'border-emerald-500/50 bg-emerald-950/10'
                : 'border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {getAlertIcon(item.type)}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm sm:text-base font-display">
                      {item.player}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {item.team}
                    </span>
                    <span className="text-slate-500 text-xs">·</span>
                    <span className="text-xs text-slate-400 font-mono">
                      {formatLastUpdated(item.timestamp)}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-100 mt-1">
                    {item.headline}
                  </h4>
                </div>
              </div>

              {item.isTopValuePlay && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider shrink-0">
                  Value Impact
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pl-8">
              {item.details}
            </p>

            <div className="pl-8 pt-1">
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-xs text-slate-300">
                <strong className="text-emerald-400 mr-1">DFS Ripple Effect:</strong>
                {item.impactNote}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
