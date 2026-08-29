import { describe, expect, it } from "vite-plus/test";
import { isReservedProfileSlug, parseProfileUsernameParam } from "@/lib/reserved-profile-slugs";

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
