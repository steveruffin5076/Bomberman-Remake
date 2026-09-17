# Game Design

## Vision
Recreate the core Bomberman experience (Hudson Soft, 1983 lineage) as a tight, readable, browser-playable arcade game. The fantasy: out-thinking a maze — placing a bomb, retreating to safety, watching a chain reaction open the map — with the constant risk that your own bomb kills you.

## Intended player experience
- Short, tense sessions (2–4 minute stages).
- "One more try" loop: death is fast, restart is instant.
- Skill expression through planning routes, timing detonations and using chain reactions.
- Clear readability: the player should always be able to tell what is dangerous right now.

## Core gameplay loop
1. Explore a grid maze of hard and soft blocks.
2. Place bombs to destroy soft blocks → reveal power-ups and the hidden exit door.
3. Avoid explosions (including your own) and enemies while doing so.
4. Collect power-ups to increase fire range, bomb count, speed.
5. Eliminate all enemies on the stage.
6. Find and step on the exit door before the timer runs out → next stage / victory.

## Player goals
- Immediate: survive; kill the bomb you just dropped by moving to a safe tile.
- Stage: clear all enemies, find the exit, escape in time.
- Mastery: chain reactions, efficient block clearing, safe routing.

## Core mechanics (MVP — Normal Mode)
- **Grid movement:** tile-based maze, smooth pixel movement snapped to lanes, one tile at a time; no diagonal movement.
- **Bomb placement:** drop a bomb on the tile the player occupies; player walks off it; bomb is solid once the player has left (classic "no walking back through" rule).
- **Detonation:** fuse timer ~2.5 s; explosion is a cross of 4 arms; arm length = Fire stat (default 1).
- **Friendly fire:** any explosion kills the player. This is a core skill element, not an option.
- **Chain reactions:** an explosion touching another bomb detonates it immediately (same frame cascade).
- **Hard blocks:** indestructible; border of the arena + classic checkerboard interior pillars.
- **Soft blocks:** destructible; block movement; destroyed by any explosion contact.
- **Enemies:** simple maze AI agents that move continuously along open lanes, turning at intersections/randomly; killed by any explosion; kill the player on contact. MVP: 2 enemy archetypes (Wanderer: random turns; Tracker: biased toward the player). Enemy count per stage defined in level data.
- **Items (power-ups):** revealed under destroyed soft blocks; picked up by walking over:
  - Fire (+1 explosion arm length)
  - Bomb (+1 max simultaneous bombs)
  - Speed (+movement speed step)
  - MVP caps: Fire ≤ 6, Bombs ≤ 6, Speed ≤ 3 steps.
- **Exit door:** hidden under exactly one soft block per stage. Stepping on it with all enemies defeated completes the stage. If the exit door's tile is hit by an explosion **before all enemies are dead**, the door is destroyed → stage failed (classic rule). If revealed after enemies are cleared, it simply remains usable.
- **Timer:** per-stage countdown (e.g. 200 s). Time out = fail. No sudden death in Normal Mode (that is a Battle Mode mechanic — deferred).
- **Lives:** 3 lives per attempt (approved). Losing a life restarts the stage from scratch — stats, blocks, enemies, items and timer all reset to stage-data defaults. 0 lives → stage fail.
- **Stage size:** 13×11 tiles including the hard-block border (approved); dimensions remain data-driven for future stages.

### Deferred power-ups (explicitly NOT in MVP)
Kick, Throw/Punch, Heart/Shield — require Battle Mode or polish milestone; deferred to avoid speculative systems.

## MVP
**Single-player Normal Mode, one complete playable stage:**
grid arena + hard/soft blocks + player movement + bomb place/fuse/cross explosion + chain reactions + friendly fire + 3–5 enemies (2 archetypes) + Fire/Bomb/Speed items + hidden exit door with the fail rule + stage timer + win/fail states + instant restart. Retro pixel-art presentation, minimal HUD (timer, bombs left, lives).

## Current milestone scope
Milestone 1 — Playable Vertical Slice. See `ai/MILESTONES.md`.

## Systems required now
- Grid/board model (tiles, queries, collision).
- Actor movement (player + enemies) on the grid.
- Bomb system (placement, fuse, detonation, chaining).
- Explosion system (arm propagation, block/item/actor hits, lifetime).
- Destructible environment + item reveal.
- Enemy AI (2 archetypes).
- Stage progression state machine (playing → win/fail → restart).
- Timer + HUD.
- Level data format (stage 1 definition).

## Deferred systems
- Battle Mode (local multiplayer, AI opponents, sudden death).
- Additional power-ups (Kick, Throw/Punch, Shield).
- Additional enemy archetypes and boss behaviors.
- World map / stage selection across many stages.
- Audio system, animation polish, VFX polish (placeholder only in MVP).
- Persistence/save (browser session only; arcade game needs no saves in MVP).
- Touch/mobile controls.

## Progression
MVP is a single stage. Milestone 2 adds a small stage ladder (e.g. 5–8 stages) with rising enemy counts, tighter timers and different block layouts. No meta-progression.

## Difficulty / balance
- Stage 1 must be beatable by a newcomer within a few tries: generous timer, 3–4 enemies, plenty of Fire/Bomb items near spawn.
- Classic safe-spawn rule: player spawns in the top-left corner; the two adjacent tiles and the spawn tile itself contain no soft blocks or items initially (so the player is never instantly trapped).
- Balance knobs live in level/data config, not hardcoded: fuse time, fire default, enemy speed, timer, item distribution probabilities.

## Content rules
- Levels are data (JSON), not code: grid dimensions, hard block layout, soft block placement, enemy spawns/types, item pool weights, timer.
- Every stage must guarantee: ≥1 valid item under soft blocks, exactly one exit door, solvability (exit reachable after clearing blocks).

## UX principles
- Instant restart on death (≤1 s from fail screen to gameplay).
- Danger readability: bombs pulse as fuse nears end; explosions are visually distinct from environment.
- HUD minimal: timer, remaining bombs, lives, enemy count.

## Open design questions
None blocking. All Milestone 1 design questions resolved — see approved decisions of 2026-09-17 in `ai/DECISIONS.md`:
- Lives model: 3 lives, stage restarts from scratch on life lost (Approved)
- Stage size: 13×11 including hard-block border (Approved)
- Items: only under soft blocks; no enemy drops in MVP (Approved)
