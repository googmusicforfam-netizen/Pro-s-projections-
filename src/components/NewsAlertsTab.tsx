import React, { useState } from 'react';
import { NewsItem, RemovalLogItem, Sport } from '../types';
import { formatLastUpdated } from '../utils/timeFormat';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  Zap,
  FileText,
  TrendingUp,
} from 'lucide-react';

interface NewsAlertsTabProps {
  news: NewsItem[];
  removalLog?: RemovalLogItem[];
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
  removalLog = [],
  highPriorityAlert,
  sport,
}) => {
  const [activeSection, setActiveSection] = useState<'all' | 'removals' | 'news'>('all');
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
    <div className="space-y-6">
      {/* High Priority Ruled Out / IR Banner Alert */}
      {highPriorityAlert && !dismissedAlert && (
        <div className="bg-gradient-to-r from-rose-950/95 via-slate-900 to-rose-950/95 border-2 border-rose-500 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden animate-pulse">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-slate-950 font-black flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/40 text-xs">
                ALERT
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-500/40 font-mono">
                    Pool Removal & Starting Promotion
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {highPriorityAlert.team}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-white mt-1 font-display">
                  {highPriorityAlert.headline}
                </h3>

                <div className="mt-2 text-xs sm:text-sm text-rose-200 bg-rose-950/70 p-3 rounded-xl border border-rose-500/40">
                  <strong className="text-emerald-400 block mb-0.5">
                    Official Roster Promotion & Ripple Effect:
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

      {/* Navigation Filter Buttons */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white font-display">
            Injury Reports, Removals & Lineup Wire
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveSection('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
              activeSection === 'all'
                ? 'bg-slate-200 text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Updates
          </button>
          <button
            onClick={() => setActiveSection('removals')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 min-h-[36px] ${
              activeSection === 'removals'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Removals Ledger ({removalLog.length})</span>
          </button>
          <button
            onClick={() => setActiveSection('news')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
              activeSection === 'news'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Wire Feed
          </button>
        </div>
      </div>

      {/* SECTION: OFFICIAL REMOVALS & INACTIVES LEDGER */}
      {(activeSection === 'all' || activeSection === 'removals') && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-rose-400 font-display">
              Official Pool Removals & Inactives Ledger
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              (Purged from Projections, Value & Lineup Builder)
            </span>
          </div>

          {removalLog.length > 0 ? (
            <div className="space-y-3">
              {removalLog.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900/90 border border-rose-500/40 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-500 text-slate-950 font-black flex items-center justify-center shrink-0 text-xs">
                        {item.reason === 'INJURED_RESERVE' ? 'IR' : 'OUT'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-white text-base font-display">
                            {item.player}
                          </span>
                          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {item.position} · {item.team}
                          </span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40 uppercase font-mono">
                            {item.reason.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">
                          Source: {item.officialSource}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-mono text-slate-500 shrink-0">
                      {formatLastUpdated(item.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    {item.details}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-xl">
                      <span className="text-[10px] text-emerald-400 uppercase font-bold block">
                        Promoted Replacement:
                      </span>
                      <p className="text-emerald-200 mt-0.5 font-semibold">
                        {item.promotedReplacement}
                      </p>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Teammate Usage Ripple:
                      </span>
                      <p className="text-slate-300 mt-0.5">
                        {item.teammateBoostNotes}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
              No players currently removed on this slate. All starters active and confirmed.
            </div>
          )}
        </div>
      )}

      {/* SECTION: LIVE WIRE UPDATES */}
      {(activeSection === 'all' || activeSection === 'news') && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-200 font-display">
              Confirmed Lineups & Beat Updates
            </h3>
          </div>

          <div className="space-y-3">
            {filteredNews.map((item) => (
              <div
                key={item.id}
                className={`bg-slate-900/90 border rounded-2xl p-4 sm:p-5 shadow-lg space-y-2.5 transition-all ${
                  item.isTopValuePlay ? 'border-emerald-500/50 bg-emerald-950/10' : 'border-slate-800'
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
      )}
    </div>
  );
};
