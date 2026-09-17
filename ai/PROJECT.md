# Project

## Identity
- Project name: Bomberman Remake
- Genre: Grid-based maze action / arcade
- Platform: Web (desktop browser; keyboard input)
- Engine: TypeScript + Phaser 3 (Canvas/WebGL), bundled with Vite
- Repository: steveruffin5076/Bomberman-Remake
- One-sentence pitch: A faithful remake of classic Bomberman — drop bombs, blast soft blocks, dodge your own explosions, collect power-ups, defeat every enemy and escape through the hidden exit before time runs out.

## Current goal
- Approve planning documents, then hand Milestone 0/1 to Claude Code for implementation of the single-player Normal Mode vertical slice.

## Current milestone
- Milestone 1 — Playable Vertical Slice (Normal Mode, 1 stage). Milestone 0 (project scaffold) is folded into its first task.

## Active disciplines
Mark only what this project currently needs:
- [x] Gameplay
- [ ] Story
- [ ] Characters
- [ ] World
- [x] Level Design
- [x] Art Direction
- [ ] Animation
- [ ] VFX
- [ ] Audio
- [ ] UI/UX
- [ ] Cinematics
- [ ] Content
- [x] QA / Testing
- [ ] Networking
- [x] Performance

Rationale: Bomberman is a systems-driven arcade game. Story, characters, world, cinematics and narrative content are inactive. Animation/VFX/Audio are deferred to a later polish milestone (placeholder SFX/animation only in MVP).

## AI roles
- Human: final authority
- Arena.ai: planning, design, research, documentation, playtest analysis
- GitHub: shared source of truth/version history
- Claude Code: implementation, technical debugging, testing, technical review

## Source-of-truth hierarchy
1. Direct user instruction
2. Approved decisions in `ai/DECISIONS.md`
3. Relevant approved `/ai` source-of-truth document
4. Existing implementation
5. AI assumptions

Never silently replace a higher-priority source.

## Context routing
Start with this file. Then read only the relevant `/ai` documents and project files.
