# Level Design

## Level goals
Each stage: a solvable maze puzzle under time pressure — clear blocks efficiently, hunt enemies without dying, locate the hidden exit, escape in time.

## Layout principles
- Hard blocks: full border + interior pillars on even row/column intersections (classic checkerboard), guaranteeing connected corridors.
- Soft blocks: randomly-but-seeded or hand-placed in corridors; density ~50–60% of open corridor tiles for stage 1.
- Safe spawn: player starts top-left corner; spawn tile + its two adjacent corridor tiles contain no soft blocks, items, enemies or the exit (never trapped at start, can always make a first move).
- Exit door: under exactly one soft block, never in the safe-spawn zone, never under a block hiding a required item the player needs to reach it (solvability check in tests).
- Enemies: spawn in the half of the board away from the player; never adjacent to spawn.

## Stage data format (JSON)
```json
{
  "id": 1,
  "cols": 13, "rows": 11,
  "timeLimit": 200,
  "lives": 3,
  "playerSpawn": { "x": 1, "y": 1 },
  "hardBlocks": "checkerboard+border",
  "softBlocks": [[3,1],[5,1], "..."],
  "items": [{ "type": "fire", "at": [3,1] }, "..."],
  "exit": [7,5],
  "enemies": [{ "type": "wanderer", "at": [9,7] }, "..."]
}
```
(Final schema fixed by Claude Code in Milestone 0; the above is the design intent.)

## Stage 1 design targets
- 3–4 enemies (mostly Wanderers, 1 Tracker), ~4–6 items with at least 2 Fire and 1 Bomb reachable early.
- Beatable by a newcomer in 2–4 attempts; timer generous (~200 s).

## Validation rules (automated tests)
- Grid dimensions odd; border complete; interior pillars on even/even coordinates.
- All corridor tiles reachable from spawn assuming soft blocks are destructible.
- Exactly one exit; exit not in safe-spawn zone; every item under a soft block.

## Deferred
Stages 2+ (Milestone 2 ladder), themed layouts, battle arenas.
