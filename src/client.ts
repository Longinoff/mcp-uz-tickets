import axios, { type AxiosInstance } from "axios";
import { loadToken, saveToken } from "./auth.js";

const BASE_URL = "https://booking.uz.gov.ua";

const HEADERS = {
  Accept: "application/json",
  "Accept-Encoding": "gzip",
  "Content-Type": "application/json; charset=UTF-8",
  "User-Agent": "UZ/1.7.3 Android/7.1.2 User/guest",
  "x-client-locale": "uk",
};

export function createClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: BASE_URL,
    headers: HEADERS,
    timeout: 15000,
  });

  instance.interceptors.request.use((config) => {
    const token = loadToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  });

  return instance;
}

export const client = createClient();

export async function sendSms(phone: string): Promise<void> {
  await client.post("/api/auth/send-sms", { phone });
}

export async function loginWithCode(
  phone: string,
  code: string
): Promise<void> {
  const response = await client.post("/api/v2/auth/login", {
    code,
    phone,
    device: {
      fcm_token: "mcp-uz-client",
      name: "MCP UZ Client",
    },
  });
  const token: string = response.data?.access_token;
  if (!token) throw new Error("Не получен access_token от сервера");
  saveToken(token);
}
