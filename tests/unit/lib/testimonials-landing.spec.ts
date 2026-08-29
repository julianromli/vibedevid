import { describe, expect, it } from "vite-plus/test";
import {
  resolveLandingTestimonials,
  splitTestimonialsIntoColumns,
} from "@/lib/testimonials-landing";

const seed = ["s0", "s1", "s2", "s3", "s4", "s5"];
const approved = ["a0", "a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9"];

describe("resolveLandingTestimonials", () => {
  it("uses seed when no approved items exist", () => {
    expect(resolveLandingTestimonials([], seed)).toEqual(seed);
  });

  it("uses only approved items as soon as one exists", () => {
    expect(resolveLandingTestimonials(["a0"], seed)).toEqual(["a0"]);
  });
});

describe("splitTestimonialsIntoColumns", () => {
  it("keeps all items across three columns", () => {
    const columns = splitTestimonialsIntoColumns(approved, 3);
    expect(columns.flat()).toHaveLength(approved.length);
    expect(columns[0]).toEqual(["a0", "a3", "a6", "a9"]);
    expect(columns[1]).toEqual(["a1", "a4", "a7"]);
    expect(columns[2]).toEqual(["a2", "a5", "a8"]);
  });
});
