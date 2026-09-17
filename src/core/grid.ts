// Pure grid/board model. No Phaser/DOM imports (ai/ARCHITECTURE.md technical boundary).

export type Terrain = 'empty' | 'hard' | 'soft';

export type ItemType = 'fire' | 'bomb' | 'speed';

export type HiddenContent = 'none' | ItemType | 'exit';

export interface Pos {
  x: number;
  y: number;
}

export function posKey(p: Pos): string {
  return `${p.x},${p.y}`;
}

export function samePos(a: Pos, b: Pos): boolean {
  return a.x === b.x && a.y === b.y;
}

export interface StageEnemySpec {
  type: 'wanderer' | 'tracker';
  at: [number, number];
}

export interface StageItemSpec {
  type: ItemType;
  at: [number, number];
}

export interface StageData {
  id: number;
  cols: number;
  rows: number;
  timeLimit: number;
  lives: number;
  playerSpawn: { x: number; y: number };
  /** 'checkerboard+border' generates the classic layout; an explicit cols x rows
   * grid of 0/1 may be supplied instead for future stages. */
  hardBlocks: 'checkerboard+border' | number[][];
  softBlocks: [number, number][];
  items: StageItemSpec[];
  exit: [number, number];
  enemies: StageEnemySpec[];
}

export class Grid {
  readonly cols: number;
  readonly rows: number;
  private terrain: Terrain[][];
  private hidden: HiddenContent[][];
  private floorItems: Map<string, ItemType> = new Map();
  exitPos: Pos;
  exitRevealed = false;
  exitDestroyed = false;

  constructor(stage: StageData) {
    this.cols = stage.cols;
    this.rows = stage.rows;
    this.exitPos = { x: stage.exit[0], y: stage.exit[1] };

    this.terrain = Grid.buildTerrain(stage);
    this.hidden = [];
    for (let y = 0; y < this.rows; y++) {
      this.hidden.push(new Array<HiddenContent>(this.cols).fill('none'));
    }

    for (const [x, y] of stage.softBlocks) {
      this.terrain[y][x] = 'soft';
    }
    for (const item of stage.items) {
      const [x, y] = item.at;
      this.hidden[y][x] = item.type;
    }
    this.hidden[this.exitPos.y][this.exitPos.x] = 'exit';
  }

  private static buildTerrain(stage: StageData): Terrain[][] {
    const t: Terrain[][] = [];
    for (let y = 0; y < stage.rows; y++) {
      t.push(new Array<Terrain>(stage.cols).fill('empty'));
    }
    if (stage.hardBlocks === 'checkerboard+border') {
      for (let y = 0; y < stage.rows; y++) {
        for (let x = 0; x < stage.cols; x++) {
          const isBorder = x === 0 || y === 0 || x === stage.cols - 1 || y === stage.rows - 1;
          const isPillar = x % 2 === 0 && y % 2 === 0;
          if (isBorder || isPillar) {
            t[y][x] = 'hard';
          }
        }
      }
    } else {
      for (let y = 0; y < stage.rows; y++) {
        for (let x = 0; x < stage.cols; x++) {
          t[y][x] = stage.hardBlocks[y][x] === 1 ? 'hard' : 'empty';
        }
      }
    }
    return t;
  }

  inBounds(p: Pos): boolean {
    return p.x >= 0 && p.y >= 0 && p.x < this.cols && p.y < this.rows;
  }

  terrainAt(p: Pos): Terrain {
    return this.terrain[p.y][p.x];
  }

  /** True if an actor may occupy this tile (grid terrain only; bombs handled separately). */
  isWalkable(p: Pos): boolean {
    if (!this.inBounds(p)) return false;
    return this.terrainAt(p) === 'empty';
  }

  hiddenAt(p: Pos): HiddenContent {
    return this.hidden[p.y][p.x];
  }

  floorItemAt(p: Pos): ItemType | undefined {
    return this.floorItems.get(posKey(p));
  }

  clearFloorItem(p: Pos): void {
    this.floorItems.delete(posKey(p));
  }

  /**
   * Destroys a soft block, revealing whatever was hidden beneath it.
   * Returns what was revealed so callers (explosion resolution) can react.
   */
  destroySoft(p: Pos): { revealedItem?: ItemType; revealedExit: boolean } {
    if (this.terrainAt(p) !== 'soft') {
      return { revealedExit: false };
    }
    this.terrain[p.y][p.x] = 'empty';
    const content = this.hidden[p.y][p.x];
    if (content === 'exit') {
      this.exitRevealed = true;
      return { revealedExit: true };
    }
    if (content !== 'none') {
      this.floorItems.set(posKey(p), content);
      return { revealedItem: content, revealedExit: false };
    }
    return { revealedExit: false };
  }

  destroyExit(): void {
    this.exitDestroyed = true;
    this.exitRevealed = false;
  }

  /** Flood fill from a start tile treating SOFT as passable (destructible) and HARD as not. */
  reachableFrom(start: Pos): Set<string> {
    const seen = new Set<string>();
    const queue: Pos[] = [start];
    seen.add(posKey(start));
    const dirs = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      for (const d of dirs) {
        const next = { x: cur.x + d.x, y: cur.y + d.y };
        if (!this.inBounds(next)) continue;
        if (this.terrainAt(next) === 'hard') continue;
        const key = posKey(next);
        if (seen.has(key)) continue;
        seen.add(key);
        queue.push(next);
      }
    }
    return seen;
  }
}

export function loadStage(stage: StageData): Grid {
  return new Grid(stage);
}
