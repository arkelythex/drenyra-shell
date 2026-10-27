# Feature: institutional-memory-agents

**Objective:** widen `drenyra_institutional_memory` from one agent to the agents whose proposals an institutional precedent actually shapes, and pin the deliberate exclusion of the rest.
**Branch:** `feat/institutional-memory-agents`
**Test runner:** `bun run test` (vitest). Gates: `typecheck`, `test`, `verify:capability`, `verify:style`, `refresh:lock-facts --check`.

## Specs

- **S1 — Scope by criterion, not by completeness.** From the request: "decidir cuáles realmente necesitan contexto institucional (no todos lo necesitan; un agente que solo redacta no gana nada leyendo memoria)". Approved scope: `invoice-sire-agent`, `reconciliation-agent`, and `tax-controller-pe` gain `drenyra_institutional_memory`, joining `journal-candidate-agent`. Criterion (`trust-model.md` §5): memory decides WHAT to propose, never HOW MUCH review — only agents that propose content a provider/account precedent can shape qualify.
- **S2 — Explicit, tested exclusion.** `guardian-angel`, `anomaly-refuter`, `evidence-builder`, `close-controller`, `accounting-scout`, and `ledger-analyst` MUST NOT declare `drenyra_institutional_memory`. Because the frontmatter `tools:` line is the only gate (the tool is registered globally), the inclusion and exclusion sets are pinned by `__tests__/agents.test.ts`.
- **S3 — Read surface only.** From the request: "la superficie de lectura es SOLO engram_context y engram_search. Nunca ninguna tool accounting_* y nunca una tool de escritura (engram_save, engram_reject, engram_void, engram_supersede). Memoria informa, jamás autoriza." No agent may declare any `accounting_*` tool or any `engram_*` tool; tested across all ten agents.
- **S4 — Same contract per role.** Each newly covered agent carries an "Institutional memory (informs proposals, never authority)" section adapted to its role: memory may change which exception/discrepancy/finding is proposed, never review depth, never authority, never counts as evidence, and an empty/unavailable result never blocks the agent.
- **S5 — Docs, spec, contract.** REQ-ENG-005/006 and the spec's Out of Scope name the four agents and the six exclusions; `contracts/engram-dependency.md`, `agents/README.md`, `extensions/register.ts` doc comment, `capability-manifest.yaml`, README, ROADMAP, and CHANGELOG reflect the new reach. `assets/agents/` mirrors byte-for-byte.
- **S6 — Gates green.** `typecheck`, `test`, `verify:capability`, `verify:style`, and the lock-facts check pass.

## Tasks

- [x] **T1** — RED tests in `__tests__/agents.test.ts`: inclusion set, exclusion set, no `accounting_*`/`engram_*` tools, memory section present in each covered agent. *(S1, S2, S3, S4)* — `2129abc`
- [x] **T2** — Add the tool and role-adapted section to the three agents; mirror to `assets/agents/`. *(S1, S4)* — `2129abc`
- [x] **T3** — Spec, contract, README, agents README, manifest, ROADMAP, CHANGELOG, `register.ts` comment. *(S5)* — `2129abc`
- [x] **T4** — Gates and lock-facts refresh. *(S6)* — `2129abc`

## Log

### L1 — 2026-10-27 — original request (verbatim)

> PRÓXIMA TAREA
> Ampliar el acceso a memoria institucional de 1 agente a los 9 restantes.
> - Hoy solo agents/journal-candidate-agent.md declara drenyra_institutional_memory en su frontmatter `tools:`.
> - Faltan: accounting-scout, anomaly-refuter, close-controller, evidence-builder, guardian-angel,
>   invoice-sire-agent, ledger-analyst, reconciliation-agent, tax-controller-pe.
> - Regla dura (contracts/engram-dependency.md regla 6): la superficie de lectura es SOLO engram_context y
>   engram_search. Nunca ninguna tool accounting_* y nunca una tool de escritura (engram_save, engram_reject,
>   engram_void, engram_supersede). Memoria informa, jamás autoriza.
> - Antes de tocar nada: leer contracts/engram-dependency.md, agents/README.md y los diez agentes, y decidir
>   cuáles realmente necesitan contexto institucional (no todos lo necesitan; un agente que solo redacta no
>   gana nada leyendo memoria). Esa decisión de alcance se consulta antes de implementar.

### L2 — 2026-10-27 — scope proposal and approval

Proposed 3 of 9 (invoice-sire-agent, reconciliation-agent, tax-controller-pe) with tested exclusion of the other six. User answer (verbatim):

> perfect te autorizo todo y avanza de forma autonoma

### L3 — 2026-10-27 — exclusion rationale

- `guardian-angel`: independent adversarial reviewer; institutional memory is "what was accepted before" and would anchor it, defeating its independence.
- `anomaly-refuter`: refutes against cited lineage; "this is normal for this provider" is a precedent-shaped refutation shortcut — memory changing review depth, forbidden by `trust-model.md` §5.
- `evidence-builder`: memory is not evidence; risk of it leaking into graph nodes.
- `close-controller`: coordinates mission status; proposes no content a precedent shapes.
- `accounting-scout`, `ledger-analyst`: inventory and analyse what exists; marginal benefit against real audit surface. Revisit only with a concrete case.

### L4 — 2026-10-27 — exploration evidence

- `extensions/register.ts:1512` registers `drenyra_institutional_memory` globally; no per-agent check in code. The agent frontmatter `tools:` line is the sole gate, hence S2's tests.
- The tool's scope comes from the local pointer, never from the agent (`register.ts:714-748`); no change to the tool is needed.

### L5 — 2026-10-27 — verification (`2129abc`)

Observed on the committed tree:

- RED before T2: `__tests__/agents.test.ts` failed exactly the three new-reader cases (invoice-sire-agent, reconciliation-agent, tax-controller-pe); journal-candidate-agent and all six exclusion cases passed.
- GREEN after T2: `agents.test.ts` 104/104.
- `bun run typecheck` clean; `bun run test` 58 files / 846 passed (825 before + 21 new); `verify:capability` OK; `verify:style` OK.
- `contracts/engram-dependency.md` changed intentionally, so `contracts/SHA256SUMS.json` was regenerated with `node scripts/verify-package-files.mjs --update`.
- `refresh-program-lock-facts.mjs --check`: "program lock facts are current".
- No change to `drenyra_institutional_memory` itself, to any gate, or to the materiality policy (REQ-ENG-006).
