import type { RenderOptions } from "@testing-library/react";
import { renderHook, render as rtlRender, screen } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router";
import { RootAppProvider } from "../src/providers/RootAppProvider";

const render = (ui: React.ReactNode, options?: RenderOptions) => {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <RootAppProvider>{ui}</RootAppProvider>,
      },
    ],
    { initialEntries: ["/"] },
  );

  return rtlRender(<RouterProvider router={router} />, options);
};

export { render, screen, renderHook };
