import { client } from "../client.js";

export interface Station {
  id: number;
  title: string;
}

export async function searchStations(query: string): Promise<Station[]> {
  const response = await client.get("/api/stations", {
    params: { q: query },
  });

  const data = response.data;

  // API может вернуть массив напрямую или в поле data/stations
  const list: Station[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.stations)
    ? data.stations
    : [];

  return list.map((s) => ({
    id: s.id,
    title: s.title,
  }));
}
