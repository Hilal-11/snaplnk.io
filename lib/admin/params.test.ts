import { describe, expect, it } from "vitest";
import { eventsParams, linksParams, parseParams, rangeParams, rangeWindow, usersParams } from "./params";

describe("admin URL params", () => {
  it("parses valid user filters", () => {
    expect(parseParams(usersParams, { q: " alice ", role: "ADMIN", status: "banned", sort: "clicks", dir: "asc", page: "3" })).toEqual({
      q: "alice",
      role: "ADMIN",
      status: "banned",
      sort: "clicks",
      dir: "asc",
      page: 3,
    });
  });

  it("falls back to safe defaults for junk instead of throwing", () => {
    const p = parseParams(usersParams, { role: "ROOT", status: "x", sort: "password_hash", dir: "sideways", page: "-4", q: "" });
    expect(p).toEqual({ q: undefined, role: undefined, status: undefined, sort: "created", dir: "desc", page: 1 });
  });

  it("takes the first value of repeated params and rejects bad uuids / event names", () => {
    expect(parseParams(linksParams, { status: ["deleted", "active"], owner: "not-a-uuid" })).toMatchObject({ status: "deleted", owner: undefined });
    expect(parseParams(eventsParams, { name: "drop_table", user: "11111111-0000-4000-8000-000000000001" })).toMatchObject({
      name: undefined,
      user: "11111111-0000-4000-8000-000000000001",
    });
  });

  it("caps long search strings", () => {
    expect(parseParams(usersParams, { q: "x".repeat(500) }).q).toBeUndefined();
  });
});

describe("rangeWindow", () => {
  const now = new Date("2026-11-15T10:30:20Z");
  it("rounds `to` up to the minute and spans N days", () => {
    const w = rangeWindow("7d", now);
    expect(w.to).toBe("2026-11-15T10:31:00.000Z");
    expect(w.from).toBe("2026-11-08T10:31:00.000Z");
    expect(w.days).toBe(7);
  });
  it("today starts at UTC midnight", () => {
    expect(rangeWindow("today", now).from).toBe("2026-11-15T00:00:00.000Z");
  });
  it("defaults unknown ranges to 30d", () => {
    expect(parseParams(rangeParams, { range: "1y" }).range).toBe("30d");
  });
});
