# Handoff Brief — Milestone 0/1: Normal Mode Vertical Slice

**From:** Arena.ai (Planner/Designer) **To:** Claude Code (Technical Developer)
**Date:** 2026-09-17 **Branch:** `arena/01a0ae54-bomberman-remake`
**Status:** All design decisions approved. This brief is implementation-ready. No further design input needed unless a conflict is found (then STOP and escalate per AGENTS.md — do not invent new direction).

---

## 1. Mission

Build the complete single-player Normal Mode vertical slice: **one playable Bomberman stage in the browser**. This is Milestone 0 (scaffold) + Milestone 1 (slice) from `ai/MILESTONES.md`, executed as one ordered work plan below.

## 2. Context loading order (do not read everything)

1. `ai/PROJECT.md` — identity, active disciplines
2. `ai/DECISIONS.md` — 6 locked decisions (these override any other assumption)
3. `ai/GAME_DESIGN.md` — core mechanics, MVP definition, balance/content rules
4. `ai/ARCHITECTURE.md` — stack, project structure, technical boundaries
5. `ai/LEVEL_DESIGN.md` — stage JSON schema intent, validation rules
6. `ai/ART_DIRECTION.md` — pixel rules, MVP asset list
7. `ai/CODING_RULES.md` + `AGENTS.md` — working rules
8. Inspect the actual repository state before writing any code (it is currently docs-only).

## 3. Locked constraints (approved — do not redecide)

| # | Constraint |
|---|------------|
| 1 | TypeScript (strict) + Phaser 3 + Vite; core rules in `src/core/` with **zero Phaser/DOM imports**; Vitest for unit tests |
| 2 | Normal Mode only. No Battle Mode, multiplayer, sudden death. No Kick/Throw/Punch/Shield |
| 3 | Retro pixel art; programmer-art placeholders permitted during logic work, replaced before slice acceptance |
| 4 | 3 lives; life lost → full stage restart (stats/blocks/enemies/items/timer reset); 0 lives → fail |
| 5 | Stage 13×11 including hard-block border; dimensions data-driven (cols/rows in JSON) |
| 6 | Items only under soft blocks; exactly one hidden exit per stage; every item/exit validated by tests |

Balance knobs (fuse time ~2.5 s, speeds, timer 200 s, caps Fire≤6/Bombs≤6/Speed≤3) live in `src/config.ts` / stage JSON — **never inline in logic**.

## 4. Work plan — ordered tasks with acceptance criteria

Build logic-first: each core task gets its unit tests **before or with** its rendering integration. Commit per task (or per logical group) with messages referencing the task ID.

### T0 — Scaffold (Milestone 0)
Vite + TS(strict) + Phaser 3 project per `ai/ARCHITECTURE.md` structure; Vitest configured; `.gitignore` (node_modules, dist); dev server binds **0.0.0.0** with a fixed port (5173) for Arena live preview.
✅ *Acceptance:* `npm install && npm run dev` renders an empty scene in browser; `npm test` runs one passing smoke test.

### T1 — Grid + stage data
`src/core/grid.ts` (cell types EMPTY/HARD/SOFT/ITEM_*/EXIT, O(1) queries, collision predicates) + `src/data/stages/stage1.json` final schema (extend `ai/LEVEL_DESIGN.md` intent: id, cols, rows, timeLimit, lives, playerSpawn, hardBlocks layout, softBlocks, items, exit, enemies) + stage loader.
✅ *Acceptance tests:* dimensions odd; border complete; interior pillars even/even; all corridor tiles reachable from spawn (flood fill assuming soft blocks destructible); exactly one exit; exit not in safe-spawn zone; every item under a soft block; safe-spawn zone (spawn tile + 2 adjacent corridor tiles) free of soft blocks/items/enemies/exit. GameScene renders the grid from JSON (placeholder tiles OK).

### T2 — Player movement
Lane-snapped continuous movement (classic feel: free along a lane, snapping when turning at intersections), collision vs hard/soft blocks, keyboard input (arrows/WASD) buffered into a fixed-timestep core tick. No diagonal movement.
✅ *Acceptance tests:* actor cannot enter HARD/SOFT cells; lane-snap rounding behaves at intersections; input maps to exactly one direction per tick. Playable feel verified manually in browser.

### T3 — Bombs & explosions (the heart of the game)
Placement on occupied tile (Space/Z); bomb solid to its owner once they leave; fuse ~2.5 s with end-of-fuse pulse; cross explosion, arm length = Fire stat; arm stops at hard block; soft block absorbs arm tip and is destroyed; explosion lifetime ~0.5 s; **friendly fire kills player**; **chain reactions: bomb hit by explosion detonates in the same tick (recursive cascade)**.
✅ *Acceptance tests:* arm propagation vs hard/soft/empty; soft block destroyed and removed; chain of 2–3 bombs detonates fully in one tick without stack overflow; player death by own bomb; bomb placement blocked when at max-bombs stat; player can stand on own bomb before leaving, cannot re-enter afterwards.

### T4 — Items
Fire (+1 arm), Bomb (+1 max), Speed (+step) revealed under destroyed soft blocks; pickup on walk-over; caps Fire≤6, Bombs≤6, Speed≤3.
✅ *Acceptance tests:* item revealed exactly when its soft block is destroyed; item destroyed if hit by explosion while lying on floor (classic rule); caps enforced; stat effects observable in core state.

### T5 — Enemies
Two archetypes in `src/core/enemyAI.ts`: **Wanderer** (moves continuously along open lanes, random turns at intersections, never reverses unless dead-ended) and **Tracker** (same, but biased toward player axis when a choice exists). Killed by any explosion; kill player on contact (tile-overlap check). Spawn positions from stage JSON.
✅ *Acceptance tests:* enemies never enter HARD/SOFT cells; decision logic deterministic given a seeded RNG; enemy dies in explosion; player dies on contact; no enemy spawns in safe-spawn zone.

### T6 — Exit door & stage rules
Exit hidden under one soft block; revealed when that block is destroyed. **If the exit tile is hit by an explosion before all enemies are dead → door destroyed → stage fail.** Stepping on a live exit with 0 enemies remaining → stage clear. Timer counts down from stage data; timeout → fail. Lives: death → stage restart with life −1; 0 lives → fail.
✅ *Acceptance tests:* door-destroyed-before-clear = fail; door-destroyed-after-clear = still usable (or already won); stepping on door with enemies alive = nothing happens; timeout = fail; life lost → full stage state reset to JSON defaults; win/fail state machine transitions are exhaustive and terminal.

### T7 — HUD, overlays, restart, pixel-art pass
Phaser HUD: timer, bombs available, lives, enemies remaining. Overlays: stage clear, fail (**with reason**: timeout / door destroyed / lives exhausted), pause (P). Instant restart (R key or overlay button; death→gameplay ≤ 1 s). Replace all programmer art with the retro pixel set per `ai/ART_DIRECTION.md` (nearest-neighbor scaling, 32×32 tiles, MVP asset list). Minimal placeholder SFX optional; no audio system.
✅ *Acceptance:* newcomer-readable danger signals (bomb pulse, distinct explosion colors); all overlays reachable; restart timing met; no smoothed/blurred pixels.

## 5. Test checklist — every core rule gets ≥1 test

Grid: reachability · border/pillars · safe-spawn zone · one-exit · items-under-blocks
Bombs: fuse timing · max-bombs limit · owner re-entry block
Explosions: hard-stop · soft-absorb · chain cascade same-tick · lifetime · friendly fire · floor-item destruction · enemy kill
Items: reveal · pickup · caps (Fire/Bomb/Speed)
Enemies: no wall entry · deterministic seeded AI · player-contact death
Stage: door-destroyed fail · door-after-clear · step-with-enemies-alive no-op · timeout fail · lives decrement + full reset · terminal states
Movement: no diagonal · lane snap · collision

## 6. Working rules

- **Scope:** tasks T0–T7 only. Anything else (Battle Mode, extra power-ups, audio system, stages 2+) is a scope violation — flag it, don't build it.
- **Escalation:** major design conflict → stop, surface to human/Arena.ai (AGENTS.md).
- **State tracking:** update `ai/CURRENT_STATE.md` at each task completion (working / in progress / broken / next tasks). Commit it with the code.
- **Commits:** small, per task, conventional-style messages (e.g. `T3: bomb fuse, explosion propagation, chain reactions + tests`). Push to `arena/01a0ae54-bomberman-remake` only.
- **Quality bar:** TS strict, no `any` in `src/core/`; tests green before moving to next task; no unrelated refactors.

## 7. Definition of done — Milestone 1

1. `npm install && npm run dev` → stage 1 playable in browser (preview port reachable).
2. `npm test` → full suite green, covering the checklist in §5.
3. A newcomer can complete stage 1 in 2–4 attempts (human playtest confirms — this is the final gate, run by the human, reviewed by Arena.ai).
4. Death → restart < 1 s; fail overlays show reasons; HUD complete.
5. Retro pixel set in place (no programmer art remains); nearest-neighbor rendering.
6. `ai/CURRENT_STATE.md` and `ai/MILESTONES.md` reflect completion; ready-for-playtest status set.

After that: **human playtests → Arena.ai reviews → Milestone 2 proposal (requires approval).**
