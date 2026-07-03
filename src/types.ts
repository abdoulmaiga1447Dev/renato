/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TeamInfo {
  name: string;
  code: string;
  shortName: string;
  logoUrl: string; // fallback SVG representation will be used dynamically
  color: string; // Hex code
  textColor: string;
  xg: number;
  apiTeamId?: number;
}

export type EventType = 'goal' | 'yellow_card' | 'red_card' | 'foul' | 'shot' | 'corner' | 'freekick' | 'offside' | 'substitution';

export interface MatchEvent {
  id: string;
  type: EventType;
  minute: number;
  second: number;
  team: 'home' | 'away';
  player: string;
  description: string;
}

export interface MatchStats {
  possession: number; // e.g., 79 meaning 79% for homeTeam, 21% awayTeam
  tirsTotal: [number, number]; // [home, away]
  tirsCadres: [number, number];
  fautes: [number, number];
  corners: [number, number];
  cartonsJaunes: [number, number];
  cartonsRouges: [number, number];
  attaques?: [number, number];
  attaquesDangereuses?: [number, number];
}

export interface Player {
  id: string;
  name: string;
  number: number;
  position: string; // e.g. GK, DEF, MID, ATT
  x: number; // grid percent x
  y: number; // grid percent y
  isSub?: boolean;
}

export interface Lineup {
  formation: string; // e.g., "4-3-3"
  players: Player[];
  imageUrl?: string; // Optional admin-uploaded image representing the lineup, shown instead of player dots
}

export interface Ad {
  id: string;
  title: string;
  subtitle: string;
  highlightText: string;
  sponsorName: string;
  ctaText: string;
  accentColor: string;
  bgColor: string;
  imageUrl?: string;
}

export interface UpcomingMatch {
  id: string;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamFlag: string;
  awayTeamFlag: string;
  competition: string;
  status?: string;
  homeScore?: number;
  awayScore?: number;
}

export interface MatchState {
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  homeScore: number;
  awayScore: number;
  minute: number;
  seconds: number;
  isPlaying: boolean;
  status: 'IN_PLAY' | 'FINISHED' | 'HALF_TIME' | 'UPCOMING';
  date?: string;
  competition: string;
  hasRealStats?: boolean;
  hasRealLineups?: boolean;
  events: MatchEvent[];
  stats: MatchStats;
  currentEvent?: MatchEvent;
  isGoalNotificationActive: boolean;
  goalNotificationTeam?: 'home' | 'away';
  goalScorerName?: string;
  lastEventDescription?: string;
  ballPosition: { x: number; y: number }; // 0 to 100 on virtual pitch
  activeAttacker: 'home' | 'away' | 'none';
  xgHome: number;
  xgAway: number;
  viewers: number;
  likes: number;
  shortStatus?: string;
  halftimeTicks?: number;
  extraTime?: number;
  extraTime1H?: string;
  extraTime2H?: string;
}