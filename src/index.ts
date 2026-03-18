import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { hasToken, loadToken } from "./auth.js";
import { sendSms, loginWithCode } from "./client.js";
import { searchStations } from "./tools/stations.js";
import { getDepartureDates, searchTrains } from "./tools/trains.js";
import { getWagons } from "./tools/wagons.js";

const PHONE = "+380674913367";

const server = new McpServer({
  name: "uz-tickets",
  version: "1.0.0",
});

// ── Auth tools ──────────────────────────────────────────────────────────────

server.tool(
  "uz_auth_status",
  "Проверить, авторизован ли клиент (есть ли сохранённый токен)",
  {},
  async () => {
    const token = loadToken();
    if (token) {
      return {
        content: [{ type: "text", text: `Авторизован. Токен: ${token.slice(0, 20)}...` }],
      };
    }
    return {
      content: [{ type: "text", text: "Не авторизован. Используй uz_request_sms для получения кода." }],
    };
  }
);

server.tool(
  "uz_request_sms",
  `Отправить SMS с кодом подтверждения на номер ${PHONE}`,
  {},
  async () => {
    await sendSms(PHONE);
    return {
      content: [{ type: "text", text: `SMS отправлено на ${PHONE}. Используй uz_confirm_sms с полученным кодом.` }],
    };
  }
);

server.tool(
  "uz_confirm_sms",
  "Подтвердить авторизацию кодом из SMS",
  { code: z.string().describe("4-значный код из SMS") },
  async ({ code }) => {
    await loginWithCode(PHONE, code);
    return {
      content: [{ type: "text", text: "Авторизация успешна. Токен сохранён." }],
    };
  }
);

// ── Station tools ────────────────────────────────────────────────────────────

server.tool(
  "uz_search_stations",
  "Поиск станций по названию",
  { query: z.string().describe("Название станции или её часть, например 'Київ' или 'Харків'") },
  async ({ query }) => {
    const stations = await searchStations(query);
    if (stations.length === 0) {
      return { content: [{ type: "text", text: "Станции не найдены." }] };
    }
    const lines = stations.map((s) => `${s.title} (id: ${s.id})`).join("\n");
    return { content: [{ type: "text", text: lines }] };
  }
);

// ── Train tools ───────────────────────────────────────────────────────────────

server.tool(
  "uz_get_departure_dates",
  "Получить доступные даты отправления для маршрута",
  {
    from_id: z.number().describe("ID станции отправления (из uz_search_stations)"),
    to_id: z.number().describe("ID станции назначения (из uz_search_stations)"),
  },
  async ({ from_id, to_id }) => {
    const dates = await getDepartureDates(from_id, to_id);
    if (dates.length === 0) {
      return { content: [{ type: "text", text: "Доступных дат не найдено." }] };
    }
    return { content: [{ type: "text", text: dates.join("\n") }] };
  }
);

server.tool(
  "uz_search_trains",
  "Найти поезда между двумя станциями на конкретную дату",
  {
    from_id: z.number().describe("ID станции отправления"),
    to_id: z.number().describe("ID станции назначения"),
    date: z.string().describe("Дата в формате YYYY-MM-DD, например 2026-03-25"),
  },
  async ({ from_id, to_id, date }) => {
    const trains = await searchTrains(from_id, to_id, date);
    if (trains.length === 0) {
      return { content: [{ type: "text", text: "Поезда не найдены." }] };
    }
    const lines = trains.map((t) => {
      const classes = t.wagon_classes
        .map((c) => `${c.title}: ${c.seats} мест от ${c.price} грн`)
        .join(", ");
      return [
        `Поезд №${t.number} (id: ${t.id})`,
        `  ${t.from.station} ${t.from.date} ${t.from.time} → ${t.to.station} ${t.to.date} ${t.to.time}`,
        `  В пути: ${t.travel_time}`,
        `  Классы: ${classes || "нет данных"}`,
      ].join("\n");
    });
    return { content: [{ type: "text", text: lines.join("\n\n") }] };
  }
);

// ── Wagon tools ───────────────────────────────────────────────────────────────

server.tool(
  "uz_get_wagons",
  "Получить список вагонов и мест для конкретного поезда и класса вагона",
  {
    trip_id: z.string().describe("ID поездки (из uz_search_trains)"),
    wagon_class: z.string().describe("Класс вагона: Л (люкс), К (купе), П (плацкарт), С (сидячий)"),
  },
  async ({ trip_id, wagon_class }) => {
    const wagons = await getWagons(trip_id, wagon_class);
    if (wagons.length === 0) {
      return { content: [{ type: "text", text: "Вагоны не найдены." }] };
    }
    const lines = wagons.map((w) => {
      const availableSeats = w.seats.filter((s) => s.available).map((s) => s.number);
      return [
        `Вагон №${w.number} (${w.class}) — ${w.available_seats} мест, цена: ${w.price} грн`,
        availableSeats.length > 0
          ? `  Свободные места: ${availableSeats.join(", ")}`
          : "  Нет свободных мест",
        w.services.length > 0 ? `  Услуги: ${w.services.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    });
    return { content: [{ type: "text", text: lines.join("\n\n") }] };
  }
);

// ── Start ────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
