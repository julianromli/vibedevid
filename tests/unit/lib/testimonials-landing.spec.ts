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
  it("puts every approved person in the mobile-visible column", () => {
    const people = ["Nadi", "Faiz", "MFSAVANA"];
    const [columnOne] = splitTestimonialsIntoColumns(people, 3);
    expect(new Set(columnOne)).toEqual(new Set(people));
  });

  it("rotates the full list into each column", () => {
    const columns = splitTestimonialsIntoColumns(approved, 3);
    expect(columns).toHaveLength(3);
    expect(columns[0]).toEqual(approved);
    expect(columns[1]).toEqual([...approved.slice(1), approved[0]]);
    expect(columns[2]).toEqual([...approved.slice(2), ...approved.slice(0, 2)]);
  });

  it("returns empty columns when there are no items", () => {
    expect(splitTestimonialsIntoColumns([], 3)).toEqual([[], [], []]);
  });
});
