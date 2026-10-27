# Feature: drenyra-method

**Objective:** present the accounting-native method — EDA · CDA · RDA — as the product's workflow in the README, instead of ODD, and align the ecosystem section with the Gentle AI parallel. ODD remains the way this repository is built.
**Branch:** `docs/drenyra-method`
**Test runner:** `bun run test` (vitest). Gates: `typecheck`, `test`, `verify:capability`, `verify:style`, `refresh:lock-facts --check`.

## Specs

- **S1 — An ecosystem parallel to Gentle AI.** From the request: "si gentleman tiene el ecosistema gentle-ai con gentle-shell , gentle-engram , entonces mi ecosistema debe ser Drenyra-ai , drenyra-shell + drenyra-engram y mas pero adaptado para la contabilidad". The README ecosystem section names drenyra-ai, drenyra-shell, drenyra-engram, and drenyra-command-center with their roles. Engram is no longer called "planned".
- **S2 — No ODD in the product README.** From the request: "en mi readme no deberia explicar ODD si no un flujo nuevo para la contabilidad agentica inspirado en ODD". The README's workflow section presents **EDA — Evidence-Driven Accounting**, the name the kernel already uses for its mission phases (REQ-MISS-001). ODD is mentioned only as the way the repository itself is built.
- **S3 — TDD and RDD adapted too.** From the request: "y asi con TDD , RDD pero para la contabilidad". **CDA — Control-Driven Accounting** (the control before the entry; the control mutation suite tests the controls) and **RDA — Receipt-Driven Accounting** (the existing name: no receipt, no mutation) are presented next to EDA.
- **S4 — Approved naming.** EDA · CDA · RDA, reusing the names that already exist (approved in L2). CDA is new and is disclosed as Shell-defined until `drenyra-ai` formalizes it.
- **S5 — Diagram follows the name.** The workflow diagram is relabelled from ODD to EDA and renamed `drenyra-eda-workflow.{light,dark}.svg`. Its steps are unchanged.
- **S6 — One full reference.** `docs/method.md` defines EDA, CDA, and RDA with where each lives in the code, and maps them to ODD, TDD, and RDD for readers who know Gentle AI. AGENTS.md states that ODD builds the repository and the method is the product.
- **S7 — Gates green**, README conformance markers kept, one PR.

## Tasks

- [ ] **T1** — `docs/method.md`. *(S2, S3, S4, S6)*
- [ ] **T2** — README: replace the ODD section with the method; rewrite the ecosystem section. *(S1, S2, S3)*
- [ ] **T3** — Relabel and rename the diagram; update its references. *(S5)*
- [ ] **T4** — AGENTS.md line and CHANGELOG. *(S6)*
- [ ] **T5** — Gates, lock facts, PR. *(S7)*

## Log

### L1 — 2026-10-27 — original request (verbatim)

> hey bro , si gentleman tiene el ecosistema gentle-ai con gentle-shell , gentle-engram , entonces mi ecosistema debe ser Drenyra-ai , drenyra-shell + drenyra-engram y mas pero adaptado para la contabilidad en mi readme no deberia explicar ODD si no un flujo nuevo para la contabilidad agentica inspirado en ODD entiendes ?? y asi con TDD , RDD pero para la contabilidad entiendes ??

### L2 — 2026-10-27 — naming approval (verbatim)

The proposed naming was EDA · CDA · RDA, reusing the names that already exist. User answer:

> yes te autorizo todo y avanza

### L3 — 2026-10-27 — evidence

- "13 EDA phases" / REQ-MISS-001 (`specs/mission-protocol/spec.md:9`) and "evidence-driven accounting harness" in all ten agents: EDA already exists.
- "RDA (Receipt-Driven Accounting)" appears across the repository, and the chains are "RDA command chains": RDA already exists.
- The README Ecosystem section still says Drenyra Engram is a "planned integration", contradicting #89.
- `extensions/fiscal-guard.ts:372` calls `record_receipt` "the RED (Receipt-Driven Execution) primitive". It is not renamed to RDA, because `record_receipt` is fail-open (README known limitations) and calling it an RDA primitive would overclaim. Left as a follow-up: a model-facing tool description is a behavior change, out of scope for a docs feature.
- `AI_POLICY.md`'s "Receipt-Driven Development" is about reviewing contributions (the developer RDD), so it is correct as is.
