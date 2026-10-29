/**
 * Journal proposal tool — `propose_journal_entry` (REQ-AUTH-011).
 *
 * The harness proposes; the pinned kernel decides. This file maps a tool call
 * onto `lib/journal-proposal.ts`, which in turn calls the kernel's
 * `validateTenantScope`, `acceptEvidence` and `journal.record`. Nothing here
 * sums, balances, or validates — every verdict belongs to the kernel, and the
 * tool reports what it returned.
 *
 * There is deliberately no `post`. Posting issues a signed receipt and is the
 * authority action; the harness has no legitimate `JournalReceiptIssuer`, so
 * the proposal stops at RECORDED and the docs say so.
 *
 * Fiscal convention: amounts cross the tool boundary as decimal strings and
 * become BigInt cents before the kernel sees them. No amount is ever a float.
 */

import { Type } from "typebox";
import {
  proposeJournalEntry,
  type EvidenceItemProposal,
  type JournalLineProposal,
  type JournalProposalRequest,
} from "../lib/journal-proposal.js";

/** Structural slice of `ScopeContext` — only the fields this tool reads. */
export interface JournalScopeStore {
  load(): {
    company?: { ruc?: string };
    period?: { period?: string };
    canonical?: { company?: string };
  };
}

export interface JournalToolsApi {
  registerTool(tool: {
    name: string;
    label?: string;
    description: string;
    parameters: unknown;
    execute(
      toolCallId: string,
      params: Record<string, unknown>,
    ): Promise<{
      content: Array<{ type: "text"; text: string }>;
      details: Record<string, unknown>;
    }>;
  }): void;
}

const NO_SCOPE_MESSAGE =
  "No company scope is set yet — set it with /drenyra:company first.";

const LINE_SCHEMA = Type.Object({
  accountCode: Type.String({ description: "Ledger account code, e.g. 101." }),
  side: Type.Union([Type.Literal("debit"), Type.Literal("credit")]),
  amountCents: Type.String({
    description:
      "Whole cents as a decimal string, e.g. \"1000\". Never a float and never a formatted amount.",
  }),
});

const EVIDENCE_ITEM_SCHEMA = Type.Object({
  id: Type.String({ description: "Identifier of the evidence item within the artifact." }),
  label: Type.String({ description: "Human-readable label for the item." }),
  type: Type.String({ description: "Item type, e.g. invoice." }),
});

const PROVENANCE_SCHEMA = Type.Object({
  channel: Type.String({
    description:
      "Evidence channel. The kernel admits document, report, system and external only; memory-shaped and advisory-shaped channels are rejected.",
  }),
  source: Type.String({ description: "Where the evidence came from, e.g. invoice-0001.pdf." }),
  capturedAt: Type.String({ description: "ISO-8601 timestamp of capture." }),
  capturedBy: Type.String({ description: "Who captured the evidence." }),
});

/** Convert a decimal string of whole cents to BigInt, or report why not. */
function parseCents(value: unknown): bigint | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!/^[0-9]+$/.test(trimmed)) return undefined;
  return BigInt(trimmed);
}

export function registerJournalTools(
  pi: JournalToolsApi,
  deps: { contextStore: JournalScopeStore },
): void {
  pi.registerTool({
    name: "propose_journal_entry",
    label: "Propose Journal Entry",
    description:
      "Propose a double-entry journal entry through the pinned Drenyra AI kernel: the kernel validates the scope, accepts the evidence and checks that the entry balances. Returns the kernel's verdict. The entry is recorded, never posted — no receipt is issued.",
    parameters: Type.Object({
      entryId: Type.String({ description: "Caller-supplied identifier for this entry." }),
      lines: Type.Array(LINE_SCHEMA, {
        description: "Journal lines. Debits and credits must balance; the kernel decides.",
      }),
      evidence: Type.Object({
        items: Type.Array(EVIDENCE_ITEM_SCHEMA),
        provenance: PROVENANCE_SCHEMA,
      }),
    }),
    execute: async (_toolCallId, params) => {
      const scope = deps.contextStore.load();
      const ruc = scope.company?.ruc;
      const period = scope.period?.period;
      const companyId = scope.canonical?.company ?? ruc;
      if (ruc === undefined || period === undefined || companyId === undefined) {
        return {
          content: [{ type: "text", text: NO_SCOPE_MESSAGE }],
          details: { status: "no-scope-known" },
        };
      }

      const rawLines = Array.isArray(params.lines) ? params.lines : [];
      const lines: JournalLineProposal[] = [];
      for (const raw of rawLines) {
        const line = raw as Record<string, unknown>;
        const amountCents = parseCents(line.amountCents);
        const side = line.side === "debit" || line.side === "credit" ? line.side : undefined;
        if (
          amountCents === undefined ||
          side === undefined ||
          typeof line.accountCode !== "string"
        ) {
          return {
            content: [
              {
                type: "text",
                text:
                  "propose_journal_entry: each line needs an accountCode, a side of debit or credit, and amountCents as a decimal string of whole cents.",
              },
            ],
            details: { status: "invalid-input" },
          };
        }
        lines.push({ accountCode: line.accountCode, side, amountCents });
      }

      const rawEvidence = (params.evidence ?? {}) as Record<string, unknown>;
      const rawItems = Array.isArray(rawEvidence.items) ? rawEvidence.items : [];
      const items: EvidenceItemProposal[] = rawItems.map((raw) => {
        const item = raw as Record<string, unknown>;
        return {
          id: typeof item.id === "string" ? item.id : "",
          label: typeof item.label === "string" ? item.label : "",
          type: typeof item.type === "string" ? item.type : "",
        };
      });
      const rawProvenance = (rawEvidence.provenance ?? {}) as Record<string, unknown>;

      const request: JournalProposalRequest = {
        companyId,
        ruc,
        period,
        entryId: typeof params.entryId === "string" ? params.entryId : "",
        lines,
        evidence: {
          items,
          provenance: {
            channel: typeof rawProvenance.channel === "string" ? rawProvenance.channel : "",
            source: typeof rawProvenance.source === "string" ? rawProvenance.source : "",
            capturedAt:
              typeof rawProvenance.capturedAt === "string" ? rawProvenance.capturedAt : "",
            capturedBy:
              typeof rawProvenance.capturedBy === "string" ? rawProvenance.capturedBy : "",
          },
        },
        // The harness clock, never an agent-supplied value: an agent able to
        // choose asOf could move "now" past any capture date.
        asOf: new Date().toISOString(),
      };

      const result = proposeJournalEntry(request);
      if (!result.ok) {
        return {
          content: [
            {
              type: "text",
              text: `propose_journal_entry: the kernel rejected this proposal — ${result.code}: ${result.message}`,
            },
          ],
          details: { status: "rejected", code: result.code, message: result.message },
        };
      }
      return {
        content: [
          {
            type: "text",
            text:
              `propose_journal_entry: entry ${result.entry.id} is ${result.entry.status} ` +
              `(${result.entry.lineCount} lines, ${result.entry.evidenceCount} evidence artifact). ` +
              "Recorded, not posted: no receipt was issued.",
          },
        ],
        details: { status: "recorded", entry: result.entry },
      };
    },
  });
}
