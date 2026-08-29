export function resolveLandingTestimonials<T>(approved: T[], seed: T[]): T[] {
  return approved.length > 0 ? approved : seed;
}

export function splitTestimonialsIntoColumns<T>(items: T[], columnCount = 3): T[][] {
  if (items.length === 0) {
    return Array.from({ length: columnCount }, () => [] as T[]);
  }

  return Array.from({ length: columnCount }, (_, columnIndex) => {
    const offset = columnIndex % items.length;
    return items.slice(offset).concat(items.slice(0, offset));
  });
}
