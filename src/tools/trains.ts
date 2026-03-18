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

function formatTs(ts: number): { date: string; time: string } {
  const d = new Date(ts * 1000);
  const date = d.toLocaleDateString("uk-UA", { timeZone: "Europe/Kyiv", day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("uk-UA", { timeZone: "Europe/Kyiv", hour: "2-digit", minute: "2-digit" });
  return { date, time };
}

export async function getDepartureDates(fromId: number, toId: number): Promise<string[]> {
  const response = await client.get("/api/trips/departure-dates", {
    params: {
      station_from_id: fromId,
      station_to_id: toId,
    },
  });

  const data = response.data;
  return Array.isArray(data) ? data : [];
}

export async function searchTrains(fromId: number, toId: number, date: string): Promise<Train[]> {
  const response = await client.get("/api/trips", {
    params: {
      station_from_id: fromId,
      station_to_id: toId,
      date,
    },
  });

  const data = response.data;
  const list = Array.isArray(data) ? data : [];

  return list.map((t: Record<string, unknown>) => {
    const train = t.train as Record<string, unknown> ?? {};
    const fromTs = formatTs(Number(t.depart_at));
    const toTs = formatTs(Number(t.arrive_at));

    const departMs = Number(t.depart_at) * 1000;
    const arriveMs = Number(t.arrive_at) * 1000;
    const diffMin = Math.round((arriveMs - departMs) / 60000);
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;

    const wagonClasses = Array.isArray(train.wagon_classes)
      ? (train.wagon_classes as Record<string, unknown>[]).map((c) => ({
          type: String(c.id ?? ""),
          title: String(c.name ?? ""),
          seats: Number(c.free_seats ?? 0),
          price: Math.round(Number(c.price ?? 0) / 100),
        }))
      : [];

    return {
      id: String(t.id ?? ""),
      number: String(train.number ?? ""),
      from: { station: String(train.station_from ?? ""), ...fromTs },
      to: { station: String(train.station_to ?? ""), ...toTs },
      travel_time: `${hours}г ${mins}хв`,
      wagon_classes: wagonClasses,
    };
  });
}
