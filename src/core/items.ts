// Power-up definitions, stat caps and pickup resolution. No Phaser/DOM imports.
import type { Grid, ItemType, Pos } from './grid';
import type { ActorStats } from './actors';

export interface ItemCaps {
  fire: number;
  maxBombs: number;
  speed: number;
}

export function applyItemEffect(stats: ActorStats, type: ItemType, caps: ItemCaps): void {
  switch (type) {
    case 'fire':
      stats.fire = Math.min(stats.fire + 1, caps.fire);
      break;
    case 'bomb':
      stats.maxBombs = Math.min(stats.maxBombs + 1, caps.maxBombs);
      break;
    case 'speed':
      stats.speed = Math.min(stats.speed + 1, caps.speed);
      break;
  }
}

/** Picks up whatever floor item sits at `pos`, applying its effect and clearing the tile. */
export function tryPickupAt(grid: Grid, pos: Pos, stats: ActorStats, caps: ItemCaps): ItemType | null {
  const item = grid.floorItemAt(pos);
  if (!item) return null;
  applyItemEffect(stats, item, caps);
  grid.clearFloorItem(pos);
  return item;
}
