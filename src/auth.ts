import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKEN_FILE = join(__dirname, "..", "token.json");

interface TokenData {
  access_token: string;
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

export function saveToken(token: string): void {
  const data: TokenData = {
    access_token: token,
    saved_at: new Date().toISOString(),
  };
  writeFileSync(TOKEN_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function hasToken(): boolean {
  return loadToken() !== null;
}
