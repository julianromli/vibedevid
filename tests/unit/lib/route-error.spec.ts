import { describe, expect, it } from "vite-plus/test";
import { stringifyRouteError } from "@/lib/route-error";

describe("stringifyRouteError", () => {
  it("returns a non-empty string error as-is", () => {
    expect(stringifyRouteError("Chunk load failed")).toBe("Chunk load failed");
  });

  it("returns Error.message", () => {
    expect(stringifyRouteError(new Error("Hydration mismatch"))).toBe("Hydration mismatch");
  });

  it("returns a string message on a plain object", () => {
    expect(stringifyRouteError({ message: "CSRF token mismatch" })).toBe("CSRF token mismatch");
  });

  it("does not return a non-string message as a React child", () => {
    expect(stringifyRouteError({ message: { code: 500 } })).toBe("The page failed to load.");
  });

  it("falls back for null, undefined, and empty values", () => {
    expect(stringifyRouteError(null)).toBe("The page failed to load.");
    expect(stringifyRouteError(undefined)).toBe("The page failed to load.");
    expect(stringifyRouteError("")).toBe("The page failed to load.");
    expect(stringifyRouteError(new Error("  "))).toBe("The page failed to load.");
  });
});
