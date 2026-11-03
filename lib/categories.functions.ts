import { createServerFn } from "@tanstack/react-start";
import { getCategories } from "@/lib/categories";

// Client-callable wrapper. Keep it apart from lib/categories.ts: that module
// imports the DB client, and postgres.js throws at module eval in the browser.
export const getCategoriesFn = createServerFn({ method: "GET" }).handler(async () =>
  getCategories(),
);
