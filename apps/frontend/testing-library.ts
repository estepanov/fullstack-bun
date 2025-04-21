import { afterEach, expect } from "bun:test";
import { beforeAll } from "bun:test";
import { afterAll } from "bun:test";
import { server } from "@test/msw";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";

expect.extend(matchers);

beforeAll(() => {
  server.listen();
});

afterAll(() => {
  server.close();
});

afterEach(() => {
  cleanup();
});
