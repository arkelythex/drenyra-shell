/**
 * Control mutation suite — mutation testing adapted to accounting controls
 * (REQ-CONF-009).
 *
 * A mutant is one injected bookkeeping defect. The pinned kernel kills it by
 * rejecting the proposal; a survivor is a bad entry the kernel would record.
 * Valid variants measure the opposite failure: a correct entry rejected.
 *
 * This module never judges a proposal. It hands each case to a decider —
 * `proposeJournalEntry`, which wraps the pinned kernel — and classifies the
 * verdict. Survivors are kernel gaps to report upstream; fixing them in Pi
 * would make the harness decide (AGENTS.md rule 1).
 *
 * Fiscal convention: counts are integers and rates are integer basis points,
 * computed with BigInt division; no float is ever produced.
 */

import { CORPUS_ID, CORPUS_PROVENANCE, type MutationCase, type MutationKind } from "./control-mutation-corpus.js";
import {
  proposeJournalEntry,
  type JournalProposalRequest,
  type JournalProposalResult,
} from "./journal-proposal.js";

export type Decider = (request: JournalProposalRequest) => JournalProposalResult;

/** killed/survived for defects; accepted/false-alarm for valid variants. */
export type CaseOutcome = "killed" | "survived" | "accepted" | "false-alarm";

export interface CaseResult {
  readonly id: string;
  readonly kind: MutationKind;
  readonly description: string;
  readonly outcome: CaseOutcome;
  /** The kernel's rejection code, when it rejected the case. */
  readonly code?: string;
  readonly mitigation: string;
}

export interface Scoreboard {
  readonly corpusId: string;
  readonly provenance: string;
  readonly results: readonly CaseResult[];
  readonly defects: { total: number; killed: number; survived: number };
  readonly valid: { total: number; accepted: number; falseAlarms: number };
  /** killed / defects, integer basis points (10000 = every defect rejected). */
  readonly detectionBps: number;
  /** false alarms / valid variants, integer basis points. */
  readonly falseAlarmBps: number;
}

/** `numerator / denominator` in basis points, floored; 0 when there is nothing to divide. */
export function basisPoints(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Number((BigInt(numerator) * 10000n) / BigInt(denominator));
}

function classify(kind: MutationKind, result: JournalProposalResult): CaseOutcome {
  if (kind === "defect") return result.ok ? "survived" : "killed";
  return result.ok ? "accepted" : "false-alarm";
}

/**
 * Run every case against the decider. Fails closed when the decider rejects
 * the baseline: every mutant is measured relative to an accepted proposal, so
 * a rejected baseline would make every kill meaningless.
 */
export function runMutationSuite(
  cases: readonly MutationCase[],
  baseline: JournalProposalRequest,
  decide: Decider = proposeJournalEntry,
): Scoreboard {
  const baselineResult = decide(baseline);
  if (!baselineResult.ok) {
    throw new Error(
      `control mutation suite: the baseline was rejected (${baselineResult.code}); no mutant can be measured against it`,
    );
  }

  const results: CaseResult[] = cases.map((c) => {
    const verdict = decide(c.mutate(baseline));
    return {
      id: c.id,
      kind: c.kind,
      description: c.description,
      outcome: classify(c.kind, verdict),
      ...(verdict.ok ? {} : { code: verdict.code }),
      mitigation: c.mitigation,
    };
  });

  const count = (outcome: CaseOutcome): number =>
    results.filter((r) => r.outcome === outcome).length;
  const killed = count("killed");
  const survived = count("survived");
  const accepted = count("accepted");
  const falseAlarms = count("false-alarm");

  return {
    corpusId: CORPUS_ID,
    provenance: CORPUS_PROVENANCE,
    results,
    defects: { total: killed + survived, killed, survived },
    valid: { total: accepted + falseAlarms, accepted, falseAlarms },
    detectionBps: basisPoints(killed, killed + survived),
    falseAlarmBps: basisPoints(falseAlarms, accepted + falseAlarms),
  };
}

/** Plain-text report: provenance first, then both rates, then every failure. */
export function formatScoreboard(board: Scoreboard): string {
  const lines = [
    `control mutation suite — ${board.corpusId}`,
    `corpus: ${board.provenance}`,
    `detection: ${board.defects.killed}/${board.defects.total} defects rejected (${board.detectionBps} bps)`,
    `false alarms: ${board.valid.falseAlarms}/${board.valid.total} valid entries rejected (${board.falseAlarmBps} bps)`,
  ];

  const survivors = board.results.filter((r) => r.outcome === "survived");
  lines.push("", `survivors — defects the kernel would record (${survivors.length}):`);
  for (const r of survivors) {
    lines.push(`  - ${r.id}: ${r.description}`, `    mitigation: ${r.mitigation}`);
  }

  const alarms = board.results.filter((r) => r.outcome === "false-alarm");
  if (alarms.length > 0) {
    lines.push("", `false alarms — valid entries rejected (${alarms.length}):`);
    for (const r of alarms) {
      lines.push(`  - ${r.id} (${r.code ?? "no code"}): ${r.description}`);
    }
  }

  return lines.join("\n");
}
