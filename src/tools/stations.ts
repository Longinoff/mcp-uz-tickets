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
  const list: Station[] = Array.isArray(data) ? data : [];

  return list.map((s: { id?: number; name?: string; title?: string }) => ({
    id: Number(s.id),
    title: String(s.name ?? s.title ?? ""),
  }));
}
