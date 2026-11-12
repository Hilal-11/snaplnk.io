import { describe, expect, it } from "vitest";
import { exportFileName, isEmail, isStrongEnough, passwordChecks, toCsv } from "./account";
import { DEFAULT_PREFS, displayNameOf, expiryFromPrefs, initialsOf, readUserPrefs } from "./prefs";

describe("passwords", () => {
  it.each([
    ["short1", false],
    ["longpassword", false],
    ["12345678", false],
    ["password1", true],
    ["correct horse!", true],
    ["x".repeat(70) + "1a", true],
    ["x".repeat(72) + "1", false],
  ])("%j strong=%s", (pw, ok) => {
    expect(isStrongEnough(pw)).toBe(ok);
  });

  it("reports each rule", () => {
    expect(passwordChecks("abc").map((c) => c.ok)).toEqual([false, true, false]);
  });
});

describe("isEmail", () => {
  it.each(["a@b.co", " me@example.com "])("accepts %j", (e) => expect(isEmail(e)).toBe(true));
  it.each(["", "a@b", "a b@c.com", "<x>@y.com"])("rejects %j", (e) => expect(isEmail(e)).toBe(false));
});

describe("toCsv", () => {
  it("quotes, escapes, joins arrays and blocks formula injection", () => {
    const csv = toCsv(
      [
        { title: 'He said "hi", ok', tags: ["a", "b"], url: "=HYPERLINK(\"x\")", n: 3, empty: null },
        { title: "line\nbreak", tags: [], url: "https://x.com", n: 0, empty: undefined },
      ],
      ["title", "tags", "url", "n", "empty"]
    );
    expect(csv.split("\r\n")[0]).toBe("title,tags,url,n,empty");
    expect(csv).toContain('"He said ""hi"", ok",a; b,"\'=HYPERLINK(""x"")",3,');
    expect(csv).toContain('"line\nbreak",,https://x.com,0,');
  });

  it("names export files by date", () => {
    expect(exportFileName("links", "csv", new Date("2026-11-13T10:00:00Z"))).toBe("snaplnk-links-2026-11-13.csv");
  });
});

describe("prefs", () => {
  it("reads valid prefs and ignores junk", () => {
    expect(readUserPrefs({ prefs: { defaultExpiryDays: 30, autoCopy: true } })).toEqual({ defaultExpiryDays: 30, autoCopy: true });
    expect(readUserPrefs({ prefs: { defaultExpiryDays: 12, autoCopy: "yes" } })).toEqual(DEFAULT_PREFS);
    expect(readUserPrefs(null)).toEqual(DEFAULT_PREFS);
    expect(readUserPrefs({ prefs: "nope" })).toEqual(DEFAULT_PREFS);
  });

  it("computes default expiry at the end of the day", () => {
    const now = new Date(2026, 10, 13, 9, 0, 0);
    const iso = expiryFromPrefs({ defaultExpiryDays: 7, autoCopy: false }, now)!;
    const d = new Date(iso);
    expect(d.getDate()).toBe(20);
    expect(d.getHours()).toBe(23);
    expect(expiryFromPrefs(DEFAULT_PREFS, now)).toBeUndefined();
  });

  it("derives display names and initials", () => {
    expect(displayNameOf({ email: "hilal@x.io", user_metadata: { name: "  Hilal Ahmad " } })).toBe("Hilal Ahmad");
    expect(displayNameOf({ email: "hilal@x.io", user_metadata: { full_name: "From Google" } })).toBe("From Google");
    expect(displayNameOf({ email: "hilal@x.io", user_metadata: {} })).toBe("hilal");
    expect(initialsOf("Hilal Ahmad")).toBe("HA");
  });
});
