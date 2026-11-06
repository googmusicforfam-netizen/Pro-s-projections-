import React, { useState } from 'react';
import { PlayerProjection, Sport, Site } from '../types';
import { ShieldAlert, Sparkles, Target, Zap, Lock, Ban, Flame } from 'lucide-react';

interface OwnershipLeverageTabProps {
  players: PlayerProjection[];
  sport: Sport;
  site: Site;
  lockedPlayerIds: string[];
  excludedPlayerIds: string[];
  onToggleLock: (id: string) => void;
  onToggleExclude: (id: string) => void;
}

export const OwnershipLeverageTab: React.FC<OwnershipLeverageTabProps> = ({
  players,
  sport,
  site,
  lockedPlayerIds,
  excludedPlayerIds,
  onToggleLock,
  onToggleExclude,
}) => {
  const [filterView, setFilterView] = useState<'all' | 'leverage' | 'fade_chalk'>('all');

  const activePlayers = players.filter((p) => p.status !== 'OUT' && !p.isStarted);

  // Calculate leverage score: Ceiling divided by Projected Ownership (higher = better tournament leverage)
  const playersWithLeverage = activePlayers.map((p) => {
    const leverageRatio = Number((p.ceiling / Math.max(1, p.projectedOwnership)).toFixed(2));
    const isLeveragePlay = p.projectedOwnership <= 15 && p.ceiling >= (sport === 'nba' ? 48 : sport === 'nfl' ? 20 : 20);
    const isChalkToFade = p.projectedOwnership >= 24 && (p.matchupRating === 'tough' || p.isCold || p.ceiling < p.projectedPoints * 1.35);

    return {
      ...p,
      leverageRatio,
      isLeveragePlay,
      isChalkToFade,
    };
  });

  // Top Leverage Plays: High ceiling, low ownership
  const topLeveragePlays = [...playersWithLeverage]
    .filter((p) => p.isLeveragePlay || p.leverageRatio > 3.0)
    .sort((a, b) => b.leverageRatio - a.leverageRatio);

  // Chalk to Consider Fading: High ownership with risk factors
  const chalkToFade = [...playersWithLeverage]
    .filter((p) => p.isChalkToFade || (p.projectedOwnership >= 22 && p.matchupRating === 'tough'))
    .sort((a, b) => b.projectedOwnership - a.projectedOwnership);

  return (
    <div className="space-y-6">
      {/* Editorial Overview Card */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/20 to-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-black text-white font-display tracking-tight">
            Tournament Ownership & Leverage Matrix
          </h2>
        </div>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          In large-field GPP tournaments, winning requires capitalizing on <strong>high-ceiling leverage plays</strong> while being selective on high-ownership chalk. Roster players who can win the slate at sub-15% ownership.
        </p>

        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => setFilterView('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px] transition-all ${
              filterView === 'all'
                ? 'bg-slate-200 text-slate-950'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Insights
          </button>
          <button
            onClick={() => setFilterView('leverage')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px] transition-all flex items-center gap-1.5 ${
              filterView === 'leverage'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Top Leverage Plays ({topLeveragePlays.length})
          </button>
          <button
            onClick={() => setFilterView('fade_chalk')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px] transition-all flex items-center gap-1.5 ${
              filterView === 'fade_chalk'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            Chalk to Consider Fading ({chalkToFade.length})
          </button>
        </div>
      </div>

      {/* SECTION 1: TOP LEVERAGE TOURNAMENT PLAYS (High Ceiling, Low Ownership) */}
      {(filterView === 'all' || filterView === 'leverage') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h3 className="text-base font-bold text-white font-display">
                Top Leverage Plays (High Ceiling · Low Ownership)
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Target for 1st Place GPP upside
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {topLeveragePlays.map((player) => {
              const isLocked = lockedPlayerIds.includes(player.id);
              const isExcluded = excludedPlayerIds.includes(player.id);

              return (
                <div
                  key={player.id}
                  className={`bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 shadow-lg space-y-3 relative overflow-hidden ${
                    isLocked ? 'ring-1 ring-emerald-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-base font-display">
                          {player.name}
                        </span>
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                          {player.position}
                        </span>
                        <span className="text-xs font-semibold text-slate-300">
                          {player.team} {player.isHome ? 'vs' : '@'} {player.opponent}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        ${player.salary.toLocaleString()} · Proj: <strong className="text-white">{player.projectedPoints.toFixed(1)}</strong> pts
                      </p>
                    </div>

                    {/* Touch Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onToggleLock(player.id)}
                        className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-xs transition-all ${
                          isLocked
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-300 hover:text-emerald-400'
                        }`}
                        title="Lock into tournament lineups"
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Leverage Metrics Pill Strip */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-center font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-sans">Ownership</span>
                      <span className="font-bold text-emerald-400 tabular-nums">
                        {player.projectedOwnership.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-sans">Ceiling</span>
                      <span className="font-bold text-white text-sm tabular-nums">
                        {player.ceiling.toFixed(1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-sans">Leverage Ratio</span>
                      <span className="font-extrabold text-amber-400 tabular-nums">
                        {player.leverageRatio.toFixed(1)}x
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40 leading-relaxed">
                    <span className="text-emerald-400 font-semibold mr-1">Leverage Case:</span>
                    {player.whyNote}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: CHALK TO CONSIDER FADING (High Ownership with Downside Risks) */}
      {(filterView === 'all' || filterView === 'fade_chalk') && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <h3 className="text-base font-bold text-white font-display">
                Chalk to Consider Fading (High Ownership · Risk Profile)
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Pivoting here gains 25%+ field leverage
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {chalkToFade.map((player) => {
              const isLocked = lockedPlayerIds.includes(player.id);
              const isExcluded = excludedPlayerIds.includes(player.id);

              return (
                <div
                  key={player.id}
                  className={`bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 shadow-lg space-y-3 ${
                    isExcluded ? 'ring-1 ring-rose-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-base font-display">
                          {player.name}
                        </span>
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                          {player.position}
                        </span>
                        <span className="text-xs font-semibold text-slate-300">
                          {player.team} {player.isHome ? 'vs' : '@'} {player.opponent}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        ${player.salary.toLocaleString()} · Proj: <strong className="text-white">{player.projectedPoints.toFixed(1)}</strong> pts
                      </p>
                    </div>

                    {/* Touch Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onToggleExclude(player.id)}
                        className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-xs transition-all ${
                          isExcluded
                            ? 'bg-rose-500 text-white font-bold'
                            : 'bg-slate-800 text-slate-400 hover:text-rose-400'
                        }`}
                        title="Exclude from tournament lineups"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Chalk Metrics Strip */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-center font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-sans">Projected Own</span>
                      <span className="font-extrabold text-amber-400 text-sm tabular-nums">
                        {player.projectedOwnership.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-sans">Floor</span>
                      <span className="font-bold text-slate-300 tabular-nums">
                        {player.floor.toFixed(1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-sans">Matchup Rank</span>
                      <span className="font-bold text-rose-400 tabular-nums">
                        #{player.opponentRank} (Tough)
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40 leading-relaxed">
                    <span className="text-amber-400 font-semibold mr-1">Fade Rationale:</span>
                    Over 25% of the tournament field will roster this player. With a difficult individual matchup against opponent rank #{player.opponentRank}, failing to reach ceiling provides massive leverage to those who pivot.
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
