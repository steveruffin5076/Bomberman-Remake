import { describe, it, expect } from 'vitest';
import type { StageData } from '../src/core/grid';
import { createStageState, tickStage, restartStage, type StageConfig, type StageInput } from '../src/core/stage';
import { createBomb } from '../src/core/bomb';

const testConfig: StageConfig = {
  bombFuseSeconds: 2.5,
  explosionLifetimeSeconds: 0.2,
  defaultFire: 1,
  defaultMaxBombs: 1,
  defaultSpeed: 1,
  fireCap: 6,
  maxBombsCap: 6,
  speedCap: 3,
  speedTilesPerSecondBase: 4,
  speedTilesPerSecondStep: 1,
  enemySpeedTilesPerSecond: 3,
};

function noInput(overrides: Partial<StageInput> = {}): StageInput {
  return { up: false, down: false, left: false, right: false, placeBomb: false, ...overrides };
}

function makeStage(overrides: Partial<StageData> = {}): StageData {
  return {
    id: 1,
    cols: 7,
    rows: 7,
    timeLimit: 200,
    lives: 3,
    playerSpawn: { x: 1, y: 1 },
    hardBlocks: 'checkerboard+border',
    softBlocks: [[2, 1]], // exit hidden right next to spawn
    items: [],
    exit: [2, 1],
    enemies: [{ type: 'wanderer', at: [5, 5] }],
    ...overrides,
  };
}

/** A variant where the exit sits far from spawn, so a bomb dropped at spawn can never touch it —
 * isolates friendly-fire/lives tests from the door-destroyed rule. */
function makeStageExitFar(overrides: Partial<StageData> = {}): StageData {
  return makeStage({ exit: [5, 5], softBlocks: [[5, 5], [2, 1]], ...overrides });
}

/** Injects a bomb directly (bypassing placement rules/timing) so detonation tests are
 * deterministic in a single tick, independent of movement speed or fuse duration. */
function dropReadyBomb(state: ReturnType<typeof createStageState>, ownerId: string, pos: { x: number; y: number }, fire: number): void {
  const bomb = createBomb('b1', ownerId, pos, 999, fire);
  bomb.fuseRemaining = 0;
  state.bombs.set(bomb.id, bomb);
}

const DT = 1 / 60;

describe('stage state machine (T6 acceptance criteria)', () => {
  it('fails with reason "timeout" when the timer runs out', () => {
    const state = createStageState(makeStage({ timeLimit: 0.05 }), testConfig, 1);
    tickStage(state, noInput(), 0.1);
    expect(state.phase).toBe('fail');
    expect(state.failReason).toBe('timeout');
  });

  it('destroys the door and fails if it is hit before all enemies are dead', () => {
    const state = createStageState(makeStage(), testConfig, 1);
    state.player.x = 5;
    state.player.y = 1; // keep the player well outside the blast
    dropReadyBomb(state, 'ghost', { x: 1, y: 1 }, 1); // fire=1 reaches the exit at (2,1)
    tickStage(state, noInput(), DT);
    expect(state.phase).toBe('fail');
    expect(state.failReason).toBe('door-destroyed');
  });

  it('leaves a revealed door usable if it is hit after all enemies are already dead', () => {
    const state = createStageState(makeStage(), testConfig, 1);
    state.enemies[0].alive = false;
    state.player.x = 5;
    state.player.y = 1;
    dropReadyBomb(state, 'ghost', { x: 1, y: 1 }, 1);
    tickStage(state, noInput(), DT);
    expect(state.grid.exitRevealed).toBe(true);
    expect(state.grid.exitDestroyed).toBe(false);
    expect(state.phase).toBe('playing');
  });

  it('does nothing when the player steps on the exit while enemies are still alive', () => {
    const state = createStageState(makeStage(), testConfig, 1);
    state.grid.destroySoft({ x: 2, y: 1 });
    state.player.x = 2;
    state.player.y = 1;
    tickStage(state, noInput(), DT);
    expect(state.phase).toBe('playing'); // no win: an enemy is still alive
  });

  it('wins when the player reaches a revealed, undestroyed exit with no enemies left', () => {
    const state = createStageState(makeStage(), testConfig, 1);
    state.enemies[0].alive = false;
    state.grid.destroySoft({ x: 2, y: 1 });
    state.player.x = 2;
    state.player.y = 1;
    tickStage(state, noInput(), DT);
    expect(state.phase).toBe('win');
  });

  it('on life lost with lives remaining, decrements lives and fully resets stage state', () => {
    const state = createStageState(makeStageExitFar(), testConfig, 1);
    dropReadyBomb(state, state.player.id, { x: 1, y: 1 }, 1); // friendly fire: player still on the bomb tile
    tickStage(state, noInput(), DT);
    expect(state.lives).toBe(2);
    expect(state.phase).toBe('playing');
    // full reset to stage-data defaults:
    expect(state.player.x).toBe(1);
    expect(state.player.y).toBe(1);
    expect(state.player.alive).toBe(true);
    expect(state.bombs.size).toBe(0);
    expect(state.timeRemaining).toBe(state.stageData.timeLimit);
    expect(state.grid.terrainAt({ x: 2, y: 1 })).toBe('soft'); // block the bomb destroyed is restored
  });

  it('fails with reason "lives-exhausted" once lives reach zero', () => {
    const state = createStageState(makeStageExitFar({ lives: 1 }), testConfig, 1);
    dropReadyBomb(state, state.player.id, { x: 1, y: 1 }, 1);
    tickStage(state, noInput(), DT);
    expect(state.phase).toBe('fail');
    expect(state.failReason).toBe('lives-exhausted');
  });

  it('terminal states (win/fail) are sticky: further ticks are no-ops', () => {
    const state = createStageState(makeStage({ timeLimit: 0.05 }), testConfig, 1);
    tickStage(state, noInput(), 0.1);
    expect(state.phase).toBe('fail');
    const timeSnapshot = state.timeRemaining;
    tickStage(state, noInput({ right: true, placeBomb: true }), DT);
    expect(state.phase).toBe('fail');
    expect(state.timeRemaining).toBe(timeSnapshot); // simulation frozen
  });

  it('restartStage restores full lives and stage-data defaults from a terminal state', () => {
    const state = createStageState(makeStageExitFar({ lives: 1 }), testConfig, 1);
    dropReadyBomb(state, state.player.id, { x: 1, y: 1 }, 1);
    tickStage(state, noInput(), DT);
    expect(state.phase).toBe('fail');
    restartStage(state);
    expect(state.phase).toBe('playing');
    expect(state.lives).toBe(state.stageData.lives);
    expect(state.player.alive).toBe(true);
  });
});
