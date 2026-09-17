import { describe, it, expect } from 'vitest';
import { Grid, type StageData } from '../src/core/grid';
import { decideDirection } from '../src/core/enemyAI';
import { createRng } from '../src/core/rng';
import { DIR_VECTORS, type Direction } from '../src/core/actors';

const stage: StageData = {
  id: 97,
  cols: 9,
  rows: 7,
  timeLimit: 200,
  lives: 3,
  playerSpawn: { x: 1, y: 1 },
  hardBlocks: 'checkerboard+border',
  softBlocks: [],
  items: [],
  exit: [7, 5],
  enemies: [],
};

function openFor(grid: Grid, pos: { x: number; y: number }) {
  return (dir: Direction) => {
    const v = DIR_VECTORS[dir];
    return grid.isWalkable({ x: pos.x + v.x, y: pos.y + v.y });
  };
}

describe('enemy AI (T5 acceptance criteria)', () => {
  it('never proposes a direction into a hard/soft cell', () => {
    const grid = new Grid(stage);
    const pos = { x: 1, y: 1 }; // corner-ish open cell surrounded by pillars/border on some sides
    const isOpen = openFor(grid, pos);
    const rng = createRng(42);
    for (let i = 0; i < 50; i++) {
      const dir = decideDirection(pos, null, isOpen, 'wanderer', undefined, rng);
      if (dir) {
        const v = DIR_VECTORS[dir];
        expect(grid.isWalkable({ x: pos.x + v.x, y: pos.y + v.y })).toBe(true);
      }
    }
  });

  it('is deterministic given the same seed', () => {
    const grid = new Grid(stage);
    const pos = { x: 5, y: 3 };
    const isOpen = openFor(grid, pos);
    const rngA = createRng(123);
    const rngB = createRng(123);
    const seqA = Array.from({ length: 20 }, () => decideDirection(pos, null, isOpen, 'wanderer', undefined, rngA));
    const seqB = Array.from({ length: 20 }, () => decideDirection(pos, null, isOpen, 'wanderer', undefined, rngB));
    expect(seqA).toEqual(seqB);
  });

  it('wanderer never reverses unless dead-ended', () => {
    // corridor with only left/right open (typical between two pillars on the same row)
    const isOpen = (dir: Direction) => dir === 'left' || dir === 'right';
    const rng = createRng(7);
    for (let i = 0; i < 50; i++) {
      const dir = decideDirection({ x: 5, y: 3 }, 'right', isOpen, 'wanderer', undefined, rng);
      expect(dir).toBe('right'); // only non-reverse option available
    }
  });

  it('wanderer reverses only at a true dead end', () => {
    const isOpen = (dir: Direction) => dir === 'left'; // only the reverse of 'right' is open
    const rng = createRng(7);
    const dir = decideDirection({ x: 5, y: 3 }, 'right', isOpen, 'wanderer', undefined, rng);
    expect(dir).toBe('left');
  });

  it('tracker is biased toward the direction that reduces distance to the player', () => {
    const isOpen = () => true; // open intersection, all 4 directions available
    const rng = createRng(1);
    const enemyPos = { x: 5, y: 5 };
    const playerPos = { x: 5, y: 1 }; // directly "up" from the enemy
    let upCount = 0;
    for (let i = 0; i < 50; i++) {
      const dir = decideDirection(enemyPos, null, isOpen, 'tracker', playerPos, rng);
      if (dir === 'up') upCount++;
    }
    // 'up' strictly reduces manhattan distance while left/right/down do not, so it must
    // always win (deterministic bias, not just a statistical lean).
    expect(upCount).toBe(50);
  });

  it('wanderer ignores player position entirely (no bias)', () => {
    const isOpen = () => true;
    const rng = createRng(1);
    const enemyPos = { x: 5, y: 5 };
    const playerPos = { x: 5, y: 1 };
    const dirs = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const dir = decideDirection(enemyPos, null, isOpen, 'wanderer', playerPos, rng);
      if (dir) dirs.add(dir);
    }
    expect(dirs.size).toBeGreaterThan(1); // spreads across multiple directions, unlike tracker
  });
});
