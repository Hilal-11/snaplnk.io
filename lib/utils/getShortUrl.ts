const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export function getShortUrl(shortCode: string): string {
  return `${BASE_URL}/${shortCode}`;
}

export function getShortUrlDisplay(shortCode: string): string {
  return `${BASE_URL.replace(/^https?:\/\//, "")}/${shortCode}`;
}

export function getBaseUrl(): string {
  return BASE_URL;
}
