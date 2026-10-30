import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * ClaudeToolCall — Claude Code's collapsed tool/result line.
 *
 * In the terminal this is faked with box-drawing glyphs and a "ctrl+o to
 * expand" hint. Here a call with output is a real <details> disclosure:
 * keyboard-operable, announced to screen readers, and it keeps the exact
 * ⏺ / ⎿ visual grammar. A call without output is a plain block.
 */
type Status = "success" | "error" | "pending";

const STATUS_COLOR: Record<Status, string> = {
  success: "#4ea96f",
  error: "#f7768e",
  pending: "#e0af68",
};

// The ⏺ glyph's color is the only visual status cue, so screen readers get it as text.
const STATUS_LABEL: Record<Status, string> = {
  success: "Succeeded",
  error: "Failed",
  pending: "Running",
};

export function ClaudeToolCall({
  tool,
  arg,
  result,
  status = "success",
  defaultOpen = false,
  className,
  children,
}: {
  tool: string;
  arg?: string;
  result: string;
  status?: Status;
  defaultOpen?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const expandable = Boolean(children);

  const line = (
    <>
      <span className="flex min-w-0 items-baseline gap-2">
        <span aria-hidden className="shrink-0" style={{ color: STATUS_COLOR[status] }}>
          ⏺
        </span>
        <span className="min-w-0 break-words">
          <span className="sr-only">{STATUS_LABEL[status]}: </span>
          <span className="text-[#c0caf5]">{tool}</span>
          {arg !== undefined ? (
            <>
              <span className="text-[#565f89]">(</span>
              <span className="text-[#7dcfff]">{arg}</span>
              <span className="text-[#565f89]">)</span>
            </>
          ) : null}
        </span>
      </span>
      <span className="flex min-w-0 items-baseline gap-2 text-[#8b8fa3]">
        {/* invisible status glyph spacer: aligns ⎿ under the tool name */}
        <span aria-hidden className="invisible shrink-0">
          ⏺
        </span>
        <span className="flex min-w-0 items-baseline gap-2">
          <span aria-hidden className="shrink-0 text-[#565f89]">
            ⎿
          </span>
          <span className="min-w-0 break-words">
            {result}
            {expandable ? (
              <span className="ml-2 text-[#565f89] group-open:hidden">(ctrl+o to expand)</span>
            ) : null}
          </span>
        </span>
      </span>
    </>
  );

  // Without output there is nothing to open, so it is not a disclosure.
  if (!expandable) {
    return <div className={cn("font-mono text-[13px] leading-[1.55]", className)}>{line}</div>;
  }

  return (
    <details
      open={defaultOpen}
      className={cn(
        "group font-mono text-[13px] leading-[1.55] [&_summary::-webkit-details-marker]:hidden",
        className,
      )}
    >
      <summary className="list-none cursor-pointer rounded-none outline-none focus-visible:ring-1 focus-visible:ring-[#7dcfff]/60">
        {line}
      </summary>

      <div className="mt-1 whitespace-pre-wrap pl-[32px] text-[#8b8fa3]">{children}</div>
    </details>
  );
}
