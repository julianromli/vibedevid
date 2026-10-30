import * as React from "react";

import { fieldClassName } from "@/components/ui/form-classes";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

function Input({
  ref,
  className,
  type,
  ...props
}: InputProps & { ref?: React.Ref<HTMLInputElement> }) {
  return (
    <input
      type={type}
      className={cn(
        fieldClassName,
        "flex h-10 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
}

Input.displayName = "Input";

function InputWithIcon({
  ref,
  className,
  type,
  icon,
  ...props
}: InputProps & {
  ref?: React.Ref<HTMLInputElement>;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative">
      {icon}
      <input
        type={type}
        className={cn(
          fieldClassName,
          "flex h-10 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "pr-3 pl-12",
          className,
        )}
        ref={ref}
        {...props}
      />
    </div>
  );
}

InputWithIcon.displayName = "InputWithIcon";

export { Input, InputWithIcon };
