import React, { useState } from 'react';
import { PlayerProjection, GeneratedLineup, Site, Sport } from '../types';
import {
  generateTourneyLineups,
  exportLineupsToCsv,
  downloadCsvFile,
} from '../utils/lineupOptimizer';
import {
  Wand2,
  Download,
  Lock,
  Ban,
  Trash2,
  Sliders,
  DollarSign,
  Trophy,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Layers,
} from 'lucide-react';

interface LineupBuilderTabProps {
  players: PlayerProjection[];
  sport: Sport;
  site: Site;
  salaryCap: number;
  rosterSlots: string[];
  lockedPlayerIds: string[];
  excludedPlayerIds: string[];
  onToggleLock: (id: string) => void;
  onToggleExclude: (id: string) => void;
  onClearLocksAndExcludes: () => void;
}

export const LineupBuilderTab: React.FC<LineupBuilderTabProps> = ({
  players,
  sport,
  site,
  salaryCap,
  rosterSlots,
  lockedPlayerIds,
  excludedPlayerIds,
  onToggleLock,
  onToggleExclude,
  onClearLocksAndExcludes,
}) => {
  const [lineupCount, setLineupCount] = useState<number>(5);
  const [maxExposure, setMaxExposure] = useState<number>(0.6); // 60% default
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedLineups, setGeneratedLineups] = useState<GeneratedLineup[]>([]);
  const [activeLineupIndex, setActiveLineupIndex] = useState<number>(0);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const lockedPlayers = players.filter((p) => lockedPlayerIds.includes(p.id));
  const excludedPlayers = players.filter((p) => excludedPlayerIds.includes(p.id));

  const handleGenerateLineups = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const lineups = generateTourneyLineups(
        players,
        sport,
        site,
        salaryCap,
        rosterSlots,
        {
          lockedPlayerIds,
          excludedPlayerIds,
          lineupCount,
          maxExposure,
        }
      );
      setGeneratedLineups(lineups);
      setActiveLineupIndex(0);
      setIsGenerating(false);
    }, 350);
  };

  const handleExportCsv = () => {
    if (generatedLineups.length === 0) return;
    const csvContent = exportLineupsToCsv(generatedLineups, site);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${site}_${sport}_tournament_lineups_${dateStr}.csv`;
    downloadCsvFile(csvContent, filename);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const currentLineup = generatedLineups[activeLineupIndex] || null;

  return (
    <div className="space-y-6">
      {/* Top Optimizer Configuration Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg sm:text-xl font-black text-white font-display">
                Tournament Lineup Generator
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Roster Rules: <strong>{site.toUpperCase()} {sport.toUpperCase()}</strong> ({rosterSlots.length} players) · Salary Cap: <strong>${salaryCap.toLocaleString()}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(lockedPlayerIds.length > 0 || excludedPlayerIds.length > 0) && (
              <button
                onClick={onClearLocksAndExcludes}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-400 hover:text-rose-400 bg-slate-950 rounded-lg border border-slate-800 min-h-[36px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Locks/Excludes</span>
              </button>
            )}
          </div>
        </div>

        {/* Generator Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Lineups to generate */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              Number of Tournament Lineups:
            </label>
            <div className="flex items-center gap-1.5 pt-1">
              {[1, 3, 5, 10, 20].map((num) => (
                <button
                  key={num}
                  onClick={() => setLineupCount(num)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all min-h-[36px] ${
                    lineupCount === num
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Max Exposure Limit Slider */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300">
                Max Exposure Limit:
              </label>
              <span className="font-mono text-emerald-400 font-bold">
                {Math.round(maxExposure * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={maxExposure}
              onChange={(e) => setMaxExposure(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer pt-2"
            />
            <p className="text-[11px] text-slate-500">
              Limits player overlap across multi-lineups for maximum GPP coverage.
            </p>
          </div>

          {/* Primary Action Button */}
          <div className="flex flex-col justify-end">
            <button
              onClick={handleGenerateLineups}
              disabled={isGenerating}
              className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white font-black text-sm shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Wand2 className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>
                {isGenerating
                  ? 'Optimizing...'
                  : `Generate ${lineupCount} Tournament Lineup${lineupCount > 1 ? 's' : ''}`}
              </span>
            </button>
          </div>
        </div>

        {/* Locks & Excludes Chips Drawer */}
        {(lockedPlayers.length > 0 || excludedPlayers.length > 0) && (
          <div className="pt-2 border-t border-slate-800/60 space-y-2 text-xs">
            {lockedPlayers.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-emerald-400 flex items-center gap-1 font-mono">
                  <Lock className="w-3.5 h-3.5" /> Locked ({lockedPlayers.length}):
                </span>
                {lockedPlayers.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-lg text-xs"
                  >
                    <span>{p.name} ({p.position} · ${p.salary.toLocaleString()})</span>
                    <button
                      onClick={() => onToggleLock(p.id)}
                      className="text-emerald-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}

            {excludedPlayers.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-rose-400 flex items-center gap-1 font-mono">
                  <Ban className="w-3.5 h-3.5" /> Excluded ({excludedPlayers.length}):
                </span>
                {excludedPlayers.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 bg-rose-950/70 text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded-lg text-xs"
                  >
                    <span>{p.name}</span>
                    <button
                      onClick={() => onToggleExclude(p.id)}
                      className="text-rose-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Generated Lineups Area */}
      {generatedLineups.length > 0 ? (
        <div className="space-y-4">
          {/* Multi-Lineup Carousel / Tab Bar & Export CSV Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
            {/* Lineup Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <span className="text-xs text-slate-400 font-medium mr-1 uppercase">Lineup:</span>
              {generatedLineups.map((lineup, idx) => (
                <button
                  key={lineup.id}
                  onClick={() => setActiveLineupIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap min-h-[36px] ${
                    activeLineupIndex === idx
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  #{lineup.lineupNumber}
                </button>
              ))}
            </div>

            {/* Export CSV Button (Prompt requirement: export as CSV for upload) */}
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white rounded-xl text-xs font-bold border border-slate-700 shadow-md min-h-[40px] shrink-0"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>
                {downloadSuccess ? 'Downloaded!' : `Export ${generatedLineups.length} CSV (${site.toUpperCase()})`}
              </span>
            </button>
          </div>

          {/* Detailed View of Active Lineup */}
          {currentLineup && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
              {/* Lineup Overview KPI Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-sans">Total Salary</span>
                  <span className="text-base font-extrabold text-white tabular-nums">
                    ${currentLineup.totalSalary.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Rem: ${(salaryCap - currentLineup.totalSalary).toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-sans">Projected Pts</span>
                  <span className="text-base font-extrabold text-emerald-400 tabular-nums">
                    {currentLineup.totalProjectedPoints.toFixed(1)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-sans">Ceiling</span>
                  <span className="text-base font-bold text-white tabular-nums">
                    {currentLineup.totalCeiling.toFixed(1)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-sans">Avg Ownership</span>
                  <span className="text-base font-bold text-amber-400 tabular-nums">
                    {currentLineup.averageOwnership.toFixed(1)}%
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 uppercase block font-sans">Stack Correlation</span>
                  <span className="text-xs font-semibold text-sky-400 truncate block mt-1">
                    {currentLineup.stackDescription}
                  </span>
                </div>
              </div>

              {/* Roster Slots Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold text-slate-300">Slot</th>
                      <th className="py-2.5 px-3 font-semibold text-slate-300">Player</th>
                      <th className="py-2.5 px-3 font-semibold text-slate-300 text-right">Salary</th>
                      <th className="py-2.5 px-3 font-semibold text-slate-300 text-right">Proj</th>
                      <th className="py-2.5 px-3 font-semibold text-slate-300 text-right">Ceiling</th>
                      <th className="py-2.5 px-3 font-semibold text-slate-300 text-right">Own %</th>
                      <th className="py-2.5 px-3 font-semibold text-slate-300">Matchup</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {currentLineup.slots.map((slot, sIdx) => {
                      const p = slot.player;
                      return (
                        <tr key={sIdx} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-bold text-emerald-400 font-sans">
                            {slot.slotName}
                          </td>
                          <td className="py-2.5 px-3 font-sans">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs">{p.name}</span>
                              <span className="text-slate-400 text-[11px] font-mono">
                                {p.team} vs {p.opponent}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-200 tabular-nums">
                            ${p.salary.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-400 tabular-nums">
                            {p.projectedPoints.toFixed(1)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">
                            {p.ceiling.toFixed(1)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-amber-400 tabular-nums">
                            {p.projectedOwnership.toFixed(1)}%
                          </td>
                          <td className="py-2.5 px-3 font-sans">
                            <span
                              className={`text-[11px] font-semibold ${
                                p.matchupRating === 'soft'
                                  ? 'text-emerald-400'
                                  : p.matchupRating === 'average'
                                  ? 'text-amber-400'
                                  : 'text-rose-400'
                              }`}
                            >
                              #{p.opponentRank} {p.matchupRating}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center space-y-3">
          <Wand2 className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white font-display">
            No Lineups Generated Yet
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Choose your desired number of lineups (up to 20), configure your exposure limit, and click <strong>Generate Tournament Lineups</strong> above.
          </p>
        </div>
      )}
    </div>
  );
};
