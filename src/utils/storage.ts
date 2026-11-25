import { GameSettings, GameStats, PlayerStats } from '../types/settings';
import { PlayerId } from '../types/game';

const SETTINGS_KEY = 'omani_card_game_settings_v2';
const STATS_KEY = 'omani_card_game_stats_v2';

export const DEFAULT_PLAYER_NAMES: [string, string, string, string] = [
  'أنت',
  'المياسي',
  'سيف',
  'مروان',
];

export const DEFAULT_SETTINGS: GameSettings = {
  tableColor: 'green',
  cardBackStyle: 'omani-khanjar',
  soundEnabled: true,
  fastAnimations: false,
  playerNames: [...DEFAULT_PLAYER_NAMES],
  watchMode: typeof window !== 'undefined' ? window.innerWidth <= 340 : false,
  difficulty: 'medium',
};

export const createInitialPlayerStats = (id: PlayerId, customNames?: [string, string, string, string]): PlayerStats => ({
  id,
  name: (customNames && customNames[id]) || DEFAULT_PLAYER_NAMES[id],
  tricksWon: 0,
  contractsBid: 0,
  contractsWon: 0,
  contractsLost: 0,
  cheatsCaught: 0,
});

export const DEFAULT_STATS: GameStats = {
  totalRounds: 0,
  totalTricks: 0,
  highestContractMade: 0,
  players: {
    0: createInitialPlayerStats(0),
    1: createInitialPlayerStats(1),
    2: createInitialPlayerStats(2),
    3: createInitialPlayerStats(3),
  },
  roundHistory: [],
};

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);

    const oldDefaults = ['سعيد', 'سالم', 'حمد', 'راشد', 'المنافس ١', 'الشريك', 'المنافس ٢'];
    const resolveName = (val: unknown, defaultVal: string): string => {
      if (typeof val === 'string' && val.trim() && !oldDefaults.includes(val.trim())) {
        return val.trim();
      }
      return defaultVal;
    };

    const loadedNames: [string, string, string, string] = Array.isArray(parsed.playerNames)
      ? [
          resolveName(parsed.playerNames[0], DEFAULT_PLAYER_NAMES[0]),
          resolveName(parsed.playerNames[1], DEFAULT_PLAYER_NAMES[1]),
          resolveName(parsed.playerNames[2], DEFAULT_PLAYER_NAMES[2]),
          resolveName(parsed.playerNames[3], DEFAULT_PLAYER_NAMES[3]),
        ]
      : [...DEFAULT_PLAYER_NAMES];

    return {
      tableColor: ['green', 'blue', 'burgundy'].includes(parsed.tableColor)
        ? parsed.tableColor
        : DEFAULT_SETTINGS.tableColor,
      cardBackStyle: ['omani-khanjar', 'royal-blue', 'crimson-damask', 'emerald-luxury'].includes(parsed.cardBackStyle)
        ? parsed.cardBackStyle
        : DEFAULT_SETTINGS.cardBackStyle,
      soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : DEFAULT_SETTINGS.soundEnabled,
      fastAnimations: typeof parsed.fastAnimations === 'boolean' ? parsed.fastAnimations : DEFAULT_SETTINGS.fastAnimations,
      playerNames: loadedNames,
      watchMode: typeof parsed.watchMode === 'boolean' ? parsed.watchMode : (typeof window !== 'undefined' ? window.innerWidth <= 340 : false),
      difficulty: ['easy', 'medium', 'hard'].includes(parsed.difficulty) ? parsed.difficulty : DEFAULT_SETTINGS.difficulty,
    };
  } catch (err) {
    console.error('Failed to load settings from localStorage', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage', err);
  }
}

export function loadStats(playerNames?: [string, string, string, string]): GameStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    const names = playerNames || DEFAULT_PLAYER_NAMES;
    if (!raw) {
      return {
        totalRounds: 0,
        totalTricks: 0,
        highestContractMade: 0,
        players: {
          0: createInitialPlayerStats(0, names),
          1: createInitialPlayerStats(1, names),
          2: createInitialPlayerStats(2, names),
          3: createInitialPlayerStats(3, names),
        },
        roundHistory: [],
      };
    }
    const parsed = JSON.parse(raw);
    const players: Record<PlayerId, PlayerStats> = {
      0: { ...createInitialPlayerStats(0, names), ...(parsed.players?.[0] || {}), name: names[0] },
      1: { ...createInitialPlayerStats(1, names), ...(parsed.players?.[1] || {}), name: names[1] },
      2: { ...createInitialPlayerStats(2, names), ...(parsed.players?.[2] || {}), name: names[2] },
      3: { ...createInitialPlayerStats(3, names), ...(parsed.players?.[3] || {}), name: names[3] },
    };
    return {
      totalRounds: typeof parsed.totalRounds === 'number' ? parsed.totalRounds : 0,
      totalTricks: typeof parsed.totalTricks === 'number' ? parsed.totalTricks : 0,
      highestContractMade: typeof parsed.highestContractMade === 'number' ? parsed.highestContractMade : 0,
      players,
      roundHistory: Array.isArray(parsed.roundHistory) ? parsed.roundHistory : [],
    };
  } catch (err) {
    console.error('Failed to load stats from localStorage', err);
    return DEFAULT_STATS;
  }
}

export function saveStats(stats: GameStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error('Failed to save stats to localStorage', err);
  }
}

export function resetStoredStats(playerNames?: [string, string, string, string]): GameStats {
  const names = playerNames || DEFAULT_PLAYER_NAMES;
  const fresh: GameStats = {
    totalRounds: 0,
    totalTricks: 0,
    highestContractMade: 0,
    players: {
      0: createInitialPlayerStats(0, names),
      1: createInitialPlayerStats(1, names),
      2: createInitialPlayerStats(2, names),
      3: createInitialPlayerStats(3, names),
    },
    roundHistory: [],
  };
  saveStats(fresh);
  return fresh;
}
