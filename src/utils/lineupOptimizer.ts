import { PlayerProjection, GeneratedLineup, Site, Sport } from '../types';

export interface OptimizerOptions {
  lockedPlayerIds: string[];
  excludedPlayerIds: string[];
  lineupCount: number; // 1 to 20
  maxExposure: number; // e.g. 0.60 = 60%
  stackPreference?: 'correlated' | 'balanced' | 'contrarian';
}

/**
 * Checks if a player can fill a given roster slot based on sport and site
 */
export function canFillSlot(player: PlayerProjection, slotName: string, sport: Sport): boolean {
  if (player.status === 'OUT') return false;

  const pos = player.position.toUpperCase();
  const slot = slotName.toUpperCase();

  if (sport === 'nba') {
    if (slot === pos) return true;
    if (player.eligiblePositions && player.eligiblePositions.includes(slot)) return true;
    if (slot === 'G' && (pos === 'PG' || pos === 'SG')) return true;
    if (slot === 'F' && (pos === 'SF' || pos === 'PF')) return true;
    if (slot === 'UTIL') return true;
    return false;
  }

  if (sport === 'nfl') {
    if (slot === pos) return true;
    if (player.eligiblePositions && player.eligiblePositions.includes(slot)) return true;
    if (slot === 'FLEX' && (pos === 'RB' || pos === 'WR' || pos === 'TE')) return true;
    if (slot === 'DEF' && pos === 'DST') return true;
    if (slot === 'DST' && pos === 'DEF') return true;
    return false;
  }

  if (sport === 'nhl') {
    if (slot === pos) return true;
    if (slot === 'W' && (pos === 'LW' || pos === 'RW' || pos === 'W')) return true;
    if (slot === 'UTIL' && (pos === 'C' || pos === 'LW' || pos === 'RW' || pos === 'W' || pos === 'D')) return true;
    return false;
  }

  if (sport === 'nascar') {
    return true; // All are drivers
  }

  return slot === pos;
}

/**
 * Generates tournament-optimized DFS lineups
 */
export function generateTourneyLineups(
  players: PlayerProjection[],
  sport: Sport,
  site: Site,
  salaryCap: number,
  rosterSlots: string[],
  options: OptimizerOptions
): GeneratedLineup[] {
  const { lockedPlayerIds, excludedPlayerIds, lineupCount, maxExposure } = options;

  // Filter pool
  const pool = players.filter(
    (p) => !excludedPlayerIds.includes(p.id) && p.status !== 'OUT' && !p.isStarted
  );

  const lockedPlayers = pool.filter((p) => lockedPlayerIds.includes(p.id));

  // Player exposure tracker across generated lineups
  const playerAppearances: Record<string, number> = {};
  pool.forEach((p) => (playerAppearances[p.id] = 0));

  const generatedLineups: GeneratedLineup[] = [];

  for (let l = 1; l <= lineupCount; l++) {
    const selected: PlayerProjection[] = [];
    const usedIds = new Set<string>();

    // 1. Add locked players first
    for (const locked of lockedPlayers) {
      selected.push(locked);
      usedIds.add(locked.id);
    }

    // 2. Identify remaining slots to fill
    const slotsToFill = [...rosterSlots];
    const assignedSlots: { slotName: string; player: PlayerProjection }[] = [];

    // Assign already selected locked players to valid slots
    for (const locked of selected) {
      const validSlotIndex = slotsToFill.findIndex((slot) => canFillSlot(locked, slot, sport));
      if (validSlotIndex !== -1) {
        const [slot] = slotsToFill.splice(validSlotIndex, 1);
        assignedSlots.push({ slotName: slot, player: locked });
      }
    }

    // Sort remaining pool for tournament upside:
    // Blend of ceiling (60%), value (25%), and low ownership leverage (15%) + stochastic variance per lineup
    const maxAppearances = Math.max(1, Math.ceil(lineupCount * maxExposure));

    // Try multiple iterations to find an optimal and salary-compliant combination
    let bestRoster: { slotName: string; player: PlayerProjection }[] | null = null;
    let bestScore = -1;

    const attempts = 150;
    for (let att = 0; att < attempts; att++) {
      const currentAssigned = [...assignedSlots];
      const remainingSlots = [...slotsToFill];
      let currentSalary = currentAssigned.reduce((sum, item) => sum + item.player.salary, 0);
      const tempUsed = new Set<string>(currentAssigned.map((a) => a.player.id));
      let possible = true;

      for (const slot of remainingSlots) {
        // Candidates for this slot
        const candidates = pool.filter((p) => {
          if (tempUsed.has(p.id)) return false;
          if (!canFillSlot(p, slot, sport)) return false;
          if (lockedPlayerIds.includes(p.id)) return true;
          // Check exposure limit
          if (playerAppearances[p.id] >= maxAppearances && l > 1) return false;
          return true;
        });

        if (candidates.length === 0) {
          possible = false;
          break;
        }

        // Score candidates with tournament weighting and lineup variance
        const scoredCandidates = candidates.map((p) => {
          // Jitter weight increases with lineup index to ensure tournament diversity
          const jitter = (Math.random() - 0.5) * (0.8 + (l / lineupCount) * 1.5);
          // High ceiling boost
          const ceilingScore = p.ceiling * 1.2;
          // Leverage boost: if ownership < 10%, give extra upside bump
          const leverageMultiplier = p.projectedOwnership < 12 ? 1.15 : p.projectedOwnership > 25 ? 0.95 : 1.0;
          const score = (ceilingScore * 0.5 + p.valueScore * 5 + jitter * 6) * leverageMultiplier;
          return { player: p, score };
        });

        scoredCandidates.sort((a, b) => b.score - a.score);

        // Pick from top candidates while keeping average salary per remaining slot reasonable
        const remainingSlotCount = remainingSlots.length - currentAssigned.length + assignedSlots.length;
        const remainingBudget = salaryCap - currentSalary;
        const targetAvgSalary = remainingBudget / (remainingSlotCount || 1);

        // Filter for viable budget range
        const viable = scoredCandidates.filter(
          (c) => c.player.salary <= remainingBudget - (remainingSlotCount - 1) * 3000
        );

        const pickList = viable.length > 0 ? viable.slice(0, 5) : scoredCandidates.slice(0, 3);
        const chosen = pickList[Math.floor(Math.random() * pickList.length)]?.player || scoredCandidates[0]?.player;

        if (!chosen || currentSalary + chosen.salary > salaryCap) {
          possible = false;
          break;
        }

        tempUsed.add(chosen.id);
        currentSalary += chosen.salary;
        currentAssigned.push({ slotName: slot, player: chosen });
      }

      if (possible && currentAssigned.length === rosterSlots.length && currentSalary <= salaryCap) {
        const totalProj = currentAssigned.reduce((s, a) => s + a.player.projectedPoints, 0);
        const totalCeiling = currentAssigned.reduce((s, a) => s + a.player.ceiling, 0);
        const compositeScore = totalProj * 0.4 + totalCeiling * 0.6;

        if (compositeScore > bestScore) {
          bestScore = compositeScore;
          bestRoster = currentAssigned;
        }
      }
    }

    if (bestRoster) {
      // Re-order bestRoster to match the standard site rosterSlots order
      const orderedSlots: { slotName: string; player: PlayerProjection }[] = [];
      const remainingPicks = [...bestRoster];

      for (const slot of rosterSlots) {
        const foundIdx = remainingPicks.findIndex((item) => item.slotName === slot);
        if (foundIdx !== -1) {
          orderedSlots.push(remainingPicks.splice(foundIdx, 1)[0]);
        } else {
          // Fallback
          orderedSlots.push(remainingPicks.pop() || { slotName: slot, player: pool[0] });
        }
      }

      const totalSalary = orderedSlots.reduce((sum, item) => sum + item.player.salary, 0);
      const totalProjectedPoints = Number(
        orderedSlots.reduce((sum, item) => sum + item.player.projectedPoints, 0).toFixed(1)
      );
      const totalCeiling = Number(
        orderedSlots.reduce((sum, item) => sum + item.player.ceiling, 0).toFixed(1)
      );
      const totalFloor = Number(
        orderedSlots.reduce((sum, item) => sum + item.player.floor, 0).toFixed(1)
      );
      const averageOwnership = Number(
        (
          orderedSlots.reduce((sum, item) => sum + item.player.projectedOwnership, 0) /
          orderedSlots.length
        ).toFixed(1)
      );

      // Record appearances for exposure tracking
      orderedSlots.forEach((slot) => {
        playerAppearances[slot.player.id] = (playerAppearances[slot.player.id] || 0) + 1;
      });

      // Detect stacks
      const teamCounts: Record<string, number> = {};
      orderedSlots.forEach((s) => {
        teamCounts[s.player.team] = (teamCounts[s.player.team] || 0) + 1;
      });
      const topTeams = Object.entries(teamCounts).filter(([, count]) => count >= 2);
      const stackDescription =
        topTeams.length > 0
          ? topTeams.map(([team, count]) => `${count}x ${team}`).join(' + ')
          : 'Spread correlation';

      generatedLineups.push({
        id: `lineup-${l}-${Date.now()}`,
        lineupNumber: l,
        slots: orderedSlots,
        totalSalary,
        totalProjectedPoints,
        totalCeiling,
        totalFloor,
        averageOwnership,
        stackDescription,
      });
    }
  }

  return generatedLineups;
}

/**
 * Exports generated lineups to a CSV formatted for official DraftKings or FanDuel Lineup Upload
 */
export function exportLineupsToCsv(lineups: GeneratedLineup[], site: Site): string {
  if (!lineups || lineups.length === 0) return '';

  const headerSlots = lineups[0].slots.map((s) => s.slotName);
  const csvRows: string[] = [];

  // Site Header Row
  csvRows.push(headerSlots.join(','));

  for (const lineup of lineups) {
    const row = lineup.slots.map((slot) => {
      const p = slot.player;
      // In DraftKings & FanDuel CSV format:
      // Player Name or Player ID (Name + ID)
      // e.g. "Nikola Jokic (28491823)" or "Nikola Jokic"
      return `"${p.name} (${p.team})"`;
    });
    csvRows.push(row.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Triggers a browser file download of the CSV
 */
export function downloadCsvFile(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
