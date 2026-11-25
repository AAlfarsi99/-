import { PlayerId, Suit } from './game';

export type TableColor = 'green' | 'blue' | 'burgundy';

export type CardBackStyle = 
  | 'omani-khanjar' 
  | 'royal-blue' 
  | 'crimson-damask' 
  | 'emerald-luxury';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameSettings {
  tableColor: TableColor;
  cardBackStyle: CardBackStyle;
  soundEnabled: boolean;
  fastAnimations: boolean;
  playerNames: [string, string, string, string];
  watchMode: boolean;
  difficulty: Difficulty;
}

export interface PlayerStats {
  id: PlayerId;
  name: string;
  tricksWon: number;
  contractsBid: number;
  contractsWon: number;
  contractsLost: number;
  cheatsCaught: number;
}

export interface RoundHistoryRecord {
  round: number;
  bidder: PlayerId;
  contract: number;
  trump: Suit | null;
  winningTeam: number;
  reason: string;
  points: number;
  timestamp: number;
  challenger?: PlayerId;
  challengeSuccess?: boolean;
}

export interface GameStats {
  totalRounds: number;
  totalTricks: number;
  highestContractMade: number;
  players: Record<PlayerId, PlayerStats>;
  roundHistory: RoundHistoryRecord[];
}
