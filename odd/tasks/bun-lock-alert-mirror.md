# Feature: bun-lock-alert-mirror

**Objective:** give Drenyra Shell a Dependabot alert source that describes the tree CI installs. GitHub's dependency graph cannot read `bun.lock`, and the Shell has no `package-lock.json`, so today no transitive dependency is visible to alerts. Generate the mirror from `bun.lock` with the script drenyra-ai adopted (arkelythex/drenyra-ai#165, #167), check it in CI, and move Dependabot to the `bun` ecosystem that CI actually installs.
**Branch:** `ci/bun-lock-alert-mirror`
**Gates:** `typecheck`, `test`, `verify:style`, `verify:capability`, `verify:package`, `verify-packed-install`, `refresh:lock-facts --check`, `npm ls --all --package-lock-only`, `npm audit --package-lock-only`.

## Specs

- **S1** — Owner: "te autorizo todo y avanza de forma autonoma", after the proposal "Que el espejo de alertas no se vuelva a desincronizar … Con eso se arregla la causa, no solo el síntoma."
- **S2** — `scripts/sync-alert-mirror.mjs` is carried byte-for-byte from drenyra-ai, its origin is recorded, and its subprocess tests run here. `bun run deps:mirror` writes `package-lock.json` from `bun.lock`, including the vendored `drenyra-ai` tarball (version read from the archive, integrity verified).
- **S3** — CI runs `node scripts/sync-alert-mirror.mjs --check`, and a stale mirror fails the build.
- **S4** — `.github/dependabot.yml` uses the `bun` ecosystem for npm packages, so version-update PRs edit `bun.lock`, the file `bun install --frozen-lockfile` reads. Its comment documents the mirror refresh.
- **S5** — The generated mirror is valid (`npm ls --all --package-lock-only` exits 0), and its `name@version` set equals `bun.lock`'s. Any advisory it reveals is reported, and fixed in the same change when the fix stays inside declared ranges.

## Tasks

- [x] **T1** — RED: carry the subprocess tests, expecting the missing script. *(S2)* — `d420e88`
- [x] **T2** — GREEN: carry the script, add `deps:mirror`, generate the mirror, validate with npm, audit. *(S2, S5)* — `d420e88`
- [x] **T3** — CI step, `dependabot.yml`, docs, CHANGELOG, lock facts, gates, PR, merge. *(S3, S4)* — `d420e88`, PR #103

## Log

### L1 — 2026-10-29 — request (verbatim)

> te autorizo todo y avanza de forma autonoma

### L2 — 2026-10-29 — evidence

- GitHub's dependency graph for this repository lists `package.json` and workflows only; `bun.lock` is absent and there is no `package-lock.json`. The 0 open Dependabot alerts therefore cover nothing transitive.
- `.github/dependabot.yml` uses the `npm` ecosystem while every CI job runs `bun install --frozen-lockfile`. drenyra-ai left `npm` for exactly this reason: its updates touch npm files, not `bun.lock`.
- The drenyra-ai script ran `--check` against this tree. It verified the vendored `drenyra-ai-0.8.0.tgz` against bun's integrity, found no unrepresentable sources, and exited 1 only because the mirror is absent.

### L3 — 2026-10-29 — T1 RED, T2 GREEN

- RED: all 19 carried subprocess tests failed on the missing `scripts/sync-alert-mirror.mjs`. One adaptation: `REPO_ROOT` resolves `..`, because `__tests__/` sits at this repository's root.
- GREEN: the script was copied below a two-line origin note, and its body is byte-identical to drenyra-ai `main` after #167 (`7ebea0a`); a `diff` confirmed it. 19/19 tests pass. `bun run deps:mirror` wrote 108 packages, and `npm ls --all --package-lock-only` exits 0. The `name@version` sets match; the only notational difference is `drenyra-ai`, which bun writes as `@./vendored/drenyra-ai-0.8.0.tgz` and the mirror as `0.8.0`.
- **Revealed advisories** (all in the development tree): `fast-uri@3.1.5` (10, 5 high; through the vendored runtime's `ajv`), `vite@8.3.0` (6, 1 high), `source-map-js@1.2.1` (1 high), and `@vitest/mocker`/`vitest@5.0.1` (2 moderate). Fixed with `bun add -d vitest@^5.0.5` and `bun update fast-uri source-map-js vite`. `vite` is a direct dev dependency here, so its range moved from `^8.3.0` to `^8.3.5`. After regenerating: 106 packages, `found 0 vulnerabilities`, and `npm ls` exits 0.

### L4 — 2026-10-29 — gates

One `set -euo pipefail` run exited 0. `bun install --frozen-lockfile`: clean. Typecheck: clean. `--check`: the mirror is current (106 packages). `bun run test`: 61 files / 891 passed (872 + 19). `verify:style`, `verify:capability`, `verify:package`: OK. `verify-packed-install`: OK. Lock facts: current at the documented fixed point (`activeChanges` = `bun-lock-alert-mirror`).

### L5 — 2026-10-29 — slice boundary, CI, close

- `d420e88` is ~800 authored lines, past the ~400-line guide. About 520 of them are `scripts/sync-alert-mirror.mjs` and its tests, carried byte-for-byte from arkelythex/drenyra-ai, where they were reviewed and passed CI in #165 and #167. The rest is new: CI, Dependabot, docs, lock facts, and this document. It stays one commit, because the carried script is only meaningful together with the mirror it generates and the check that enforces it.
- PR #103 CI on `d420e88`: `package`, `style`, `test`, and `typecheck` passed, and `typecheck` now includes the mirror `--check`.
- Risk: item 5 (CI and dependency pipeline). There was no separate independent verifier. The evidence is the observed RED and GREEN, the full local gates, the PR CI, `npm ls`, and `npm audit`.
