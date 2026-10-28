# Feature: engram-pin-0.9.0

**Objective:** replace the untagged `0.2.1-SNAPSHOT-6a371a9` Drenyra Engram pin with the tagged release `v0.9.0`. This is a release of Drenyra Shell under `contracts/engram-dependency.md` rule 7.
**Branch:** `chore/engram-pin-0.9.0`
**Gates:** `typecheck`, `test`, `verify:style`, `verify:capability`, `verify:package`, `refresh:lock-facts --check`.

## Specs

- **S1 — "Drenyra-ai Drenyra-shell + Drenyra-engram esten bien sincornizados actualizados".** The Shell pins Drenyra Engram `v0.9.0`, the latest tagged release, instead of a commit snapshot.
- **S2 — Verified artifacts.** The four vendored tarballs (linux/darwin × amd64/arm64) are the GitHub Release `v0.9.0` assets. Each one verifies against the release `checksums.txt` and its SLSA attestation (`gh attestation verify`).
- **S3 — One source of truth, tested.** The checksum table in `contracts/engram-dependency.md` must equal `ENGRAM_PIN_CHECKSUMS`, and every vendored file must hash to its pinned value. A test enforces this; until now it was only a code comment.
- **S4 — The read surface still works.** `engram_context` and `engram_search` answer on the release binary with the exact call shape the Shell uses.
- **S5 — Contract and docs.** The contract version, artifact table, layout, and status rationale reflect a tagged release. A migration note and a CHANGELOG entry are added.

## Tasks

- [x] **T1** — RED: a test tying the contract table, `ENGRAM_PIN_CHECKSUMS`, `ENGRAM_PIN_BUILD`, and the vendored bytes together. *(S3)* — `d978875`
- [x] **T2** — Vendor the four v0.9.0 tarballs, update `runtime/engram-pin.ts`, the contract, and the README references. *(S1, S2, S5)* — `d978875`
- [x] **T3** — Live probe of the release binary through the Shell's real client path. *(S4)* — `d978875`
- [x] **T4** — CHANGELOG, content hashes, lock facts, gates, PR. *(S5)* — `d978875`

## Log

### L1 — 2026-10-27 — request (verbatim)

> yes te autorizo todo avanza ya que mi oobjetivo es que Drenyra-ai Drenyra-shell + Drenyra-engram esten bien sincornizados actualizados bien configurados 10/10 y eliminar sdd legacy full ODD de gentleman

### L2 — 2026-10-27 — version decision (verbatim)

The question was which Engram version is the real one. Answer:

> tu corrije , te autorizo todo avanza de forma autonoma

Decision: tag `v0.9.0`. Engram's `RELEASING.md` gives the Go engine (tags) and the TS reference package (`0.0.1-prealpha.x`) separate tracks, so the three numbers were never in conflict. v0.9.0 is the highest milestone already on `main`, and the CHANGELOG and ROADMAP already number the delivered work that way.

### L3 — 2026-10-27 — upstream work done for this pin

- drenyra-engram#55 (merge `bbfad20`): the CHANGELOG `v0.9.0` section, which discloses the lifecycle 0.1 → 0.5 change as breaking for v0.2.1 consumers. It also fixed the MCP `serverInfo.version`, which had been a hard-coded `const` (`0.3.0`) while goreleaser stamped the non-existent `main.version`; it is now a `var` stamped through ldflags.
- Tag `v0.9.0` pushed. The Release workflow succeeded, the first engine release with SLSA attestations; `v0.2.1` attestations had failed because the repository was private then.
- Release binary probe: `serverInfo` `{"name":"drenyra-engram","version":"0.9.0"}`; `engram_context` and `engram_search` return `isError=false` with `[]` on an empty database.

### L4 — 2026-10-27 — verification (`d978875`)

- T1 RED: only "pins the tagged v0.9.0 release" failed. The table-vs-pin and bytes-vs-pin tests passed against the snapshot, which shows they check real agreement, not the new values.
- T2: the four tarballs passed `sha256sum -c` (release `checksums.txt`) and `gh attestation verify -R arkelythex/drenyra-engram`. Vendored size ~21 MB (it was ~18 MB).
- T3: `spawnEngramClient` on the vendored linux_amd64 release binary returned `healthy`; `engram_context` and `engram_search` returned `isError=false`, `[]`.
- Gates: typecheck clean; `bun run test` 60 files / 866 passed; `verify:style`, `verify:capability`, `verify:package`, and `verify-packed-install` OK; lock facts current.
