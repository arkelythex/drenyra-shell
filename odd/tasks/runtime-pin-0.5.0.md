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

- [ ] **T1** — Download and verify the release artifact. *(S2)*
- [ ] **T2** — Vendor it, update the pin identity, manifest, references, and `bun.lock` (rebuild `dist` before install). *(S1, S3)*
- [ ] **T3** — Re-run the mutation suite; update the ratchet and docs if verdicts moved. *(S4)*
- [ ] **T4** — CHANGELOG migration note, content hashes, lock facts. *(S5)*
- [ ] **T5** — Gates, PR. *(S6)*

## Log

### L1 — 2026-10-27 — request (verbatim)

> yes te autorizo todo avanza ya que mi oobjetivo es que Drenyra-ai Drenyra-shell + Drenyra-engram esten bien sincornizados actualizados bien configurados 10/10 y eliminar sdd legacy full ODD de gentleman

### L2 — 2026-10-27 — release authorization (verbatim)

The question asked whether to create the GitHub Release of drenyra-ai v0.5.0 from the existing tag and then bump the Shell pin. Answer:

> te autorizo todo y avanza

### L3 — 2026-10-27 — the artifact

The GitHub Release `v0.5.0` was created on 2026-10-27. Its tarball is the npm-published artifact byte for byte (`sha512-Kr90Ux6u…`). It carries stale files (`dist/drenyra-ai-0.4.0.tgz`, an unexported `dist/tenant/`, an old `dist/checksums.txt`) and has no Sigstore provenance, tracked upstream as arkelythex/drenyra-ai#126. The compiled code matches a clean rebuild of the tag.
