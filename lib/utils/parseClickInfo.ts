import { geolocation } from "@vercel/functions";
import { UAParser } from "ua-parser-js";
import { isbot } from "isbot";
import crypto from "crypto";
import type { NextRequest } from "next/server";

export interface ClickInfo {
  ip_address: string | null;
  user_agent: string | null;
  referrer: string | null;
  referrer_domain: string | null;
  country: string;
  country_code: string | null;
  city: string;
  region: string | null;
  device_type: string;
  browser: string;
  browser_version: string | null;
  os: string;
  os_version: string | null;
  is_bot: boolean;
  visitor_hash: string;
}

export function parseClickInfo(request: NextRequest): ClickInfo {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0].trim() || request.headers.get("x-real-ip") || null;

  const userAgentString = request.headers.get("user-agent") || "";
  const parser = new UAParser(userAgentString);
  const uaResult = parser.getResult();

  const rawDeviceType = uaResult.device.type;
  const deviceType =
    rawDeviceType === "mobile" || rawDeviceType === "tablet" ? rawDeviceType : "desktop";

  const rawReferrer = request.headers.get("referer");
  let referrerDomain: string | null = null;
  if (rawReferrer) {
    try {
      referrerDomain = new URL(rawReferrer).hostname;
    } catch {
      referrerDomain = null;
    }
  }

  const geo = geolocation(request);
  const botDetected = isbot(userAgentString);

  const visitorHash = crypto
    .createHash("sha256")
    .update(`${ipAddress || "unknown"}-${userAgentString}`)
    .digest("hex");

  return {
    ip_address: ipAddress,
    user_agent: userAgentString || null,
    referrer: rawReferrer,
    referrer_domain: referrerDomain,
    country: geo.country || "Unknown",
    country_code: geo.country || null,
    city: geo.city || "Unknown",
    region: geo.countryRegion || null,
    device_type: deviceType,
    browser: uaResult.browser.name || "Unknown",
    browser_version: uaResult.browser.version || null,
    os: uaResult.os.name || "Unknown",
    os_version: uaResult.os.version || null,
    is_bot: botDetected,
    visitor_hash: visitorHash,
  };
}