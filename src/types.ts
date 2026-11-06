export type Sport = 'nba' | 'nfl' | 'nhl' | 'mlb' | 'nascar';

export type Site = 'draftkings' | 'fanduel';

export type PlayerStatus = 'CONFIRMED' | 'PROBABLE' | 'QUESTIONABLE' | 'GTD' | 'OUT' | 'HEALTHY';

export type MatchupRating = 'soft' | 'average' | 'tough';

export interface PlayerProjection {
  id: string;
  name: string;
  team: string;
  opponent: string;
  isHome: boolean;
  position: string; // e.g., 'PG', 'SG', 'QB', 'RB', 'C', 'LW', 'Driver'
  eligiblePositions: string[]; // For DK/FD roster flexibility
  salary: number; // e.g. 9800
  projectedPoints: number; // Median projection
  ceiling: number; // 85th-90th percentile tournament upside
  floor: number; // 15th-20th percentile safe floor
  valueScore: number; // Projected Points per $1,000 (e.g. 5.7x)
  projectedOwnership: number; // Percentage (e.g. 18.5%)
  gameTime: string; // ISO string or format e.g. "2026-11-05T19:30:00Z"
  gameTimeFormatted?: string;
  isStarted: boolean;
  isLocked: boolean;
  status: PlayerStatus;
  statusNote?: string;
  whyNote: string; // Short note on tournament angle / matchup
  
  // Matchup Strength
  matchupRating: MatchupRating; // 'soft' | 'average' | 'tough'
  opponentRank: number; // 1-30 (e.g., 28 = soft / concedes lots of fantasy pts; 2 = tough / elite defense)
  matchupDetail: string; // e.g. "Opp ranks 28th vs C (soft)"
  
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
  type: 'game' | 'team' | 'nascar_dominator';
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
    role: string; // e.g. "Lead QB", "Alpha WR1", "Opponent Run-back", "PP1 Center", "Pole Dominator"
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
  isTopValuePlay: boolean; // Flag if this is a top value or high-owned stud
  impactNote: string; // Fantasy ripple effect / replacement target
}

export interface SportSlate {
  sport: Sport;
  sportLabel: string;
  hasGamesToday: boolean;
  seasonContext: string;
  date: string; // e.g., "2026-11-05"
  site: Site;
  salaryCap: number; // $50,000 or $60,000
  rosterSlots: string[]; // e.g. ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'UTIL']
  firstGameTime: string;
  lastGameTime: string;
  lastUpdated: string;
  sources: string[];
  players: PlayerProjection[];
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

export interface LineupSlot {
  slotName: string;
  player: PlayerProjection | null;
}

export interface GeneratedLineup {
  id: string;
  lineupNumber: number;
  slots: {
    slotName: string;
    player: PlayerProjection;
  }[];
  totalSalary: number;
  totalProjectedPoints: number;
  totalCeiling: number;
  totalFloor: number;
  averageOwnership: number;
  stackDescription?: string;
}

export type TabType = 'projections' | 'top_value' | 'leverage' | 'stacks' | 'news' | 'builder';
