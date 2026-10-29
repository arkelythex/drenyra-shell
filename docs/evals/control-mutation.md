# Control mutation suite

> REQ-CONF-009 · Corpus `journal-controls.synthetic.v1` · Measured against `drenyra-ai@0.8.0` · Run with `bun run eval:controls`

## The idea

Software teams don't trust a test suite because it passes. They trust it when they break the code on purpose and the tests notice. That is **mutation testing**: inject one known fault, run the checks, and see whether they **kill** the mutant or let it **survive**.

Accounting controls deserve the same treatment. A control that never rejects anything looks identical to a control that works, until a bad entry reaches the books.

| Mutation testing | Accounting adaptation |
| --- | --- |
| Original program | A journal proposal the kernel accepts (the *baseline*) |
| Mutant | The baseline with exactly one bookkeeping defect injected |
| Killed | The kernel rejects the proposal, with its own error code |
| Survived | The kernel would record a bad entry |
| Equivalent mutant (noise) | Excluded on purpose: a debatable case such as a self-offsetting entry would make the metric argue with itself |
| — | **Valid variants**: proposals that must still be accepted, which measure false alarms |

## What it measures, and what it doesn't

- **It measures** the deterministic controls at the journal-proposal boundary (`lib/journal-proposal.ts`, which wraps `validateTenantScope`, `acceptEvidence`, and `journal.record` from the pinned kernel).
- **It does not measure** the LLM agents. Whether an agent *proposes* the right entry is a different question, answered by shadow-mode evaluation against a professional's real work. That is not built yet.
- **It does not measure** what a professional would have done. The corpus is synthetic and not validated by a professional accountant, and every report says so.

## Two numbers, never traded against each other

- **Detection**: defects rejected ÷ defects, in integer basis points. This is the inverse of the *bad book-entry rate* LevelBench-100 reports for unassisted models.
- **False alarms**: valid entries rejected ÷ valid variants, in basis points.

They are reported separately because the failures are not symmetric. A survivor is a confident wrong entry in the book of record, and as Rillet's RAAB rubric puts it, "no answer is better than a confident wrong one". A false alarm costs a human a second look. A single blended score would hide that difference.

## Current scoreboard

```text
detection: 24/25 defects rejected (9600 bps)
false alarms: 0/3 valid entries rejected (0 bps)
```

### Survivors — kernel gaps ([arkelythex/drenyra-ai#123](https://github.com/arkelythex/drenyra-ai/issues/123))

It is deferred upstream on purpose, not forgotten.

| Case | Defect | Why it is deferred | Harness mitigation |
| --- | --- | --- | --- |
| `ruc-wrong-check-digit` | 11-digit RUC failing SUNAT Módulo 11 | Checksummed RUC is decision-gated in the kernel's ecosystem-cleanup spec | `runtime/context.ts` rejects it before a scope is stored, and `propose_journal_entry` reads the RUC only from that store |

### History

| Pin | Detection | False alarms | What moved |
| --- | --- | --- | --- |
| `0.4.1` – `0.6.0` | 18/25 (7200 bps) | 0/3 | baseline |
| `0.7.0` | 23/25 (9200 bps) | 0/3 | [drenyra-ai#131](https://github.com/arkelythex/drenyra-ai/pull/131) kills `zero-amount` (`invalid-amount`), `empty-account-code` (`invalid-account`), `empty-entry-id` (`invalid-entry-id`), `no-evidence-items` (`missing-evidence`), and `duplicate-evidence-ids` (`INVALID_ITEM`) |
| `0.8.0` | 24/25 (9600 bps) | 0/3 | [drenyra-ai#162](https://github.com/arkelythex/drenyra-ai/pull/162) kills `future-capture-date` (`future-evidence`) through a required reference instant `asOf`. The harness supplies `asOf` from its own clock; the corpus baseline fixes it, so the scoreboard never depends on the wall clock |

## Rules

1. **The kernel decides, the suite only classifies.** `runMutationSuite` takes a decider (by default `proposeJournalEntry`) and maps `ok` to accepted and an error to rejected. The test suite proves this by swapping in deciders that accept or reject everything.
2. **Survivors are fixed upstream, never in Pi.** Adding a zero-amount check in the harness would make Pi a fiscal authority (AGENTS.md rule 1). A survivor becomes an issue against `drenyra-ai`. When a pin upgrade kills it, the ratchet test fails and the scoreboard moves in that same release.
3. **The baseline must be accepted.** If the kernel rejects the baseline, every "kill" would be meaningless, so the suite throws instead of reporting.
4. **Integers only.** Counts are integers, and rates are basis points computed with BigInt division.

## Adding a case

Add one entry to `MUTATION_CASES` in `lib/control-mutation-corpus.ts`:

- a stable `id`;
- `kind` set to `defect` or `valid`;
- a one-line `description`;
- `mitigation` (`none` unless a named harness layer already covers it);
- a pure `mutate(base)` that changes exactly one thing.

Run `bun run eval:controls`, then update the expected sets in `__tests__/control-mutation.test.ts`. A defect whose label a professional could reasonably dispute does not belong here.
