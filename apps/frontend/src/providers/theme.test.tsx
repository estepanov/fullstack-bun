import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { waitFor } from "@testing-library/dom";
import { render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "./theme";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

const matchMediaMock = (matches: boolean) => {
  return {
    matches,
  };
};

const TestComponent = () => {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button type="button" onClick={() => setTheme("dark")}>
        Set Dark
      </button>
      <button type="button" onClick={() => setTheme("light")}>
        Set Light
      </button>
      <button type="button" onClick={() => setTheme("system")}>
        Set System
      </button>
    </div>
  );
};

describe("ThemeProvider", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      configurable: true,
    });
    Object.defineProperty(window, "matchMedia", {
      value: () => matchMediaMock(false),
      configurable: true,
    });
    document.documentElement.className = "";
    localStorageMock.clear();
  });

  afterEach(() => {
    document.documentElement.classList.remove("light", "dark");
  });

  test("renders children", () => {
    render(
      <ThemeProvider>
        <div>Test Child</div>
      </ThemeProvider>,
    );
    expect(screen.getByText("Test Child")).toBeInTheDocument();
  });

  test("uses default theme when no theme is stored", async () => {
    render(
      <ThemeProvider defaultTheme="light">
        <TestComponent />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("current-theme")).toHaveTextContent("light");
    await waitFor(() =>
      expect(document.documentElement.classList.contains("light")).toBe(true),
    );
  });

  test("uses stored theme from localStorage", () => {
    localStorageMock.setItem("ui-theme", "dark");
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  test("changes theme when setTheme is called", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("current-theme")).toHaveTextContent("system");

    await user.click(screen.getByText("Set Dark"));
    expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorageMock.getItem("ui-theme")).toBe("dark");

    await user.click(screen.getByText("Set Light"));
    expect(screen.getByTestId("current-theme")).toHaveTextContent("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(localStorageMock.getItem("ui-theme")).toBe("light");
  });

  test("uses system theme when theme is set to system", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "matchMedia", {
      value: () => matchMediaMock(true),
    });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("current-theme")).toHaveTextContent("system");

    await user.click(screen.getByText("Set System"));

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorageMock.getItem("ui-theme")).toBe("system");
  });
});

describe("useTheme", () => {
  test("gets the theme from the context", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("system");
  });
});
