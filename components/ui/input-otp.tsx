"use client";

import { OTPInput, OTPInputContext } from "input-otp";
import * as React from "react";
import { cn } from "@/lib/utils";

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & { containerClassName?: string }) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn("flex items-center gap-2 has-disabled:opacity-50", containerClassName)}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  );
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="input-otp-group" className={cn("flex items-center", className)} {...props} />
  );
}

function InputOTPSlot({
  index,
  className,
  invalid,
  ...props
}: React.ComponentProps<"div"> & { index: number; invalid?: boolean }) {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      data-invalid={invalid || undefined}
      className={cn(
        "relative flex h-14 w-12 items-center justify-center border-y border-r border-border bg-muted/30 text-2xl font-medium tabular-nums transition-[box-shadow,border-color] first:rounded-l-xl first:border-l last:rounded-r-xl max-[400px]:h-13 max-[400px]:w-11",
        "data-[active=true]:z-10 data-[active=true]:ring-2 data-[active=true]:ring-primary",
        "data-[invalid=true]:border-destructive data-[invalid=true]:data-[active=true]:ring-destructive",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-px bg-foreground motion-safe:animate-caret-blink" />
        </div>
      )}
    </div>
  );
}

function InputOTPSeparator(props: React.ComponentProps<"div">) {
  return (
    <div data-slot="input-otp-separator" aria-hidden="true" {...props}>
      <div className="h-0.5 w-2 rounded-full bg-muted-foreground/50" />
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };
