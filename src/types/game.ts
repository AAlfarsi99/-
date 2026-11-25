export type Suit = '♠' | '♥' | '♦' | '♣';
export type JokerSuit = '🃏B' | '🃏R';
export type CardSuit = Suit | JokerSuit;

export interface Card {
  id: string;
  s: CardSuit;
  r: number;
  j?: 'B' | 'R';
}

export type PlayerId = 0 | 1 | 2 | 3;
export type Phase = 'auction' | 'trump' | 'play' | 'end';

export interface TrickCard {
  p: PlayerId;
  c: Card;
  cheated: boolean;
}

export interface PlayHistoryItem {
  p: PlayerId;
  c: Card;
  cheated: boolean;
  required: string | null;
  trick: number;
}

export interface Violation {
  player: PlayerId;
  team: number;
  trick: number;
}

export interface CutPlayDetail {
  player: PlayerId;
  card: Card;
  trick: number;
  requiredSuit?: string;
  isTrumpCut?: boolean;
}

export interface HandSuitStat {
  suit: Suit | 'JOKER';
  label: string;
  shortLabel: string;
  count: number;
  highCards: number;
  isTrump: boolean;
}

export interface PlayerHandAnalysis {
  suitDistribution: HandSuitStat[];
  strengthBreakdown: {
    jokers: number;
    highHonors: number;
    midCards: number;
    lowCards: number;
  };
  estimatedTricks: number;
  recommendedBid: number;
  bestSuit: Suit;
  longestSuit: { suit: Suit; count: number } | null;
  voidSuitsCount: number;
  trumpCount: number;
  tacticalTip: {
    title: string;
    message: string;
    category: 'joker' | 'bidding' | 'trump' | 'defense' | 'insight';
  };
}

export interface RoundStats {
  playerTricks: [number, number, number, number];
  playerCuts: [number, number, number, number];
  cutsDetails?: CutPlayDetail[];
  mostCutsPlayer: {
    player: PlayerId;
    count: number;
    name: string;
    tied?: boolean;
    tiedPlayers?: string[];
  } | null;
  totalTricksPlayed: number;
  jokersPlayed?: {
    black?: { player: PlayerId; trick: number };
    red?: { player: PlayerId; trick: number };
  };
  handAnalysis?: PlayerHandAnalysis;
}

export interface RoundEndDetails {
  reason:
    | 'contract_won'
    | 'contract_lost'
    | 'bound_won'
    | 'bound_lost'
    | 'black_joker_violation'
    | 'challenge_success'
    | 'challenge_failed'
    | 'red_joker_contract_violation'
    | 'trapped_joker_lead_violation';
  winningTeam: number; // 0 for us, 1 for them
  pointsAwarded: number;
  message: string;
  details: string;
  isBound?: boolean;
  isMasoul?: boolean;
  stats?: RoundStats;
}

export interface FlightAnimation {
  id: string;
  p: PlayerId;
  c: Card;
  sourceRect: { left: number; top: number; width: number; height: number };
}
