import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { z } from "zod";
import { zodValidator } from "../src/lib/validator";

describe("zodValidator", () => {
  describe("json validation", () => {
    test("validates JSON body successfully", async () => {
      const app = new Hono();
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      app.post("/test", zodValidator("json", schema), (c) => {
        return c.json({ success: true });
      });

      const res = await app.request("/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "John", age: 30 }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ success: true });
    });

    test("returns 400 for invalid JSON schema", async () => {
      const app = new Hono();
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      app.post("/test", zodValidator("json", schema), (c) => {
        return c.json({ success: true });
      });

      const res = await app.request("/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "John", age: "invalid" }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Validation failed");
      expect(Array.isArray(data.issues)).toBe(true);
      expect(data.issues.length).toBeGreaterThan(0);
    });

    test("returns 400 for malformed JSON", async () => {
      const app = new Hono();
      const schema = z.object({
        name: z.string(),
      });

      app.post("/test", zodValidator("json", schema), (c) => {
        return c.json({ success: true });
      });

      const res = await app.request("/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{invalid json}",
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid JSON");
      expect(data.message).toBe("Request body must be valid JSON");
    });

    test("formats validation error issues correctly", async () => {
      const app = new Hono();
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      app.post("/test", zodValidator("json", schema), (c) => {
        return c.json({ success: true });
      });

      const res = await app.request("/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "invalid", age: 10 }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.issues).toBeDefined();
      expect(data.issues.length).toBe(2);

      const emailIssue = data.issues.find((i: { path: string }) => i.path === "email");
      expect(emailIssue).toBeDefined();
      expect(emailIssue.message).toBeDefined();

      const ageIssue = data.issues.find((i: { path: string }) => i.path === "age");
      expect(ageIssue).toBeDefined();
      expect(ageIssue.message).toBeDefined();
    });
  });

  describe("query validation", () => {
    test("validates query parameters successfully", async () => {
      const app = new Hono();
      const schema = z.object({
        page: z.string(),
        limit: z.string(),
      });

      app.get("/test", zodValidator("query", schema), (c) => {
        return c.json({ success: true });
      });

      const res = await app.request("/test?page=1&limit=10");

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ success: true });
    });

    test("returns 400 for missing required query parameters", async () => {
      const app = new Hono();
      const schema = z.object({
        page: z.string(),
        limit: z.string(),
      });

      app.get("/test", zodValidator("query", schema), (c) => {
        return c.json({ success: true });
      });

      const res = await app.request("/test?page=1");

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Validation failed");
    });
  });

  describe("param validation", () => {
    test("validates URL parameters successfully", async () => {
      const app = new Hono();
      const schema = z.object({
        id: z.string().uuid(),
      });

      app.get("/test/:id", zodValidator("param", schema), (c) => {
        return c.json({ success: true });
      });

      const validUuid = "550e8400-e29b-41d4-a716-446655440000";
      const res = await app.request(`/test/${validUuid}`);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ success: true });
    });

    test("returns 400 for invalid URL parameter format", async () => {
      const app = new Hono();
      const schema = z.object({
        id: z.string().uuid(),
      });

      app.get("/test/:id", zodValidator("param", schema), (c) => {
        return c.json({ success: true });
      });

      const res = await app.request("/test/invalid-uuid");

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
    });
  });

  describe("form validation", () => {
    test("validates form data successfully", async () => {
      const app = new Hono();
      const schema = z.object({
        username: z.string(),
        password: z.string(),
      });

      app.post("/test", zodValidator("form", schema), (c) => {
        return c.json({ success: true });
      });

      const formData = new FormData();
      formData.append("username", "john");
      formData.append("password", "secret");

      const res = await app.request("/test", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ success: true });
    });

    test("returns 400 for missing form fields", async () => {
      const app = new Hono();
      const schema = z.object({
        username: z.string(),
        password: z.string(),
      });

      app.post("/test", zodValidator("form", schema), (c) => {
        return c.json({ success: true });
      });

      const formData = new FormData();
      formData.append("username", "john");

      const res = await app.request("/test", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
    });
  });

  describe("header validation", () => {
    test("validates headers successfully", async () => {
      const app = new Hono();
      const schema = z.object({
        authorization: z.string(),
      });

      app.get("/test", zodValidator("header", schema), (c) => {
        return c.json({ success: true });
      });

      const res = await app.request("/test", {
        headers: {
          authorization: "Bearer token123",
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ success: true });
    });

    test("returns 400 for missing required headers", async () => {
      const app = new Hono();
      const schema = z.object({
        authorization: z.string(),
      });

      app.get("/test", zodValidator("header", schema), (c) => {
        return c.json({ success: true });
      });

      const res = await app.request("/test");

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
    });
  });

  describe("edge cases", () => {
    test("handles empty JSON body", async () => {
      const app = new Hono();
      const schema = z.object({}).optional();

      app.post("/test", zodValidator("json", schema), (c) => {
        return c.json({ success: true });
      });

      const res = await app.request("/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });

      expect(res.status).toBe(200);
    });

    test("handles nested object validation", async () => {
      const app = new Hono();
      const schema = z.object({
        user: z.object({
          name: z.string(),
          address: z.object({
            city: z.string(),
          }),
        }),
      });

      app.post("/test", zodValidator("json", schema), (c) => {
        return c.json({ success: true });
      });

      const res = await app.request("/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            name: "John",
            address: {
              city: "NYC",
            },
          },
        }),
      });

      expect(res.status).toBe(200);
    });

    test("formats nested path in error messages", async () => {
      const app = new Hono();
      const schema = z.object({
        user: z.object({
          name: z.string(),
          address: z.object({
            city: z.string(),
          }),
        }),
      });

      app.post("/test", zodValidator("json", schema), (c) => {
        return c.json({ success: true });
      });

      const res = await app.request("/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            name: "John",
            address: {},
          },
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      const cityIssue = data.issues.find((i: { path: string }) => i.path.includes("city"));
      expect(cityIssue).toBeDefined();
      expect(cityIssue.path).toBe("user.address.city");
    });
  });
});
