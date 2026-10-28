/** Shared by the auth card and the submit form so both read as one product. */
export const authInputClassName =
  "h-12 rounded-xl border bg-muted/30 text-base focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive";

/** Loading keeps the full fill: a dimmed gold reads as olive, not as busy. */
export const authPrimaryButtonClassName =
  "h-12 w-full rounded-xl text-base font-medium transition-[transform,background-color,color] duration-160 ease-out active:scale-[0.97] disabled:opacity-100";
