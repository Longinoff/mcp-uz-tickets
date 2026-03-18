import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKEN_FILE = join(__dirname, "..", "token.json");

interface TokenData {
  access_token: string;
  user_id: number | null;
  saved_at: string;
}

export function loadToken(): string | null {
  if (!existsSync(TOKEN_FILE)) return null;
  try {
    const data: TokenData = JSON.parse(readFileSync(TOKEN_FILE, "utf-8"));
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

export function loadUserId(): number | null {
  if (!existsSync(TOKEN_FILE)) return null;
  try {
    const data: TokenData = JSON.parse(readFileSync(TOKEN_FILE, "utf-8"));
    return data.user_id ?? null;
  } catch {
    return null;
  }
}

export function saveToken(token: string, userId: number | null = null): void {
  const data: TokenData = {
    access_token: token,
    user_id: userId,
    saved_at: new Date().toISOString(),
  };
  writeFileSync(TOKEN_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function hasToken(): boolean {
  return loadToken() !== null;
}
