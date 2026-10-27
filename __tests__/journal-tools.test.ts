/**
 * `propose_journal_entry` extension tests (REQ-AUTH-011).
 *
 * These pin the tool surface: what it does with no scope, what it reports when
 * the kernel accepts, and what it reports when the kernel refuses. The fiscal
 * verdicts themselves are the kernel's and are covered in
 * `__tests__/journal-proposal.test.ts`.
 */

import { describe, expect, it } from "vitest";
import { registerJournalTools } from "../extensions/journal-tools.js";

interface RegisteredTool {
  name: string;
  execute(
    toolCallId: string,
    params: Record<string, unknown>,
  ): Promise<{
    content: Array<{ type: "text"; text: string }>;
    details: Record<string, unknown>;
  }>;
}

function register(scope: unknown): Map<string, RegisteredTool> {
  const tools = new Map<string, RegisteredTool>();
  registerJournalTools(
    {
      registerTool: (tool) => {
        tools.set(tool.name, tool as RegisteredTool);
      },
    },
    { contextStore: { load: () => scope as never } },
  );
  return tools;
}

const SCOPE = {
  company: { ruc: "20123456789" },
  period: { period: "202609" },
  canonical: { company: "company-1" },
};

const PROPOSAL = {
  entryId: "entry-1",
  lines: [
    { accountCode: "101", side: "debit", amountCents: "1000" },
    { accountCode: "201", side: "credit", amountCents: "1000" },
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
};

describe("propose_journal_entry — scope", () => {
  it("short-circuits with the existing message when no company scope is set", async () => {
    const tools = register({});
    const outcome = await tools.get("propose_journal_entry")!.execute("call-1", PROPOSAL);
    expect(outcome.content[0].text).toContain("No company scope is set yet");
    expect(outcome.details.status).toBe("no-scope-known");
  });
});

describe("propose_journal_entry — kernel verdicts", () => {
  it("reports a recorded, unposted entry when the kernel accepts", async () => {
    const tools = register(SCOPE);
    const outcome = await tools.get("propose_journal_entry")!.execute("call-1", PROPOSAL);
    expect(outcome.details.status).toBe("recorded");
    expect(outcome.content[0].text).toContain("not posted");
    expect(outcome.content[0].text).toContain("no receipt was issued");
  });

  it("surfaces an unbalanced entry as a kernel rejection", async () => {
    const tools = register(SCOPE);
    const outcome = await tools.get("propose_journal_entry")!.execute("call-1", {
      ...PROPOSAL,
      lines: [
        { accountCode: "101", side: "debit", amountCents: "1000" },
        { accountCode: "201", side: "credit", amountCents: "900" },
      ],
    });
    expect(outcome.details.status).toBe("rejected");
    expect(outcome.details.code).toBe("unbalanced");
  });

  it("refuses a non-integer amount before the kernel sees it", async () => {
    const tools = register(SCOPE);
    const outcome = await tools.get("propose_journal_entry")!.execute("call-1", {
      ...PROPOSAL,
      lines: [
        { accountCode: "101", side: "debit", amountCents: "10.50" },
        { accountCode: "201", side: "credit", amountCents: "10.50" },
      ],
    });
    expect(outcome.details.status).toBe("invalid-input");
    expect(outcome.content[0].text).toContain("whole cents");
  });
});
