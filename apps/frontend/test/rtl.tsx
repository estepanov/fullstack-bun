import type { RenderOptions } from "@testing-library/react";
import { render as rtlRender, renderHook, screen } from "@testing-library/react";
import { RootAppProvider } from "../src/providers/RootAppProvider";

const render = (ui: React.ReactNode, options?: RenderOptions) => {
  return rtlRender(ui, { wrapper: RootAppProvider, ...options });
};

export { render, screen, renderHook };
