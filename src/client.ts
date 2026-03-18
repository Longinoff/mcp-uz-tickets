import axios, { type AxiosInstance } from "axios";
import { loadToken, loadUserId, saveToken } from "./auth.js";

const BASE_URL = "https://app.uz.gov.ua";

function buildHeaders() {
  const userId = loadUserId() ?? "guest";
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": `UZ/3.3.0 Android/9 User/${userId}`,
    "X-Client-Locale": "uk",
    "X-Client-Theme": "light",
  };
}

export function createClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
  });

  instance.interceptors.request.use((config) => {
    Object.assign(config.headers, buildHeaders());
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

export async function loginWithCode(phone: string, code: string): Promise<void> {
  const response = await client.post("/api/v2/auth/login", {
    code,
    phone,
    device: {
      fcm_token: "mcp-uz-client",
      name: "MCP UZ Client",
    },
  });
  const token: string = response.data?.token?.access_token ?? response.data?.access_token;
  if (!token) throw new Error("Не получен access_token от сервера");
  const userId: number | null = response.data?.profile?.id ?? null;
  saveToken(token, userId);
}
