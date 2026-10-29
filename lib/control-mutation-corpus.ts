/**
 * Synthetic corpus for the control mutation suite (REQ-CONF-009).
 *
 * One baseline journal proposal the pinned kernel accepts, plus cases derived
 * from it: `defect` cases inject exactly one known bookkeeping defect, and
 * `valid` cases change the proposal in a way that must still be accepted (they
 * measure false alarms). Labels only — no verdict is computed here; the kernel
 * decides and `lib/control-mutation.ts` classifies.
 *
 * The corpus is synthetic and NOT validated by a professional accountant. It is
 * not an evaluation of LLM agents.
 *
 * Fiscal convention: money is BigInt cents. The two cases that inject a JS
 * Number into `amountCents` do so on purpose, to prove the kernel refuses it.
 */

import type {
  JournalLineProposal,
  JournalProposalRequest,
} from "./journal-proposal.js";

export const CORPUS_ID = "journal-controls.synthetic.v1";

export const CORPUS_PROVENANCE =
  "synthetic fixture — not validated by a professional accountant; not an agent (LLM) evaluation";

export type MutationKind = "defect" | "valid";

export interface MutationCase {
  readonly id: string;
  readonly kind: MutationKind;
  /** The bookkeeping defect (or valid variation) this case represents. */
  readonly description: string;
  /**
   * The harness layer that already covers this case if the kernel lets it
   * through, or `none`. Recorded, never simulated.
   */
  readonly mitigation: string;
  readonly mutate: (base: JournalProposalRequest) => JournalProposalRequest;
}

/** Check-digit-valid RUC (Módulo 11 → 6). */
const BASELINE_RUC = "20123456786";

export const MUTATION_BASELINE: JournalProposalRequest = Object.freeze({
  companyId: "company-synthetic-1",
  ruc: BASELINE_RUC,
  period: "202609",
  entryId: "entry-synthetic-1",
  lines: Object.freeze([
    Object.freeze({ accountCode: "6011", side: "debit" as const, amountCents: 118000n }),
    Object.freeze({ accountCode: "4212", side: "credit" as const, amountCents: 118000n }),
  ]),
  evidence: Object.freeze({
    items: Object.freeze([
      Object.freeze({ id: "F001-00000123", label: "Purchase invoice F001-00000123", type: "invoice" }),
    ]),
    provenance: Object.freeze({
      channel: "document",
      source: "F001-00000123.xml",
      capturedAt: "2026-09-30T15:00:00.000Z",
      capturedBy: "operator",
    }),
  }),
  // Fixed, so the scoreboard never depends on the wall clock.
  asOf: "2026-10-01T00:00:00.000Z",
});

const NONE = "none";

function withLines(
  base: JournalProposalRequest,
  lines: readonly JournalLineProposal[],
): JournalProposalRequest {
  return { ...base, lines };
}

function withProvenance(
  base: JournalProposalRequest,
  patch: Partial<JournalProposalRequest["evidence"]["provenance"]>,
): JournalProposalRequest {
  return {
    ...base,
    evidence: { ...base.evidence, provenance: { ...base.evidence.provenance, ...patch } },
  };
}

/** Deliberately smuggle a JS Number past the type system, as an untyped caller could. */
function untypedAmount(value: number): bigint {
  return value as unknown as bigint;
}

function pair(debit: bigint, credit: bigint): JournalLineProposal[] {
  return [
    { accountCode: "6011", side: "debit", amountCents: debit },
    { accountCode: "4212", side: "credit", amountCents: credit },
  ];
}

const defect = (
  id: string,
  description: string,
  mutate: MutationCase["mutate"],
  mitigation: string = NONE,
): MutationCase => ({ id, kind: "defect", description, mitigation, mutate });

const valid = (id: string, description: string, mutate: MutationCase["mutate"]): MutationCase => ({
  id,
  kind: "valid",
  description,
  mitigation: NONE,
  mutate,
});

export const MUTATION_CASES: readonly MutationCase[] = Object.freeze([
  // Amounts and balance.
  defect("unbalanced-by-one-cent", "Debit exceeds credit by a single cent.", (b) =>
    withLines(b, pair(118001n, 118000n)),
  ),
  defect("zero-amount", "Both lines carry zero cents: an entry with no economic effect.", (b) =>
    withLines(b, pair(0n, 0n)),
  ),
  defect("negative-amount", "Amounts are negative instead of using the opposite side.", (b) =>
    withLines(b, pair(-118000n, -118000n)),
  ),
  defect("single-sided-entry", "Only the debit line is present.", (b) =>
    withLines(b, [{ accountCode: "6011", side: "debit", amountCents: 118000n }]),
  ),
  defect("no-lines", "The entry has no lines at all.", (b) => withLines(b, [])),
  defect("float-amount", "Amounts are a fractional JS Number instead of BigInt cents.", (b) =>
    withLines(b, pair(untypedAmount(1180.5), untypedAmount(1180.5))),
  ),
  defect("number-amount", "Amounts are an integer JS Number instead of BigInt cents.", (b) =>
    withLines(b, pair(untypedAmount(118000), untypedAmount(118000))),
  ),
  defect("empty-account-code", "The debit line has an empty account code.", (b) =>
    withLines(b, [
      { accountCode: "", side: "debit", amountCents: 118000n },
      { accountCode: "4212", side: "credit", amountCents: 118000n },
    ]),
  ),
  defect("unknown-side", "A line uses the side \"dr\" instead of debit or credit.", (b) =>
    withLines(b, [
      { accountCode: "6011", side: "dr" as unknown as "debit", amountCents: 118000n },
      { accountCode: "4212", side: "credit", amountCents: 118000n },
    ]),
  ),

  // Evidence.
  defect("no-evidence-items", "The evidence artifact lists no items.", (b) => ({
    ...b,
    evidence: { ...b.evidence, items: [] },
  })),
  defect("duplicate-evidence-ids", "The same evidence item is listed twice.", (b) => ({
    ...b,
    evidence: { ...b.evidence, items: [b.evidence.items[0], b.evidence.items[0]] },
  })),
  defect("engram-evidence-channel", "Evidence claims to come from Drenyra Engram memory.", (b) =>
    withProvenance(b, { channel: "engram" }),
  ),
  defect("memory-evidence-channel", "Evidence claims to come from a memory channel.", (b) =>
    withProvenance(b, { channel: "memory" }),
  ),
  defect("empty-evidence-source", "Evidence provenance has no source.", (b) =>
    withProvenance(b, { source: "" }),
  ),
  defect("unparseable-capture-date", "Evidence capture timestamp is not a date.", (b) =>
    withProvenance(b, { capturedAt: "not-a-date" }),
  ),
  defect("future-capture-date", "Evidence was supposedly captured in 2099.", (b) =>
    withProvenance(b, { capturedAt: "2099-01-01T00:00:00.000Z" }),
  ),
  defect("empty-captured-by", "Evidence provenance names nobody as its capturer.", (b) =>
    withProvenance(b, { capturedBy: "" }),
  ),

  // Scope.
  defect("short-ruc", "The RUC has three digits.", (b) => ({ ...b, ruc: "123" })),
  defect(
    "ruc-wrong-check-digit",
    "The RUC has eleven digits but fails the SUNAT Módulo 11 check digit.",
    (b) => ({ ...b, ruc: "20123456789" }),
    "runtime/context.ts rejects a RUC with a wrong check digit before a scope is stored, and propose_journal_entry reads the RUC only from that store",
  ),
  defect("non-digit-ruc", "The RUC contains a letter.", (b) => ({ ...b, ruc: "2012345678A" })),
  defect("dashed-period", "The period is written 2026-09 instead of YYYYMM.", (b) => ({
    ...b,
    period: "2026-09",
  })),
  defect("month-thirteen-period", "The period names month 13.", (b) => ({ ...b, period: "202613" })),
  defect("month-zero-period", "The period names month 00.", (b) => ({ ...b, period: "202600" })),
  defect("empty-company-id", "The company id is empty.", (b) => ({ ...b, companyId: "" })),
  defect("empty-entry-id", "The entry has an empty id, so it cannot be referenced.", (b) => ({
    ...b,
    entryId: "",
  })),

  // Valid variants: must be accepted.
  valid("three-line-split", "A balanced entry splitting the debit across two accounts.", (b) =>
    withLines(b, [
      { accountCode: "6011", side: "debit", amountCents: 100000n },
      { accountCode: "40111", side: "debit", amountCents: 18000n },
      { accountCode: "4212", side: "credit", amountCents: 118000n },
    ]),
  ),
  valid(
    "amount-above-safe-integer",
    "A balanced entry above Number.MAX_SAFE_INTEGER cents, which only BigInt can carry exactly.",
    (b) => withLines(b, pair(900719925474099300n, 900719925474099300n)),
  ),
  valid("other-valid-ruc", "A different, check-digit-valid RUC.", (b) => ({
    ...b,
    ruc: "20100070970",
  })),
]);
