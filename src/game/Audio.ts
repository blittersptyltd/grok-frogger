// Self-contained chiptune audio using the Web Audio API.
// Approximates the original Frogger AY-3-8910 character:
//   - Intro: Inu no omawari-san (Dog Policeman)
//   - Main loop: Araiguma Rascal theme (arcade gameplay song)
//   - SFX: short square/noise one-shots in the arcade style
// Transcription source: computerarcheology.com Frogger sound dig.

export type SfxName =
  | "hop"
  | "splat"
  | "plunk"
  | "home"
  | "level_complete"
  | "extra_life"
  | "time_warning";

// MIDI-style note → frequency (Hz).
function note(n: number): number {
  return 440 * Math.pow(2, (n - 69) / 12);
}

// Piano-key helpers matching the arcade transcription (played ½-step lower
// in hardware; we keep the friendly piano key for recognizability).
const D3 = 50, E3 = 52, Fs3 = 54, G3 = 55, A3 = 57, B3 = 59;
const C4 = 60, D4 = 62, E4 = 64, Fs4 = 66, G4 = 67, A4 = 69, B4 = 71;
const C5 = 72, D5 = 74, E5 = 76, Fs5 = 78, G5 = 79, A5 = 81;
const R = -1; // rest

type Step = [number, number]; // [midi | -1, eighth-note length]

// Intro — Inu no omawari-san (16 beats / 32 eighths), 3 arcade voices → 2 here.
const INTRO_MELODY: Step[] = [
  [B4, 1], [G4, 1], [G4, 1], [G4, 1], [B4, 1], [G4, 1], [G4, 1], [G4, 1],
  [C5, 1], [C5, 1], [B4, 1], [B4, 1], [A4, 2], [R, 2],
  [C5, 1], [C5, 1], [B4, 1], [B4, 1], [A4, 1], [A4, 1], [E5, 1], [E5, 1],
  [D5, 1], [C5, 1], [B4, 1], [A4, 1], [G4, 2], [R, 2],
];

const INTRO_BASS: Step[] = [
  [G3, 1], [B3, 1], [D3, 1], [B3, 1], [G3, 1], [B3, 1], [D3, 1], [B3, 1],
  [A3, 1], [C4, 1], [D3, 1], [C4, 1], [A3, 1], [C4, 1], [D3, 1], [C4, 1],
  [A3, 1], [C4, 1], [D3, 1], [C4, 1], [A3, 1], [C4, 1], [D3, 1], [C4, 1],
  [A3, 1], [C4, 1], [D3, 1], [C4, 1], [B3, 2], [R, 2],
];

// Main loop — opening phrases of Araiguma Rascal (arcade gameplay theme).
// Loops cleanly; full ROM song is longer than a life timer allows anyway.
const MAIN_MELODY: Step[] = [
  [D5, 2], [B4, 1], [G4, 1], [G5, 2], [Fs5, 1], [E5, 1],
  [D5, 2], [G5, 1], [B4, 1], [A4, 1], [D5, 2], [R, 1],
  [R, 1], [D5, 1], [D5, 1], [D5, 1], [D5, 1], [B4, 1], [A4, 1], [G4, 1],
  [R, 1], [G5, 1], [G5, 1], [G5, 1], [A5, 1], [G5, 1], [Fs5, 1], [E5, 1],
  [D5, 1], [B4, 1], [R, 1], [B4, 1], [G5, 2], [B4, 2],
  [D5, 1], [A4, 4], [R, 1], [R, 2],
  [R, 1], [B4, 1], [B4, 1], [C5, 1], [D5, 1], [E5, 2], [Fs5, 1],
  [E5, 4], [R, 4],
  [R, 1], [C5, 1], [C5, 1], [D5, 1], [E5, 2], [Fs5, 1], [G5, 1],
  [Fs5, 4], [R, 2], [D5, 2],
  [G5, 4], [G5, 1], [Fs5, 1], [E5, 1], [D5, 1],
  [Fs5, 4], [E5, 2], [E5, 2],
  [D5, 2], [A5, 2], [G5, 2], [Fs5, 2],
  [G5, 4], [R, 4],
];

const MAIN_BASS: Step[] = [
  [G4, 4], [E4, 4],
  [G4, 4], [Fs4, 4],
  [G3, 1], [B3, 1], [D3, 1], [B3, 1], [G3, 1], [B3, 1], [D3, 1], [B3, 1],
  [G3, 1], [C4, 1], [E3, 1], [C4, 1], [G3, 1], [C4, 1], [E3, 1], [C4, 1],
  [G3, 1], [B3, 1], [D3, 1], [B3, 1], [G3, 1], [B3, 1], [D3, 1], [B3, 1],
  [A3, 1], [D4, 1], [D3, 1], [D4, 1], [E3, 1], [D4, 1], [Fs3, 1], [D4, 1],
  [G3, 1], [B3, 1], [D3, 1], [B3, 1], [G3, 1], [B3, 1], [D3, 1], [B3, 1],
  [G3, 1], [C4, 1], [E3, 1], [C4, 1], [G3, 1], [C4, 1], [E3, 1], [C4, 1],
  [G3, 1], [C4, 1], [E3, 1], [C4, 1], [G3, 1], [C4, 1], [E3, 1], [C4, 1],
  [A3, 1], [D4, 1], [D3, 1], [D4, 1], [A3, 1], [D4, 1], [D3, 1], [D4, 1],
  [G3, 1], [B3, 1], [D3, 1], [B3, 1], [G3, 1], [B3, 1], [D3, 1], [B3, 1],
  [G3, 1], [B3, 1], [D3, 1], [B3, 1], [E3, 1], [C4, 1], [A3, 1], [C4, 1],
  [A3, 1], [D4, 1], [D3, 1], [D4, 1], [A3, 1], [D4, 1], [D3, 1], [D4, 1],
  [G3, 1], [B3, 1], [D3, 1], [B3, 1], [G3, 2], [R, 2],
];

const BPM = 130;
const EIGHTH_SEC = 60 / BPM / 2;
const SCHEDULE_AHEAD_SEC = 0.45;

type VoiceCursor = {
  steps: Step[];
  index: number;
  remaining: number; // eighths left on current step
};

export class Audio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;
  private musicEnabled = false;
  private musicGain: GainNode | null = null;
  private musicStartPending = false;
  private musicGeneration = 0;
  private activeMusicOscillators = new Set<OscillatorNode>();
  private nextEighthTime = 0;
  private schedulerHandle: number | null = null;
  private eighthsPlayed = 0;
  private inIntro = true;
  private unlocked = false;
  private melody: VoiceCursor = { steps: INTRO_MELODY, index: 0, remaining: 0 };
  private bass: VoiceCursor = { steps: INTRO_BASS, index: 0, remaining: 0 };

  // The browser blocks AudioContext until a user gesture. Call this from a
  // keydown / pointer handler — and again later, since mobile may re-suspend.
  ensureStarted(): Promise<void> {
    if (!this.ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return Promise.resolve();
      this.ctx = new Ctx();
      const master = this.ctx.createGain();
      master.gain.value = 0.45;
      master.connect(this.ctx.destination);
      this.masterGain = master;

      const music = this.ctx.createGain();
      // Reason: arcade leaves one AY voice for SFX; keep music quieter under hops.
      music.gain.value = 0.14;
      music.connect(master);
      this.musicGain = music;

      // Reason: iOS suspends the context when the tab backgrounds; resume on return.
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") void this.ensureStarted();
      });
    }

    return this.resumeContext().then(() => {
      this.unlockWithSilentBuffer();
    });
  }

  private resumeContext(): Promise<void> {
    if (!this.ctx) return Promise.resolve();
    if (this.ctx.state === "suspended") {
      // Reason: creating AudioContext on iOS/Safari leaves it suspended until resume()
      // runs inside a user-gesture stack (or shortly after one).
      return this.ctx.resume().then(() => undefined);
    }
    return Promise.resolve();
  }

  private unlockWithSilentBuffer(): void {
    // Reason: some mobile WebKits need an actual node start() during the gesture
    // before later scheduled oscillators are audible.
    if (!this.ctx || this.unlocked) return;
    try {
      const buffer = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(this.ctx.destination);
      src.start(0);
      this.unlocked = true;
    } catch {
      // Ignore unlock failures; resume() alone is enough on most browsers.
    }
  }

  toggleMute(): void {
    void this.ensureStarted();
    this.muted = !this.muted;
    if (!this.masterGain || !this.ctx) return;
    this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.45, this.ctx.currentTime, 0.05);
  }

  isMuted(): boolean {
    return this.muted;
  }

  play(name: SfxName): void {
    void this.ensureStarted();
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case "hop":
        // Short stepped square chirp with odd harmonics, matching the stronger
        // arcade character used by the reference implementation.
        this.playArcadeHop(t);
        break;
      case "splat":
        // Road death: filtered noise thud + falling tone.
        this.playNoiseBurst(t, 0.22, 0.40, "lowpass", 900);
        this.playSweep(t, 280, 70, 0.28, "square", 0.18);
        break;
      case "plunk":
        // Water death: descending plunk with a soft splash of noise.
        this.playSweep(t, 440, 90, 0.45, "triangle", 0.32);
        this.playNoiseBurst(t + 0.02, 0.18, 0.18, "lowpass", 500);
        break;
      case "home":
        // Safe landing: quick rising three-note jingle.
        this.playArpeggio(t, [G4, B4, D5], 0.07, 0.20);
        break;
      case "level_complete":
        this.playArpeggio(t, [G4, B4, D5, G5, B4, D5, G5], 0.09, 0.20);
        break;
      case "extra_life":
        this.playArpeggio(t, [C5, E5, G5, C5 + 12], 0.07, 0.22);
        break;
      case "time_warning":
        // Urgent alternating beeps (arcade timer alarm feel).
        this.playSweep(t, 1400, 1400, 0.06, "square", 0.20);
        this.playSweep(t + 0.10, 1100, 1100, 0.06, "square", 0.20);
        this.playSweep(t + 0.20, 1400, 1400, 0.06, "square", 0.20);
        break;
    }
  }

  startMusic(): void {
    if (this.musicEnabled || this.musicStartPending) return;
    this.musicStartPending = true;
    const generation = ++this.musicGeneration;
    void this.ensureStarted().then(() => {
      if (generation !== this.musicGeneration) return;
      this.musicStartPending = false;
      if (!this.ctx || !this.musicGain) return;
      this.musicEnabled = true;
      this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicGain.gain.setValueAtTime(0.14, this.ctx.currentTime);
      this.inIntro = true;
      this.eighthsPlayed = 0;
      this.melody = { steps: INTRO_MELODY, index: 0, remaining: 0 };
      this.bass = { steps: INTRO_BASS, index: 0, remaining: 0 };
      this.nextEighthTime = this.ctx.currentTime + 0.05;
      this.scheduleTick();
    });
  }

  stopMusic(): void {
    this.musicGeneration++;
    this.musicStartPending = false;
    this.musicEnabled = false;
    if (this.schedulerHandle !== null) {
      clearTimeout(this.schedulerHandle);
      this.schedulerHandle = null;
    }
    // Notes are scheduled ahead, so clearing the timer alone leaves up to
    // 450ms playing. Stop every music oscillator immediately at transitions.
    for (const oscillator of this.activeMusicOscillators) {
      try { oscillator.stop(); } catch { /* already ended */ }
    }
    this.activeMusicOscillators.clear();
    if (this.ctx && this.musicGain) {
      this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  private scheduleTick = (): void => {
    if (!this.ctx || !this.musicEnabled) return;
    const ahead = this.ctx.currentTime + SCHEDULE_AHEAD_SEC;
    while (this.nextEighthTime < ahead) {
      // Switch to main theme exactly after the 32-eighth intro.
      if (this.inIntro && this.eighthsPlayed >= 32) {
        this.inIntro = false;
        this.melody = { steps: MAIN_MELODY, index: 0, remaining: 0 };
        this.bass = { steps: MAIN_BASS, index: 0, remaining: 0 };
      }
      this.advanceVoice(this.melody, this.nextEighthTime, "square", 0.11);
      this.advanceVoice(this.bass, this.nextEighthTime, "triangle", 0.16);
      this.nextEighthTime += EIGHTH_SEC;
      this.eighthsPlayed++;
    }
    this.schedulerHandle = window.setTimeout(this.scheduleTick, 80);
  };

  private advanceVoice(
    voice: VoiceCursor,
    time: number,
    wave: OscillatorType,
    peakGain: number
  ): void {
    if (voice.remaining <= 0) {
      if (voice.index >= voice.steps.length) {
        voice.index = 0;
      }
      const [midi, len] = voice.steps[voice.index];
      voice.remaining = len;
      if (midi >= 0 && this.musicGain) {
        this.scheduleNote(time, note(midi), len * EIGHTH_SEC * 0.92, wave, peakGain, this.musicGain);
      }
      voice.index++;
    }
    voice.remaining--;
  }

  private scheduleNote(
    start: number,
    freq: number,
    duration: number,
    type: OscillatorType,
    peakGain: number,
    target: AudioNode
  ): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const env = this.ctx.createGain();
    // AY-like: hard attack, automatic volume decay across the note.
    env.gain.setValueAtTime(0, start);
    env.gain.linearRampToValueAtTime(peakGain, start + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, start + Math.max(0.04, duration));
    osc.connect(env);
    env.connect(target);
    if (target === this.musicGain) {
      this.activeMusicOscillators.add(osc);
      osc.addEventListener("ended", () => this.activeMusicOscillators.delete(osc), { once: true });
    }
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  private playSweep(
    start: number,
    fromHz: number,
    toHz: number,
    duration: number,
    type: OscillatorType,
    peakGain: number
  ): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(fromHz, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(toHz, 1), start + duration);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, start);
    env.gain.linearRampToValueAtTime(peakGain, start + 0.004);
    env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(env);
    env.connect(this.masterGain);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  private playArcadeHop(start: number): void {
    if (!this.ctx || !this.masterGain) return;
    const pulse = (time: number, frequency: number): void => {
      [1, 3, 5].forEach((harmonic) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "square";
        osc.frequency.value = frequency * harmonic;
        gain.gain.setValueAtTime(0.075 / harmonic, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(time);
        osc.stop(time + 0.04);
      });
    };
    pulse(start, note(60));
    pulse(start + 0.035, note(72));
  }

  private playNoiseBurst(
    start: number,
    duration: number,
    peakGain: number,
    filterType: BiquadFilterType,
    filterFreq: number
  ): void {
    if (!this.ctx || !this.masterGain) return;
    const sampleCount = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, sampleCount, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(peakGain, start);
    env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    src.connect(filter);
    filter.connect(env);
    env.connect(this.masterGain);
    src.start(start);
    src.stop(start + duration + 0.05);
  }

  private playArpeggio(start: number, midiNotes: number[], stepDuration: number, peakGain: number): void {
    if (!this.ctx || !this.masterGain) return;
    midiNotes.forEach((n, i) => {
      this.scheduleNote(
        start + i * stepDuration,
        note(n),
        stepDuration * 1.35,
        "square",
        peakGain,
        this.masterGain!
      );
    });
  }
}
