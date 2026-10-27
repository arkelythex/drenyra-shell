# Feature: journal-proposal-tool

**Objective:** expose the kernel's journal recording path as one typed tool, so an operating agent proposes a journal entry through validated scope, accepted evidence, and kernel-side balance checks — and never posts it.
**Branch:** `feat/journal-proposal-tool`
**Test runner:** `bun run test` (vitest). Gates: `typecheck`, `test`, `verify:capability`, `verify:style`.

## Specs

- **S1 — One tool, one verb.** The harness exposes exactly one fiscal journal tool, `propose_journal_entry`. It proposes; it does not post, sign, supersede, or revoke.
- **S2 — No fiscal semantics in the harness.** The wrapper MUST NOT sum, round, convert, balance-check, or validate an amount, a line, a scope, or an evidence artifact. Every one of those verdicts belongs to the pinned kernel (`validateTenantScope`, `acceptEvidence`, `journal.record`), and the harness only reports what the kernel returned.
- **S3 — Money is BigInt cents.** Amounts cross the tool boundary as decimal strings and become `bigint` before reaching the kernel. No amount is ever a JavaScript `number`, and a non-integer or negative amount is rejected before the kernel sees it.
- **S4 — Scope comes from the bound canonical scope.** The tool reads the active scope from `ScopeContextStore`, maps `companyId` ← `canonical.company`, `ruc` ← `context.company.ruc`, `period` ← `context.period.period`, and lets the kernel decide whether that mapping is valid. With no company scope set it returns the existing short-circuit message instead of calling the kernel.
- **S5 — Kernel verdicts are surfaced, not swallowed.** A kernel rejection returns `{ ok: false, code, message }` carrying the kernel's own code (`unbalanced`, `missing-evidence`, `invalid-ruc`, `MEMORY_SHAPED`, `INVALID_ITEM`, …). A thrown non-kernel error yields `code: "unknown-error"`. The tool never throws out of `execute`.
- **S6 — The proposal is visibly unposted.** A successful result reports `status: "recorded"` and the entry's line and evidence counts. It MUST NOT contain a receipt, a signature, or any `posted` status, because posting requires a `JournalReceiptIssuer` the harness does not legitimately have.
- **S7 — Documented as a half, not a whole.** `specs/authority/spec.md` gains REQ-AUTH-011 stating the propose/never-post boundary; the README moves the typed-tool row to *Works today* while keeping end-to-end validation in *Does not exist yet*; `CHANGELOG.md` records the addition without claiming end-to-end validation.
- **S8 — Gates green.** `typecheck`, `test`, `verify:capability`, `verify:style` and `refresh:lock-facts --check` all pass.

## Tasks

- [x] **T1** — `lib/journal-proposal.ts`: the pure wrapper over the three kernel entry points. *(S1, S2, S3, S5, S6)*
- [x] **T2** — `__tests__/journal-proposal.test.ts`: RED first. Balanced entry records; unbalanced, bad RUC, memory-shaped evidence and malformed items surface the kernel's code; the result carries no receipt. *(S2, S5, S6)*
- [x] **T3** — `extensions/journal-tools.ts`: `propose_journal_entry` with TypeBox parameters, scope read from the context store, decimal-string amounts converted to `BigInt`. *(S1, S3, S4, S5)*
- [x] **T4** — Wire into `extensions/register.ts`; extension-level tests for the no-scope short-circuit, a successful proposal, and a kernel rejection rendered as text. *(S4, S5)*
- [x] **T5** — Docs: REQ-AUTH-011, README rows, CHANGELOG. *(S7)*
- [x] **T6** — Gates and lock-facts refresh. *(S8)*

## Log

### L1 — 2026-10-27 — original request (verbatim)

> continue con todo

Context: the previous turn closed with the README's remaining gap — typed fiscal tools — described as "herramientas fiscales tipadas (`propose_journal`, `close_period`) … tienen que ser wrappers finos sobre `./journal`, `./fiscal` y `./candidates` del kernel pineado". `continue con todo` authorizes that next item.

### L2 — 2026-10-27 — kernel evidence

- `drenyra-ai/journal` exports `record`, `post`, `supersede`, `revoke`. `record(input)` returns a RECORDED entry; `post(entry, issuer)` issues the signed receipt and returns the POSTED snapshot. The two are separate on purpose.
- `drenyra-ai/fiscal` exports only a candidate-ordering adapter — **there is no `closePeriod()` or `reconcile()` to wrap**. Inventing one would mean authoring fiscal semantics, which AGENTS.md rule 1 forbids.
- `drenyra-ai/tenant` exports `validateTenantScope(input): ValidatedTenantScope`, fail-closed.
- `drenyra-ai/evidence` exports `acceptEvidence(input): AcceptedEvidence`; the kernel rejects memory-shaped channels (`memory`, `engram`, `recall`) and advisory-shaped ones (`advisory`, `assistant`, `llm`, `suggestion`, `agent`, `chat`) *before* its allowlist check.
- Error codes are lowercase-hyphenated for tenant and journal (`invalid-ruc`, `unbalanced`, `missing-evidence`) and UPPER_SNAKE for evidence (`MEMORY_SHAPED`, `INVALID_ITEM`, `MALFORMED_PROVENANCE`). Tests assert the real values, not the constant names.
- `PiExtensionApi.registerTool` `execute` receives no context, so the scope must come from a captured `contextStore`.

### L3 — 2026-10-27 — decisions

- **D1 — Proposal half only.** No `post`, no signing, no receipt. Posting requires a `JournalReceiptIssuer`, and the harness has no legitimate one: `lib/receipt-store.ts` speaks `HarnessReceiptRecord` / `previousStatus` / `newStatus`, a different vocabulary from the kernel's journal `SignedReceipt`. Manufacturing a mapping would be the harness authoring fiscal authority — the exact thing AGENTS.md rule 1 forbids. Shipping the recording path and saying plainly that posting is missing is honest; shipping a fake issuer would not be.
- **D2 — Amounts arrive as decimal strings.** Tool parameters come from JSON, where a float would silently corrupt cents. The tool accepts a string of digits and converts with `BigInt`, rejecting anything else before the kernel is reached.
- **D3 — The wrapper maps, it does not judge.** Every validation is delegated; the wrapper's only logic is field mapping and error-code extraction. If the kernel changes its mind about what is valid, this file does not need to change.
- **D4 — No `close_period`.** `drenyra-ai/fiscal` has no close entry point, so there is nothing to wrap. A tool by that name would have to invent period-close semantics locally.

### L4 — 2026-10-27 — verification (36c94fd)

Every task is closed against `36c94fd`.

- `bun run typecheck` — clean.
- `bun run test` — 58 files / 825 passed / 0 failed (baseline 56/798 before the books mode; this feature adds 2 files and 10 tests).
- `bun run verify:capability` — OK.
- `bun run verify:style` — OK (diff-scoped · 121 owned files · 4 rules).
- `node scripts/refresh-program-lock-facts.mjs --check` — current after two passes of the write → mirror-rewrite loop.

Two failures were real and are recorded rather than smoothed over:

1. `Type` imported from `@sinclair/typebox` does not resolve — the package is not installed. The repository uses `typebox` (v1.3.14), as `extensions/register.ts:10` already did.
2. `__tests__/lock-facts.test.ts` failed twice because creating this feature document with unchecked tasks changes `activeChanges`. That is the mechanism working: the lock facts refuse to describe a tree whose active-feature set is out of date.

Deliberate non-changes: no `post`, no signing, no `close_period`, no `ingest_cpe`. D1-D4 in L3 stand. This feature does not make any capability `validated-end-to-end`.
