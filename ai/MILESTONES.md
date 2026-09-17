# Milestones

## Strategy
Build the smallest useful vertical slice first: one complete, polished-enough Normal Mode stage, fully playable in the browser. Everything else is deferred until the slice is proven fun by human playtest.

## Milestone 0 — Foundation
Goal:
- Vite + TypeScript + Phaser 3 scaffold, `npm run dev` runs (bound to 0.0.0.0 for Arena live preview)
- Vitest configured; `src/core/` and `tests/` folders exist
- Stage JSON format defined and stage1.json authored
- Placeholder tileset (retro pixel-art direction per `ai/ART_DIRECTION.md`)
- **Acceptance:** empty grid renders from stage1.json; one passing smoke test.

## Milestone 1 — Playable Vertical Slice (Normal Mode, 1 stage)
Goal: the complete MVP from `ai/GAME_DESIGN.md`, in this order:
1. Grid + player movement (lane-snapped, collision vs hard/soft blocks)
2. Bomb placement, fuse, cross explosion, soft block destruction, friendly fire
3. Chain reactions (bomb hits bomb → instant detonation)
4. Items: Fire / Bomb / Speed reveal + pickup + stat caps
5. Enemies: Wanderer + Tracker AI, death by explosion, player death on contact
6. Exit door: hidden under soft block, all-enemies-dead rule, door-destroyed fail rule
7. Stage timer, lives, win/fail states, instant restart, HUD
- **Acceptance:** a newcomer can complete stage 1; every core rule has a unit test; death→restart under 1 s.

## Milestone 2 — Core Expansion (requires approval to start)
Goal:
- Stage ladder (5–8 stages) with rising difficulty
- Playtest-driven balance + feel tuning
- Optional: third enemy archetype, additional item types (Kick first, as it is the simplest deferred power-up)

## Milestone 3 — Content / Polish (requires approval to start)
Goal:
- Full retro pixel-art asset pass, animations, VFX (explosions), audio (music + SFX)
- Menus, stage-clear presentation, high score (localStorage)

## Milestone 4 — Release Preparation (requires approval to start)
Goal:
- QA sweep, browser/performance testing, static hosting build, README/controls docs
- Battle Mode decision point: propose scope (local hotseat vs AI opponents) for human approval

## Current milestone
**Milestone 1 — Playable Vertical Slice** (Milestone 0 folded in as its first task). Status: implementation complete (tasks T0–T7 done per `ai/HANDOFF_BRIEF.md`), all automated tests green, verified playable in-browser. Awaiting human playtest gate before Milestone 2 is proposed. See `ai/CURRENT_STATE.md` for details, including one flagged open question about the placeholder-vs-final pixel art asset pass.

## Current milestone scope
See Milestone 0 + Milestone 1 above. Nothing else.

## Explicitly deferred
- Battle Mode / multiplayer / sudden death
- Kick, Throw/Punch, Heart/Shield power-ups
- Multi-stage content beyond stage 1
- Audio, animation and VFX polish
- Mobile/touch input, persistence beyond optional high scores

Do not implement future milestones without approval.
