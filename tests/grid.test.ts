import { describe, it, expect } from 'vitest';
import { Grid, type StageData, posKey } from '../src/core/grid';
import stage1 from '../src/data/stages/stage1.json';

const stage = stage1 as StageData;

describe('grid / stage1 validation (T1 acceptance criteria)', () => {
  it('has odd dimensions', () => {
    expect(stage.cols % 2).toBe(1);
    expect(stage.rows % 2).toBe(1);
  });

  it('has a complete hard-block border', () => {
    const grid = new Grid(stage);
    for (let x = 0; x < stage.cols; x++) {
      expect(grid.terrainAt({ x, y: 0 })).toBe('hard');
      expect(grid.terrainAt({ x, y: stage.rows - 1 })).toBe('hard');
    }
    for (let y = 0; y < stage.rows; y++) {
      expect(grid.terrainAt({ x: 0, y })).toBe('hard');
      expect(grid.terrainAt({ x: stage.cols - 1, y })).toBe('hard');
    }
  });

  it('has interior pillars on every even/even coordinate', () => {
    const grid = new Grid(stage);
    for (let y = 2; y < stage.rows - 1; y += 2) {
      for (let x = 2; x < stage.cols - 1; x += 2) {
        expect(grid.terrainAt({ x, y })).toBe('hard');
      }
    }
  });

  it('reaches every non-hard tile from spawn, assuming soft blocks are destructible', () => {
    const grid = new Grid(stage);
    const spawn = { x: stage.playerSpawn.x, y: stage.playerSpawn.y };
    const reached = grid.reachableFrom(spawn);
    for (let y = 0; y < stage.rows; y++) {
      for (let x = 0; x < stage.cols; x++) {
        if (grid.terrainAt({ x, y }) === 'hard') continue;
        expect(reached.has(posKey({ x, y }))).toBe(true);
      }
    }
  });

  it('has exactly one exit', () => {
    expect(Array.isArray(stage.exit)).toBe(true);
    expect(stage.exit.length).toBe(2);
  });

  it('does not place the exit inside the safe-spawn zone', () => {
    const spawn = stage.playerSpawn;
    const safeZone = new Set([
      posKey(spawn),
      posKey({ x: spawn.x + 1, y: spawn.y }),
      posKey({ x: spawn.x, y: spawn.y + 1 }),
    ]);
    expect(safeZone.has(posKey({ x: stage.exit[0], y: stage.exit[1] }))).toBe(false);
  });

  it('hides the exit under a soft block', () => {
    const grid = new Grid(stage);
    const exitPos = { x: stage.exit[0], y: stage.exit[1] };
    expect(grid.terrainAt(exitPos)).toBe('soft');
    expect(grid.hiddenAt(exitPos)).toBe('exit');
  });

  it('places every item under a soft block', () => {
    const grid = new Grid(stage);
    for (const item of stage.items) {
      const pos = { x: item.at[0], y: item.at[1] };
      expect(grid.terrainAt(pos)).toBe('soft');
      expect(grid.hiddenAt(pos)).toBe(item.type);
    }
  });

  it('keeps the safe-spawn zone free of soft blocks, items, enemies and the exit', () => {
    const grid = new Grid(stage);
    const spawn = stage.playerSpawn;
    const safeZone = [
      { x: spawn.x, y: spawn.y },
      { x: spawn.x + 1, y: spawn.y },
      { x: spawn.x, y: spawn.y + 1 },
    ];
    for (const pos of safeZone) {
      expect(grid.terrainAt(pos)).toBe('empty');
    }
    const safeKeys = new Set(safeZone.map(posKey));
    for (const enemy of stage.enemies) {
      expect(safeKeys.has(posKey({ x: enemy.at[0], y: enemy.at[1] }))).toBe(false);
    }
    expect(safeKeys.has(posKey({ x: stage.exit[0], y: stage.exit[1] }))).toBe(false);
  });

  it('destroySoft reveals the item beneath and clears terrain', () => {
    const grid = new Grid(stage);
    const item = stage.items[0];
    const pos = { x: item.at[0], y: item.at[1] };
    const result = grid.destroySoft(pos);
    expect(grid.terrainAt(pos)).toBe('empty');
    expect(result.revealedItem).toBe(item.type);
    expect(grid.floorItemAt(pos)).toBe(item.type);
  });

  it('destroySoft over the exit reveals the exit and marks it revealed', () => {
    const grid = new Grid(stage);
    const exitPos = { x: stage.exit[0], y: stage.exit[1] };
    const result = grid.destroySoft(exitPos);
    expect(result.revealedExit).toBe(true);
    expect(grid.exitRevealed).toBe(true);
    expect(grid.terrainAt(exitPos)).toBe('empty');
  });

  it('isWalkable rejects hard and soft cells, accepts empty cells', () => {
    const grid = new Grid(stage);
    expect(grid.isWalkable({ x: 0, y: 0 })).toBe(false); // hard border
    expect(grid.isWalkable({ x: stage.items[0].at[0], y: stage.items[0].at[1] })).toBe(false); // soft
    expect(grid.isWalkable({ x: stage.playerSpawn.x, y: stage.playerSpawn.y })).toBe(true);
  });
});
