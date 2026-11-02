import { definePlugin } from "nitro";
import { AUTH_CLEANUP_CRON, deleteExpiredAuthRows } from "@/lib/server/auth-cleanup";

/**
 * Runs on the Worker's `scheduled` event (Cloudflare Cron Triggers).
 * Request handling never touches these tables, so an idle site lets Neon scale to zero.
 */
export default definePlugin((nitroApp) => {
  nitroApp.hooks.hook("cloudflare:scheduled", async ({ controller }) => {
    if (controller.cron !== AUTH_CLEANUP_CRON) return;
    try {
      await deleteExpiredAuthRows();
    } catch (error) {
      console.log("[auth-cleanup] expired auth cleanup failed:", error);
    }
  });
});
