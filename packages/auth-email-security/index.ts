type HeaderValue = string | string[] | undefined;

type HeaderBag = Headers | Record<string, HeaderValue>;

type SecurityFooterInput = {
  ip: string;
  location?: string | null;
  timestampUtc: string;
};

export type EmailSecurityFooter = {
  text: string;
  html: string;
};

const HEADER_PRECEDENCE = [
  "cf-connecting-ip",
  "x-forwarded-for",
  "x-real-ip",
  "true-client-ip",
  "x-client-ip",
  "forwarded",
];

const resolveHeaders = (ctxOrRequest: unknown): HeaderBag | null => {
  if (!ctxOrRequest || typeof ctxOrRequest !== "object") {
    return null;
  }

  if (isHeaders(ctxOrRequest)) {
    return ctxOrRequest;
  }

  const maybe = ctxOrRequest as {
    headers?: HeaderBag;
    request?: { headers?: HeaderBag };
    req?: { headers?: HeaderBag };
    raw?: { headers?: HeaderBag };
  };

  return (
    maybe.headers ??
    maybe.request?.headers ??
    maybe.req?.headers ??
    maybe.raw?.headers ??
    null
  );
};

const isHeaders = (value: unknown): value is Headers => {
  return typeof Headers !== "undefined" && value instanceof Headers;
};

const getHeaderValue = (headers: HeaderBag, name: string): string | null => {
  const key = name.toLowerCase();

  if (isHeaders(headers)) {
    return headers.get(key) ?? headers.get(name) ?? null;
  }

  const record = headers as Record<string, HeaderValue>;
  const direct = record[key] ?? record[name];
  if (typeof direct === "string") {
    return direct;
  }
  if (Array.isArray(direct)) {
    return direct.join(",");
  }

  for (const [entryKey, entryValue] of Object.entries(record)) {
    if (entryKey.toLowerCase() !== key) {
      continue;
    }
    if (typeof entryValue === "string") {
      return entryValue;
    }
    if (Array.isArray(entryValue)) {
      return entryValue.join(",");
    }
  }

  return null;
};

const stripQuotes = (value: string) => {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
};

const normalizeIp = (value: string): string | null => {
  const trimmed = stripQuotes(value.trim());
  if (!trimmed) {
    return null;
  }

  const bracketMatch = trimmed.match(/^\[(.+)\](?::\d+)?$/);
  if (bracketMatch) {
    return bracketMatch[1];
  }

  if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(trimmed)) {
    return trimmed.slice(0, trimmed.lastIndexOf(":"));
  }

  return trimmed;
};

const isPublicIpv4 = (ip: string): boolean => {
  const parts = ip.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) {
    return false;
  }
  if (a === 192 && b === 168) {
    return false;
  }
  if (a === 172 && b >= 16 && b <= 31) {
    return false;
  }
  if (a === 169 && b === 254) {
    return false;
  }
  if (a >= 224) {
    return false;
  }

  return true;
};

const isPublicIpv6 = (ip: string): boolean => {
  const normalized = ip.toLowerCase();
  if (normalized === "::1" || normalized === "::") {
    return false;
  }
  if (normalized.startsWith("fe80") || normalized.startsWith("fe9")) {
    return false;
  }
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) {
    return false;
  }
  return true;
};

const isPublicIp = (ip: string): boolean => {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
    return isPublicIpv4(ip);
  }

  if (ip.includes(":")) {
    return isPublicIpv6(ip);
  }

  return false;
};

const findFirstPublicIp = (entries: string[]): string | null => {
  for (const entry of entries) {
    const normalized = normalizeIp(entry);
    if (!normalized) {
      continue;
    }
    if (isPublicIp(normalized)) {
      return normalized;
    }
  }

  return null;
};

const parseForwardedFor = (value: string): string | null => {
  const entries = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return findFirstPublicIp(entries);
};

const parseForwardedHeader = (value: string): string | null => {
  const entries = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  for (const entry of entries) {
    const match = entry.match(/for=\s*\"?([^;\",\s]+)\"?/i);
    if (!match?.[1]) {
      continue;
    }
    const normalized = normalizeIp(match[1]);
    if (!normalized) {
      continue;
    }
    if (isPublicIp(normalized)) {
      return normalized;
    }
  }

  return null;
};

export const getRequestIp = (ctxOrRequest: unknown): string | null => {
  const headers = resolveHeaders(ctxOrRequest);
  if (!headers) {
    return null;
  }

  for (const header of HEADER_PRECEDENCE) {
    const value = getHeaderValue(headers, header);
    if (!value) {
      continue;
    }

    if (header === "x-forwarded-for") {
      const forwardedIp = parseForwardedFor(value);
      if (forwardedIp) {
        return forwardedIp;
      }
      continue;
    }

    if (header === "forwarded") {
      const forwardedIp = parseForwardedHeader(value);
      if (forwardedIp) {
        return forwardedIp;
      }
      continue;
    }

    const normalized = normalizeIp(value);
    if (normalized) {
      return normalized;
    }
  }

  return null;
};

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const getCloudflareLocation = (ctxOrRequest: unknown): string | null => {
  const headers = resolveHeaders(ctxOrRequest);
  if (!headers) {
    return null;
  }

  const city = getHeaderValue(headers, "cf-ipcity");
  const region =
    getHeaderValue(headers, "cf-region") ??
    getHeaderValue(headers, "cf-region-code");
  const country =
    getHeaderValue(headers, "cf-country") ??
    getHeaderValue(headers, "cf-ipcountry");

  const parts = [city, region, country]
    .map((part) => (part ? safeDecode(part.trim()) : null))
    .filter((part): part is string => Boolean(part));

  return parts.length ? parts.join(", ") : null;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const formatEmailSecurityFooter = ({
  ip,
  location,
  timestampUtc,
}: SecurityFooterInput): EmailSecurityFooter => {
  const lines = [
    "Security information",
    `Request IP: ${ip}`,
    location ? `Location: ${location}` : null,
    `Time (UTC): ${timestampUtc}`,
  ].filter((line): line is string => Boolean(line));

  const text = lines.join("\n");
  const html = lines
    .map((line) => `<p style="margin: 0 0 6px;">${escapeHtml(line)}</p>`)
    .join("");

  return { text, html };
};
