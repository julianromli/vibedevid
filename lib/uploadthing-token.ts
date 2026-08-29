export function isUploadthingTokenShape(token: string): boolean {
  const value = token.trim();
  if (!value) return false;

  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json = JSON.parse(globalThis.atob(padded)) as {
      apiKey?: unknown;
      appId?: unknown;
      regions?: unknown;
    };
    return (
      typeof json.apiKey === "string" &&
      json.apiKey.length > 0 &&
      typeof json.appId === "string" &&
      json.appId.length > 0 &&
      Array.isArray(json.regions)
    );
  } catch {
    return false;
  }
}
