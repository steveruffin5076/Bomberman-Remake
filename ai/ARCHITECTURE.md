# Architecture

## Engine / stack
- **Language:** TypeScript (strict mode)
- **Framework:** Phaser 3 (Arcade or custom grid logic; rendering via Phaser's WebGL/Canvas)
- **Bundler/dev server:** Vite (fast reload, live preview in Arena via `0.0.0.0` binding)
- **Level data:** JSON files loaded at boot
- **Testing:** Vitest (unit tests for grid/bomb/explosion logic, headless — no Phaser dependency in core logic)

## Technical goals
- Deterministic, testable game rules separated from rendering (core logic runs headless).
- 60 FPS on modest hardware; the simulation is a small grid, so this is trivially achievable — no premature optimization.
- Instant playtest: `npm run dev` → browser.

## Project structure
```
Bomberman-Remake/
├── ai/                    # Source-of-truth docs (this folder)
├── public/
│   └── assets/            # sprites, tiles, audio (retro pixel art)
├── src/
│   ├── core/              # engine-independent game rules (pure TS, unit-testable)
│   │   ├── grid.ts        # board model: tiles, hard/soft blocks, queries
│   │   ├── bomb.ts        # placement, fuse, detonation scheduling
│   │   ├── explosion.ts   # cross propagation, chain reactions, hit resolution
│   │   ├── actors.ts      # player/enemy state, movement validation
│   │   ├── items.ts       # power-up definitions and stat caps
│   │   ├── enemyAI.ts     # Wanderer / Tracker decision logic
│   │   └── stage.ts       # stage rules: exit door, timer, win/fail conditions
│   ├── scenes/            # Phaser scenes
│   │   ├── BootScene.ts   # asset loading
│   │   ├── MenuScene.ts   # title / start / restart (minimal)
│   │   └── GameScene.ts   # gameplay rendering + input, drives core each tick
│   ├── data/
│   │   └── stages/stage1.json
│   ├── config.ts          # balance knobs: fuse time, speeds, timer, caps
│   └── main.ts            # Phaser game bootstrap
├── tests/                 # Vitest suites for src/core
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Core systems
1. **Grid:** fixed-size board (13×11 tiles proposed). Each cell: `EMPTY | HARD | SOFT | ITEM_* | EXIT`. O(1) lookups; the single source of spatial truth.
2. **Bomb/Explosion:** bombs live in the grid; a fixed-timestep simulation tick advances fuses. On detonation, arms propagate per direction until a hard block; soft blocks stop the arm and are destroyed; bombs hit by an arm detonate in the same tick (chain). Explosions exist for a short duration (~0.5 s) and kill actors on contact.
3. **Actors:** player and enemies are position + stats (fire, maxBombs, speed). Movement is continuous-pixel but lane-snapped at intersections (classic Bomberman feel), collision-tested against the grid.
4. **Stage state machine:** `INTRO → PLAYING → WIN | FAIL(timeout / door destroyed / lives exhausted) → RESTART`.

## Scene / level structure
- One GameScene renders any stage from JSON data. No per-level scenes.
- MenuScene: title, start, controls reminder. Minimal.

## Data flow
```
stage1.json → core/stage.ts (state) ← config.ts (balance)
GameScene: input → core tick (fixed step) → core state → render
```
Rendering never mutates core state; core never imports Phaser.

## Input
- Keyboard: arrows/WASD move, Space/Z place bomb, R restart, P pause.
- Input is buffered into the core tick (no direct actor mutation from event handlers).

## Gameplay architecture
- Fixed-timestep logic update (e.g. 60 Hz simulation tick inside Phaser's update loop with accumulator) so bomb timing and chain reactions are deterministic.
- All classic rules from `ai/GAME_DESIGN.md` implemented in `src/core/`, covered by unit tests before rendering work.

## UI architecture
- In-game HUD drawn by Phaser (timer, bombs available, lives, enemies remaining).
- Overlays: stage clear, stage fail (reason), pause. All inside GameScene; no DOM UI.

## Save / persistence
- None in MVP. Optional later: `localStorage` for high scores / furthest stage. No design impact.

## Audio / animation / VFX integration
- MVP: placeholder sprites with minimal frame animation (walk cycle, explosion frames), no audio or 1–2 placeholder SFX max.
- Deferred: dedicated audio manager, animation state machine, particle VFX.

## Networking (if applicable)
- None. Local multiplayer (Battle Mode) is deferred; if approved later, hotseat (shared keyboard / two gamepads) is the assumed first step — no netcode in MVP architecture.

## Performance constraints
- 13×11 grid, <10 actors, <10 bombs: performance is a non-issue. Constraint is code clarity, not throughput.

## Testing strategy
- **Unit (Vitest):** grid queries, bomb fuse/detonation, chain reactions, explosion-vs-block/item/actor resolution, enemy AI decisions, stage win/fail rules, exit-door destruction rule.
- **Manual/playtest:** feel of movement, readability, difficulty of stage 1 — human playtest loop per AGENTS.md.
- Rule of thumb: every core rule from GAME_DESIGN.md gets at least one test.

## Technical boundaries
- `src/core/` must not import Phaser, DOM, or any rendering code (enables headless tests).
- Claude Code may not add systems outside the current milestone scope without approval (AGENTS.md).
- Balance numbers live in `config.ts` / stage JSON, never inline in logic.

## Known technical debt
- None yet (greenfield). Template files in `ai/templates/` are corrupted (literal `\n` sequences) — treat as reference only, do not instantiate from them.
