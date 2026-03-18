import { client } from "../client.js";

export interface Train {
  id: string;
  number: string;
  from: { station: string; time: string; date: string };
  to: { station: string; time: string; date: string };
  travel_time: string;
  wagon_classes: WagonClass[];
}

export interface WagonClass {
  type: string;
  title: string;
  seats: number;
  price: number;
}

export async function getDepartureDates(
  fromId: number,
  toId: number
): Promise<string[]> {
  const response = await client.get("/api/trips/departure-dates", {
    params: {
      from_station_id: fromId,
      to_station_id: toId,
    },
  });

  const data = response.data;
  const dates: string[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.dates)
    ? data.dates
    : Array.isArray(data?.data)
    ? data.data
    : [];

  return dates;
}

export async function searchTrains(
  fromId: number,
  toId: number,
  date: string // формат YYYY-MM-DD
): Promise<Train[]> {
  const response = await client.get("/api/trips", {
    params: {
      from_station_id: fromId,
      to_station_id: toId,
      date,
    },
  });

  const data = response.data;
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.trips)
    ? data.trips
    : [];

  return list.map((t: Record<string, unknown>) => ({
    id: String(t.id ?? t.trip_id ?? ""),
    number: String(t.number ?? t.train_number ?? ""),
    from: normalizeStop(t.from ?? t.departure),
    to: normalizeStop(t.to ?? t.arrival),
    travel_time: String(t.travel_time ?? t.duration ?? ""),
    wagon_classes: normalizeWagonClasses(t.wagon_classes ?? t.classes ?? []),
  }));
}

function normalizeStop(stop: unknown): Train["from"] {
  if (!stop || typeof stop !== "object") {
    return { station: "", time: "", date: "" };
  }
  const s = stop as Record<string, unknown>;
  return {
    station: String(s.station ?? s.station_title ?? ""),
    time: String(s.time ?? s.departure_time ?? s.arrival_time ?? ""),
    date: String(s.date ?? ""),
  };
}

function normalizeWagonClasses(classes: unknown): WagonClass[] {
  if (!Array.isArray(classes)) return [];
  return classes.map((c: Record<string, unknown>) => ({
    type: String(c.type ?? c.wagon_type ?? ""),
    title: String(c.title ?? c.name ?? c.type ?? ""),
    seats: Number(c.seats ?? c.available_seats ?? 0),
    price: Number(c.price ?? c.min_price ?? 0),
  }));
}
