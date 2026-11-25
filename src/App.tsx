import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, PlayerId, Phase, Suit, TrickCard, PlayHistoryItem, RoundEndDetails, RoundStats, CutPlayDetail } from './types/game';
import { GameSettings, GameStats, Difficulty } from './types/settings';
import {
  SUITS,
  SUIT_NAMES,
  PLAYER_NAMES,
  createDeck,
  shuffleDeck,
  sortHand,
  sortHandBySuit,
  sortHandByRank,
  sortHandAlternating,
  swapCardsInHand,
  moveCardInHand,
  estimate,
  getValidCardIndices,
  evaluateTrickWinner,
  teamOf,
  formatRank,
  isRed,
  getAiBid,
  getAiTrumpChoice,
  getAiPlayCard,
  evaluateRevealedCutChallenge,
  dealRandomHands,
  shouldAiDeclareMasoul,
  analyzePlayerHand,
} from './utils/gameLogic';
import {
  loadSettings,
  saveSettings,
  DEFAULT_SETTINGS,
  loadStats,
  saveStats,
  resetStoredStats,
} from './utils/storage';
import { sounds } from './utils/soundEffects';
import { CardView } from './components/CardView';
import { PlayerSeat } from './components/PlayerSeat';
import { ChallengeModal } from './components/ChallengeModal';
import { RulesModal } from './components/RulesModal';
import { RoundSummaryModal } from './components/RoundSummaryModal';
import { MasoulDecisionModal } from './components/MasoulDecisionModal';
import { TrickWinnerParticles } from './components/TrickWinnerParticles';
import { JokerParticles, JokerEffectData } from './components/JokerParticles';
import { SettingsModal } from './components/SettingsModal';
import { StatsModal } from './components/StatsModal';
import {
  Volume2,
  VolumeX,
  BookOpen,
  History,
  ShieldAlert,
  Crown,
  ChevronDown,
  Sparkles,
  Play,
  Settings,
  Trophy,
  ArrowDownAZ,
  ArrowLeftRight,
  Layers,
  ChevronRight,
  ChevronLeft,
  Watch,
  Menu,
  X,
  Gavel,
  Star,
  Flame,
  Check,
  Brain,
} from 'lucide-react';

interface FlyingCardAnim {
  id: string;
  card: Card;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  rot: number;
  startRot?: number;
  faceDown?: boolean;
  size?: 'xs' | 'sm';
  durationMs?: number;
  startScale?: number;
  endScale?: number;
}

export default function App() {
  // Settings & Persistent Stats state
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [stats, setStats] = useState<GameStats>(() => loadStats(settings.playerNames));

  // Screen size detection for Apple Watch / ultra-narrow viewports
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 360 : false
  );
  const [isWatchMenuOpen, setIsWatchMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 360);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isWatch = settings.watchMode || isSmallScreen;

  // Helper to dynamically get player name
  const getPlayerName = useCallback(
    (p: PlayerId) => {
      return settings.playerNames?.[p] || PLAYER_NAMES[p] || `لاعب ${p + 1}`;
    },
    [settings.playerNames]
  );

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isChallengeOpen, setIsChallengeOpen] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [roundDetails, setRoundDetails] = useState<RoundEndDetails | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);
  const [isLogExpanded, setIsLogExpanded] = useState<boolean>(false);

  // Game state
  const [round, setRound] = useState<number>(1);
  const [scores, setScores] = useState<[number, number]>([0, 0]); // [Team Us (0+2), Team Them (1+3)]
  const [phase, setPhase] = useState<Phase>('auction');
  const [turn, setTurn] = useState<PlayerId>(1);
  const [dealer, setDealer] = useState<PlayerId>(0);
  const [firstBidder, setFirstBidder] = useState<PlayerId>(1);

  // Auction & Trump state
  const [bids, setBids] = useState<(number | null)[]>([null, null, null, null]);
  const [bid, setBid] = useState<number>(0);
  const [bidder, setBidder] = useState<PlayerId | null>(null);
  const [auctionTurns, setAuctionTurns] = useState<number>(0);
  const [contract, setContract] = useState<number>(0);
  const [trump, setTrump] = useState<Suit | null>(null);

  // Hands & Tricks
  const [hands, setHands] = useState<Card[][]>([[], [], [], []]);
  const [initialUserHand, setInitialUserHand] = useState<Card[]>([]);
  const [trick, setTrick] = useState<TrickCard[]>([]);
  const [tricks, setTricks] = useState<[number, number]>([0, 0]); // [Team 0 tricks, Team 1 tricks]
  const [completedTricks, setCompletedTricks] = useState<number>(0);
  const [roundTricks, setRoundTricks] = useState<[number, number, number, number]>([0, 0, 0, 0]);
  const [roundCuts, setRoundCuts] = useState<[number, number, number, number]>([0, 0, 0, 0]);

  // Special Omani rules state
  const [blackPlayed, setBlackPlayed] = useState<boolean>(false);
  const [redFirstOwner, setRedFirstOwner] = useState<PlayerId | null>(null);
  const [blackLead, setBlackLead] = useState<boolean>(false);
  const [playHistory, setPlayHistory] = useState<PlayHistoryItem[]>([]);
  const [lastPlayed, setLastPlayed] = useState<PlayHistoryItem | null>(null);

  // UI helpers & visual effects
  const [soundEnabled, setSoundEnabled] = useState<boolean>(settings.soundEnabled);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('جارٍ بدء الجولة الأولى...');

  // Visual effects: Selection & Drag-and-drop
  const [selectedCardIdx, setSelectedCardIdx] = useState<number | null>(null);
  const [draggedCardIdx, setDraggedCardIdx] = useState<number | null>(null);
  const [trickWinner, setTrickWinner] = useState<PlayerId | null>(null);
  const [winningCardId, setWinningCardId] = useState<string | null>(null);

  // Flying card animations & stacked team trick piles
  const [flyingCards, setFlyingCards] = useState<FlyingCardAnim[]>([]);
  const [isCollectingTrick, setIsCollectingTrick] = useState<boolean>(false);
  const [collectWinner, setCollectWinner] = useState<PlayerId | null>(null);
  const [teamTrickPiles, setTeamTrickPiles] = useState<[TrickCard[][], TrickCard[][]]>([[], []]);
  const [isDealing, setIsDealing] = useState<boolean>(false);
  const [tableAnimPhase, setTableAnimPhase] = useState<'idle' | 'gathering' | 'shuffling' | 'dealing'>('idle');
  const [centerDeckCount, setCenterDeckCount] = useState<number>(0);
  const [dealingTarget, setDealingTarget] = useState<PlayerId | null>(null);
  const [recentDealtIds, setRecentDealtIds] = useState<Set<string>>(new Set());
  const [activeJokerEffect, setActiveJokerEffect] = useState<JokerEffectData | null>(null);
  const [activeTrumpPlay, setActiveTrumpPlay] = useState<{
    player: PlayerId;
    isCut: boolean;
    suit: Suit;
  } | null>(null);
  const [activeBidPulse, setActiveBidPulse] = useState<{
    player: PlayerId;
    amount: number;
    key: number;
  } | null>(null);

  // Bound (باوند) & Mas'oul (مسؤول) rule states
  const [isMasoul, setIsMasoul] = useState<boolean>(false);
  const [originalContract, setOriginalContract] = useState<number>(6);
  const [isMasoulModalOpen, setIsMasoulModalOpen] = useState<boolean>(false);
  const [masoulAnnounceBanner, setMasoulAnnounceBanner] = useState<{ text: string; subtext?: string } | null>(null);
  const [pendingMasoulContext, setPendingMasoulContext] = useState<{
    winner: PlayerId;
    nextCompletedTricks: number;
    nextRoundTricks: [number, number, number, number];
    nextRoundCuts: [number, number, number, number];
    historyItem: PlayHistoryItem;
    redJokerHolder: PlayerId | -1;
    nextHands: Card[][];
  } | null>(null);

  // Refs for tracking DOM rects, live card state, and async timeouts
  const tableRef = useRef<HTMLDivElement>(null);
  const handRef = useRef<HTMLDivElement>(null);
  const autoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dealTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const bidPulseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handsRef = useRef<Card[][]>(hands);
  const trickRef = useRef<TrickCard[]>(trick);
  const teamTrickPilesRef = useRef<[TrickCard[][], TrickCard[][]]>(teamTrickPiles);
  const phaseRef = useRef<Phase>(phase);
  const isSummaryOpenRef = useRef<boolean>(isSummaryOpen);

  const triggerBidPulse = useCallback((p: PlayerId, amount: number) => {
    if (bidPulseTimeoutRef.current) {
      clearTimeout(bidPulseTimeoutRef.current);
      bidPulseTimeoutRef.current = null;
    }
    const key = Date.now() + p;
    setActiveBidPulse({ player: p, amount, key });
    bidPulseTimeoutRef.current = setTimeout(() => {
      setActiveBidPulse((curr) => (curr && curr.key === key ? null : curr));
      bidPulseTimeoutRef.current = null;
    }, amount === 0 ? 750 : 1200);
  }, []);

  handsRef.current = hands;
  trickRef.current = trick;
  teamTrickPilesRef.current = teamTrickPiles;
  phaseRef.current = phase;
  isSummaryOpenRef.current = isSummaryOpen;

  useEffect(() => {
    if (phase !== 'play' || isSummaryOpen || isMasoulModalOpen) {
      setIsChallengeOpen(false);
    }
  }, [phase, isSummaryOpen, isMasoulModalOpen]);

  const clearDealTimeouts = useCallback(() => {
    dealTimeoutsRef.current.forEach((t) => clearTimeout(t));
    dealTimeoutsRef.current = [];
  }, []);

  const spawnFlyingCard = useCallback((anim: FlyingCardAnim) => {
    const duration = anim.durationMs ?? 380;
    setFlyingCards((prev) => [...prev, anim]);
    const t = setTimeout(() => {
      setFlyingCards((prev) => prev.filter((f) => f.id !== anim.id));
    }, duration + 40);
    dealTimeoutsRef.current.push(t);
  }, []);

  // Subtle card shake system:
  // - 'turn': gentle staggered wave when the turn passes to the human player
  // - 'challenge': light alert tremor when receiving a "كشف مقاطعة" alert
  const [cardShakeMode, setCardShakeMode] = useState<'turn' | 'challenge' | null>(null);
  const cardShakeModeRef = useRef<'turn' | 'challenge' | null>(null);
  const cardShakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevHumanTurnActiveRef = useRef<boolean>(false);
  const prevHumanTurnPhaseRef = useRef<Phase>('auction');

  const triggerCardShake = useCallback(
    (mode: 'turn' | 'challenge') => {
      if (cardShakeTimeoutRef.current) {
        clearTimeout(cardShakeTimeoutRef.current);
        cardShakeTimeoutRef.current = null;
      }

      const startShake = () => {
        cardShakeModeRef.current = mode;
        setCardShakeMode(mode);
        const duration =
          mode === 'challenge'
            ? settings.fastAnimations
              ? 550
              : 750
            : settings.fastAnimations
            ? 500
            : 700;
        cardShakeTimeoutRef.current = setTimeout(() => {
          cardShakeModeRef.current = null;
          setCardShakeMode(null);
          cardShakeTimeoutRef.current = null;
        }, duration);
      };

      if (cardShakeModeRef.current === mode) {
        cardShakeModeRef.current = null;
        setCardShakeMode(null);
        requestAnimationFrame(startShake);
      } else {
        startShake();
      }
    },
    [settings.fastAnimations]
  );

  // Audio helper
  const addLog = useCallback((msg: string) => {
    setLogMessages((prev) => [msg, ...prev.slice(0, 30)]);
  }, []);

  const toggleSound = () => {
    const next = sounds.toggle();
    setSoundEnabled(next);
    setSettings((prev) => {
      const updated = { ...prev, soundEnabled: next };
      saveSettings(updated);
      return updated;
    });
  };

  const handleUpdateSettings = (partial: Partial<GameSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      if (partial.soundEnabled !== undefined) {
        sounds.setEnabled(partial.soundEnabled);
        setSoundEnabled(partial.soundEnabled);
      }
      if (partial.playerNames) {
        setStats((currStats) => {
          const updated = {
            ...currStats,
            players: {
              0: { ...currStats.players[0], name: partial.playerNames![0] },
              1: { ...currStats.players[1], name: partial.playerNames![1] },
              2: { ...currStats.players[2], name: partial.playerNames![2] },
              3: { ...currStats.players[3], name: partial.playerNames![3] },
            },
          };
          saveStats(updated);
          return updated;
        });
      }
      return next;
    });
  };

  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
    sounds.setEnabled(DEFAULT_SETTINGS.soundEnabled);
    setSoundEnabled(DEFAULT_SETTINGS.soundEnabled);
    setStats((currStats) => {
      const updated = {
        ...currStats,
        players: {
          0: { ...currStats.players[0], name: DEFAULT_SETTINGS.playerNames[0] },
          1: { ...currStats.players[1], name: DEFAULT_SETTINGS.playerNames[1] },
          2: { ...currStats.players[2], name: DEFAULT_SETTINGS.playerNames[2] },
          3: { ...currStats.players[3], name: DEFAULT_SETTINGS.playerNames[3] },
        },
      };
      saveStats(updated);
      return updated;
    });
    sounds.playClick();
  };

  const handleResetStats = () => {
    const fresh = resetStoredStats(settings.playerNames);
    setStats(fresh);
    sounds.playClick();
  };

  const cycleDifficulty = () => {
    sounds.playClick();
    const nextDiff: Record<Difficulty, Difficulty> = {
      easy: 'medium',
      medium: 'hard',
      hard: 'easy',
    };
    const currentDiff = settings.difficulty || 'medium';
    const newDifficulty = nextDiff[currentDiff];
    handleUpdateSettings({ difficulty: newDifficulty });
    const diffNames: Record<Difficulty, string> = {
      easy: 'سهل (مبسط)',
      medium: 'متوسط (متوازن)',
      hard: 'محترف (تكتيك عالي)',
    };
    setStatusMessage(`مستوى ذكاء البوتات: ${diffNames[newDifficulty]}`);
    addLog(`تم ضبط ذكاء الكمبيوتر: ${diffNames[newDifficulty]}`);
  };

  // Helper to record an auction contract bid attempt in persistent stats
  const recordContractAttempt = useCallback((p: PlayerId) => {
    setStats((prev) => {
      const next: GameStats = {
        ...prev,
        players: {
          ...prev.players,
          [p]: {
            ...prev.players[p],
            contractsBid: prev.players[p].contractsBid + 1,
          },
        },
      };
      saveStats(next);
      return next;
    });
  }, []);

  // Helper to record a trick won in persistent stats
  const recordTrickWin = useCallback((winner: PlayerId) => {
    setStats((prev) => {
      const next: GameStats = {
        ...prev,
        totalTricks: prev.totalTricks + 1,
        players: {
          ...prev.players,
          [winner]: {
            ...prev.players[winner],
            tricksWon: prev.players[winner].tricksWon + 1,
          },
        },
      };
      saveStats(next);
      return next;
    });
  }, []);

  // Helper to record round outcomes into persistent stats
  const recordRoundResult = useCallback(
    (
      winningTeam: number,
      reason: string,
      pointsAwarded: number,
      buyer: PlayerId | null,
      contractVal: number,
      trumpSuit: Suit | null,
      isCheatSuccess: boolean = false,
      challenger?: PlayerId
    ) => {
      setStats((prev) => {
        const buyingPlayer = buyer !== null ? buyer : 0;
        const isContractAchieved = winningTeam === teamOf(buyingPlayer);

        const updatedPlayers = { ...prev.players };

        if (buyer !== null) {
          if (reason.includes('نجاح') || isContractAchieved) {
            updatedPlayers[buyingPlayer] = {
              ...updatedPlayers[buyingPlayer],
              contractsWon: updatedPlayers[buyingPlayer].contractsWon + 1,
            };
          } else if (reason.includes('سقوط')) {
            updatedPlayers[buyingPlayer] = {
              ...updatedPlayers[buyingPlayer],
              contractsLost: updatedPlayers[buyingPlayer].contractsLost + 1,
            };
          }
        }

        if (isCheatSuccess && challenger !== undefined) {
          const chId = challenger;
          updatedPlayers[chId] = {
            ...updatedPlayers[chId],
            cheatsCaught: (updatedPlayers[chId]?.cheatsCaught || 0) + 1,
          };
        }

        const next: GameStats = {
          ...prev,
          totalRounds: prev.totalRounds + 1,
          highestContractMade:
            isContractAchieved && contractVal > 0
              ? Math.max(prev.highestContractMade, contractVal)
              : prev.highestContractMade,
          players: updatedPlayers,
          roundHistory: [
            {
              round,
              bidder: buyingPlayer,
              contract: contractVal,
              trump: trumpSuit,
              winningTeam,
              reason,
              points: pointsAwarded,
              timestamp: Date.now(),
              challenger,
              challengeSuccess: isCheatSuccess,
            },
            ...prev.roundHistory.slice(0, 49),
          ],
        };
        saveStats(next);
        return next;
      });
    },
    [round]
  );

  // -------------------------------------------------------------
  // HAND SORTING & REORDERING HANDLERS
  // -------------------------------------------------------------
  const handleSortBySuit = () => {
    sounds.playCardPlaySound();
    setHands((prev) => {
      const next = [...prev];
      next[0] = sortHandBySuit(next[0], trump);
      return next;
    });
    setSelectedCardIdx(null);
  };

  const handleSortByRank = () => {
    sounds.playCardPlaySound();
    setHands((prev) => {
      const next = [...prev];
      next[0] = sortHandByRank(next[0], true);
      return next;
    });
    setSelectedCardIdx(null);
  };

  const handleSortAlternating = () => {
    sounds.playCardPlaySound();
    setHands((prev) => {
      const next = [...prev];
      next[0] = sortHandAlternating(next[0]);
      return next;
    });
    setSelectedCardIdx(null);
  };

  const handleReverseHand = () => {
    sounds.playCardPlaySound();
    setHands((prev) => {
      const next = [...prev];
      next[0] = [...next[0]].reverse();
      return next;
    });
    setSelectedCardIdx(null);
  };

  const handleShiftCard = (fromIdx: number, direction: number) => {
    const toIdx = fromIdx + direction;
    if (toIdx < 0 || toIdx >= hands[0].length) return;
    sounds.playClick();
    setHands((prev) => {
      const next = [...prev];
      next[0] = swapCardsInHand(next[0], fromIdx, toIdx);
      return next;
    });
    setSelectedCardIdx(toIdx);
  };

  const handleDragStart = (idx: number) => {
    setDraggedCardIdx(idx);
  };

  const handleDropOnCard = (targetIdx: number) => {
    if (draggedCardIdx === null || draggedCardIdx === targetIdx) {
      setDraggedCardIdx(null);
      return;
    }
    setHands((prev) => {
      const next = [...prev];
      next[0] = moveCardInHand(next[0], draggedCardIdx, targetIdx);
      return next;
    });
    sounds.playClick();
    setSelectedCardIdx(targetIdx);
    setDraggedCardIdx(null);
  };

  // -------------------------------------------------------------
  // START A NEW ROUND
  // -------------------------------------------------------------
  const startNewRound = useCallback(
    (nextRoundNum?: number) => {
      const currentRound = nextRoundNum !== undefined ? nextRoundNum : round;
      if (nextRoundNum !== undefined) setRound(nextRoundNum);

      if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
      clearDealTimeouts();

      const prevHands = handsRef.current;
      const prevTrick = trickRef.current;
      const prevPiles = teamTrickPilesRef.current;
      const hasCardsToGather =
        prevHands.some((h) => h.length > 0) ||
        prevTrick.length > 0 ||
        prevPiles[0].length > 0 ||
        prevPiles[1].length > 0;

      const d = ((currentRound - 1) % 4) as PlayerId;
      const fb = ((d + 1) % 4) as PlayerId;

      const deck = shuffleDeck(createDeck());
      const fullHands = dealRandomHands(deck);
      const sortedFinalHands = fullHands.map((h) => sortHand(h));

      // Helper to resolve center deck screen coords cleanly
      const getCenterCoords = () => {
        const centerEl = document.getElementById('center-deck-pile');
        const tableEl = tableRef.current;
        const cardW = isWatch ? 40 : 48;
        const cardH = isWatch ? 60 : 68;
        if (centerEl) {
          const r = centerEl.getBoundingClientRect();
          if (r.width > 0) {
            return {
              x: r.left + r.width / 2 - cardW / 2,
              y: r.top + r.height / 2 - cardH / 2,
            };
          }
        }
        if (tableEl) {
          const r = tableEl.getBoundingClientRect();
          return {
            x: r.left + r.width / 2 - cardW / 2,
            y: r.top + r.height / 2 - cardH / 2,
          };
        }
        return {
          x: (typeof window !== 'undefined' ? window.innerWidth / 2 : 300) - cardW / 2,
          y: 200,
        };
      };

      const getPlayerTargetCoords = (targetPlayer: PlayerId, cardSlotOffset: number) => {
        const cardW = isWatch ? 40 : 48;
        const cardH = isWatch ? 60 : 68;
        if (targetPlayer === 0) {
          const handEl = handRef.current;
          if (handEl) {
            const r = handEl.getBoundingClientRect();
            return {
              x: r.left + r.width / 2 - cardW / 2 + cardSlotOffset * (isWatch ? 14 : 22),
              y: r.top + Math.max(4, r.height / 2 - cardH / 2),
            };
          }
        }
        const seatEl = document.getElementById(`seat-${targetPlayer}`);
        if (seatEl) {
          const r = seatEl.getBoundingClientRect();
          return {
            x: r.left + r.width / 2 - cardW / 2 + cardSlotOffset * 4,
            y: r.top + r.height / 2 - cardH / 2,
          };
        }
        return getCenterCoords();
      };

      // Capture exact screen coordinates of won trick bundles, table cards, and hand cards BEFORE resetting state
      const preCapturedPileRects: Record<string, DOMRect | undefined> = {};
      ([0, 1] as const).forEach((teamIdx) => {
        const fallbackRect = document.getElementById(`team-stack-${teamIdx}`)?.getBoundingClientRect();
        prevPiles[teamIdx].forEach((_, pIdx) => {
          preCapturedPileRects[`${teamIdx}-${pIdx}`] =
            document.getElementById(`team-stack-${teamIdx}-item-${pIdx}`)?.getBoundingClientRect() || fallbackRect;
        });
      });
      const preCapturedTrickRects: Record<number, DOMRect | undefined> = {};
      prevTrick.forEach((tc) => {
        preCapturedTrickRects[tc.p] = document.getElementById(`played-slot-${tc.p}`)?.getBoundingClientRect();
      });
      const preCapturedHandCardRects: Record<string, DOMRect | undefined> = {};
      prevHands[0].slice(0, 6).forEach((c) => {
        preCapturedHandCardRects[c.id] = document.querySelector(`[data-card-id="${c.id}"]`)?.getBoundingClientRect();
      });
      const preCapturedHandBoxRect = handRef.current?.getBoundingClientRect();
      const preCapturedSeatRects: Record<number, DOMRect | undefined> = {
        0: document.getElementById('seat-0')?.getBoundingClientRect(),
        1: document.getElementById('seat-1')?.getBoundingClientRect(),
        2: document.getElementById('seat-2')?.getBoundingClientRect(),
        3: document.getElementById('seat-3')?.getBoundingClientRect(),
      };

      setDealer(d);
      setFirstBidder(fb);
      setTurn(fb);
      setBids([null, null, null, null]);
      setBid(0);
      setBidder(null);
      setAuctionTurns(0);
      setContract(0);
      setTrump(null);
      setHands([[], [], [], []]);
      setTeamTrickPiles([[], []]);
      setInitialUserHand(sortedFinalHands[0]);
      setTrick([]);
      setTricks([0, 0]);
      setCompletedTricks(0);
      setRoundTricks([0, 0, 0, 0]);
      setRoundCuts([0, 0, 0, 0]);
      setBlackPlayed(false);
      setRedFirstOwner(null);
      setBlackLead(false);
      setPlayHistory([]);
      setLastPlayed(null);
      setSelectedCardIdx(null);
      setTrickWinner(null);
      setWinningCardId(null);
      setActiveJokerEffect(null);
      setActiveTrumpPlay(null);
      if (bidPulseTimeoutRef.current) {
        clearTimeout(bidPulseTimeoutRef.current);
        bidPulseTimeoutRef.current = null;
      }
      setActiveBidPulse(null);
      setIsMasoul(false);
      setOriginalContract(6);
      setIsMasoulModalOpen(false);
      setMasoulAnnounceBanner(null);
      setPendingMasoulContext(null);
      setPhase('auction');
      setIsCollectingTrick(false);
      setCollectWinner(null);
      setIsSummaryOpen(false);
      setRoundDetails(null);
      setIsBusy(false);
      setFlyingCards([]);
      if (cardShakeTimeoutRef.current) {
        clearTimeout(cardShakeTimeoutRef.current);
        cardShakeTimeoutRef.current = null;
      }
      cardShakeModeRef.current = null;
      setCardShakeMode(null);
      prevHumanTurnActiveRef.current = false;

      setIsDealing(true);
      setDealingTarget(null);
      setRecentDealtIds(new Set());

      const gatherFlyMs = isWatch ? 220 : settings.fastAnimations ? 320 : 520;
      const gatherTotalMs = hasCardsToGather ? (isWatch ? 320 : settings.fastAnimations ? 440 : 720) : 0;
      const shuffleDurationMs = hasCardsToGather
        ? (isWatch ? 360 : settings.fastAnimations ? 520 : 940)
        : (isWatch ? 220 : settings.fastAnimations ? 360 : 580);

      // Phase A (if ending a previous round): Gather all won trick piles & remaining cards into the center
      if (hasCardsToGather) {
        setTableAnimPhase('gathering');
        setCenterDeckCount(0);
        setStatusMessage('جارٍ جمع اللمات والأوراق في المنتصف...');
        sounds.playCollectSound();

        const gStart = setTimeout(() => {
          const dest = getCenterCoords();
          const cardW = isWatch ? 40 : 48;
          const cardH = isWatch ? 60 : 68;
          let idxCounter = 0;

          // 1. Gather won trick bundles from both teams (each sitting side-by-side)
          ([0, 1] as const).forEach((teamIdx) => {
            const pile = prevPiles[teamIdx];
            pile.forEach((trickArr, pIdx) => {
              const sampleCard = trickArr[0]?.c || fullHands[0][0];
              const itemRect = preCapturedPileRects[`${teamIdx}-${pIdx}`];
              const startX = itemRect
                ? itemRect.left
                : dest.x + (teamIdx === 0 ? -90 + pIdx * 16 : 90 - pIdx * 16);
              const startY = itemRect
                ? itemRect.top
                : dest.y + (teamIdx === 0 ? 50 : -50);
              const stagger = (idxCounter++) * (isWatch ? 14 : 26);

              const tFly = setTimeout(() => {
                spawnFlyingCard({
                  id: `gather-pile-${teamIdx}-${pIdx}-${Date.now()}`,
                  card: sampleCard,
                  startX,
                  startY,
                  endX: dest.x,
                  endY: dest.y,
                  startRot: (pIdx % 2 === 0 ? -4 : 4),
                  rot: (Math.random() - 0.5) * 10,
                  faceDown: true,
                  size: isWatch ? 'xs' : 'sm',
                  durationMs: gatherFlyMs,
                  startScale: 0.72,
                  endScale: 1,
                });
                setCenterDeckCount((prev) => Math.min(36, prev + 4));
              }, stagger);
              dealTimeoutsRef.current.push(tFly);
            });
          });

          // 2. Gather any cards still on table slots
          prevTrick.forEach((tc, tIdx) => {
            const sRect = preCapturedTrickRects[tc.p];
            const startX = sRect ? sRect.left : dest.x;
            const startY = sRect ? sRect.top : dest.y;
            const stagger = (idxCounter++) * (isWatch ? 12 : 22);
            const tFly = setTimeout(() => {
              spawnFlyingCard({
                id: `gather-trick-${tc.p}-${tIdx}-${Date.now()}`,
                card: tc.c,
                startX,
                startY,
                endX: dest.x,
                endY: dest.y,
                rot: (Math.random() - 0.5) * 12,
                faceDown: true,
                size: isWatch ? 'xs' : 'sm',
                durationMs: gatherFlyMs,
              });
              setCenterDeckCount((prev) => Math.min(36, prev + 1));
            }, stagger);
            dealTimeoutsRef.current.push(tFly);
          });

          // 3. Gather remaining unplayed cards from all 4 players
          ([0, 1, 2, 3] as PlayerId[]).forEach((pId) => {
            const pHand = prevHands[pId];
            if (!pHand.length) return;
            const repCount = pId === 0 ? Math.min(pHand.length, 6) : Math.min(pHand.length, 3);
            const seatRect = preCapturedSeatRects[pId];

            for (let k = 0; k < repCount; k++) {
              const cardObj = pHand[k];
              let startX = dest.x;
              let startY = dest.y;
              if (pId === 0) {
                const cRect = preCapturedHandCardRects[cardObj.id];
                if (cRect) {
                  startX = cRect.left;
                  startY = cRect.top;
                } else if (preCapturedHandBoxRect) {
                  startX = preCapturedHandBoxRect.left + preCapturedHandBoxRect.width / 2 - cardW / 2 + (k - repCount / 2) * 18;
                  startY = preCapturedHandBoxRect.top;
                }
              } else if (seatRect) {
                startX = seatRect.left + seatRect.width / 2 - cardW / 2;
                startY = seatRect.top + seatRect.height / 2 - cardH / 2;
              }
              const stagger = (idxCounter++) * (isWatch ? 10 : 18);
              const tFly = setTimeout(() => {
                spawnFlyingCard({
                  id: `gather-hand-${pId}-${k}-${Date.now()}`,
                  card: cardObj,
                  startX,
                  startY,
                  endX: dest.x,
                  endY: dest.y,
                  rot: (Math.random() - 0.5) * 14,
                  faceDown: true,
                  size: isWatch ? 'xs' : 'sm',
                  durationMs: gatherFlyMs,
                });
                setCenterDeckCount((prev) => Math.min(36, prev + Math.ceil(pHand.length / repCount)));
              }, stagger);
              dealTimeoutsRef.current.push(tFly);
            }
          });
        }, 30);
        dealTimeoutsRef.current.push(gStart);
      }

      // Phase B: Riffle shuffle ("خبص الورق") in the center
      const shuffleStartTimer = setTimeout(() => {
        setTableAnimPhase('shuffling');
        setCenterDeckCount(36);
        setStatusMessage('جارٍ خبص الأوراق في المنتصف...');
        sounds.playShuffleSound();

        if (!isWatch && !settings.fastAnimations) {
          const secondShuffleSound = setTimeout(() => sounds.playShuffleSound(), 440);
          dealTimeoutsRef.current.push(secondShuffleSound);
        }
      }, gatherTotalMs);
      dealTimeoutsRef.current.push(shuffleStartTimer);

      // Phase C: Deal 3-by-3 slowly from center deck across the table to each player
      const dealStartMs = gatherTotalMs + shuffleDurationMs;
      const dealOrder: PlayerId[] = [
        fb,
        ((fb + 1) % 4) as PlayerId,
        ((fb + 2) % 4) as PlayerId,
        d,
      ];
      const stepDelay = isWatch ? 220 : settings.fastAnimations ? 380 : 760;
      const flyDuration = isWatch ? 170 : settings.fastAnimations ? 230 : 380;
      const arriveOffset = Math.round(flyDuration * 0.85);

      const dealPhaseStartTimer = setTimeout(() => {
        setTableAnimPhase('dealing');
        setCenterDeckCount(36);
        setStatusMessage('جارٍ توزيع الأوراق من المنتصف (٣×٣)...');
      }, dealStartMs);
      dealTimeoutsRef.current.push(dealPhaseStartTimer);

      for (let roundIdx = 0; roundIdx < 3; roundIdx++) {
        for (let seatIdx = 0; seatIdx < 4; seatIdx++) {
          const step = roundIdx * 4 + seatIdx;
          const targetPlayer = dealOrder[seatIdx];
          const chunk = fullHands[targetPlayer].slice(roundIdx * 3, roundIdx * 3 + 3);
          const cardsSoFar = (roundIdx + 1) * 3;
          const remainingAfter = Math.max(0, 36 - (step + 1) * 3);

          const tLaunch = setTimeout(() => {
            setDealingTarget(targetPlayer);
            setCenterDeckCount(remainingAfter);

            const origin = getCenterCoords();

            // Launch 3 fanned face-down cards from center deck across table to player's seat/hand
            chunk.forEach((cardItem, cIdx) => {
              const targetCoords = getPlayerTargetCoords(targetPlayer, cIdx - 1);
              const staggerMs = cIdx * (isWatch ? 25 : 55);
              const st = setTimeout(() => {
                sounds.playDealSound(cIdx + roundIdx);
                spawnFlyingCard({
                  id: `deal-fly-${step}-${cIdx}-${cardItem.id}`,
                  card: cardItem,
                  startX: origin.x + (cIdx - 1) * 2,
                  startY: origin.y - cIdx * 1.5,
                  endX: targetCoords.x,
                  endY: targetCoords.y,
                  startRot: (cIdx - 1) * 3,
                  rot: (cIdx - 1) * 8,
                  faceDown: true,
                  size: isWatch ? 'xs' : 'sm',
                  durationMs: flyDuration,
                  startScale: 0.95,
                  endScale: targetPlayer === 0 ? 1 : 0.86,
                });
              }, staggerMs);
              dealTimeoutsRef.current.push(st);
            });

            if (targetPlayer === 0) {
              setStatusMessage(`استلام ٣ أوراق (${cardsSoFar}/٩)...`);
            } else {
              setStatusMessage(`توزيع ٣×٣: يتجه إلى ${getPlayerName(targetPlayer)}...`);
            }

            // Cards land in the player's hand right as flight completes
            const tArrive = setTimeout(() => {
              setHands((prev) => {
                const next = prev.map((h) => [...h]);
                next[targetPlayer] = [...next[targetPlayer], ...chunk];
                return next;
              });

              if (targetPlayer === 0) {
                setRecentDealtIds(new Set(chunk.map((c) => c.id)));
                setStatusMessage(`استلمت ٣ أوراق (${cardsSoFar}/٩)`);
              } else {
                setRecentDealtIds(new Set());
              }
            }, arriveOffset);
            dealTimeoutsRef.current.push(tArrive);
          }, dealStartMs + 60 + step * stepDelay);

          dealTimeoutsRef.current.push(tLaunch);
        }
      }

      const settleDelay = isWatch ? 250 : settings.fastAnimations ? 360 : 650;
      const finishTimer = setTimeout(() => {
        setTableAnimPhase('idle');
        setCenterDeckCount(0);
        setDealingTarget(null);
        setRecentDealtIds(new Set());
        setHands(sortedFinalHands);
        setIsDealing(false);
        setStatusMessage(`المزايدة تبدأ من: ${getPlayerName(fb)}`);
      }, dealStartMs + 60 + 11 * stepDelay + arriveOffset + settleDelay);
      dealTimeoutsRef.current.push(finishTimer);

      addLog(`بدأت الجولة ${currentRound}. الموزّع: ${getPlayerName(d)}`);
    },
    [round, settings.fastAnimations, isWatch, getPlayerName, addLog, clearDealTimeouts, spawnFlyingCard]
  );

  useEffect(() => {
    startNewRound(1);
    sounds.setEnabled(settings.soundEnabled);
    setSoundEnabled(settings.soundEnabled);
    return () => {
      if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
      if (bidPulseTimeoutRef.current) clearTimeout(bidPulseTimeoutRef.current);
      clearDealTimeouts();
    };
  }, []);

  // -------------------------------------------------------------
  // AUCTION FINISH
  // -------------------------------------------------------------
  const finishAuction = useCallback(() => {
    if (bidder === null) {
      const forcedBidder = ((firstBidder + 3) % 4) as PlayerId;
      setBidder(forcedBidder);
      setContract(5);
      setBids((prev) => {
        const next = [...prev];
        next[forcedBidder] = 5;
        return next;
      });
      sounds.playBidSound(5);
      triggerBidPulse(forcedBidder, 5);
      recordContractAttempt(forcedBidder);
      addLog(`مرّ الجميع! ${getPlayerName(forcedBidder)} ملزوم بشراء ٥`);
      setStatusMessage(`${getPlayerName(forcedBidder)} ملزوم بشراء ٥. اختر الحكم!`);
      setPhase('trump');
      setTurn(forcedBidder);
    } else {
      setContract(bid);
      recordContractAttempt(bidder);
      addLog(`فاز ${getPlayerName(bidder)} بالشراء بقيمة ${bid}`);
      setStatusMessage(`فاز ${getPlayerName(bidder)} بالشراء (${bid}). اختر الحكم!`);
      setPhase('trump');
      setTurn(bidder);
    }
  }, [bid, bidder, firstBidder, recordContractAttempt, getPlayerName, addLog, triggerBidPulse]);

  // -------------------------------------------------------------
  // PLACE BID OR PASS
  // -------------------------------------------------------------
  const handleBid = useCallback(
    (p: PlayerId, amount: number) => {
      // Authentic Omani rules: minimum bid is 6, except dealer when everyone passed (5)
      const isDealerPrivilege5 = amount === 5 && dealer === p && bidder === null;
      if (amount < 6 && !isDealerPrivilege5) return;
      if (bid > 0 && amount <= bid) return;

      sounds.playBidSound(amount);
      triggerBidPulse(p, amount);
      setBid(amount);
      setBidder(p);
      setBids((prev) => {
        const next = [...prev];
        next[p] = amount;
        return next;
      });

      const nextTurns = auctionTurns + 1;
      setAuctionTurns(nextTurns);
      addLog(`${getPlayerName(p)} اشترى ${amount}`);

      if (nextTurns === 4 || amount === 9) {
        recordContractAttempt(p);
        const endDelay = settings.fastAnimations || isWatch ? 420 : 760;
        setTimeout(() => {
          setPhase('trump');
          setContract(amount);
          setTurn(p);
          addLog(`فاز ${getPlayerName(p)} بالشراء (${amount})`);
          setStatusMessage(`فاز ${getPlayerName(p)} بالشراء (${amount}). في انتظار تحديد الحكم.`);
        }, endDelay);
      } else {
        const nextTurn = ((turn + 1) % 4) as PlayerId;
        setTurn(nextTurn);
      }
    },
    [auctionTurns, turn, dealer, bidder, bid, settings.fastAnimations, isWatch, recordContractAttempt, getPlayerName, addLog, triggerBidPulse]
  );

  const handlePass = useCallback(
    (p: PlayerId) => {
      sounds.playPassSound();
      triggerBidPulse(p, 0);
      setBids((prev) => {
        const next = [...prev];
        next[p] = 0;
        return next;
      });

      const nextTurns = auctionTurns + 1;
      setAuctionTurns(nextTurns);
      addLog(`${getPlayerName(p)}: طاف`);

      if (nextTurns === 4) {
        const endDelay = settings.fastAnimations || isWatch ? 340 : 580;
        setTimeout(finishAuction, endDelay);
      } else {
        const nextTurn = ((turn + 1) % 4) as PlayerId;
        setTurn(nextTurn);
      }
    },
    [auctionTurns, finishAuction, turn, settings.fastAnimations, isWatch, getPlayerName, addLog, triggerBidPulse]
  );

  // -------------------------------------------------------------
  // SELECT TRUMP
  // -------------------------------------------------------------
  const handleSelectTrump = useCallback(
    (selectedSuit: Suit) => {
      sounds.playTrumpSound();
      setTrump(selectedSuit);
      setHands((prev) => {
        const next = [...prev];
        next[0] = sortHandBySuit(next[0], selectedSuit);
        return next;
      });
      setPhase('play');

      const leadPlayer = (((bidder ?? 0) + 1) % 4) as PlayerId;
      setTurn(leadPlayer);
      if (contract === 8) {
        addLog(`تم تحديد الحكم: ${selectedSuit} (${SUIT_NAMES[selectedSuit]}) — انزل لي (٨). يبدأ اللمّة: ${getPlayerName(leadPlayer)}`);
        setStatusMessage(`انزل لي (٨) • الحكم: ${selectedSuit} ${SUIT_NAMES[selectedSuit]} — إجباري حكم (${getPlayerName(leadPlayer)})`);
      } else {
        addLog(`تم تحديد الحكم: ${selectedSuit} (${SUIT_NAMES[selectedSuit]}). يبدأ اللمّة: ${getPlayerName(leadPlayer)}`);
        setStatusMessage(`الحكم: ${selectedSuit} ${SUIT_NAMES[selectedSuit]} — اللمّة ١: دور ${getPlayerName(leadPlayer)}`);
      }
    },
    [bidder, contract, getPlayerName, addLog]
  );

  // -------------------------------------------------------------
  // HELPER TO COMPILE ROUND STATISTICS
  // -------------------------------------------------------------
  const computeRoundStats = useCallback(
    (
      tricksArr: [number, number, number, number],
      cutsArr: [number, number, number, number],
      completedCount: number,
      history: PlayHistoryItem[],
      outcome?: { reason?: RoundEndDetails['reason']; winningTeam?: number; contractVal?: number }
    ): RoundStats => {
      const maxCuts = Math.max(...cutsArr);
      let mostCutsPlayer: RoundStats['mostCutsPlayer'] = null;

      if (maxCuts > 0) {
        const topPlayers = ([0, 1, 2, 3] as PlayerId[]).filter((pl) => cutsArr[pl] === maxCuts);
        if (topPlayers.length === 1) {
          mostCutsPlayer = {
            player: topPlayers[0],
            count: maxCuts,
            name: getPlayerName(topPlayers[0]),
            tied: false,
          };
        } else {
          mostCutsPlayer = {
            player: topPlayers[0],
            count: maxCuts,
            name: topPlayers.map((pl) => getPlayerName(pl)).join(' و '),
            tied: true,
            tiedPlayers: topPlayers.map((pl) => getPlayerName(pl)),
          };
        }
      }

      const blackItem = history.find((h) => h.c.j === 'B');
      const redItem = history.find((h) => h.c.j === 'R');

      const cutsDetails: CutPlayDetail[] = history
        .filter((h) => h.cheated && !h.c.j)
        .map((h) => ({
          player: h.p,
          card: h.c,
          trick: h.trick,
          requiredSuit: h.required || undefined,
          isTrumpCut: trump !== null && h.c.s === trump,
        }));

      const handAnalysis =
        initialUserHand.length > 0
          ? analyzePlayerHand(
              initialUserHand,
              trump,
              bidder,
              outcome?.contractVal ?? contract,
              {
                reason: outcome?.reason,
                winningTeam: outcome?.winningTeam,
                userTricksWon: tricksArr[0],
              }
            )
          : undefined;

      return {
        playerTricks: tricksArr,
        playerCuts: cutsArr,
        cutsDetails,
        mostCutsPlayer,
        totalTricksPlayed: completedCount,
        jokersPlayed: {
          black: blackItem ? { player: blackItem.p, trick: blackItem.trick } : undefined,
          red: redItem ? { player: redItem.p, trick: redItem.trick } : undefined,
        },
        handAnalysis,
      };
    },
    [getPlayerName, trump, initialUserHand, bidder, contract]
  );

  // -------------------------------------------------------------
  // EXECUTE CHALLENGE (ACCUSATION OF MUQATA'AH BY HUMAN OR BOT)
  // -------------------------------------------------------------
  const executeChallenge = useCallback(
    (
      accuser: PlayerId,
      accusedPlayer: PlayerId,
      claimedSuit: Suit,
      trickNumber: number,
      botReason?: string,
      historyOverride?: PlayHistoryItem[],
      completedTricksOverride?: number,
      roundTricksOverride?: [number, number, number, number],
      roundCutsOverride?: [number, number, number, number]
    ) => {
      if (phaseRef.current !== 'play' || isSummaryOpenRef.current) return;
      sounds.playClick();
      const currentHistory = historyOverride || playHistory;
      const target = currentHistory.find((x) => x.p === accusedPlayer && x.trick === trickNumber);
      if (!target || !target.required) return;

      const isCorrect = Boolean(target.cheated && claimedSuit === target.required);
      const accuserTeam = teamOf(accuser);
      const rewardedTeam = isCorrect ? accuserTeam : 1 - accuserTeam;

      setScores((prevScores) => [
        rewardedTeam === 0 ? prevScores[0] + 15 : prevScores[0],
        rewardedTeam === 1 ? prevScores[1] + 15 : prevScores[1],
      ]);
      setPhase('end');
      setIsBusy(false);
      sounds.playAccuseSound(rewardedTeam === 0);
      triggerCardShake('challenge');

      recordRoundResult(
        rewardedTeam,
        isCorrect ? 'كشف مقاطعة صحيح' : 'كشف خاطئ',
        15,
        bidder,
        contract,
        trump,
        isCorrect,
        accuser
      );

      const suitName = SUIT_NAMES[claimedSuit] || claimedSuit;
      let message = '';
      let detailsText = '';

      if (accuser === 0) {
        message = isCorrect ? 'كشف صحيح (+١٥)' : 'كشف خاطئ (-١٥ للخصم)';
        detailsText = isCorrect
          ? `ضبط مقاطعة ${getPlayerName(accusedPlayer)} لنوع ${suitName} (لمّة ${trickNumber}) — +١٥ نقطة لفريقك.`
          : `كشف خاطئ ضد ${getPlayerName(accusedPlayer)} على ${suitName} (لمّة ${trickNumber}) — +١٥ نقطة للمنافس.`;
      } else {
        const accuserName = getPlayerName(accuser);
        const accusedName = getPlayerName(accusedPlayer);
        if (isCorrect) {
          message = `🚨 كشف مقاطعة — ${accuserName}`;
          detailsText =
            botReason === 'proven_suit_reveal'
              ? `كشف ${accuserName} رمي ${accusedName} لنوع ${suitName} بعد مقاطعته في اللمّة ${trickNumber} (+١٥ نقطة).`
              : `ضبط ${accuserName} مقاطعة ${accusedName} لنوع ${suitName} في اللمّة ${trickNumber} (+١٥ نقطة).`;
        } else {
          message = `كشف خاطئ من ${accuserName}`;
          detailsText = `اتهام خاطئ من ${accuserName} ضد ${accusedName} (لمّة ${trickNumber}) — +١٥ نقطة لفريقك.`;
        }
      }

      const activeTricks = roundTricksOverride || roundTricks;
      const activeCuts = roundCutsOverride || roundCuts;
      const activeCompleted = completedTricksOverride !== undefined ? completedTricksOverride : completedTricks;

      const challengeReason: RoundEndDetails['reason'] = isCorrect ? 'challenge_success' : 'challenge_failed';
      const stats = computeRoundStats(activeTricks, activeCuts, activeCompleted, currentHistory, {
        reason: challengeReason,
        winningTeam: rewardedTeam,
      });
      addLog(detailsText);
      setStatusMessage(message);
      setRoundDetails({
        reason: challengeReason,
        winningTeam: rewardedTeam,
        pointsAwarded: 15,
        message,
        details: detailsText,
        stats,
      });
      setIsSummaryOpen(true);
    },
    [
      playHistory,
      bidder,
      contract,
      trump,
      getPlayerName,
      roundTricks,
      roundCuts,
      completedTricks,
      computeRoundStats,
      recordRoundResult,
      addLog,
      triggerCardShake,
    ]
  );

  // -------------------------------------------------------------
  // MAS'OUL (مسؤول) DECISION HANDLERS
  // -------------------------------------------------------------
  const handleDeclareMasoul = useCallback(() => {
    sounds.playMasoulDeclarationSound();
    setIsMasoul(true);
    setOriginalContract(contract);
    setContract(9);
    setIsMasoulModalOpen(false);

    const buyerDisplayName = bidder !== null ? getPlayerName(bidder) : 'فريق الشراء';
    const logText = `👑 أعلن ${buyerDisplayName} «مسؤول»! والهدف الآن هو الباوند (٩ لمّات لنيل ١٨ نقطة مباشرة)!`;
    addLog(logText);
    setStatusMessage(`👑 أُعلن مسؤول! الهدف: باوند (٩ لمّات لنيل ١٨ نقطة)`);

    setMasoulAnnounceBanner({
      text: '👑 أُعلن مسؤول!',
      subtext: 'الهدف الآن: باوند (٩ لمّات) لنيل ١٨ نقطة مباشرة!',
    });
    setTimeout(() => setMasoulAnnounceBanner(null), 3000);

    if (pendingMasoulContext) {
      const nextWinner = pendingMasoulContext.winner;
      const winnerRemainingHand = pendingMasoulContext.nextHands[nextWinner] ?? hands[nextWinner];
      if (winnerRemainingHand.length === 1 && winnerRemainingHand[0].j !== undefined) {
        const trappedTeam = teamOf(nextWinner);
        const awardedTeam = 1 - trappedTeam;
        const updatedScores: [number, number] = [
          awardedTeam === 0 ? scores[0] + 15 : scores[0],
          awardedTeam === 1 ? scores[1] + 15 : scores[1],
        ];
        setScores(updatedScores);
        setPhase('end');
        sounds.playAccuseSound(awardedTeam === 0);

        const jokerName = winnerRemainingHand[0].j === 'R' ? 'الأحمر' : 'الأسود';
        const reasonText = `بقي الجوكر ${jokerName} آخر ورقة مع ${getPlayerName(nextWinner)} عند البدء (+١٥ للخصم).`;

        addLog(reasonText);
        recordRoundResult(
          awardedTeam,
          'خسارة ١٥: آخر ورقة جوكر عند البدء',
          15,
          bidder,
          contract,
          trump
        );

        const stats = computeRoundStats(
          pendingMasoulContext.nextRoundTricks,
          pendingMasoulContext.nextRoundCuts,
          pendingMasoulContext.nextCompletedTricks,
          [...playHistory, pendingMasoulContext.historyItem],
          { reason: 'trapped_joker_lead_violation', winningTeam: awardedTeam }
        );
        const details: RoundEndDetails = {
          reason: 'trapped_joker_lead_violation',
          winningTeam: awardedTeam,
          pointsAwarded: 15,
          message: 'آخر ورقة جوكر عند البدء (+١٥ للخصم)',
          details: reasonText,
          stats,
        };
        setRoundDetails(details);
        setIsSummaryOpen(true);
        setPendingMasoulContext(null);
        setIsBusy(false);
        return;
      }

      setTurn(nextWinner);
      setStatusMessage(`اللمّة ${pendingMasoulContext.nextCompletedTricks + 1}: دور ${getPlayerName(nextWinner)}`);
      setPendingMasoulContext(null);
      setIsBusy(false);
    }
  }, [
    bidder,
    contract,
    pendingMasoulContext,
    getPlayerName,
    addLog,
    hands,
    scores,
    trump,
    playHistory,
    computeRoundStats,
    recordRoundResult,
  ]);

  const handleConcludeNormalWin = useCallback(() => {
    setIsMasoulModalOpen(false);
    if (!pendingMasoulContext) return;

    const { nextCompletedTricks, nextRoundTricks, nextRoundCuts, historyItem, redJokerHolder } = pendingMasoulContext;
    const buyingTeam = bidder !== null ? teamOf(bidder) : 0;
    const otherTeam = 1 - buyingTeam;

    if (redJokerHolder !== -1 && teamOf(redJokerHolder) === buyingTeam) {
      const awardedTeam = otherTeam;
      const updatedScores: [number, number] = [
        awardedTeam === 0 ? scores[0] + 15 : scores[0],
        awardedTeam === 1 ? scores[1] + 15 : scores[1],
      ];
      setScores(updatedScores);
      setPhase('end');
      sounds.playAccuseSound(awardedTeam === 0);

      const reasonText = `بقي الجوكر الأحمر مع ${getPlayerName(redJokerHolder)} عند حسم الشراء — خسارة ١٥ نقطة للمنافس.`;
      addLog(reasonText);
      recordRoundResult(awardedTeam, 'مخالفة الجوكر الأحمر عند الوصول للشراء', 15, bidder, originalContract, trump);

      const stats = computeRoundStats(nextRoundTricks, nextRoundCuts, nextCompletedTricks, [...playHistory, historyItem], {
        reason: 'red_joker_contract_violation',
        winningTeam: awardedTeam,
        contractVal: originalContract,
      });
      const details: RoundEndDetails = {
        reason: 'red_joker_contract_violation',
        winningTeam: awardedTeam,
        pointsAwarded: 15,
        message: 'خسارة ١٥ (الجوكر الأحمر مع المشتري)',
        details: reasonText,
        stats,
      };
      setRoundDetails(details);
      setIsSummaryOpen(true);
      setPendingMasoulContext(null);
      setIsBusy(false);
      return;
    }

    const updatedScores: [number, number] = [
      buyingTeam === 0 ? scores[0] + originalContract : scores[0],
      buyingTeam === 1 ? scores[1] + originalContract : scores[1],
    ];
    setScores(updatedScores);
    setPhase('end');
    sounds.playContractWonFanfare(buyingTeam === 0);

    recordRoundResult(buyingTeam, 'نجاح الشراء', originalContract, bidder, originalContract, trump);

    const defenderNote =
      redJokerHolder !== -1 && teamOf(redJokerHolder) !== buyingTeam
        ? ` (الجوكر الأحمر مع المدافع ${getPlayerName(redJokerHolder)})`
        : '';

    const stats = computeRoundStats(nextRoundTricks, nextRoundCuts, nextCompletedTricks, [...playHistory, historyItem], {
      reason: 'contract_won',
      winningTeam: buyingTeam,
      contractVal: originalContract,
    });
    const details: RoundEndDetails = {
      reason: 'contract_won',
      winningTeam: buyingTeam,
      pointsAwarded: originalContract,
      message: 'نجاح الشراء',
      details: `حقق ${getPlayerName(bidder!)} الشراء (${originalContract}) — +${originalContract} نقاط.${defenderNote}`,
      stats,
    };
    setRoundDetails(details);
    setIsSummaryOpen(true);
    setPendingMasoulContext(null);
    setIsBusy(false);
  }, [pendingMasoulContext, bidder, originalContract, scores, trump, playHistory, computeRoundStats, recordRoundResult, getPlayerName, addLog]);

  // -------------------------------------------------------------
  // PLAY A CARD (HUMAN OR BOT) WITH ANIMATIONS
  // -------------------------------------------------------------
  const playCard = useCallback(
    (p: PlayerId, cardIndex: number) => {
      if (phase !== 'play' || turn !== p || isBusy) return;

      const card = hands[p][cardIndex];
      if (!card) return;

      let cheated = false;
      let required: string | null = null;
      let isMuqataah = false;

      if (trick.length > 0) {
        const lead = trick[0].c;
        const isAnzelLi = contract === 8 && completedTricks === 0 && trump !== null;
        const leadSuit = isAnzelLi ? trump : lead.j ? trump : lead.s;
        if (leadSuit) {
          required = leadSuit;
          // Rule: "رمي الجوكر لا يعتبر مقاطعة"
          // Playing a Joker is NEVER considered a muqata'ah!
          if (!card.j) {
            const hasThrownOnTable = hands[p].some((c) => !c.j && c.s === leadSuit);
            const ignoredAndPlayedDifferent = card.s !== leadSuit;

            if (hasThrownOnTable && ignoredAndPlayedDifferent) {
              isMuqataah = true;
              cheated = true;
            }
          }
        }
      }

      const nextRoundCuts = [...roundCuts] as [number, number, number, number];
      if (isMuqataah) {
        nextRoundCuts[p] += 1;
        setRoundCuts(nextRoundCuts);
      }

      let nextRedFirstOwner = redFirstOwner;
      if (card.j === 'R' && redFirstOwner === null) {
        setRedFirstOwner(p);
        nextRedFirstOwner = p;
      }

      if (card.j === 'B') {
        setBlackPlayed(true);
        if (trick.length === 0) {
          setBlackLead(true);
        }
      }

      // Special particle effect & sound when playing the Red or Black Joker
      if (card.j === 'R' || card.j === 'B') {
        sounds.playJokerPlaySound(card.j === 'R');
        setActiveJokerEffect({
          id: `joker-${Date.now()}-${p}`,
          jokerType: card.j,
          player: p,
          playerName: getPlayerName(p),
        });
      } else if (trump && card.s === trump) {
        // Very subtle, gentle effect when playing a trump card (or trump cut "قطع")
        const isCut = trick.length > 0 && trick[0].c.s !== trump && !trick[0].c.j;
        if (isCut) {
          sounds.playTrumpCutSound();
        } else {
          sounds.playTrumpCardSound();
        }
        setActiveTrumpPlay({
          player: p,
          isCut,
          suit: trump,
        });
        setTimeout(() => {
          setActiveTrumpPlay((curr) => (curr?.player === p ? null : curr));
        }, 550);
      }

      const nextHands = hands.map((h, i) => (i === p ? h.filter((_, idx) => idx !== cardIndex) : h));
      setHands(nextHands);

      if (!isWatch) {
        const sourceSlot = document.querySelector(`[data-card-id="${card.id}"]`) || document.getElementById(`seat-${p}`);
        const targetSlot = document.getElementById(`played-slot-${p}`);
        if (sourceSlot && targetSlot) {
          const sRect = sourceSlot.getBoundingClientRect();
          const tRect = targetSlot.getBoundingClientRect();
          const animId = `fly-${Date.now()}-${p}`;
          const flyDuration = settings.fastAnimations ? 240 : 420;
          spawnFlyingCard({
            id: animId,
            card,
            startX: sRect.left,
            startY: sRect.top,
            endX: tRect.left,
            endY: tRect.top,
            rot: (Math.random() - 0.5) * 16,
            durationMs: flyDuration,
          });
        }
      }

      sounds.playCardPlaySound();

      const trickCard: TrickCard = { p, c: card, cheated };
      const nextTrick = [...trick, trickCard];
      setTrick(nextTrick);

      const historyItem: PlayHistoryItem = {
        p,
        c: card,
        cheated,
        required,
        trick: completedTricks + 1,
      };
      const updatedHistory = [...playHistory, historyItem];
      setPlayHistory(updatedHistory);
      setLastPlayed(historyItem);

      addLog(`${getPlayerName(p)} لعب ${formatRank(card.r, card.j)} ${card.j ? '' : card.s}`);

      if (nextTrick.length === 4) {
        setIsBusy(true);
        const winner = evaluateTrickWinner(nextTrick, trump);
        const winnerCardObj = nextTrick.find((x) => x.p === winner);

        setTrickWinner(winner);
        setWinningCardId(winnerCardObj ? winnerCardObj.c.id : null);
        recordTrickWin(winner);

        const winnerTeam = teamOf(winner);
        const nextTricks: [number, number] = [
          winnerTeam === 0 ? tricks[0] + 1 : tricks[0],
          winnerTeam === 1 ? tricks[1] + 1 : tricks[1],
        ];
        setTricks(nextTricks);
        const nextCompletedTricks = completedTricks + 1;
        setCompletedTricks(nextCompletedTricks);

        const nextRoundTricks = [...roundTricks] as [number, number, number, number];
        nextRoundTricks[winner] += 1;
        setRoundTricks(nextRoundTricks);

        setStatusMessage(`فاز باللمّة ${nextCompletedTricks}: ${getPlayerName(winner)}`);
        addLog(`فاز باللمّة ${nextCompletedTricks}: ${getPlayerName(winner)}`);

        const collectWait = settings.fastAnimations || isWatch ? 500 : 1050;
        const collectFlyMs = settings.fastAnimations || isWatch ? 280 : 520;
        const stateAdvanceWait = collectWait + collectFlyMs + (isWatch ? 140 : 280);

        setTimeout(() => {
          setIsCollectingTrick(true);
          setCollectWinner(winner);
          sounds.playCollectSound();

          // Fly all 4 played cards cleanly into the winning team's next side-by-side trick slot beside their seat
          const stackEl = document.getElementById(`team-stack-${winnerTeam}`);
          const currentPileCount = teamTrickPilesRef.current[winnerTeam].length;
          const lastItemEl =
            currentPileCount > 0
              ? document.getElementById(`team-stack-${winnerTeam}-item-${currentPileCount - 1}`)
              : null;
          const tableEl = tableRef.current;
          const cardW = isWatch ? 36 : 44;
          const cardH = isWatch ? 54 : 64;
          const fallbackEndX = tableEl
            ? tableEl.getBoundingClientRect().left + (winnerTeam === 0 ? 40 + currentPileCount * 24 : tableEl.getBoundingClientRect().width - 90 - currentPileCount * 24)
            : 200;
          const fallbackEndY = tableEl
            ? tableEl.getBoundingClientRect().top + (winnerTeam === 0 ? tableEl.getBoundingClientRect().height - 65 : 24)
            : 200;
          const targetRect = stackEl?.getBoundingClientRect();
          const lastRect = lastItemEl?.getBoundingClientRect();
          const slotStep = isWatch ? 16 : 26;

          let endX = fallbackEndX;
          let endY = fallbackEndY;
          if (lastRect) {
            endX =
              winnerTeam === 0
                ? lastRect.right + 4 - cardW * 0.14
                : lastRect.left - slotStep - cardW * 0.14;
            endY = lastRect.top + lastRect.height / 2 - cardH / 2;
          } else if (targetRect) {
            endX =
              winnerTeam === 0
                ? targetRect.left
                : targetRect.right - cardW * 0.72;
            endY = targetRect.top + targetRect.height / 2 - cardH / 2;
          }

          nextTrick.forEach((tc, idx) => {
            const slotEl = document.getElementById(`played-slot-${tc.p}`);
            const sRect = slotEl?.getBoundingClientRect();
            const startX = sRect ? sRect.left : endX;
            const startY = sRect ? sRect.top : endY;

            setTimeout(() => {
              spawnFlyingCard({
                id: `collect-${nextCompletedTricks}-${tc.p}-${Date.now()}`,
                card: tc.c,
                startX,
                startY,
                endX: endX + (idx - 1.5) * 1.2,
                endY: endY - idx * 1,
                rot: (idx % 2 === 0 ? -4 : 4),
                faceDown: true,
                size: isWatch ? 'xs' : 'sm',
                durationMs: collectFlyMs,
                startScale: 1,
                endScale: 0.62,
              });
            }, idx * (isWatch ? 20 : 40));
          });

          setTrick([]);
        }, collectWait);

        setTimeout(() => {
          setIsCollectingTrick(false);
          setCollectWinner(null);
          setTrickWinner(null);
          setWinningCardId(null);
          setTrick([]);
          setBlackLead(false);
          setTeamTrickPiles((prev) => {
            const next: [TrickCard[][], TrickCard[][]] = [[...prev[0]], [...prev[1]]];
            next[winnerTeam].push(nextTrick);
            return next;
          });

          const blackHolder = nextHands.findIndex((h) => h.some((c) => c.j === 'B')) as PlayerId | -1;
          const isBlackViolated =
            nextCompletedTricks === 3 &&
            !blackPlayed &&
            card.j !== 'B' &&
            blackHolder !== -1 &&
            nextRedFirstOwner !== blackHolder;

          if (isBlackViolated) {
            const opponentTeam = 1 - teamOf(blackHolder);
            const updatedScores: [number, number] = [
              opponentTeam === 0 ? scores[0] + 15 : scores[0],
              opponentTeam === 1 ? scores[1] + 15 : scores[1],
            ];
            setScores(updatedScores);
            setPhase('end');
            sounds.playAccuseSound(opponentTeam === 0);

            recordRoundResult(
              opponentTeam,
              'مخالفة الجوكر الأسود',
              15,
              bidder,
              contract,
              trump
            );

            const stats = computeRoundStats(nextRoundTricks, nextRoundCuts, nextCompletedTricks, [...playHistory, historyItem], {
              reason: 'black_joker_violation',
              winningTeam: opponentTeam,
            });
            const details: RoundEndDetails = {
              reason: 'black_joker_violation',
              winningTeam: opponentTeam,
              pointsAwarded: 15,
              message: 'مخالفة الجوكر الأسود (-١٥)',
              details: `لم يرمِ ${getPlayerName(blackHolder)} الجوكر الأسود في أول ٣ لمّات — +١٥ نقطة للمقابل.`,
              stats,
            };
            setRoundDetails(details);
            setIsSummaryOpen(true);
            setIsBusy(false);
            return;
          }

          const buyingTeam = bidder !== null ? teamOf(bidder) : 0;
          const otherTeam = 1 - buyingTeam;

          if (nextTricks[buyingTeam] >= contract) {
            const redJokerHolder = nextHands.findIndex((h) => h.some((c) => c.j === 'R')) as PlayerId | -1;

            if (redJokerHolder !== -1 && teamOf(redJokerHolder) === buyingTeam) {
              const awardedTeam = otherTeam;

              const updatedScores: [number, number] = [
                awardedTeam === 0 ? scores[0] + 15 : scores[0],
                awardedTeam === 1 ? scores[1] + 15 : scores[1],
              ];
              setScores(updatedScores);
              setPhase('end');
              sounds.playAccuseSound(awardedTeam === 0);

              const reasonText = `بقي الجوكر الأحمر مع ${getPlayerName(redJokerHolder)} عند حسم الشراء — خسارة ١٥ نقطة للمنافس.`;

              addLog(reasonText);
              recordRoundResult(
                awardedTeam,
                'مخالفة الجوكر الأحمر عند الوصول للشراء',
                15,
                bidder,
                contract,
                trump
              );

              const stats = computeRoundStats(nextRoundTricks, nextRoundCuts, nextCompletedTricks, [...playHistory, historyItem], {
                reason: 'red_joker_contract_violation',
                winningTeam: awardedTeam,
              });
              const details: RoundEndDetails = {
                reason: 'red_joker_contract_violation',
                winningTeam: awardedTeam,
                pointsAwarded: 15,
                message: 'خسارة ١٥ (الجوكر الأحمر مع المشتري)',
                details: reasonText,
                stats,
              };
              setRoundDetails(details);
              setIsSummaryOpen(true);
              setIsBusy(false);
              return;
            }

            // --- MAS'OUL (مسؤول) TRIGGER CHECK ---
            const isMasoulEligible =
              contract < 9 &&
              !isMasoul &&
              nextTricks[buyingTeam] === contract &&
              nextTricks[otherTeam] === 0 &&
              nextCompletedTricks < 9;

            if (isMasoulEligible) {
              setOriginalContract(contract);
              if (teamOf(bidder!) === 0) {
                setPendingMasoulContext({
                  winner,
                  nextCompletedTricks,
                  nextRoundTricks,
                  nextRoundCuts,
                  historyItem,
                  redJokerHolder,
                  nextHands,
                });
                setIsMasoulModalOpen(true);
                return;
              } else {
                const botWantsMasoul = shouldAiDeclareMasoul(bidder!, nextHands[bidder!], trump, settings.difficulty);
                if (botWantsMasoul) {
                  sounds.playMasoulDeclarationSound();
                  setIsMasoul(true);
                  setOriginalContract(contract);
                  setContract(9);

                  const logText = `👑 أعلن ${getPlayerName(bidder!)} «مسؤول» (باوند ١٨ نقطة)`;
                  addLog(logText);
                  setStatusMessage(`👑 ${getPlayerName(bidder!)}: مسؤول (باوند ١٨)`);

                  setMasoulAnnounceBanner({
                    text: `👑 ${getPlayerName(bidder!)}: مسؤول!`,
                    subtext: 'الهدف: باوند (+١٨)',
                  });
                  setTimeout(() => setMasoulAnnounceBanner(null), 2600);

                  setTurn(winner);
                  setIsBusy(false);
                  return;
                }
              }
            }

            // Contract / Bound Won!
            const isBoundWon = contract === 9 || isMasoul;
            const pointsWon = isBoundWon ? 18 : contract;

            const updatedScores: [number, number] = [
              buyingTeam === 0 ? scores[0] + pointsWon : scores[0],
              buyingTeam === 1 ? scores[1] + pointsWon : scores[1],
            ];
            setScores(updatedScores);
            setPhase('end');
            if (isBoundWon) {
              sounds.playBoundVictorySound();
            } else {
              sounds.playContractWonFanfare(buyingTeam === 0);
            }

            const winActionName = isBoundWon ? (isMasoul ? 'فوز بالباوند (مسؤول)' : 'فوز بالباوند') : 'نجاح الشراء';
            recordRoundResult(
              buyingTeam,
              winActionName,
              pointsWon,
              bidder,
              contract,
              trump
            );

            const defenderNote =
              redJokerHolder !== -1 && teamOf(redJokerHolder) !== buyingTeam
                ? ` (الجوكر الأحمر مع المدافع ${getPlayerName(redJokerHolder)})`
                : '';

            const winMessage = isBoundWon
              ? (isMasoul ? 'فوز بالباوند — مسؤول (+١٨)' : 'فوز بالباوند (+١٨)')
              : 'نجاح الشراء';

            const winDetails = isBoundWon
              ? `أتمّ ${getPlayerName(bidder!)} وفريقه الباوند (٩ لمّات) — +١٨ نقطة.${defenderNote}`
              : `حقق ${getPlayerName(bidder!)} الشراء (${contract}) — +${contract} نقطة.${defenderNote}`;

            const stats = computeRoundStats(nextRoundTricks, nextRoundCuts, nextCompletedTricks, [...playHistory, historyItem], {
              reason: isBoundWon ? 'bound_won' : 'contract_won',
              winningTeam: buyingTeam,
            });
            const details: RoundEndDetails = {
              reason: isBoundWon ? 'bound_won' : 'contract_won',
              winningTeam: buyingTeam,
              pointsAwarded: pointsWon,
              message: winMessage,
              details: winDetails,
              isBound: isBoundWon,
              isMasoul,
              stats,
            };
            setRoundDetails(details);
            setIsSummaryOpen(true);
            setIsBusy(false);
            return;
          }

          const isContractFall = isMasoul ? nextTricks[otherTeam] >= 1 : nextTricks[otherTeam] > 9 - contract;

          if (isContractFall) {
            const penalty = isMasoul ? 15 : (contract === 9 ? 18 : 2 * contract);
            const updatedScores: [number, number] = [
              otherTeam === 0 ? scores[0] + penalty : scores[0],
              otherTeam === 1 ? scores[1] + penalty : scores[1],
            ];
            setScores(updatedScores);
            setPhase('end');
            sounds.playContractFallDrama(buyingTeam === 0);

            const fallActionName = isMasoul ? 'سقوط الباوند بعد مسؤول (خسارة ١٥)' : 'سقوط الشراء';
            recordRoundResult(
              otherTeam,
              fallActionName,
              penalty,
              bidder,
              contract,
              trump
            );

            const fallMessage = isMasoul ? 'سقوط مسؤول (-١٥)' : (contract === 9 ? 'سقوط الباوند' : 'سقوط الشراء');
            const fallDetails = isMasoul
              ? `سقط الباوند بعد مسؤول — +١٥ نقطة للمنافس.`
              : `سقوط شراء ${contract} — +${penalty} نقطة للمنافس.`;

            const stats = computeRoundStats(nextRoundTricks, nextRoundCuts, nextCompletedTricks, [...playHistory, historyItem], {
              reason: isMasoul ? 'bound_lost' : 'contract_lost',
              winningTeam: otherTeam,
            });
            const details: RoundEndDetails = {
              reason: isMasoul ? 'bound_lost' : 'contract_lost',
              winningTeam: otherTeam,
              pointsAwarded: penalty,
              message: fallMessage,
              details: fallDetails,
              isBound: contract === 9 || isMasoul,
              isMasoul,
              stats,
            };
            setRoundDetails(details);
            setIsSummaryOpen(true);
            setIsBusy(false);
            return;
          }

          // Check Trapped Joker Lead Violation for the next trick leader (`winner`)!
          // USER RULE: "في حال كانت الورقة الاخيرة في يدك هي الجوكر وانت يجب ان تبداء اللعبة هذا غير ممكن وتحتسب خسارة 15"
          const winnerRemainingHand = nextHands[winner];
          const isWinnerTrappedWithJoker =
            winnerRemainingHand.length === 1 &&
            winnerRemainingHand[0].j !== undefined;

          if (isWinnerTrappedWithJoker) {
            const trappedTeam = teamOf(winner);
            const awardedTeam = 1 - trappedTeam;
            const updatedScores: [number, number] = [
              awardedTeam === 0 ? scores[0] + 15 : scores[0],
              awardedTeam === 1 ? scores[1] + 15 : scores[1],
            ];
            setScores(updatedScores);
            setPhase('end');
            sounds.playAccuseSound(awardedTeam === 0);

            const jokerName = winnerRemainingHand[0].j === 'R' ? 'الأحمر' : 'الأسود';
            const reasonText = `بقي الجوكر ${jokerName} آخر ورقة مع ${getPlayerName(winner)} عند البدء (+١٥ للخصم).`;

            addLog(reasonText);
            recordRoundResult(
              awardedTeam,
              'خسارة ١٥: آخر ورقة جوكر عند البدء',
              15,
              bidder,
              contract,
              trump
            );

            const stats = computeRoundStats(nextRoundTricks, nextRoundCuts, nextCompletedTricks, [...playHistory, historyItem], {
              reason: 'trapped_joker_lead_violation',
              winningTeam: awardedTeam,
            });
            const details: RoundEndDetails = {
              reason: 'trapped_joker_lead_violation',
              winningTeam: awardedTeam,
              pointsAwarded: 15,
              message: 'آخر ورقة جوكر عند البدء (+١٥ للخصم)',
              details: reasonText,
              stats,
            };
            setRoundDetails(details);
            setIsSummaryOpen(true);
            setIsBusy(false);
            return;
          }

          // Trick Completion Bot Challenge Check (ONLY while round/match is still active — forbidden after round ends)
          if (nextCompletedTricks < 9) {
            const currentTrickPlays = updatedHistory.filter((h) => h.trick === nextCompletedTricks);
            const botTrickDecision = evaluateRevealedCutChallenge(
              updatedHistory,
              currentTrickPlays,
              settings.difficulty
            );

            if (botTrickDecision) {
              const botName = getPlayerName(botTrickDecision.accuser);
              const accusedName = getPlayerName(botTrickDecision.accused);
              const suitName = SUIT_NAMES[botTrickDecision.claimedSuit] || botTrickDecision.claimedSuit;
              setStatusMessage(`🚨 ${botName} يطلب كشف ${accusedName} — لمّة ${botTrickDecision.trickNumber} (${suitName})`);
              sounds.playAccuseSound(teamOf(botTrickDecision.accuser) === 0);
              triggerCardShake('challenge');

              const challengeDelay = settings.fastAnimations || isWatch ? 600 : 950;
              setTimeout(() => {
                executeChallenge(
                  botTrickDecision.accuser,
                  botTrickDecision.accused,
                  botTrickDecision.claimedSuit,
                  botTrickDecision.trickNumber,
                  botTrickDecision.reason,
                  updatedHistory,
                  nextCompletedTricks,
                  nextRoundTricks,
                  nextRoundCuts
                );
              }, challengeDelay);
              return;
            }
          }

          setTurn(winner);
          setStatusMessage(`اللمّة ${nextCompletedTricks + 1}: دور ${getPlayerName(winner)}`);
          setIsBusy(false);
        }, stateAdvanceWait);
      } else {
        const nextTurn = ((turn + 1) % 4) as PlayerId;
        setTurn(nextTurn);
        setStatusMessage(`اللمّة ${completedTricks + 1}: دور ${getPlayerName(nextTurn)}`);
      }
    },
    [
      phase,
      turn,
      isBusy,
      hands,
      trick,
      trump,
      blackPlayed,
      blackLead,
      redFirstOwner,
      completedTricks,
      tricks,
      scores,
      bidder,
      contract,
      isMasoul,
      originalContract,
      playHistory,
      settings.fastAnimations,
      settings.difficulty,
      isWatch,
      getPlayerName,
      recordTrickWin,
      recordRoundResult,
      addLog,
      roundTricks,
      roundCuts,
      computeRoundStats,
      executeChallenge,
      triggerCardShake,
      spawnFlyingCard,
    ]
  );

  const handleHandCardClick = (idx: number) => {
    if (isDealing) return;
    // If it's your turn in play phase and clicking an already selected card:
    if (phase === 'play' && turn === 0 && !isBusy && selectedCardIdx === idx) {
      if (userLegalCardIndices.includes(idx)) {
        playCard(0, idx);
        setSelectedCardIdx(null);
        return;
      } else {
        const card = hands[0][idx];
        const isAnzelLiRestricted =
          contract === 8 &&
          completedTricks === 0 &&
          trump !== null &&
          hands[0].some((c) => !c.j && c.s === trump) &&
          !card.j &&
          card.s !== trump;

        if (isAnzelLiRestricted) {
          setStatusMessage(`انزل لي (٨): يجب رمي الحكم (${trump})`);
        } else if (card.j === 'R' && !blackPlayed) {
          setStatusMessage('الأحمر بعد الأسود فقط');
        } else if (trick.length === 0 && card.j) {
          setStatusMessage('الجوكر لا يبدأ اللمّة');
        } else {
          setStatusMessage('ورقة غير مسموحة');
        }
        sounds.playClick();
        return;
      }
    }

    // Toggle card selection
    if (selectedCardIdx === idx) {
      setSelectedCardIdx(null);
    } else {
      setSelectedCardIdx(idx);
      sounds.playClick();
    }
  };

  const handleConfirmChallenge = (accusedPlayer: PlayerId, claimedSuit: Suit, trickNumber: number) => {
    if (phase !== 'play' || isSummaryOpen || isMasoulModalOpen || isBusy) return;
    executeChallenge(0, accusedPlayer, claimedSuit, trickNumber);
  };

  // -------------------------------------------------------------
  // AI BOT AUTOMATION ENGINE
  // -------------------------------------------------------------
  useEffect(() => {
    if (autoTimeoutRef.current) {
      clearTimeout(autoTimeoutRef.current);
      autoTimeoutRef.current = null;
    }

    if (isDealing || isBusy || phase === 'end' || isMasoulModalOpen || isSummaryOpen) return;

    if (phase === 'auction' && turn !== 0) {
      const p = turn;
      const botDelay = settings.fastAnimations || isWatch ? 320 : 850;
      autoTimeoutRef.current = setTimeout(() => {
        const aiDecision = getAiBid(p, hands[p], bid, bidder, dealer, settings.difficulty);
        if (aiDecision.action === 'bid' && aiDecision.amount !== undefined) {
          handleBid(p, aiDecision.amount);
        } else {
          handlePass(p);
        }
      }, botDelay);
      return () => {
        if (autoTimeoutRef.current) {
          clearTimeout(autoTimeoutRef.current);
          autoTimeoutRef.current = null;
        }
      };
    }

    if (phase === 'trump' && bidder !== null && bidder !== 0) {
      const p = bidder;
      const trumpDelay = settings.fastAnimations || isWatch ? 350 : 950;
      autoTimeoutRef.current = setTimeout(() => {
        const bestSuit = getAiTrumpChoice(p, hands[p], settings.difficulty);
        handleSelectTrump(bestSuit);
      }, trumpDelay);
      return () => {
        if (autoTimeoutRef.current) {
          clearTimeout(autoTimeoutRef.current);
          autoTimeoutRef.current = null;
        }
      };
    }

    if (phase === 'play' && trick.length === 0 && !isBusy) {
      const leaderHand = hands[turn];
      if (leaderHand && leaderHand.length === 1 && leaderHand[0].j !== undefined) {
        const trappedTeam = teamOf(turn);
        const awardedTeam = 1 - trappedTeam;
        const updatedScores: [number, number] = [
          awardedTeam === 0 ? scores[0] + 15 : scores[0],
          awardedTeam === 1 ? scores[1] + 15 : scores[1],
        ];
        setScores(updatedScores);
        setPhase('end');
        sounds.playAccuseSound(awardedTeam === 0);

        const jokerName = leaderHand[0].j === 'R' ? 'الأحمر' : 'الأسود';
        const reasonText = `بقي الجوكر ${jokerName} آخر ورقة مع ${getPlayerName(turn)} عند البدء (+١٥ للخصم).`;

        addLog(reasonText);
        recordRoundResult(
          awardedTeam,
          'خسارة ١٥: آخر ورقة جوكر عند البدء',
          15,
          bidder,
          contract,
          trump
        );

        const stats = computeRoundStats(roundTricks, roundCuts, completedTricks, playHistory, {
          reason: 'trapped_joker_lead_violation',
          winningTeam: awardedTeam,
        });
        const details: RoundEndDetails = {
          reason: 'trapped_joker_lead_violation',
          winningTeam: awardedTeam,
          pointsAwarded: 15,
          message: 'آخر ورقة جوكر عند البدء (+١٥ للخصم)',
          details: reasonText,
          stats,
        };
        setRoundDetails(details);
        setIsSummaryOpen(true);
        setIsBusy(false);
        return;
      }
    }

    if (phase === 'play' && turn !== 0) {
      const p = turn;
      const playDelay = settings.fastAnimations || isWatch ? 420 : 1050;
      autoTimeoutRef.current = setTimeout(() => {
        const selectedIdx = getAiPlayCard(
          p,
          hands[p],
          trick,
          trump,
          settings.difficulty,
          blackPlayed,
          blackLead,
          redFirstOwner,
          completedTricks,
          playHistory,
          bidder !== null ? teamOf(bidder) : undefined,
          contract,
          tricks
        );
        playCard(p, selectedIdx);
      }, playDelay);
    }

    return () => {
      if (autoTimeoutRef.current) {
        clearTimeout(autoTimeoutRef.current);
        autoTimeoutRef.current = null;
      }
    };
  }, [
    phase,
    turn,
    isDealing,
    isBusy,
    isMasoulModalOpen,
    isSummaryOpen,
    hands,
    trick,
    trump,
    blackPlayed,
    blackLead,
    redFirstOwner,
    lastPlayed,
    completedTricks,
    playHistory,
    dealer,
    bidder,
    bid,
    contract,
    tricks,
    scores,
    settings.fastAnimations,
    settings.difficulty,
    isWatch,
    handleBid,
    handlePass,
    handleSelectTrump,
    playCard,
  ]);

  // Trigger a subtle shake when the turn passes to the human player
  const isHumanTurnActive =
    (phase === 'auction' || phase === 'trump' || phase === 'play') &&
    turn === 0 &&
    !isBusy &&
    !isDealing &&
    !isMasoulModalOpen &&
    !isSummaryOpen &&
    hands[0].length > 0;

  useEffect(() => {
    const wasActive = prevHumanTurnActiveRef.current;
    const prevPhase = prevHumanTurnPhaseRef.current;

    if (isHumanTurnActive && (!wasActive || prevPhase !== phase)) {
      triggerCardShake('turn');
    }

    prevHumanTurnActiveRef.current = isHumanTurnActive;
    prevHumanTurnPhaseRef.current = phase;
  }, [isHumanTurnActive, phase, triggerCardShake]);

  // Trigger alert shake whenever a "كشف مقاطعة" status alert is received
  useEffect(() => {
    if (statusMessage.includes('كشف مقاطعة') || statusMessage.includes('يكشف مقاطعة')) {
      triggerCardShake('challenge');
    }
  }, [statusMessage, triggerCardShake]);

  useEffect(() => {
    return () => {
      if (cardShakeTimeoutRef.current) {
        clearTimeout(cardShakeTimeoutRef.current);
      }
    };
  }, []);

  const buyingTeam = bidder !== null ? teamOf(bidder) : null;
  const isMyTeamBuyer = buyingTeam === 0;
  const isBound = contract === 9 || isMasoul;

  // USER REQUEST: "عدل من الفوز والخسارة في الشراء الى الفوز والخسارة بحيث تعني فريقي"
  // اللمّات المتبقية لفوز فريقي (Team 0: أنت وشريكك) بالجولة:
  const tricksForMyTeamWin = useMemo(() => {
    if (!contract || buyingTeam === null) return null;
    if (isMyTeamBuyer) {
      // فريقي هو المشتري: نحتاج إكمال العقد (أو 9 في الباوند)
      const target = isBound ? 9 : contract;
      return Math.max(0, target - tricks[0]);
    } else {
      // المنافس هو المشتري: فريقي يفوز إذا أسقطنا شراءهم
      const neededToDrop = isBound ? 1 : (10 - contract);
      return Math.max(0, neededToDrop - tricks[0]);
    }
  }, [contract, buyingTeam, isMyTeamBuyer, isBound, tricks]);

  // اللمّات المتبقية للمنافس لكي يخسر فريقي الجولة:
  const tricksForMyTeamLoss = useMemo(() => {
    if (!contract || buyingTeam === null) return null;
    if (isMyTeamBuyer) {
      // فريقي هو المشتري: نخسر إذا المنافس أسقط شراءنا
      const neededOpponentToDrop = isBound ? 1 : (10 - contract);
      return Math.max(0, neededOpponentToDrop - tricks[1]);
    } else {
      // المنافس هو المشتري: نخسر إذا المنافس أكمل عقده (أو 9 في الباوند)
      const target = isBound ? 9 : contract;
      return Math.max(0, target - tricks[1]);
    }
  }, [contract, buyingTeam, isMyTeamBuyer, isBound, tricks]);

  const userLegalCardIndices =
    phase === 'play' && turn === 0
      ? getValidCardIndices(0, hands[0], trick, trump, blackPlayed, blackLead, redFirstOwner, contract, completedTricks)
      : [];

  // Hand analysis for intelligent bidding and trump recommendations
  const userHandEstimate = useMemo(() => estimate(hands[0]), [hands]);

  const userSuitStats = useMemo(() => {
    const counts: Record<Suit, number> = { '♣': 0, '♥': 0, '♠': 0, '♦': 0 };
    const honors: Record<Suit, string[]> = { '♣': [], '♥': [], '♠': [], '♦': [] };
    let redJoker = false;
    let blackJoker = false;

    hands[0].forEach((c) => {
      if (c.j === 'R') redJoker = true;
      else if (c.j === 'B') blackJoker = true;
      else {
        const s = c.s as Suit;
        if (s in counts) {
          counts[s]++;
          if (c.r === 14) honors[s].push('A');
          else if (c.r === 13) honors[s].push('K');
          else if (c.r === 12) honors[s].push('Q');
        }
      }
    });

    return { counts, honors, redJoker, blackJoker };
  }, [hands]);

  const tableTheme = useMemo(() => {
    switch (settings.tableColor) {
      case 'blue':
        return {
          bodyBg: 'bg-[#060e18]',
          headerBg: 'bg-[#0b1c31]/90 border-[#1d3d66]',
          hudBg: 'bg-[#0e233d]/90 border-[#1f4a7a]',
          deckBg: 'bg-gradient-to-b from-[#0c2442]/90 via-[#07172b]/95 to-[#040e1a]',
          deckBorder: 'border-sky-500/40',
          outerRail: 'bg-gradient-to-b from-[#0f172a] via-[#090e18] to-[#04070c] border-[#1e293b]',
          woodVeneer: 'bg-gradient-to-tr from-[#132238] via-[#1a3050] to-[#0e1a2c] border-[#254673]/80',
          feltArena: 'bg-[radial-gradient(ellipse_at_50%_46%,#1d4ed8_0%,#1e40af_35%,#172554_75%,#081226_100%)] border-sky-400/70',
          guideline: 'border-sky-400/30',
          watermark: 'border-sky-400/20 text-sky-400/20',
          studs: 'bg-sky-300/80 border-sky-100',
        };
      case 'burgundy':
        return {
          bodyBg: 'bg-[#120307]',
          headerBg: 'bg-[#240a12]/90 border-[#5e1929]',
          hudBg: 'bg-[#2d0912]/90 border-[#631c2d]',
          deckBg: 'bg-gradient-to-b from-[#2d0912]/90 via-[#1c0409]/95 to-[#0f0104]',
          deckBorder: 'border-rose-500/40',
          outerRail: 'bg-gradient-to-b from-[#2b080f] via-[#190308] to-[#0f0104] border-[#4a0d17]',
          woodVeneer: 'bg-gradient-to-tr from-[#3d0b14] via-[#520f1b] to-[#30070e] border-[#751627]/80',
          feltArena: 'bg-[radial-gradient(ellipse_at_50%_46%,#991b1b_0%,#831843_35%,#4c0519_75%,#1f0209_100%)] border-amber-400/75',
          guideline: 'border-amber-400/35',
          watermark: 'border-amber-400/20 text-amber-400/20',
          studs: 'bg-amber-400/80 border-amber-200',
        };
      case 'green':
      default:
        return {
          bodyBg: 'bg-[#071713]',
          headerBg: 'bg-[#0b241d]/90 border-[#2d5948]',
          hudBg: 'bg-[#0d2a21]/90 border-[#2b5e4c]',
          deckBg: 'bg-gradient-to-b from-[#0d2e23]/90 via-[#071c15]/95 to-[#030f0b]',
          deckBorder: 'border-[#d4af37]/45',
          outerRail: 'bg-gradient-to-b from-[#2b1308] via-[#1a0a03] to-[#100602] border-[#4a220f]',
          woodVeneer: 'bg-gradient-to-tr from-[#3b190c] via-[#4d2311] to-[#341508] border-[#6e3619]/80',
          feltArena: 'bg-[radial-gradient(ellipse_at_50%_46%,#247d5a_0%,#165b40_45%,#0c3828_80%,#062217_100%)] border-[#d4af37]/65',
          guideline: 'border-[#d4af37]/25',
          watermark: 'border-[#d4af37]/15 text-[#d4af37]/15',
          studs: 'bg-amber-400/70 border-amber-200',
        };
    }
  }, [settings.tableColor]);

  return (
    <div className={`min-h-screen ${tableTheme.bodyBg} text-[#f5f7f5] flex flex-col font-sans select-none overflow-x-hidden transition-colors duration-300`}>
      {/* ---------------- NAVIGATION BAR (ADAPTS FOR WATCH) ---------------- */}
      {isWatch ? (
        <header className={`w-full ${tableTheme.headerBg} border-b px-2 py-1.5 flex items-center justify-between gap-1 z-30 backdrop-blur-md`}>
          <div className="flex items-center gap-1">
            <span className="text-xs font-serif font-black text-amber-300">
              🇴🇲 عُمانية
            </span>
            <span className="text-[9px] text-emerald-300/80 font-bold">
              ج{round}
            </span>
          </div>

          <div className="text-[10px] font-black tabular-nums bg-black/50 px-1.5 py-0.5 rounded border border-emerald-600/40 text-amber-300 flex items-center gap-1">
            <span>{scores[0]}</span>
            <span className="text-slate-400 text-[8px]">:</span>
            <span>{scores[1]}</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Watch Quick Difficulty Button */}
            <button
              onClick={cycleDifficulty}
              className={`px-1.5 py-0.5 rounded-lg border text-[9px] font-black flex items-center gap-0.5 cursor-pointer transition-colors ${
                settings.difficulty === 'hard'
                  ? 'bg-purple-950/80 border-purple-400 text-purple-200'
                  : settings.difficulty === 'medium'
                  ? 'bg-amber-950/80 border-amber-400 text-amber-200'
                  : 'bg-emerald-950/80 border-emerald-400 text-emerald-200'
              }`}
              title="مستوى الذكاء (اضغط للتبديل)"
            >
              <Brain className="w-2.5 h-2.5 text-amber-300" />
              <span>{settings.difficulty === 'hard' ? 'محترف' : settings.difficulty === 'medium' ? 'متوسط' : 'سهل'}</span>
            </button>

            <button
              onClick={() => handleUpdateSettings({ watchMode: !settings.watchMode })}
              className={`p-1 rounded-lg border text-xs cursor-pointer ${
                settings.watchMode
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-black/30 text-amber-300 border-amber-400/40'
              }`}
              title="تبديل وضع ساعة آبل"
            >
              <Watch className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsWatchMenuOpen(true)}
              className="p-1 rounded-lg bg-black/40 hover:bg-black/60 border border-emerald-600/40 text-amber-300 transition-colors cursor-pointer"
              title="خيارات سريعة"
            >
              <Menu className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>
      ) : (
        <header className={`w-full ${tableTheme.headerBg} border-b px-4 py-2.5 sm:px-6 flex items-center justify-between gap-3 z-30 backdrop-blur-md`}>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-serif font-black text-amber-300 tracking-wide drop-shadow-sm">
              الورقة العُمانية
            </span>
            <span className="hidden sm:inline-block text-xs font-medium text-emerald-300/80 border-r border-emerald-700/60 pr-2">
              الجولة {round}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-5 text-xs sm:text-sm">
            <div className="px-3 py-1 rounded-lg bg-black/35 border border-emerald-600/40 text-center">
              <span className="text-[10px] sm:text-xs text-emerald-200 block">فريقنا</span>
              <b className="text-base sm:text-lg font-black text-amber-300 tabular-nums">{scores[0]}</b>
            </div>
            <div className="px-3 py-1 rounded-lg bg-black/35 border border-amber-700/40 text-center">
              <span className="text-[10px] sm:text-xs text-amber-200 block">المنافس</span>
              <b className="text-base sm:text-lg font-black text-amber-300 tabular-nums">{scores[1]}</b>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Difficulty Selector Button */}
            <button
              onClick={cycleDifficulty}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                settings.difficulty === 'hard'
                  ? 'bg-purple-950/80 hover:bg-purple-900 border-purple-400 text-purple-200'
                  : settings.difficulty === 'medium'
                  ? 'bg-amber-950/80 hover:bg-amber-900 border-amber-400 text-amber-200'
                  : 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-400 text-emerald-200'
              }`}
              title="مستوى البوتات"
            >
              <Brain className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-black">
                {settings.difficulty === 'hard'
                  ? 'محترف ⭐⭐⭐'
                  : settings.difficulty === 'medium'
                  ? 'متوسط ⭐⭐'
                  : 'سهل ⭐'}
              </span>
            </button>

            {/* Apple Watch Mode Toggle Button */}
            <button
              onClick={() => handleUpdateSettings({ watchMode: !settings.watchMode })}
              className={`px-2 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-colors shadow-sm cursor-pointer ${
                settings.watchMode
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-black/30 hover:bg-black/50 border-amber-400/40 text-amber-300'
              }`}
              title="وضع الساعة"
            >
              <Watch className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">الساعة</span>
            </button>

            <button
              onClick={() => setIsStatsOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-black/30 hover:bg-black/50 border border-amber-400/40 text-xs font-bold text-amber-300 flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              title="الإحصائيات"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">الإحصائيات</span>
            </button>

            {/* Challenge Cutters / Expose Violations Button */}
            {(() => {
              const canChallenge = phase === 'play' && !isSummaryOpen && !isMasoulModalOpen && !isDealing && !isBusy;
              return (
                <button
                  type="button"
                  disabled={!canChallenge}
                  onClick={() => {
                    if (canChallenge) setIsChallengeOpen(true);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
                    canChallenge
                      ? 'bg-gradient-to-r from-red-950 via-rose-950 to-amber-950 hover:brightness-110 border-amber-500/60 text-amber-300 cursor-pointer'
                      : 'bg-black/30 border-slate-700/50 text-slate-500 opacity-45 cursor-not-allowed'
                  }`}
                  title={
                    phase === 'end' || isSummaryOpen
                      ? 'الكشف ممنوع عند انتهاء المباراة'
                      : 'كشف المقاطعة (+١٥)'
                  }
                >
                  <ShieldAlert className={`w-3.5 h-3.5 shrink-0 ${canChallenge ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>كشف (+١٥)</span>
                </button>
              );
            })()}

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-black/30 hover:bg-black/50 border border-amber-400/40 text-xs font-bold text-amber-300 flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              title="تخصيص أسماء اللاعبين، لون الطاولة، وخلفية البطاقات"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">الإعدادات</span>
            </button>

            <button
              onClick={toggleSound}
              aria-label="تبديل الصوت"
              className="p-2 rounded-xl bg-black/30 hover:bg-black/50 border border-emerald-600/40 text-amber-300 transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            <button
              onClick={() => setIsRulesOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-black/30 hover:bg-black/50 border border-emerald-600/40 text-xs font-bold text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">القواعد</span>
            </button>
          </div>
        </header>
      )}

      {/* ---------------- MAIN FELT TABLE ---------------- */}
      <main className="flex-1 flex flex-col items-center justify-start p-1 sm:p-2 max-w-5xl w-full mx-auto relative overflow-hidden">
        {/* Floating Masoul Announcement Banner */}
        {masoulAnnounceBanner && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-slate-950 font-black shadow-2xl border-2 border-amber-200 animate-in fade-in slide-in-from-top-4 duration-300 flex flex-col items-center text-center">
            <span className="text-sm sm:text-base drop-shadow">{masoulAnnounceBanner.text}</span>
            {masoulAnnounceBanner.subtext && (
              <span className="text-[10px] sm:text-xs text-amber-950/90 font-bold">{masoulAnnounceBanner.subtext}</span>
            )}
          </div>
        )}

        <div
          ref={tableRef}
          className={`relative w-full ${
            isWatch
              ? 'max-w-[310px] h-[185px] rounded-[26px] p-1'
              : 'max-w-4xl h-[235px] sm:h-[265px] md:h-[285px] rounded-[36px] sm:rounded-[55px] md:rounded-[70px] p-1.5 sm:p-2'
          }
            ${tableTheme.outerRail}
            border-2 sm:border-4
            shadow-[0_16px_40px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.08)]
            transition-all duration-300 overflow-hidden
            ${isCollectingTrick ? 'brightness-105' : ''}
          `}
        >
          {/* Middle Racetrack Wood Veneer */}
          <div
            className={`w-full h-full ${
              isWatch ? 'rounded-[22px] p-0.5' : 'rounded-[30px] sm:rounded-[50px] md:rounded-[64px] p-1 sm:p-1.5'
            }
            ${tableTheme.woodVeneer}
            shadow-inner relative transition-colors duration-300`}
          >
            {/* Corner Brass Studs */}
            <div className={`absolute top-1 left-2 sm:top-2 sm:left-4 w-1.5 h-1.5 rounded-full ${tableTheme.studs} shadow-sm pointer-events-none`} />
            <div className={`absolute top-1 right-2 sm:top-2 sm:right-4 w-1.5 h-1.5 rounded-full ${tableTheme.studs} shadow-sm pointer-events-none`} />
            <div className={`absolute bottom-1 left-2 sm:bottom-2 sm:left-4 w-1.5 h-1.5 rounded-full ${tableTheme.studs} shadow-sm pointer-events-none`} />
            <div className={`absolute bottom-1 right-2 sm:bottom-2 sm:right-4 w-1.5 h-1.5 rounded-full ${tableTheme.studs} shadow-sm pointer-events-none`} />

            {/* Inner Playing Felt Arena */}
            <div
              className={`relative w-full h-full ${
                isWatch ? 'rounded-[20px]' : 'rounded-[25px] sm:rounded-[45px] md:rounded-[60px]'
              }
              ${tableTheme.feltArena}
              border-2 shadow-[inset_0_0_60px_rgba(0,0,0,0.7)]
              overflow-hidden transition-all duration-300`}
            >
              {/* Subtle cloth weave texture */}
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:10px_10px] pointer-events-none opacity-80" />

              {/* Center Traditional Omani Watermark Logo */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 sm:w-28 sm:h-28 rounded-full border border-white/5 flex items-center justify-center pointer-events-none">
                <span className={`${isWatch ? 'text-2xl' : 'text-3xl'} opacity-25 font-serif font-bold`}>🇴🇲</span>
              </div>

              {/* ---------------- 4 SEATS AROUND THE TABLE ---------------- */}
              {/* Top: Partner (الشريك) */}
              <div className={`absolute ${isWatch ? 'top-0.5' : 'top-1 sm:top-1.5'} left-1/2 -translate-x-1/2 z-10`}>
                <PlayerSeat
                  id={2}
                  name={getPlayerName(2)}
                  position="top"
                  isTurn={!isDealing && turn === 2}
                  isDealer={dealer === 2}
                  isBidder={bidder === 2}
                  isTrickWinner={trickWinner === 2 || collectWinner === 2}
                  cardCount={hands[2].length}
                  bid={bids[2]}
                  contract={contract}
                  trump={trump}
                  phase={phase}
                  teamTricks={tricks[0]}
                  cardBackStyle={settings.cardBackStyle}
                  isWatch={isWatch}
                  isDealing={isDealing}
                  isReceivingDeal={isDealing && dealingTarget === 2}
                  isJustBid={activeBidPulse?.player === 2 && activeBidPulse.amount > 0}
                  isHighestBidder={phase === 'auction' && bidder === 2}
                />
              </div>

              {/* Right: Opponent 1 (المنافس ١) */}
              <div className={`absolute top-1/2 ${isWatch ? 'right-1' : 'right-1.5 sm:right-2.5'} -translate-y-1/2 z-10`}>
                <PlayerSeat
                  id={1}
                  name={getPlayerName(1)}
                  position="right"
                  isTurn={!isDealing && turn === 1}
                  isDealer={dealer === 1}
                  isBidder={bidder === 1}
                  isTrickWinner={trickWinner === 1 || collectWinner === 1}
                  cardCount={hands[1].length}
                  bid={bids[1]}
                  contract={contract}
                  trump={trump}
                  phase={phase}
                  teamTricks={tricks[1]}
                  cardBackStyle={settings.cardBackStyle}
                  isWatch={isWatch}
                  isDealing={isDealing}
                  isReceivingDeal={isDealing && dealingTarget === 1}
                  isJustBid={activeBidPulse?.player === 1 && activeBidPulse.amount > 0}
                  isHighestBidder={phase === 'auction' && bidder === 1}
                />
              </div>

              {/* Left: Opponent 2 (المنافس ٢) */}
              <div className={`absolute top-1/2 ${isWatch ? 'left-1' : 'left-1.5 sm:left-2.5'} -translate-y-1/2 z-10`}>
                <PlayerSeat
                  id={3}
                  name={getPlayerName(3)}
                  position="left"
                  isTurn={!isDealing && turn === 3}
                  isDealer={dealer === 3}
                  isBidder={bidder === 3}
                  isTrickWinner={trickWinner === 3 || collectWinner === 3}
                  cardCount={hands[3].length}
                  bid={bids[3]}
                  contract={contract}
                  trump={trump}
                  phase={phase}
                  teamTricks={tricks[1]}
                  cardBackStyle={settings.cardBackStyle}
                  isWatch={isWatch}
                  isDealing={isDealing}
                  isReceivingDeal={isDealing && dealingTarget === 3}
                  isJustBid={activeBidPulse?.player === 3 && activeBidPulse.amount > 0}
                  isHighestBidder={phase === 'auction' && bidder === 3}
                />
              </div>

              {/* Bottom: You (أنت) */}
              <div className={`absolute ${isWatch ? 'bottom-0.5' : 'bottom-1 sm:bottom-1.5'} left-1/2 -translate-x-1/2 z-10`}>
                <PlayerSeat
                  id={0}
                  name={getPlayerName(0)}
                  position="bottom"
                  isTurn={!isDealing && turn === 0}
                  isDealer={dealer === 0}
                  isBidder={bidder === 0}
                  isTrickWinner={trickWinner === 0 || collectWinner === 0}
                  cardCount={hands[0].length}
                  bid={bids[0]}
                  contract={contract}
                  trump={trump}
                  phase={phase}
                  teamTricks={tricks[0]}
                  cardBackStyle={settings.cardBackStyle}
                  isWatch={isWatch}
                  isDealing={isDealing}
                  isReceivingDeal={isDealing && dealingTarget === 0}
                  isJustBid={activeBidPulse?.player === 0 && activeBidPulse.amount > 0}
                  isHighestBidder={phase === 'auction' && bidder === 0}
                />
              </div>

              {/* ---------------- TEAM WON TRICK BUNDLES BESIDE SEATS (SIDE-BY-SIDE) ---------------- */}
              {/* Team 0 Won Tricks (فريقنا — جنب بعض بجانب مقعدك) */}
              <div
                id="team-stack-0"
                dir="ltr"
                className={`absolute ${
                  isWatch
                    ? 'bottom-1.5 left-2 max-w-[34%] gap-0.5'
                    : 'bottom-2 sm:bottom-3 left-5 sm:left-10 md:left-14 max-w-[34%] sm:max-w-[36%] gap-1 sm:gap-1.5'
                } z-15 pointer-events-none flex flex-wrap items-center`}
              >
                {teamTrickPiles[0].map((_, pIdx) => {
                  const isLatest = pIdx === teamTrickPiles[0].length - 1;
                  return (
                    <div
                      key={pIdx}
                      id={`team-stack-0-item-${pIdx}`}
                      style={{ transform: `rotate(${pIdx % 2 === 0 ? -4 : 4}deg)` }}
                      className={`relative shrink-0 ${
                        isWatch ? 'w-3.5 h-5' : 'w-5 h-7 sm:w-6 sm:h-9 md:w-7 md:h-10'
                      } rounded shadow-md ${isLatest ? 'animate-trick-packet-snap' : ''}`}
                    >
                      <div className="w-full h-full rounded bg-[#0b271e] border border-emerald-400/70 shadow-sm translate-x-[1.5px] translate-y-[1.5px] absolute inset-0" />
                      <CardView
                        faceDown
                        cardBackStyle={settings.cardBackStyle}
                        size="xs"
                        className="!w-full !h-full !p-0.5 !rounded border border-amber-300/80 shadow-md"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Team 1 Won Tricks (المنافس — جنب بعض بجانب مقعد المنافسين) */}
              <div
                id="team-stack-1"
                dir="rtl"
                className={`absolute ${
                  isWatch
                    ? 'top-1.5 right-2 max-w-[34%] gap-0.5'
                    : 'top-2 sm:top-3 right-5 sm:right-10 md:right-14 max-w-[34%] sm:max-w-[36%] gap-1 sm:gap-1.5'
                } z-15 pointer-events-none flex flex-wrap items-center`}
              >
                {teamTrickPiles[1].map((_, pIdx) => {
                  const isLatest = pIdx === teamTrickPiles[1].length - 1;
                  return (
                    <div
                      key={pIdx}
                      id={`team-stack-1-item-${pIdx}`}
                      style={{ transform: `rotate(${pIdx % 2 === 0 ? 4 : -4}deg)` }}
                      className={`relative shrink-0 ${
                        isWatch ? 'w-3.5 h-5' : 'w-5 h-7 sm:w-6 sm:h-9 md:w-7 md:h-10'
                      } rounded shadow-md ${isLatest ? 'animate-trick-packet-snap' : ''}`}
                    >
                      <div className="w-full h-full rounded bg-[#2a0c12] border border-amber-400/70 shadow-sm translate-x-[1.5px] translate-y-[1.5px] absolute inset-0" />
                      <CardView
                        faceDown
                        cardBackStyle={settings.cardBackStyle}
                        size="xs"
                        className="!w-full !h-full !p-0.5 !rounded border border-amber-300/80 shadow-md"
                      />
                    </div>
                  );
                })}
              </div>

              {/* ---------------- CENTER PLAY ZONE & CENTER DECK ---------------- */}
              {/* Center Deck Anchor & Trick Counter */}
              <div
                id="center-deck-pile"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-25 pointer-events-none text-center flex flex-col items-center gap-1"
              >
                {tableAnimPhase !== 'idle' ? (
                  <>
                    {tableAnimPhase === 'shuffling' ? (
                      <div className="relative flex items-center justify-center w-20 h-16 sm:w-24 sm:h-20">
                        <div className="relative animate-shuffle-left">
                          <div className="absolute inset-0 translate-x-[2px] translate-y-[2px] rounded-md bg-black/70 border border-amber-400/50" />
                          <CardView faceDown cardBackStyle={settings.cardBackStyle} size={isWatch ? 'xs' : 'sm'} className="shadow-2xl border-amber-300/80" />
                        </div>
                        <div className="relative -ml-7 sm:-ml-8 animate-shuffle-right">
                          <div className="absolute inset-0 translate-x-[2px] translate-y-[2px] rounded-md bg-black/70 border border-amber-400/50" />
                          <CardView faceDown cardBackStyle={settings.cardBackStyle} size={isWatch ? 'xs' : 'sm'} className="shadow-2xl border-amber-300/80" />
                        </div>
                      </div>
                    ) : centerDeckCount > 0 ? (
                      <div className="relative flex items-center justify-center">
                        {centerDeckCount > 18 && (
                          <div className="absolute inset-0 translate-x-[4px] translate-y-[4px] rounded-md bg-[#091a14] border border-amber-400/40 shadow-lg" />
                        )}
                        {centerDeckCount > 6 && (
                          <div className="absolute inset-0 translate-x-[2px] translate-y-[2px] rounded-md bg-[#0d281f] border border-amber-400/60 shadow-lg" />
                        )}
                        <CardView
                          faceDown
                          cardBackStyle={settings.cardBackStyle}
                          size={isWatch ? 'xs' : 'sm'}
                          className="relative shadow-2xl ring-1 ring-amber-300/70"
                        />
                        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-black/85 border border-amber-400/70 text-[8.5px] sm:text-[9.5px] font-black text-amber-300 shadow">
                          {centerDeckCount}
                        </span>
                      </div>
                    ) : null}

                    <div className={`rounded-full bg-black/80 border border-amber-400/60 font-bold text-amber-200 shadow-lg backdrop-blur-sm mt-1 ${
                      isWatch ? 'text-[8px] px-1.5 py-0.5' : 'text-[10px] sm:text-xs px-2.5 py-0.5 flex items-center gap-1.5'
                    }`}>
                      {tableAnimPhase === 'gathering' && <span className="text-amber-300">جمع الأوراق...</span>}
                      {tableAnimPhase === 'shuffling' && <span className="text-amber-300 animate-pulse">خبص الأوراق...</span>}
                      {tableAnimPhase === 'dealing' && (
                        <span className="flex items-center gap-1 text-amber-300">
                          <span>توزيع ٣×٣</span>
                          {dealingTarget !== null && (
                            <span className="text-emerald-300 font-black">
                              ← {getPlayerName(dealingTarget).split(' ')[0]}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className={`rounded-full bg-black/75 border border-amber-400/50 font-bold text-amber-200 shadow-lg backdrop-blur-sm ${
                    isWatch ? 'text-[8.5px] px-2 py-0.5' : 'text-[10px] sm:text-xs px-2.5 py-0.5 flex items-center gap-1.5'
                  }`}>
                    {phase === 'auction' ? (
                      bid > 0 && bidder !== null ? (
                        <span className="flex items-center gap-1">
                          <Gavel className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>أعلى شراء: <strong className="text-white">{bid}</strong></span>
                          {!isWatch && (
                            <span className="text-emerald-300 font-bold">({getPlayerName(bidder).split(' ')[0]})</span>
                          )}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-300">
                          <Gavel className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>المزايدة جارية</span>
                        </span>
                      )
                    ) : phase === 'trump' && bidder !== null ? (
                      <span className="flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>اختيار الحكم ({contract})</span>
                      </span>
                    ) : (
                      <>
                        <span>اللمّة {Math.min(9, completedTricks + 1)}/9</span>
                        {phase === 'play' && trump && bidder !== null && !isWatch && (
                          <span className="text-[9.5px] text-emerald-300 border-r border-amber-400/40 pr-1.5 mr-1 flex items-center gap-1">
                            <span>الحكم: {trump}</span>
                            <span className="text-amber-300 font-black">({getPlayerName(bidder).split(' ')[0]} {contract})</span>
                          </span>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* ---------------- ON-TABLE ANIMATED AUCTION BID CALLOUTS ---------------- */}
              {!isDealing && (phase === 'auction' || phase === 'trump') && ([0, 1, 2, 3] as PlayerId[]).map((pId) => {
                const bidVal = bids[pId];
                if (bidVal === null) return null;
                // In trump phase, keep only the winning bidder's callout illuminated beside their seat
                if (phase === 'trump' && bidder !== pId) return null;

                const isHighest = bidder === pId && bidVal > 0;
                const isBursting = activeBidPulse?.player === pId && activeBidPulse.amount === bidVal;
                const arabicDigits: Record<number, string> = { 5: '٥', 6: '٦', 7: '٧', 8: '٨', 9: '٩' };

                const posClass =
                  pId === 2
                    ? isWatch
                      ? 'top-[25%] left-1/2 -translate-x-1/2'
                      : 'top-[23%] sm:top-[22%] left-1/2 -translate-x-1/2'
                    : pId === 0
                    ? isWatch
                      ? 'bottom-[25%] left-1/2 -translate-x-1/2'
                      : 'bottom-[23%] sm:bottom-[22%] left-1/2 -translate-x-1/2'
                    : pId === 1
                    ? isWatch
                      ? 'top-1/2 right-[23%] -translate-y-1/2'
                      : 'top-1/2 right-[22%] sm:right-[23%] md:right-[24%] -translate-y-1/2'
                    : isWatch
                    ? 'top-1/2 left-[23%] -translate-y-1/2'
                    : 'top-1/2 left-[22%] sm:left-[23%] md:left-[24%] -translate-y-1/2';

                return (
                  <div
                    key={`bid-callout-${pId}-${bidVal}-${isBursting ? activeBidPulse?.key : 'steady'}`}
                    className={`absolute ${posClass} z-25 pointer-events-none flex items-center justify-center`}
                  >
                    {bidVal === 0 ? (
                      <div
                        className={`animate-pass-pop rounded-full bg-slate-950/85 border border-slate-500/60 text-slate-300 font-bold shadow-md backdrop-blur-sm flex items-center gap-1 ${
                          isWatch ? 'px-1.5 py-0.2 text-[8px]' : 'px-2.5 py-0.5 text-[10px] sm:text-[11px]'
                        }`}
                      >
                        <span>طاف</span>
                      </div>
                    ) : (
                      <div className="relative flex items-center justify-center">
                        {/* Radiating golden shockwave ring when newly bid */}
                        {isBursting && (
                          <span
                            className={`absolute inset-0 rounded-2xl border-2 pointer-events-none animate-bid-ripple ${
                              bidVal === 9
                                ? 'border-yellow-200 bg-amber-300/20'
                                : bidVal === 8
                                ? 'border-orange-300 bg-amber-400/15'
                                : 'border-amber-300 bg-amber-400/10'
                            }`}
                          />
                        )}

                        <div
                          className={`animate-bid-pop relative flex items-center gap-1.5 rounded-2xl shadow-xl backdrop-blur-md transition-all ${
                            isWatch ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 sm:px-3 sm:py-1 text-xs'
                          } ${
                            bidVal === 9
                              ? 'bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 text-slate-950 border-2 border-white shadow-[0_0_24px_rgba(251,191,36,0.95)]'
                              : bidVal === 8
                              ? 'bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 text-slate-950 border-2 border-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.9)]'
                              : isHighest
                              ? 'bg-gradient-to-br from-[#1f5c43] via-[#133d2c] to-[#0a2319] text-amber-200 border-2 border-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.75)]'
                              : 'bg-gradient-to-br from-[#13382b]/95 to-[#081c15]/95 text-amber-300 border border-amber-500/70 shadow-lg'
                          }`}
                        >
                          {bidVal === 9 ? (
                            <Crown className={`${isWatch ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} text-slate-950 shrink-0`} />
                          ) : bidVal === 8 ? (
                            <Flame className={`${isWatch ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} text-slate-950 shrink-0`} />
                          ) : (
                            <Gavel className={`${isWatch ? 'w-2.5 h-2.5' : 'w-3 h-3'} ${isHighest ? 'text-amber-300' : 'text-amber-400'} shrink-0`} />
                          )}

                          <span className={`font-black leading-none ${isWatch ? 'text-[11px]' : 'text-sm sm:text-base'}`}>
                            {arabicDigits[bidVal] || bidVal}
                          </span>

                          {!isWatch && (
                            <span
                              className={`text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                                bidVal >= 8
                                  ? 'bg-black/20 text-slate-950'
                                  : isHighest
                                  ? 'bg-amber-400/20 text-amber-200 border border-amber-400/40'
                                  : 'bg-black/35 text-emerald-200'
                              }`}
                            >
                              {bidVal === 9 ? 'باوند!' : bidVal === 8 ? 'انزل لي' : bidVal === 5 ? 'إلزام' : 'شراء'}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Played Card Slot: Top (Player 2) */}
              <div
                id="played-slot-2"
                className={`absolute ${isWatch ? 'top-[31%]' : 'top-[34%] sm:top-[33%]'} left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-300`}
              >
                {activeTrumpPlay?.player === 2 && (
                  <>
                    <div className="absolute inset-0 -m-1 rounded-xl border border-amber-300/80 animate-ping pointer-events-none opacity-50" />
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 pointer-events-none z-30 animate-in fade-in zoom-in-75 duration-150 whitespace-nowrap">
                      <span className={`text-[7.5px] sm:text-[8px] font-black px-1.5 py-0.2 rounded-full shadow border ${
                        activeTrumpPlay.isCut
                          ? 'bg-red-600 border-red-300 text-white'
                          : 'bg-amber-400 border-amber-200 text-slate-950'
                      }`}>
                        {activeTrumpPlay.isCut ? '⚔️ قطع!' : `✨ حكم ${activeTrumpPlay.suit}`}
                      </span>
                    </div>
                  </>
                )}
                {trick.find((x) => x.p === 2) && (
                  <CardView
                    card={trick.find((x) => x.p === 2)?.c}
                    size={isWatch ? 'xs' : 'sm'}
                    isWinningCard={winningCardId === trick.find((x) => x.p === 2)?.c.id}
                    cardBackStyle={settings.cardBackStyle}
                    className={cardShakeMode === 'challenge' ? 'animate-card-challenge-shake' : ''}
                  />
                )}
              </div>

              {/* Played Card Slot: Right (Player 1) */}
              <div
                id="played-slot-1"
                className={`absolute top-1/2 ${isWatch ? 'right-[31%]' : 'right-[34%] sm:right-[36%]'} translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-300`}
              >
                {activeTrumpPlay?.player === 1 && (
                  <>
                    <div className="absolute inset-0 -m-1 rounded-xl border border-amber-300/80 animate-ping pointer-events-none opacity-50" />
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 pointer-events-none z-30 animate-in fade-in zoom-in-75 duration-150 whitespace-nowrap">
                      <span className={`text-[7.5px] sm:text-[8px] font-black px-1.5 py-0.2 rounded-full shadow border ${
                        activeTrumpPlay.isCut
                          ? 'bg-red-600 border-red-300 text-white'
                          : 'bg-amber-400 border-amber-200 text-slate-950'
                      }`}>
                        {activeTrumpPlay.isCut ? '⚔️ قطع!' : `✨ حكم ${activeTrumpPlay.suit}`}
                      </span>
                    </div>
                  </>
                )}
                {trick.find((x) => x.p === 1) && (
                  <CardView
                    card={trick.find((x) => x.p === 1)?.c}
                    size={isWatch ? 'xs' : 'sm'}
                    isWinningCard={winningCardId === trick.find((x) => x.p === 1)?.c.id}
                    cardBackStyle={settings.cardBackStyle}
                    className={cardShakeMode === 'challenge' ? 'animate-card-challenge-shake' : ''}
                  />
                )}
              </div>

              {/* Played Card Slot: Bottom (Player 0) */}
              <div
                id="played-slot-0"
                className={`absolute ${isWatch ? 'bottom-[31%]' : 'bottom-[34%] sm:bottom-[33%]'} left-1/2 -translate-x-1/2 translate-y-1/2 z-20 transition-all duration-300`}
              >
                {activeTrumpPlay?.player === 0 && (
                  <>
                    <div className="absolute inset-0 -m-1 rounded-xl border border-amber-300/80 animate-ping pointer-events-none opacity-50" />
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 pointer-events-none z-30 animate-in fade-in zoom-in-75 duration-150 whitespace-nowrap">
                      <span className={`text-[7.5px] sm:text-[8px] font-black px-1.5 py-0.2 rounded-full shadow border ${
                        activeTrumpPlay.isCut
                          ? 'bg-red-600 border-red-300 text-white'
                          : 'bg-amber-400 border-amber-200 text-slate-950'
                      }`}>
                        {activeTrumpPlay.isCut ? '⚔️ قطع!' : `✨ حكم ${activeTrumpPlay.suit}`}
                      </span>
                    </div>
                  </>
                )}
                {trick.find((x) => x.p === 0) && (
                  <CardView
                    card={trick.find((x) => x.p === 0)?.c}
                    size={isWatch ? 'xs' : 'sm'}
                    isWinningCard={winningCardId === trick.find((x) => x.p === 0)?.c.id}
                    cardBackStyle={settings.cardBackStyle}
                    className={cardShakeMode === 'challenge' ? 'animate-card-challenge-shake' : ''}
                  />
                )}
              </div>

              {/* Played Card Slot: Left (Player 3) */}
              <div
                id="played-slot-3"
                className={`absolute top-1/2 ${isWatch ? 'left-[31%]' : 'left-[34%] sm:left-[36%]'} -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-300`}
              >
                {activeTrumpPlay?.player === 3 && (
                  <>
                    <div className="absolute inset-0 -m-1 rounded-xl border border-amber-300/80 animate-ping pointer-events-none opacity-50" />
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 pointer-events-none z-30 animate-in fade-in zoom-in-75 duration-150 whitespace-nowrap">
                      <span className={`text-[7.5px] sm:text-[8px] font-black px-1.5 py-0.2 rounded-full shadow border ${
                        activeTrumpPlay.isCut
                          ? 'bg-red-600 border-red-300 text-white'
                          : 'bg-amber-400 border-amber-200 text-slate-950'
                      }`}>
                        {activeTrumpPlay.isCut ? '⚔️ قطع!' : `✨ حكم ${activeTrumpPlay.suit}`}
                      </span>
                    </div>
                  </>
                )}
                {trick.find((x) => x.p === 3) && (
                  <CardView
                    card={trick.find((x) => x.p === 3)?.c}
                    size={isWatch ? 'xs' : 'sm'}
                    isWinningCard={winningCardId === trick.find((x) => x.p === 3)?.c.id}
                    cardBackStyle={settings.cardBackStyle}
                    className={cardShakeMode === 'challenge' ? 'animate-card-challenge-shake' : ''}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Flying Cards Layer */}
          {flyingCards.map((f) => {
            const dur = f.durationMs ?? (settings.fastAnimations ? 240 : 400);
            const tx = f.endX - f.startX;
            const ty = f.endY - f.startY;
            return (
              <div
                key={f.id}
                style={{
                  position: 'fixed',
                  left: f.startX,
                  top: f.startY,
                  zIndex: 9999,
                  pointerEvents: 'none',
                  animation: `flyAcrossTable ${dur}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
                  ['--tx' as string]: `${tx}px`,
                  ['--ty' as string]: `${ty}px`,
                  ['--srot' as string]: `${f.startRot ?? 0}deg`,
                  ['--erot' as string]: `${f.rot}deg`,
                  ['--sscale' as string]: `${f.startScale ?? 1}`,
                  ['--escale' as string]: `${f.endScale ?? 1}`,
                }}
              >
                <CardView
                  card={f.card}
                  faceDown={f.faceDown}
                  size={isWatch ? 'xs' : f.size ?? 'sm'}
                  className="shadow-2xl ring-2 ring-amber-300/80"
                  cardBackStyle={settings.cardBackStyle}
                />
              </div>
            );
          })}
        </div>

        {/* ---------------- STATUS CALLOUT ---------------- */}
        <div className={`w-full max-w-2xl text-center px-1 ${isWatch ? 'mt-0.5 mb-0.5' : 'mt-1 mb-0.5'}`}>
          <div
            className={`${isWatch ? 'text-[10px]' : 'text-xs'} font-extrabold flex items-center justify-center gap-1.5 transition-colors ${
              statusMessage.includes('مقاطعة')
                ? 'text-rose-300'
                : 'text-amber-300'
            }`}
          >
            <Sparkles
              className={`w-3.5 h-3.5 shrink-0 animate-pulse ${
                statusMessage.includes('مقاطعة') ? 'text-rose-400' : 'text-amber-400'
              }`}
            />
            <span className="truncate">{statusMessage}</span>
          </div>
        </div>

        {/* ---------------- PLAYER CONSOLE DECK (THE AREA UNDER THE TABLE) ---------------- */}
        <div className={`w-full ${isWatch ? 'max-w-[316px] p-1 gap-1 rounded-2xl mt-0.5 mb-1' : 'max-w-5xl p-1.5 sm:p-2 gap-2 rounded-xl sm:rounded-2xl mt-0.5 mb-1.5'} ${tableTheme.deckBg} border-2 ${tableTheme.deckBorder} shadow-xl backdrop-blur-md flex flex-col items-center transition-all duration-300`}>
          
          {/* Phase 1: Auction Bidding Console for Player 0 */}
          {phase === 'auction' && turn === 0 && !isDealing && (
            <div className={`w-full p-2.5 sm:p-3.5 rounded-2xl bg-black/80 border-2 border-amber-400/90 shadow-2xl flex flex-col items-center gap-2 animate-in fade-in duration-200 ${isWatch ? 'max-w-[275px]' : ''}`}>
              {/* Header */}
              <div className="flex items-center justify-between w-full border-b border-amber-500/30 pb-1.5">
                <div className="flex items-center gap-1.5 text-amber-300 font-extrabold text-xs sm:text-sm">
                  <Gavel className="w-4 h-4 text-amber-400" />
                  <span>المزايدة</span>
                </div>

                <div className="text-[11px] sm:text-xs bg-amber-950/60 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                  {bid > 0 ? (
                    <span>الأعلى: <strong className="text-white">{bid}</strong> ({bidder !== null ? getPlayerName(bidder) : ''})</span>
                  ) : (
                    <span>بدون شراء</span>
                  )}
                </div>
              </div>

              {/* Forced Dealer Notice */}
              {dealer === 0 && bidder === null && (
                <div className="w-full bg-amber-500/20 border border-amber-400/60 rounded-xl px-2.5 py-1.5 text-center text-xs text-amber-200 font-bold flex items-center justify-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>أنت الموزّع: متاح ٥ — أو «طاف» لإلزام ٥</span>
                </div>
              )}

              {/* Bidding Buttons Grid */}
              <div className={`grid ${isWatch ? 'grid-cols-3 gap-1.5' : 'grid-cols-2 sm:grid-cols-6 gap-2'} w-full`}>
                {(() => {
                  const isFiveEligible = dealer === 0 && bidder === null;
                  return (
                    <button
                      type="button"
                      disabled={!isFiveEligible}
                      onClick={() => handleBid(0, 5)}
                      className={`py-2 px-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                        isFiveEligible
                          ? 'bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 text-slate-950 font-black shadow-lg active:scale-95 border border-amber-300 cursor-pointer ring-2 ring-amber-300'
                          : 'bg-black/40 border border-slate-800 text-slate-600 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-base font-black">٥</span>
                      <span className="text-[9px] opacity-80">موزّع</span>
                    </button>
                  );
                })()}

                {[
                  { val: 6, label: '٦', hint: '' },
                  { val: 7, label: '٧', hint: '' },
                  { val: 8, label: '٨', hint: 'انزل لي' },
                  { val: 9, label: 'باوند ٩', hint: '+١٨' },
                ].map(({ val, label, hint }) => {
                  const isEligible = val > bid;

                  return (
                    <button
                      key={val}
                      type="button"
                      disabled={!isEligible}
                      onClick={() => handleBid(0, val)}
                      className={`py-2 px-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                        isEligible
                          ? 'bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 text-slate-950 font-black shadow-md active:scale-95 border border-amber-300 cursor-pointer'
                          : 'bg-black/40 border border-slate-800 text-slate-500 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-base font-black">{label}</span>
                      {hint && <span className="text-[9px] opacity-80">{hint}</span>}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => handlePass(0)}
                  className="py-2 px-2 rounded-xl flex flex-col items-center justify-center transition-all bg-gradient-to-b from-rose-950 via-rose-900 to-slate-950 hover:from-rose-900 text-rose-200 border border-rose-600/60 shadow active:scale-95 cursor-pointer"
                >
                  <span className="text-base font-black">طاف</span>
                  {dealer === 0 && bidder === null && (
                    <span className="text-[9px] opacity-80">إلزام ٥</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Phase 2: Trump Selection Console for Player 0 */}
          {phase === 'trump' && bidder === 0 && (
            <div className={`w-full p-2.5 sm:p-3.5 rounded-2xl bg-black/85 border-2 border-amber-400/90 shadow-2xl flex flex-col items-center gap-2 animate-in fade-in duration-200 ${isWatch ? 'max-w-[275px]' : ''}`}>
              <div className="flex items-center justify-between w-full border-b border-amber-500/30 pb-1.5">
                <div className="flex items-center gap-1.5 text-amber-300 font-extrabold text-xs sm:text-sm">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>الشراء: {contract}</span>
                </div>
                <span className="text-xs text-emerald-300 font-bold">اختر الحكم</span>
              </div>

              {/* 4 Interactive Suit Cards */}
              <div className={`grid ${isWatch ? 'grid-cols-2 gap-1.5 w-full' : 'grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 w-full'}`}>
                {SUITS.map((suit) => {
                  const red = isRed(suit);
                  const count = userSuitStats.counts[suit];
                  const suitHonors = userSuitStats.honors[suit];

                  return (
                    <button
                      key={suit}
                      type="button"
                      onClick={() => handleSelectTrump(suit)}
                      className={`relative p-2.5 rounded-2xl border-2 flex flex-col items-center justify-between gap-1 transition-all group cursor-pointer shadow-lg active:scale-95 ${
                        red
                          ? 'bg-gradient-to-b from-[#2a0e14] via-[#1a060b] to-[#0d0205] border-red-500/60 hover:border-red-400 hover:from-[#3d121c]'
                          : 'bg-gradient-to-b from-[#0e2a20] via-[#071a13] to-[#040e0a] border-emerald-600/60 hover:border-emerald-400 hover:from-[#153b2d]'
                      }`}
                    >
                      <span className={`text-4xl sm:text-5xl font-serif font-black transition-transform group-hover:scale-110 ${red ? 'text-[#e11d48]' : 'text-slate-100'}`}>
                        {suit}
                      </span>

                      <div className="text-center">
                        <span className={`text-sm font-bold block ${red ? 'text-red-300' : 'text-emerald-200'}`}>
                          {SUIT_NAMES[suit]}
                        </span>
                        <span className="text-[10px] text-slate-300 font-semibold block mt-0.5">
                          ({count})
                        </span>
                      </div>

                      {suitHonors.length > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                          {suitHonors.map((h, i) => (
                            <span key={i} className="text-[9px] bg-black/60 text-amber-300 px-1 py-0.2 rounded font-black border border-amber-500/30">
                              {h}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}



          {/* Phase 3: Player Hand Cards Deck & Adjacent Tactical HUD */}
          <div className={`w-full flex ${
            isWatch ? 'flex-row items-center justify-between gap-1' : 'flex-col sm:flex-row items-center sm:items-stretch gap-2'
          }`}>
            {/* Tactical Game Metrics Card - Clearly readable and positioned right next to hand cards */}
            <div
              className={`${
                isWatch
                  ? 'w-[102px] shrink-0 p-1.5 text-[9.5px] rounded-xl bg-black/75 border border-amber-400/60 shadow-lg'
                  : 'w-full sm:w-44 md:w-52 p-1.5 text-[10px] rounded-xl shrink-0'
              } ${tableTheme.hudBg} border border-amber-500/40 backdrop-blur-md flex flex-col justify-between gap-1`}
            >
              {isWatch ? (
                <>
                  {/* Row 1: الشراء وقيمته واسم المشتري */}
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[8.5px] text-slate-300 font-bold">الشراء:</span>
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-[10px] font-black text-amber-300">
                        {isBound ? (isMasoul ? 'باوند (م)' : 'باوند') : (contract ? `${contract}` : (bid > 0 ? `${bid}` : '—'))}
                      </span>
                      {bidder !== null && (
                        <span className="text-[8.5px] font-black text-amber-200 bg-amber-950/80 border border-amber-500/50 px-1 py-0.2 rounded truncate max-w-[48px]" title={`المشتري: ${getPlayerName(bidder)}`}>
                          {getPlayerName(bidder).split(' ')[0]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: الحكم */}
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[8.5px] text-slate-300 font-bold">الحكم:</span>
                    {trump ? (
                      <span className={`text-[10.5px] font-black font-serif flex items-center gap-0.5 ${isRed(trump) ? 'text-red-400' : 'text-slate-100'}`}>
                        <span className="text-xs">{trump}</span>
                        <span className="text-[9px] font-sans font-bold">{SUIT_NAMES[trump]}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[9px] font-bold">—</span>
                    )}
                  </div>

                  {/* Row 3: فوز وخسارة فريقي */}
                  <div className="grid grid-cols-2 gap-1 bg-black/60 px-1 py-0.5 rounded-md border border-white/10 text-center">
                    <div className="flex flex-col items-center leading-none">
                      <span className="text-[7.5px] text-emerald-300 font-bold">فوزنا</span>
                      <span className="text-[11px] font-black text-emerald-400">{tricksForMyTeamWin !== null ? `${tricksForMyTeamWin}` : '—'}</span>
                    </div>
                    <div className="flex flex-col items-center leading-none">
                      <span className="text-[7.5px] text-rose-300 font-bold">خسارتنا</span>
                      <span className="text-[11px] font-black text-rose-400">{tricksForMyTeamLoss !== null ? `${tricksForMyTeamLoss}` : '—'}</span>
                    </div>
                  </div>

                  {/* Row 4: لمّات الجولة + كشف */}
                  <div className="flex items-center justify-between gap-1 pt-0.5 border-t border-white/10">
                    <div className="text-[9.5px] font-black text-slate-100">
                      <span className="text-emerald-300">{tricks[0]}</span>
                      <span className="text-slate-400 mx-0.5">:</span>
                      <span className="text-amber-300">{tricks[1]}</span>
                    </div>
                    {phase === 'play' && !isSummaryOpen && !isMasoulModalOpen && !isDealing && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => {
                          if (!isBusy) setIsChallengeOpen(true);
                        }}
                        className="py-0.5 px-1.5 rounded bg-red-950 hover:bg-red-900 disabled:opacity-40 disabled:cursor-not-allowed border border-amber-400/70 text-[8.5px] font-black text-amber-200 cursor-pointer active:scale-95 shadow"
                        title="كشف المقاطعين"
                      >
                        كشف
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-emerald-800/40 pb-0.5">
                    <span className="text-[10px] font-black text-amber-300 flex items-center gap-1">
                      <Crown className="w-2.5 h-2.5 text-amber-400" />
                      <span>{isBound ? 'الباوند والحكم' : 'الشراء والحكم'}</span>
                    </span>
                    <div className="flex items-center gap-1">
                      {phase === 'play' && contract === 8 && completedTricks === 0 && (
                        <span className="text-[8px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full">
                          انزل لي
                        </span>
                      )}
                      <span className="text-[8.5px] text-emerald-300/80 font-bold">
                        ج{round}
                      </span>
                    </div>
                  </div>

                  {/* Row 1: الشراء والمشتري والحكم */}
                  <div className="bg-black/50 rounded-lg p-1.5 border border-emerald-900/50 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-[8px] text-slate-400 block leading-tight font-bold">
                        {isBound ? (isMasoul ? 'باوند مسؤول (١٨)' : 'باوند (١٨)') : 'الشراء'}
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-300 truncate mt-0.5">
                        {contract ? (
                          <>
                            <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="text-sm font-black text-amber-300">
                              {isBound ? '٩' : contract}
                            </span>
                            <span className="text-[9.5px] text-amber-200 bg-amber-950/80 border border-amber-500/60 px-1.5 py-0.2 rounded-md font-bold truncate">
                              {getPlayerName(bidder ?? 0)}
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-400 text-[9.5px] font-bold truncate">
                            {bid > 0 ? `${bid} (${getPlayerName(bidder ?? 0)})` : 'مزايدة'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Trump Badge (Compact) */}
                    <div className="text-center pl-0.5 border-r border-emerald-800/50 pr-2 shrink-0">
                      <span className="text-[8px] text-slate-400 block leading-tight font-bold">الحكم</span>
                      {trump ? (
                        <div className="flex items-center gap-1 justify-center mt-0.5">
                          <span className={`text-base sm:text-lg font-serif font-black ${isRed(trump) ? 'text-[#e11d48]' : 'text-slate-100'}`}>
                            {trump}
                          </span>
                          <span className={`text-[9.5px] font-bold ${isRed(trump) ? 'text-red-300' : 'text-slate-200'}`}>
                            {SUIT_NAMES[trump]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9.5px] text-slate-500 font-bold">—</span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: المتبقي للفوز والخسارة */}
                  <div className="grid grid-cols-2 gap-1 text-center">
                    <div className="bg-emerald-950/40 border border-emerald-600/40 rounded-md py-0.5 px-1">
                      <span className="text-[8px] text-emerald-200 block leading-none font-bold">للفوز</span>
                      <strong className="text-[10px] sm:text-[11px] font-black text-emerald-300 tabular-nums block mt-0.5">
                        {tricksForMyTeamWin !== null ? `${tricksForMyTeamWin}` : '—'}
                      </strong>
                    </div>

                    <div className="bg-rose-950/30 border border-rose-600/40 rounded-md py-0.5 px-1">
                      <span className="text-[8px] text-rose-200 block leading-none font-bold">للخسارة</span>
                      <strong className="text-[10px] sm:text-[11px] font-black text-rose-300 tabular-nums block mt-0.5">
                        {tricksForMyTeamLoss !== null ? `${tricksForMyTeamLoss}` : '—'}
                      </strong>
                    </div>
                  </div>

                  {/* Row 3: لمّات الجولة + كشف */}
                  <div className="flex items-center justify-between text-[8.5px] bg-black/45 px-1.5 py-0.5 rounded-md border border-emerald-900/40">
                    <div className="flex items-center gap-1 font-bold">
                      <span className="text-emerald-300">لنا: <b className="text-white text-[9.5px]">{tricks[0]}</b></span>
                      <span className="text-slate-600">:</span>
                      <span className="text-amber-300">لهم: <b className="text-white text-[9.5px]">{tricks[1]}</b></span>
                    </div>

                    {phase === 'play' && !isSummaryOpen && !isMasoulModalOpen && !isDealing && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => {
                          if (!isBusy) setIsChallengeOpen(true);
                        }}
                        className="py-0.5 px-1.5 rounded bg-gradient-to-r from-red-950 via-rose-950 to-amber-950 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed border border-amber-500/70 text-[8px] font-black text-amber-300 flex items-center gap-0.5 shadow cursor-pointer transition-all active:scale-95"
                        title="كشف المقاطعة (+١٥)"
                      >
                        <ShieldAlert className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                        <span>كشف (+١٥)</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Hand Cards Presentation Area */}
            <div className="flex-1 min-w-0 w-full flex flex-col items-center">
              {/* Hand Header Toolbar */}
              {!isWatch && (
                <div className="flex items-center justify-between w-full px-1 mb-1 gap-1.5">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[11px] font-black text-amber-300 flex items-center gap-1">
                      <span>أوراقك ({hands[0].length})</span>
                    </span>

                    <div className="hidden sm:flex items-center gap-1 text-[9px] bg-black/40 px-1.5 py-0.2 rounded-full border border-emerald-900/40">
                      <span className="text-slate-200">♣ {userSuitStats.counts['♣']}</span>
                      <span className="text-slate-500">|</span>
                      <span className="text-red-400">♥ {userSuitStats.counts['♥']}</span>
                      <span className="text-slate-500">|</span>
                      <span className="text-slate-200">♠ {userSuitStats.counts['♠']}</span>
                      <span className="text-slate-500">|</span>
                      <span className="text-red-400">♦ {userSuitStats.counts['♦']}</span>
                      {(userSuitStats.redJoker || userSuitStats.blackJoker) && (
                        <>
                          <span className="text-slate-500">|</span>
                          <span className="text-amber-300 font-bold">
                            🃏 {userSuitStats.redJoker && userSuitStats.blackJoker ? '٢' : '١'}
                          </span>
                        </>
                      )}
                      {hands[0].length === 2 && (userSuitStats.redJoker || userSuitStats.blackJoker) && (
                        <>
                          <span className="text-slate-500">|</span>
                          <span className="text-[8.5px] bg-red-950/80 text-rose-300 px-1.5 py-0.2 rounded border border-red-500/50 font-black animate-pulse">
                            ⚠️ الجوكر!
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {hands[0].length > 1 && !isDealing && (
                    <div className="flex items-center gap-1 bg-black/50 p-0.5 rounded-lg border border-emerald-800/60 shadow-xs">
                      <button
                        type="button"
                        onClick={handleSortBySuit}
                        className="py-0.5 px-1.5 rounded-md bg-[#0d2a21] hover:bg-[#153e31] text-[9px] sm:text-[10px] font-bold text-emerald-200 hover:text-amber-300 border border-emerald-700/50 flex items-center gap-1 cursor-pointer transition-colors"
                        title="ترتيب بالنوع"
                      >
                        <Layers className="w-2.5 h-2.5 text-amber-400" />
                        <span>النوع</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSortByRank}
                        className="py-0.5 px-1.5 rounded-md bg-[#0d2a21] hover:bg-[#153e31] text-[9px] sm:text-[10px] font-bold text-emerald-200 hover:text-amber-300 border border-emerald-700/50 flex items-center gap-1 cursor-pointer transition-colors"
                        title="ترتيب بالقوة"
                      >
                        <ArrowDownAZ className="w-2.5 h-2.5 text-amber-400" />
                        <span>القوة</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleReverseHand}
                        className="py-0.5 px-1 rounded-md bg-[#0d2a21] hover:bg-[#153e31] text-[9px] sm:text-[10px] font-bold text-emerald-200 hover:text-amber-300 border border-emerald-700/50 flex items-center cursor-pointer transition-colors"
                        title="عكس"
                      >
                        <ArrowLeftRight className="w-2.5 h-2.5 text-amber-400" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Selected Card Action Pill */}
              {selectedCardIdx !== null && hands[0][selectedCardIdx] && (
                <div className={`mb-1 p-0.5 sm:p-1 px-1.5 sm:px-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-500/30 via-amber-400/40 to-amber-500/30 border border-amber-400/80 flex items-center justify-between gap-1 w-full ${isWatch ? 'max-w-[210px]' : 'max-w-lg'} shadow-md animate-in fade-in duration-150`}>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] sm:text-xs text-amber-100 font-extrabold flex items-center gap-0.5">
                      <span>{formatRank(hands[0][selectedCardIdx].r, hands[0][selectedCardIdx].j)}</span>
                      <span className={isRed(hands[0][selectedCardIdx].s) ? 'text-[#e11d48] font-black font-serif text-xs sm:text-sm' : 'text-slate-100 font-black font-serif text-xs sm:text-sm'}>
                        {hands[0][selectedCardIdx].j ? '' : hands[0][selectedCardIdx].s}
                      </span>
                    </span>

                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={selectedCardIdx === 0}
                        onClick={() => handleShiftCard(selectedCardIdx, -1)}
                        className="p-0.5 rounded bg-black/50 hover:bg-black/70 disabled:opacity-25 text-amber-300 cursor-pointer border border-amber-400/30"
                        title="تحريك لليمين"
                      >
                        <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={selectedCardIdx === hands[0].length - 1}
                        onClick={() => handleShiftCard(selectedCardIdx, 1)}
                        className="p-0.5 rounded bg-black/50 hover:bg-black/70 disabled:opacity-25 text-amber-300 cursor-pointer border border-amber-400/30"
                        title="تحريك لليسار"
                      >
                        <ChevronLeft className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </button>
                    </div>
                  </div>

                  {phase === 'play' && turn === 0 && (
                    userLegalCardIndices.includes(selectedCardIdx) ? (
                      <button
                        type="button"
                        onClick={() => {
                          playCard(0, selectedCardIdx);
                          setSelectedCardIdx(null);
                        }}
                        className={`py-0.5 px-2 sm:px-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-slate-950 font-black ${isWatch ? 'text-xs py-1 px-2.5' : 'text-[10px] sm:text-xs'} rounded-lg shadow-md flex items-center gap-1 cursor-pointer active:scale-95 animate-pulse`}
                      >
                        <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-slate-950" />
                        <span>ارمِ</span>
                      </button>
                    ) : (
                      <div className="text-[9px] sm:text-[10px] text-amber-200 font-bold bg-black/60 border border-amber-500/40 px-1.5 py-0.5 rounded-lg">
                        غير قانونية
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Hand Cards Presentation */}
              <div
                ref={handRef}
                className={`w-full py-0.5 sm:py-1 px-0.5 select-none ${
                  isWatch
                    ? 'flex items-center -space-x-3 overflow-x-auto scrollbar-none justify-start min-h-[66px] px-1 touch-pan-x'
                    : 'flex items-end justify-center -space-x-3 sm:-space-x-4 md:-space-x-4 overflow-x-auto scrollbar-none min-h-[68px] sm:min-h-[76px] pb-1 pt-1'
                }`}
              >
                {hands[0].map((card, idx) => {
                  const isPlayable = phase === 'play' && turn === 0 && userLegalCardIndices.includes(idx);
                  const isSelected = selectedCardIdx === idx;
                  const isBeingDragged = draggedCardIdx === idx;
                  const isRecentlyDealt = isDealing && recentDealtIds.has(card.id);
                  const shouldShakeChallenge = cardShakeMode === 'challenge';
                  const shouldShakeTurn = cardShakeMode === 'turn' && (phase !== 'play' || isPlayable);
                  const shakeClass = isRecentlyDealt
                    ? 'animate-deal-card-in'
                    : shouldShakeChallenge
                    ? 'animate-card-challenge-shake'
                    : shouldShakeTurn
                    ? 'animate-card-turn-shake'
                    : '';
                  const shakeStyle = isRecentlyDealt
                    ? { animationDelay: `${(idx % 3) * 75}ms` }
                    : shouldShakeTurn
                    ? { animationDelay: `${Math.min(idx * 25, 200)}ms` }
                    : undefined;

                  return (
                    <div
                      key={card.id}
                      data-card-id={card.id}
                      draggable={!isWatch && !isDealing}
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDropOnCard(idx)}
                      className={`transition-all duration-200 shrink-0 snap-center opacity-100 ${
                        isWatch ? '' : 'hover:-translate-y-2.5 hover:z-30 hover:scale-105'
                      } ${
                        isSelected ? '-translate-y-3 z-40 scale-105' : 'z-10'
                      } ${isRecentlyDealt ? '-translate-y-1.5 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]' : ''} ${
                        isBeingDragged ? 'opacity-80 scale-95' : 'opacity-100'
                      } cursor-pointer`}
                    >
                      <div className={shakeClass} style={shakeStyle}>
                        <CardView
                          card={card}
                          size={isWatch ? 'xs' : 'sm'}
                          disabled={false}
                          isPlayable={isPlayable}
                          selected={isSelected}
                          onClick={() => handleHandCardClick(idx)}
                          cardBackStyle={settings.cardBackStyle}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- EVENT LOG DRAWER (DESKTOP / PHONE) ---------------- */}
        {!isWatch && (
          <div className="w-full max-w-3xl mt-1.5 mb-1">
            <button
              onClick={() => setIsLogExpanded(!isLogExpanded)}
              className="w-full py-1.5 px-3 rounded-xl bg-black/40 border border-emerald-800/40 text-xs text-emerald-300 flex items-center justify-between hover:bg-black/60 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5 font-semibold">
                <History className="w-3.5 h-3.5 text-amber-400" />
                <span>السجل ({logMessages.length})</span>
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isLogExpanded ? 'rotate-180' : ''}`} />
            </button>

            {isLogExpanded && (
              <div className="mt-1 p-3 rounded-xl bg-black/80 border border-emerald-800/40 max-h-36 overflow-y-auto text-xs text-emerald-200/80 space-y-1 font-mono">
                {logMessages.map((msg, i) => (
                  <div key={i} className="py-0.5 border-b border-emerald-900/30">
                    {msg}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ---------------- APPLE WATCH QUICK MENU DRAWER ---------------- */}
      {isWatchMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-[260px] bg-[#0c241c] border-2 border-amber-400/80 rounded-2xl p-3 shadow-2xl text-center space-y-2 max-h-[94vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-emerald-800/60 pb-1.5">
              <span className="text-xs font-black text-amber-300 font-serif">قائمة ساعة آبل</span>
              <button
                onClick={() => setIsWatchMenuOpen(false)}
                className="p-1 rounded bg-black/40 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-1.5 text-xs font-bold">
              <button
                onClick={() => {
                  cycleDifficulty();
                }}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer font-bold ${
                  settings.difficulty === 'hard'
                    ? 'bg-purple-950/80 border-purple-400 text-purple-200'
                    : settings.difficulty === 'medium'
                    ? 'bg-amber-950/80 border-amber-400 text-amber-200'
                    : 'bg-emerald-950/80 border-emerald-400 text-emerald-200'
                }`}
              >
                <Brain className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  مستوى الذكاء:{' '}
                  {settings.difficulty === 'hard'
                    ? 'محترف'
                    : settings.difficulty === 'medium'
                    ? 'متوسط'
                    : 'سهل'}
                </span>
              </button>

              <button
                onClick={() => {
                  setIsWatchMenuOpen(false);
                  setIsStatsOpen(true);
                }}
                className="py-2 px-3 rounded-xl bg-[#12382b] hover:bg-[#1a4a3a] text-amber-200 border border-emerald-700/50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>لوحة الإحصائيات</span>
              </button>

              <button
                onClick={() => {
                  setIsWatchMenuOpen(false);
                  setIsSettingsOpen(true);
                }}
                className="py-2 px-3 rounded-xl bg-[#12382b] hover:bg-[#1a4a3a] text-amber-200 border border-emerald-700/50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-amber-400" />
                <span>الإعدادات والأسماء</span>
              </button>

              <button
                onClick={() => {
                  setIsWatchMenuOpen(false);
                  setIsRulesOpen(true);
                }}
                className="py-2 px-3 rounded-xl bg-[#12382b] hover:bg-[#1a4a3a] text-amber-200 border border-emerald-700/50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>قواعد اللعب</span>
              </button>

              {phase === 'play' && !isSummaryOpen && !isMasoulModalOpen && !isDealing && !isBusy && (
                <button
                  onClick={() => {
                    setIsWatchMenuOpen(false);
                    setIsChallengeOpen(true);
                  }}
                  className="py-2 px-3 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>كشف المقاطعين (+١٥)</span>
                </button>
              )}

              <button
                onClick={toggleSound}
                className="py-2 px-3 rounded-xl bg-[#12382b] text-slate-200 border border-emerald-700/50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                <span>{soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}</span>
              </button>

              <button
                onClick={() => {
                  handleUpdateSettings({ watchMode: !settings.watchMode });
                  setIsWatchMenuOpen(false);
                }}
                className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Watch className="w-3.5 h-3.5" />
                <span>{settings.watchMode ? 'إيقاف وضع الساعة' : 'تفعيل وضع الساعة'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODALS ---------------- */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetSettings={handleResetSettings}
      />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
        playerNames={settings.playerNames}
        onResetStats={handleResetStats}
      />

      <ChallengeModal
        isOpen={isChallengeOpen && phase === 'play' && !isSummaryOpen && !isMasoulModalOpen}
        onClose={() => setIsChallengeOpen(false)}
        playHistory={playHistory}
        playerNames={settings.playerNames}
        onConfirmChallenge={handleConfirmChallenge}
      />

      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      <MasoulDecisionModal
        isOpen={isMasoulModalOpen}
        buyerName={bidder !== null ? getPlayerName(bidder) : ''}
        isBuyerUser={bidder === 0}
        currentTricks={bidder !== null ? tricks[teamOf(bidder)] : originalContract}
        originalContract={originalContract}
        isWatch={isWatch}
        onDeclareMasoul={handleDeclareMasoul}
        onConcludeNormalWin={handleConcludeNormalWin}
      />

      <RoundSummaryModal
        isOpen={isSummaryOpen}
        round={round}
        scores={scores}
        details={roundDetails}
        playerNames={settings.playerNames}
        bidder={bidder}
        contract={contract}
        trump={trump}
        onNextRound={() => startNewRound(round + 1)}
      />

      <TrickWinnerParticles winner={trickWinner} />
      <JokerParticles effect={activeJokerEffect} onComplete={() => setActiveJokerEffect(null)} />
    </div>
  );
}
