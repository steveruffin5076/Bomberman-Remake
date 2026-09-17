import Phaser from 'phaser';
import { CONFIG } from '../config';
import stage1 from '../data/stages/stage1.json';
import { samePos, type StageData } from '../core/grid';
import { activeBombCountFor } from '../core/bomb';
import {
  createStageState,
  tickStage,
  restartStage,
  type StageState,
  type StageConfig,
  type StageInput,
  type FailReason,
} from '../core/stage';

const T = CONFIG.tileSize;

const STAGE_CONFIG: StageConfig = {
  bombFuseSeconds: CONFIG.bombFuseSeconds,
  explosionLifetimeSeconds: CONFIG.explosionLifetimeSeconds,
  defaultFire: CONFIG.defaultFire,
  defaultMaxBombs: CONFIG.defaultMaxBombs,
  defaultSpeed: CONFIG.defaultSpeed,
  fireCap: CONFIG.fireCap,
  maxBombsCap: CONFIG.maxBombsCap,
  speedCap: CONFIG.speedCap,
  speedTilesPerSecondBase: CONFIG.speedTilesPerSecondBase,
  speedTilesPerSecondStep: CONFIG.speedTilesPerSecondStep,
  enemySpeedTilesPerSecond: CONFIG.enemySpeedTilesPerSecond,
};

const FAIL_MESSAGES: Record<Exclude<FailReason, null>, string> = {
  timeout: 'Time ran out',
  'door-destroyed': 'The exit was destroyed',
  'lives-exhausted': 'Out of lives',
};

export default class GameScene extends Phaser.Scene {
  private state!: StageState;
  private accumulator = 0;
  private readonly fixedStep = 1 / CONFIG.simTickHz;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wKey!: Phaser.Input.Keyboard.Key;
  private aKey!: Phaser.Input.Keyboard.Key;
  private sKey!: Phaser.Input.Keyboard.Key;
  private dKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private zKey!: Phaser.Input.Keyboard.Key;
  private rKey!: Phaser.Input.Keyboard.Key;
  private pKey!: Phaser.Input.Keyboard.Key;

  private tileSprites: Phaser.GameObjects.Image[][] = [];
  private itemSprites: (Phaser.GameObjects.Image | null)[][] = [];
  private bombSprites = new Map<string, Phaser.GameObjects.Image>();
  private explosionImages: Phaser.GameObjects.Image[] = [];
  private playerSprite!: Phaser.GameObjects.Image;
  private enemySprites = new Map<string, Phaser.GameObjects.Image>();
  private walkFrameTimer = 0;
  private walkFrameToggle = false;

  private hudText!: Phaser.GameObjects.Text;
  private overlayBg!: Phaser.GameObjects.Rectangle;
  private overlayTitle!: Phaser.GameObjects.Text;
  private overlaySubtitle!: Phaser.GameObjects.Text;

  constructor() {
    super('Game');
  }

  create(): void {
    this.state = createStageState(stage1 as StageData, STAGE_CONFIG, Date.now() | 0);

    const keyboard = this.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.wKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.aKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.sKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.dKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.zKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.rKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.pKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

    this.buildTileLayer();
    this.playerSprite = this.add.image(0, 0, 'player_a').setDepth(4);
    this.buildHUD();
    this.buildOverlay();
  }

  private buildTileLayer(): void {
    const { cols, rows } = this.state.stageData;
    for (let y = 0; y < rows; y++) {
      this.tileSprites[y] = [];
      this.itemSprites[y] = [];
      for (let x = 0; x < cols; x++) {
        this.tileSprites[y][x] = this.add.image(x * T + T / 2, y * T + T / 2, 'floor').setDepth(0);
        this.itemSprites[y][x] = null;
      }
    }
  }

  private buildHUD(): void {
    this.hudText = this.add
      .text(4, 4, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 4, y: 2 },
      })
      .setDepth(10)
      .setScrollFactor(0);
  }

  private buildOverlay(): void {
    const w = this.state.stageData.cols * T;
    const h = this.state.stageData.rows * T;
    this.overlayBg = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7).setDepth(20).setVisible(false);
    this.overlayTitle = this.add
      .text(w / 2, h / 2 - 16, '', { fontFamily: 'monospace', fontSize: '28px', color: '#ffffff' })
      .setOrigin(0.5)
      .setDepth(21)
      .setVisible(false);
    this.overlaySubtitle = this.add
      .text(w / 2, h / 2 + 20, '', { fontFamily: 'monospace', fontSize: '14px', color: '#dddddd' })
      .setOrigin(0.5)
      .setDepth(21)
      .setVisible(false);
  }

  update(_time: number, deltaMs: number): void {
    const dt = deltaMs / 1000;

    if (Phaser.Input.Keyboard.JustDown(this.pKey) && this.state.phase === 'playing') {
      this.state.paused = !this.state.paused;
    }
    if (Phaser.Input.Keyboard.JustDown(this.rKey) && (this.state.phase === 'win' || this.state.phase === 'fail')) {
      restartStage(this.state);
    }

    const placeBombPressed = Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.zKey);
    let bombConsumed = false;

    if (!this.state.paused && this.state.phase === 'playing') {
      this.accumulator += dt;
      while (this.accumulator >= this.fixedStep) {
        const input: StageInput = {
          up: this.cursors.up!.isDown || this.wKey.isDown,
          down: this.cursors.down!.isDown || this.sKey.isDown,
          left: this.cursors.left!.isDown || this.aKey.isDown,
          right: this.cursors.right!.isDown || this.dKey.isDown,
          placeBomb: placeBombPressed && !bombConsumed,
        };
        bombConsumed = bombConsumed || placeBombPressed;
        tickStage(this.state, input, this.fixedStep);
        this.accumulator -= this.fixedStep;
      }
    }

    this.redrawTiles();
    this.redrawBombs();
    this.redrawExplosions();
    this.redrawActors(dt);
    this.updateHUD();
    this.updateOverlay();
  }

  private redrawTiles(): void {
    const grid = this.state.grid;
    for (let y = 0; y < grid.rows; y++) {
      for (let x = 0; x < grid.cols; x++) {
        const pos = { x, y };
        const terrain = grid.terrainAt(pos);
        let key = 'floor';
        if (terrain === 'hard') key = 'hard';
        else if (terrain === 'soft') key = 'soft';
        else if (grid.exitRevealed && !grid.exitDestroyed && samePos(pos, grid.exitPos)) key = 'exit';
        this.tileSprites[y][x].setTexture(key);

        const item = grid.floorItemAt(pos);
        const existing = this.itemSprites[y][x];
        if (item) {
          const texKey = `item_${item}`;
          if (existing) {
            existing.setTexture(texKey).setVisible(true);
          } else {
            this.itemSprites[y][x] = this.add.image(x * T + T / 2, y * T + T / 2, texKey).setDepth(1);
          }
        } else if (existing) {
          existing.setVisible(false);
        }
      }
    }
  }

  private redrawBombs(): void {
    const seen = new Set<string>();
    for (const bomb of this.state.bombs.values()) {
      seen.add(bomb.id);
      const pulsing = bomb.fuseRemaining <= CONFIG.bombPulseWarningSeconds;
      let img = this.bombSprites.get(bomb.id);
      if (!img) {
        img = this.add.image(bomb.pos.x * T + T / 2, bomb.pos.y * T + T / 2, 'bomb_idle').setDepth(2);
        this.bombSprites.set(bomb.id, img);
      }
      img.setTexture(pulsing ? 'bomb_pulse' : 'bomb_idle');
    }
    for (const [id, img] of this.bombSprites) {
      if (!seen.has(id)) {
        img.destroy();
        this.bombSprites.delete(id);
      }
    }
  }

  private redrawExplosions(): void {
    for (const img of this.explosionImages) img.destroy();
    this.explosionImages = [];
    for (const exp of this.state.activeExplosions) {
      for (const t of exp.tiles) {
        this.explosionImages.push(this.add.image(t.x * T + T / 2, t.y * T + T / 2, 'explosion').setDepth(3));
      }
    }
  }

  private redrawActors(dt: number): void {
    this.walkFrameTimer += dt;
    if (this.walkFrameTimer > 0.2) {
      this.walkFrameTimer = 0;
      this.walkFrameToggle = !this.walkFrameToggle;
    }

    const p = this.state.player;
    this.playerSprite.setVisible(p.alive);
    if (p.alive) {
      this.playerSprite.setPosition(p.x * T + T / 2, p.y * T + T / 2);
      this.playerSprite.setTexture(p.dir && this.walkFrameToggle ? 'player_b' : 'player_a');
    }

    const seen = new Set<string>();
    for (const e of this.state.enemies) {
      seen.add(e.id);
      let img = this.enemySprites.get(e.id);
      const baseKey = e.kind === 'tracker' ? 'tracker' : 'wanderer';
      if (!img) {
        img = this.add.image(0, 0, `${baseKey}_a`).setDepth(4);
        this.enemySprites.set(e.id, img);
      }
      img.setVisible(e.alive);
      if (e.alive) {
        img.setPosition(e.x * T + T / 2, e.y * T + T / 2);
        img.setTexture(`${baseKey}_${this.walkFrameToggle ? 'b' : 'a'}`);
      }
    }
    for (const [id, img] of this.enemySprites) {
      if (!seen.has(id)) {
        img.destroy();
        this.enemySprites.delete(id);
      }
    }
  }

  private updateHUD(): void {
    const s = this.state;
    const bombsUsed = activeBombCountFor([...s.bombs.values()], s.player.id);
    const bombsAvailable = Math.max(0, s.player.stats.maxBombs - bombsUsed);
    const enemiesLeft = s.enemies.filter((e) => e.alive).length;
    this.hudText.setText(
      `Time: ${Math.ceil(s.timeRemaining)}   Bombs: ${bombsAvailable}/${s.player.stats.maxBombs}   Lives: ${s.lives}   Enemies: ${enemiesLeft}`,
    );
  }

  private updateOverlay(): void {
    const s = this.state;
    let visible = true;
    let title = '';
    let subtitle = '';
    if (s.paused) {
      title = 'PAUSED';
      subtitle = 'Press P to resume';
    } else if (s.phase === 'win') {
      title = 'STAGE CLEAR';
      subtitle = 'Press R to play again';
    } else if (s.phase === 'fail') {
      title = 'STAGE FAILED';
      subtitle = `${s.failReason ? FAIL_MESSAGES[s.failReason] : ''} — Press R to retry`;
    } else {
      visible = false;
    }

    this.overlayBg.setVisible(visible);
    this.overlayTitle.setVisible(visible).setText(title);
    this.overlaySubtitle.setVisible(visible).setText(subtitle);
  }
}
