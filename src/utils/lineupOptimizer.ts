import { PlayerProjection, GeneratedLineup, Site, Sport, SlateFormat } from '../types';

export interface OptimizerOptions {
  lockedPlayerIds: string[];
  excludedPlayerIds: string[];
  lineupCount: number; // 1 to 20
  maxExposure: number; // e.g. 0.60 = 60%
  isCaptainMode?: boolean;
  format?: SlateFormat;
}

export function canFillSlot(
  player: PlayerProjection,
  slotName: string,
  sport: Sport,
  isCaptainMode: boolean
): boolean {
  if (player.status === 'OUT') return false;

  const slot = slotName.toUpperCase();
  const pos = player.position.toUpperCase();

  // Showdown / Single Game slots
  if (isCaptainMode || slot.startsWith('CPT') || slot.startsWith('MVP') || slot.startsWith('STAR') || slot.startsWith('PRO')) {
    return true; // Any player in showdown can be CPT, MVP, or FLEX
  }
  if (slot === 'FLEX' || slot === 'UTIL') {
    if (sport === 'nfl') return pos === 'RB' || pos === 'WR' || pos === 'TE' || pos === 'QB' || pos === 'K' || pos === 'DST';
    return true;
  }

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
    if (slot === 'DEF' && (pos === 'DST' || pos === 'DEF')) return true;
    if (slot === 'DST' && (pos === 'DEF' || pos === 'DST')) return true;
    return false;
  }

  if (sport === 'nhl') {
    if (slot === pos) return true;
    if (slot === 'W' && (pos === 'LW' || pos === 'RW' || pos === 'W')) return true;
    if (slot === 'UTIL' && (pos === 'C' || pos === 'LW' || pos === 'RW' || pos === 'W' || pos === 'D')) return true;
    return false;
  }

  if (sport === 'nascar') {
    return true; // All drivers
  }

  return slot === pos;
}

export function generateTourneyLineups(
  players: PlayerProjection[],
  sport: Sport,
  site: Site,
  salaryCap: number,
  rosterSlots: string[],
  options: OptimizerOptions
): GeneratedLineup[] {
  const { lockedPlayerIds, excludedPlayerIds, lineupCount, maxExposure, isCaptainMode } = options;

  const pool = players.filter(
    (p) => !excludedPlayerIds.includes(p.id) && p.status !== 'OUT' && !p.isStarted
  );

  if (pool.length === 0) return [];

  const playerAppearances: Record<string, number> = {};
  pool.forEach((p) => (playerAppearances[p.id] = 0));

  const generatedLineups: GeneratedLineup[] = [];
  const maxAppearances = Math.max(1, Math.ceil(lineupCount * maxExposure));

  for (let l = 1; l <= lineupCount; l++) {
    const isShowdown = isCaptainMode || rosterSlots.some((s) => s.startsWith('CPT') || s.startsWith('MVP'));

    let bestRoster: GeneratedLineup['slots'] | null = null;
    let bestScore = -1;

    const attempts = 180;
    for (let att = 0; att < attempts; att++) {
      const assigned: GeneratedLineup['slots'] = [];
      const usedIds = new Set<string>();
      let currentSalary = 0;
      let possible = true;

      // Handle Showdown / Single Game
      if (isShowdown) {
        const cptSlot = rosterSlots[0];
        const flexSlots = rosterSlots.slice(1);

        // Pick Captain / MVP
        const cptCandidates = pool.filter((p) => {
          if (playerAppearances[p.id] >= maxAppearances && l > 1 && !lockedPlayerIds.includes(p.id)) {
            return false;
          }
          return true;
        });

        if (cptCandidates.length === 0) continue;

        // CPT candidates scored by ceiling & 1.5x multiplier
        const scoredCpt = cptCandidates.map((p) => {
          const cost = site === 'draftkings' ? (p.captainSalary || Math.round(p.salary * 1.5)) : p.salary;
          const pts = p.projectedPoints * 1.5;
          const jitter = (Math.random() - 0.5) * 4;
          return { player: p, cost, effectivePts: pts, score: pts * 1.4 - (cost / 1000) * 0.8 + jitter };
        });
        scoredCpt.sort((a, b) => b.score - a.score);

        // Pick Captain from top choices
        const chosenCpt = scoredCpt[Math.floor(Math.random() * Math.min(3, scoredCpt.length))];
        if (!chosenCpt || currentSalary + chosenCpt.cost > salaryCap) continue;

        assigned.push({
          slotName: cptSlot,
          player: chosenCpt.player,
          isCaptain: true,
          costSalary: chosenCpt.cost,
          effectivePoints: chosenCpt.effectivePts,
        });
        usedIds.add(chosenCpt.player.id);
        currentSalary += chosenCpt.cost;

        // Fill remaining FLEX slots
        for (const flexSlot of flexSlots) {
          const candidates = pool.filter((p) => !usedIds.has(p.id));
          if (candidates.length === 0) {
            possible = false;
            break;
          }

          const remainingSlots = rosterSlots.length - assigned.length;
          const remainingBudget = salaryCap - currentSalary;

          const scoredFlex = candidates.map((p) => {
            const cost = p.salary;
            const pts = p.projectedPoints;
            const jitter = (Math.random() - 0.5) * 3;
            return { player: p, cost, effectivePts: pts, score: pts + p.valueScore * 3 + jitter };
          });
          scoredFlex.sort((a, b) => b.score - a.score);

          const viable = scoredFlex.filter(
            (c) => c.cost <= remainingBudget - (remainingSlots - 1) * (sport === 'nfl' ? 3500 : 4000)
          );
          const poolToPick = viable.length > 0 ? viable.slice(0, 4) : scoredFlex.slice(0, 2);
          const chosen = poolToPick[Math.floor(Math.random() * poolToPick.length)];

          if (!chosen || currentSalary + chosen.cost > salaryCap) {
            possible = false;
            break;
          }

          assigned.push({
            slotName: flexSlot,
            player: chosen.player,
            isCaptain: false,
            costSalary: chosen.cost,
            effectivePoints: chosen.effectivePts,
          });
          usedIds.add(chosen.player.id);
          currentSalary += chosen.cost;
        }
      } else {
        // Classic Slate Optimization
        const remainingSlots = [...rosterSlots];

        for (const slot of remainingSlots) {
          const candidates = pool.filter((p) => {
            if (usedIds.has(p.id)) return false;
            if (!canFillSlot(p, slot, sport, false)) return false;
            if (lockedPlayerIds.includes(p.id)) return true;
            if (playerAppearances[p.id] >= maxAppearances && l > 1) return false;
            return true;
          });

          if (candidates.length === 0) {
            possible = false;
            break;
          }

          const slotsLeft = rosterSlots.length - assigned.length;
          const budgetLeft = salaryCap - currentSalary;

          const scored = candidates.map((p) => {
            const jitter = (Math.random() - 0.5) * 4;
            const score = p.ceiling * 0.4 + p.projectedPoints * 0.6 + p.valueScore * 3 + jitter;
            return { player: p, score };
          });
          scored.sort((a, b) => b.score - a.score);

          const viable = scored.filter(
            (c) => c.player.salary <= budgetLeft - (slotsLeft - 1) * 3500
          );
          const pickList = viable.length > 0 ? viable.slice(0, 4) : scored.slice(0, 2);
          const chosen = pickList[Math.floor(Math.random() * pickList.length)]?.player || scored[0]?.player;

          if (!chosen || currentSalary + chosen.salary > salaryCap) {
            possible = false;
            break;
          }

          assigned.push({
            slotName: slot,
            player: chosen,
            costSalary: chosen.salary,
            effectivePoints: chosen.projectedPoints,
          });
          usedIds.add(chosen.id);
          currentSalary += chosen.salary;
        }
      }

      if (possible && assigned.length === rosterSlots.length && currentSalary <= salaryCap) {
        const totalPoints = assigned.reduce((sum, item) => sum + item.effectivePoints, 0);
        if (totalPoints > bestScore) {
          bestScore = totalPoints;
          bestRoster = assigned;
        }
      }
    }

    if (bestRoster) {
      const totalSalary = bestRoster.reduce((sum, item) => sum + item.costSalary, 0);
      const totalProjectedPoints = Number(
        bestRoster.reduce((sum, item) => sum + item.effectivePoints, 0).toFixed(1)
      );
      const totalCeiling = Number(
        bestRoster
          .reduce(
            (sum, item) => sum + (item.isCaptain ? item.player.ceiling * 1.5 : item.player.ceiling),
            0
          )
          .toFixed(1)
      );
      const totalFloor = Number(
        bestRoster
          .reduce(
            (sum, item) => sum + (item.isCaptain ? item.player.floor * 1.5 : item.player.floor),
            0
          )
          .toFixed(1)
      );
      const averageOwnership = Number(
        (
          bestRoster.reduce(
            (sum, item) =>
              sum + (item.isCaptain ? item.player.captainOwnership || item.player.projectedOwnership : item.player.projectedOwnership),
            0
          ) / bestRoster.length
        ).toFixed(1)
      );

      bestRoster.forEach((slot) => {
        playerAppearances[slot.player.id] = (playerAppearances[slot.player.id] || 0) + 1;
      });

      const teamCounts: Record<string, number> = {};
      bestRoster.forEach((s) => {
        teamCounts[s.player.team] = (teamCounts[s.player.team] || 0) + 1;
      });
      const topTeams = Object.entries(teamCounts).filter(([, count]) => count >= 2);
      const stackDescription =
        topTeams.length > 0
          ? topTeams.map(([t, count]) => `${count}x ${t}`).join(' + ')
          : 'High upside blend';

      generatedLineups.push({
        id: `lineup-${l}-${Date.now()}`,
        lineupNumber: l,
        slots: bestRoster,
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

export function exportLineupsToCsv(lineups: GeneratedLineup[], site: Site): string {
  if (!lineups || lineups.length === 0) return '';

  const headerSlots = lineups[0].slots.map((s) => s.slotName);
  const csvRows: string[] = [];

  csvRows.push(headerSlots.join(','));

  for (const lineup of lineups) {
    const row = lineup.slots.map((slot) => {
      const p = slot.player;
      return `"${p.name} (${p.team})"`;
    });
    csvRows.push(row.join(','));
  }

  return csvRows.join('\n');
}

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
