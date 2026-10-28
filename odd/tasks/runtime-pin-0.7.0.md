# Feature: runtime-pin-0.7.0

**Objective:** continue the control mutation suite. Release `drenyra-ai@0.7.0` (which carries the kernel fixes of drenyra-ai#131) after the documentation chain lands on its `main`, then pin it in the Shell and move the ratchet from 18/25 to the newly measured scoreboard, following `RELEASING.md` "Runtime pin bump procedure".
**Branch:** `chore/runtime-pin-0.7.0` · **Upstream:** arkelythex/drenyra-ai#123, #131
**Gates:** `typecheck`, `test`, `verify:style`, `verify:capability`, `verify:package`, `refresh:lock-facts --check`.

## Specs

- **S1 — "continue , suite de mutaciones".** The control mutation scoreboard is re-measured against a published kernel that contains drenyra-ai#131.
- **S2 — Release order: "Release 0.7.0 después de la cadena de docs (recomendado)".** `drenyra-ai@0.7.0` is released only after the documentation chain (tracker drenyra-ai#134) is merged to `main`. The release goes through its normal version PR, a `v0.7.0` tag, and the OIDC release workflow. No force-push, admin bypass, or interference with the other session's chain.
- **S3 — Pin identity.** The vendored tarball comes from the GitHub Release `v0.7.0` and verifies against its `checksums.txt` with zero failures. `RUNTIME_VERSION = "0.7.0"`, and `checksumSha256` is the SHA-256 of the release entry artifact.
- **S4 — The ratchet moves in the same release.** `__tests__/control-mutation.test.ts`, `docs/evals/control-mutation.md`, and the README report the re-measured scoreboard and the remaining survivors with their mitigations. The kernel still decides; Pi adds no fiscal check (AGENTS.md rule 1).
- **S5 — Migration note.** CHANGELOG records the pin change, the stricter kernel behavior, and the scoreboard change.
- **S6 — Gates green; one PR** with Conventional Commits.

## Tasks

- [x] **T1** — Wait for the documentation chain (drenyra-ai#134) to merge to `main`. *(S2)* — `8e0fa28` (drenyra-ai)
- [x] **T2** — drenyra-ai: version PR `0.7.0` (package version + CHANGELOG section), merged. *(S2)* — drenyra-ai#158, `2ebd989`
- [x] **T3** — drenyra-ai: push the `v0.7.0` tag; observe the release workflow, npm provenance, and the GitHub Release. *(S2, S3)* — tag `v0.7.0`, run 40774240267
- [x] **T4** — Shell: download, verify, and vendor the artifact; update the pin identity, manifest, references, lock facts. *(S3)* — runtime pin commit
- [x] **T5** — Shell: re-run the suite (RED on the old ratchet), update the ratchet, docs, README. *(S1, S4)* — runtime pin commit
- [ ] **T6** — CHANGELOG migration note, gates, PR. *(S5, S6)*

## Log

### L1 — 2026-10-28 — request (verbatim)

> continue , suite de mutaciones
>   ▎ ⊘ ENG T5: migrar
>   ▎ fiscal-runtime-foundations tras integrar
>   ▎ stack fiscal · Espera revisión e
>   ▎ integración del stack Engram #35–39; fuera
>   ▎ de esta release.

ENG T5 stays out of scope, as its note says.

### L2 — 2026-10-28 — state found

- Shell pin `drenyra-ai@0.6.0`: `bun run eval:controls` prints `detection: 18/25 defects rejected (7200 bps)` and `false alarms: 0/3 valid entries rejected (0 bps)`.
- drenyra-ai#131 (five of the seven #123 gaps) merged to `main` at `7b18a6b` after `v0.6.0` was released. Its PR body reports 23/25 (9200 bps), 0/3 false alarms, measured in a scratch build. The RUC check digit and the future `capturedAt` stay deferred on purpose.
- drenyra-ai documentation chain #134–#157 is still open (tracker draft), being integrated by another session whose authorization excludes releases.

### L3 — 2026-10-28 — release decision (verbatim)

The question asked how to continue, since pinning needs a published kernel and publishing is irreversible. Answer:

> Release 0.7.0 después de la cadena de docs (recomendado)

### L4 — 2026-10-28 — autonomy (verbatim)

After learning that drenyra-ai U4 (publish #134–#157) was already complete and the other session was in U6 (8/24 children merged into the tracker), the owner answered:

> oh genia entonces esprar y continuar de forma autonma

This session waits for #134 to merge, then runs T2–T6 without further prompts. It does not take over the chain integration.

### L5 — 2026-10-28 — T1/T2 evidence

- T1: tracker drenyra-ai#134 merged at 2026-10-28T21:34:55Z as `8e0fa28`; CI and Docs on that commit succeeded.
- T2: an unpublished preparation commit from an earlier session (`chore/release-0.7.0` in the `drenyra-ai-kernel-gaps` worktree) was rebased onto `8e0fa28` with no conflicts. Release gates exited 0 (typecheck, lint, `verify:package`, packed-install). Opened as drenyra-ai#158 (`7fe19f0`), `Refs #123`. It does not close #123, because two survivors stay deferred.

### L6 — 2026-10-28 — T5 RED

`__tests__/control-mutation.test.ts` now expects the 0.7.0 scoreboard. The new kill codes come from drenyra-ai#131: `invalid-amount`, `invalid-account`, `invalid-entry-id`, `missing-evidence`, `INVALID_ITEM`. Against the 0.6.0 pin, 4 of 14 fail for the expected reason: 18 kills where 23 are expected, 7 survivors where 2 are expected, and `detection: 23/25` absent. The other 10 pass.

### L7 — 2026-10-28 — T2–T5 evidence

- T2: drenyra-ai#158 passed 9/9 checks and was merged with an ordinary merge commit, pinned to the reviewed head `7fe19f0`, as `2ebd989`.
- T3: a GPG-signed tag `v0.7.0` on `2ebd989` (`git tag -v`: good signature), matching the signed `v0.6.0`. Release run 40774240267: `publish` and `github-release` both succeeded. The npm `dist.integrity` matches the GitHub Release tarball (`sha512-g37SgGsF…uKXA==`), and npm reports SLSA v1 provenance. The release `checksums.txt` verified all 664 entries with zero failures. The tarball line was checked from its own directory; run from `dist/`, it first showed as unreadable because of the relative path. Entry artifact `cmd/cli.js` = `a40ba4c7…2f65`, unchanged, so the trust anchor stays.
- T4: vendored `drenyra-ai-0.7.0.tgz` (`fe003fab…370e`), with the pin, docblock, and a reviewed 0.6.0 → 0.7.0 sweep across 20 files. The tarball hash and the two contract hashes were regenerated with `verify-package-files --update`. A stale checksum `09df8d69…5b7600` in `docs/CODEBASE-GUIDE.md` was corrected in passing. `bun install` linked 0.7.0. The development tree's npm-based postinstall then failed with the known arborist error (`Cannot destructure property 'package' of 'node.target'`, 92 broken links), the same error recorded in runtime-pin-0.5.0 L4. The packed install proves the clean path.
- T5 GREEN: `control-mutation` + `pin`, 23/23 passed. `bun run eval:controls` printed `detection: 23/25 defects rejected (9200 bps)` and `false alarms: 0/3 valid entries rejected (0 bps)`. Two survivors remain, `future-capture-date` and `ruc-wrong-check-digit`, and all five predicted kill codes matched.
