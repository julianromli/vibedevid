import { vi } from "vite-plus/test";

/**
 * Shared thenable query-chain stub for the read-module contract tests.
 * Each spec supplies its own resolver (selection keys -> rows) with a
 * hoisted state, so the meaning of each SELECT stays local to its spec;
 * the duplicated ~40 lines of chain plumbing (where/from/join/orderBy/
 * limit/then) lives once here.
 */

export type RowResolver = (selection: Record<string, unknown> | undefined) => unknown[];

export function makeQueryChain(
  selection: Record<string, unknown> | undefined,
  resolver: RowResolver,
): Record<string, unknown> {
  const q: Record<string, unknown> & { then?: unknown } = {};
  q.where = () => q;
  q.from = () => q;
  q.innerJoin = () => q;
  q.leftJoin = () => q;
  q.orderBy = () => q;
  q.groupBy = () => q;
  q.limit = () => q;
  q.values = () => q;
  q.set = () => q;
  q.then = (resolve: (v: unknown) => void, reject: (e: unknown) => void) => {
    try {
      resolve(resolver(selection));
    } catch (error) {
      reject(error);
    }
  };
  return q;
}

export function makeFakeDb(resolver: RowResolver) {
  return {
    select: (selection: Record<string, unknown>) => makeQueryChain(selection, resolver),
    // Mutations are out of scope for read tests but must exist on the surface.
    insert: () => makeQueryChain({ insert: true }, resolver),
    update: () => makeQueryChain({ update: true }, resolver),
    delete: () => makeQueryChain({ delete: true }, resolver),
  };
}
