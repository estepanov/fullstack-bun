import { describe, expect, it } from "bun:test";
import {
  formatEmailSecurityFooter,
  getCloudflareLocation,
  getRequestIp,
} from "../index";

describe("getRequestIp", () => {
  it("prefers cf-connecting-ip", () => {
    const headers = {
      "cf-connecting-ip": "203.0.113.1",
      "x-forwarded-for": "203.0.113.2",
    };

    expect(getRequestIp({ headers })).toBe("203.0.113.1");
  });

  it("uses first public x-forwarded-for entry", () => {
    const headers = {
      "x-forwarded-for": "10.0.0.1, 203.0.113.10, 192.168.0.2",
    };

    expect(getRequestIp({ headers })).toBe("203.0.113.10");
  });

  it("parses forwarded header", () => {
    const headers = {
      forwarded: "for=203.0.113.43;proto=https;by=203.0.113.44",
    };

    expect(getRequestIp({ headers })).toBe("203.0.113.43");
  });
});

describe("getCloudflareLocation", () => {
  it("formats city, region, and country", () => {
    const headers = {
      "cf-ipcity": "Paris",
      "cf-region": "IDF",
      "cf-country": "FR",
    };

    expect(getCloudflareLocation({ headers })).toBe("Paris, IDF, FR");
  });

  it("returns null when no location headers exist", () => {
    expect(getCloudflareLocation({ headers: {} })).toBeNull();
  });
});

describe("formatEmailSecurityFooter", () => {
  it("includes location when provided", () => {
    const footer = formatEmailSecurityFooter({
      ip: "203.0.113.10",
      location: "Paris, IDF, FR",
      timestampUtc: "2024-01-01T00:00:00.000Z",
    });

    expect(footer.text).toContain("Location: Paris, IDF, FR");
    expect(footer.html).toContain("Location: Paris, IDF, FR");
  });
});
