# Feature: runtime-pin-0.8.0

**Objective:** pin `drenyra-ai@0.8.0`, which requires a reference instant `asOf` on journal entries (drenyra-ai#162). The Shell passes its own clock, and the control mutation ratchet moves to 24/25. Kernel side: drenyra-ai `odd/tasks/journal-reference-instant.md`.
**Branch:** `chore/runtime-pin-0.8.0` · **Upstream:** arkelythex/drenyra-ai#123, #162
**Gates:** `typecheck`, `test`, `verify:style`, `verify:capability`, `verify:package`, `verify-packed-install`, `refresh:lock-facts --check`.

## Specs

- **S1** — Owner: "perfecto avanza"; design: "Obligatorio: fail-closed (recomendado)". The Shell consumes a kernel that rejects entries without `asOf` and evidence captured after it.
- **S2** — `propose_journal_entry` supplies `asOf` from the harness clock at call time. An agent-supplied `asOf` is ignored, and the tool schema does not expose it.
- **S3** — `JournalProposalRequest` carries `asOf`, and `proposeJournalEntry` forwards it unchanged. Pi adds no clock check of its own (AGENTS.md rule 1): the kernel decides.
- **S4** — The mutation corpus baseline fixes `asOf`, so the scoreboard never depends on the wall clock. The corpus stays at 25 defects and 3 valid variants. The ratchet moves to 24/25 (9600 bps) with 0/3 false alarms; the only survivor is `ruc-wrong-check-digit`.
- **S5** — Pin identity and the vendored artifact follow `RELEASING.md` "Runtime pin bump procedure". CHANGELOG records the migration.

## Tasks

- [x] **T1** — RED: tool, lib, and ratchet tests against the 0.7.0 pin. *(S2, S3, S4)* — `ce119d2`
- [x] **T2** — GREEN: request field, tool clock, corpus `asOf`; vendor and pin 0.8.0. *(S2–S5)* — `ce119d2`
- [x] **T3** — Docs, CHANGELOG, lock facts, gates, PR, merge. *(S5)* — `ce119d2`, PR #102

## Log

### L1 — 2026-10-28 — request (verbatim)

> perfecto avanza

### L2 — 2026-10-28 — design decision (verbatim)

> Obligatorio: fail-closed (recomendado)

### L3 — 2026-10-28 — Shell decisions

- **D1 — The harness owns `asOf`.** If the agent could choose it, it could move "now" past any capture date and switch the kernel check off. So the tool sets `new Date().toISOString()` and ignores the parameter.
- **D2 — No new mutant for a missing `asOf`.** The harness supplies it, so an agent cannot inject that defect. Adding a case would move the metric without measuring anything new.

### L4 — 2026-10-28 — T1 RED / T2 GREEN

- RED against the 0.7.0 pin, 8 failed and 22 passed. Failing: the tool future-evidence verdict, the ignored agent `asOf`, lib `future-evidence` and `invalid-as-of`, and the 4 ratchet rows. Passing: the schema-without-`asOf` and capture-at-`asOf` preservation cases.
- Release `v0.8.0`, a signed tag on drenyra-ai `316daf6`, ran release run 40817695589: `publish` and `github-release` succeeded. The npm `dist.integrity` (`sha512-lr0dQ7WL…tRfSQ==`) matches the Release tarball, and the provenance is SLSA v1. 663 `dist/` entries plus the tarball verified with 0 failures. `cmd/cli.js` is unchanged (`a40ba4c7…2f65`).
- GREEN: vendored `drenyra-ai-0.8.0.tgz` (`e80ab35c…d546`) with the reviewed 20-file sweep, the pin docblock, the scoreboard docs, and the README. The tool, lib, ratchet, and pin tests pass 39/39, and typecheck is clean. `bun run eval:controls` printed `detection: 24/25 defects rejected (9600 bps)` and `false alarms: 0/3 valid entries rejected (0 bps)`; the only survivor is `ruc-wrong-check-digit`. The development-tree postinstall printed the known arborist error again (`Cannot destructure property 'package' of 'node.target'`); `verify-packed-install` is the clean-path proof.

### L5 — 2026-10-28 — gates

One `set -euo pipefail` run exited 0: typecheck clean; `bun run test` 60 files / 872 passed (866 + 6 new); `verify:style`, `verify:capability`, `verify:package` OK; `verify-packed-install` OK (postinstall verified the runtime under Node in a clean consumer); lock facts current at the documented fixed point.

### L6 — 2026-10-28 — CI incident on PR #102

On `ce119d2`, `typecheck`, `test`, and `style` passed, and `package` failed in `verify-packed-install`. The cause was `npm error 404 Not Found - GET https://registry.npmjs.org/@types/estree/-/estree-1.0.10.tgz`, a third-party transitive package. `@types/estree@1.0.10` was published at 2026-10-29T04:34:28Z, 30 s before the CI install, and was already `latest`. Its tarball still returned 404 at 04:35:52Z, while 1.0.9 returned 200: a registry propagation race, not a defect in this change. The local run of the same gate passed. Decision: rerun the failed job on the same commit once the tarball serves 200. No code, lockfile, or version pin was changed to work around it.

### L7 — 2026-10-28 — CI green and close

The `@types/estree@1.0.10` tarball began serving 200 at 04:39:41Z. A rerun of only the failed job on the same commit `ce119d2` passed. PR #102 CI on `ce119d2`: `package`, `style`, `test`, and `typecheck` passed. Risk: item 5 (runtime release and pin). This change was not independently verified by a separate subagent; the evidence is the observed RED and GREEN, the full local gates, the PR CI, and the release provenance and checksums. ENG T5 stays out of scope.
