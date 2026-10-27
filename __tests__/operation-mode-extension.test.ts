/**
 * Books operation mode — extension wiring tests (REQ-AUTH-009).
 *
 * The policy itself is pinned in `operation-mode.test.ts`. These tests cover
 * what only the extension can do: `/drenyra:mode` switching and the `tool_call`
 * hook that turns the policy into a block decision.
 *
 * `setOperationMode` runs in `beforeEach` because the mode is per-process
 * module state — a test must never inherit the mode the previous one left.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  getOperationMode,
  registerOperationMode,
  setOperationMode,
  type OperationModeExtensionApi,
} from "../extensions/operation-mode.js";

interface Notified {
  message: string;
  level?: string;
}

function makeModePi(): {
  handlers: Map<string, (event: unknown) => unknown>;
  commands: Map<string, (args: string, ctx: unknown) => Promise<void>>;
} {
  const handlers = new Map<string, (event: unknown) => unknown>();
  const commands = new Map<string, (args: string, ctx: unknown) => Promise<void>>();
  const pi = {
    on(event: string, handler: (event: unknown) => unknown) {
      handlers.set(event, handler);
    },
    registerCommand(
      name: string,
      options: {
        handler: (args: string, ctx: unknown) => Promise<void>;
      },
    ) {
      commands.set(name, options.handler);
    },
  } as unknown as OperationModeExtensionApi;
  registerOperationMode(pi);
  return { handlers, commands };
}

function makeCtx(): {
  ui: { notify(message: string, level?: string): void };
  notifications: Notified[];
} {
  const notifications: Notified[] = [];
  return {
    notifications,
    ui: {
      notify(message: string, level?: string) {
        notifications.push({ message, level });
      },
    },
  };
}

describe("/drenyra:mode", () => {
  beforeEach(() => {
    setOperationMode("open");
  });

  it("registers the command and the tool_call hook", () => {
    const { handlers, commands } = makeModePi();
    expect(commands.has("drenyra:mode")).toBe(true);
    expect(handlers.has("tool_call")).toBe(true);
  });

  it("reports the active mode when called with no argument", async () => {
    const { commands } = makeModePi();
    const c = makeCtx();
    await commands.get("drenyra:mode")?.("", c);
    expect(c.notifications).toHaveLength(1);
    expect(c.notifications[0]?.message).toContain("open");
    expect(getOperationMode()).toBe("open");
  });

  it("switches to books and reports the allowlist", async () => {
    const { commands } = makeModePi();
    const c = makeCtx();
    await commands.get("drenyra:mode")?.("books", c);
    expect(getOperationMode()).toBe("books");
    expect(c.notifications[0]?.message).toContain("books");
    expect(c.notifications[0]?.level).toBe("warning");
  });

  it("switches back to open", async () => {
    const { commands } = makeModePi();
    const c = makeCtx();
    await commands.get("drenyra:mode")?.("books", c);
    await commands.get("drenyra:mode")?.("open", c);
    expect(getOperationMode()).toBe("open");
  });

  it("refuses an unknown argument and leaves the mode unchanged", async () => {
    const { commands } = makeModePi();
    const c = makeCtx();
    await commands.get("drenyra:mode")?.("books", c);
    await commands.get("drenyra:mode")?.("production", c);
    expect(getOperationMode()).toBe("books");
    const last = c.notifications.at(-1);
    expect(last?.level).toBe("warning");
    expect(last?.message).toContain("/drenyra:mode");
  });
});

describe("tool_call hook", () => {
  beforeEach(() => {
    setOperationMode("open");
  });

  it("blocks bash, write and edit in books mode", () => {
    const { handlers } = makeModePi();
    setOperationMode("books");
    const hook = handlers.get("tool_call") as (e: unknown) => unknown;
    for (const toolName of ["bash", "write", "edit"]) {
      const decision = hook({ toolName }) as { block: true; reason: string };
      expect(decision.block, `${toolName} must be blocked`).toBe(true);
      expect(decision.reason).toContain(toolName);
    }
  });

  it("lets the allowlisted inspection tools through in books mode", () => {
    const { handlers } = makeModePi();
    setOperationMode("books");
    const hook = handlers.get("tool_call") as (e: unknown) => unknown;
    expect(hook({ toolName: "read" })).toBeUndefined();
    expect(hook({ toolName: "record_receipt" })).toBeUndefined();
  });

  it("blocks an unknown tool in books mode", () => {
    const { handlers } = makeModePi();
    setOperationMode("books");
    const hook = handlers.get("tool_call") as (e: unknown) => unknown;
    const decision = hook({ toolName: "postgres_query" }) as {
      block: true;
      reason: string;
    };
    expect(decision.block).toBe(true);
    expect(decision.reason).toContain("postgres_query");
  });

  it("blocks nothing in open mode — the default is unchanged", () => {
    // S8: this feature must not restrict `open`. A future policy change that
    // starts denying here fails this test.
    const { handlers } = makeModePi();
    const hook = handlers.get("tool_call") as (e: unknown) => unknown;
    for (const toolName of ["bash", "write", "edit", "postgres_query", "read"]) {
      expect(hook({ toolName })).toBeUndefined();
    }
  });
});
