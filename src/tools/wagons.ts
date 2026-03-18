import { client } from "../client.js";

export interface Wagon {
  number: string;
  type: string;
  class: string;
  available_seats: number;
  seats: Seat[];
  price: number;
  services: string[];
}

export interface Seat {
  number: number;
  type: string;
  available: boolean;
}

export async function getWagons(
  tripId: string,
  wagonClass: string
): Promise<Wagon[]> {
  const response = await client.get(
    `/api/v2/trips/${tripId}/wagons-by-class/${wagonClass}`
  );

  const data = response.data;
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.wagons)
    ? data.wagons
    : [];

  return list.map((w: Record<string, unknown>) => ({
    number: String(w.number ?? w.wagon_number ?? ""),
    type: String(w.type ?? ""),
    class: String(w.class ?? wagonClass),
    available_seats: Number(w.available_seats ?? w.seats_count ?? 0),
    seats: normalizeSeats(w.seats ?? []),
    price: Number(w.price ?? w.min_price ?? 0),
    services: Array.isArray(w.services)
      ? w.services.map(String)
      : [],
  }));
}

function normalizeSeats(seats: unknown): Seat[] {
  if (!Array.isArray(seats)) return [];
  return seats.map((s: Record<string, unknown>) => ({
    number: Number(s.number ?? s.seat_number ?? 0),
    type: String(s.type ?? ""),
    available: Boolean(s.available ?? s.is_available ?? false),
  }));
}
