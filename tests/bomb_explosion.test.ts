import { describe, it, expect } from 'vitest';
import { Grid, type StageData } from '../src/core/grid';
import {
  createBomb,
  canPlaceBomb,
  isBombBlockingFor,
  updateOwnerPresence,
  tickFuses,
  bombsReadyToExplode,
} from '../src/core/bomb';
import { createActor } from '../src/core/actors';
import {
  detonate,
  createActiveExplosion,
  tickActiveExplosions,
  applyLingeringExplosionDamage,
} from '../src/core/explosion';

// A small custom stage for isolated bomb/explosion testing: a mostly-open room
// (no interior pillars) so arm propagation vs hard/soft/empty can be verified cleanly.
const testStage: StageData = {
  id: 99,
  cols: 9,
  rows: 7,
  timeLimit: 200,
  lives: 3,
  playerSpawn: { x: 1, y: 1 },
  hardBlocks: 'checkerboard+border',
  softBlocks: [
    [3, 1], // one tile right of where a bomb will sit at (2,1) with fire=2 -> hit and destroyed, absorbs arm
    [4, 3], // used for enemy-kill / soft-absorb-stops-arm tests elsewhere
  ],
  items: [],
  exit: [7, 5],
  enemies: [],
};

describe('bombs (T3 acceptance criteria)', () => {
  it('fuse counts down and reports readiness at zero', () => {
    const bombs = [createBomb('b1', 'p1', { x: 1, y: 1 }, 2.5, 1)];
    tickFuses(bombs, 1.0);
    expect(bombsReadyToExplode(bombs)).toHaveLength(0);
    expect(bombs[0].fuseRemaining).toBeCloseTo(1.5, 5);
    tickFuses(bombs, 1.5);
    expect(bombsReadyToExplode(bombs)).toHaveLength(1);
  });

  it('enforces the max-simultaneous-bombs limit', () => {
    const bombs = [createBomb('b1', 'p1', { x: 1, y: 1 }, 2.5, 1)];
    expect(canPlaceBomb(bombs, 'p1', 1)).toBe(false);
    expect(canPlaceBomb(bombs, 'p1', 2)).toBe(true);
    expect(canPlaceBomb(bombs, 'p2', 1)).toBe(true); // separate owner, separate budget
  });

  it('lets the owner stand on their own bomb, then blocks re-entry once they leave', () => {
    const bomb = createBomb('b1', 'p1', { x: 1, y: 1 }, 2.5, 1);
    expect(isBombBlockingFor(bomb, 'p1')).toBe(false); // still standing on it
    expect(isBombBlockingFor(bomb, 'enemy1')).toBe(true); // always solid to others

    updateOwnerPresence(bomb, { x: 2, y: 1 }); // owner walks away
    expect(bomb.ownerStillOnTile).toBe(false);
    expect(isBombBlockingFor(bomb, 'p1')).toBe(true); // now solid to owner too

    updateOwnerPresence(bomb, { x: 1, y: 1 }); // owner returns to the tile
    expect(bomb.ownerStillOnTile).toBe(false); // latch stays off
    expect(isBombBlockingFor(bomb, 'p1')).toBe(true);
  });
});

describe('explosions (T3 acceptance criteria)', () => {
  it('propagates through empty tiles, stops at hard blocks, absorbs+destroys soft blocks', () => {
    const grid = new Grid(testStage);
    // bomb at (1,1) firing right with range 4 should stop at the soft block (3,1) and absorb it,
    // never reaching beyond it even though fire range would otherwise allow further travel.
    const bomb = createBomb('b1', 'p1', { x: 1, y: 1 }, 0, 4);
    const bombs = new Map([[bomb.id, bomb]]);
    const result = detonate(['b1'], bombs, grid, [], true);

    expect(grid.terrainAt({ x: 3, y: 1 })).toBe('empty'); // destroyed
    expect(result.destroyedSoft).toContainEqual({ x: 3, y: 1 });
    // arm must not have propagated past the destroyed soft block
    expect(result.explosionTiles).not.toContainEqual({ x: 4, y: 1 });
    expect(result.explosionTiles).not.toContainEqual({ x: 5, y: 1 });
    // hard border at x=8 must stop a leftward-irrelevant but let's check up direction hits hard border quickly
    expect(result.explosionTiles).not.toContainEqual({ x: 1, y: 0 }); // y=0 is hard border, arm must not include it
  });

  it('cascades a chain of bombs in one detonation call without recursion overflow', () => {
    const grid = new Grid(testStage);
    // Three bombs in a row on open floor, each within the next one's blast range.
    const b1 = createBomb('b1', 'p1', { x: 1, y: 3 }, 0, 1);
    const b2 = createBomb('b2', 'p1', { x: 2, y: 3 }, 0, 1);
    const b3 = createBomb('b3', 'p1', { x: 3, y: 3 }, 0, 1);
    const bombs = new Map([
      [b1.id, b1],
      [b2.id, b2],
      [b3.id, b3],
    ]);
    const result = detonate(['b1'], bombs, grid, [], true);
    expect(result.chainedBombIds.sort()).toEqual(['b1', 'b2', 'b3']);
    expect(bombs.size).toBe(0); // all consumed
  });

  it('kills the player via friendly fire (own bomb) and enemies caught in the blast', () => {
    const grid = new Grid(testStage);
    const player = createActor('player', { x: 1, y: 1 }, { fire: 2, maxBombs: 1, speed: 1 });
    const enemy = createActor('enemy1', { x: 2, y: 1 }, { fire: 0, maxBombs: 0, speed: 1 });
    const bomb = createBomb('b1', 'player', { x: 1, y: 1 }, 0, 2);
    const bombs = new Map([[bomb.id, bomb]]);
    const result = detonate(['b1'], bombs, grid, [player, enemy], true);

    expect(player.alive).toBe(false);
    expect(enemy.alive).toBe(false);
    expect(result.killedActorIds.sort()).toEqual(['enemy1', 'player']);
  });

  it('destroys a floor item lying in the blast, but not one just revealed by the same blast', () => {
    const grid = new Grid(testStage);
    // pre-place a floor item at (5,1) as if revealed by an earlier explosion
    grid.destroySoft({ x: 3, y: 1 }); // no item here in testStage, just to exercise destroySoft path
    // Manually place a floor item via a stage with an item to get accurate coverage:
    const itemStage: StageData = {
      ...testStage,
      softBlocks: [...testStage.softBlocks, [3, 1]],
      items: [{ type: 'fire', at: [3, 1] }],
    };
    const grid2 = new Grid(itemStage);
    grid2.destroySoft({ x: 3, y: 1 }); // reveal fire item onto the floor (simulating an earlier hit)
    expect(grid2.floorItemAt({ x: 3, y: 1 })).toBe('fire');

    const bomb = createBomb('b1', 'p1', { x: 1, y: 1 }, 0, 4);
    const bombs = new Map([[bomb.id, bomb]]);
    const result = detonate(['b1'], bombs, grid2, [], true);
    expect(result.destroyedFloorItems).toContainEqual({ x: 3, y: 1 });
    expect(grid2.floorItemAt({ x: 3, y: 1 })).toBeUndefined();
  });

  it('has a finite lingering lifetime and kills actors who walk into it before it expires', () => {
    const active = createActiveExplosion([{ x: 2, y: 2 }], 0.5);
    const list = [active];
    const walkerIntoBlast = createActor('walker', { x: 2, y: 2 }, { fire: 0, maxBombs: 0, speed: 1 });

    const killed = applyLingeringExplosionDamage(list, [walkerIntoBlast]);
    expect(killed).toEqual(['walker']);
    expect(walkerIntoBlast.alive).toBe(false);

    const stillThere = tickActiveExplosions(list, 0.4);
    expect(stillThere.length).toBe(1);
    const expired = tickActiveExplosions(list, 0.2); // total 0.6s > 0.5s lifetime
    expect(expired.length).toBe(0);
  });
});
