/**
 * Journal proposal — the harness proposes, the pinned kernel decides.
 *
 * This module is deliberately thin. Every fiscal judgement lives in
 * `drenyra-ai`: scope validity (`validateTenantScope`), evidence admissibility
 * (`acceptEvidence`), and amount, balance and evidence binding
 * (`journal.record`). The harness maps arguments, calls those entry points in
 * order, and reports the kernel's verdict — including its error codes — without
 * deciding anything itself.
 *
 * The proposal half only. `journal.post` is NOT called: posting issues a signed
 * receipt and is the authority action, so it stays out until a real receipt
 * issuer contract exists. A RECORDED entry has no ledger effect.
 *
 * Fiscal convention: money is BigInt cents. This module never sums, rounds or
 * converts an amount.
 */

import { acceptEvidence } from "drenyra-ai/evidence";
import { record } from "drenyra-ai/journal";
import { validateTenantScope } from "drenyra-ai/tenant";

/** One proposed journal line. `amountCents` is BigInt cents, never a float. */
export interface JournalLineProposal {
  accountCode: string;
  side: "debit" | "credit";
  amountCents: bigint;
}

/** One evidence artifact. `type`, `label` and `id` must be non-empty. */
export interface EvidenceItemProposal {
  id: string;
  label: string;
  type: string;
}

/** Where the evidence came from. Memory-shaped channels are rejected upstream. */
export interface EvidenceProvenanceProposal {
  channel: string;
  source: string;
  capturedAt: string;
  capturedBy: string;
}

export interface JournalProposalRequest {
  companyId: string;
  ruc: string;
  period: string;
  entryId: string;
  lines: readonly JournalLineProposal[];
  evidence: {
    items: readonly EvidenceItemProposal[];
    provenance: EvidenceProvenanceProposal;
  };
  /**
   * Reference instant (ISO-8601) the kernel compares evidence capture times
   * against. The harness supplies it from its own clock, never the agent.
   */
  asOf: string;
}

/** A RECORDED entry summary. Deliberately carries no receipt. */
export interface JournalProposalEntry {
  id: string;
  status: string;
  lineCount: number;
  evidenceCount: number;
}

export type JournalProposalResult =
  | { ok: true; entry: JournalProposalEntry }
  | { ok: false; code: string; message: string };

/**
 * Ask the kernel to record a proposed entry.
 *
 * Returns the kernel's RECORDED snapshot, or the kernel's own error code and
 * message. A rejection is not an exception here: the caller is a tool that must
 * report the verdict, and turning a fiscal refusal into a thrown error would
 * invite a caller to catch and continue.
 */
export function proposeJournalEntry(
  request: JournalProposalRequest,
): JournalProposalResult {
  try {
    const scope = validateTenantScope({
      companyId: request.companyId,
      ruc: request.ruc,
      period: request.period,
    });

    const evidence = acceptEvidence({
      scope,
      items: request.evidence.items.map((item) => ({
        id: item.id,
        label: item.label,
        type: item.type,
      })),
      provenance: {
        channel: request.evidence.provenance.channel,
        source: request.evidence.provenance.source,
        capturedAt: request.evidence.provenance.capturedAt,
        capturedBy: request.evidence.provenance.capturedBy,
      },
    });

    const entry = record({
      id: request.entryId,
      scope,
      lines: request.lines.map((line) => ({
        accountCode: line.accountCode,
        side: line.side,
        amountCents: line.amountCents,
      })),
      evidence: [evidence],
      asOf: request.asOf,
    });

    return {
      ok: true,
      entry: {
        id: entry.id,
        status: entry.status,
        lineCount: entry.lines.length,
        evidenceCount: entry.evidence.length,
      },
    };
  } catch (error) {
    const candidate = error as { code?: unknown; message?: unknown };
    return {
      ok: false,
      code:
        typeof candidate.code === "string" ? candidate.code : "unknown-error",
      message:
        typeof candidate.message === "string"
          ? candidate.message
          : "the kernel rejected the proposal without a message",
    };
  }
}
