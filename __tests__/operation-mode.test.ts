/**
 * Books operation mode — tool policy tests (REQ-AUTH-009).
 *
 * The policy is a pure function over (mode, toolName). These tests pin the two
 * properties that make it a boundary rather than a blocklist: the allowlist is
 * the authority (S2), and a tool nobody has heard of is denied (S2).
 *
 * Fiscal convention: no monetary value appears here; nothing in this module
 * touches money, scope, or receipts.
 */

import { describe, expect, it } from "vitest";
import {
  BOOKS_ALLOWED_TOOLS,
  describeOperationMode,
  evaluateToolPolicy,
} from "../lib/operation-mode.js";

describe("evaluateToolPolicy — books mode", () => {
  it("allows every tool on the books allowlist", () => {
    for (const toolName of BOOKS_ALLOWED_TOOLS) {
      const decision = evaluateToolPolicy("books", toolName);
      expect(decision.allowed, `${toolName} must be allowed in books mode`).toBe(
        true,
      );
    }
  });

  it("denies the three mutations the mode exists to remove", () => {
    for (const toolName of ["bash", "write", "edit"]) {
      const decision = evaluateToolPolicy("books", toolName);
      expect(decision.allowed, `${toolName} must be denied`).toBe(false);
      expect(decision.reason).toBeTypeOf("string");
    }
  });

  it("denies a tool the harness has never heard of", () => {
    // Deny-by-default: an MCP or database client the host exposes is denied
    // because it is absent from the allowlist, not because it is on a list of
    // known-bad names.
    const decision = evaluateToolPolicy("books", "postgres_query");
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("postgres_query");
  });

  it("names the mode, the denied tool and the way out", () => {
    const decision = evaluateToolPolicy("books", "bash");
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("books");
    expect(decision.reason).toContain("bash");
    expect(decision.reason).toContain("/drenyra:mode open");
  });
});

describe("evaluateToolPolicy — open mode", () => {
  it("allows every tool, including the mutations books mode removes", () => {
    // S8: the default mode must stay exactly as permissive as before this
    // feature. A policy change that silently restricts `open` fails here.
    for (const toolName of ["bash", "write", "edit", "postgres_query", "read"]) {
      expect(evaluateToolPolicy("open", toolName).allowed).toBe(true);
    }
  });

  it("carries no reason when it allows", () => {
    expect(evaluateToolPolicy("open", "bash").reason).toBeUndefined();
  });
});

describe("describeOperationMode", () => {
  it("reports the active mode and the allowlist for books", () => {
    const report = describeOperationMode("books");
    expect(report).toContain("books");
    for (const toolName of BOOKS_ALLOWED_TOOLS) {
      expect(report).toContain(toolName);
    }
  });

  it("says plainly that open blocks nothing", () => {
    expect(describeOperationMode("open")).toContain("open");
  });
});
