/**
 * Turn a route error into a string React can render. TanStack's default
 * ErrorComponent puts `error.message` in the tree; a non-string message
 * throws "Objects are not valid as a React child".
 */
export function stringifyRouteError(error: unknown): string {
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = error.message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return "The page failed to load.";
}
