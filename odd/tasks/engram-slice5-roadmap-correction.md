# Engram Slice 5 — ROADMAP status correction

## Objective

Correct `ROADMAP.md`'s Phase 2 / Slice 5 prose so it stops claiming "no command reads memory to shape a proposal yet" — that claim is false. `pi-engram-memory-reads` (already archived, `openspec/changes/archive/2026-09-14-pi-engram-memory-reads/`) delivered exactly that: `journal-candidate-agent` calls `drenyra_institutional_memory` (`engram_search`, REQ-ENG-005) to inform which candidate it drafts, never wired to any gate (REQ-ENG-006). `capability-manifest.yaml`'s `engram-integration.evidence.limitation` field already states this accurately — only `ROADMAP.md` is stale.

## Why

User asked to create an ODD to advance `drenyra-shell`. Exploration (background agent, `ae911e28d2a9ee429`) mapped Slice 5's real state and found the roadmap description no longer matches the code. Extending `drenyra_institutional_memory` to another agent was considered as an alternative scope, but `reconciliation-agent` was already explicitly evaluated and declined as a second target in the prior preproposal (decision D2) — wiring a new agent without a concrete driving need would be inventing unrequested scope, not advancing anything real. Fixing the stale roadmap is the honest, bounded next step; the actual coverage gap (9 of 10 agents) stays correctly unchecked, just described accurately.

## Scope / constraints

- File: `ROADMAP.md` only. `capability-manifest.yaml` is already accurate (verified by reading `capability-manifest.yaml:148-168`) — not touched.
- Edit two spots:
  - Line 53 bullet: replace "proposal-informing memory reads remain open" with accurate phrasing (delivered for 1 of 10 agents; broader coverage remains open).
  - Lines 58-64 paragraph: replace "no command reads memory to shape a proposal yet — both remain open" with accurate phrasing naming `journal-candidate-agent` as the one delivered caller and the other 9 agents as the real remaining gap.
- Checkbox at line 53 stays unchecked — coverage is still partial, this is a prose accuracy fix, not a completion claim.
- Do not touch the `<!-- conformance:surface -->` / `<!-- conformance:snapshot -->` marker comments (lines 11-12) — `__tests__/capability-manifest.test.ts` checks for their presence on `ROADMAP.md` as a `PROJECTION_SURFACES` entry.
- No code, agent, or gate changes. Read-only/advisory boundary (AGENTS.md rule 1) is not in play here since nothing executable changes.

## TDD mode

Not test-first — this is a documentation prose correction, no new behavior. Functional check: `bunx vitest run __tests__/capability-manifest.test.ts` after the edit, to confirm the conformance-marker presence check on `ROADMAP.md` still passes.

## Tasks

- [x] **T1 — Correct ROADMAP.md Slice 5 prose** — Route: direct inline (1 file, mechanical, already understood from exploration) — done, see Progress.

## Acceptance criteria

- `ROADMAP.md` no longer states or implies that no command reads memory to inform a proposal.
- `ROADMAP.md` names `journal-candidate-agent` as the one agent with proposal-informing memory reads and states the other 9 agents remain uncovered.
- `bunx vitest run __tests__/capability-manifest.test.ts` passes.
- One Conventional Commit on `docs/engram-slice5-roadmap-correction`.

## Progress

- 2026-09-21 — Branch `docs/engram-slice5-roadmap-correction` created off `main`. Task file created. Background exploration (`ae911e28d2a9ee429`) confirmed capability-manifest.yaml is already accurate; only ROADMAP.md needs correction.
- 2026-09-21 — T1 done: both ROADMAP.md prose spots corrected. `bunx vitest run __tests__/capability-manifest.test.ts`: 35/35 passed. Committed `886213e` on `docs/engram-slice5-roadmap-correction`.

## Next step

None — feature complete. Push and open a PR are the user's decision under ordinary repository policy.
