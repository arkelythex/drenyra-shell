/**
 * Journal proposal — the harness proposes, the kernel decides.
 *
 * These tests pin the division of labour that makes the tool safe: the harness
 * maps scope and arguments, and the pinned kernel owns every fiscal judgement —
 * scope validity, amount validity, balance, evidence admissibility. A test that
 * passes here is evidence the harness did NOT decide anything.
 *
 * The proposal half only: no posting, no signed receipt, no ledger effect.
 */

import { describe, expect, it } from "vitest";
import { proposeJournalEntry } from "../lib/journal-proposal.js";

const BASE = {
  companyId: "company-1",
  ruc: "20123456786",
  period: "202609",
  entryId: "entry-1",
  lines: [
    { accountCode: "101", side: "debit" as const, amountCents: 1000n },
    { accountCode: "201", side: "credit" as const, amountCents: 1000n },
  ],
  evidence: {
    items: [{ id: "invoice-1", label: "Invoice 0001", type: "invoice" }],
    provenance: {
      channel: "document",
      source: "invoice-0001.pdf",
      capturedAt: "2026-10-27T00:00:00.000Z",
      capturedBy: "operator",
    },
  },
  asOf: "2026-10-28T00:00:00.000Z",
};

describe("proposeJournalEntry — reference instant", () => {
  it("surfaces the kernel's future-evidence verdict for a capture after asOf", () => {
    const result = proposeJournalEntry({
      ...BASE,
      evidence: {
        ...BASE.evidence,
        provenance: { ...BASE.evidence.provenance, capturedAt: "2026-10-28T00:00:00.001Z" },
      },
    });
    expect(result).toMatchObject({ ok: false, code: "future-evidence" });
  });

  it("records a capture exactly at asOf", () => {
    const result = proposeJournalEntry({ ...BASE, asOf: "2026-10-27T00:00:00.000Z" });
    expect(result.ok).toBe(true);
  });

  it("surfaces the kernel's invalid-as-of verdict instead of defaulting a clock", () => {
    const result = proposeJournalEntry({ ...BASE, asOf: "" });
    expect(result).toMatchObject({ ok: false, code: "invalid-as-of" });
  });
});

describe("proposeJournalEntry — the kernel decides", () => {
  it("records a balanced entry as RECORDED, never POSTED", () => {
    const result = proposeJournalEntry(BASE);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entry.id).toBe("entry-1");
    expect(result.entry.status).toBe("recorded");
    expect(result.entry.lineCount).toBe(2);
    expect(result.entry.evidenceCount).toBe(1);
  });

  it("surfaces the kernel's UNBALANCED verdict instead of judging balance itself", () => {
    const result = proposeJournalEntry({
      ...BASE,
      lines: [
        { accountCode: "101", side: "debit", amountCents: 1000n },
        { accountCode: "201", side: "credit", amountCents: 900n },
      ],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("unbalanced");
  });

  it("surfaces the kernel's rejection of a memory-shaped evidence channel", () => {
    // Drenyra Engram informs, it never authorizes: the kernel enforces that,
    // and the harness must not paper over it.
    const result = proposeJournalEntry({
      ...BASE,
      evidence: {
        ...BASE.evidence,
        provenance: { ...BASE.evidence.provenance, channel: "engram" },
      },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("MEMORY_SHAPED");
  });

  it("surfaces the kernel's scope rejection for an invalid RUC", () => {
    const result = proposeJournalEntry({ ...BASE, ruc: "123" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("invalid-ruc");
  });

  it("surfaces the kernel's rejection of a malformed evidence item", () => {
    // The kernel validates each item; the harness passes the shape through and
    // reports the verdict rather than repairing the caller's input.
    const result = proposeJournalEntry({
      ...BASE,
      evidence: {
        ...BASE.evidence,
        items: [{ id: "invoice-1", label: "", type: "invoice" }],
      },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("INVALID_ITEM");
  });

  it("carries no receipt — posting is not this tool's job", () => {
    const result = proposeJournalEntry(BASE);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.entry)).not.toContain("receipt");
  });
});
