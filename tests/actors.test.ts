import { describe, it, expect } from 'vitest';
import {
  createActor,
  tickMovement,
  resolveInputDirection,
  type InputState,
} from '../src/core/actors';
import type { Pos } from '../src/core/grid';

const SPEED = 4; // tiles/sec, arbitrary for test purposes
const DT = 1 / 60;

function blockedSet(blocked: Pos[]): (p: Pos) => boolean {
  const keys = new Set(blocked.map((p) => `${p.x},${p.y}`));
  return (p: Pos) => keys.has(`${p.x},${p.y}`);
}

describe('actor movement (T2 acceptance criteria)', () => {
  it('never enters a blocked (hard/soft) cell', () => {
    const actor = createActor('p1', { x: 1, y: 1 }, { fire: 1, maxBombs: 1, speed: 1 });
    const isBlocked = blockedSet([{ x: 2, y: 1 }]);
    // drive toward the blocked tile for a full second — far more than enough distance
    for (let i = 0; i < 120; i++) {
      tickMovement(actor, 'right', isBlocked, SPEED, DT);
    }
    expect(actor.x).toBeLessThan(2);
    expect(isBlocked({ x: Math.round(actor.x), y: Math.round(actor.y) })).toBe(false);
  });

  it('reaches an open target tile exactly (no drift/overshoot)', () => {
    const actor = createActor('p1', { x: 1, y: 1 }, { fire: 1, maxBombs: 1, speed: 1 });
    const isBlocked = () => false;
    // exactly enough ticks to cover 1 tile at SPEED tiles/sec, then stop requesting movement
    const ticksToTile = Math.ceil(1 / (SPEED * DT));
    for (let i = 0; i < ticksToTile; i++) {
      tickMovement(actor, 'right', isBlocked, SPEED, DT);
    }
    expect(actor.x).toBe(2);
    expect(actor.y).toBe(1);
  });

  it('only allows turning when aligned with the perpendicular axis (lane snap at intersections)', () => {
    const actor = createActor('p1', { x: 1, y: 1 }, { fire: 1, maxBombs: 1, speed: 1 });
    const isBlocked = () => false;
    // move partway along x — not aligned on x yet relative to a *new* turn target
    tickMovement(actor, 'right', isBlocked, SPEED, DT);
    const midX = actor.x;
    expect(midX).toBeGreaterThan(1);
    expect(midX).toBeLessThan(2);

    // attempt to turn 'down' mid-tile: perpendicular axis for 'down' is x, which is NOT aligned
    tickMovement(actor, 'down', isBlocked, SPEED, DT);
    expect(actor.dir).toBe('right'); // turn rejected, kept moving right
    expect(actor.y).toBe(1); // did not move vertically

    // finish reaching the next tile center (x aligned), then turning down succeeds
    for (let i = 0; i < 60; i++) {
      tickMovement(actor, 'down', isBlocked, SPEED, DT);
    }
    expect(actor.x).toBe(2);
    expect(actor.dir).toBe('down');
    expect(actor.y).toBeGreaterThan(1);
  });

  it('resolves simultaneous input to exactly one direction, never diagonal', () => {
    const input: InputState = { up: true, down: false, left: true, right: false };
    const dir = resolveInputDirection(input);
    expect(['up', 'left']).toContain(dir);
    expect(dir).not.toBeNull();
    // exactly one of the two axes, never both simultaneously represented
  });

  it('resolveInputDirection returns null when nothing is pressed', () => {
    expect(resolveInputDirection({ up: false, down: false, left: false, right: false })).toBeNull();
  });

  it('stops immediately when direction is blocked at rest', () => {
    const actor = createActor('p1', { x: 1, y: 1 }, { fire: 1, maxBombs: 1, speed: 1 });
    const isBlocked = blockedSet([{ x: 1, y: 0 }]);
    tickMovement(actor, 'up', isBlocked, SPEED, DT);
    expect(actor.x).toBe(1);
    expect(actor.y).toBe(1);
    expect(actor.dir).toBeNull();
  });
});
