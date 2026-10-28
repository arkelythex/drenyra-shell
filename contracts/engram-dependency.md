# Contract: engram-dependency

> Version: 0.9.0 · Status: tracked, not frozen (tagged 0.x release) · Applies to: Drenyra Shell ↔ Drenyra Engram.

This contract defines how Drenyra Shell consumes the `drenyra-engram` binary. It follows the same **exact, verified, package-local** discipline [`runtime-dependency`](runtime-dependency.md) establishes for Drenyra AI — but the artifact shape is different: `drenyra-engram` is a **compiled Go binary spawned as an MCP child process**, not an npm-imported library, so it needs a per-platform pin instead of one portable tarball.

## Why `tracked, not frozen`, unlike `runtime-dependency`'s `frozen`

The pin is now a tagged GitHub Release (`v0.9.0`, with SLSA provenance attestations), not a commit snapshot. Drenyra Engram is still `0.x`: its own version policy allows a MINOR to change a contract (`v0.9.0` changed the observation lifecycle from the 0.1 to the frozen 0.5 contract). `frozen` would assert a compatibility policy across future pin bumps that the upstream does not yet promise. The status moves to `frozen` when Drenyra Engram freezes the surfaces this pin consumes (`engram_context`, `engram_search`) under a stated compatibility policy.

## Rules

1. **Pinned exact build, per platform.** The exact upstream build identifier (`drenyra-engram_0.9.0_<platform>`) is fixed per supported platform in `runtime/engram-pin.ts`. No range, no "latest," no live fetch.

2. **Package-local, four platforms, no Windows.** Vendored under:

   ```text
   drenyra-shell/
   └── vendored/
       └── drenyra-engram/
           ├── drenyra-engram-0.9.0-linux_amd64.tar.gz
           ├── drenyra-engram-0.9.0-linux_arm64.tar.gz
           ├── drenyra-engram-0.9.0-darwin_amd64.tar.gz
           └── drenyra-engram-0.9.0-darwin_arm64.tar.gz
   ```

   **Windows is explicitly not vendored in this pin.** `runtime/engram-pin.ts` reports a clear "unsupported platform" diagnostic on `win32` rather than silently failing or pretending support (`design.md` §1). This is a disclosed limitation, not an oversight.

3. **Disclosed cost.** Four platform artifacts total ~21 MB (measured at the `v0.9.0` pin), materially larger than `runtime-dependency.md`'s ~640 KB single vendored tarball, because a compiled Go binary has no portable single-file form the way an npm package does. This size ships in every `drenyra-shell` install (`vendored` is in `package.json#/files`).

4. **Never `PATH`.** Ambient `drenyra-engram` binaries are not trusted, exactly as rule 4 of `runtime-dependency.md` requires for `drenyra-ai`.

5. **Verification.** Platform detection (`process.platform` + `process.arch`) selects the one artifact to verify; sha256 checksum match is required before spawning; any mismatch or unsupported platform fails closed — never a silent fallback to an unverified binary. See "Verification procedure" below.

   **Where the pinned bytes come from.** Each vendored tarball is the GitHub Release asset `drenyra-engram_<version>_<platform>.tar.gz`, renamed to the layout above. Before vendoring, it must pass both `sha256sum -c` against the release `checksums.txt` and `gh attestation verify <artifact> -R arkelythex/drenyra-engram`. `__tests__/engram-pin.test.ts` keeps this contract's table, `runtime/engram-pin.ts`, and the vendored bytes identical.

6. **Read-only consumption.** Pi calls only `engram_context` and `engram_search` (`engram_*` general tools, both read-only) through the spawned MCP child process. It never calls any `accounting_*` tool and never calls a write-shaped `engram_*` tool (`engram_save`, `engram_reject`, `engram_void`, `engram_supersede`) — this pin's consumption surface is a strict subset of what the binary exposes, by deliberate design (`pi-engram-integration` design.md §6; widened to include `engram_search` by `pi-engram-memory-reads` proposal.md §2), not a limitation of the binary itself.

7. **Upgrade is explicit.** Changing the pinned build is a release of Drenyra Shell itself, following the same discipline `runtime-dependency.md` rule 6 requires: changelog entry, migration note, re-run of verification.

## Pinned artifacts

| Platform | Build | sha256 |
| --- | --- | --- |
| `linux_amd64` | `drenyra-engram_0.9.0_linux_amd64` | `09e008cc721b186f1180026e72d050ffbceeeb685a0a92f87ff2d5e1797e3312` |
| `linux_arm64` | `drenyra-engram_0.9.0_linux_arm64` | `1ebbe1d032001152ad5e5976ca2a4ac59c89468444c0528a9cef04b5d10f397a` |
| `darwin_amd64` | `drenyra-engram_0.9.0_darwin_amd64` | `c4fcda6d95c5c90d014509e6112b806d04a0759726c184ecd5c09370e8fb01af` |
| `darwin_arm64` | `drenyra-engram_0.9.0_darwin_arm64` | `1f0d13b651dc7972ad90f4af0f41f955e3987cefa26e82609977cff832b8b8f1` |
| `win32` (any arch) | not vendored | n/a — unsupported platform, disclosed |

## Verification procedure (reference)

```text
1. Read process.platform + process.arch; map to one of the four supported platforms, or report "unsupported platform" and stop.
2. Resolve the package-local vendored tarball path for that platform.
3. Verify its sha256 against the table above.
4. On any mismatch or missing file: fail closed, report which check failed. Never spawn an unverified binary.
5. On success: extract (or reuse an already-extracted, checksum-stamped copy) and spawn `drenyra-engram mcp --db <path>`.
```

## Known, disclosed gap (not fixed by this change)

`scripts/verify-package-files.mjs` (the pre-publish packaging gate) reconciles the single `drenyra-ai` vendored tarball via `DEFAULT_PIN`, but its `collectCoveredFiles` walk covers only `contracts/` and `assets/schemas/` — it does **not** scan `vendored/`, and has no generic multi-platform reconciliation logic. Extending it for `drenyra-engram`'s four-platform matrix is out of scope for this change (`tasks.md`'s allowed edit surface does not include `scripts/lib/package-verify.mjs`). `runtime/engram-pin.ts` is therefore the **sole** verifier of these four checksums today. Since `drenyra-shell` publication is itself out of scope (`REQ-REL-006`, unaffected by this change), this gap has no live consequence yet, but a future change that authorizes publication must close it before a `drenyra-engram`-dependent package can be safely published.

## Reference implementation

| Contract rule | Implementation |
| --- | --- |
| Pinned exact build, per platform | `runtime/engram-pin.ts` — the platform→build/checksum table and `verifyEngramPin` |
| Package-local, never PATH | same module — resolves only `<packageRoot>/vendored/drenyra-engram/<artifact>`, never `PATH` |
| Verification / fail-closed | same module — checksum mismatch, missing artifact, or unsupported platform all report a typed failure, never a silent pass |
| Child-process lifecycle | `runtime/engram-client.ts` — spawn, `initialize` handshake, graceful shutdown (see `design.md` §6) |
| Read-only consumption surface | `extensions/register.ts`'s `:context` handler (`engram_context`) and `drenyra_institutional_memory` tool (`engram_search`, reachable only by `journal-candidate-agent`, `invoice-sire-agent`, `reconciliation-agent`, and `tax-controller-pe` through their frontmatter `tools:`) — the only two callers |

Conformance tests: `__tests__/engram-pin.test.ts` (including contract table ↔ pin ↔ vendored bytes), `__tests__/engram-client.test.ts`, and `__tests__/agents.test.ts` (which agents may and may not declare `drenyra_institutional_memory`; no agent declares an `accounting_*` or `engram_*` tool).

## Migration notes

- 2026-09-21: Project renamed from Drenyra Pi to Drenyra Shell (drenyra-pi → drenyra-shell). No schema, field, or pinned-build changes — this is a naming-only update. The header `Version:` is the pinned `drenyra-engram` build (`0.9.0`), not a contract revision, so it is left unchanged; see CHANGELOG.md.
- 2026-10-27: Pin moved from the untagged `0.2.1-SNAPSHOT-6a371a9` build to the tagged release `v0.9.0` (arkelythex/drenyra-engram, GitHub Release with SLSA attestations). Consumed surface unchanged: `engram_context` and `engram_search` keep their call shape, verified against the release binary. Upstream contract change not consumed here: the observation lifecycle moved from the 0.1 to the frozen 0.5 model, which affects write paths Pi never calls (rule 6). The release binary now reports its real version (`serverInfo.version` `0.9.0`; the snapshot reported `0.2.0`).
