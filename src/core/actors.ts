// Player/enemy actor state and lane-snapped movement. No Phaser/DOM imports.
import type { Pos } from './grid';

export type Direction = 'up' | 'down' | 'left' | 'right';

export const DIR_VECTORS: Record<Direction, Pos> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/**
 * Position/movement tolerance: how close to a tile center counts as "aligned" for turning.
 * Actors snap to an exact integer when they reach a tile center (see tickMovement), so this
 * only needs to absorb floating-point error — turning genuinely requires reaching the
 * intersection, matching the classic "snap when turning at intersections" feel.
 */
const ALIGN_EPSILON = 1e-6;

export interface ActorStats {
  fire: number;
  maxBombs: number;
  speed: number; // stat step (1..speedCap), converted to tiles/sec by config
}

export interface Actor {
  id: string;
  x: number; // tile-space, continuous; integer = resting at a tile center
  y: number;
  dir: Direction | null;
  alive: boolean;
  stats: ActorStats;
}

export function createActor(id: string, spawn: Pos, stats: ActorStats): Actor {
  return { id, x: spawn.x, y: spawn.y, dir: null, alive: true, stats };
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

const PRIORITY: Direction[] = ['up', 'down', 'left', 'right'];

/** Collapses simultaneous key state into at most one direction per tick (no diagonal movement). */
export function resolveInputDirection(input: InputState): Direction | null {
  for (const dir of PRIORITY) {
    if (input[dir]) return dir;
  }
  return null;
}

function tileCenter(p: { x: number; y: number }): Pos {
  return { x: Math.round(p.x), y: Math.round(p.y) };
}

function isAligned(coord: number): boolean {
  return Math.abs(coord - Math.round(coord)) < ALIGN_EPSILON;
}

function addDir(p: Pos, dir: Direction): Pos {
  const v = DIR_VECTORS[dir];
  return { x: p.x + v.x, y: p.y + v.y };
}

function axisOf(dir: Direction): 'x' | 'y' {
  return dir === 'left' || dir === 'right' ? 'x' : 'y';
}

/**
 * Advances an actor's continuous position by one fixed tick.
 * `isBlocked` decides whether a tile may be entered (grid terrain + any dynamic
 * obstacles like bombs); actors.ts stays ignorant of those concerns.
 */
export function tickMovement(
  actor: Actor,
  desiredDir: Direction | null,
  isBlocked: (tile: Pos) => boolean,
  speedTilesPerSecond: number,
  dt: number,
): void {
  if (!actor.alive) return;

  if (desiredDir && desiredDir !== actor.dir) {
    const perpAxis = axisOf(desiredDir) === 'x' ? 'y' : 'x';
    if (isAligned(actor[perpAxis])) {
      const base = tileCenter(actor);
      const target = addDir(base, desiredDir);
      if (!isBlocked(target)) {
        actor[perpAxis] = Math.round(actor[perpAxis]);
        actor.dir = desiredDir;
      }
      // else: rejected turn — keep moving in the current direction, if any.
    }
  } else if (desiredDir === null && isAligned(actor.x) && isAligned(actor.y)) {
    actor.dir = null;
  }

  if (!actor.dir) return;

  const dv = DIR_VECTORS[actor.dir];
  // Directional floor/ceil (not Math.round) avoids ambiguity once the actor is more
  // than halfway across a tile: rounding would flip the perceived "current tile" early
  // and miscompute the target one tile too far.
  let targetTile: Pos;
  switch (actor.dir) {
    case 'right':
      targetTile = { x: Math.floor(actor.x) + 1, y: Math.round(actor.y) };
      break;
    case 'left':
      targetTile = { x: Math.ceil(actor.x) - 1, y: Math.round(actor.y) };
      break;
    case 'down':
      targetTile = { x: Math.round(actor.x), y: Math.floor(actor.y) + 1 };
      break;
    case 'up':
      targetTile = { x: Math.round(actor.x), y: Math.ceil(actor.y) - 1 };
      break;
  }

  if (isBlocked(targetTile)) {
    // Snap back to the tile center we're leaving from; cannot proceed further.
    actor.x = targetTile.x - dv.x;
    actor.y = targetTile.y - dv.y;
    actor.dir = null;
    return;
  }

  const distToTargetCenter = Math.hypot(targetTile.x - actor.x, targetTile.y - actor.y);
  const step = speedTilesPerSecond * dt;
  if (step + 1e-9 >= distToTargetCenter) {
    actor.x = targetTile.x;
    actor.y = targetTile.y;
  } else {
    actor.x += dv.x * step;
    actor.y += dv.y * step;
  }
}

export function tilePos(actor: Actor): Pos {
  return tileCenter(actor);
}

export function actorsOverlap(a: Actor, b: Pos, radius = 0.5): boolean {
  return Math.abs(a.x - b.x) < radius && Math.abs(a.y - b.y) < radius;
}
