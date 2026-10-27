# README and documentation quality pass

Raise the README and documentation to the structural and editorial quality of
`Gentleman-Programming/gentle-shell`, while making every claim match the code.
Branch: `docs/readme-quality-gentle-shell`. Delivery: single PR. Runner: `vitest`.

## Specs

- **S1 — Hero first.** The README opens with the existing branded banner
  (`assets/branding/drenyra-shell-hero-runtime-manifest.svg`), the product name,
  one line saying what the product is, a badge row (version, status, license,
  last commit) and a nav row. The current opening legal blockquote moves out of
  the first screen.
- **S2 — Status before claims.** Within the first screen the README states that
  this is pre-release `0.1.0` with frozen contracts, and that **no capability is
  `validated-end-to-end`**. No aspirational claim appears above that statement.
- **S3 — A path table, not a wall.** "Get started" opens with a "which path is
  for me?" table and gives copy-pasteable commands. The npm install command is
  explicitly labelled as **not yet published**, and the source path that works
  today is given alongside it.
- **S4 — Every section exits to depth.** Each top-level feature section ends with
  a `**[Docs →](...)**` link to the deep document, so the README stays a map and
  the detail lives in `docs/`.
- **S5 — Documentation index.** A `## Documentation` table lists every document
  under `docs/` with a one-line purpose.
- **S6 — Depth is collapsible.** Verbose material (guard internals, per-phase
  model guidance, national-alignment detail) moves into `<details>` blocks so the
  top level stays scannable.
- **S7 — Guards documented for what they are.** The current claim "Tool safety —
  broad-deny, narrow-allow tool permissions for fiscal actions" is replaced. The
  three guards are documented as **development-hygiene guards** with their exact
  trigger and exact scope, each citing its `file:line`.
- **S8 — `record_receipt` documented as a known limitation.** The fail-open path
  (agent-supplied `beforeState`/`afterState`, `Date.now()` + `Math.random()` id,
  `hash: ""` with a `TODO`) is disclosed, contrasted with the signed
  `ReceiptStore` path, and never described as equivalent.
- **S9 — Known limitations carry evidence.** A `## Known limitations` section
  states each limitation with a `file:line` citation. No limitation is stated
  without a citation.
- **S10 — Gates stay green.** `bun run typecheck`, `bun run test`,
  `bun run verify:style`, `bun run verify:capability` pass, and the program lock
  facts are refreshed so `activeChanges` matches the real feature-document state.

## Tasks

- [x] **T1** — Rewrite `README.md` to S1-S6, S8-S9. Route: inline.
- [x] **T2** — Rewrite the safety/control section to S7 with exact guard scope. Route: inline.
- [x] **T3** — Align `docs/intended-usage.md` with the README's limitation statements. Route: inline.
- [x] **T4** — Run gates (S10) and refresh program lock facts. Route: inline.
- [ ] **T5** — Close: check off this document and refresh lock facts so `activeChanges` returns to `[]`. Route: inline.

## Log

### L1 — 2026-10-27 — user request (verbatim)

> la calidad de mi readme , y documentacion de este proyecto debe tener de inspiracion a este , https://github.com/Gentleman-Programming/gentle-shell ,Revisé ambos repos: los cloné y corrí los tests. Primero lo que encontré, después el flujo.

The user attached a review of both repositories covering: a shallow-clone test
failure, guards that protect code edits rather than bookkeeping, `record_receipt`
as a fail-open path, a concept mapping from gentle-shell, an end-to-end
operational flow, and an implementation order. That review is the evidence base
for S7-S9, not an authorization to change code.

### L2 — 2026-10-27 — decision (verbatim answer)

Scope question asked: whether the README should be corrected while being
restructured, only restyled, or corrected plus a code fix. Answer:

> README honesto + reestructura (Recomendado)

So this feature changes documentation only. Removing `record_receipt` or adding
typed fiscal tools is explicitly **out of scope** and stays a separate change.

### L3 — 2026-10-27 — verification of the review's claims

Every claim that reaches the README was checked against the tree at `main`
(`91c24be`). Evidence:

- **The 4 failing tests were the shallow clone.** A full local clone runs
  `bun run test` → 54 files / 798 passed / 0 failed, including
  `__tests__/lock-facts.test.ts`. The candidate identity hashes `HEAD` plus the
  participation paths, so a shallow clone cannot compute it. Not a product defect.
  The count is 798 rather than 799 because the SDD→ODD purge removed one test
  together with `normalizeApplyProgress`.
- **`record_receipt` is fail-open.** `extensions/fiscal-guard.ts:398-409` builds
  the id from `Date.now()` and `Math.random().toString(36)`, takes
  `beforeState`/`afterState` from the caller, and sets `hash: ""` with
  `// TODO: hash over receipt fields`.
- **The signed path is real.** `lib/receipt-store.ts:270` defines `ReceiptStore`;
  `lib/receipt-store.ts:187-189` asserts `signerKeyId`, `signerPublicKey` and
  `signature`, and records live append-only at
  `<workspace>/.local/receipts/<receipt-hash>.json`.
- **Guard 1 is code hygiene.** `extensions/fiscal-guard.ts:133-146` fires only on
  the `edit` and `write` tools and blocks a monetary word near a digit or
  currency marker unless a `Money|cents|BigInt|whole|.00|bignumber` escape is
  present.
- **Guard 2 is a best-effort bash regex.** `extensions/fiscal-guard.ts:171-208`
  fires only on `bash`, and its checks are case-sensitive `String.includes`
  (`DELETE FROM`, `DROP TABLE`, `TRUNCATE`), so a lowercase `delete from` or a
  different client bypasses it. It is not a boundary.
- **Guard 3 is a path convention.** `extensions/fiscal-guard.ts:211-231` fires on
  `read`/`edit` when a path contains `/ruc/` without `:ruc`.
- **The command reference is accurate.** All 20 `/drenyra:*` commands named in
  the current README are registered: `capabilities`, `close`, `company`,
  `context`, `continue`, `doctor`, `evidence`, `install`, `mission`, `models`,
  `period`, `persona`, `preflight`, `receipt`, `reconcile`, `resume`, `scope`,
  `status`, `sync`, `verify`.
- **The branded assets exist.** `assets/branding/` already holds the four SVG
  diagrams the README embeds, so S1 needs no new artwork.
- **The typed fiscal tools do not exist yet.** The review's mapping proposes
  `ingest_cpe`, `propose_journal`, `reconcile` and `close_period` as the future
  tool surface. They are **not** in this tree and are not documented as if they
  were.
