import React from 'react';
import { SlateStack, Sport, Site } from '../types';
import { Layers, Flame, Trophy, Lock, Users, DollarSign, Activity } from 'lucide-react';

interface StacksTabProps {
  stacks: SlateStack[];
  sport: Sport;
  site: Site;
  lockedPlayerIds: string[];
  onLockMultiplePlayers: (playerNames: string[]) => void;
}

export const StacksTab: React.FC<StacksTabProps> = ({
  stacks,
  sport,
  site,
  lockedPlayerIds,
  onLockMultiplePlayers,
}) => {
  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1.5">
          <Layers className="w-5 h-5 text-sky-400" />
          <h2 className="text-xl font-black text-white font-display tracking-tight">
            Tournament Stacks & Correlation Combos
          </h2>
        </div>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Tournament winning lineups correlate heavily. Stacking high-scoring games and correlated teammates multiplies your upside when that specific game breaks the slate wide open.
        </p>
      </div>

      {/* Stacks Grid */}
      <div className="space-y-4">
        {stacks.map((stack, index) => {
          return (
            <div
              key={stack.id}
              className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4 hover:border-slate-700/80 transition-all"
            >
              {/* Stack Header: Title, Upside Score, Lock Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-950/80 border border-sky-500/40 text-sky-400 font-extrabold flex items-center justify-center font-display text-sm shrink-0">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-black text-white font-display">
                        {stack.title}
                      </h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {stack.teams}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                      {stack.gameTotal && (
                        <span>
                          Total: <strong className="text-slate-200">{stack.gameTotal}</strong>
                        </span>
                      )}
                      {stack.spread && (
                        <span>
                          Spread: <strong className="text-slate-200">{stack.spread}</strong>
                        </span>
                      )}
                      {stack.projectedPace && (
                        <span>
                          Pace: <strong className="text-emerald-400">{stack.projectedPace}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Upside Rating & Lock Stack Button */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right font-mono">
                    <span className="text-[10px] text-slate-400 uppercase block">Upside</span>
                    <span className="text-lg font-black text-emerald-400 tabular-nums">
                      {stack.upsideScore}/100
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      onLockMultiplePlayers(stack.players.map((p) => p.name))
                    }
                    className="min-h-[44px] px-4 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-sky-600/20"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Lock Stack in Builder</span>
                  </button>
                </div>
              </div>

              {/* Player Correlation Lineup Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {stack.players.map((p, pIdx) => (
                  <div
                    key={pIdx}
                    className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs">{p.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          ({p.position} · {p.team})
                        </span>
                      </div>
                      <span className="text-[11px] text-sky-400 font-medium block mt-0.5">
                        {p.role}
                      </span>
                    </div>

                    <div className="text-right font-mono text-xs tabular-nums">
                      <span className="text-slate-200 font-bold block">
                        ${p.salary.toLocaleString()}
                      </span>
                      <span className="text-emerald-400 font-semibold text-[11px]">
                        {p.projectedPoints.toFixed(1)} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stack Summary Footnote */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
                <div className="flex items-center gap-4 text-slate-400 font-mono">
                  <span>
                    Combined Cap: <strong className="text-slate-200">${stack.combinedSalary.toLocaleString()}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Combined Own: <strong className="text-amber-400">{stack.combinedOwnership.toFixed(1)}%</strong>
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Site: {site.toUpperCase()}
                </div>
              </div>

              {/* Tactical Analysis Prose */}
              <div className="bg-slate-950/40 border border-slate-800/40 rounded-xl p-3 text-xs text-slate-300 leading-relaxed">
                <span className="text-sky-400 font-semibold mr-1">Tournament Analysis:</span>
                {stack.analysis}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
