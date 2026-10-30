/**
 * One look for every text field (Input, InputWithIcon, Textarea). See DESIGN.md → Colors and Typography.
 * Edge is `field` (3:1 on every surface); hover lifts it, focus switches it to primary with an offset ring,
 * aria-invalid keeps it destructive even while focused. Text is 16px below md so iOS does not zoom.
 */
export const fieldClassName =
  "w-full rounded-md border-2 border-field bg-card px-3 py-2 text-base text-foreground ring-offset-background transition-[color,background-color,border-color,box-shadow] placeholder:text-muted-foreground hover:border-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive disabled:cursor-not-allowed disabled:border-input disabled:bg-disabled disabled:text-disabled-foreground md:text-sm";

/** Large field size for the auth card and the submit form. Shape only: the look comes from fieldClassName. */
export const authInputClassName = "h-12 rounded-xl text-base md:text-base";

/** Loading keeps the full fill: a dimmed gold reads as olive, not as busy. */
export const authPrimaryButtonClassName =
  "h-12 w-full rounded-xl text-base font-medium transition-[transform,background-color,color] duration-160 ease-out active:scale-[0.97] disabled:opacity-100";
