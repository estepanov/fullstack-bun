import { describe, expect, test } from "bun:test";
import { decodeWsMessage } from "../src/lib/ws-message";

describe("decodeWsMessage", () => {
  test("returns string payloads unchanged", async () => {
    const result = await decodeWsMessage("hello");
    expect(result).toBe("hello");
  });

  test("decodes ArrayBuffer payloads", async () => {
    const data = new TextEncoder().encode("buffer").buffer;
    const result = await decodeWsMessage(data);
    expect(result).toBe("buffer");
  });

  test("decodes ArrayBufferView payloads", async () => {
    const data = new Uint8Array(new TextEncoder().encode("view"));
    const result = await decodeWsMessage(data);
    expect(result).toBe("view");
  });

  test("decodes Blob payloads", async () => {
    const data = new Blob(["blob"]);
    const result = await decodeWsMessage(data);
    expect(result).toBe("blob");
  });

  test("decodes SharedArrayBuffer payloads when available", async () => {
    if (typeof SharedArrayBuffer === "undefined") {
      return;
    }
    const encoded = new TextEncoder().encode("shared");
    const data = new SharedArrayBuffer(encoded.byteLength);
    new Uint8Array(data).set(encoded);
    const result = await decodeWsMessage(data);
    expect(result).toBe("shared");
  });

  test("decodes views with byte offsets", async () => {
    const encoded = new TextEncoder().encode("prefix-view-suffix");
    const view = new Uint8Array(encoded.buffer, 7, 4);
    const result = await decodeWsMessage(view);
    expect(result).toBe("view");
  });
});
