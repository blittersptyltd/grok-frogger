import { WIDTH, HEIGHT, TILE, COLS, GameState, PALETTE } from "../types";
import { drawWorldBackground, ROW } from "./World";
import { arcadeTextWidth, drawArcadeText, drawHUD, drawScoreHUD, HUDState } from "./HUD";
import { Input } from "./Input";
import { Frog, FROG_START_COL, FROG_START_ROW, DeathKind } from "./Frog";
import { SpriteSheet } from "./Sprites";
import { Lane, LaneConfig } from "./Lane";
import { isPotentiallyRideable } from "./Obstacle";
import { Homes } from "./Homes";
import { Bonuses } from "./Bonuses";
import { Audio } from "./Audio";
import { featuresForLevel, SCORE_FLY_BONUS, SCORE_LADY_BONUS, LevelFeatures } from "./Levels";
import {
  DEATH_DURATION,
  FROG_HITBOX_INSET,
  SCORE_PER_STEP,
  SCORE_PER_HOME,
  SCORE_PER_TIME_SECOND,
  SCORE_LEVEL_BONUS,
  EXTRA_LIFE_AT,
  TIME_LIMIT_SECONDS,
  READY_DURATION,
  LEVEL_COMPLETE_DURATION,
  GAME_OVER_DURATION,
  HIGH_SCORE_KEY,
  levelSpeedMultiplier,
} from "./Constants";

const ROAD_LANES: LaneConfig[] = [
  { row: ROW.ROAD_1, direction: -1, speed: 35, kind: "truck", spacing: TILE * 9 },
  { row: ROW.ROAD_2, direction: 1, speed: 70, kind: "car_white", spacing: TILE * 8 },
  { row: ROW.ROAD_3, direction: -1, speed: 30, kind: "car_purple", spacing: TILE * 7 },
  { row: ROW.ROAD_4, direction: 1, speed: 45, kind: "car_green", spacing: TILE * 8 },
  { row: ROW.ROAD_5, direction: -1, speed: 25, kind: "car_yellow", spacing: TILE * 7 },
];

const RIVER_LANES: LaneConfig[] = [
  { row: ROW.RIVER_1, direction: 1, speed: 35, kind: "log_med", spacing: TILE * 7 },
  { row: ROW.RIVER_2, direction: -1, speed: 45, kind: "turtle_trio", spacing: TILE * 6 },
  { row: ROW.RIVER_3, direction: 1, speed: 25, kind: "log_long", spacing: TILE * 8 },
  { row: ROW.RIVER_4, direction: 1, speed: 50, kind: "log_short", spacing: TILE * 6 },
  { row: ROW.RIVER_5, direction: -1, speed: 35, kind: "turtle_pair", spacing: TILE * 5 },
];

export class Game {
  private ctx: CanvasRenderingContext2D;
  private last = 0;
  private accumulator = 0;
  private readonly STEP = 1 / 60;
  private state: GameState = "ATTRACT";
  private stateTimer = 0;
  private debug = false;
  private attractBlink = 0;
  private attractSegmentIndex = -1;
  private demoMoveIndex = 0;
  private demoMoveTimer = 0;
  private demoHomePause = 0;

  private input = new Input();
  private sprites = new SpriteSheet();
  private audio = new Audio();
  private frog = new Frog(FROG_START_COL, FROG_START_ROW, this.sprites);
  private homes = new Homes(this.sprites);
  private bonuses = new Bonuses(this.sprites);
  private features: LevelFeatures = featuresForLevel(1);
  private timeWarningSounded = false;
  private roadLanes: Lane[] = [];
  private riverLanes: Lane[] = [];
  private get allLanes(): Lane[] {
    return [...this.roadLanes, ...this.riverLanes];
  }

  // Lowest row index (= furthest north) the frog has reached this life.
  // Used to award per-step bonus only the first time the frog reaches a new row.
  private maxRowReached: number = FROG_START_ROW;
  private timeRemainingSec = TIME_LIMIT_SECONDS;
  private extraLifeAwarded = false;

  private hud: HUDState = {
    score: 0,
    hiScore: 0,
    lives: 3,
    level: 1,
    timeRemaining: 1,
  };

  private canvas: HTMLCanvasElement;
  private actionBtn: HTMLButtonElement | null = null;
  private muteBtn: HTMLButtonElement | null = null;
  private touchUi = false;

  constructor(canvas: HTMLCanvasElement, touch?: TouchUiElements) {
    this.canvas = canvas;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable");
    ctx.imageSmoothingEnabled = false;
    this.ctx = ctx;

    this.touchUi = Boolean(touch?.enabled);
    this.actionBtn = touch?.actionBtn ?? null;
    this.muteBtn = touch?.muteBtn ?? null;

    this.input.attachSwipeSurface(canvas);
    if (touch?.dpad) this.input.attachDpad(touch.dpad);
    if (touch?.actionBtn) this.input.attachConfirmButton(touch.actionBtn);
    if (touch?.muteBtn) {
      touch.muteBtn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        void this.audio.ensureStarted().then(() => {
          this.audio.toggleMute();
          this.syncMuteLabel();
        });
      });
    }

    this.fitCanvas();
    window.addEventListener("resize", this.onViewportChange);
    window.visualViewport?.addEventListener("resize", this.onViewportChange);

    window.addEventListener("keydown", (e) => {
      // Browser policy requires a user gesture before audio can start.
      void this.audio.ensureStarted();

      // Reason: KeyD is move-right in Input; use backtick for debug overlay.
      if (e.code === "Backquote") this.debug = !this.debug;
      if (e.code === "KeyM") {
        this.audio.toggleMute();
        this.syncMuteLabel();
      }

      if (this.state === "PLAYING" || this.state === "READY") this.audio.startMusic();
    });

    // Reason: unlock in capture phase during the gesture itself. iOS Safari often
    // keeps AudioContext suspended if resume() only runs later in the game loop.
    const unlockAudio = (): void => {
      void this.audio.ensureStarted();
    };
    window.addEventListener("pointerdown", unlockAudio, { capture: true, passive: true });
    window.addEventListener("touchstart", unlockAudio, { capture: true, passive: true });

    this.spawnLanesForLevel();
    // Attract mode: hide the frog until the player starts.
    this.frog.reset(FROG_START_COL, FROG_START_ROW);
    this.syncActionLabel();
    this.syncMuteLabel();
  }

  async start(): Promise<void> {
    await this.sprites.whenReady();
    // Restore persisted hi-score (0 on first run).
    this.hud.hiScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || "0", 10);
    this.last = performance.now();
    requestAnimationFrame(this.loop);
  }

  private loop = (now: number): void => {
    const dt = (now - this.last) / 1000;
    this.last = now;
    this.accumulator += dt;
    while (this.accumulator >= this.STEP) {
      this.update(this.STEP);
      this.accumulator -= this.STEP;
    }
    this.render();
    requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    for (const lane of this.allLanes) lane.update(dt);
    this.bonuses.update(dt, this.riverLanes, {
      ladyEnabled: this.features.ladyFrog && this.state === "PLAYING",
      ladyDuration: this.features.ladyDurationSec,
      snakeEnabled: this.features.snakes && this.state !== "ATTRACT",
      snakeSpeed: 40 * levelSpeedMultiplier(this.hud.level),
    });
    this.homes.update(dt);

    if (this.state === "ATTRACT") {
      this.attractBlink += dt;
      const segment = this.attractSegment();
      if (segment !== this.attractSegmentIndex) this.enterAttractSegment(segment);
      if (segment === 5) this.updateAttractDemo(dt);
      // Reason: clear hops so leftover swipes don't fire on first READY frame,
      // but still accept confirm (tap / START / Enter).
      this.input.consumeHop();
      if (this.input.consumeConfirm()) {
        void this.audio.ensureStarted().then(() => {
          this.startNewGame();
        });
      }
      return;
    }

    if (this.state === "READY") {
      this.stateTimer -= dt;
      this.input.clear();
      if (this.stateTimer <= 0) {
        this.state = "PLAYING";
        this.audio.startMusic();
        this.syncActionLabel();
      }
      return;
    }

    if (this.state === "PLAYING") {
      // Ignore confirm taps during play so accidental canvas taps don't restart.
      this.input.consumeConfirm();
      if (!this.frog.isHopping()) {
        const dir = this.input.consumeHop();
        if (dir) {
          const previousRow = this.frog.row;
          const previousCol = this.frog.col;
          this.frog.tryHop(dir);
          if (this.frog.row !== previousRow || this.frog.col !== previousCol) {
            this.audio.play("hop");
          }
          this.awardForwardStep(previousRow, this.frog.row);
        }
      }
      this.frog.update(dt);
      this.applyRideDrift(dt);
      this.checkRoadCollision();
      this.checkRiverState();
      this.checkHazardKills();
      this.checkLadyCollect();
      this.checkHomeArrival();
      this.tickTimer(dt);
    } else if (this.state === "DYING") {
      this.input.clear();
      this.frog.update(dt);
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) this.respawn();
    } else if (this.state === "LEVEL_COMPLETE") {
      this.input.clear();
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) this.advanceLevel();
    } else if (this.state === "GAME_OVER") {
      this.input.consumeHop();
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.syncActionLabel();
        if (this.input.consumeConfirm()) this.enterAttract();
      }
    }
  }

  private awardForwardStep(prevRow: number, newRow: number): void {
    if (newRow < prevRow && newRow < this.maxRowReached) {
      this.maxRowReached = newRow;
      this.addScore(SCORE_PER_STEP);
    }
  }

  private checkRoadCollision(): void {
    const frogRow = this.frog.row;
    if (frogRow < ROW.ROAD_1 || frogRow > ROW.ROAD_5) return;
    const lane = this.roadLanes.find((l) => l.cfg.row === frogRow);
    if (!lane) return;

    const fb = this.frogHitbox();
    for (const o of lane.obstacles) {
      const ob = o.bounds();
      if (
        fb.x < ob.x + ob.w &&
        fb.x + fb.w > ob.x &&
        fb.y < ob.y + ob.h &&
        fb.y + fb.h > ob.y
      ) {
        this.die("splat");
        return;
      }
    }
  }

  private applyRideDrift(dt: number): void {
    if (this.frog.isHopping()) return;
    const platform = this.platformUnderFrog();
    if (!platform) return;
    this.frog.drift(platform.direction * platform.speed * dt);
  }

  private platformUnderFrog(): { direction: 1 | -1; speed: number } | null {
    const frogRow = this.frog.row;
    if (frogRow < ROW.RIVER_1 || frogRow > ROW.RIVER_5) return null;
    const lane = this.riverLanes.find((l) => l.cfg.row === frogRow);
    if (!lane) return null;

    const fb = this.frogHitbox();
    for (const o of lane.obstacles) {
      if (!isPotentiallyRideable(o.kind)) continue;
      if (!o.isRideableNow()) continue;
      const ob = o.bounds();
      const fcx = fb.x + fb.w / 2;
      if (fcx >= ob.x && fcx <= ob.x + ob.w) {
        return { direction: o.direction, speed: o.speed };
      }
    }
    return null;
  }

  private checkRiverState(): void {
    const frogRow = this.frog.row;
    if (frogRow < ROW.RIVER_1 || frogRow > ROW.RIVER_5) return;
    if (this.frog.isHopping()) return;

    if (this.platformUnderFrog() === null) {
      this.die("drown");
      return;
    }
    const pos = this.frog.tilePosition();
    if (pos.x < -TILE / 2 || pos.x > COLS * TILE - TILE / 2) {
      this.die("drown");
    }
  }

  private checkHazardKills(): void {
    if (this.frog.isHopping()) return;
    const fb = this.frogHitbox();

    // Croc mouths on the frog's river row.
    const frogRow = this.frog.row;
    if (frogRow >= ROW.RIVER_1 && frogRow <= ROW.RIVER_5) {
      const lane = this.riverLanes.find((l) => l.cfg.row === frogRow);
      if (lane) {
        for (const o of lane.obstacles) {
          const lethal = o.lethalBounds();
          if (!lethal) continue;
          if (
            fb.x < lethal.x + lethal.w &&
            fb.x + fb.w > lethal.x &&
            fb.y < lethal.y + lethal.h &&
            fb.y + fb.h > lethal.y
          ) {
            this.die("splat");
            return;
          }
        }
      }
    }

    // Snake on the median.
    if (frogRow === ROW.MEDIAN) {
      const lethal = this.bonuses.snakeLethalBounds();
      if (
        lethal &&
        fb.x < lethal.x + lethal.w &&
        fb.x + fb.w > lethal.x &&
        fb.y < lethal.y + lethal.h &&
        fb.y + fb.h > lethal.y
      ) {
        this.die("splat");
      }
    }
  }

  private checkLadyCollect(): void {
    if (this.frog.isHopping()) return;
    if (!this.features.ladyFrog) return;
    // Pickup only — score is awarded when she is delivered home.
    if (this.bonuses.tryCollectLady(this.frogHitbox())) {
      this.audio.play("home");
    }
  }

  private checkHomeArrival(): void {
    if (this.frog.row !== ROW.HOMES) return;
    if (this.frog.isHopping()) return;

    const pos = this.frog.tilePosition();
    const result = this.homes.tryFill(pos.x);
    if (result === "death") {
      this.die("splat");
      return;
    }

    this.addScore(SCORE_PER_HOME);
    const timeBonus = Math.floor(this.timeRemainingSec) * SCORE_PER_TIME_SECOND;
    this.addScore(timeBonus);
    if (result.flyBonus) {
      this.addScore(SCORE_FLY_BONUS);
      this.audio.play("extra_life");
    }
    if (this.bonuses.deliverLady()) {
      this.addScore(SCORE_LADY_BONUS);
      this.audio.play("extra_life");
    }

    this.audio.play("home");

    if (this.homes.allFilled()) {
      this.addScore(SCORE_LEVEL_BONUS);
      this.audio.play("level_complete");
      // Reason: seat sprite is already in the alcove — hide the player frog so
      // we don't draw two frogs stacked in the last home during the banner.
      this.frog.reset(FROG_START_COL, FROG_START_ROW);
      this.state = "LEVEL_COMPLETE";
      this.stateTimer = LEVEL_COMPLETE_DURATION;
      this.input.clear();
    } else {
      this.frog.reset(FROG_START_COL, FROG_START_ROW);
      this.maxRowReached = FROG_START_ROW;
      this.timeRemainingSec = TIME_LIMIT_SECONDS;
      this.hud.timeRemaining = 1;
      this.timeWarningSounded = false;
      this.input.clear();
      this.enterReady();
    }
  }

  private tickTimer(dt: number): void {
    this.timeRemainingSec -= dt;
    this.hud.timeRemaining = Math.max(0, this.timeRemainingSec / TIME_LIMIT_SECONDS);
    if (!this.timeWarningSounded && this.timeRemainingSec <= 5 && this.timeRemainingSec > 0) {
      this.timeWarningSounded = true;
      this.audio.play("time_warning");
    }
    if (this.timeRemainingSec <= 0) {
      this.die("splat");
    }
  }

  private addScore(amount: number): void {
    this.hud.score += amount;
    if (this.hud.score > this.hud.hiScore) this.hud.hiScore = this.hud.score;
    if (!this.extraLifeAwarded && this.hud.score >= EXTRA_LIFE_AT) {
      this.extraLifeAwarded = true;
      this.hud.lives++;
      this.audio.play("extra_life");
    }
  }

  private frogHitbox(): { x: number; y: number; w: number; h: number } {
    const pos = this.frog.tilePosition();
    return {
      x: pos.x + FROG_HITBOX_INSET,
      y: pos.y + FROG_HITBOX_INSET,
      w: TILE - FROG_HITBOX_INSET * 2,
      h: TILE - FROG_HITBOX_INSET * 2,
    };
  }

  private die(kind: DeathKind): void {
    this.state = "DYING";
    this.stateTimer = DEATH_DURATION;
    this.hud.lives = Math.max(0, this.hud.lives - 1);
    this.frog.startDying(kind, DEATH_DURATION);
    this.bonuses.dropLady();
    this.audio.play(kind === "splat" ? "splat" : "plunk");
    this.input.clear();
  }

  private respawn(): void {
    if (this.hud.lives <= 0) {
      this.state = "GAME_OVER";
      this.stateTimer = GAME_OVER_DURATION;
      this.audio.stopMusic();
      this.syncActionLabel();
      // Persist the hi-score if we beat it this run.
      const stored = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || "0", 10);
      if (this.hud.hiScore > stored) {
        localStorage.setItem(HIGH_SCORE_KEY, String(this.hud.hiScore));
      }
      return;
    }
    this.frog.reset(FROG_START_COL, FROG_START_ROW);
    this.maxRowReached = FROG_START_ROW;
    this.timeRemainingSec = TIME_LIMIT_SECONDS;
    this.hud.timeRemaining = 1;
    this.timeWarningSounded = false;
    this.input.clear();
    this.enterReady();
  }

  private advanceLevel(): void {
    this.hud.level++;
    this.homes.reset();
    this.bonuses.reset();
    this.frog.reset(FROG_START_COL, FROG_START_ROW);
    this.maxRowReached = FROG_START_ROW;
    this.timeRemainingSec = TIME_LIMIT_SECONDS;
    this.hud.timeRemaining = 1;
    this.timeWarningSounded = false;
    this.input.clear();
    this.spawnLanesForLevel();
    this.enterReady();
  }

  private spawnLanesForLevel(): void {
    this.features = featuresForLevel(this.hud.level);
    const mult = levelSpeedMultiplier(this.hud.level);
    this.roadLanes = ROAD_LANES.map(
      (cfg) => new Lane({ ...cfg, speed: cfg.speed * mult }, this.sprites)
    );
    this.riverLanes = RIVER_LANES.map((cfg) => {
      const isTurtle = cfg.kind === "turtle_pair" || cfg.kind === "turtle_trio";
      return new Lane(
        {
          ...cfg,
          speed: cfg.speed * mult,
          diveChance: isTurtle && this.features.divingTurtles ? this.features.diveChance : 0,
          crocChance: cfg.kind === "log_long" ? this.features.crocChance : 0,
        },
        this.sprites
      );
    });
    this.homes.setBonuses({
      fly: this.features.flyBonus,
      crocHead: this.features.crocodiles,
      intervalSec: this.features.flyIntervalSec,
    });
    this.bonuses.reset();
  }

  private enterReady(): void {
    this.state = "READY";
    this.stateTimer = READY_DURATION;
    this.input.clear();
    this.syncActionLabel();
  }

  private enterAttract(): void {
    this.state = "ATTRACT";
    this.stateTimer = 0;
    this.attractBlink = 0;
    this.attractSegmentIndex = -1;
    this.demoMoveIndex = 0;
    this.demoMoveTimer = 0;
    this.demoHomePause = 0;
    this.hud = {
      score: 0,
      hiScore: this.hud.hiScore,
      lives: 3,
      level: 1,
      timeRemaining: 1,
    };
    this.homes.reset();
    this.bonuses.reset();
    this.frog.reset(FROG_START_COL, FROG_START_ROW);
    this.maxRowReached = FROG_START_ROW;
    this.timeRemainingSec = TIME_LIMIT_SECONDS;
    this.timeWarningSounded = false;
    this.extraLifeAwarded = false;
    this.input.clear();
    this.spawnLanesForLevel();
    this.audio.stopMusic();
    this.syncActionLabel();
  }

  private startNewGame(): void {
    this.hud = { score: 0, hiScore: this.hud.hiScore, lives: 3, level: 1, timeRemaining: 1 };
    this.homes.reset();
    this.bonuses.reset();
    this.frog.reset(FROG_START_COL, FROG_START_ROW);
    this.maxRowReached = FROG_START_ROW;
    this.timeRemainingSec = TIME_LIMIT_SECONDS;
    this.hud.timeRemaining = 1;
    this.timeWarningSounded = false;
    this.extraLifeAwarded = false;
    this.input.clear();
    this.spawnLanesForLevel();
    this.audio.startMusic();
    this.enterReady();
  }

  private syncActionLabel(): void {
    if (!this.actionBtn) return;
    if (this.state === "ATTRACT") {
      this.actionBtn.textContent = "START";
      this.actionBtn.disabled = false;
    } else if (this.state === "GAME_OVER") {
      this.actionBtn.textContent = "AGAIN";
      this.actionBtn.disabled = this.stateTimer > 0;
    } else {
      this.actionBtn.textContent = "PLAY";
      this.actionBtn.disabled = true;
    }
  }

  private syncMuteLabel(): void {
    if (!this.muteBtn) return;
    this.muteBtn.textContent = this.audio.isMuted() ? "UNMUTE" : "MUTE";
  }

  private render(): void {
    const { ctx } = this;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Original attract instructions replace the playfield with black pages;
    // keep the live scoreboard above them.
    if (this.state === "ATTRACT") {
      const segment = this.attractSegment();
      if (segment === 5) {
        this.drawAttractDemo();
        return;
      }
      ctx.fillStyle = PALETTE.black;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      drawScoreHUD(
        ctx,
        { ...this.hud, score: 1580, hiScore: 4630 },
        this.sprites
      );
      this.drawAttractOverlay();
      return;
    }

    drawWorldBackground(ctx);
    for (const lane of this.allLanes) lane.draw(ctx);
    this.homes.draw(ctx);
    // Home sprites own the bay during the level-complete banner.
    if (this.state !== "LEVEL_COMPLETE") this.frog.draw(ctx);
    // Draw lady after frog so she rides visibly beside the player when carried.
    const frogPix = this.frog.pixelPosition();
    this.bonuses.draw(
      ctx,
      this.state !== "LEVEL_COMPLETE" && !this.frog.isDying()
        ? {
            x: frogPix.x + TILE / 2,
            y: frogPix.y + TILE / 2,
            facing: this.frog.facing,
          }
        : null
    );
    if (this.debug) this.drawDebugOverlay();
    drawHUD(ctx, this.hud, this.sprites);

    if (this.state === "READY") this.drawCenteredBanner("READY!");
    else if (this.state === "LEVEL_COMPLETE") this.drawCenteredBanner("LEVEL COMPLETE!");
    else if (this.state === "GAME_OVER") {
      const hint = this.touchUi ? "TAP TO CONTINUE" : "ENTER TO RESTART";
      this.drawCenteredBanner(this.stateTimer > 0 ? "GAME OVER" : `GAME OVER  -  ${hint}`);
    }
  }

  private drawAttractOverlay(): void {
    const cycle = this.attractBlink % 93;
    if (cycle < 39) this.drawAttractFrogs(cycle);
    else if (cycle < 48) this.drawAttractPointTable(cycle - 39);
    else if (cycle < 55) this.drawAttractRanking();
    else if (cycle < 63) this.drawAttractInstructions();
    else this.drawAttractStart();
  }

  private attractSegment(): number {
    const cycle = this.attractBlink % 93;
    if (cycle < 39) return 0;
    if (cycle < 48) return 1;
    if (cycle < 55) return 2;
    if (cycle < 63) return 3;
    if (cycle < 68) return 4;
    return 5;
  }

  private enterAttractSegment(segment: number): void {
    this.attractSegmentIndex = segment;
    if (segment === 0 || segment === 5) {
      this.frog.reset(FROG_START_COL, FROG_START_ROW);
      this.homes.reset();
      this.hud.score = 0;
      this.hud.timeRemaining = 1;
      this.demoMoveIndex = 0;
      this.demoMoveTimer = 0;
      this.demoHomePause = 0;
    }
  }

  private updateAttractDemo(dt: number): void {
    const moves: Array<"up" | "down" | "left" | "right"> = [
      "up", "up", "left", "up", "right", "up", "up", "left",
      "up", "right", "up", "up", "left", "right", "up", "up",
    ];

    if (this.frog.row === ROW.HOMES && !this.frog.isHopping()) {
      this.demoHomePause += dt;
      if (this.demoHomePause >= 0.9) {
        const result = this.homes.tryFill(this.frog.tilePosition().x);
        if (result !== "death") this.hud.score += SCORE_PER_HOME;
        this.frog.reset(FROG_START_COL, FROG_START_ROW);
        this.demoMoveIndex = 0;
        this.demoMoveTimer = 0.7;
        this.demoHomePause = 0;
      }
      return;
    }

    this.demoMoveTimer -= dt;
    if (!this.frog.isHopping() && this.demoMoveTimer <= 0) {
      const direction = moves[this.demoMoveIndex % moves.length];
      const before = this.frog.tilePosition();
      this.frog.tryHop(direction);
      const after = this.frog.tilePosition();
      if (before.x !== after.x || before.y !== after.y) this.hud.score += SCORE_PER_STEP;
      this.demoMoveIndex++;
      this.demoMoveTimer = 0.42;
    }
    this.frog.update(dt);
  }


  private drawAttractFrogs(elapsed: number): void {
    // Traced from the 1981 cabinet sequence: one travelling frog repeatedly
    // crosses from the right and joins a seven-frog row. The complete row then
    // makes four synchronous upward hops, tightening to one frog per letter.
    const fieldTop = TILE * 2;
    const fieldBottom = HEIGHT - TILE * 2;
    this.ctx.fillStyle = PALETTE.water;
    this.ctx.fillRect(0, fieldTop, WIDTH, fieldBottom - fieldTop);

    const stations = [72, 122, 172, 222, 272, 322, 372];
    const rowY = fieldBottom - 16;
    const frogSize = 23;
    const marchStart = 4.5;
    const joinEvery = 3.65;

    if (elapsed < 29.7) {
      if (elapsed >= marchStart) {
        const marchTime = elapsed - marchStart;
        const stage = Math.min(6, Math.floor(marchTime / joinEvery));
        const stageTime = marchTime - stage * joinEvery;
        for (let index = 0; index < stage; index++) {
          this.sprites.drawCentered(this.ctx, "frog_idle", stations[index], rowY, frogSize);
        }

        const p = Math.max(0, Math.min(1, stageTime / joinEvery));
        // The cabinet runner arrives in short, discrete left-facing hops.
        const hopCount = 5;
        const stepped = Math.min(1, Math.floor(p * hopCount) / hopCount);
        const hopPhase = (p * hopCount) % 1;
        const x = WIDTH - 38 + (stations[stage] - (WIDTH - 38)) * stepped;
        const y = rowY - Math.sin(Math.PI * Math.min(1, hopPhase)) * 7;
        this.sprites.drawCentered(
          this.ctx,
          hopPhase < 0.72 ? "frog_hop" : "frog_idle",
          x,
          y,
          frogSize,
          -Math.PI / 2
        );
      }
    } else {
      const title = "FROGGER";
      const titleX = (WIDTH - arcadeTextWidth(title, 3)) / 2;
      const titleY = 202;
      const riseStart = 29.7;
      const riseDuration = 3.55;
      const rise = Math.max(0, Math.min(1, (elapsed - riseStart) / riseDuration));
      const steps = 4;
      const stepPosition = rise * steps;
      const completedSteps = Math.min(steps, Math.floor(stepPosition));
      const stepPhase = completedSteps >= steps ? 0 : stepPosition - completedSteps;
      const easedStep = stepPhase < 0.72 ? stepPhase / 0.72 : 1;
      const verticalProgress = (completedSteps + easedStep) / steps;
      const transformStart = 33.35;

      for (let index = 0; index < 7; index++) {
        const letterAt = transformStart + index * 0.53;
        const letterX = titleX + index * 27;
        if (elapsed >= letterAt) {
          drawArcadeText(this.ctx, this.sprites, title[index], letterX, titleY, "green", 3);
          continue;
        }

        const targetX = letterX + 13.5;
        const x = stations[index] + (targetX - stations[index]) * verticalProgress;
        const baseY = rowY + (titleY + 13.5 - rowY) * verticalProgress;
        const arc = stepPhase < 0.72 ? Math.sin(Math.PI * easedStep) * 10 : 0;
        this.sprites.drawCentered(
          this.ctx,
          stepPhase < 0.72 && completedSteps < steps ? "frog_hop" : "frog_idle",
          x,
          baseY - arc,
          frogSize
        );
      }
    }

    this.drawAttractCentered("CREDIT 00", HEIGHT - 27, "cyan", 1);
  }

  private drawAttractDemo(): void {
    drawWorldBackground(this.ctx);
    for (const lane of this.allLanes) lane.draw(this.ctx);
    this.homes.draw(this.ctx);
    this.frog.draw(this.ctx);
    drawHUD(this.ctx, this.hud, this.sprites);
  }

  private drawAttractPointTable(elapsed: number): void {
    this.drawAttractCentered("POINT TABLE", 88, "grey", 2);
    const rows: Array<[string, string]> = [
      ["1 JUMP FORWARD", "10 PT"],
      ["1 FROG ARRIVED", "50 PT"],
      ["LADY FROG ARRIVED", "200 PT"],
      ["FLY CATCHED", "200 PT"],
      ["ALL FROGS ARRIVED", "1000 PT"],
      ["TIME REMAINING", "10 PT PER BEAT"],
    ];
    const shown = Math.min(rows.length, Math.floor(elapsed / 1.05) + 1);
    rows.slice(0, shown).forEach(([label, value], index) => {
      const y = 132 + index * 52;
      this.drawAttractCentered(label, y, "yellow", 1.5);
      this.drawAttractCentered(value, y + 22, "red", 1.25);
    });
    this.drawAttractCentered("CREDIT 00", HEIGHT - 28, "grey", 1);
  }

  private drawAttractInstructions(): void {
    this.drawAttractCentered("HOW TO PLAY", 82, "yellow");
    const lines = [
      "SWIPE OR TAP ARROWS",
      "GET 5 FROGS HOME",
      "CROSS ROAD AND RIVER",
      "RIDE LOGS TURTLES",
      "AND CROCODILE BACKS",
      "AVOID CARS SNAKES",
      "DIVING TURTLES AND",
      "CROCODILE MOUTHS",
    ];
    lines.forEach((line, index) => {
      this.drawAttractCentered(line, 124 + index * 34, "grey");
    });
    this.drawAttractCentered("TAP START TO PLAY", 420, "red");
    this.drawAttractCentered("CREDIT 00", HEIGHT - 28, "grey", 1);
  }

  private drawAttractRanking(): void {
    this.drawAttractCentered("SCORE RANKING", 96, "grey", 2);
    const rows = [
      ["1ST", "10000 PT"],
      ["2ND", "5000 PT"],
      ["3RD", "3000 PT"],
      ["4TH", "1000 PT"],
      ["5TH", "500 PT"],
    ];
    rows.forEach(([rank, score], index) => {
      const y = 154 + index * 50;
      drawArcadeText(this.ctx, this.sprites, rank, 110, y, "yellow", 1.5);
      drawArcadeText(this.ctx, this.sprites, score, 230, y, "red", 1.5);
    });
    this.drawAttractCentered("CREDIT 00", HEIGHT - 28, "grey", 1);
  }

  private drawAttractStart(): void {
    this.drawAttractCentered("INSERT COIN", 160, "red", 2);
    this.drawAttractCentered("3 FROGS PER PLAYER", 224, "grey", 1.5);
    const showPrompt = Math.floor(this.attractBlink * 2) % 2 === 0;
    if (showPrompt) {
      this.drawAttractCentered(
        this.touchUi ? "TAP START TO PLAY" : "PRESS ENTER TO PLAY",
        292,
        "yellow",
        1.5
      );
    }
    this.drawAttractCentered("CREDIT 00", HEIGHT - 28, "grey", 1);
  }

  private drawAttractCentered(
    text: string,
    y: number,
    colour: "grey" | "yellow" | "red" | "green" | "cyan",
    scale = 2
  ): void {
    const x = (WIDTH - arcadeTextWidth(text, scale)) / 2;
    drawArcadeText(this.ctx, this.sprites, text, x, y, colour, scale);
  }

  private drawCenteredBanner(text: string): void {
    const { ctx } = this;
    const y = (ROW.ROAD_3 + 0.5) * TILE;
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, y - 14, WIDTH, 32);
    ctx.fillStyle = PALETTE.hudYellow;
    ctx.font = `bold 14px "Press Start 2P", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, WIDTH / 2, y + 2);
  }

  private drawDebugOverlay(): void {
    const { ctx } = this;
    const fb = this.frogHitbox();
    ctx.strokeStyle = "rgba(255,0,0,0.9)";
    ctx.lineWidth = 1;
    ctx.strokeRect(fb.x + 0.5, fb.y + 0.5, fb.w - 1, fb.h - 1);
    ctx.strokeStyle = "rgba(0,255,255,0.6)";
    for (const lane of this.allLanes) {
      for (const o of lane.obstacles) {
        const ob = o.bounds();
        ctx.strokeRect(ob.x + 0.5, ob.y + 0.5, ob.w - 1, ob.h - 1);
      }
    }
  }

  private onViewportChange = (): void => {
    this.touchUi = isTouchUiPreferred();
    document.body.classList.toggle("touch-ui", this.touchUi);
    this.fitCanvas();
  };

  private fitCanvas(): void {
    const stage = document.getElementById("stage") ?? this.canvas.parentElement;
    const availW = stage?.clientWidth || window.innerWidth;
    const availH = stage?.clientHeight || window.innerHeight;
    // Reason: phones often can't fit an integer scale once the D-pad reserves
    // vertical space — allow fractional CSS size while keeping internal pixels crisp.
    const raw = Math.min(availW / WIDTH, availH / HEIGHT);
    const scale = raw >= 1 ? Math.max(1, Math.floor(raw)) : Math.max(0.35, raw);
    this.canvas.style.width = `${WIDTH * scale}px`;
    this.canvas.style.height = `${HEIGHT * scale}px`;
  }
}

export interface TouchUiElements {
  enabled: boolean;
  dpad: HTMLElement | null;
  actionBtn: HTMLButtonElement | null;
  muteBtn: HTMLButtonElement | null;
}

export function isTouchUiPreferred(): boolean {
  return (
    window.matchMedia("(hover: none)").matches ||
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(max-width: 820px)").matches
  );
}
