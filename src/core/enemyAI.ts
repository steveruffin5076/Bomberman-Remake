// Wanderer / Tracker decision logic. No Phaser/DOM imports.
import { DIR_VECTORS, type Direction } from './actors';
import type { Pos } from './grid';
import type { Rng } from './rng';

export type EnemyKind = 'wanderer' | 'tracker';

const ALL_DIRS: Direction[] = ['up', 'down', 'left', 'right'];

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

function applyDir(pos: Pos, dir: Direction): Pos {
  const v = DIR_VECTORS[dir];
  return { x: pos.x + v.x, y: pos.y + v.y };
}

function manhattan(a: Pos, b: Pos): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function pickRandom(list: Direction[], rng: Rng): Direction {
  const idx = Math.min(list.length - 1, Math.floor(rng() * list.length));
  return list[idx];
}

/**
 * Chooses the next travel direction for an enemy standing at `pos` (called only when the
 * enemy is aligned at a tile center — i.e. it just arrived at an intersection or dead end).
 * Never reverses unless every other option is blocked (dead end).
 */
export function decideDirection(
  pos: Pos,
  currentDir: Direction | null,
  isOpen: (dir: Direction) => boolean,
  kind: EnemyKind,
  playerPos: Pos | undefined,
  rng: Rng,
): Direction | null {
  const open = ALL_DIRS.filter(isOpen);
  if (open.length === 0) return null; // fully boxed in — should not happen on a valid stage

  const reverse = currentDir ? OPPOSITE[currentDir] : null;
  const nonReverse = open.filter((d) => d !== reverse);
  const pool = nonReverse.length > 0 ? nonReverse : open; // reverse only allowed at a dead end

  if (kind === 'tracker' && playerPos) {
    const scored = pool.map((d) => ({ d, dist: manhattan(applyDir(pos, d), playerPos) }));
    const minDist = Math.min(...scored.map((s) => s.dist));
    const best = scored.filter((s) => s.dist === minDist).map((s) => s.d);
    return pickRandom(best, rng);
  }

  return pickRandom(pool, rng);
}
