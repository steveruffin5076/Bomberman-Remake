# Art Direction

## Visual identity
Retro pixel-art homage to NES / PC Engine Bomberman: chunky readable tiles, saturated primary colors, black-outlined sprites, clean silhouettes on a grid that always reads at a glance.

## Style rules
- Tile size: 32×32 px base assets (16×16 look upscaled, or native 32 with big pixels); nearest-neighbor scaling only — no smoothing.
- Limited palette per sprite (≤ 8 colors), consistent across the set; one shared background/arena palette per stage.
- Hard blocks: heavy, static, dark-outlined. Soft blocks: clearly lighter/brick-textured — the hard/soft distinction must be obvious without UI help.
- Bombs: black sphere with visible fuse; pulses/grows in the final second (danger readability, per UX principles).
- Explosions: bright warm core (white→yellow→orange) distinct from all environment colors.
- Player/enemies: 2-frame walk cycles minimum for MVP; full animation polish deferred to Milestone 3.

## MVP asset list (stage 1)
- Tiles: floor, hard block, soft block, exit door (hidden + revealed states)
- Items: Fire, Bomb, Speed (3 icons)
- Sprites: player (4-direction walk), Wanderer enemy, Tracker enemy, bomb (idle + pulse), explosion (center/arm/end pieces)
- UI: HUD font (bitmap-style), minimal overlays (stage clear / fail)

## Deferred
Title screen art, stage themes beyond stage 1, VFX particles, animated backgrounds, character portraits.

## Production notes
- Assets live in `public/assets/`; spritesheets preferred over loose files.
- Placeholder programmer art (colored tiles) is approved for core-logic work; pixel set replaces it before Milestone 1 acceptance.
