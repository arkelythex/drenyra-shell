# SDD → ODD migration (full ODD)

Objective: remove the SDD / OpenSpec workflow from Drenyra Shell and make ODD the only
workflow, migrating the requirements corpus to `specs/`. Branch: `chore/purge-sdd-full-odd`.
Runner: `bun run test` (vitest). Delivery: single PR, work-unit commits.

## Specs

- **S1 — Specs corpus migrated, `openspec/` deleted.** The 13 requirement specs under
  `openspec/specs/*/spec.md` move to `specs/*/spec.md` with content preserved; `openspec/`
  (specs, `changes/archive` 128 files, `config.yaml`, `README.md`) is deleted entirely.
- **S2 — SDD skill removed.** `skills/drenyra-sdd/` is deleted; no shipped skill, manifest
  entry, or README line advertises an SDD workflow.
- **S3 — Evidence record re-homed.** The canonical current snapshot record
  (`current_test_state`) moves verbatim to `docs/architecture/current-test-state.yaml`;
  `bun run verify:capability` keeps the same assertions (fields, scopes, identity agreement)
  reading the new path, and `capability-manifest.yaml` declares the new record path and locator.
- **S4 — Candidate identity decoupled.** `scripts/compute-candidate-identity.mjs`
  `PARTICIPATION_PATHS_V1` contains no `openspec/` path; the normalizers that existed only for
  removed openspec files (`normalizeConfigYaml`, `normalizeApplyProgress`) are deleted together
  with their tests; `bun run refresh:lock-facts --check` is clean after regeneration.
- **S5 — `activeChanges` is ODD-native.** `scripts/refresh-program-lock-facts.mjs` derives
  `activeChanges` from `odd/tasks/*.md` (feature documents containing at least one unchecked
  `- [ ]` task) instead of enumerating `openspec/changes`, sorted, deterministic.
- **S6 — Docs purged.** No live instruction, path, or claim in `AGENTS.md`, `README.md`,
  `ROADMAP.md`, `RELEASING.md`, `CHANGELOG.md`, `docs/CODEBASE-GUIDE.md`,
  `docs/architecture/*.md`, or `contracts/engram-dependency.md` points at `openspec/` or tells a
  reader/agent to run an SDD phase. Historical provenance in code comments (change IDs such as
  `pi-sdd-030-routing-adapter`, `SDD-020`) is retained deliberately: it records which change
  delivered the code and carries no workflow instruction.
- **S7 — Checks green.** `bun run typecheck`, `bun run test`, `bun run verify:style`,
  `bun run verify:capability`, and `bun run refresh:lock-facts --check` all pass on the branch.
- **S8 — ODD is the documented workflow.** `AGENTS.md` describes ODD feature documents under
  `odd/tasks/` as this repository's workflow, replacing the SDD/OpenSpec instructions.
- **S9 — Changelog records the migration.** One `CHANGELOG.md` entry under `Unreleased` states
  that the SDD/OpenSpec workflow was removed in favour of ODD and where the specs now live.

## Tasks

- [ ] **T1 — Migrate specs corpus** (S1) — route: inline — `git mv openspec/specs/* specs/`, rewrite
  internal path references, delete `openspec/`. Commit: `chore(specs): migrate requirements corpus to specs/ and delete openspec`
- [ ] **T2 — Re-home the evidence record** (S3, S4) — route: inline — new
  `docs/architecture/current-test-state.yaml`, `verify-capability-manifest.mjs` constants and
  messages, `compute-candidate-identity.mjs` participation paths and normalizers,
  `capability-manifest.yaml` evidence block, regenerate `program-lock-facts.json`.
- [ ] **T3 — ODD-native `activeChanges`** (S5) — route: inline — `refresh-program-lock-facts.mjs`
  derives from `odd/tasks/`; update `program-lock-facts.md` prose.
- [ ] **T4 — Remove the SDD skill** (S2) — route: inline — delete `skills/drenyra-sdd/`, update
  `skills/README.md` and the manifest skills list.
- [ ] **T5 — Purge SDD docs** (S6, S8) — route: inline — `AGENTS.md` (ODD workflow section),
  `README.md`, `ROADMAP.md`, `RELEASING.md`, `CODEBASE-GUIDE.md`, `docs/architecture/*.md`,
  `contracts/engram-dependency.md`, `.prettierignore`.
- [ ] **T6 — Fix and extend tests** (S7) — route: inline — update the assertions in
  `lock-facts`, `refresh-program-lock-facts`, `capability-manifest`, and any fixture that embeds
  an `openspec/` path; add one regression test per changed rule (S3, S4, S5).
- [ ] **T7 — Changelog + full verification** (S9, S7) — route: inline — CHANGELOG entry, then
  typecheck, test, verify:style, verify:capability, refresh:lock-facts --check.

## Log

### L1 — 2026-10-27 — user request (verbatim)

> elimina todo sobre SDD , ahora full ODD

Scope decision asked and answered the same day (verbatim option label):

> Migrar specs a specs/ y purgar el workflow (Recomendado)

Rationale for the chosen option: the 13 `openspec/specs/*/spec.md` files are the package's
requirement baseline (cited by `contracts/` and the architecture docs), not workflow machinery;
the SDD machinery proper is `openspec/changes`, `openspec/config.yaml`, `skills/drenyra-sdd`,
and the phase instructions in the docs.

### L2 — 2026-10-27 — coupling map (evidence)

- `openspec/` tracked files: 144 — `specs/` 14 (13 `spec.md` + `.gitkeep`), `changes/archive/`
  128, `config.yaml`, `README.md`.
- `scripts/verify-capability-manifest.mjs` (1121 lines): `CONFIG_RECORD_REL = "openspec/config.yaml"`,
  `CURRENT_SNAPSHOT_LOCATOR = "openspec/config.yaml#/current_test_state"`,
  `EVIDENCE_RECORD_PATHS = [CONFIG_RECORD_REL, LOCK_FACTS_RECORD_REL]`; reads the record through
  `readFlatRecord(text, "current_test_state")` and validates 9 fields + identity agreement.
  Moving the block verbatim to a new file needs no parser change.
- `scripts/refresh-program-lock-facts.mjs` (225 lines): `CHANGES_PATH = "openspec/changes"`,
  `confinedPath(...)` fails closed if the directory is missing; `activeChanges` is the sorted
  non-`archive` directory names.
- `scripts/compute-candidate-identity.mjs` (302 lines): `PARTICIPATION_PATHS_V1` lists 8
  `openspec/` paths; `normalizeConfigYaml` and `normalizeApplyProgress` exist only for them.
- `capability-manifest.yaml` is JSON content behind a `.yaml` name (`parseJson` is used on it).
- CI (`ci.yml`, `style.yml`, `release-verify.yml`) never mentions `openspec` or runs
  `verify:capability`; the conformance check is developer-run only.
- Reference counts outside `openspec/`: docs 100+, tests 20, scripts 6, code comments 8.

### L3 — 2026-10-27 — decisions

- **D1** Pure relocation for the evidence record: the `current_test_state` values are moved
  unchanged (773/52 as recorded) so the migration is behaviour-preserving and reviewable.
  The recorded counts are stale versus the live suite (799/54); refreshing them is a separate
  follow-up, not this migration.
- **D2** Historical change-ID provenance comments in `lib/` and `extensions/` stay (S6).
- **D3** `activeChanges` keeps its field name and meaning ("feature documents with open work"),
  re-derived from `odd/tasks/*.md`.
- **D4** No subagent delegation is available in this runtime (`Permission denied: subagent`), so
  every task runs inline with bounded reads.
