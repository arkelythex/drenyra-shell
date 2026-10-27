/**
 * `record_receipt` must not present itself as proof.
 *
 * The tool is fail-open: its id, states, and hash are unverified and unsigned
 * (README known limitations). Its model-facing label and description are what
 * an agent reads, so they must say it is a note, not a signed RDA receipt, and
 * point to the signed path.
 */

import { describe, expect, it } from "vitest";
import {
  registerFiscalGuard,
  type FiscalGuardExtensionAPI,
} from "../extensions/fiscal-guard.js";

type RegisteredTool = Parameters<FiscalGuardExtensionAPI["registerTool"]>[0];

function registeredTools(): RegisteredTool[] {
  const tools: RegisteredTool[] = [];
  const pi: FiscalGuardExtensionAPI = {
    on: () => undefined,
    registerCommand: () => undefined,
    registerTool: (tool) => {
      tools.push(tool);
    },
  };
  registerFiscalGuard(pi);
  return tools;
}

describe("record_receipt describes itself honestly", () => {
  const tool = registeredTools().find((t) => t.name === "record_receipt");

  it("is still registered under the same name", () => {
    expect(tool).toBeDefined();
  });

  it("says it is an unsigned note, not proof, and names the signed path", () => {
    const description = tool?.description ?? "";
    expect(description).toMatch(/unsigned/i);
    expect(description).toMatch(/not proof/i);
    expect(description).toContain("ReceiptStore");
    expect(description).toContain("/drenyra:receipt");
  });

  it("no longer claims to be the RED (Receipt-Driven Execution) primitive", () => {
    expect(tool?.description ?? "").not.toMatch(/Receipt-Driven Execution|\bRED\b/);
    expect(tool?.label ?? "").not.toMatch(/\bRED\b/);
  });
});
