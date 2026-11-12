// lib/devicePrefs.ts
// Per-device preferences in localStorage (layout, motion). Changes broadcast an
// event so open components update instantly (and other tabs via "storage").
export type DeviceView = "list" | "grid2" | "grid4";

const KEYS = {
  defaultView: "snaplnk:pref:default-view",
  reduceMotion: "snaplnk:pref:reduce-motion",
} as const;
const EVENT = "snaplnk:device-prefs";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

export function subscribeDevicePrefs(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function getDefaultView(): DeviceView {
  const v = read(KEYS.defaultView);
  return v === "grid2" || v === "grid4" ? v : "list";
}
export function setDefaultView(v: DeviceView) {
  write(KEYS.defaultView, v);
}

export function getReduceMotion(): boolean {
  return read(KEYS.reduceMotion) === "1";
}
export function setReduceMotion(on: boolean) {
  write(KEYS.reduceMotion, on ? "1" : null);
}

/** Forget layouts picked on individual pages so the default applies everywhere again. */
export function resetPageViews() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("snaplnk:view:"))
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}
