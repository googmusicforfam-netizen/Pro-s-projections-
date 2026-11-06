export const TYPES_VERSION = '2026';

export type Sport = 'nba' | 'nfl' | 'nhl' | 'mlb' | 'nascar';

export type Site = 'draftkings' | 'fanduel';

export type SlateStatus = 'Upcoming' | 'Live' | 'Locked';

export type SlateFormat = 'classic' | 'showdown_captain' | 'single_game_mvp';

export type PlayerStatus =
  | 'CONFIRMED'
  | 'PROBABLE'
  | 'QUESTIONABLE'
  | 'DOUBTFUL'
  | 'GTD'
  | 'OUT'
  | 'IR'
  | 'INACTIVE'
  | 'SCRATCH'
  | 'SUSPENDED'
  | 'HEALTHY';

export type MatchupRating = 'soft' | 'average' | 'tough';

export interface VerificationAudit {
  officialTeamReport: string; // e.g. "Baltimore Ravens Injury Wire: Placed on IR"
  leagueTransactionWire: string; // e.g. "NFL Transaction Wire 2026: Official IR placement"
  beatReporterReport: string; // e.g. "Jeff Zrebiec (The Athletic): Out multiple weeks"
  hasConflict: boolean;
  conflictNote?: string;
  lastVerifiedTime: string; // ISO string e.g. "2026-11-05T16:30:00Z"
}

export interface PlayerProjection {
  id: string;
  name: string;
  team: string;
  opponent: string;
  isHome: boolean;
  position: string; // e.g., 'PG', 'SG', 'QB', 'RB', 'C', 'LW', 'Driver'
  eligiblePositions: string[]; // For DK/FD roster flexibility
  salary: number; // Normal salary
  captainSalary?: number; // For DK Showdown Captain (1.5x)
  projectedPoints: number; // Median projection
  ceiling: number; // 85th-90th percentile tournament upside
  floor: number; // 15th-20th percentile safe floor
  valueScore: number; // Projected Points per $1,000 (e.g. 5.7x)
  projectedOwnership: number; // Percentage relative to this specific slate
  captainOwnership?: number; // CPT/MVP ownership in single-game slates
  gameTime: string; // ISO string e.g. "2026-11-05T20:15:00Z"
  gameTimeFormatted?: string;
  isStarted: boolean;
  isLocked: boolean;
  status: PlayerStatus;
  statusNote?: string;
  whyNote: string; // Tournament angle & matchup note for this slate
  
  // Multi-source availability check & verification audit
  verification: VerificationAudit;
  
  // Injury replacement and usage boost indicators
  isPromotedBackup?: boolean;
  backupForPlayer?: string;
  injuryBoostNote?: string; // e.g. "Boost: +18% rush share due to Lamar Jackson (IR)"

  // Matchup Strength
  matchupRating: MatchupRating; // 'soft' | 'average' | 'tough'
  opponentRank: number; // 1-30
  matchupDetail: string; // e.g. "BAL ranks 24th vs WR (soft)"
  
  // Hot Streak Tracking
  last3Avg: number; // Last 3 games fantasy point average
  seasonAvg: number; // 2026 season fantasy point average
  isHot: boolean; // L3 > season avg by +8%
  isCold: boolean; // L3 < season avg by -8%

  // Recent update tracking
  hasChangedRecently?: boolean;
  changeNote?: string;
}

export interface SlateStack {
  id: string;
  type: 'game' | 'team' | 'nascar_dominator' | 'showdown_onslaught';
  title: string;
  teams: string;
  gameTotal?: number;
  spread?: string;
  projectedPace?: 'Very Fast' | 'Fast' | 'Average' | 'Slow';
  upsideScore: number; // 1-100 tournament upside
  combinedOwnership: number; // Total combined ownership %
  combinedSalary: number;
  players: {
    name: string;
    team: string;
    position: string;
    salary: number;
    projectedPoints: number;
    role: string; // e.g. "Captain CPT", "Lead QB", "Alpha WR1", "Bring-back", "PP1 Center", "Dominator"
  }[];
  analysis: string;
}

export interface NewsItem {
  id: string;
  timestamp: string;
  sport: Sport;
  player: string;
  team: string;
  type: 'OUT_ALERT' | 'LINEUP_CONFIRMED' | 'INJURY_UPDATE' | 'SCRATCH' | 'STARTING_GOALIE';
  headline: string;
  details: string;
  isTopValuePlay: boolean;
  impactNote: string;
}

export interface RemovalLogItem {
  id: string;
  timestamp: string;
  player: string;
  team: string;
  position: string;
  reason: 'INJURED_RESERVE' | 'RULED_OUT' | 'INACTIVE' | 'SCRATCH' | 'SUSPENDED';
  officialSource: string;
  details: string;
  promotedReplacement: string;
  teammateBoostNotes: string;
}

export interface SlateMeta {
  id: string;
  sport: Sport;
  site: Site;
  date: string; // e.g. "2026-11-05"
  dayLabel: string; // e.g. "Today (Thu, Nov 5)" or "Sunday (Nov 8)"
  slateName: string; // e.g. "Jacksonville at Baltimore (1 game, 8:15 PM)"
  shortLabel: string; // e.g. "JAX @ BAL Showdown"
  format: SlateFormat;
  gameCount: number;
  firstGameTime: string;
  lastGameTime: string;
  teams: string[];
  gameSummary: string;
  status: SlateStatus;
  isCaptainMode: boolean;
  salaryCap: number;
  rosterSlots: string[];
  isNewSlate?: boolean;
}

export interface SportSlate extends SlateMeta {
  sportLabel: string;
  hasGamesToday: boolean;
  seasonContext: string;
  lastUpdated: string;
  sources: string[];
  players: PlayerProjection[]; // Cleaned active player pool (purged of all OUT/IR/scratches)
  doubtfulPlayers: PlayerProjection[]; // Segregated doubtful players (hidden by default)
  removalLog: RemovalLogItem[]; // Official removals log
  stacks: SlateStack[];
  news: NewsItem[];
  highPriorityAlert?: {
    id: string;
    player: string;
    team: string;
    headline: string;
    replacementRecommendation: string;
  };
}

export interface GeneratedLineup {
  id: string;
  lineupNumber: number;
  slots: {
    slotName: string;
    player: PlayerProjection;
    isCaptain?: boolean;
    costSalary: number;
    effectivePoints: number;
  }[];
  totalSalary: number;
  totalProjectedPoints: number;
  totalCeiling: number;
  totalFloor: number;
  averageOwnership: number;
  stackDescription?: string;
}

export type TabType = 'projections' | 'top_value' | 'leverage' | 'stacks' | 'news' | 'builder';
