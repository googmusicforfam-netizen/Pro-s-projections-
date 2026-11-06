import React, { useState, useMemo } from 'react';
import { PlayerProjection, Sport, Site } from '../types';
import { formatGameTime } from '../utils/timeFormat';
import { formatVerifiedTime } from '../utils/availabilityEngine';
import {
  Flame,
  Snowflake,
  Lock,
  Ban,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
  Check,
  AlertTriangle,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

interface ProjectionsTabProps {
  players: PlayerProjection[];
  doubtfulPlayers?: PlayerProjection[];
  sport: Sport;
  site: Site;
  lockedPlayerIds: string[];
  excludedPlayerIds: string[];
  onToggleLock: (id: string) => void;
  onToggleExclude: (id: string) => void;
}

type SortField =
  | 'salary'
  | 'projectedPoints'
  | 'ceiling'
  | 'floor'
  | 'valueScore'
  | 'projectedOwnership'
  | 'opponentRank'
  | 'last3Avg'
  | 'name';

export const ProjectionsTab: React.FC<ProjectionsTabProps> = ({
  players,
  doubtfulPlayers = [],
  sport,
  site,
  lockedPlayerIds,
  excludedPlayerIds,
  onToggleLock,
  onToggleExclude,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState<SortField>('projectedPoints');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedPlayerForDetail, setSelectedPlayerForDetail] = useState<PlayerProjection | null>(null);
  const [showDoubtful, setShowDoubtful] = useState<boolean>(false);

  // Combine active players with doubtful players if toggled on
  const combinedPool = useMemo(() => {
    if (showDoubtful && doubtfulPlayers.length > 0) {
      return [...players, ...doubtfulPlayers];
    }
    return players;
  }, [players, doubtfulPlayers, showDoubtful]);

  // Derive unique positions in this slate
  const positions = useMemo(() => {
    const set = new Set<string>();
    combinedPool.forEach((p) => {
      set.add(p.position);
      p.eligiblePositions?.forEach((ep) => set.add(ep));
    });
    return ['ALL', ...Array.from(set)];
  }, [combinedPool]);

  // Filtering and sorting
  const filteredAndSortedPlayers = useMemo(() => {
    return combinedPool
      .filter((p) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            p.name.toLowerCase().includes(q) ||
            p.team.toLowerCase().includes(q) ||
            p.opponent.toLowerCase().includes(q) ||
            p.position.toLowerCase().includes(q);
          if (!match) return false;
        }

        // Position filter
        if (positionFilter !== 'ALL') {
          const matchPos =
            p.position === positionFilter ||
            p.eligiblePositions?.includes(positionFilter);
          if (!matchPos) return false;
        }

        // Status filter
        if (statusFilter === 'HOT_ONLY' && !p.isHot) return false;
        if (statusFilter === 'SOFT_MATCHUP' && p.matchupRating !== 'soft') return false;
        if (statusFilter === 'CONFLICT_ONLY' && !p.verification.hasConflict) return false;

        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (typeof valA === 'string') {
          return sortDirection === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        return sortDirection === 'asc' ? valA - valB : valB - valA;
      });
  }, [combinedPool, searchQuery, positionFilter, statusFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getStatusBadge = (player: PlayerProjection) => {
    if (player.verification.hasConflict) {
      return (
        <span
          className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-600 text-white uppercase flex items-center gap-1 shadow-sm"
          title={player.verification.conflictNote}
        >
          <AlertTriangle className="w-3 h-3 text-white" />
          Source Conflict
        </span>
      );
    }

    switch (player.status) {
      case 'CONFIRMED':
        return <span className="text-[11px] font-bold text-emerald-400">Confirmed</span>;
      case 'PROBABLE':
        return <span className="text-[11px] font-bold text-teal-400">Probable</span>;
      case 'QUESTIONABLE':
        return (
          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-400 text-slate-950 uppercase shadow-sm">
            Questionable
          </span>
        );
      case 'DOUBTFUL':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase">
            Doubtful
          </span>
        );
      case 'GTD':
        return <span className="text-[11px] font-bold text-orange-400">GTD</span>;
      default:
        return <span className="text-[11px] font-bold text-slate-400">Active</span>;
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
      {/* Controls & Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search verified ${sport.toUpperCase()} player, team, or opponent...`}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors min-h-[42px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filter Toggles & Doubtful Player Toggle */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {/* Doubtful toggle (Prompt: Doubtful players hidden by default with a toggle to show them) */}
            {doubtfulPlayers.length > 0 && (
              <button
                onClick={() => setShowDoubtful(!showDoubtful)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap min-h-[38px] flex items-center gap-1.5 ${
                  showDoubtful
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {showDoubtful ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>
                  {showDoubtful ? 'Hide Doubtful' : `Show Doubtful (${doubtfulPlayers.length})`}
                </span>
              </button>
            )}

            <button
              onClick={() =>
                setStatusFilter((prev) => (prev === 'HOT_ONLY' ? 'ALL' : 'HOT_ONLY'))
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap min-h-[38px] flex items-center gap-1 ${
                statusFilter === 'HOT_ONLY'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Hot Streak
            </button>

            <button
              onClick={() =>
                setStatusFilter((prev) => (prev === 'CONFLICT_ONLY' ? 'ALL' : 'CONFLICT_ONLY'))
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap min-h-[38px] flex items-center gap-1 ${
                statusFilter === 'CONFLICT_ONLY'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Source Conflicts
            </button>
          </div>
        </div>

        {/* Position Filter Pills & Verification Info */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] text-slate-400 font-medium uppercase mr-1">Position:</span>
            {positions.map((pos) => (
              <button
                key={pos}
                onClick={() => setPositionFilter(pos)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap min-h-[32px] ${
                  positionFilter === pos
                    ? 'bg-slate-200 text-slate-950 shadow-sm'
                    : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Multi-Source Verified</span>
            <span className="text-slate-600">·</span>
            <span>{filteredAndSortedPlayers.length} Active</span>
          </div>
        </div>
      </div>

      {/* Projections Table - Desktop & Tablet */}
      <div className="hidden md:block bg-slate-900/90 border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 select-none">
              <tr>
                <th className="py-3 px-3.5 font-semibold text-slate-300">Lock</th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-3.5 font-semibold text-slate-300 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Player & Verification</span>
                    {sortField === 'name' && (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('salary')}
                  className="py-3 px-3.5 font-semibold text-slate-300 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Salary</span>
                    {sortField === 'salary' && (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('projectedPoints')}
                  className="py-3 px-3.5 font-semibold text-slate-300 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Proj Pts</span>
                    {sortField === 'projectedPoints' && (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('ceiling')}
                  className="py-3 px-3.5 font-semibold text-slate-300 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Ceil / Flr</span>
                    {sortField === 'ceiling' && (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('valueScore')}
                  className="py-3 px-3.5 font-semibold text-slate-300 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Value (x)</span>
                    {sortField === 'valueScore' && (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('projectedOwnership')}
                  className="py-3 px-3.5 font-semibold text-slate-300 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Own %</span>
                    {sortField === 'projectedOwnership' && (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('opponentRank')}
                  className="py-3 px-3.5 font-semibold text-slate-300 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Matchup</span>
                    {sortField === 'opponentRank' && (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('last3Avg')}
                  className="py-3 px-3.5 font-semibold text-slate-300 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>L3 vs Season</span>
                    {sortField === 'last3Avg' && (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-3.5 font-semibold text-slate-300">Injury Boosts / Angle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredAndSortedPlayers.map((player) => {
                const isLocked = lockedPlayerIds.includes(player.id);
                const isExcluded = excludedPlayerIds.includes(player.id);

                return (
                  <tr
                    key={player.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      player.verification.hasConflict ? 'bg-rose-950/15' : ''
                    } ${player.isPromotedBackup ? 'bg-emerald-950/20' : ''}`}
                  >
                    {/* Lock / Exclude Controls */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onToggleLock(player.id)}
                          className={`p-1.5 rounded-md transition-all ${
                            isLocked
                              ? 'bg-emerald-500 text-slate-950 font-bold'
                              : 'text-slate-500 hover:text-emerald-400 hover:bg-slate-800'
                          }`}
                          title={isLocked ? 'Locked in lineup' : 'Lock player in builder'}
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onToggleExclude(player.id)}
                          className={`p-1.5 rounded-md transition-all ${
                            isExcluded
                              ? 'bg-rose-500 text-white font-bold'
                              : 'text-slate-500 hover:text-rose-400 hover:bg-slate-800'
                          }`}
                          title={isExcluded ? 'Excluded from lineups' : 'Exclude player from builder'}
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Player Name, Position, Verification & Last Verified */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span
                          className="font-bold text-white text-sm hover:text-emerald-400 cursor-pointer transition-colors"
                          onClick={() => setSelectedPlayerForDetail(player)}
                        >
                          {player.name}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {player.position}
                        </span>
                        <span className="text-slate-500 text-[11px]">·</span>
                        <span className="font-semibold text-slate-300 text-xs">
                          {player.team} {player.isHome ? 'vs' : '@'} {player.opponent}
                        </span>
                        {player.isPromotedBackup && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            PROMOTED STARTER
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 flex-wrap">
                        {getStatusBadge(player)}
                        <span>·</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {formatVerifiedTime(player.verification.lastVerifiedTime)}
                        </span>
                        <span>·</span>
                        <span>{formatGameTime(player.gameTime)}</span>
                      </div>

                      {/* Explicit Teammate Injury Boost Note */}
                      {player.injuryBoostNote && (
                        <div className="text-[11px] text-emerald-300 font-semibold bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded mt-1.5 max-w-sm">
                          {player.injuryBoostNote}
                        </div>
                      )}

                      {/* Conflict details alert if present */}
                      {player.verification.hasConflict && player.verification.conflictNote && (
                        <div className="text-[11px] text-rose-300 font-semibold bg-rose-950/60 border border-rose-500/40 px-2 py-0.5 rounded mt-1 max-w-sm">
                          ⚠️ {player.verification.conflictNote}
                        </div>
                      )}
                    </td>

                    {/* Salary */}
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-100 tabular-nums">
                      ${player.salary.toLocaleString()}
                    </td>

                    {/* Projected Points */}
                    <td className="py-3 px-3.5 text-right font-mono font-extrabold text-white text-sm tabular-nums">
                      {player.projectedPoints.toFixed(1)}
                    </td>

                    {/* Ceiling / Floor */}
                    <td className="py-3 px-3.5 text-right font-mono tabular-nums">
                      <span className="text-emerald-400 font-semibold">{player.ceiling.toFixed(1)}</span>
                      <span className="text-slate-600 mx-1">/</span>
                      <span className="text-slate-400">{player.floor.toFixed(1)}</span>
                    </td>

                    {/* Value Score */}
                    <td className="py-3 px-3.5 text-right font-mono font-bold tabular-nums">
                      <span
                        className={
                          player.valueScore >= 5.5
                            ? 'text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded'
                            : player.valueScore >= 4.5
                            ? 'text-sky-300'
                            : 'text-slate-400'
                        }
                      >
                        {player.valueScore.toFixed(2)}x
                      </span>
                    </td>

                    {/* Ownership % */}
                    <td className="py-3 px-3.5 text-right font-mono tabular-nums">
                      <span
                        className={
                          player.projectedOwnership >= 25
                            ? 'text-amber-400 font-bold'
                            : player.projectedOwnership <= 10
                            ? 'text-emerald-400 font-medium'
                            : 'text-slate-300'
                        }
                      >
                        {player.projectedOwnership.toFixed(1)}%
                      </span>
                    </td>

                    {/* Matchup Strength */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {getMatchupBadge(player.matchupRating, player.opponentRank)}
                    </td>

                    {/* Hot Streak Tracking */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono text-xs tabular-nums">
                        {player.isHot && (
                          <span title="Hot streak: L3 > season avg">
                            <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          </span>
                        )}
                        {player.isCold && (
                          <span title="Cold streak: L3 < season avg">
                            <Snowflake className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          </span>
                        )}
                        <span className={player.isHot ? 'text-amber-300 font-semibold' : 'text-slate-200'}>
                          {player.last3Avg.toFixed(1)}
                        </span>
                        <span className="text-slate-500">/</span>
                        <span className="text-slate-400">{player.seasonAvg.toFixed(1)}</span>
                      </div>
                    </td>

                    {/* Why / Tournament Angle */}
                    <td className="py-3 px-3.5 max-w-xs text-[11px] text-slate-300 leading-snug">
                      <p className="line-clamp-2">{player.whyNote}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Projections Mobile Touch Cards View */}
      <div className="md:hidden space-y-3">
        {filteredAndSortedPlayers.map((player) => {
          const isLocked = lockedPlayerIds.includes(player.id);
          const isExcluded = excludedPlayerIds.includes(player.id);

          return (
            <div
              key={player.id}
              className={`bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3 transition-all ${
                player.verification.hasConflict ? 'border-rose-500/60 bg-rose-950/15' : ''
              } ${isLocked ? 'border-emerald-500/60 ring-1 ring-emerald-500/40' : ''}`}
            >
              {/* Card Header: Name, Position, Lock & Exclude Buttons */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-white text-base font-display">
                      {player.name}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {player.position}
                    </span>
                    {player.isPromotedBackup && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        PROMOTED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                    <span className="font-semibold text-slate-200">
                      {player.team} {player.isHome ? 'vs' : '@'} {player.opponent}
                    </span>
                    <span>·</span>
                    {getStatusBadge(player)}
                    <span>·</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {formatVerifiedTime(player.verification.lastVerifiedTime)}
                    </span>
                  </div>
                </div>

                {/* Touch Hitbox Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onToggleLock(player.id)}
                    className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-all ${
                      isLocked
                        ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-emerald-400'
                    }`}
                    title="Lock in lineup"
                  >
                    <Lock className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onToggleExclude(player.id)}
                    className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-all ${
                      isExcluded
                        ? 'bg-rose-500 text-white shadow-md font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-rose-400'
                    }`}
                    title="Exclude from lineups"
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Injury Boost Alert if present */}
              {player.injuryBoostNote && (
                <div className="text-xs text-emerald-300 font-semibold bg-emerald-950/70 border border-emerald-500/40 p-2 rounded-xl">
                  {player.injuryBoostNote}
                </div>
              )}

              {/* Key Metrics Strip */}
              <div className="grid grid-cols-4 gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-sans">Salary</span>
                  <span className="font-bold text-white text-xs tabular-nums">
                    ${player.salary.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-sans">Proj</span>
                  <span className="font-bold text-emerald-400 text-sm tabular-nums">
                    {player.projectedPoints.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-sans">Ceil / Flr</span>
                  <span className="text-[11px] text-slate-300 tabular-nums">
                    {player.ceiling.toFixed(0)}/{player.floor.toFixed(0)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-sans">Value</span>
                  <span
                    className={`text-xs font-bold tabular-nums ${
                      player.valueScore >= 5.5
                        ? 'text-emerald-400'
                        : player.valueScore >= 4.5
                        ? 'text-sky-300'
                        : 'text-slate-400'
                    }`}
                  >
                    {player.valueScore.toFixed(2)}x
                  </span>
                </div>
              </div>

              {/* Matchup & Hot Streak Row */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">Matchup:</span>
                  {getMatchupBadge(player.matchupRating, player.opponentRank)}
                </div>

                <div className="flex items-center gap-1.5 font-mono text-xs tabular-nums">
                  <span className="text-slate-400 text-[11px]">L3 / Season:</span>
                  {player.isHot && <Flame className="w-3.5 h-3.5 text-amber-400" />}
                  {player.isCold && <Snowflake className="w-3.5 h-3.5 text-cyan-400" />}
                  <span className={player.isHot ? 'text-amber-300 font-bold' : 'text-slate-200'}>
                    {player.last3Avg.toFixed(1)}
                  </span>
                  <span className="text-slate-500">/</span>
                  <span className="text-slate-400">{player.seasonAvg.toFixed(1)}</span>
                </div>
              </div>

              {/* Tournament Angle */}
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40">
                <span className="text-emerald-400 font-semibold mr-1">Angle:</span>
                {player.whyNote}
              </p>
            </div>
          );
        })}
      </div>

      {/* Player Verification Audit Modal */}
      {selectedPlayerForDetail && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white font-display">
                  {selectedPlayerForDetail.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {selectedPlayerForDetail.position} · {selectedPlayerForDetail.team}{' '}
                  {selectedPlayerForDetail.isHome ? 'vs' : '@'} {selectedPlayerForDetail.opponent}
                </p>
              </div>
              <button
                onClick={() => setSelectedPlayerForDetail(null)}
                className="text-slate-400 hover:text-white p-1 text-base font-bold"
              >
                ✕
              </button>
            </div>

            {/* 3-Source Availability Audit Trail */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-display">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Multi-Source Availability Audit
                </span>
                <span className="text-[11px] font-mono text-emerald-400">
                  {formatVerifiedTime(selectedPlayerForDetail.verification.lastVerifiedTime)}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">1. Official Team Report</span>
                  <p className="text-slate-200 mt-0.5">{selectedPlayerForDetail.verification.officialTeamReport}</p>
                </div>

                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">2. League Transaction Wire</span>
                  <p className="text-slate-200 mt-0.5">{selectedPlayerForDetail.verification.leagueTransactionWire}</p>
                </div>

                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">3. Beat Reporter / Major News Feed</span>
                  <p className="text-slate-200 mt-0.5">{selectedPlayerForDetail.verification.beatReporterReport}</p>
                </div>
              </div>

              {selectedPlayerForDetail.verification.hasConflict && (
                <div className="bg-rose-950/80 border border-rose-500/50 p-2.5 rounded-xl text-xs text-rose-200">
                  <strong className="text-rose-400 block mb-1">⚠️ Source Disagreement Warning:</strong>
                  {selectedPlayerForDetail.verification.conflictNote}
                </div>
              )}
            </div>

            {/* Injury Boost Note if applicable */}
            {selectedPlayerForDetail.injuryBoostNote && (
              <div className="bg-emerald-950/60 border border-emerald-500/40 p-3 rounded-xl text-xs text-emerald-300">
                <strong className="block mb-0.5 font-bold">Injury Ripple Boost:</strong>
                {selectedPlayerForDetail.injuryBoostNote}
              </div>
            )}

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-emerald-400 block mb-1">Tournament Angle:</span>
              {selectedPlayerForDetail.whyNote}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  onToggleLock(selectedPlayerForDetail.id);
                  setSelectedPlayerForDetail(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
              >
                {lockedPlayerIds.includes(selectedPlayerForDetail.id) ? 'Unlock Player' : 'Lock in Lineup'}
              </button>
              <button
                onClick={() => setSelectedPlayerForDetail(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
