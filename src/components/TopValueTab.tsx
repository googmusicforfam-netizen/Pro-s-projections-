import React from 'react';
import { PlayerProjection, Sport, Site } from '../types';
import { formatVerifiedTime } from '../utils/availabilityEngine';
import { Flame, Snowflake, Lock, Ban, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';

interface TopValueTabProps {
  players: PlayerProjection[];
  sport: Sport;
  site: Site;
  lockedPlayerIds: string[];
  excludedPlayerIds: string[];
  onToggleLock: (id: string) => void;
  onToggleExclude: (id: string) => void;
}

export const TopValueTab: React.FC<TopValueTabProps> = ({
  players,
  sport,
  site,
  lockedPlayerIds,
  excludedPlayerIds,
  onToggleLock,
  onToggleExclude,
}) => {
  // CRITICAL REQUIREMENT:
  // "Any player who is on injured reserve, ruled out, inactive, suspended, on the injured list,
  // or a confirmed scratch must be removed from the top 20 value list."
  // Top 20 Value plays sorted by value score (pts per $1k) descending
  const top20ValuePlays = React.useMemo(() => {
    return players
      .filter((p) => {
        if (p.isStarted) return false;
        if (p.projectedPoints <= 0) return false;
        if (
          p.status === 'OUT' ||
          p.status === 'IR' ||
          p.status === 'INACTIVE' ||
          p.status === 'SCRATCH' ||
          p.status === 'SUSPENDED'
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.valueScore - a.valueScore)
      .slice(0, 20);
  }, [players]);

  const getStatusBadge = (player: PlayerProjection) => {
    if (player.verification.hasConflict) {
      return (
        <span
          className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-600 text-white uppercase flex items-center gap-1 shadow-sm"
          title={player.verification.conflictNote}
        >
          <AlertTriangle className="w-3 h-3 text-white" />
          Conflict
        </span>
      );
    }

    switch (player.status) {
      case 'CONFIRMED':
        return <span className="text-xs font-bold text-emerald-400">Confirmed</span>;
      case 'PROBABLE':
        return <span className="text-xs font-bold text-teal-400">Probable</span>;
      case 'QUESTIONABLE':
        return (
          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-400 text-slate-950 uppercase shadow-sm">
            Questionable
          </span>
        );
      default:
        return <span className="text-xs font-bold text-slate-400">Active</span>;
    }
  };

  const getMatchupBadge = (rating: 'soft' | 'average' | 'tough', rank: number) => {
    if (rating === 'soft') {
      return (
        <span className="text-xs font-bold text-emerald-400 tabular-nums">
          #{rank} · Soft
        </span>
      );
    }
    if (rating === 'average') {
      return (
        <span className="text-xs font-semibold text-amber-400 tabular-nums">
          #{rank} · Avg
        </span>
      );
    }
    return (
      <span className="text-xs font-bold text-rose-400 tabular-nums">
        #{rank} · Tough
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Editorial Header Strip */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg sm:text-xl font-black text-white font-display tracking-tight">
              Top 20 Value Plays
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
              {site === 'draftkings' ? 'DraftKings' : 'FanDuel'} {sport.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ranked by points per $1,000 salary. Purged of all IR, OUT, and inactive players through 3-source verification.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 font-mono shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Multi-Source Verified</span>
        </div>
      </div>

      {/* Clean, Large-Text List */}
      <div className="space-y-2.5">
        {top20ValuePlays.map((player, index) => {
          const rank = index + 1;
          const isLocked = lockedPlayerIds.includes(player.id);
          const isExcluded = excludedPlayerIds.includes(player.id);

          return (
            <div
              key={player.id}
              className={`bg-slate-900/90 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-4 sm:p-4.5 transition-all shadow-md ${
                player.verification.hasConflict ? 'border-rose-500/50 bg-rose-950/15' : ''
              } ${isLocked ? 'border-emerald-500/80 bg-emerald-950/20 ring-1 ring-emerald-500/40' : ''}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Left Area: Rank, Player Name, Position, Team, Status */}
                <div className="flex items-center gap-3.5">
                  {/* Large Rank Badge */}
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-display font-extrabold text-base sm:text-lg tabular-nums shrink-0 ${
                      rank <= 3
                        ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                        : rank <= 10
                        ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    #{rank}
                  </div>

                  {/* Player & Context */}
                  <div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-black text-white font-display tracking-tight">
                        {player.name}
                      </h3>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                        {player.position}
                      </span>
                      <span className="text-slate-300 font-semibold text-xs sm:text-sm">
                        {player.team} {player.isHome ? 'vs' : '@'} {player.opponent}
                      </span>
                      {player.isPromotedBackup && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          PROMOTED STARTER
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 flex-wrap">
                      {getStatusBadge(player)}
                      <span>·</span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {formatVerifiedTime(player.verification.lastVerifiedTime)}
                      </span>
                      <span>·</span>
                      <span className="text-slate-300">{player.whyNote}</span>
                    </div>

                    {/* Injury Boost Note */}
                    {player.injuryBoostNote && (
                      <div className="text-xs text-emerald-300 font-semibold bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded mt-1.5 inline-block">
                        {player.injuryBoostNote}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Area: Key Metrics + Matchup + Hot Streak + Lock Action */}
                <div className="flex items-center justify-between lg:justify-end gap-3 sm:gap-6 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
                  {/* Big Value Score */}
                  <div className="text-center font-mono">
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">Value</span>
                    <span className="text-base sm:text-xl font-extrabold text-emerald-400 tabular-nums">
                      {player.valueScore.toFixed(2)}x
                    </span>
                  </div>

                  {/* Salary */}
                  <div className="text-center font-mono">
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">Salary</span>
                    <span className="text-sm sm:text-base font-bold text-slate-100 tabular-nums">
                      ${player.salary.toLocaleString()}
                    </span>
                  </div>

                  {/* Projected Points */}
                  <div className="text-center font-mono">
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">Proj Pts</span>
                    <span className="text-sm sm:text-base font-bold text-white tabular-nums">
                      {player.projectedPoints.toFixed(1)}
                    </span>
                  </div>

                  {/* Ownership % */}
                  <div className="text-center font-mono hidden sm:block">
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">Own %</span>
                    <span className="text-sm font-semibold text-slate-300 tabular-nums">
                      {player.projectedOwnership.toFixed(1)}%
                    </span>
                  </div>

                  {/* Matchup Rating & Opponent Rank */}
                  <div className="text-center hidden md:block">
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">Matchup</span>
                    <div>{getMatchupBadge(player.matchupRating, player.opponentRank)}</div>
                  </div>

                  {/* Hot Streak Tracking */}
                  <div className="text-center font-mono hidden sm:block">
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">L3 / Season</span>
                    <div className="flex items-center justify-center gap-1 text-xs tabular-nums">
                      {player.isHot && <Flame className="w-3.5 h-3.5 text-amber-400" />}
                      {player.isCold && <Snowflake className="w-3.5 h-3.5 text-cyan-400" />}
                      <span className={player.isHot ? 'text-amber-300 font-bold' : 'text-slate-200'}>
                        {player.last3Avg.toFixed(1)}
                      </span>
                      <span className="text-slate-500">/</span>
                      <span className="text-slate-400">{player.seasonAvg.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Lock / Add Action Button */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onToggleLock(player.id)}
                      className={`min-h-[44px] px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isLocked
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white'
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                      <span>{isLocked ? 'Locked' : 'Lock'}</span>
                    </button>
                    <button
                      onClick={() => onToggleExclude(player.id)}
                      className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-xs transition-all ${
                        isExcluded
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-400'
                      }`}
                      title="Exclude from lineups"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
