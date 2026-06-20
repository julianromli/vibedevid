import { createFileRoute } from "@tanstack/react-router";
import CalendarPage from "@/app/calendar/page";
import { absoluteUrl } from "@/lib/seo/site-url";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Kalender Event | VibeDev ID" },
      {
        name: "description",
        content: "Kalender event, meetup, dan workshop AI & coding dari komunitas VibeDev ID.",
      },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/calendar") }],
  }),
  component: CalendarRoute,
});

function CalendarRoute() {
  return <CalendarPage />;
}
