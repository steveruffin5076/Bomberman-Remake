# Universal AI Game Project Template — Arena.ai + Claude Code + GitHub

## Core workflow

YOU
→ Arena.ai: Plan + Design
→ YOU APPROVE
→ Arena.ai: Create/update project documentation and approved specs
→ GitHub: Store the project source of truth
→ Claude Code: Read repository + Develop + Test + Debug
→ YOU PLAYTEST
→ Arena.ai: Review playtest + Plan next changes
→ GitHub
→ Claude Code
→ repeat

### Roles

- **YOU** — final creative/product authority.
- **Arena.ai** — game planner, designer, researcher, documentation and playtest-analysis workspace.
- **GitHub** — shared project source of truth and version history.
- **Claude Code** — repository-aware technical developer, debugger, tester and senior technical reviewer.

Claude Code should not invent major game-design decisions. Arena.ai should not silently redefine approved technical architecture.

## Getting started

1. Put the game project in this repository.
2. Start with `ai/PROJECT.md`.
3. Use Arena.ai to plan the MVP and initial milestone.
4. Approve important decisions.
5. Save approved plans/specs into `/ai/` and commit them to GitHub.
6. Give Claude Code access to the GitHub repository.
7. Ask Claude Code to inspect the repository before implementing.
8. Playtest the build.
9. Return to Arena.ai for design/playtest review.
10. Repeat.

## Context rule

Do not ask every AI to read the entire repository every time.

Start with:
- `ai/PROJECT.md`
- the relevant design/architecture document
- `ai/DECISIONS.md`
- `ai/CURRENT_STATE.md`

Then inspect only the files relevant to the task.
