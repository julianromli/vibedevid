"use client";

import { Link, type ErrorComponentProps } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { stringifyRouteError } from "@/lib/route-error";

export function DefaultRouteError({ error, reset }: ErrorComponentProps) {
  const [showDetails, setShowDetails] = useState(false);
  const detail = stringifyRouteError(error);

  function reloadPage() {
    reset();
    window.location.reload();
  }

  return (
    <div className="h-svh w-full">
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2 px-4">
        <h1 className="text-[7rem] leading-tight font-bold">500</h1>
        <span className="font-medium">The page failed to load</span>
        <p className="text-muted-foreground max-w-md text-center text-pretty">
          Reload the page and try again. If you opened this link in another app, that app&apos;s
          browser can block storage. Reloading usually fixes it.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Button type="button" onClick={reloadPage}>
            Reload page
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
        <button
          type="button"
          className="text-muted-foreground mt-4 rounded-sm text-sm underline-offset-4 hover:underline focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
          onClick={() => setShowDetails((open) => !open)}
          aria-expanded={showDetails}
        >
          {showDetails ? "Hide details" : "Show details"}
        </button>
        {showDetails ? (
          <pre className="bg-muted mt-2 max-w-full overflow-x-auto rounded-md p-3 text-left text-xs">
            <code>{detail}</code>
          </pre>
        ) : null}
      </div>
    </div>
  );
}
