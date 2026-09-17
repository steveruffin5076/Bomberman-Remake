// Stage rules: state machine (INTRO -> PLAYING -> WIN | FAIL -> RESTART), timer,
// lives, exit-door rule. Wires grid/actors/bomb/explosion/items/enemyAI together.
// No Phaser/DOM imports.
import { Grid, samePos, type Pos, type StageData } from './grid';
import {
  createActor,
  resolveInputDirection,
  tickMovement,
  tilePos,
  type Actor,
  type ActorStats,
  type Direction,
  type InputState,
} from './actors';
import {
  canPlaceBomb,
  createBomb,
  hasBombAt,
  isBombBlockingFor,
  tickFuses,
  bombsReadyToExplode,
  updateOwnerPresence,
  type Bomb,
} from './bomb';
import {
  detonate,
  createActiveExplosion,
  tickActiveExplosions,
  applyLingeringExplosionDamage,
  type ActiveExplosion,
} from './explosion';
import { tryPickupAt, type ItemCaps } from './items';
import { decideDirection, type EnemyKind } from './enemyAI';
import { createRng, type Rng } from './rng';

export interface StageConfig {
  bombFuseSeconds: number;
  explosionLifetimeSeconds: number;
  defaultFire: number;
  defaultMaxBombs: number;
  defaultSpeed: number;
  fireCap: number;
  maxBombsCap: number;
  speedCap: number;
  speedTilesPerSecondBase: number;
  speedTilesPerSecondStep: number;
  enemySpeedTilesPerSecond: number;
}

export type Phase = 'playing' | 'win' | 'fail';
export type FailReason = 'timeout' | 'door-destroyed' | 'lives-exhausted' | null;

export interface EnemyActor extends Actor {
  kind: EnemyKind;
}

export interface StageState {
  stageData: StageData;
  config: StageConfig;
  grid: Grid;
  player: Actor;
  enemies: EnemyActor[];
  bombs: Map<string, Bomb>;
  activeExplosions: ActiveExplosion[];
  timeRemaining: number;
  lives: number;
  phase: Phase;
  failReason: FailReason;
  paused: boolean;
  rng: Rng;
  bombIdCounter: number;
}

export interface StageInput extends InputState {
  /** One-shot edge-triggered flag: true only on the tick the place-bomb key was pressed. */
  placeBomb: boolean;
}

function itemCaps(config: StageConfig): ItemCaps {
  return { fire: config.fireCap, maxBombs: config.maxBombsCap, speed: config.speedCap };
}

function playerSpeed(stats: ActorStats, config: StageConfig): number {
  return config.speedTilesPerSecondBase + (stats.speed - 1) * config.speedTilesPerSecondStep;
}

function buildActors(stageData: StageData, config: StageConfig): { player: Actor; enemies: EnemyActor[] } {
  const player = createActor('player', stageData.playerSpawn, {
    fire: config.defaultFire,
    maxBombs: config.defaultMaxBombs,
    speed: config.defaultSpeed,
  });
  const enemies: EnemyActor[] = stageData.enemies.map((spec, i) => ({
    ...createActor(`enemy-${i}`, { x: spec.at[0], y: spec.at[1] }, { fire: 0, maxBombs: 0, speed: 1 }),
    kind: spec.type,
  }));
  return { player, enemies };
}

function resetInPlace(state: StageState, lives: number): void {
  state.grid = new Grid(state.stageData);
  const { player, enemies } = buildActors(state.stageData, state.config);
  state.player = player;
  state.enemies = enemies;
  state.bombs = new Map();
  state.activeExplosions = [];
  state.timeRemaining = state.stageData.timeLimit;
  state.lives = lives;
  state.phase = 'playing';
  state.failReason = null;
  state.paused = false;
}

export function createStageState(stageData: StageData, config: StageConfig, seed: number): StageState {
  const { player, enemies } = buildActors(stageData, config);
  return {
    stageData,
    config,
    grid: new Grid(stageData),
    player,
    enemies,
    bombs: new Map(),
    activeExplosions: [],
    timeRemaining: stageData.timeLimit,
    lives: stageData.lives,
    phase: 'playing',
    failReason: null,
    paused: false,
    rng: createRng(seed),
    bombIdCounter: 0,
  };
}

/** Full restart: all lives restored. Used from the win/fail overlay's restart action. */
export function restartStage(state: StageState): void {
  resetInPlace(state, state.stageData.lives);
}

function fail(state: StageState, reason: FailReason): void {
  state.phase = 'fail';
  state.failReason = reason;
}

function isBlockedForActor(state: StageState, actorId: string): (p: Pos) => boolean {
  return (p: Pos) => {
    if (!state.grid.isWalkable(p)) return true;
    for (const bomb of state.bombs.values()) {
      if (samePos(bomb.pos, p) && isBombBlockingFor(bomb, actorId)) return true;
    }
    return false;
  };
}

function allEnemiesDead(state: StageState): boolean {
  return state.enemies.every((e) => !e.alive);
}

function isAlignedTile(actor: Actor): boolean {
  return Number.isInteger(actor.x) && Number.isInteger(actor.y);
}

function tickEnemyAI(state: StageState, enemy: EnemyActor, dt: number): void {
  const isBlocked = isBlockedForActor(state, enemy.id);
  if (isAlignedTile(enemy)) {
    const pos = tilePos(enemy);
    const isOpen = (dir: Direction): boolean => {
      const v = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }[dir];
      return !isBlocked({ x: pos.x + v.x, y: pos.y + v.y });
    };
    const playerPos = state.player.alive ? tilePos(state.player) : undefined;
    enemy.dir = decideDirection(pos, enemy.dir, isOpen, enemy.kind, playerPos, state.rng);
  }
  tickMovement(enemy, enemy.dir, isBlocked, state.config.enemySpeedTilesPerSecond, dt);
}

/**
 * Advances the whole simulation by one fixed tick. No-ops once the stage has
 * reached a terminal phase (win/fail) or while paused — the caller (GameScene)
 * decides when to call `restartStage` in response to player input.
 */
export function tickStage(state: StageState, input: StageInput, dt: number): void {
  if (state.paused || state.phase !== 'playing') return;

  state.timeRemaining -= dt;
  if (state.timeRemaining <= 0) {
    state.timeRemaining = 0;
    fail(state, 'timeout');
    return;
  }

  // --- player movement ---
  const desiredDir = resolveInputDirection(input);
  tickMovement(state.player, desiredDir, isBlockedForActor(state, state.player.id), playerSpeed(state.player.stats, state.config), dt);

  // --- enemy AI + movement ---
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    tickEnemyAI(state, enemy, dt);
  }

  // --- bomb placement ---
  if (input.placeBomb && state.player.alive) {
    const playerTile = tilePos(state.player);
    if (canPlaceBomb([...state.bombs.values()], state.player.id, state.player.stats.maxBombs) && !hasBombAt([...state.bombs.values()], playerTile)) {
      state.bombIdCounter += 1;
      const bomb = createBomb(`bomb-${state.bombIdCounter}`, state.player.id, playerTile, state.config.bombFuseSeconds, state.player.stats.fire);
      state.bombs.set(bomb.id, bomb);
    }
  }

  // --- bomb owner presence + fuses ---
  for (const bomb of state.bombs.values()) {
    if (bomb.ownerId === state.player.id) {
      updateOwnerPresence(bomb, tilePos(state.player));
    }
  }
  tickFuses([...state.bombs.values()], dt);

  // --- detonation (cascades chained bombs) ---
  const ready = bombsReadyToExplode([...state.bombs.values()]);
  if (ready.length > 0) {
    const enemiesDeadBefore = allEnemiesDead(state);
    const allActors: Actor[] = [state.player, ...state.enemies];
    const result = detonate(
      ready.map((b) => b.id),
      state.bombs,
      state.grid,
      allActors,
      enemiesDeadBefore,
    );
    state.activeExplosions.push(createActiveExplosion(result.explosionTiles, state.config.explosionLifetimeSeconds));
    if (result.exitDestroyed) {
      fail(state, 'door-destroyed');
      return;
    }
  }

  // --- lingering explosion hazard + decay ---
  applyLingeringExplosionDamage(state.activeExplosions, [state.player, ...state.enemies]);
  state.activeExplosions = tickActiveExplosions(state.activeExplosions, dt);

  // --- item pickup ---
  if (state.player.alive) {
    tryPickupAt(state.grid, tilePos(state.player), state.player.stats, itemCaps(state.config));
  }

  // --- enemy contact death ---
  if (state.player.alive) {
    const playerTile = tilePos(state.player);
    for (const enemy of state.enemies) {
      if (enemy.alive && samePos(tilePos(enemy), playerTile)) {
        state.player.alive = false;
        break;
      }
    }
  }

  // --- win condition ---
  if (
    state.player.alive &&
    state.grid.exitRevealed &&
    !state.grid.exitDestroyed &&
    allEnemiesDead(state) &&
    samePos(tilePos(state.player), state.grid.exitPos)
  ) {
    state.phase = 'win';
    return;
  }

  // --- life lost ---
  if (!state.player.alive) {
    const remaining = state.lives - 1;
    if (remaining <= 0) {
      state.lives = 0;
      fail(state, 'lives-exhausted');
    } else {
      resetInPlace(state, remaining);
    }
  }
}
