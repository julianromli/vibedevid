import { describe, expect, it } from "vite-plus/test";
import { escapeHtml } from "@/lib/auth/html";

describe("escapeHtml", () => {
  it("escapes markup so a name cannot inject HTML", () => {
    expect(escapeHtml("<img src=x>")).toBe("&lt;img src=x&gt;");
  });

  it("escapes ampersands and quotes", () => {
    expect(escapeHtml(`Tom & "Jerry" 'x'`)).toBe("Tom &amp; &quot;Jerry&quot; &#39;x&#39;");
  });
});
