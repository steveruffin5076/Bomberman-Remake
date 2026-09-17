import { describe, it, expect } from 'vitest';
import { Grid, type StageData } from '../src/core/grid';
import { createActor } from '../src/core/actors';
import { applyItemEffect, tryPickupAt, type ItemCaps } from '../src/core/items';

const caps: ItemCaps = { fire: 6, maxBombs: 6, speed: 3 };

const stage: StageData = {
  id: 98,
  cols: 9,
  rows: 7,
  timeLimit: 200,
  lives: 3,
  playerSpawn: { x: 1, y: 1 },
  hardBlocks: 'checkerboard+border',
  softBlocks: [[3, 1]],
  items: [{ type: 'fire', at: [3, 1] }],
  exit: [7, 5],
  enemies: [],
};

describe('items (T4 acceptance criteria)', () => {
  it('reveals the item exactly when its soft block is destroyed', () => {
    const grid = new Grid(stage);
    expect(grid.floorItemAt({ x: 3, y: 1 })).toBeUndefined();
    grid.destroySoft({ x: 3, y: 1 });
    expect(grid.floorItemAt({ x: 3, y: 1 })).toBe('fire');
  });

  it('applies pickup on walk-over and clears the floor tile', () => {
    const grid = new Grid(stage);
    grid.destroySoft({ x: 3, y: 1 });
    const player = createActor('p1', { x: 3, y: 1 }, { fire: 1, maxBombs: 1, speed: 1 });
    const picked = tryPickupAt(grid, { x: 3, y: 1 }, player.stats, caps);
    expect(picked).toBe('fire');
    expect(player.stats.fire).toBe(2);
    expect(grid.floorItemAt({ x: 3, y: 1 })).toBeUndefined();
  });

  it('picking up empty ground does nothing', () => {
    const grid = new Grid(stage);
    const player = createActor('p1', { x: 1, y: 1 }, { fire: 1, maxBombs: 1, speed: 1 });
    const picked = tryPickupAt(grid, { x: 1, y: 1 }, player.stats, caps);
    expect(picked).toBeNull();
    expect(player.stats.fire).toBe(1);
  });

  it('enforces the Fire/Bomb/Speed caps (Fire<=6, Bombs<=6, Speed<=3)', () => {
    const stats = { fire: 6, maxBombs: 6, speed: 3 };
    applyItemEffect(stats, 'fire', caps);
    applyItemEffect(stats, 'bomb', caps);
    applyItemEffect(stats, 'speed', caps);
    expect(stats).toEqual({ fire: 6, maxBombs: 6, speed: 3 });
  });

  it('increments stats observably below the cap', () => {
    const stats = { fire: 1, maxBombs: 1, speed: 1 };
    applyItemEffect(stats, 'fire', caps);
    applyItemEffect(stats, 'bomb', caps);
    applyItemEffect(stats, 'speed', caps);
    expect(stats).toEqual({ fire: 2, maxBombs: 2, speed: 2 });
  });
});
