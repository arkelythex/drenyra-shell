# Feature: books-operation-mode

**Objective:** give the harness a reduced-capability operation mode where the agent cannot reach `bash`, `write`, `edit`, or any unlisted tool — the boundary the README currently discloses as missing.
**Branch:** `feat/books-operation-mode`
**Test runner:** `bun run test` (vitest). Gates: `typecheck`, `test`, `verify:capability`, `verify:style`.

## Specs

- **S1 — Two modes, explicit names.** The harness MUST define exactly two operation modes: `open` (default, today's behaviour, nothing blocked by policy) and `books` (reduced capability). No third mode, no aliases.
- **S2 — Deny by default.** In `books` mode every tool call MUST be denied unless its tool name is on the mode's explicit allowlist. A tool the harness has never heard of — including any MCP or database client the host exposes — MUST be denied. The allowlist is the authority, never the blocklist.
- **S3 — The allowlist.** `books` allows exactly: `read`, `grep`, `glob` (inspection of the workspace) and the harness's own read-only fiscal tools `list_fiscal_phases`, `verify_fiscal_phase`, `run_fiscal_lens`, `record_receipt`. Everything else is denied, `bash`, `write` and `edit` included.
- **S4 — Denial explains itself.** A denial MUST return a block decision carrying a reason that names the active mode, the denied tool, and how to leave the mode (`/drenyra:mode open`). It MUST NOT throw.
- **S5 — The command.** `/drenyra:mode` with no argument reports the active mode, the allowlist and what is blocked. `/drenyra:mode books` and `/drenyra:mode open` switch the mode. Any other argument is refused with the usage line, leaving the mode unchanged.
- **S6 — Per-process, default open.** The mode is per-process session state. It starts `open` on every process start, so an existing session is never silently restricted. Switching to `open` requires the literal argument; nothing resets the mode implicitly.
- **S7 — Pure policy, separately tested.** The decision MUST be a pure function in `lib/` with no extension or filesystem dependency, unit-tested on its own. The extension only supplies state and renders the result.
- **S8 — `open` is untouched.** In `open` mode the tool-call hook MUST behave exactly as before this feature: the three fiscal guards run and nothing else blocks. This is pinned by a test so a future policy change cannot silently restrict the default.
- **S9 — Docs and spec.** `specs/authority/spec.md` gains REQ-AUTH-010 plus its scenarios; the README moves the "no operation mode without bash/write" row from *Does not exist yet* to *Works today* and drops the corresponding Known-limitations row; `CHANGELOG.md` records the addition.
- **S10 — Gates green.** `typecheck`, `test`, `verify:capability`, `verify:style` and `refresh:lock-facts --check` all pass.

## Tasks

- [ ] **T1** — `lib/operation-mode.ts`: modes, allowlist, `evaluateToolPolicy`, `describeOperationMode`. *(S1, S2, S3, S4, S7)*
- [ ] **T2** — `__tests__/operation-mode.test.ts`: RED first. Covers allow/deny per mode, unknown-tool denial, the three named mutations, and the reason text. *(S2, S3, S4, S7)*
- [ ] **T3** — `extensions/operation-mode.ts`: `/drenyra:mode` command and the `tool_call` hook. *(S4, S5, S6)*
- [ ] **T4** — Wire `registerOperationMode(pi)` in `extensions/register.ts`; add extension-level tests for the command and for `open`-mode non-regression. *(S5, S6, S8)*
- [ ] **T5** — Docs: `specs/authority/spec.md` REQ-AUTH-010 + SC-AUTH-007/008, README status/limitations rows, CHANGELOG. *(S9)*
- [ ] **T6** — Gates and lock-facts refresh. *(S10)*

## Log

### L1 — 2026-10-27 — original request (verbatim)

> yes continue

Context: in the previous turn I closed with "un agente sin `bash`, sin `write`, sin credenciales de BD — este harness todavía no lo ofrece. Eso último es el trabajo de verdad que queda, y no es de documentación: es diseño de superficie de herramientas. Si querés seguir por ahí, ese es el próximo PR y es de código." The user answered "yes continue", authorizing exactly that next step.

### L2 — 2026-10-27 — exploration evidence

- `extensions/fiscal-guard.ts:543` registers `pi.on("tool_call", handler)`; the handler returns a `BlockDecision` (`{ block: true, reason }`) to deny a call. That is the only interception surface the harness has.
- The Pi extension API is modelled as a structural slice in `extensions/register.ts:125-141` (`registerCommand`, `on`, `registerTool`). **There is no host-level allowlist API** (`setActiveTools`, permissions) to delegate to, so the policy must be enforced at `tool_call`.
- Registered harness tools: `verify_fiscal_phase`, `list_fiscal_phases`, `record_receipt`, `run_fiscal_lens` (`extensions/fiscal-guard.ts`) and `drenyra_institutional_memory` (`extensions/register.ts:1508`).
- `registerFiscalGuard(pi)` is called at `extensions/register.ts:1593`.
- No operation-mode concept existed before this feature (`grep` found only the README limitation row at `README.md:369`).
- The three existing guards are per-tool-name and best-effort by design; this feature is a different mechanism — an allowlist — and must not be presented as replacing them.

### L3 — 2026-10-27 — decisions

- **D1** — The mode lives in a new extension file, not inside `fiscal-guard.ts`. The guards answer "is this particular write suspicious?"; the mode answers "may this tool run at all?". Different questions, different failure modes, so they stay separate and the blast radius of each stays readable.
- **D2** — `record_receipt` is allowed in `books` mode. It performs no filesystem or network effect (it returns an object), so denying it would remove the one primitive an operating agent is supposed to call without buying any boundary.
- **D3** — The policy is a pure function over `(mode, toolName)`. It does not inspect tool arguments. Argument-level judgement is the guards' job; mixing the two would make the boundary depend on parsing input the mode cannot verify.
- **D4** — No typed fiscal tools (`propose_journal`, `close_period`, …) in this feature. Those carry fiscal semantics and belong to the pinned kernel's `./journal`, `./fiscal`, `./candidates` exports; implementing them in the harness would violate AGENTS.md rule 1 ("Pi operates; it never authorizes"). This feature is harness policy only.

### L4 — 2026-10-27 — requirement-number collision corrected

`specs/authority/spec.md` already carried `REQ-AUTH-009 — Action boundaries per mode`, which is the **kernel's** authority modes (ASK/ANALYZE/PREPARE/EXECUTE), a different concept that merely shares the word "mode". S9 therefore targets **REQ-AUTH-010** with scenarios SC-AUTH-007 and SC-AUTH-008. Naming the new requirement 009 would have overwritten a live kernel requirement with a harness tool-surface rule — exactly the confusion REQ-AUTH-010's text now forbids ("it is not an authority level").
