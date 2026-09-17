# Approved Decisions

## Decision lifecycle
Proposed → Human approval → Recorded here → Project truth

### 2026-09-17 Decision: Tech stack — Web, TypeScript + Phaser 3 + Vite
**Status:** Approved
**Decision:**
- Build the game for the browser using TypeScript (strict) + Phaser 3, bundled with Vite.
- Core game rules live in a rendering-independent `src/core/` module, unit-tested with Vitest.

**Reason:**
- Grid-based 2D game fits the web perfectly; instant playtest via Arena live preview and trivial sharing.
- Separating core logic from Phaser keeps rules deterministic and testable headless.

**Affected systems/documents:** `ai/ARCHITECTURE.md`, `ai/PROJECT.md`, `ai/MILESTONES.md`

**Implementation notes:** Dev server must bind `0.0.0.0`. No DOM UI — HUD/overlays in Phaser scenes.

---

### 2026-09-17 Decision: MVP scope — Normal Mode only (single-player PvE), one stage
**Status:** Approved
**Decision:**
- The MVP/vertical slice is single-player Normal Mode: one complete stage with grid maze, hard/soft blocks, bombs, chain reactions, friendly fire, 3 power-up types (Fire/Bomb/Speed), 2 enemy archetypes, hidden exit door with the classic fail rules, timer, lives, instant restart.
- Battle Mode, multiplayer and sudden death are deferred (decision point at Milestone 4).
- Kick, Throw/Punch, Heart/Shield power-ups are deferred.

**Reason:**
- Smallest complete expression of the Bomberman fantasy; proves the core feel before investing in versus-mode systems.

**Affected systems/documents:** `ai/GAME_DESIGN.md`, `ai/MILESTONES.md`, `ai/PROJECT.md`

**Implementation notes:** Architecture must not bake in single-player assumptions that block later hotseat Battle Mode (stage data format already generic).

---

### 2026-09-17 Decision: Visual direction — retro pixel art (NES/PC Engine homage)
**Status:** Approved
**Decision:**
- Retro pixel-art style throughout; small tile/sprite set produced early for the vertical slice.
- Programmer-art placeholders allowed during Milestone 1 core logic work, replaced by the pixel set before slice acceptance.

**Reason:**
- Matches the franchise identity, small asset surface (13×11 grid, few sprites), achievable early.

**Affected systems/documents:** `ai/ART_DIRECTION.md`, `ai/MILESTONES.md`

**Implementation notes:** See `ai/ART_DIRECTION.md` for palette/scale rules.

---

## Proposed decisions awaiting human approval

### [PROPOSED] Decision: Lives & death model
**Status:** Proposed
**Decision:** Classic 3 lives; losing a life restarts the stage from scratch (stats reset). 0 lives → stage fail.
**Reason:** Authentic arcade tension; simple to implement; instant-restart UX keeps frustration low.
**Alternative:** 1 life per attempt (harder, more roguelike).

### [PROPOSED] Decision: Stage size 13×11
**Status:** Proposed
**Decision:** Classic odd-dimension grid, 13 columns × 11 rows of playfield inside the hard-block border.
**Reason:** Proven classic proportions; fits browser viewports with large tiles for readability.

### [PROPOSED] Decision: Items only under soft blocks
**Status:** Proposed
**Decision:** Enemies do not drop items in the MVP; all items are pre-placed under soft blocks in stage data.
**Reason:** Simpler balancing and content rules; enemy item drops can be added in Milestone 2 if desired.

## Rules
- Major creative/design decisions require human approval.
- Major architecture changes should be explicitly reviewed.
- Do not silently overwrite approved decisions.
