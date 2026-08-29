import { describe, expect, it } from "vite-plus/test";
import { applyFilters } from "@/lib/events-utils";
import type { AIEvent } from "@/types/events";

function makeEvent(overrides: Partial<AIEvent> & Pick<AIEvent, "id" | "date" | "time">): AIEvent {
  return {
    slug: overrides.id,
    name: overrides.id,
    locationType: "offline",
    locationDetail: "Jakarta",
    description: "Community event",
    organizer: "VibeDev ID",
    registrationUrl: "https://example.com/register",
    coverImage: "",
    category: "workshop",
    status: "upcoming",
    ...overrides,
  };
}

const earlierUpcoming = makeEvent({
  id: "earlier-upcoming",
  date: "2030-01-15",
  time: "09:00",
  status: "upcoming",
});

const laterUpcoming = makeEvent({
  id: "later-upcoming",
  date: "2030-06-20",
  time: "18:00",
  status: "upcoming",
});

const pastEvent = makeEvent({
  id: "past-event",
  date: "2020-01-01",
  time: "10:00",
  status: "past",
});

describe("applyFilters — sort", () => {
  it("keeps upcoming events ahead of past events for nearest sort", () => {
    const result = applyFilters([pastEvent, laterUpcoming, earlierUpcoming], {
      sort: "nearest",
    });

    expect(result.map((event) => event.id)).toEqual([
      "earlier-upcoming",
      "later-upcoming",
      "past-event",
    ]);
  });

  it("orders by calendar date then time descending for latest sort", () => {
    const sameDayMorning = makeEvent({
      id: "same-day-morning",
      date: "2030-06-20",
      time: "08:00",
      status: "upcoming",
    });

    const result = applyFilters([earlierUpcoming, sameDayMorning, laterUpcoming, pastEvent], {
      sort: "latest",
    });

    expect(result.map((event) => event.id)).toEqual([
      "later-upcoming",
      "same-day-morning",
      "earlier-upcoming",
      "past-event",
    ]);
  });
});
