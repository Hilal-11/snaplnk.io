import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  RESERVED_USERNAMES,
  checkUsername,
  isReservedAlias,
  normalizeUsername,
  validateUsername,
} from "./reserved";

describe("normalizeUsername", () => {
  it("trims, strips leading @ and lowercases", () => {
    expect(normalizeUsername("  @@Hilal_11 ")).toBe("hilal_11");
  });
});

describe("validateUsername", () => {
  it.each(["hilal", "hilal_11", "abc", "a1b", "dev_hila", "x".repeat(30), "Hilal", "@hilal"])(
    "accepts %s",
    (name) => {
      expect(validateUsername(name)).toBeNull();
    }
  );

  it.each([
    ["", "3-30"],
    ["ab", "3-30"],
    ["x".repeat(31), "3-30"],
    ["hi lal", "lowercase letters"],
    ["hi-lal", "lowercase letters"],
    ["hi.lal", "lowercase letters"],
    ["hilal!", "lowercase letters"],
    ["héllo", "lowercase letters"],
    ["ｈｉｌａｌ", "lowercase letters"], // full-width homoglyphs
    ["_hilal", "underscore"],
    ["hilal_", "underscore"],
    ["hi__lal", "consecutive"],
    ["12345", "letter"],
  ])("rejects %j as invalid", (name, fragment) => {
    const msg = validateUsername(name);
    expect(msg).not.toBeNull();
    expect(msg!.toLowerCase()).toContain(fragment.toLowerCase());
    expect(checkUsername(name).status).toBe("invalid");
  });

  it.each(["admin", "API", "@dashboard", "bio", "support", "snaplnk", "snaplnk_team", "the_snaplink", "test"])(
    "rejects %j as reserved",
    (name) => {
      expect(checkUsername(name).status).toBe("reserved");
      expect(validateUsername(name)).toBe("That username is reserved");
    }
  );

  it("returns the normalized username", () => {
    expect(checkUsername("  @Hilal ")).toEqual({ status: "ok", username: "hilal" });
  });

  it("every reserved name that matches the format is reported as reserved, not invalid", () => {
    for (const name of RESERVED_USERNAMES) {
      if (/^[a-z0-9_]{3,30}$/.test(name) && !/^_|_$|__/.test(name) && !/^\d+$/.test(name)) {
        expect(checkUsername(name).status, name).toBe("reserved");
      }
    }
  });
});

describe("isReservedAlias", () => {
  it.each(["dashboard", "Dashboard", "qr-codes", "api-keys", "bio", "go", "snaplnk-promo"])("blocks %s", (a) => {
    expect(isReservedAlias(a)).toBe(true);
  });
  it.each(["summer-sale", "my_link", "launch2026"])("allows %s", (a) => {
    expect(isReservedAlias(a)).toBe(false);
  });
});

describe("SQL reserved list parity", () => {
  it("migration seed matches RESERVED_USERNAMES exactly", () => {
    const dir = path.resolve(__dirname, "../../supabase/migrations");
    const file = readdirSync(dir).find((f) => f.endsWith("_bio_pages.sql"));
    expect(file, "bio_pages migration not found").toBeTruthy();
    const sql = readFileSync(path.join(dir, file!), "utf8");
    const block = sql.split("-- reserved:start")[1]?.split("-- reserved:end")[0] ?? "";
    const fromSql = new Set([...block.matchAll(/\('([^']+)'\)/g)].map((m) => m[1]));
    expect([...fromSql].sort()).toEqual([...RESERVED_USERNAMES].sort());
  });
});
