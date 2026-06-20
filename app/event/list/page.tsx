import { fetchApprovedEvents } from "@/lib/server/events-public";
import EventListClient from "./event-list-client";

export default async function EventListPage() {
  const initialEvents = await fetchApprovedEvents();

  return <EventListClient initialEvents={initialEvents || []} />;
}
