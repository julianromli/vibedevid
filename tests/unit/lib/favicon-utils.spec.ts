import { describe, expect, it } from "vite-plus/test";
import { extractDomain, isBlockedHostname } from "@/lib/favicon-utils";

describe("isBlockedHostname", () => {
  it("blocks loopback and localhost hosts", () => {
    expect(isBlockedHostname("localhost")).toBe(true);
    expect(isBlockedHostname("evil.localhost")).toBe(true);
    expect(isBlockedHostname("127.0.0.1")).toBe(true);
    expect(isBlockedHostname("::1")).toBe(true);
    expect(isBlockedHostname("0.0.0.0")).toBe(true);
  });

  it("blocks private and link-local IPv4 ranges", () => {
    expect(isBlockedHostname("10.0.0.1")).toBe(true);
    expect(isBlockedHostname("192.168.0.1")).toBe(true);
    expect(isBlockedHostname("172.16.0.1")).toBe(true);
    expect(isBlockedHostname("169.254.1.1")).toBe(true);
  });

  it("allows a public hostname", () => {
    expect(isBlockedHostname("github.com")).toBe(false);
    expect(isBlockedHostname("example.com")).toBe(false);
  });
});

describe("extractDomain", () => {
  it("rejects private hosts so they are never fetched", () => {
    expect(extractDomain("http://127.0.0.1")).toBeNull();
    expect(extractDomain("http://192.168.0.1")).toBeNull();
    expect(extractDomain("http://localhost")).toBeNull();
  });

  it("returns the origin for a public website", () => {
    expect(extractDomain("https://github.com/org/repo")).toBe("https://github.com");
  });
});
