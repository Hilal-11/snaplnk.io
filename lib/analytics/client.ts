// lib/analytics/client.ts
// Browser-side tracker. track(name, metadata) is typed against EVENT_NAMES, batches events
// and ships them with navigator.sendBeacon (fetch keepalive fallback) to /api/track.
// Everything is wrapped so tracking can never throw or block the UI.
import { MAX_BATCH, type EventName } from "./events";

type Meta = Record<string, string | number | boolean | null>;
type Queued = { name: EventName; path?: string; referrer?: string; ts: number; metadata: Meta };

const ENDPOINT = "/api/track";
const AID_KEY = "snl_aid";
const SID_KEY = "snl_sid";
const OPT_OUT_KEY = "snl_track_optout";
const SESSION_IDLE_MS = 30 * 60_000;
const FLUSH_MS = 4000;

let queue: Queued[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let listening = false;
let firstViewInSession = true;

function randomId(): string {
  try {
    return crypto.randomUUID().replace(/-/g, "");
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

function anonymousId(): string {
  try {
    let id = localStorage.getItem(AID_KEY);
    if (!id || !/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
      id = randomId();
      localStorage.setItem(AID_KEY, id);
    }
    return id;
  } catch {
    return "nostorage" + randomId().slice(0, 16);
  }
}

/** Session = same tab activity with no gap longer than 30 minutes. */
function sessionId(): string {
  try {
    const raw = sessionStorage.getItem(SID_KEY);
    const now = Date.now();
    if (raw) {
      const [id, last] = raw.split(":");
      if (id && now - Number(last) < SESSION_IDLE_MS) {
        sessionStorage.setItem(SID_KEY, `${id}:${now}`);
        firstViewInSession = false;
        return id;
      }
    }
    const id = randomId();
    sessionStorage.setItem(SID_KEY, `${id}:${now}`);
    firstViewInSession = true;
    return id;
  } catch {
    return "nosession" + randomId().slice(0, 16);
  }
}

export function isTrackingAllowed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    if (location.pathname.startsWith("/admin")) return false;
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === "1" || nav.globalPrivacyControl === true) return false;
    return localStorage.getItem(OPT_OUT_KEY) !== "1";
  } catch {
    return false;
  }
}

export function setTrackingOptOut(optOut: boolean) {
  try {
    if (optOut) localStorage.setItem(OPT_OUT_KEY, "1");
    else localStorage.removeItem(OPT_OUT_KEY);
    if (optOut) queue = [];
  } catch {}
}

export function isTrackingOptedOut(): boolean {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

function send(events: Queued[]) {
  if (!events.length) return;
  const body = JSON.stringify({ anonymousId: anonymousId(), sessionId: sessionId(), events });
  try {
    if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }))) return;
  } catch {}
  try {
    void fetch(ENDPOINT, { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
  } catch {}
}

export function flush() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  while (queue.length) send(queue.splice(0, MAX_BATCH));
}

function listen() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}

/** Record an event. Safe to call anywhere on the client; never throws. */
export function track(name: EventName, metadata: Meta = {}): void {
  try {
    if (!isTrackingAllowed()) return;
    listen();
    const clean: Meta = {};
    for (const [k, v] of Object.entries(metadata).slice(0, 20)) {
      clean[k.slice(0, 40)] = typeof v === "string" ? v.slice(0, 500) : v;
    }
    const path = (location.pathname + location.search).slice(0, 512);
    const isView = name === "page_view";
    sessionId(); // refresh idle window / detect a new session
    const referrer =
      isView && firstViewInSession && document.referrer && !document.referrer.startsWith(location.origin)
        ? document.referrer.slice(0, 1024)
        : undefined;
    queue.push({ name, path, referrer, ts: Date.now(), metadata: clean });
    if (queue.length >= 10) flush();
    else if (!timer) timer = setTimeout(flush, FLUSH_MS);
  } catch {
    /* tracking must never break the page */
  }
}
