# Agentic accounting landscape — October 2026

> Snapshot taken 2026-10-27 from public announcements dated 2026-09-28 to 2026-10-27. Vendor claims are quoted as claims, not verified results. This note records what Drenyra Shell takes from them, and what it rejects.

## What shipped this month

| Date | Who | What | Source |
| --- | --- | --- | --- |
| 2026-10-13 | Digits | **Write MCP** with **Locked Periods**: agents get 18 write tools, and any edit to a locked period is queued for an admin to approve. Agents run under the signed-in user's permissions. | [digits.com/blog/write-mcp](https://digits.com/blog/write-mcp/), [CPA Practice Advisor](https://www.cpapracticeadvisor.com/2026/10/13/digits-launches-write-mcp-the-safe-way-for-ai-agents-to-do-accounting/191655/) |
| 2026-10-07 | Digits | Benchmark claim: one-shot LLM classification "has plateaued", and agents improve only when they can look up the business's own booking history. | [digits.com/blog/ai-cant-close-books-from-outside](https://digits.com/blog/ai-cant-close-books-from-outside/) |
| 2026-10-19 | The AI Accountant | Independent reading of Write MCP. Locking, reconciliation finalization, paying, sending, connecting, and inviting all stay human. In **open** periods, changes apply automatically, so the firm has to design that review step itself. | [theaiaccountant.ai](https://www.theaiaccountant.ai/blog/weekly-ai-roundup-digits-write-switch-clients) |
| 2026-10-18 | Level | **LevelBench-100**: 100 binary checks on messy SMB takeovers. Unassisted models score 31%–71%, with a **14.3%–57.1% bad book-entry rate**. The benchmark includes "Hold & Ask" checks, where the right answer is to not post. | [levelcfo.com/blog/levelbench-100](https://levelcfo.com/blog/levelbench-100-ai-accounting-cfo-benchmark/) |
| 2026-10-01 | Rillet | **RAAB** methodology: graded by a CPA against an expert key. The governing rule is "no answer is better than a confident wrong one", and act-versus-pause is scored separately. | [rillet.com/blog/inside-the-raab-methodology](https://www.rillet.com/blog/inside-the-raab-methodology-the-rubric-we-use-to-grade-ai-on-accounting) |
| 2026-10-21 | Safebooks | Close, finance operations, and SOX suite on a "Financial Data Graph"; agents assemble source-linked workpapers, and humans keep judgments and approvals. | [PR Newswire](https://www.prnewswire.com/news-releases/safebooks-launches-unified-enterprise-finance-automation-suite-for-close-finance-operations-and-sox-compliance-302915570.html) |
| 2026-10-26 | Double | **Autoclose**: agents run close steps throughout the month, and accountants review what is flagged and sign off. | [Business Wire via Yahoo Finance](https://finance.yahoo.com/technology/ai/articles/double-launches-autoclose-ai-runs-130000779.html) |
| 2026-10-06 | Pilot | **Meridian** close dashboard: stages Prepare → In progress → Review → Done. QA and flux analysis run *before* review. | [GlobeNewswire](https://www.globenewswire.com/news-release/2026/10/06/3375797/0/en/meridian-gives-accounting-firms-a-live-view-of-every-client-close-with-the-month-end-dashboard.html) |
| 2026-10-27 | Intuit | **Agentic Books Close** (pilot) follows the firm's SOPs and writes actions to an audit log. | [Intuit investor release](https://investors.intuit.com/news-events/press-releases/detail/1329/intuit-expands-intelligence-platform-to-power-the-next-era-of-accounting-firm-and-business-growth) |

## The pattern

Every vendor converges on the same shape:

- agents do the work continuously;
- deterministic controls and a review queue stand between the agent and the book of record;
- a human signs off.

The differentiator is no longer *whether* agents act. It is **how the boundary is enforced, and whether anyone measures what slips through it.**

## What Drenyra Shell takes

| Idea | Where it already lives, or what it changes |
| --- | --- |
| Locked period → proposal queue (Digits) | Already the default and stronger. `propose_journal_entry` records but never posts, in **every** period, not only locked ones. That closes the open-period gap The AI Accountant flagged. Posting needs a receipt issuer the harness does not have (`README.md` known limitations). |
| Agent runs under the user's permissions (Digits) | The `books` operation mode and per-agent `tools:` frontmatter (REQ-AUTH-010, REQ-ENG-005). |
| Bad book-entry rate (LevelBench-100) | Adopted as the **survivor rate** of the control mutation suite (`docs/evals/control-mutation.md`): defects the kernel would record. |
| No answer beats a confident wrong one (RAAB) | Adopted as the asymmetry of the suite. A survivor (a defect recorded) is the expensive failure, and a false alarm is measured separately, never traded against it. |
| Business-specific history beats one-shot models (Digits) | Supports REQ-ENG-005: proposing agents read institutional memory. Memory still never counts as evidence (`trust-model.md` §5). |
| QA before review (Meridian), continuous close (Digits, Double) | Recorded as a follow-up: run chain gates on every ingest instead of at month-end. Not built here. |

## What Drenyra Shell rejects, and why

- **Write access applied automatically in open periods.** Filing to SUNAT is the irreversible boundary. An accepted rectification costs money and credibility, so the harness keeps "record, never post" everywhere instead of "post unless locked".
- **Agents approving bills** (inside Digits' agent boundary). Approval stays a human gate in `drenyra-ai`. Pi never authorizes (AGENTS.md rule 1).
- **Headline accuracy without a disclosed corpus.** Vendor numbers such as 97.8% and 100% are self-reported on private data. Drenyra reports its own number only with a reproducible corpus, a named version, and the survivors listed.

## Open follow-ups

1. **Agent evaluation in shadow mode.** Agents propose next to the human's real work, and the two are diffed. This is the LevelBench-style measure for the LLM layer, which the control suite deliberately does not cover.
2. **Professional-validated corpus.** Replace the synthetic baseline with an anonymized month a professional accountant signs off.
3. **Continuous close.** Run chain gates on ingest instead of at month-end.
