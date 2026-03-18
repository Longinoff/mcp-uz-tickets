import { client } from "../client.js";

export interface Wagon {
  number: string;
  class: string;
  available_seats: number;
  free_seats_lower: number;
  free_seats_top: number;
  seats: number[];
  price: number;
  services: string[];
}

export async function getWagons(tripId: string, wagonClass: string): Promise<Wagon[]> {
  const response = await client.get(
    `/api/v2/trips/${tripId}/wagons-by-class/${wagonClass}`
  );

  const data = response.data;
  const list = Array.isArray(data) ? data : [];

  return list.map((w: Record<string, unknown>) => ({
    number: String(w.number ?? ""),
    class: String(w.wagon_key ?? wagonClass),
    available_seats: (Array.isArray(w.seats) ? (w.seats as number[]).length : 0),
    free_seats_lower: Number(w.free_seats_lower ?? 0),
    free_seats_top: Number(w.free_seats_top ?? 0),
    seats: Array.isArray(w.seats) ? (w.seats as number[]) : [],
    price: Math.round(Number(w.price ?? 0) / 100),
    services: Array.isArray(w.services)
      ? (w.services as Record<string, unknown>[]).map((s) => String(s.title ?? ""))
      : [],
  }));
}
