// Cross-shaped explosion propagation, chain reactions and hit resolution.
// No Phaser/DOM imports.
import { Grid, posKey, samePos, type ItemType, type Pos } from './grid';
import type { Bomb } from './bomb';
import type { Actor } from './actors';
import { tilePos } from './actors';

const DIRS: Pos[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

export interface DetonationResult {
  destroyedSoft: Pos[];
  revealedItems: { pos: Pos; type: ItemType }[];
  revealedExit: boolean;
  exitDestroyed: boolean;
  explosionTiles: Pos[];
  chainedBombIds: string[];
  destroyedFloorItems: Pos[];
  killedActorIds: string[];
}

/**
 * Resolves detonation of one or more bombs, cascading into any bombs their blast
 * arms touch (same-tick chain reaction). Iterative/queue-based so a chain of many
 * bombs never risks a call-stack overflow.
 */
export function detonate(
  initialBombIds: string[],
  bombsById: Map<string, Bomb>,
  grid: Grid,
  actors: Actor[],
  allEnemiesDead: boolean,
): DetonationResult {
  const result: DetonationResult = {
    destroyedSoft: [],
    revealedItems: [],
    revealedExit: false,
    exitDestroyed: false,
    explosionTiles: [],
    chainedBombIds: [],
    destroyedFloorItems: [],
    killedActorIds: [],
  };

  const processed = new Set<string>();
  const queued = new Set<string>(initialBombIds);
  const queue: string[] = [...initialBombIds];

  const maybeDestroyExitAt = (pos: Pos): void => {
    if (!allEnemiesDead && grid.exitRevealed && !grid.exitDestroyed && samePos(pos, grid.exitPos)) {
      grid.destroyExit();
      result.exitDestroyed = true;
    }
  };

  while (queue.length > 0) {
    const bombId = queue.shift()!;
    if (processed.has(bombId)) continue;
    const bomb = bombsById.get(bombId);
    if (!bomb) continue;

    processed.add(bombId);
    result.chainedBombIds.push(bombId);
    bombsById.delete(bombId);
    result.explosionTiles.push(bomb.pos);

    for (const dir of DIRS) {
      for (let i = 1; i <= bomb.fireRange; i++) {
        const pos: Pos = { x: bomb.pos.x + dir.x * i, y: bomb.pos.y + dir.y * i };
        if (!grid.inBounds(pos) || grid.terrainAt(pos) === 'hard') break;

        result.explosionTiles.push(pos);
        const terrain = grid.terrainAt(pos);

        if (terrain === 'soft') {
          const { revealedItem, revealedExit } = grid.destroySoft(pos);
          result.destroyedSoft.push(pos);
          if (revealedItem) result.revealedItems.push({ pos, type: revealedItem });
          if (revealedExit) {
            result.revealedExit = true;
            if (!allEnemiesDead) {
              grid.destroyExit();
              result.exitDestroyed = true;
            }
          }
          break; // soft block absorbs the arm
        }

        // empty tile: may hold a lingering floor item, the revealed exit, or another bomb
        maybeDestroyExitAt(pos);

        const existingItem = grid.floorItemAt(pos);
        if (existingItem) {
          grid.clearFloorItem(pos);
          result.destroyedFloorItems.push(pos);
        }

        const key = posKey(pos);
        for (const other of bombsById.values()) {
          if (posKey(other.pos) === key && !processed.has(other.id) && !queued.has(other.id)) {
            queued.add(other.id);
            queue.push(other.id);
          }
        }
      }
    }
  }

  const hitSet = new Set(result.explosionTiles.map(posKey));
  for (const actor of actors) {
    if (!actor.alive) continue;
    if (hitSet.has(posKey(tilePos(actor)))) {
      actor.alive = false;
      result.killedActorIds.push(actor.id);
    }
  }

  return result;
}

export interface ActiveExplosion {
  tiles: Pos[];
  remaining: number;
}

export function createActiveExplosion(tiles: Pos[], lifetimeSeconds: number): ActiveExplosion {
  return { tiles: tiles.map((p) => ({ ...p })), remaining: lifetimeSeconds };
}

export function tickActiveExplosions(list: ActiveExplosion[], dt: number): ActiveExplosion[] {
  for (const e of list) e.remaining -= dt;
  return list.filter((e) => e.remaining > 0);
}

export function isTileInActiveExplosion(list: ActiveExplosion[], pos: Pos): boolean {
  return list.some((e) => e.tiles.some((t) => samePos(t, pos)));
}

/** Kills any living actor currently standing on a lingering explosion tile. Returns killed ids. */
export function applyLingeringExplosionDamage(list: ActiveExplosion[], actors: Actor[]): string[] {
  const killed: string[] = [];
  if (list.length === 0) return killed;
  for (const actor of actors) {
    if (!actor.alive) continue;
    if (isTileInActiveExplosion(list, tilePos(actor))) {
      actor.alive = false;
      killed.push(actor.id);
    }
  }
  return killed;
}
