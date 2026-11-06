/**
 * Time formatting, local timezone utilities, and dynamic refresh interval calculations
 * conforming strictly to tournament DFS rules.
 */

export function formatGameTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    // Use user's local timezone
    const timeFormatter = new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    });
    return timeFormatter.format(date);
  } catch {
    return isoString;
  }
}

export function formatLastUpdated(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const timeFormatter = new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    });
    return timeFormatter.format(date);
  } catch {
    return isoString;
  }
}

export interface RefreshIntervalInfo {
  seconds: number;
  label: string;
  isLockedSlate: boolean;
  isPastAllGames: boolean;
  minutesToStart: number;
}

/**
 * Calculates dynamic refresh interval according to tournament rules:
 * - > 3 hours before first event: every 15 mins (900s)
 * - 3 hours to 1 hour out: every 5 mins (300s)
 * - Within 1 hour: every 2 mins (120s)
 * - Within 30 minutes: every 60s (critical scratch/lineup window)
 * - Once all events have started/concluded: stop until tomorrow
 */
export function calculateRefreshSchedule(firstGameIso: string, lastGameIso: string): RefreshIntervalInfo {
  const now = new Date().getTime();
  const firstGame = new Date(firstGameIso).getTime();
  const lastGame = new Date(lastGameIso).getTime();

  // If last game is more than 3.5 hours ago, all games are finished
  if (now > lastGame + 3.5 * 3600 * 1000) {
    return {
      seconds: 0,
      label: 'Slate Concluded (Paused until tomorrow)',
      isLockedSlate: true,
      isPastAllGames: true,
      minutesToStart: 0,
    };
  }

  const msToFirstGame = firstGame - now;
  const minutesToStart = Math.round(msToFirstGame / (60 * 1000));

  if (msToFirstGame <= 0) {
    // Games have started!
    return {
      seconds: 120, // Check for late-game scratches / live injury updates
      label: 'Slate Live (Locks Active)',
      isLockedSlate: true,
      isPastAllGames: false,
      minutesToStart: 0,
    };
  }

  const hoursToStart = msToFirstGame / (3600 * 1000);

  if (hoursToStart > 3) {
    return {
      seconds: 900, // 15 mins
      label: '15m refresh (>3h to lock)',
      isLockedSlate: false,
      isPastAllGames: false,
      minutesToStart,
    };
  } else if (hoursToStart > 1) {
    return {
      seconds: 300, // 5 mins
      label: '5m refresh (3h–1h to lock)',
      isLockedSlate: false,
      isPastAllGames: false,
      minutesToStart,
    };
  } else if (minutesToStart > 30) {
    return {
      seconds: 120, // 2 mins
      label: '2m refresh (<1h to lock)',
      isLockedSlate: false,
      isPastAllGames: false,
      minutesToStart,
    };
  } else {
    return {
      seconds: 60, // 60 seconds
      label: '60s refresh (Lineup crunch)',
      isLockedSlate: false,
      isPastAllGames: false,
      minutesToStart,
    };
  }
}
