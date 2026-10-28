/**
 * Control mutation suite (REQ-CONF-009; odd/tasks/control-mutation-suite.md).
 *
 * Mutation testing adapted to accounting: each mutant injects one known
 * bookkeeping defect into a synthetic journal proposal, and the pinned kernel
 * either kills it (rejects the proposal) or lets it survive (would record a bad
 * entry). These tests pin the scoreboard as a ratchet and prove the suite only
 * classifies the kernel's verdict — it never judges a proposal itself.
 *
 * Fiscal convention: money is BigInt cents; rates are integer basis points.
 */

import { describe, expect, it } from "vitest";
import type {
  JournalProposalRequest,
  JournalProposalResult,
} from "../lib/journal-proposal.js";
import {
  CORPUS_ID,
  CORPUS_PROVENANCE,
  MUTATION_BASELINE,
  MUTATION_CASES,
} from "../lib/control-mutation-corpus.js";
import {
  basisPoints,
  formatScoreboard,
  runMutationSuite,
} from "../lib/control-mutation.js";

/**
 * Pinned against drenyra-ai@0.7.0, which kills five of the 0.6.0 survivors
 * (drenyra-ai#131). A pin upgrade that moves any row fails here.
 */
const EXPECTED_KILLS: Record<string, string> = {
  "unbalanced-by-one-cent": "unbalanced",
  "negative-amount": "invalid-amount",
  "single-sided-entry": "unbalanced",
  "no-lines": "empty-lines",
  "float-amount": "invalid-amount",
  "number-amount": "invalid-amount",
  "unknown-side": "unbalanced",
  "engram-evidence-channel": "MEMORY_SHAPED",
  "memory-evidence-channel": "MEMORY_SHAPED",
  "empty-evidence-source": "MALFORMED_PROVENANCE",
  "unparseable-capture-date": "MALFORMED_PROVENANCE",
  "empty-captured-by": "MALFORMED_PROVENANCE",
  "short-ruc": "invalid-ruc",
  "non-digit-ruc": "invalid-ruc",
  "dashed-period": "invalid-period",
  "month-thirteen-period": "invalid-period",
  "month-zero-period": "invalid-period",
  "empty-company-id": "invalid-company",
  "zero-amount": "invalid-amount",
  "empty-account-code": "invalid-account",
  "empty-entry-id": "invalid-entry-id",
  "no-evidence-items": "missing-evidence",
  "duplicate-evidence-ids": "INVALID_ITEM",
};

/** Deferred upstream on purpose (drenyra-ai#123): checksummed RUC is decision-gated, and the kernel reads no clock. */
const EXPECTED_SURVIVORS = ["future-capture-date", "ruc-wrong-check-digit"];

const accepted = (request: JournalProposalRequest): JournalProposalResult => ({
  ok: true,
  entry: { id: request.entryId, status: "recorded", lineCount: 0, evidenceCount: 0 },
});

describe("control mutation corpus", () => {
  it("is labelled synthetic and not professional-validated", () => {
    expect(CORPUS_ID).toBe("journal-controls.synthetic.v1");
    expect(CORPUS_PROVENANCE).toContain("synthetic");
    expect(CORPUS_PROVENANCE).toContain("not validated by a professional accountant");
  });

  it("has unique ids, a description and a mitigation on every case", () => {
    const ids = MUTATION_CASES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of MUTATION_CASES) {
      expect(c.description.length, c.id).toBeGreaterThan(10);
      expect(c.mitigation.length, c.id).toBeGreaterThan(0);
    }
  });

  it("never mutates the shared baseline", () => {
    const before = JSON.stringify(MUTATION_BASELINE, (_k, v) =>
      typeof v === "bigint" ? `${v}n` : v,
    );
    runMutationSuite(MUTATION_CASES, MUTATION_BASELINE);
    const after = JSON.stringify(MUTATION_BASELINE, (_k, v) =>
      typeof v === "bigint" ? `${v}n` : v,
    );
    expect(after).toBe(before);
  });
});

describe("scoreboard ratchet against the pinned kernel", () => {
  const board = runMutationSuite(MUTATION_CASES, MUTATION_BASELINE);

  it("kills exactly the expected defects, each with the kernel's own code", () => {
    const kills = Object.fromEntries(
      board.results.filter((r) => r.outcome === "killed").map((r) => [r.id, r.code]),
    );
    expect(kills).toEqual(EXPECTED_KILLS);
  });

  it("lets exactly the expected defects survive — kernel gaps, never fixed in Pi", () => {
    const survivors = board.results.filter((r) => r.outcome === "survived").map((r) => r.id);
    expect(survivors.sort()).toEqual([...EXPECTED_SURVIVORS].sort());
  });

  it("raises no false alarm on the valid variants", () => {
    expect(board.valid.total).toBeGreaterThanOrEqual(2);
    expect(board.valid.falseAlarms).toBe(0);
    expect(board.valid.accepted).toBe(board.valid.total);
  });

  it("reports counts and rates as integers, rates in basis points", () => {
    expect(board.defects).toEqual({ total: 25, killed: 23, survived: 2 });
    expect(board.detectionBps).toBe(9200);
    expect(board.falseAlarmBps).toBe(0);
    for (const value of [board.detectionBps, board.falseAlarmBps]) {
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it("names the harness layer that already covers a survivor, or none", () => {
    const ruc = board.results.find((r) => r.id === "ruc-wrong-check-digit");
    expect(ruc?.mitigation).toContain("runtime/context.ts");
    const future = board.results.find((r) => r.id === "future-capture-date");
    expect(future?.mitigation).toBe("none");
  });
});

describe("the suite classifies verdicts and never decides", () => {
  it("lets every defect survive when the decider accepts everything", () => {
    const board = runMutationSuite(MUTATION_CASES, MUTATION_BASELINE, accepted);
    expect(board.defects.killed).toBe(0);
    expect(board.detectionBps).toBe(0);
    expect(board.valid.falseAlarms).toBe(0);
  });

  it("counts a rejected valid variant as a false alarm", () => {
    // Identity, not entryId: valid variants inherit the baseline's entry id.
    const rejectAllButBaseline = (request: JournalProposalRequest): JournalProposalResult =>
      request === MUTATION_BASELINE
        ? accepted(request)
        : { ok: false, code: "stub", message: "stub" };
    const board = runMutationSuite(MUTATION_CASES, MUTATION_BASELINE, rejectAllButBaseline);
    expect(board.valid.falseAlarms).toBe(board.valid.total);
    expect(board.falseAlarmBps).toBe(10000);
  });

  it("fails closed when the kernel rejects the baseline", () => {
    const rejectAll = (): JournalProposalResult => ({ ok: false, code: "stub", message: "stub" });
    expect(() => runMutationSuite(MUTATION_CASES, MUTATION_BASELINE, rejectAll)).toThrow(
      /baseline/,
    );
  });
});

describe("basisPoints", () => {
  it("uses integer division and floors", () => {
    expect(basisPoints(2, 3)).toBe(6666);
    expect(basisPoints(18, 25)).toBe(7200);
    expect(basisPoints(25, 25)).toBe(10000);
  });

  it("reports 0 for an empty denominator instead of dividing by zero", () => {
    expect(basisPoints(0, 0)).toBe(0);
  });
});

describe("formatScoreboard", () => {
  it("prints the provenance, both rates and every survivor with its mitigation", () => {
    const board = runMutationSuite(MUTATION_CASES, MUTATION_BASELINE);
    const text = formatScoreboard(board);
    expect(text).toContain(CORPUS_ID);
    expect(text).toContain("not validated by a professional accountant");
    expect(text).toContain("detection: 23/25 defects rejected (9200 bps)");
    expect(text).toContain("false alarms: 0/");
    for (const id of EXPECTED_SURVIVORS) {
      expect(text).toContain(id);
    }
    expect(text).toContain("mitigation: none");
  });
});
