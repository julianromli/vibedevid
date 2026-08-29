export function resolveLandingTestimonials<T>(approved: T[], seed: T[]): T[] {
  return approved.length > 0 ? approved : seed;
}

export function splitTestimonialsIntoColumns<T>(items: T[], columnCount = 3): T[][] {
  const columns = Array.from({ length: columnCount }, () => [] as T[]);
  items.forEach((item, index) => {
    columns[index % columnCount]?.push(item);
  });
  return columns;
}
