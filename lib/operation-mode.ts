/**
 * Books operation mode — deny-by-default tool policy (REQ-AUTH-009).
 *
 * The three fiscal guards answer "is this particular write suspicious?". This
 * module answers a different and harder question: "may this tool run at all?".
 * They are deliberately separate — the guards inspect arguments and are
 * best-effort by construction; the mode is an allowlist and is a boundary.
 *
 * The policy is pure: it takes a mode and a tool name and returns a decision.
 * It never inspects tool arguments, because a boundary that depends on parsing
 * input cannot be verified by reading this file.
 *
 * Fiscal convention: nothing here touches money, scope, or receipts.
 */

/** The two operation modes. `open` is the default and blocks nothing. */
export type OperationMode = "open" | "books";

export const OPERATION_MODES = ["open", "books"] as const;

/**
 * Every tool `books` mode permits: reading the workspace, and the harness's own
 * read-only fiscal tools. `record_receipt` is included because it performs no
 * filesystem or network effect — it returns an object — so denying it would
 * remove the one primitive an operating agent is meant to call without buying
 * any boundary.
 */
export const BOOKS_ALLOWED_TOOLS = [
  "read",
  "grep",
  "glob",
  "list_fiscal_phases",
  "verify_fiscal_phase",
  "run_fiscal_lens",
  "record_receipt",
] as const;

/** One tool-call verdict. `reason` is present only when the call is denied. */
export type ToolPolicyDecision =
  | { allowed: true; reason?: undefined }
  | { allowed: false; reason: string };

/** Narrow an arbitrary string to an `OperationMode`. */
export function isOperationMode(value: string): value is OperationMode {
  return (OPERATION_MODES as readonly string[]).includes(value);
}

/**
 * Decide whether `toolName` may run in `mode`.
 *
 * In `books` the allowlist is the authority: a tool absent from
 * {@link BOOKS_ALLOWED_TOOLS} is denied, which is what makes an unlisted MCP or
 * database client the host may expose unreachable. In `open` everything is
 * allowed and no reason is produced.
 */
export function evaluateToolPolicy(
  mode: OperationMode,
  toolName: string,
): ToolPolicyDecision {
  if (mode === "open") return { allowed: true };
  if ((BOOKS_ALLOWED_TOOLS as readonly string[]).includes(toolName)) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason:
      `drenyra-shell: "${toolName}" is blocked in books mode — the allowlist ` +
      `is workspace inspection plus read-only fiscal tools, and anything else ` +
      `is denied. Leave the mode with /drenyra:mode open.`,
  };
}

/** Render the active mode, its allowlist, and what it blocks. */
export function describeOperationMode(mode: OperationMode): string {
  if (mode === "open") {
    return [
      "drenyra-shell operation mode: open",
      "  No tool is blocked by policy. The fiscal guards still apply.",
      "  Use /drenyra:mode books for a reduced-capability session.",
    ].join("\n");
  }
  return [
    "drenyra-shell operation mode: books",
    "  Allowed (deny-by-default — anything not listed here is blocked):",
    ...BOOKS_ALLOWED_TOOLS.map((tool) => `    ${tool}`),
    "  Blocked by policy: bash, write, edit, and every unlisted tool.",
    "  Leave with /drenyra:mode open.",
  ].join("\n");
}
