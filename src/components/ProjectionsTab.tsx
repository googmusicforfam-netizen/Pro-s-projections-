import React, { useState, useMemo } from 'react';
import { PlayerProjection, Sport, Site } from '../types';
import { formatGameTime } from '../utils/timeFormat';
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
} from 'lucide-react';

interface ProjectionsTabProps {
  players: PlayerProjection[];
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

  // Derive unique positions in this slate
  const positions = useMemo(() => {
    const set = new Set<string>();
    players.forEach((p) => {
      set.add(p.position);
      p.eligiblePositions?.forEach((ep) => set.add(ep));
    });
    return ['ALL', ...Array.from(set)];
  }, [players]);

  // Filtering and sorting
  const filteredAndSortedPlayers = useMemo(() => {
    return players
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
        if (statusFilter === 'ACTIVE_ONLY' && p.status === 'OUT') return false;
        if (statusFilter === 'HOT_ONLY' && !p.isHot) return false;
        if (statusFilter === 'SOFT_MATCHUP' && p.matchupRating !== 'soft') return false;

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
  }, [players, searchQuery, positionFilter, statusFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="text-[11px] font-semibold text-emerald-400">Confirmed</span>;
      case 'PROBABLE':
        return <span className="text-[11px] font-semibold text-teal-400">Probable</span>;
      case 'QUESTIONABLE':
        return <span className="text-[11px] font-semibold text-amber-400">Questionable</span>;
      case 'GTD':
        return <span className="text-[11px] font-semibold text-orange-400">GTD</span>;
      case 'OUT':
        return <span className="text-[11px] font-semibold text-rose-500">OUT</span>;
      default:
        return <span className="text-[11px] font-semibold text-slate-400">Active</span>;
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
              placeholder={`Search ${sport.toUpperCase()} player, team, or opponent...`}
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

          {/* Quick Filter Toggles */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() =>
                setStatusFilter((prev) => (prev === 'ACTIVE_ONLY' ? 'ALL' : 'ACTIVE_ONLY'))
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap min-h-[38px] flex items-center ${
                statusFilter === 'ACTIVE_ONLY'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              Hide Ruled Out
            </button>
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
              Hot Streak Only
            </button>
            <button
              onClick={() =>
                setStatusFilter((prev) => (prev === 'SOFT_MATCHUP' ? 'ALL' : 'SOFT_MATCHUP'))
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap min-h-[38px] flex items-center ${
                statusFilter === 'SOFT_MATCHUP'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              Soft Matchup
            </button>
          </div>
        </div>

        {/* Position Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-800/60">
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
          <span className="text-slate-400 text-xs ml-auto whitespace-nowrap">
            Showing {filteredAndSortedPlayers.length} of {players.length}
          </span>
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
                    <span>Player & Matchup</span>
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
                    <span>Matchup Strength</span>
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
                <th className="py-3 px-3.5 font-semibold text-slate-300">Why / Angle</th>
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
                      player.status === 'OUT' ? 'opacity-40 bg-rose-950/10' : ''
                    } ${player.hasChangedRecently ? 'bg-emerald-950/20' : ''}`}
                  >
                    {/* Lock / Exclude Controls */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onToggleLock(player.id)}
                          disabled={player.status === 'OUT'}
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

                    {/* Player Name, Position, Team, Status */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="font-bold text-white text-sm hover:text-emerald-400 cursor-pointer transition-colors" onClick={() => setSelectedPlayerForDetail(player)}>
                          {player.name}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {player.position}
                        </span>
                        <span className="text-slate-500 text-[11px]">·</span>
                        <span className="font-semibold text-slate-300 text-xs">
                          {player.team} {player.isHome ? 'vs' : '@'} {player.opponent}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        {getStatusBadge(player.status)}
                        <span>·</span>
                        <span>{formatGameTime(player.gameTime)}</span>
                        {player.hasChangedRecently && (
                          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-500/30">
                            NEW
                          </span>
                        )}
                      </div>
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

                    {/* Hot Streak Tracking: L3 vs Season */}
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

                    {/* Why / Tournament Angle Note */}
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
                player.status === 'OUT' ? 'opacity-40 bg-rose-950/10' : ''
              } ${isLocked ? 'border-emerald-500/60 ring-1 ring-emerald-500/40' : ''}`}
            >
              {/* Card Header: Name, Position, Lock & Exclude Buttons */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base font-display">
                      {player.name}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {player.position}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span className="font-semibold text-slate-200">
                      {player.team} {player.isHome ? 'vs' : '@'} {player.opponent}
                    </span>
                    <span>·</span>
                    {getStatusBadge(player.status)}
                    <span>·</span>
                    <span>{formatGameTime(player.gameTime)}</span>
                  </div>
                </div>

                {/* Touch Hitbox Buttons (min 44px) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onToggleLock(player.id)}
                    disabled={player.status === 'OUT'}
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

              {/* Key Metrics Strip (Salary, Proj Pts, Ceiling/Floor, Value Score) */}
              <div className="grid grid-cols-4 gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Salary</span>
                  <span className="font-bold text-white text-xs tabular-nums">
                    ${player.salary.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Proj</span>
                  <span className="font-bold text-emerald-400 text-sm tabular-nums">
                    {player.projectedPoints.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Ceil / Flr</span>
                  <span className="text-[11px] text-slate-300 tabular-nums">
                    {player.ceiling.toFixed(0)}/{player.floor.toFixed(0)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Value</span>
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

              {/* Tournament Angle Why Note */}
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40">
                <span className="text-emerald-400 font-semibold mr-1">Angle:</span>
                {player.whyNote}
              </p>
            </div>
          );
        })}
      </div>

      {/* Player Detail Modal */}
      {selectedPlayerForDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
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

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Matchup Breakdown:</span>
                <p className="font-semibold text-slate-200">{selectedPlayerForDetail.matchupDetail}</p>
                <div className="mt-2">{getMatchupBadge(selectedPlayerForDetail.matchupRating, selectedPlayerForDetail.opponentRank)}</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Streak Context:</span>
                <p className="font-mono text-slate-200">
                  Last 3 Games: {selectedPlayerForDetail.last3Avg.toFixed(1)} FP
                </p>
                <p className="font-mono text-slate-400">
                  Season Avg: {selectedPlayerForDetail.seasonAvg.toFixed(1)} FP
                </p>
              </div>
            </div>

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
