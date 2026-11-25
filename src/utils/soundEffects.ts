/**
 * Web Audio API synthesizer for authentic, latency-free card game sound effects.
 * No external sound files required; completely reliable in all browsers.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('sound_enabled') : null;
    this.enabled = saved !== null ? saved === 'true' : true;
  }

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (typeof window !== 'undefined') {
      localStorage.setItem('sound_enabled', String(val));
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled);
    if (this.enabled) {
      this.playClick();
    }
    return this.enabled;
  }

  /** Subtle tactile click for buttons */
  public playClick() {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.05);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  /** Realistic crisp card dealing swoosh & snap */
  public playDealSound(pitchOffset = 0) {
    const ctx = this.getContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    // Card friction swoosh (filtered noise)
    const bufferSize = ctx.sampleRate * 0.06;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400 + pitchOffset * 50, t);
    filter.Q.setValueAtTime(2.5, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(t);
  }

  /** Card play snap / table slap */
  public playCardPlaySound() {
    const ctx = this.getContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    // Fast thump
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.09);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);

    // High frequency paper flick
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, t);
    osc2.frequency.exponentialRampToValueAtTime(400, t + 0.04);
    gain2.gain.setValueAtTime(0.1, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t);
    osc2.stop(t + 0.04);
  }

  /** Trick collect swoosh */
  public playCollectSound() {
    const ctx = this.getContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    const bufferSize = ctx.sampleRate * 0.22;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(1800, t + 0.15);
    filter.Q.setValueAtTime(1.8, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(t);
  }

  /** Realistic riffle shuffle flutter ("خبص الورق") */
  public playShuffleSound() {
    const ctx = this.getContext();
    if (!ctx) return;
    const baseTime = ctx.currentTime;

    for (let i = 0; i < 8; i++) {
      const offset = i * 0.032;
      const t = baseTime + offset;
      const bufferSize = Math.floor(ctx.sampleRate * 0.028);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let s = 0; s < bufferSize; s++) {
        data[s] = (Math.random() * 2 - 1) * Math.exp(-s / (bufferSize * 0.45));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1150 + i * 95, t);
      filter.Q.setValueAtTime(2.8, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.028);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(t);
    }
  }

  /** Winning fanfare / celebration chord */
  public playWinChime() {
    const ctx = this.getContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Major arpeggio)

    notes.forEach((freq, idx) => {
      const noteTime = t + idx * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.15, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.45);
    });
  }

  /** Trump selection royal chime */
  public playTrumpSound() {
    const ctx = this.getContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const freqs = [440, 554.37, 659.25]; // A4, C#5, E5

    freqs.forEach((freq, idx) => {
      const noteTime = t + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.14, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.4);
    });
  }

  /** Crisp ascending chime/chip snap for auction bids (5-9) */
  public playBidSound(amount: number) {
    const ctx = this.getContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    // Tactile chip tap
    const tapOsc = ctx.createOscillator();
    const tapGain = ctx.createGain();
    tapOsc.type = 'triangle';
    tapOsc.frequency.setValueAtTime(340 + (amount - 5) * 45, t);
    tapOsc.frequency.exponentialRampToValueAtTime(120, t + 0.06);
    tapGain.gain.setValueAtTime(0.16, t);
    tapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    tapOsc.connect(tapGain);
    tapGain.connect(ctx.destination);
    tapOsc.start(t);
    tapOsc.stop(t + 0.06);

    // Rising melodic accent scaled by bid value
    const notesByBid: Record<number, number[]> = {
      5: [392.0, 493.88],
      6: [440.0, 554.37],
      7: [493.88, 622.25],
      8: [523.25, 659.25, 783.99],
      9: [587.33, 739.99, 880.0, 1174.66],
    };
    const notes = notesByBid[amount] || [440, 554.37];

    notes.forEach((freq, idx) => {
      const start = t + idx * 0.055;
      const dur = amount === 9 ? 0.42 : 0.28;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = amount >= 8 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(amount >= 8 ? 0.14 : 0.11, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur);
    });
  }

  /** Soft muted tap for auction pass ("طاف") */
  public playPassSound() {
    const ctx = this.getContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.07);
    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  /** Cheat challenge / accusation alert (dramatic gong / gavel) */
  public playAccuseSound(isSuccess = true) {
    const ctx = this.getContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    if (isSuccess) {
      // Dramatic brass hit
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.15);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.45);
    } else {
      // Dissonant error thud
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.3);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.35);
    }
  }

  /**
   * Triumphant contract win fanfare (فوز بالشراء / نجاح الشراء)
   * Plays an exhilarating multi-voice victory fanfare with brass harmonics and golden sparkles.
   */
  public playContractWonFanfare(isUserTeam = true) {
    const ctx = this.getContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    // 1. Bass drum / timpani celebration punch
    const kickOsc = ctx.createOscillator();
    const kickGain = ctx.createGain();
    kickOsc.type = 'triangle';
    kickOsc.frequency.setValueAtTime(150, t);
    kickOsc.frequency.exponentialRampToValueAtTime(45, t + 0.28);
    kickGain.gain.setValueAtTime(0.28, t);
    kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    kickOsc.connect(kickGain);
    kickGain.connect(ctx.destination);
    kickOsc.start(t);
    kickOsc.stop(t + 0.28);

    // 2. Rising royal brass fanfare melody: D4 -> G4 -> B4 -> D5 -> high G5
    const fanfareNotes = [
      { freq: 293.66, time: 0, dur: 0.12 },     // D4
      { freq: 392.00, time: 0.11, dur: 0.12 },    // G4
      { freq: 493.88, time: 0.22, dur: 0.14 },    // B4
      { freq: 587.33, time: 0.34, dur: 0.18 },    // D5
      { freq: 783.99, time: 0.50, dur: 0.75 },    // G5 (sustained climax)
    ];

    fanfareNotes.forEach(({ freq, time, dur }) => {
      const noteTime = t + time;

      // Primary horn oscillator
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, noteTime);

      // Low-pass brass filter envelope
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 1.5, noteTime);
      filter.frequency.exponentialRampToValueAtTime(freq * 3.5, noteTime + 0.05);
      filter.frequency.exponentialRampToValueAtTime(freq * 1.2, noteTime + dur);
      filter.Q.setValueAtTime(3, noteTime);

      gain.gain.setValueAtTime(0.18, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + dur);

      // Rich fifth overtone support
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(freq * 0.5, noteTime);
      subGain.gain.setValueAtTime(0.12, noteTime);
      subGain.gain.exponentialRampToValueAtTime(0.001, noteTime + dur);
      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(noteTime);
      subOsc.stop(noteTime + dur);
    });

    // 3. Final sustained major harmony chord at t + 0.50s (G major: G4 + B4 + D5 + G5)
    const chordFreqs = [392.00, 493.88, 587.33, 783.99];
    chordFreqs.forEach((freq) => {
      const noteTime = t + 0.50;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);
      gain.gain.setValueAtTime(0.14, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.85);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.85);
    });

    // 4. Celebratory sparkle chimes (especially high-energy if user's team won)
    if (isUserTeam) {
      const sparklePitches = [1174.66, 1479.98, 1760.00, 2349.32, 2959.96];
      sparklePitches.forEach((freq, idx) => {
        const chimeTime = t + 0.58 + idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, chimeTime);
        gain.gain.setValueAtTime(0.1, chimeTime);
        gain.gain.exponentialRampToValueAtTime(0.001, chimeTime + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(chimeTime);
        osc.stop(chimeTime + 0.45);
      });
    }
  }

  /**
   * Dramatic contract fall sound effect (سقوط الشراء / كسرة الشراء)
   * Deep heavy timpani impact + descending suspenseful brass tones + penalty collapse resonance.
   */
  public playContractFallDrama(isUserTeamFell = false) {
    const ctx = this.getContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    // 1. Heavy thunderous sub-bass thud (the crash / fall impact)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, t);
    subOsc.frequency.exponentialRampToValueAtTime(30, t + 0.45);

    subGain.gain.setValueAtTime(0.35, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(t);
    subOsc.stop(t + 0.5);

    // 2. Filtered noise impact (gavel slam / wood crash)
    const bufferSize = Math.floor(ctx.sampleRate * 0.25);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(450, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(80, t + 0.25);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(t);

    // 3. Dramatic descending suspense motif (sad/tense brass collapse)
    // Eb4 (311Hz) -> D4 (293Hz) -> C#4 (277Hz) -> Low G3 / C3
    const fallMotif = [
      { freq: 311.13, time: 0.12, dur: 0.28 }, // Eb4 (Minor tension)
      { freq: 293.66, time: 0.32, dur: 0.30 }, // D4
      { freq: 277.18, time: 0.54, dur: 0.35 }, // C#4
      { freq: 196.00, time: 0.80, dur: 0.85 }, // Low G3 (somber crash)
    ];

    fallMotif.forEach(({ freq, time, dur }) => {
      const noteTime = t + time;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, noteTime);
      // Slight pitch droop to emphasize "falling"
      osc.frequency.exponentialRampToValueAtTime(freq * 0.94, noteTime + dur);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 2.2, noteTime);
      filter.frequency.exponentialRampToValueAtTime(freq * 0.8, noteTime + dur);
      filter.Q.setValueAtTime(2.5, noteTime);

      gain.gain.setValueAtTime(isUserTeamFell ? 0.25 : 0.18, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + dur);

      // Low dissonant undertone
      const underOsc = ctx.createOscillator();
      const underGain = ctx.createGain();
      underOsc.type = 'triangle';
      underOsc.frequency.setValueAtTime(freq * 0.5, noteTime);
      underGain.gain.setValueAtTime(0.12, noteTime);
      underGain.gain.exponentialRampToValueAtTime(0.001, noteTime + dur);
      underOsc.connect(underGain);
      underGain.connect(ctx.destination);
      underOsc.start(noteTime);
      underOsc.stop(noteTime + dur);
    });

    // 4. Distant dissonant bell chime for penalty finality
    const bellOsc = ctx.createOscillator();
    const bellGain = ctx.createGain();
    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(369.99, t + 0.9); // F#4 tritone dissonance
    bellGain.gain.setValueAtTime(0.12, t + 0.9);
    bellGain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
    bellOsc.connect(bellGain);
    bellGain.connect(ctx.destination);
    bellOsc.start(t + 0.9);
    bellOsc.stop(t + 1.8);
  }

  /**
   * Dramatic Joker play sound effect (تأثير لعب الجوكر الأسود والأحمر)
   * Red Joker: Explosive fire gong with triumphant radiant golden shimmer
   * Black Joker: Ominous electric void rumble with eerie arcane sweep
   */
  public playJokerPlaySound(isRed: boolean) {
    const ctx = this.getContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    if (isRed) {
      // RED JOKER: Fiery Power Chime
      // 1. Heavy resonant gong sub-punch
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(220, t);
      subOsc.frequency.exponentialRampToValueAtTime(55, t + 0.45);
      subGain.gain.setValueAtTime(0.35, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(t);
      subOsc.stop(t + 0.45);

      // 2. Fire crackle swoosh noise
      const bufSize = Math.floor(ctx.sampleRate * 0.2);
      const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.3));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(2200, t);
      noiseFilter.frequency.exponentialRampToValueAtTime(900, t + 0.2);
      noiseFilter.Q.setValueAtTime(3.0, t);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.2, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(t);

      // 3. Ascending heroic radiant arpeggio: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) -> C6 (1046Hz)
      const arpeggio = [
        { freq: 523.25, time: 0.02, dur: 0.18 },
        { freq: 659.25, time: 0.08, dur: 0.20 },
        { freq: 783.99, time: 0.15, dur: 0.25 },
        { freq: 1046.50, time: 0.22, dur: 0.65 },
      ];
      arpeggio.forEach(({ freq, time, dur }) => {
        const noteTime = t + time;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, noteTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 3.5, noteTime);
        filter.frequency.exponentialRampToValueAtTime(freq * 1.2, noteTime + dur);

        gain.gain.setValueAtTime(0.22, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + dur);
      });
    } else {
      // BLACK JOKER: Dark Electric Void Rumble
      // 1. Deep ominous sub rumble
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(130, t);
      subOsc.frequency.exponentialRampToValueAtTime(38, t + 0.55);
      subGain.gain.setValueAtTime(0.32, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(t);
      subOsc.stop(t + 0.55);

      // 2. Resonant electric sweep
      const sweepOsc = ctx.createOscillator();
      const sweepGain = ctx.createGain();
      const sweepFilter = ctx.createBiquadFilter();
      sweepOsc.type = 'square';
      sweepOsc.frequency.setValueAtTime(330, t);
      sweepOsc.frequency.exponentialRampToValueAtTime(880, t + 0.25);
      sweepFilter.type = 'bandpass';
      sweepFilter.frequency.setValueAtTime(600, t);
      sweepFilter.frequency.exponentialRampToValueAtTime(2400, t + 0.25);
      sweepFilter.Q.setValueAtTime(4.0, t);
      sweepGain.gain.setValueAtTime(0.18, t);
      sweepGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      sweepOsc.connect(sweepFilter);
      sweepFilter.connect(sweepGain);
      sweepGain.connect(ctx.destination);
      sweepOsc.start(t);
      sweepOsc.stop(t + 0.35);

      // 3. Mysterious ethereal bell chimes: D5 (587Hz) + G#5 (830Hz - tritone mystery)
      [587.33, 830.61].forEach((freq, idx) => {
        const noteTime = t + 0.08 + idx * 0.06;
        const bell = ctx.createOscillator();
        const bGain = ctx.createGain();
        bell.type = 'sine';
        bell.frequency.setValueAtTime(freq, noteTime);
        bGain.gain.setValueAtTime(0.18, noteTime);
        bGain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.6);
        bell.connect(bGain);
        bGain.connect(ctx.destination);
        bell.start(noteTime);
        bell.stop(noteTime + 0.6);
      });
    }
  }

  /** Very subtle, soft crystalline bell when playing a trump suit card */
  public playTrumpCardSound() {
    const ctx = this.getContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1174.66, t); // D6
    osc.frequency.exponentialRampToValueAtTime(1479.98, t + 0.1); // gentle upward lift to F#6

    gain.gain.setValueAtTime(0.08, t); // Gentle, subtle, non-intrusive
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  /** Crisp, distinctive accent sound when cutting a trick with trump (قطع) */
  public playTrumpCutSound() {
    const ctx = this.getContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    // Fast sword-slash-like crisp chime
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(880, t);
    osc1.frequency.exponentialRampToValueAtTime(1760, t + 0.08);

    gain1.gain.setValueAtTime(0.12, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.12);

    // Harmonic bell
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1320, t + 0.03);
    gain2.gain.setValueAtTime(0.1, t + 0.03);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t + 0.03);
    osc2.stop(t + 0.22);
  }

  /** Heroic brass announcement fanfare when a player declares "مسؤول" */
  public playMasoulDeclarationSound() {
    const ctx = this.getContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    // Brass fanfare arpeggio: G4 -> C5 -> E5 -> G5 (triumphant brass)
    const notes = [
      { f: 392.00, start: 0.00, dur: 0.12 },
      { f: 523.25, start: 0.10, dur: 0.12 },
      { f: 659.25, start: 0.20, dur: 0.14 },
      { f: 783.99, start: 0.32, dur: 0.55 },
    ];

    notes.forEach(({ f, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t + start);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(f * 3.5, t + start);
      filter.frequency.exponentialRampToValueAtTime(f * 1.5, t + start + dur);

      gain.gain.setValueAtTime(0.22, t + start);
      gain.gain.exponentialRampToValueAtTime(0.001, t + start + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t + start);
      osc.stop(t + start + dur);
    });
  }

  /** Royal grand fanfare for winning Bound (باوند) - 18 points directly */
  public playBoundVictorySound() {
    const ctx = this.getContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    // Major triumphant chords
    const chords = [
      { notes: [523.25, 659.25, 783.99], start: 0.00, dur: 0.25 }, // C Major
      { notes: [587.33, 739.99, 880.00], start: 0.22, dur: 0.25 }, // D Major
      { notes: [659.25, 830.61, 987.77], start: 0.44, dur: 0.30 }, // E Major
      { notes: [1046.50, 1318.51, 1567.98], start: 0.72, dur: 0.90 }, // High C Major 18-point climax!
    ];

    chords.forEach(({ notes, start, dur }) => {
      notes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + start);

        gain.gain.setValueAtTime(0.18, t + start);
        gain.gain.exponentialRampToValueAtTime(0.001, t + start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t + start);
        osc.stop(t + start + dur);
      });
    });
  }
}

export const sounds = new SoundSynthesizer();
