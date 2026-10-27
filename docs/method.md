# The Drenyra method — EDA · CDA · RDA

> Three disciplines for agentic accounting. They take their shape from software engineering and their vocabulary from the books.

Gentle AI builds software with **ODD** (how work flows), **TDD** (the test before the code), and **RDD** (receipts for review). Drenyra does accounting, where the material is different: evidence, materiality, controls, entries, a close, and a filing to SUNAT that cannot be cheaply undone. The disciplines carry over. Their content doesn't.

| Discipline | Software original | The question it answers in the books |
| --- | --- | --- |
| **EDA — Evidence-Driven Accounting** | ODD | How does a piece of accounting work move from a question to a sealed outcome? |
| **CDA — Control-Driven Accounting** | TDD | How do we know an entry is right, and that the control checking it actually works? |
| **RDA — Receipt-Driven Accounting** | RDD | What proves that something material happened, who decided it, and on what basis? |

ODD is still how *this repository* is built (`AGENTS.md`). It is the developers' workflow, not the accountant's.

---

## EDA — Evidence-Driven Accounting

**Rule: no conclusion without a cited source, and materiality, not the agent, decides how much process the work gets.**

The pinned kernel defines EDA as 13 mission phases (REQ-MISS-001): intake, bind-scope, ingest, normalize, classify, reconcile, investigate, propose, verify, approve, execute, close, archive. In daily use, they group into four moves:

| Move | What happens | Where it lives |
| --- | --- | --- |
| **Scope** | Questions, reviews, and status stay read-only. Work binds the complete RUC + period scope, and `/drenyra:mode books` denies `bash`, `write`, and `edit`. | `/drenyra:scope`, `/drenyra:mode`, REQ-AUTH-010 |
| **Evidence** | Every source is ingested and cited as an evidence node. Memory (Drenyra Engram) can shape *what* is proposed, but it is never evidence. | `/drenyra:evidence`, REQ-ENG-006 |
| **Decide the path** | The kernel's materiality policy (BigInt thresholds) routes the work. A lookup stays light; R2 and above becomes a durable mission. Missing materiality inputs fail closed and never default to R0. | `lib/routing/types.ts`, `/drenyra:mission` |
| **Propose → refute → approve** | Agents propose candidates that are recorded, never posted. `anomaly-refuter` tries to break every finding before it is elevated, `guardian-angel` reviews independently, and the professional approves. | `agents/`, `/drenyra:verify` |

ODD's lesson that EDA keeps: **small work stays small, material work is tracked durably.** What EDA changes is who decides the size. In ODD the agent sizes the task. In EDA a deterministic policy does, because an accountant cannot audit an agent's sense of "this looks minor".

## CDA — Control-Driven Accounting

**Rule: the control comes before the entry, and the controls themselves are tested.**

TDD writes the failing test first. CDA writes the failing control first.

1. **RED: the control finds the difference.** The bank reconciliation is off by S/ 1,180.00, SIRE and the ERP disagree on a voucher, or the IGV does not match 18% of the base.
2. **GREEN: an entry is proposed that clears it.** It cites the evidence that explains the difference.
3. **Re-run the control.** The entry is right when the control passes, not when it "looks right".

TDD has a known weakness: a test that can't fail proves nothing. Software answers that with **mutation testing**, and CDA does the same for controls:

- The **control mutation suite** (`bun run eval:controls`, REQ-CONF-009) injects 25 known bookkeeping defects into a proposal and measures how many the kernel rejects.
- Current result: **18/25 (7200 bps)**, with no false alarms on valid entries.
- The 7 defects the kernel lets through are listed in [`docs/evals/control-mutation.md`](evals/control-mutation.md) and reported upstream as [arkelythex/drenyra-ai#123](https://github.com/arkelythex/drenyra-ai/issues/123).

**Status:** CDA is defined by Drenyra Shell. The control mutation suite exists; control-first entry proposal is the direction, not yet a chain. Formalizing CDA in `drenyra-ai` is proposed in [arkelythex/drenyra-ai#124](https://github.com/arkelythex/drenyra-ai/issues/124); until it lands, no other repository should rely on the name.

## RDA — Receipt-Driven Accounting

**Rule: no receipt, no mutation.**

Every material action produces an immutable, signed (Ed25519) receipt that records:

- the scope;
- the state before and after the action;
- the evidence it relied on;
- who approved it.

The receipt is what an auditor reads. Logs and chat history are not.

| Practice | Where it lives |
| --- | --- |
| Signed, verifiable receipts | `ReceiptStore` (`lib/receipt-store.ts`), `/drenyra:receipt` |
| Approval as a gate with an explicit approver (R2) | the kernel's `gates` and `approvals`, consumed and never reimplemented |
| Proposals that carry no receipt because they are not material yet | `propose_journal_entry` records but never posts (REQ-AUTH-011) |
| Command chains that end in a receipt | the RDA chains: close, reconcile, verify, evidence (`chains/`) |

RDA's honest edge: `record_receipt` (`extensions/fiscal-guard.ts`) is fail-open, and its description tells the agent so — it records an unsigned note, not proof. The signed path is `ReceiptStore`. See the README's known limitations.

---

## Why three, and not one

Each discipline guards against a different failure:

- **EDA** stops work from being *done in the wrong shape*: a close treated as a lookup, or a conclusion with no source behind it.
- **CDA** stops work from being *wrong while looking finished*: an entry that balances but clears nothing, or a control that never fires.
- **RDA** stops work from being *unprovable*: a correct outcome nobody can show was authorized.

A team can skip any one of them, and a different kind of mistake gets into the books.
