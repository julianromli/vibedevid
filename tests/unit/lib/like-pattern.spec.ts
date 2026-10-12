import { describe, expect, it } from "vite-plus/test";
import { containsPattern } from "@/lib/db/like-pattern";

describe("containsPattern", () => {
  it("wraps plain text in wildcards", () => {
    expect(containsPattern("vibe")).toBe("%vibe%");
  });

  it("escapes LIKE wildcards so they match literally", () => {
    expect(containsPattern("50%_off")).toBe("%50\\%\\_off%");
  });

  it("escapes the escape character itself", () => {
    expect(containsPattern("a\\b")).toBe("%a\\\\b%");
    expect(containsPattern("\\%")).toBe("%\\\\\\%%");
  });

  it("matches everything for an empty string", () => {
    expect(containsPattern("")).toBe("%%");
  });
});
