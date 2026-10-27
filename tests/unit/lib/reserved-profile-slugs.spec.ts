import { describe, expect, it } from "vite-plus/test";
import {
  isReservedProfileSlug,
  isReservedUsername,
  parseProfileUsernameParam,
} from "@/lib/reserved-profile-slugs";

describe("isReservedProfileSlug", () => {
  it("treats testimonial as reserved in any case", () => {
    expect(isReservedProfileSlug("testimonial")).toBe(true);
    expect(isReservedProfileSlug("Testimonial")).toBe(true);
    expect(isReservedProfileSlug(" TESTIMONIAL ")).toBe(true);
  });

  it("treats other first-segment app paths as reserved", () => {
    expect(isReservedProfileSlug("calendar")).toBe(true);
    expect(isReservedProfileSlug("admin")).toBe(true);
    expect(isReservedProfileSlug("blog")).toBe(true);
    expect(isReservedProfileSlug("project")).toBe(true);
    expect(isReservedProfileSlug("privacy-policy")).toBe(true);
  });

  it("allows a normal profile username", () => {
    expect(isReservedProfileSlug("jane")).toBe(false);
    expect(isReservedProfileSlug("testimonial_1")).toBe(false);
  });
});

describe("parseProfileUsernameParam", () => {
  it("returns false for reserved slugs so /$username does not match", () => {
    expect(parseProfileUsernameParam("testimonial")).toBe(false);
    expect(parseProfileUsernameParam("calendar")).toBe(false);
  });

  it("returns the username for a profile slug", () => {
    expect(parseProfileUsernameParam("jane")).toEqual({ username: "jane" });
  });
});

describe("isReservedUsername", () => {
  it("covers route slugs and system names", () => {
    for (const name of [
      "admin",
      "dashboard",
      "user",
      "settings",
      "login",
      "signup",
      "onboarding",
      "www",
      "vibedevid",
      "support",
      "help",
      "administrator",
      "moderator",
      "mod",
      "staff",
      "system",
      "root",
    ]) {
      expect(isReservedUsername(name)).toBe(true);
    }
    expect(isReservedUsername(" Moderator ")).toBe(true);
    expect(isReservedUsername("jane")).toBe(false);
  });

  it("does not hide existing profiles that use a system name", () => {
    expect(parseProfileUsernameParam("support")).toEqual({ username: "support" });
  });
});
