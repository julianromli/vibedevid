import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

// Interfere button system (DESIGN.md → Button). Colors 150ms, press scale 200ms.
// On touch screens the ::before box grows the hit area 6px per side: h-8 → 44px, h-9 → 48px.
// A button that sits inside a field opts out with before:hidden.
const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,background-color,border-color,box-shadow,scale] [transition-duration:150ms,150ms,150ms,150ms,200ms] ease-[cubic-bezier(0,0,0.2,1)] active:scale-[0.97] motion-reduce:active:scale-100 pointer-coarse:before:absolute pointer-coarse:before:-inset-1.5 disabled:pointer-events-none disabled:bg-disabled disabled:text-disabled-foreground disabled:shadow-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80 active:bg-primary/70",
        secondary:
          "bg-component text-foreground shadow-[inset_0_0_0_0.5px_var(--component)] hover:bg-component-hover",
        tertiary:
          "bg-component text-subtle-foreground hover:bg-component-hover active:bg-component-active",
        brand: "bg-brand text-brand-foreground hover:bg-brand-hover",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive-hover active:bg-destructive-active",
        "danger-subtle":
          "bg-danger-subtle text-danger-foreground hover:bg-danger-subtle-hover active:bg-danger-subtle-active",
        outline:
          "border border-input bg-transparent text-foreground shadow-xs hover:bg-component-hover disabled:bg-transparent",
        ghost:
          "text-subtle-foreground hover:bg-component-hover hover:text-foreground disabled:bg-transparent",
        link: "text-primary underline-offset-4 hover:underline disabled:bg-transparent",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-lg px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export type { ButtonProps };
export { Button, buttonVariants };
