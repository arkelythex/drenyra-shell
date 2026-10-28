# Feature: runtime-pin-0.5.0

**Objective:** move the pinned Drenyra AI runtime from `0.4.1` to the published `0.5.0` — a release of Drenyra Shell per `contracts/runtime-dependency.md` rule 6 — following `RELEASING.md` "Runtime pin bump procedure".
**Branch:** `chore/runtime-pin-0.5.0`
**Gates:** `typecheck`, `test`, `verify:style`, `verify:capability`, `verify:package`, `refresh:lock-facts --check`.

## Specs

- **S1 — "Drenyra-ai Drenyra-shell + Drenyra-engram esten bien sincornizados actualizados".** The Shell pins `drenyra-ai@0.5.0`, the latest published release.
- **S2 — Contract source.** The vendored tarball comes from the GitHub Release `v0.5.0` URL, and the release `checksums.txt` verifies it with zero failures.
- **S3 — Pin identity.** `RUNTIME_VERSION = "0.5.0"`, and `checksumSha256` is the SHA-256 of the release entry artifact `dist/cmd/cli.js`.
- **S4 — The ratchet moves in the same release.** The control mutation scoreboard is re-run against 0.5.0, and any changed verdict is updated in `__tests__/control-mutation.test.ts` and the docs.
- **S5 — Migration note.** CHANGELOG records the pin change and its contract impact.
- **S6 — Gates green.**

## Tasks

- [x] **T1** — Download and verify the release artifact. *(S2)* — `d496e2d`
- [x] **T2** — Vendor it, update the pin identity, manifest, references, and `bun.lock` (rebuild `dist` before install). *(S1, S3)* — `d496e2d`
- [x] **T3** — Re-run the mutation suite; update the ratchet and docs if verdicts moved. *(S4)* — `d496e2d`
- [x] **T4** — CHANGELOG migration note, content hashes, lock facts. *(S5)* — `d496e2d`
- [x] **T5** — Gates, PR. *(S6)* — `d496e2d`

## Log

### L1 — 2026-10-27 — request (verbatim)

> yes te autorizo todo avanza ya que mi oobjetivo es que Drenyra-ai Drenyra-shell + Drenyra-engram esten bien sincornizados actualizados bien configurados 10/10 y eliminar sdd legacy full ODD de gentleman

### L2 — 2026-10-27 — release authorization (verbatim)

The question asked whether to create the GitHub Release of drenyra-ai v0.5.0 from the existing tag and then bump the Shell pin. Answer:

> te autorizo todo y avanza

### L3 — 2026-10-27 — the artifact

The GitHub Release `v0.5.0` was created on 2026-10-27. Its tarball is the npm-published artifact byte for byte (`sha512-Kr90Ux6u…`). It carries stale files (`dist/drenyra-ai-0.4.0.tgz`, an unexported `dist/tenant/`, an old `dist/checksums.txt`) and has no Sigstore provenance, tracked upstream as arkelythex/drenyra-ai#126. The compiled code matches a clean rebuild of the tag.

### L4 — 2026-10-27 — verification (`d496e2d`)

- T1: the GitHub Release `v0.5.0` `checksums.txt` verified the tarball, `sbom.json`, and 677 `dist/` files with zero failures. Entry artifact `cmd/cli.js` = `a40ba4c7…2f65`.
- The entry checksum changed for the first time since 0.3.0. The lock-facts generator preserves `pinEntrySha256` and failed closed ("does not match the package trust anchor") until the preserved field and `PIN_ENTRY_SHA256` both moved. That step was missing from the documented procedure; it is now in `RELEASING.md`.
- Gates: typecheck clean; `bun run test` 60 files / 863 passed; `verify:style` OK; `verify:capability` OK; `verify:package` OK (vendored runtime reconciled with the pin); `verify-packed-install` OK (postinstall installed and verified 0.5.0 in a clean consumer); lock facts current.
- T3: `bun run eval:controls` against 0.5.0 gives 18/25 (7200 bps) and 0/3 false alarms. The ratchet passes unchanged, and the seven survivors persist (drenyra-ai#123).
- A local `bun install` in the development tree printed an npm arborist error (`Cannot destructure property 'package' of 'node.target'`) from a `node_modules` with 93 broken links. It does not reproduce on a clean `main` worktree or in the packed install. Not a regression.
