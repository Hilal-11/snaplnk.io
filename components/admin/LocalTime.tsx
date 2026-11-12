"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** Renders a UTC timestamp in the viewer's local timezone (UTC on the server render). */
export default function LocalTime({ iso, className }: { iso: string; className?: string }) {
  const client = useSyncExternalStore(noop, () => true, () => false);
  const d = new Date(iso);
  const text = client
    ? d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : d.toISOString().slice(0, 16).replace("T", " ") + " UTC";
  return (
    <time dateTime={iso} className={className} title={client ? d.toString() : iso}>
      {text}
    </time>
  );
}
