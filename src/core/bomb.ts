// Bomb placement and fuse scheduling. No Phaser/DOM imports.
import type { Pos } from './grid';

export interface Bomb {
  id: string;
  ownerId: string;
  pos: Pos;
  fuseRemaining: number;
  fireRange: number; // owner's Fire stat captured at placement time
  /** True until the owner steps off the bomb's tile; while true the bomb is not
   * solid to its own owner (classic "no walking back through" rule applies after). */
  ownerStillOnTile: boolean;
}

export function createBomb(id: string, ownerId: string, pos: Pos, fuseSeconds: number, fireRange: number): Bomb {
  return {
    id,
    ownerId,
    pos: { x: pos.x, y: pos.y },
    fuseRemaining: fuseSeconds,
    fireRange,
    ownerStillOnTile: true,
  };
}

export function activeBombCountFor(bombs: Bomb[], ownerId: string): number {
  return bombs.filter((b) => b.ownerId === ownerId).length;
}

export function canPlaceBomb(bombs: Bomb[], ownerId: string, maxBombs: number): boolean {
  return activeBombCountFor(bombs, ownerId) < maxBombs;
}

export function hasBombAt(bombs: Bomb[], pos: Pos): boolean {
  return bombs.some((b) => b.pos.x === pos.x && b.pos.y === pos.y);
}

/** A bomb blocks movement for everyone except its still-present owner. */
export function isBombBlockingFor(bomb: Bomb, actorId: string): boolean {
  if (bomb.ownerId === actorId && bomb.ownerStillOnTile) return false;
  return true;
}

/** Call once per tick per bomb with its owner's current tile; latches ownerStillOnTile off permanently once left. */
export function updateOwnerPresence(bomb: Bomb, ownerTile: Pos): void {
  if (bomb.ownerStillOnTile && (ownerTile.x !== bomb.pos.x || ownerTile.y !== bomb.pos.y)) {
    bomb.ownerStillOnTile = false;
  }
}

export function tickFuses(bombs: Bomb[], dt: number): void {
  for (const b of bombs) {
    b.fuseRemaining -= dt;
  }
}

export function bombsReadyToExplode(bombs: Bomb[]): Bomb[] {
  return bombs.filter((b) => b.fuseRemaining <= 0);
}
