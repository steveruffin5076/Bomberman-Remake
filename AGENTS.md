# AI Project Operating Rules

## Authority
The human is the final authority.

## Role separation
- Arena.ai = Planner / Designer / Researcher / Documentation / Playtest analysis
- GitHub = Shared source of truth / version history
- Claude Code = Technical Developer / Debugger / Tester / Senior Technical Reviewer

## Core loop
Human → Arena.ai → Human approval → GitHub → Claude Code → Build/Test → Human playtest → Arena.ai review → GitHub → Claude Code

## Context efficiency
Start with `ai/PROJECT.md`, then read only relevant documents and project files.

## Decision locking
Proposed → human approves → record in `ai/DECISIONS.md` → project truth.

## Scope
Do not implement future milestones or unrelated systems without approval.

## Handoff
Arena.ai should leave clear, implementation-ready documentation in `/ai/`.
Claude Code should inspect the real repository before modifying it.

## Escalation
If Claude Code encounters a major design conflict, stop and surface the decision to the human/Arena.ai rather than inventing a new direction.
