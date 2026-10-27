# Drenyra Pi → Drenyra Shell rename

## Objective

Rename the project from "Drenyra Pi" (`drenyra-pi`) to "Drenyra Shell" (`drenyra-shell`), mirroring the sibling project's rename from `gentle-pi` to `gentle-shell` (`https://github.com/Gentleman-Programming/gentle-shell`, verified via `gh api` — same repo id/org, GitHub redirect confirms the history). Drenyra Shell is to accounting what Gentle Shell is to software engineering; Drenyra AI remains the pinned fiscal-authority runtime this harness consumes (unchanged).

## Why

User-requested full technical rename, not a cosmetic doc pass — confirmed via two scoped decisions:
1. Full technical rename (package identity, code identifiers, contracts, CI) vs. docs-only — user chose **full technical rename**.
2. `openspec/` archived change history (17 closed folders, 94 references) — user chose **rewrite the full archive**, not just active specs.

## Scope / constraints

- Branch: `chore/rename-drenyra-shell` (created off latest `origin/main`, since the prior checked-out branch `docs/align-skill-ownership-v2` was unrelated).
- `contracts/package-contract.md`, `contracts/runtime-dependency.md`, `contracts/engram-dependency.md` are marked `Status: frozen`. Per `AGENTS.md` rule 6, prose edits there still require a version bump + migration note. All mentions are narrative only — verified none of the 10 `contracts/*.schema.json` files or `contracts/SHA256SUMS.json` contain `drenyra-pi` (no schema-shape change). Bump `v0.1` → `v0.2` with a one-line migration note: "Drenyra Pi renamed to Drenyra Shell; no schema/field changes."
- ~~`lib/configurator.ts` uses the literal string `"drenyra-pi"` as the **host id**... rename to `"drenyra-shell"`~~ — **superseded by a verified finding in T2**: the host id is a closed `HostName` union owned by the pinned external `drenyra-ai@0.4.1` kernel, not by this package. It stays `"drenyra-pi"` until a future `drenyra-ai` release adds `"drenyra-shell"`. No CHANGELOG migration note needed for local install directories — nothing on disk changes yet.
- The `package.json` `"pi"` config block (top-level key, `extensions`/`prompts`/`skills`/`themes` sub-keys) is a manifest field name defined by the external `@earendil-works/pi-coding-agent` host schema — **do not rename this key**, it is not an instance of the product name.
- `.pi/` (untracked local tool state) and `@drenyra/pi` (a different, already-defunct package this repo was extracted from, referenced only in lineage docs) are out of scope — do not touch.
- `dist/`, `.codegraph/`, `.atl/` are git-ignored generated output — no manual edits; rebuild after source changes land.
- GitHub repo rename (`arkelythex/drenyra-pi` → `drenyra-shell`) is an external/shared action — **not executed by the agent**. Hand the user the exact command; GitHub auto-redirects the old name (confirmed pattern from `gentle-pi`).
- `bun install` must be re-run after `package.json`'s `"name"` changes so `bun.lock`'s root self-reference stays consistent.
- Delivery: forecast is large (444+ matches across 128+ tracked files, plus 8 renamed asset files, plus 94 openspec references across 17 archived folders). Default delivery strategy is `ask-on-risk`; will ask once for chain strategy (stacked-to-main vs. feature-branch-chain) when the running changed-line count crosses ~400 and before the delivery budget forces a decision.

## TDD mode

Not resolved from project config as test-first; this is a mechanical identifier rename with existing test coverage. Mode: run existing test suite (`bun test`) after each work unit as the functional check — RED before edit is not meaningful here since no new behavior is introduced, only identifier renames. Any test whose assertion string still says `drenyra-pi` after a work unit is expected to fail and must be updated in the same or immediately following work unit before the commit closes.

## Tasks

- [x] **T1 — Governance/identity core** — Route: delegated writer (7+ files) — done, commit `d35426d`, `bunx vitest run` 44/44 passed.

**Delivery strategy** (asked when running total crossed ~400 changed lines after T2): single PR at the end, covering all work-unit commits on `chore/rename-drenyra-shell`. Not `stacked-to-main`/chained.
  `package.json` (name, description, postinstall string), `openspec/config.yaml` (name, repository, package_kind comment), `capability-manifest.yaml` (name/package fields) + `__tests__/capability-manifest.test.ts` fixtures, `CODEOWNERS` comment, `.github/workflows/release-verify.yml` (repo gate condition) + `__tests__/release-verify-workflow.test.ts` assertion, `.github/ISSUE_TEMPLATE/bug_report.yml` + `feature_request.yml`.

- [x] **T2 — Runtime identifier surface** — Route: delegated writer (largest blast radius) — done, commit `6bea74c`. **Finding: the on-disk host-id string stays `"drenyra-pi"`** — it's a closed `HostName` union in the pinned external `drenyra-ai@0.4.1` kernel (`node_modules/drenyra-ai/dist/configurator/managed-config.d.ts`), not defined by this package. Renaming it requires a future `drenyra-ai` release adding `"drenyra-shell"` to `HostName`/`HOST_DIR_MAP`; until then it is not Pi's call per AGENTS.md rule 1. This invalidates the host-id migration-note assumption below — no local-install migration note is needed yet, since the on-disk directory key is unchanged. `bunx tsc --noEmit` clean, `bunx vitest run`: 795/799 passed, 4 pre-existing unrelated failures in `__tests__/lock-facts.test.ts` (HEAD-ancestor staleness check against `docs/architecture/program-lock-facts.json`, unrelated to the rename — file has zero drenyra-pi/drenyra-shell references, confirmed via grep; expected to need its own regeneration pass before merge, tracked as T8 below, not part of this rename's scope).
  `extensions/register.ts` (`DRENYRA_PI_VERSION`, extension id string `"drenyra-pi"`, `registerDrenyraPiExtension`, `DrenyraPiExtensionDescriptor`, `DrenyraPiExtensionDeps`, JSDoc gentle-pi references incl. stray absolute path), `index.ts` (re-exports), `lib/configurator.ts` (host id string — see migration note above), `runtime/engram-client.ts` (MCP clientInfo.name), `scripts/install-drenyra-ai.mjs`, `scripts/verify-packed-install.mjs` (tarball naming), `scripts/build.mjs`, `scripts/lib/package-verify.mjs`, `scripts/verify-package-files.mjs`, `scripts/verify-style.mjs`, `scripts/verify-capability-manifest.mjs` (comments), plus every test importing `registerDrenyraPiExtension` or asserting `"drenyra-pi"`: `__tests__/extension.test.ts`, `configurator.test.ts`, `evidence-status.test.ts`, `extension-mission-commands.test.ts`, `extension-close.test.ts`, `context.test.ts`, `resolve.test.ts`, `trusted-key-registry.test.ts`, `installer.test.ts`, `authority-store.test.ts`, `doctor.test.ts`, `status.test.ts`, `evidence-graph.test.ts`, `receipt-verification.test.ts`, `helpers/fixture-runtime.ts`, `harness-version.test.ts`, `package-verify.test.ts` (temp-dir prefixes, cosmetic).
  Also sweep JSDoc/comment prose beyond literal identifiers: `runtime/pin.ts`, `runtime/doctor.ts`, `runtime/context.ts`, `runtime/resolve.ts`, `runtime/installer.ts`, `lib/parse.ts`, `extensions/fiscal-guard.ts`, `extensions/mission-status.ts`, `extensions/startup-panel.ts`.
  Naming convention: `registerDrenyraPiExtension` → `registerDrenyraShellExtension`, `DrenyraPiExtensionDescriptor` → `DrenyraShellExtensionDescriptor`, `DrenyraPiExtensionDeps` → `DrenyraShellExtensionDeps`, `DRENYRA_PI_VERSION` → `DRENYRA_SHELL_VERSION`.

- [x] **T3 — Frozen contracts version bump** — Route: delegated writer (small, high governance weight) — done, commit `0a9b4af`. Correction found and verified: `engram-dependency.md` is genuinely "tracked, not frozen" (its own D2 decision), not frozen as this doc originally assumed — only its prose was updated, its pinned-build version field left untouched. `SHA256SUMS.json` regenerated via `verify-package-files.mjs --update`, confirmed only the 4 edited files' hashes changed.
  `contracts/package-contract.md`, `contracts/runtime-dependency.md`, `contracts/engram-dependency.md`: bump `v0.1` → `v0.2`, add migration note, update all `drenyra-pi`/`Drenyra Pi`/`Gentle Pi` prose. `contracts/engram-dependency.md` also has a literal `drenyra-pi/` path fragment in an install-tree diagram — update to `drenyra-shell/`. `contracts/README.md` (not itself frozen) — update prose to match.

- [x] **T4 — Branding assets** — Route: delegated writer (mechanical file renames) — done, commit `6a84d96`, all 8 files confirmed as clean git renames.
  `git mv` the 8 `assets/branding/drenyra-pi-*.{svg,png}` files to `drenyra-shell-*`, update references in `README.md` and `assets/branding/BRAND.md`. While in `BRAND.md`, fix the pre-existing dangling reference to `assets/branding/drenyra-pi-banner.png` (file doesn't exist — flag or remove, don't invent a new asset).

- [x] **T5 — Prose sweep (root + docs + agents + skills + prompts + themes)** — Route: delegated writer, likely split into 2 work units by size — done, commit `5234688` (2 parallel writers, T5a root docs + T5b docs/agents/skills/prompts/themes, disjoint file sets). Fixed one stale cross-reference myself (`docs/architecture/ecosystem-boundaries.md` still said contracts "frozen at v0.1" after T3's v0.2 bump). Spot-checked reconstructed ASCII box diagrams in `docs/architecture.md`/`dependency-direction.md` for character-width alignment — confirmed correct. `bunx vitest run`: 795/799, same 4 pre-existing lock-facts failures as after T2, no new regressions.
  Root: `README.md` (incl. the "and the name says so" sentence at line ~206 — needs an actual rewrite, not mechanical find/replace), `ROADMAP.md`, `CHANGELOG.md` (add rename entry + migration notes for host-id and contracts bump), `RELEASING.md`, `CONTRIBUTING.md`, `SECURITY.md`, `AI_POLICY.md`.
  `docs/`: `architecture.md`, `style.md`, `CODEBASE-GUIDE.md`, `intended-usage.md`, `architecture/dependency-direction.md`, `ecosystem-boundaries.md`, `harness-draft-conformance.md`, `legacy-capability-surface-inventory.md`, `rda-adapter-boundary.md`, `rda-adapter-boundary-audit.md`, `capability-conformance-matrix.md`, `trust-model.md`.
  `agents/` + `assets/agents/` (duplicate pair — update both trees together): all subagent spec files + `agents/README.md`.
  `skills/`: `README.md`, `scope-discipline/SKILL.md`, `evidence-citation/SKILL.md`, `chain-operation/SKILL.md` (leave `drenyra-sdd/SKILL.md`'s external `packages/pi/src/phase/` path reference — different repo, out of scope).
  `prompts/persona.md` (title), `prompts/README.md`, `themes/README.md`, `themes/fiscal-operator/README.md`, `chains/README.md`, `assets/README.md`, `assets/policies/README.md`.
  Fold in the stale `gentle-pi` → `gentle-shell` corrections found during exploration (same files: `README.md:14`, `CHANGELOG.md:116`, `contracts/runtime-dependency.md:5` [covered by T3], `docs/architecture/ecosystem-boundaries.md:9`, `docs/intended-usage.md:14`, `extensions/register.ts` JSDoc [covered by T2]).

- [x] **T6 — openspec full sweep (decision: rewrite full archive)** — done, commit `35d47f3`. Split into 3 parallel writers (T6a active specs, T6b + T6c archive folders, ~8 folders each by size). **Correction found and applied**: T6b independently discovered — verified via a repo-wide grep sweep — that archive folder *directory names* (e.g. `2026-08-15-pi-sdd-030-routing-adapter`) are cited as literal evidence-identifier strings in live source (`lib/mission-commands.ts`, `lib/routing/*.ts`), tests, `capability-manifest.yaml`, and several `docs/architecture/*.md` files — not just prose. T6b correctly left its 8 folders unrenamed (content-only). T6c had already renamed its 8 folders before this was known; I reverted all 8 `git mv`s back to original names (content edits preserved) for consistency and citation integrity. Only 16 archive folder *names* stay as `pi-*`; all their *content* now says "Drenyra Shell". `bunx vitest run`: 795/799, same 4 pre-existing T8 failures, no new regressions (one transient double-count re-run was a flake, confirmed stable on re-run).
  Not done (deliberately out of the literal 3-pattern scope, flagged by T6c, low priority): 2 stray `gentle-pi` mentions in `2026-09-14-pi-recovery-release-readiness/apply-progress.md` (injected status-tool labels, not this rename's product-name pattern).

- [x] **T7 — External coordination** — done, with explicit user authorization ("te autorizo y avanza todo de forma autonoma"). `gh repo rename drenyra-shell --repo arkelythex/drenyra-pi` executed; local `origin` remote updated to `git@github.com:arkelythex/drenyra-shell.git`; branch pushed; PR opened using the repo's real `.github/PULL_REQUEST_TEMPLATE.md` (the generic `branch-pr` skill didn't match this repo's actual conventions — no issue-approval/type-label automation here — so its template was not used, only its Conventional Commits/no-AI-attribution spirit). **PR: https://github.com/arkelythex/drenyra-shell/pull/80**, open, mergeable, targeting `main`. Full pre-PR check suite green: `typecheck`, `test` (799/799), `verify:capability`, `verify:style`, `verify-packed-install` (packs as `drenyra-shell-0.1.0.tgz`) all OK.
  Remaining: `bun install` to refresh `bun.lock`'s root self-reference after merge, then rebuild — left for after merge since `dist/`/`bun.lock` regeneration on an unmerged branch would just be redone.

- [x] **T8 — Lock-facts + candidate-identity regeneration** — done, commit `2cb030d`. Ran `bun run refresh:lock-facts`; also had to update `openspec/config.yaml#/current_test_state.candidate_identity` (a second, separate self-referential snapshot pointer, not caught by the lock-facts refresh alone) — confirmed via a throwaway `origin/main` worktree that `verify-capability-manifest.mjs` passes there today, so this staleness was caused by this rename's own edits, not pre-existing. Iterated to a verified fixed point (re-running `compute-candidate-identity.mjs` twice gives the same hash). `bunx vitest run`: **799/799 passing**. `verify-capability-manifest` and `verify-package-files`: OK.
  Follow-up final sweep (commit `bd69908`): found and fixed 2 more leftover mentions (`.prettierignore` header comment, and a doc quoting `capability-manifest.yaml`'s `derivedFrom` field that had drifted stale after T1's rename of the actual field).

## Acceptance criteria

- `bun test` passes with no `drenyra-pi` assertion left unintentionally (temp-dir prefixes may be renamed too, but a leftover cosmetic prefix mismatch is not a functional failure).
- `rg -i "drenyra-pi" --hidden -g '!node_modules' -g '!dist' -g '!.codegraph' -g '!.atl' -g '!bun.lock'` returns zero matches outside explicitly out-of-scope files (`.pi/`, `@drenyra/pi` lineage mentions, `vendored/*.tgz` filenames).
- `contracts/*.md` frozen files show `v0.2` with a migration note; `contracts/SHA256SUMS.json` re-generated if the verify script requires it.
- CHANGELOG documents: the rename itself, the host-id migration note (existing local installs), and the contracts version bump.
- Each work unit is its own Conventional Commit on `chore/rename-drenyra-shell`.

## Progress

- 2026-09-21 — Branch `chore/rename-drenyra-shell` created off `origin/main`. Task file created. No source edits yet.

## Next step

Start T1 (governance/identity core) — smallest, highest-consequence-if-missed, unblocks the rest.
