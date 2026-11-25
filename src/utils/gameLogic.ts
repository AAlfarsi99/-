import {
  Card,
  CardSuit,
  HandSuitStat,
  PlayerHandAnalysis,
  PlayerId,
  PlayHistoryItem,
  RoundEndDetails,
  Suit,
  TrickCard,
} from '../types/game';
import { Difficulty } from '../types/settings';

export const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];

export const SUIT_NAMES: Record<Suit, string> = {
  '♠': 'سبيت',
  '♥': 'هاص',
  '♦': 'ديمن',
  '♣': 'كلفس',
};

export const PLAYER_NAMES = ['أنت', 'المياسي', 'سيف', 'مروان'] as const;

export const SEAT_ROLES = [
  'أنت (الأسفل)',
  'المياسي (اليمين - يلعب بعدك)',
  'سيف (الأعلى - الشريك)',
  'مروان (اليسار)',
] as const;

export const isRed = (s: CardSuit): boolean => s === '♥' || s === '♦' || s === '🃏R';

export const teamOf = (p: PlayerId): number => p % 2;

export function formatRank(r: number, j?: 'B' | 'R'): string {
  if (j === 'B') return 'جوكر أسود';
  if (j === 'R') return 'جوكر أحمر';
  if (r === 11) return 'J';
  if (r === 12) return 'Q';
  if (r === 13) return 'K';
  if (r === 14) return 'A';
  return String(r);
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  let idCounter = 1;

  // 4 suits x 8 ranks (7 to 14)
  for (const s of SUITS) {
    for (let r = 7; r <= 14; r++) {
      deck.push({ id: `card_${idCounter++}`, s, r });
    }
  }

  // 6 of Hearts & 6 of Spades
  deck.push({ id: `card_${idCounter++}`, s: '♥', r: 6 });
  deck.push({ id: `card_${idCounter++}`, s: '♠', r: 6 });

  // Black Joker (rank 16) & Red Joker (rank 17)
  deck.push({ id: `card_${idCounter++}`, s: '🃏B', r: 16, j: 'B' });
  deck.push({ id: `card_${idCounter++}`, s: '🃏R', r: 17, j: 'R' });

  return deck;
}

export function shuffleDeck<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Deals cards 100% randomly from the shuffled 36-card deck with no bias
 * toward strong or weak hands.
 */
export function dealRandomHands(deck: Card[]): Card[][] {
  const shuffled = shuffleDeck(deck);
  const hands: Card[][] = [[], [], [], []];
  for (let i = 0; i < shuffled.length; i++) {
    hands[i % 4].push(shuffled[i]);
  }
  return hands;
}

/**
 * Sorts cards directly by suit with Trump first (if set) and rank descending.
 */
export function sortHand(hand: Card[], trump?: Suit | null): Card[] {
  return sortHandBySuit(hand, trump);
}

/**
 * Sorts cards in alternating color order: Red, Black, Red, Black...
 * Within each color group, cards are organized by suit and rank descending.
 */
export function sortHandAlternating(hand: Card[]): Card[] {
  const reds = hand.filter((c) => isRed(c.s));
  const blacks = hand.filter((c) => !isRed(c.s));

  const redSuitOrder: Record<string, number> = { '♥': 0, '♦': 1, '🃏R': 2 };
  const blackSuitOrder: Record<string, number> = { '♠': 0, '♣': 1, '🃏B': 2 };

  reds.sort((a, b) => {
    const sDiff = (redSuitOrder[a.s] ?? 9) - (redSuitOrder[b.s] ?? 9);
    if (sDiff !== 0) return sDiff;
    return b.r - a.r;
  });

  blacks.sort((a, b) => {
    const sDiff = (blackSuitOrder[a.s] ?? 9) - (blackSuitOrder[b.s] ?? 9);
    if (sDiff !== 0) return sDiff;
    return b.r - a.r;
  });

  const interleaved: Card[] = [];
  const maxLen = Math.max(reds.length, blacks.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < reds.length) interleaved.push(reds[i]);
    if (i < blacks.length) interleaved.push(blacks[i]);
  }

  return interleaved;
}

/**
 * Groups cards directly by Suit with Trump placed first (if selected),
 * and within each suit sorts by rank descending.
 */
export function sortHandBySuit(hand: Card[], trump?: Suit | null): Card[] {
  const getSuitKey = (c: Card): string => {
    if (c.j === 'R') return '🃏R';
    if (c.j === 'B') return '🃏B';
    return c.s;
  };

  const baseSuits = ['♠', '♥', '♦', '♣'];
  const suitsOrder: string[] = trump 
    ? [trump, ...baseSuits.filter((s) => s !== trump), '🃏R', '🃏B']
    : ['♠', '♥', '♦', '♣', '🃏R', '🃏B'];

  return [...hand].sort((a, b) => {
    const keyA = getSuitKey(a);
    const keyB = getSuitKey(b);
    const suitAIdx = suitsOrder.indexOf(keyA);
    const suitBIdx = suitsOrder.indexOf(keyB);
    const sDiff = (suitAIdx === -1 ? 99 : suitAIdx) - (suitBIdx === -1 ? 99 : suitBIdx);
    if (sDiff !== 0) {
      return sDiff;
    }
    return b.r - a.r;
  });
}

/**
 * Sorts cards by rank/strength: Jokers highest, then Aces, Kings, ..., 7, 6.
 */
export function sortHandByRank(hand: Card[], descending: boolean = true): Card[] {
  return [...hand].sort((a, b) => {
    return descending ? b.r - a.r : a.r - b.r;
  });
}

/**
 * Move card from one index to another in a player's hand.
 */
export function moveCardInHand(hand: Card[], fromIndex: number, toIndex: number): Card[] {
  if (fromIndex < 0 || fromIndex >= hand.length || toIndex < 0 || toIndex >= hand.length) {
    return hand;
  }
  const result = [...hand];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

/**
 * Swaps two cards in a player's hand.
 */
export function swapCardsInHand(hand: Card[], indexA: number, indexB: number): Card[] {
  if (
    indexA < 0 || indexA >= hand.length ||
    indexB < 0 || indexB >= hand.length ||
    indexA === indexB
  ) {
    return hand;
  }
  const result = [...hand];
  const temp = result[indexA];
  result[indexA] = result[indexB];
  result[indexB] = temp;
  return result;
}


/**
 * AI strength estimation for auction & trump selection.
 * Conservatively evaluates trick potential based on jokers, trump depth, and high cards.
 */
export function estimate(hand: Card[]): { expected: number; bestSuit: Suit; recommended: number } {
  const counts = SUITS.map((s) => hand.filter((c) => c.s === s).length);
  const jokerB = hand.some((c) => c.j === 'B');
  const jokerR = hand.some((c) => c.j === 'R');

  const suitScores = SUITS.map((s, k) => {
    const cards = hand.filter((c) => c.s === s);
    const high = cards.filter((c) => c.r >= 12).length;
    const ace = cards.some((c) => c.r === 14) ? 1 : 0;
    const king = cards.some((c) => c.r === 13) ? 1 : 0;
    return counts[k] * 0.28 + high * 0.32 + ace * 0.7 + king * 0.22;
  });

  const bestSuitIndex = suitScores.indexOf(Math.max(...suitScores));
  const honors = hand.filter((c) => !c.j && c.r >= 13).length;
  const topAces = hand.filter((c) => c.r === 14).length;
  const longest = Math.max(...counts);

  let expected =
    1.35 +
    topAces * 0.62 +
    honors * 0.16 +
    Math.max(0, longest - 3) * 0.48 +
    (jokerB ? 1.05 : 0) +
    (jokerR ? 1.35 : 0) +
    (jokerB && jokerR ? 0.35 : 0);

  expected += Math.max(0, suitScores[bestSuitIndex] - 1.8) * 0.25;

  const recommended = Math.max(5, Math.min(9, Math.floor(expected + 0.35)));

  return {
    expected,
    bestSuit: SUITS[bestSuitIndex],
    recommended,
  };
}

/**
 * Returns array of legal card indexes that can be played by player p.
 * For Player 0, off-suit cards remain playable (allowing intentional cheat).
 */
export function getValidCardIndices(
  p: PlayerId,
  hand: Card[],
  trick: TrickCard[],
  trump: Suit | null,
  blackPlayed: boolean,
  blackLead: boolean,
  redFirstOwner: PlayerId | null,
  contract?: number,
  completedTricks?: number
): number[] {
  const all = hand.map((_, i) => i);
  const both = hand.some((c) => c.j === 'B') && hand.some((c) => c.j === 'R');

  // Basic restrictions on Jokers
  let allowed = all.filter((i) => {
    const c = hand[i];
    // Red joker cannot be played before black unless player holds both
    if (c.j === 'R' && !blackPlayed && !both) return false;
    // Red joker cannot lead an empty trick
    if (!trick.length && c.j === 'R') return false;
    // Black joker cannot lead an empty trick unless player played Red first under both-jokers exception
    if (!trick.length && c.j === 'B' && redFirstOwner !== p) return false;
    return true;
  });

  // Rule: "عند الشراء 8 (انزل لي) يلزم على اول لاعب رمي الحكم واذا لم يكن لديه رمي اي بطاقاة ويرمي الاخرون حكما"
  // Playing a legally allowed Joker is always permitted.
  const isAnzelLi = contract === 8 && completedTricks === 0 && trump !== null;
  if (isAnzelLi) {
    const trumpIndices = allowed.filter((i) => !hand[i].j && hand[i].s === trump);
    if (trumpIndices.length > 0) {
      return trumpIndices.concat(allowed.filter((i) => Boolean(hand[i].j)));
    }
    // If player has no trump cards, they can play any legally allowed card
    return allowed;
  }

  if (trick.length) {
    const first = trick[0].c;
    if (first.j === 'B' && blackLead) {
      const suited = allowed.filter((i) => hand[i].s === trump);
      if (suited.length) {
        allowed = suited.concat(allowed.filter((i) => hand[i].j));
      }
    } else if (!first.j) {
      const matching = allowed.filter((i) => hand[i].s === first.s);
      // For bots (p !== 0), follow suit + jokers + trump option for occasional tactical cuts.
      // For human (p === 0), allow playing off-suit to simulate intentional cheating/cutting!
      if (matching.length && p !== 0) {
        allowed = matching.concat(allowed.filter((i) => hand[i].j || (trump && hand[i].s === trump)));
      }
    }
  }

  return allowed;
}

/**
 * Evaluates the winner of a completed trick.
 */
export function evaluateTrickWinner(trick: TrickCard[], trump: Suit | null): PlayerId {
  const leadSuit = trick[0].c.s;

  const getCardValue = (c: Card): number => {
    let base = 0;
    if (c.j === 'R') base = 300;
    else if (c.j === 'B') base = 200;
    else if (trump && c.s === trump) base = 100;
    else if (c.s === leadSuit) base = 50;
    return base + c.r;
  };

  let best = trick[0];
  let bestVal = getCardValue(trick[0].c);

  for (let i = 1; i < trick.length; i++) {
    const val = getCardValue(trick[i].c);
    if (val > bestVal) {
      bestVal = val;
      best = trick[i];
    }
  }

  return best.p;
}

/**
 * Intelligent AI Bidding logic factoring in selected difficulty, hand potential,
 * partner coordination, and table vulnerability.
 */
export function getAiBid(
  p: PlayerId,
  hand: Card[],
  currentBid: number,
  bidder: PlayerId | null,
  dealer: PlayerId,
  difficulty: Difficulty
): { action: 'bid' | 'pass'; amount?: number } {
  // STRICT FOG OF WAR: Bot only sees its own hand (hand: Card[]).
  // It has ZERO access to partner's cards or opponents' cards.
  const est = estimate(hand);
  const isDealer = dealer === p;
  const noBidsYet = bidder === null;
  const partnerId = ((p + 2) % 4) as PlayerId;
  const isPartnerLeadingBid = bidder === partnerId;

  // Bot Bidding - Balanced, realistic, without excessive enthusiasm (أقل من المتوسط):
  let personalityBonus = 0;

  // Very subtle estimation slips (rare, below average):
  let humanError = 0;
  if (difficulty === 'easy') {
    if (Math.random() < 0.05) humanError = Math.random() < 0.5 ? 1 : -1;
  } else if (difficulty === 'medium') {
    if (Math.random() < 0.02) humanError = Math.random() < 0.5 ? 1 : -1;
  }

  // --- EASY DIFFICULTY ---
  if (difficulty === 'easy') {
    if (isDealer && noBidsYet) {
      return { action: 'bid', amount: 5 };
    }
    const adjustedRec = est.recommended + humanError;
    if (adjustedRec >= 7 && currentBid < 6) {
      return { action: 'bid', amount: 6 };
    }
    return { action: 'pass' };
  }

  // --- MEDIUM DIFFICULTY ---
  if (difficulty === 'medium') {
    const adjustedRec = Math.max(4, Math.min(9, est.recommended + humanError));
    if (isDealer && noBidsYet && adjustedRec >= 5) {
      return { action: 'bid', amount: 5 };
    }
    const minBid = Math.max(6, currentBid + 1);
    if (adjustedRec >= minBid) {
      return { action: 'bid', amount: Math.min(9, Math.max(minBid, adjustedRec)) };
    }
    return { action: 'pass' };
  }

  // --- HARD / EXPERT DIFFICULTY ---
  const redJoker = hand.some((c) => c.j === 'R');
  const blackJoker = hand.some((c) => c.j === 'B');
  const outsideAces = hand.filter((c) => c.r === 14 && c.s !== est.bestSuit).length;
  const bestSuitCount = hand.filter((c) => c.s === est.bestSuit).length;
  const bestSuitHigh = hand.filter((c) => c.s === est.bestSuit && c.r >= 13).length;

  let powerRating = 0;
  if (redJoker) powerRating += 1.3;
  if (blackJoker) powerRating += 1.0;
  if (redJoker && blackJoker) powerRating += 0.4;
  powerRating += outsideAces * 0.8;
  powerRating += Math.max(0, bestSuitCount - 2) * 0.6;
  powerRating += bestSuitHigh * 0.35;
  powerRating += personalityBonus;

  // Realistic human potential rounding + human error
  const expertPotential = Math.max(5, Math.min(9, Math.round(powerRating + 2.1 + humanError)));

  // Forced dealer condition: exclusive privilege to bid 5 if all 3 passed
  if (isDealer && noBidsYet) {
    if (expertPotential >= 7) {
      return { action: 'bid', amount: 6 };
    }
    return { action: 'bid', amount: 5 };
  }

  // If partner already holds the bid, do NOT recklessly overbid partner!
  if (isPartnerLeadingBid) {
    if (expertPotential >= 8 && currentBid < 8) {
      const minBid = Math.max(6, currentBid + 1);
      return { action: 'bid', amount: Math.min(9, minBid) };
    }
    return { action: 'pass' };
  }

  // Opponent holds bid or opening bid
  const minValidBid = Math.max(6, currentBid + 1);
  if (expertPotential >= minValidBid) {
    const targetBid = Math.min(9, Math.max(minValidBid, expertPotential));
    return { action: 'bid', amount: targetBid };
  }

  return { action: 'pass' };
}

/**
 * AI Trump suit selector based on card distribution and difficulty.
 */
export function getAiTrumpChoice(p: PlayerId, hand: Card[], difficulty: Difficulty): Suit {
  const counts: Record<Suit, number> = { '♠': 0, '♥': 0, '♦': 0, '♣': 0 };
  const suitStrength: Record<Suit, number> = { '♠': 0, '♥': 0, '♦': 0, '♣': 0 };

  hand.forEach((c) => {
    if (!c.j) {
      const s = c.s as Suit;
      if (s in counts) {
        counts[s]++;
        suitStrength[s] += c.r >= 13 ? 2.5 : c.r >= 11 ? 1.5 : 1;
      }
    }
  });

  if (difficulty === 'easy') {
    // Simply the suit with max count
    return (Object.keys(counts) as Suit[]).reduce((a, b) => (counts[a] >= counts[b] ? a : b));
  }

  // Medium and Hard evaluate honors + count
  const est = estimate(hand);
  return est.bestSuit;
}

/**
 * Advanced AI card selection logic factoring in trick state, partner coordination,
 * trick winning conditions, and strategic Joker timing.
 */
export function getAiPlayCard(
  p: PlayerId,
  hand: Card[],
  trick: TrickCard[],
  trump: Suit | null,
  difficulty: Difficulty,
  blackPlayed: boolean,
  blackLead: boolean,
  redFirstOwner: PlayerId | null,
  completedTricks: number,
  _playHistory?: PlayHistoryItem[],
  buyingTeam?: number,
  contract?: number,
  currentTricks?: [number, number]
): number {
  let choices = getValidCardIndices(
    p,
    hand,
    trick,
    trump,
    blackPlayed,
    blackLead,
    redFirstOwner,
    contract,
    completedTricks
  );

  if (choices.length === 0) return 0;
  if (choices.length === 1) return choices[0];

  const isAnzelLi = contract === 8 && completedTricks === 0 && trump !== null;

  // If following an existing trick and holding cards matching what was thrown on the table:
  // Bots follow suit normally, but humans sometimes make mistakes:
  // 1) An accidental cut due to loss of focus / misreading the suit (especially on Easy/Medium).
  // 2) A deliberate tactical bluff cut when opponent is winning.
  if (!isAnzelLi && trick.length > 0 && !trick[0].c.j) {
    const firstSuit = trick[0].c.s;
    const matchingChoices = choices.filter((i) => !hand[i].j && hand[i].s === firstSuit);
    if (matchingChoices.length > 0) {
      const currentWinner = evaluateTrickWinner(trick, trump);
      const isOpponentWinning = teamOf(currentWinner) !== teamOf(p);
      const winningMatching = matchingChoices.filter((k) => {
        const simulated = [...trick, { p, c: hand[k], cheated: false }];
        return evaluateTrickWinner(simulated, trump) === p;
      });

      // Human mistake: accidental cut (very rare, below average)
      const accidentalSlipRate = difficulty === 'hard' ? 0 : difficulty === 'medium' ? 0.01 : 0.02;
      const makesAccidentalSlip = Math.random() < accidentalSlipRate;

      // Tactical cut attempt (toned down, below average)
      const cutRate = difficulty === 'hard' ? 0.03 : difficulty === 'medium' ? 0.015 : 0;
      const shouldAttemptCut =
        cutRate > 0 &&
        isOpponentWinning &&
        winningMatching.length === 0 &&
        Math.random() < cutRate;

      if (!makesAccidentalSlip && !shouldAttemptCut) {
        // Allow Black Joker during tricks 1, 2, and 3 so bot can discharge it safely or capture key opponent tricks
        choices = matchingChoices.concat(
          choices.filter((i) => hand[i].j === 'B')
        );
      }
    }
  }

  // Helper: Card strength comparator
  const cardRankAsc = (a: number, b: number) => hand[a].r - hand[b].r;
  const cardRankDesc = (a: number, b: number) => hand[b].r - hand[a].r;

  const hasBlackJoker = hand.some((c) => c.j === 'B');
  const mustDischargeBlack = hasBlackJoker && redFirstOwner !== p && completedTricks < 3;

  // --- BLACK JOKER PROTOCOL (MINIMIZE ERRORS & PREVENT -15 PENALTY) ---
  const blackJokerIndex = choices.find((i) => hand[i].j === 'B');

  // 0. Leading an empty trick (trick.length === 0) while holding unplayed Black Joker:
  // If bot wins Trick 2, bot MUST lead Trick 3 — where leading Black Joker is ILLEGAL (-15 penalty)!
  // Therefore on Trick 2 lead (and Trick 1 lead when safe), intentionally lead the weakest losing card!
  if (trick.length === 0 && mustDischargeBlack) {
    const nonJokerChoices = choices.filter((i) => !hand[i].j);
    if (nonJokerChoices.length > 0) {
      const nonTrumpWeak = nonJokerChoices.filter((i) => hand[i].s !== trump);
      if (completedTricks === 1) {
        // Trick 2 lead: MUST try to lose the lead so another player leads Trick 3!
        if (nonTrumpWeak.length > 0) {
          return [...nonTrumpWeak].sort(cardRankAsc)[0];
        }
        return [...nonJokerChoices].sort(cardRankAsc)[0];
      }
      if (completedTricks === 0) {
        // Trick 1 lead: Avoid leading high Aces/Kings if we have weaker non-trump cards
        const lowMid = nonTrumpWeak.filter((i) => hand[i].r <= 11);
        if (lowMid.length > 0) {
          return [...lowMid].sort(cardRankAsc)[0];
        }
      }
    }
  }

  if (blackJokerIndex !== undefined && trick.length > 0) {
    const currentWinner = evaluateTrickWinner(trick, trump);
    const isPartnerWinning = teamOf(currentWinner) === teamOf(p);
    const nonBlackChoices = choices.filter((i) => hand[i].j !== 'B');

    // Check which non-Black cards keep partner as the winner (don't overtake partner and win trick)
    const losingToPartnerChoices = isPartnerWinning
      ? nonBlackChoices.filter((idx) => {
          const sim = [...trick, { p, c: hand[idx], cheated: false }];
          const simWinner = evaluateTrickWinner(sim, trump);
          return teamOf(simWinner) === teamOf(p) && simWinner !== p;
        })
      : [];

    // 1. Trick 3 (completedTricks === 2): MANDATORY EMERGENCY PLAY
    // Must play Black Joker immediately to prevent the automatic -15 penalty!
    if (completedTricks === 2) {
      return blackJokerIndex;
    }

    // 2. Trick 2 (completedTricks === 1): PROACTIVE & ZERO-TRAP PLAY
    // Never risk overtaking partner or getting stuck leading Trick 3 with Black Joker in hand!
    if (completedTricks === 1) {
      if (!isPartnerWinning) {
        return blackJokerIndex;
      }
      // If NO non-Black card can lose to partner (any legal card would overtake partner and win Trick 2!),
      // play Black Joker right now instead of stealing Trick 3 lead and dying (-15)!
      if (losingToPartnerChoices.length === 0) {
        return blackJokerIndex;
      }
      // If opponents still play after us (trick.length < 3) and partner isn't winning with Ace of trump / very strong card,
      // play Black Joker proactively on Medium/Hard if bot has no lead suit or holds dangerous high cards
      const leadSuit = trick[0].c.s;
      const hasLeadSuit = hand.some((c) => !c.j && c.s === leadSuit);
      if (!hasLeadSuit && difficulty !== 'easy') {
        return blackJokerIndex;
      }
      // Otherwise, keep ONLY cards that safely lose to partner so bot cannot accidentally win Trick 2!
      if (losingToPartnerChoices.length > 0) {
        choices = losingToPartnerChoices;
      }
    }

    // 3. Trick 1 (completedTricks === 0): OPPORTUNISTIC VALUE PLAY
    if (completedTricks === 0) {
      if (!isPartnerWinning) {
        const winningCard = trick.find((tc) => tc.p === currentWinner)?.c;
        const isHighHonor =
          winningCard &&
          (winningCard.r === 14 || // Ace
            (winningCard.s === trump && winningCard.r >= 12) || // High trump
            (trick.length === 3 && winningCard.r >= 11)); // Worthwhile honor when acting last
        if (isHighHonor) {
          return blackJokerIndex;
        }
      }

      // If partner is winning on trick 1 and we have cards that lose cleanly, don't waste Black Joker
      if (isPartnerWinning && losingToPartnerChoices.length > 0) {
        choices = nonBlackChoices;
      } else if (isPartnerWinning && nonBlackChoices.length > 0) {
        // Check if forced to waste an Ace to overtake partner — better to save the Ace or discharge Black Joker
        const hasOnlyAceToPlay = nonBlackChoices.every((i) => hand[i].r === 14);
        if (!hasOnlyAceToPlay) {
          choices = nonBlackChoices;
        }
      }
    }
  }

  // --- AVOID TRAPPED JOKER AS LAST CARD (-15 PENALTY ON TRICK 9) ---
  // On Trick 8 (2 cards left in hand) while following a trick (trick.length > 0):
  // If bot has a Joker in choices and playing the other card could win Trick 8 (forcing Joker lead on Trick 9),
  // play the Joker NOW!
  if (hand.length === 2 && trick.length > 0) {
    const jokerChoice = choices.find((i) => hand[i].j === 'B' || hand[i].j === 'R');
    const nonJokerChoice = choices.find((i) => !hand[i].j);
    if (jokerChoice !== undefined && nonJokerChoice !== undefined) {
      const sim = [...trick, { p, c: hand[nonJokerChoice], cheated: false }];
      const wouldOtherWinNow = evaluateTrickWinner(sim, trump) === p;
      const isOtherHighRisk =
        hand[nonJokerChoice].s === trump || hand[nonJokerChoice].r >= 12;
      if (wouldOtherWinNow || (trick.length < 3 && isOtherHighRisk)) {
        return jokerChoice;
      }
    }
  }

  // --- RED JOKER CONTRACT EMERGENCY PROTOCOL ---
  // In Omani rule: if buying team reaches contract while holding Red Joker (or opponent holding it),
  // holder's team loses 15 points! If buying team is 1 trick away, bot MUST play Red Joker if legal!
  const redJokerIndex = choices.find((i) => hand[i].j === 'R');
  if (
    redJokerIndex !== undefined &&
    buyingTeam !== undefined &&
    contract !== undefined &&
    currentTricks !== undefined &&
    currentTricks[buyingTeam] >= Math.max(1, contract - 1)
  ) {
    return redJokerIndex;
  }

  // --- EASY DIFFICULTY ---
  if (difficulty === 'easy') {
    // Basic play: leads highest or follows with lowest legal card calmly
    if (trick.length === 0) {
      return choices[Math.floor(Math.random() * choices.length)];
    }
    return [...choices].sort(cardRankAsc)[0];
  }

  // --- MEDIUM DIFFICULTY ---
  if (difficulty === 'medium') {
    if (trick.length === 0) {
      return [...choices].sort(cardRankDesc)[0];
    }

    const currentWinner = evaluateTrickWinner(trick, trump);
    const isPartnerWinning = teamOf(currentWinner) === teamOf(p);

    const winningChoices = choices.filter((k) => {
      const simulated = [...trick, { p, c: hand[k], cheated: false }];
      return evaluateTrickWinner(simulated, trump) === p;
    });

    if (isPartnerWinning || !winningChoices.length) {
      // Very rare subtle slip (below average)
      if (!isPartnerWinning && choices.length > 1 && Math.random() < 0.02) {
        return [...choices].sort(cardRankAsc)[1];
      }
      return [...choices].sort(cardRankAsc)[0];
    }
    return [...winningChoices].sort(cardRankAsc)[0];
  }

  // --- HARD / EXPERT DIFFICULTY ---
  // 1. LEADING A NEW TRICK (trick is empty)
  // STRICT FOG OF WAR: Bot does NOT know partner's hand, deduces play based on known tricks & own hand
  if (trick.length === 0) {
    // If holding Black Joker on trick 2 or 3 and legally permitted:
    if (blackJokerIndex !== undefined && completedTricks >= 1 && redFirstOwner === p) {
      return blackJokerIndex;
    }

    // Check for high outside Aces (sure tricks)
    const outsideAces = choices.filter((i) => hand[i].r === 14 && hand[i].s !== trump && !hand[i].j);
    if (outsideAces.length > 0) {
      return outsideAces[0];
    }

    // Lead highest trump if bot holds high trump honors
    const trumpHighs = choices.filter((i) => hand[i].s === trump && hand[i].r >= 13);
    if (trumpHighs.length > 0) {
      return trumpHighs.sort(cardRankDesc)[0];
    }

    // Lead highest card in longest suit to establish control
    return [...choices].sort(cardRankDesc)[0];
  }

  // 2. FOLLOWING AN EXISTING TRICK
  const currentWinner = evaluateTrickWinner(trick, trump);
  const isPartnerWinning = teamOf(currentWinner) === teamOf(p);

  const winningChoices = choices.filter((k) => {
    const simulated = [...trick, { p, c: hand[k], cheated: false }];
    return evaluateTrickWinner(simulated, trump) === p;
  });

  // A. PARTNER IS CURRENTLY WINNING THE TRICK:
  if (isPartnerWinning) {
    // Partner is winning: never overtake partner! Throw lowest, least valuable card.
    const nonTrumpLowChoices = choices.filter((i) => hand[i].s !== trump && !hand[i].j);
    if (nonTrumpLowChoices.length > 0) {
      return [...nonTrumpLowChoices].sort(cardRankAsc)[0];
    }
    const nonRedChoices = choices.filter((i) => hand[i].j !== 'R');
    if (nonRedChoices.length > 0) {
      return [...nonRedChoices].sort(cardRankAsc)[0];
    }
    return [...choices].sort(cardRankAsc)[0];
  }

  // B. OPPONENT IS CURRENTLY WINNING THE TRICK:
  if (winningChoices.length > 0) {
    // Economy of Force: Beat opponent with the LOWEST possible winning card!
    const nonRedWinning = winningChoices.filter((i) => hand[i].j !== 'R');
    if (nonRedWinning.length > 0) {
      return [...nonRedWinning].sort(cardRankAsc)[0];
    }
    // Red Joker is the only winning choice; use it to shut down high opponent trick
    return winningChoices[0];
  }

  // C. CANNOT WIN THE TRICK:
  // Discard the lowest worthless non-trump card
  const nonTrumpChoices = choices.filter((i) => hand[i].s !== trump && !hand[i].j);
  if (nonTrumpChoices.length > 0) {
    return [...nonTrumpChoices].sort(cardRankAsc)[0];
  }

  return [...choices].sort(cardRankAsc)[0];
}

export interface BotChallengeDecision {
  accuser: PlayerId;
  accused: PlayerId;
  claimedSuit: Suit;
  trickNumber: number;
  reason: 'proven_suit_reveal' | 'mistaken_suspicion';
}

/**
 * Evaluates whether an opponent bot (Team 1) challenges at trick completion.
 * Detection is intentionally difficult for bots:
 * 1. Memory decay: bots frequently forget older cuts as more tricks pass.
 * 2. Misremembering: bots can mix up the trick number or suit when accusing.
 * 3. False suspicion: bots can occasionally mistake a legal off-suit discard for a cut (costing them -15).
 */
export function evaluateRevealedCutChallenge(
  history: PlayHistoryItem[],
  currentTrickHistory: PlayHistoryItem[],
  difficulty: Difficulty
): BotChallengeDecision | null {
  const currentTrickNum = currentTrickHistory[0]?.trick ?? 1;

  // 1. Check for revealed cuts by Team 0 (0 & 2) with memory decay + risk of misremembering
  for (const item of currentTrickHistory) {
    if (teamOf(item.p) !== 0 || item.c.j) continue;

    const playedSuit = item.c.s as Suit;

    const priorCut = history.find(
      (h) =>
        h.p === item.p &&
        h.cheated &&
        !h.c.j &&
        h.required === playedSuit &&
        h.trick < currentTrickNum
    );

    if (priorCut && priorCut.required) {
      const tricksAgo = Math.max(1, currentTrickNum - priorCut.trick);

      // Harder detection with memory decay over elapsed tricks (bots can forget!)
      const detectionRate =
        difficulty === 'hard'
          ? Math.max(0.18, 0.58 - (tricksAgo - 1) * 0.08)
          : difficulty === 'medium'
          ? Math.max(0.08, 0.34 - (tricksAgo - 1) * 0.06)
          : Math.max(0.03, 0.14 - (tricksAgo - 1) * 0.03);

      if (Math.random() <= detectionRate) {
        const accuser: PlayerId = Math.random() < 0.5 ? 1 : 3;

        // Even when a bot recalls a cut, it may misremember the trick or suit
        const mistakeRate =
          difficulty === 'hard' ? 0.08 : difficulty === 'medium' ? 0.18 : 0.30;

        if (Math.random() < mistakeRate) {
          const otherPlaysByPlayer = history.filter(
            (h) => h.p === item.p && !h.cheated && !h.c.j && Boolean(h.required) && h.trick !== priorCut.trick
          );
          if (otherPlaysByPlayer.length > 0 && Math.random() < 0.5) {
            const wrongPlay =
              otherPlaysByPlayer[Math.floor(Math.random() * otherPlaysByPlayer.length)];
            return {
              accuser,
              accused: item.p,
              claimedSuit: wrongPlay.required as Suit,
              trickNumber: wrongPlay.trick,
              reason: 'mistaken_suspicion',
            };
          }

          const wrongSuits = SUITS.filter((s) => s !== priorCut.required);
          const wrongSuit = wrongSuits[Math.floor(Math.random() * wrongSuits.length)];
          return {
            accuser,
            accused: item.p,
            claimedSuit: wrongSuit,
            trickNumber: priorCut.trick,
            reason: 'mistaken_suspicion',
          };
        }

        return {
          accuser,
          accused: item.p,
          claimedSuit: priorCut.required as Suit,
          trickNumber: priorCut.trick,
          reason: 'proven_suit_reveal',
        };
      }
    }
  }

  // 2. False suspicion mistake: bot confuses a legal off-suit discard with an illegal cut
  if (currentTrickNum >= 2) {
    const legalOffSuits = history.filter(
      (h) =>
        teamOf(h.p) === 0 &&
        !h.cheated &&
        !h.c.j &&
        Boolean(h.required) &&
        h.c.s !== h.required &&
        h.trick <= currentTrickNum
    );

    if (legalOffSuits.length > 0) {
      const falseAccuseChance =
        difficulty === 'hard' ? 0.015 : difficulty === 'medium' ? 0.045 : 0.08;

      if (Math.random() < falseAccuseChance) {
        const suspect = legalOffSuits[Math.floor(Math.random() * legalOffSuits.length)];
        const accuser: PlayerId = Math.random() < 0.5 ? 1 : 3;
        return {
          accuser,
          accused: suspect.p,
          claimedSuit: suspect.required as Suit,
          trickNumber: suspect.trick,
          reason: 'mistaken_suspicion',
        };
      }
    }
  }

  return null;
}

/**
 * AI decision helper when the buying team reaches their contract (any contract number: 5, 6, 7, 8)
 * with tricks still remaining, to determine if the bot should declare "مسؤول"
 * and go for Bound (باوند - 9 tricks for 18 points).
 */
export function shouldAiDeclareMasoul(
  p: PlayerId,
  hand: Card[],
  trump: Suit | null,
  difficulty: Difficulty
): boolean {
  const hasRedJoker = hand.some((c) => c.j === 'R');
  const hasHighTrump = hand.some((c) => !c.j && c.s === trump && c.r >= 13);
  const hasOutsideAce = hand.some((c) => !c.j && c.r === 14 && c.s !== trump);

  if (difficulty === 'easy') {
    return Math.random() < 0.15;
  }

  if (difficulty === 'medium') {
    if (hasRedJoker) return true;
    if (hasHighTrump && hasOutsideAce) return Math.random() < 0.6;
    return Math.random() < 0.25;
  }

  // Hard
  if (hasRedJoker) return true; // Invincible card! Always dare for 18 pts Bound
  if (hasHighTrump) return Math.random() < 0.75;
  if (hasOutsideAce) return Math.random() < 0.5;
  return Math.random() < 0.35;
}

/**
 * Analyzes Player 0's initial 9-card hand distribution and round context
 * to produce visual distribution metrics and an actionable tactical tip.
 */
export function analyzePlayerHand(
  initialHand: Card[],
  trump: Suit | null,
  bidder: PlayerId | null,
  contract: number,
  outcome?: {
    reason?: RoundEndDetails['reason'];
    winningTeam?: number;
    userTricksWon?: number;
  }
): PlayerHandAnalysis {
  const est = estimate(initialHand);

  const suitDistribution: HandSuitStat[] = SUITS.map((s) => {
    const suitCards = initialHand.filter((c) => !c.j && c.s === s);
    return {
      suit: s,
      label: `${SUIT_NAMES[s]} ${s}`,
      shortLabel: s,
      count: suitCards.length,
      highCards: suitCards.filter((c) => c.r >= 12).length,
      isTrump: trump === s,
    };
  });

  const jokerCards = initialHand.filter((c) => Boolean(c.j));
  suitDistribution.push({
    suit: 'JOKER',
    label: 'جوكر 🃏',
    shortLabel: '🃏',
    count: jokerCards.length,
    highCards: jokerCards.length,
    isTrump: false,
  });

  const jokers = jokerCards.length;
  const highHonors = initialHand.filter((c) => !c.j && c.r >= 13).length;
  const midCards = initialHand.filter((c) => !c.j && c.r >= 10 && c.r <= 12).length;
  const lowCards = initialHand.filter((c) => !c.j && c.r < 10).length;

  const regularSuits = suitDistribution.filter((s) => s.suit !== 'JOKER');
  const sortedByCount = [...regularSuits].sort((a, b) => b.count - a.count || b.highCards - a.highCards);
  const longestSuit =
    sortedByCount.length > 0 && sortedByCount[0].count > 0
      ? { suit: sortedByCount[0].suit as Suit, count: sortedByCount[0].count }
      : null;

  const voidSuitsCount = regularSuits.filter((s) => s.count === 0).length;
  const trumpCount = trump ? regularSuits.find((s) => s.suit === trump)?.count ?? 0 : 0;
  const estimatedTricks = Number(est.expected.toFixed(1));

  const userWonRound = outcome?.winningTeam === 0;
  const reason = outcome?.reason;
  const hasBlackJoker = initialHand.some((c) => c.j === 'B');
  const hasRedJoker = initialHand.some((c) => c.j === 'R');

  let tacticalTip: PlayerHandAnalysis['tacticalTip'];

  if (reason === 'black_joker_violation' && !userWonRound) {
    tacticalTip = {
      category: 'joker',
      title: 'أفرغ الجوكر الأسود مبكرًا',
      message: 'الأسود إلزامي في أول ٣ لمّات؛ تخلّص منه قبل اللمّة الثالثة.',
    };
  } else if (reason === 'trapped_joker_lead_violation' && !userWonRound) {
    tacticalTip = {
      category: 'joker',
      title: 'تخلّص من الجوكر قبل النهاية',
      message: 'بقاء الجوكر آخر ورقة عند البدء يكلّف ١٥ نقطة؛ ارمِه في اللمّة ٧ أو ٨.',
    };
  } else if (reason === 'red_joker_contract_violation' && !userWonRound) {
    tacticalTip = {
      category: 'joker',
      title: 'ألعب الأحمر قبل حسم الشراء',
      message: 'حبس الجوكر الأحمر مع فريق الشراء عند إتمام العقد يكلّف ١٥ نقطة.',
    };
  } else if ((reason === 'challenge_failed' && !userWonRound) || (reason === 'challenge_success' && !userWonRound)) {
    tacticalTip = {
      category: 'defense',
      title: 'دقة الكشف والمقاطعة',
      message: 'تأكد من النوع المرمي والورق المقطوع قبل إعلان الكشف (+١٥ / -١٥).',
    };
  } else if (bidder === 0 && !userWonRound) {
    if (trumpCount <= 2 && voidSuitsCount === 0) {
      tacticalTip = {
        category: 'bidding',
        title: 'عمق الحكم في الشراء',
        message: `دخلت بـ ${contract} مع ${trumpCount} حكم فقط ودون فراغ؛ يفضّل ٣+ حكم أو فراغ للقطع.`,
      };
    } else if (highHonors <= 1 && jokers === 0) {
      tacticalTip = {
        category: 'bidding',
        title: 'ضعف الأوراق العالية',
        message: 'يد بدون جوكر وبأسياد قليلة لا تتحمل شراءً عاليًا.',
      };
    } else {
      tacticalTip = {
        category: 'trump',
        title: 'اسحب الحكم مبكرًا',
        message: 'سحب أوراق الحكم أولاً يحمي أسيادك الجانبية من القطع.',
      };
    }
  } else if (bidder !== 0 && !userWonRound && est.recommended >= 6 && (jokers > 0 || highHonors >= 3)) {
    tacticalTip = {
      category: 'bidding',
      title: `فرصة شراء (${est.recommended})`,
      message: `تقدير اليد ${estimatedTricks} لمّات مع قوة في ${SUIT_NAMES[est.bestSuit]} ${est.bestSuit}.`,
    };
  } else if (voidSuitsCount > 0 && trumpCount >= 2) {
    tacticalTip = {
      category: 'trump',
      title: 'استثمار الفراغ للقطع',
      message: `لديك ${voidSuitsCount} فراغ مع ${trumpCount} حكم لاصطياد الأسياد.`,
    };
  } else if (hasRedJoker && hasBlackJoker) {
    tacticalTip = {
      category: 'joker',
      title: 'السيطرة بالجوكرين',
      message: 'معك الجوكران: يسقط قيد اللمّات الـ ٣ ويمكنك حسم اللمّات الحاسمة.',
    };
  } else if (longestSuit && longestSuit.count >= 4 && trumpCount >= 3 && userWonRound) {
    tacticalTip = {
      category: 'trump',
      title: 'سيطرة الطول والحكم',
      message: `${longestSuit.count} أوراق في ${SUIT_NAMES[longestSuit.suit]} ${longestSuit.suit} مع ${trumpCount} حكم فرضت السيطرة.`,
    };
  } else if (highHonors <= 1 && jokers === 0) {
    tacticalTip = {
      category: 'defense',
      title: 'تكتيك دفاعي',
      message: 'ادعم شريكك بالورق الخفيف واحفظ الأوراق المتوسطة لضرب الخصم.',
    };
  } else {
    tacticalTip = {
      category: 'insight',
      title: `محور اليد: ${SUIT_NAMES[est.bestSuit]} ${est.bestSuit}`,
      message: `التقدير ${estimatedTricks} لمّات (${highHonors} أسياد/ملوك).`,
    };
  }

  return {
    suitDistribution,
    strengthBreakdown: {
      jokers,
      highHonors,
      midCards,
      lowCards,
    },
    estimatedTricks,
    recommendedBid: est.recommended,
    bestSuit: est.bestSuit,
    longestSuit,
    voidSuitsCount,
    trumpCount,
    tacticalTip,
  };
}

