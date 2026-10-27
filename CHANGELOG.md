# Changelog

> Fiscal convention: monetary values in the Drenyra ecosystem are BigInt cents; no float is ever used for money; version/sequence numbers are JSON integers, never floats.

All notable changes to Drenyra Shell will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to the version policy in [RELEASING.md](RELEASING.md).

## Unreleased — runtime pin → 0.4.1 (release event, pre-alpha)

### Added

- **Control mutation suite (`bun run eval:controls`).** Mutation testing
  adapted to accounting. A synthetic journal proposal is mutated with 25 known
  bookkeeping defects and 3 valid variants, and the pinned kernel's verdicts are
  classified into a scoreboard in integer basis points. Against
  `drenyra-ai@0.4.1`: 18/25 defects rejected (7200 bps), 0/3 false alarms.
  The 7 survivors (zero amount, empty account code, no evidence items,
  duplicate evidence ids, future capture date, wrong RUC check digit, empty
  entry id) are kernel gaps reported upstream, never fixed in Pi. The suite
  only classifies verdicts, and `__tests__/control-mutation.test.ts` pins the
  scoreboard as a ratchet (REQ-CONF-009). The corpus is synthetic and not
  professional-validated. Background: `docs/research/2026-10-agentic-accounting-landscape.md`.

- **Institutional memory reaches the proposing agents.** `invoice-sire-agent`,
  `reconciliation-agent`, and `tax-controller-pe` now declare
  `drenyra_institutional_memory` (read-only `engram_search`), joining
  `journal-candidate-agent`. Each carries a role-adapted contract: a precedent
  may change what it proposes, never review depth or authority, and is never
  cited as sufficient evidence. `guardian-angel`, `anomaly-refuter`,
  `evidence-builder`, `close-controller`, `accounting-scout`, and
  `ledger-analyst` are excluded on purpose. A reviewer or refuter anchored by
  precedent stops being independent, memory is not evidence, and the rest
  propose nothing a precedent shapes. Because the tool is registered globally,
  `__tests__/agents.test.ts` now pins both sets and forbids any `accounting_*`
  or `engram_*` tool in any agent (REQ-ENG-005/006).

- **`books` operation mode (`/drenyra:mode`).** A reduced-capability session in
  which every tool call is denied unless its name is on a fixed allowlist
  (`read`, `grep`, `glob`, `list_fiscal_phases`, `verify_fiscal_phase`,
  `run_fiscal_lens`, `record_receipt`). `bash`, `write`, `edit`, and any tool the
  harness does not know — including an MCP or database client the host exposes —
  are blocked at the `tool_call` hook, with a reason naming the mode, the tool,
  and `/drenyra:mode open`. The mode is per-process state that starts `open`, so
  no existing session is restricted implicitly. The policy is a pure function
  (`lib/operation-mode.ts`, REQ-AUTH-010) tested independently of the extension.
  This constrains which tools exist for a session; it is not an authority level,
  a fiscal gate, or a replacement for the guards.

- `propose_journal_entry`, the first typed fiscal tool. It maps the bound canonical scope onto the pinned kernel's `validateTenantScope`, accepts evidence through `acceptEvidence`, and records the entry through `journal.record`, reporting the kernel's own verdict code when it refuses (`unbalanced`, `missing-evidence`, `invalid-ruc`, `MEMORY_SHAPED`, `INVALID_ITEM`). The wrapper (`lib/journal-proposal.ts`) does not sum, round, convert, balance-check, or validate anything; every verdict belongs to the kernel (REQ-AUTH-011).
- The entry is **recorded, never posted**. Posting issues a signed receipt and needs a `JournalReceiptIssuer`; the harness has none, because `lib/receipt-store.ts` speaks mission-receipt vocabulary (`previousStatus`/`newStatus`), not the journal's. This is the proposal half of the typed fiscal surface, not the whole of it: there is no `close_period` because `drenyra-ai/fiscal` exposes a candidate-ordering adapter rather than a close entry point.

### Documentation

- **The Drenyra method replaces ODD in the README.** The product workflow is now
  presented as **EDA (Evidence-Driven Accounting)**, the name the kernel already
  uses for its 13 mission phases, next to **CDA (Control-Driven Accounting)**,
  which puts the control before the entry and mutation-tests the controls, and
  **RDA (Receipt-Driven Accounting)**: no receipt, no mutation. The full reference
  is `docs/method.md`. ODD stays as the way this repository is built
  (`AGENTS.md`). The workflow diagram is relabelled and renamed to
  `docs/diagrams/drenyra-eda-workflow.{light,dark}.svg`. The Ecosystem section
  now mirrors the Gentle AI shape (drenyra-ai, drenyra-shell, drenyra-engram,
  plus the Command Center) and no longer calls the shipped Engram integration
  "planned". CDA is Shell-defined until Drenyra AI formalizes it.

- **ODD for the books and focused accounting agents.** The README gains two
  "How it works" sections with light and dark diagrams under `docs/diagrams/`:
  Organic Driven Development mapped onto accounting work (scope, evidence,
  Core-decided materiality forking light work from durable missions, proposal,
  refutation, approval, and signed receipt), and the ten Shell agents grouped by
  authority ceiling with the Core and the professional as the only deciders.
  Every step links to the command, spec, or module that implements it.
  Both variants use only the canonical Dreamcoder OS tokens: Dreamcoder Light
  (Cocoa/Lúcuma) and Dreamcoder Dark (OLED canvas, indigo and lavender accents).

- **README and documentation quality pass.** The README is restructured around a
  hero, an explicit status section, per-topic sections that link to their deep
  document, collapsible detail, and a documentation index — following the
  structural quality of `gentle-shell`.
- **Two overstatements corrected.** The fiscal guards are now documented as
  development-hygiene guards with their exact trigger and scope
  (`extensions/fiscal-guard.ts:133`, `:171`, `:211`) instead of "broad-deny,
  narrow-allow tool permissions for fiscal actions", and `docs/intended-usage.md`
  no longer claims a signed receipt for every material action.
- **`record_receipt` disclosed as a known limitation.** The fail-open path
  (`extensions/fiscal-guard.ts:398-409`: `Date.now()` + `Math.random()` id,
  caller-supplied before/after state, `hash: ""` with a TODO) is documented next
  to the signed `ReceiptStore` path it does not replace.

### Changed

- **Renamed Drenyra Pi to Drenyra Shell** (product identity rename, mirroring
  the sibling `gentle-pi` → `gentle-shell` rename): package identity, runtime
  identifiers, docs, and branding assets renamed throughout.
  - `contracts/package-contract.md` and `contracts/runtime-dependency.md`
    bumped `v0.1` → `v0.2` (naming-only, no schema/field changes).
  - 8 branding assets renamed from `drenyra-pi-*` to `drenyra-shell-*`.
  - The on-disk host-id string in `lib/configurator.ts` intentionally
    **stays** `"drenyra-pi"` — it's a closed `HostName` union owned by the
    pinned external `drenyra-ai@0.4.1` kernel, not this package's call; not a
    bug, tracked as a future `drenyra-ai` release requirement.

### Added

- **Fiscal harness extraction complete** — the harness that lived in
  `drenyra-command-center/packages/pi` now ships from this repository, the
  single source of truth for the Drenyra Shell accounting harness:
  - Packaged skills: `lens-audit-trail`, `lens-ledger-integrity`,
    `lens-sunat-compliance`, `lens-tenant-isolation`, `ruc-scope`,
    `fiscal-compliance`, `fiscal-review`, `drenyra-sdd`, `drenyra-chained-pr`.
  - FSD lifecycle prompts (`fsd-init` … `fsd-archive`) plus `preflight.md` and
    the new `/drenyra:preflight` command (fail-closed scope + pinned-runtime
    check).
  - RED contract schemas under `contracts/` (receipt, evidence, mission,
    authority) with regenerated `SHA256SUMS.json`.
  - `extensions/fiscal-guard.ts`: the five fiscal tools
    (`verify_fiscal_phase`, `list_fiscal_phases`, `record_receipt`,
    `run_fiscal_lens`, `forecast_fiscal_review`), the `/drenyra:persona`
    command, and the money/SQL/RUC write guards — registered from the single
    `register.js` entrypoint. The money guard evaluates only introduced text
    (newText), never replaced oldText (false-positive fix).
  - `themes/fiscal-operator/fiscal-operator-light.json` and
    `themes/fiscal-operator/fiscal-operator-dark.json` (the two Pi themes declared in
    `package.json#pi.themes`); `typebox` added as a devDependency for tool schemas.
  - Verification: `verify:package` entry list extended for `fiscal-guard.js`;
    capability-manifest and program-lock-facts refreshed (703 tests, 44 files).

### Changed

- **Runtime pin bumped to `drenyra-ai@0.4.1`** (release event per
  `contracts/runtime-dependency.md` "Upgrade is explicit"; version stays
  pre-alpha per the current verification-only release posture):
  - Vendored tarball `vendored/drenyra-ai-0.4.1.tgz`; entry-artifact checksum
    `09df8d696204337a9b62ddd28c354b414b62e81924caaf68a50b61131d5b7600`
    (`dist/cmd/cli.js`), reconciled by `verify:package`.
  - v0.4.1 is a MINOR backward-compatible addition (released 2026-08-15):
    configurator host integration (PinnedComposition, PINNED_AI_COMPOSITION,
    drenyra-pi as the fourth managed host) and the routing preflight router
    (`routing/router.ts`, deterministic `route()` over the eight §5 axes). The
    fiscal-authority kernel surface Drenyra Shell consumes is unchanged — no
    breaking API change.
  - `runtime/pin.ts`, `contracts/runtime-dependency.md`,
    `contracts/package-contract.md`, `docs/architecture/program-lock-facts.json`
    updated to the new pin; doctor + conformance + full suite re-run.

### Added

- **SDD-040 adapter boundary slice** (Drenyra Shell is a replaceable RDA host):
  - `docs/architecture/rda-adapter-boundary-audit.md` — 10/10 boundary rules
    PASS with executable evidence (no Pi-local violation).
  - `__tests__/adapter-boundary-replacement.test.ts` + fixtures — harness
    replacement test: same mission through Drenyra Shell and an independent substitute
    host yields equivalent canonical authority projections (candidates, gates,
    receipts); five negative controls fail on any authority difference.
  - `docs/architecture/rda-adapter-boundary.md` — adapter contract
    (operator → prepare → call → present → human decision → verify receipt →
    project result), per-step ownership, fail-closed behaviors.
  - Master closure reference: `drenyra-ai` sdd-040-rda-v2 @ `c4d2b6a` (#42).

### Migration note

The pin change is a release event: re-run `/drenyra:doctor` and the
conformance suite after updating; consumers must install the vendored
`drenyra-ai-0.4.1.tgz` (exact pin + checksum). No breaking API change from the
0.2.0 kernel surface; the new configurator/routing modules are additions for
upcoming SDD-020/030 slices.

### Removed

- **The SDD workflow and its `openspec/` corpus are gone — ODD is the only
  delivery workflow.** The requirements corpus moved to `specs/` unchanged (one
  spec per capability, same `REQ-*` identifiers) and feature work is tracked in
  `odd/tasks/<feature>.md`.
  - Deleted `openspec/`: `config.yaml`, `README.md`, and the 128-file
    `changes/archive/`.
  - Deleted the `drenyra-sdd` packaged skill; the packaged skills are now the
    eleven foundation/operator skills under `skills/`.
  - The canonical current snapshot record moved from `openspec/config.yaml` to
    `docs/architecture/current-test-state.yaml`; `verify:capability`,
    `refresh:lock-facts`, and `compute-candidate-identity.mjs` read it there.
  - `program-lock-facts.json#/activeChanges` is now derived from the
    `odd/tasks/*.md` feature documents that still carry an unchecked task,
    instead of `openspec/changes/` folders.
  - `scripts/compute-candidate-identity.mjs` no longer normalizes an
    apply-progress section; only the current snapshot record and the generated
    lock facts are normalization-exempt.

### Changed

- **`specs/` is the living requirements baseline and `odd/tasks/` is the
  workflow.** `AGENTS.md` documents the ODD protocol — authorize, explore, size,
  track, implement test-first, close — plus the requirement-change rule: a
  changed requirement appends a verbatim log entry, rewrites only the affected
  requirement, and reopens only its linked task. No capability, command,
  contract, or behavior changed.

## 0.1.0 — 2026-09-12

### Changed

- **Package version is now `0.1.0`** (decision D2 of
  `openspec/changes/pi-recovery-release-readiness`). Both Pi-local produced
  contracts (`package-contract`, `runtime-dependency`) are frozen at v0.1, which
  is the point the version policy in [RELEASING.md](RELEASING.md) names for
  leaving `0.0.1-prealpha.x`. The version is carried by `package.json#/version`,
  `capability-manifest.yaml#/repository/version`, the generated
  `docs/architecture/program-lock-facts.json#/packageVersion`, and the two
  harness-version constants (`extensions/register.ts` `DRENYRA_PI_VERSION` and
  `extensions/fiscal-guard.ts` `FISCAL_GUARD_VERSION`); a new guard
  (`__tests__/harness-version.test.ts`) couples those two constants to
  `package.json#/version` so the drift cannot recur silently. The derived lock
  facts were regenerated through the sanctioned generator
  (`bun run refresh:lock-facts`), never hand-edited.
- **Publication remains off.** This entry records a version bump and the release
  readiness around it — **not** a published artifact. Nothing was published to
  any registry: there is no `publishConfig`, no publish step or job, and the
  roadmap's npm item stays unchecked.

### Notes

- This entry **supersedes** the earlier "verification-only release posture,
  version stays pre-alpha" note in the `## Unreleased` section above. That
  reasoning is the one D2 overrode: both produced contracts are frozen at v0.1,
  so `RELEASING.md`'s own policy names `0.1.0`.

## 0.0.1-prealpha.1 — 2026-08-01

### Added

- Repository identity scaffolding: README, LICENSE, SECURITY, CONTRIBUTING, CODEOWNERS, architecture and roadmap docs.
- Draft contract index (`contracts/`):
  - `package-contract` — install surface and provided capabilities.
  - `runtime-dependency` — pinned, verified, package-local Drenyra AI runtime strategy.
- **PR 1 — Pinned runtime verification core:**
  - `runtime/` — pin, package-local resolution (never PATH), checksum, fail-closed doctor, status.
  - Pi extension registration (`extensions/register.ts`) against the gentle-shell model.
  - CLI-exposed doctor/status machinery; fail-closed matrix tests (30 tests).
- **Release hardening:**
  - Build to `dist/` (tsc, NodeNext, declarations), `engines >= 22`, complete `files` manifest, `pi` manifest pointing at `dist/extensions`, optional Pi peer dependency, subpath `exports`.
  - Private Drenyra AI installer (`runtime/installer.ts` + postinstall wrapper).
  - **End-to-end install vertical:** the postinstall now installs the pinned
    `drenyra-ai@0.2.0` from its **GitHub Release tarball URL** (`installUrlFor`,
    `npm install <tarball>` — the registry is not used until drenyra-ai publishes)
    and verifies with doctor; the packed-install test proves the full chain
    (pack → install → postinstall → runtime verified). Extension registration
    tested against a structural Pi API (39 tests total).
  - **Company + period context vertical:** `runtime/context.ts` (RUC via SUNAT
    Módulo 11 checksum — ported from Drenyra; verified against known-valid RUCs —
    plus YYYYMM period validation) with an atomic JSON scope store; extension
    commands `/drenyra:company`, `/drenyra:period`, `/drenyra:context` wired and
    tested (51 tests total).
  - **Monthly-close RDA chain:** `chains/monthly-close.ts` runs a
    monthly-close mission through the pinned Drenyra AI runtime (in-memory
    stores, protocol-legal transitions), enforces the **R2 approval gate**
    (explicit single approver — never automatic), and produces a **signed
    receipt** as the immutable close proof. `/drenyra:close <approverId>`
    command wired; fail-closed without scope or approver (54 tests total).
  - **Pin released:** `DEFAULT_PIN` points at `drenyra-ai@0.2.0` (git tag `v0.2.0`, entry-artifact checksum `e4e81914…`; all six contracts frozen — mission-protocol, candidate, receipt, gate, ledger, recovery). `doctor` fail-closed verification is live against the released artifact.
  - `verify:package` + `verify-packed-install` (pack → install → extension factory loads under Node) + prepack/prepublishOnly gates + CI package job.
  - Placeholder asset dirs (assets/, prompts/, skills/, agents/, chains/, themes/) per the README layout.

    ### Notes

    - The DEFAULT_PIN is **`released`**: `drenyra-ai@0.2.0` (git tag `v0.2.0`) is pinned with the
      entry-artifact checksum `e4e81914…`, the vendored tarball ships in `vendored/`, and the
      postinstall installs it package-local and verifies it with doctor (the GitHub Release URL
      remains the fallback install source). The `pending-release` path is exercised only in tests.
    - Pre-alpha: nothing is production-ready; contracts are not frozen.
    - Version policy: `0.0.1-prealpha.x` until the first frozen contract, then `0.1.0`.
