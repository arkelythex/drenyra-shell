/**
 * Books operation mode — extension surface (REQ-AUTH-009).
 *
 * Wires the pure policy in `lib/operation-mode.ts` to the two things only an
 * extension can do: expose `/drenyra:mode`, and deny a tool call before it
 * runs. The mode is per-process state that starts `open`, so an existing
 * session is never silently restricted.
 *
 * This file holds no policy: it supplies the active mode and renders the
 * result. Everything a reviewer needs to judge the boundary is in the library
 * module.
 */

import {
  describeOperationMode,
  evaluateToolPolicy,
  isOperationMode,
  type OperationMode,
} from "../lib/operation-mode.js";

export interface OperationModeCommandContext {
  cwd?: string;
  ui?: {
    notify(message: string, level?: "info" | "warning" | "error"): void;
  };
}

export interface OperationModeExtensionApi {
  on(event: string, handler: (event: unknown, ctx: unknown) => void): void;
  registerCommand(
    name: string,
    options: {
      description?: string;
      handler: (args: string, ctx: OperationModeCommandContext) => Promise<void>;
    },
  ): void;
}

export interface ToolCallBlockDecision {
  block: true;
  reason: string;
}

/** Per-process active mode. Starts `open`: nothing is restricted implicitly. */
let activeMode: OperationMode = "open";

export function getOperationMode(): OperationMode {
  return activeMode;
}

export function setOperationMode(mode: OperationMode): void {
  activeMode = mode;
}

const USAGE =
  "drenyra:mode: usage — /drenyra:mode (report) | /drenyra:mode books | /drenyra:mode open";

export function registerOperationMode(pi: OperationModeExtensionApi): void {
  pi.registerCommand("drenyra:mode", {
    description:
      "Report or switch the operation mode. Usage: /drenyra:mode [books|open]",
    handler: async (args, ctx) => {
      const requested = (args ?? "").trim().toLowerCase();
      if (requested === "") {
        ctx.ui?.notify(describeOperationMode(activeMode), "info");
        return;
      }
      if (!isOperationMode(requested)) {
        // An unknown argument changes nothing: a typo must never leave the
        // session in a mode the operator did not ask for.
        ctx.ui?.notify(USAGE, "warning");
        return;
      }
      setOperationMode(requested);
      ctx.ui?.notify(
        describeOperationMode(activeMode),
        requested === "books" ? "warning" : "info",
      );
    },
  });

  pi.on("tool_call", (event) => {
    const e = event as { toolName?: string };
    const decision = evaluateToolPolicy(activeMode, e.toolName ?? "");
    if (decision.allowed) return undefined;
    return { block: true, reason: decision.reason } satisfies ToolCallBlockDecision;
  });
}
