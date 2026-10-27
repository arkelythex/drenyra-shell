# Feature: control-mutation-suite

**Objective:** turn "no measured eval set" into a number by adapting mutation testing to accounting controls: inject known defects into a synthetic journal proposal and measure how many the pinned kernel rejects and how many valid variants it wrongly rejects.
**Branch:** `feat/control-mutation-suite` · **Issue:** #92
**Test runner:** `bun run test` (vitest). Gates: `typecheck`, `test`, `verify:capability`, `verify:style`, `refresh:lock-facts --check`.

## Specs

- **S1 — Software methodology adapted to accounting.** From the request: "inpirarse en metodologias de la ingeneria de softwart pero adaptarlas a la contabilidad" and "implementa la filosoifa de gentleman + buenas practicas de git y github". Mutation testing maps to accounting as: a mutant is one injected bookkeeping defect, a kill is a kernel rejection, and a survivor is a bad entry the kernel would record.
- **S2 — Inspired by the current state of the art.** From the request: "inspirates de otros que estan en la vanguardia como digits ai , y otros de softwart contables agenticos del mundo , de esta semana o mes en la web". The research is recorded with dated, cited sources in `docs/research/2026-10-agentic-accounting-landscape.md`, and each adopted idea is mapped to a concrete harness decision. Ideas the harness rejects are named, with the reason.
- **S3 — The kernel decides, the suite only measures.** The suite calls `proposeJournalEntry` (which wraps the pinned kernel) and classifies the verdict. It MUST NOT judge balance, amounts, RUC, period, or evidence itself, and it MUST NOT fix any survivor in Pi (AGENTS.md rule 1). Survivors are recorded as kernel gaps, each with a `mitigation` naming any harness layer that already covers it, or `none`.
- **S4 — Two metrics, integers only.** The scoreboard reports defects killed and survived, valid variants accepted and falsely rejected, and the detection and false-alarm rates in integer basis points (computed with integer math, never a float).
- **S5 — Ratchet.** A test pins the exact scoreboard: the killed set with each kernel code, the survivor set, and zero false alarms. A pin upgrade that changes any verdict fails the test, so the change has to be reviewed and the scoreboard updated in the same release.
- **S6 — Honest corpus.** The corpus is synthetic and is labelled as not validated by a professional accountant everywhere it is reported. It is not an agent (LLM) evaluation.
- **S7 — Runnable report.** `bun run eval:controls` prints the scoreboard and the survivor list with mitigations.
- **S8 — Docs and spec.** `specs/program-conformance/spec.md` gains REQ-CONF-009. A methodology doc lives in `docs/evals/control-mutation.md`. The README "No measured eval set" limitation reflects the partial measure, and CHANGELOG records the addition.
- **S9 — Gates green; one PR linked to #92** with Conventional Commits and a merge commit.

## Tasks

- [ ] **T1** — Research doc with dated sources and the adopted/rejected mapping. *(S2)*
- [ ] **T2** — RED: `__tests__/control-mutation.test.ts` (scoreboard ratchet, integer basis points, the suite never decides). *(S3, S4, S5, S6)*
- [ ] **T3** — `lib/control-mutation.ts` (engine + report) and `lib/control-mutation-corpus.ts` (synthetic baseline, 25 mutants, valid variants). *(S1, S3, S4, S6)*
- [ ] **T4** — `scripts/eval-controls.ts` + `eval:controls` package script. *(S7)*
- [ ] **T5** — REQ-CONF-009, methodology doc, README, CHANGELOG. *(S8)*
- [ ] **T6** — Gates, lock facts, PR. *(S9)*

## Log

### L1 — 2026-10-27 — original request (verbatim)

> drenyra-shell debe estar en la vanguardia inpirandose en gentle-shell , ❯ gentle-shell --version
> gentle-shell 4.4.0
> pi 1.2.0 , inpirarse en metodologias de la ingeneria de softwart pero adaptarlas a la contabilidad entiendes ?? o que mas recomiendas , cuestionar y mas

### L2 — 2026-10-27 — authorization (verbatim)

> perfect te autorizo todo avanza de forma autonoma implementa la filosoifa de gentleman + buenas practicas de git y github , ademas inspirates de otros que estan en la vanguardia como digits ai , y otros de softwart contables agenticos del mundo , de esta semana o mes en la web

The open question from the previous turn (a real anonymized ledger or a synthetic fixture) was not answered. Under the autonomy grant, I chose the synthetic fixture, labelled as not professional-validated, as proposed (S6).

### L3 — 2026-10-27 — spike evidence (pinned `drenyra-ai@0.4.1`, scratch dir outside the repo)

25 defects: 18 rejected, 7 accepted. The accepted ones are a zero amount, an empty account code, no evidence items, duplicate evidence ids, a future `capturedAt`, a wrong RUC check digit, and an empty entry id. Two valid variants (3 lines; a 900719925474099300-cent amount above `Number.MAX_SAFE_INTEGER`) were accepted. Also, the existing test fixture RUC `20123456789` fails Módulo 11 (expected check digit 6). The suite's baseline uses `20123456786`.

### L4 — 2026-10-27 — decisions

- **D1** — Measure the kernel boundary only (`proposeJournalEntry`). Harness layers that already cover a survivor are recorded as `mitigation`, not simulated, because modelling them would assert a guarantee the tool does not re-check.
- **D2** — The self-offsetting entry (same account, debit and credit) is excluded. It is not unambiguously a defect, and a mutant with a debatable label would make the metric argue with itself.
- **D3** — Survivors are reported upstream to `drenyra-ai`, not fixed here. Filing in that repository is left as a next step for the human (it is a different destination).
- **D4** — The subagent tool is denied in this runtime, so the work runs inline even past the context backstop.
