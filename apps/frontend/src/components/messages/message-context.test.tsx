import "../../../testing-library";
import { describe, expect, mock, test } from "bun:test";
import { render, screen } from "@frontend-test/rtl";
import userEvent from "@testing-library/user-event";
import { MessageScrollProvider, useMesageScrollContext } from "./message-context";

const MockContainer = () => {
  const context = useMesageScrollContext();
  return (
    <div>
      <ul data-testid="has-scroll-container" ref={context.scrollContainerRef}>
        <li data-testid="has-scroll-anchor" ref={context.scrollAnchorRef} />
      </ul>
    </div>
  );
};

describe("MessageScrollProvider", () => {
  test("provides scroll context to children", () => {
    const TestComponent = () => {
      const context = useMesageScrollContext();
      return (
        <div>
          <div data-testid="has-scroll-container">
            {Boolean(context.scrollContainerRef).toString()}
          </div>
          <div data-testid="has-scroll-anchor">
            {Boolean(context.scrollAnchorRef).toString()}
          </div>
          <div data-testid="has-scroll-to-bottom">
            {typeof context.scrollToBottom === "function" ? "true" : "false"}
          </div>
        </div>
      );
    };

    render(
      <MessageScrollProvider>
        <TestComponent />
      </MessageScrollProvider>,
    );

    expect(screen.getByTestId("has-scroll-container").textContent).toBe("true");
    expect(screen.getByTestId("has-scroll-anchor").textContent).toBe("true");
    expect(screen.getByTestId("has-scroll-to-bottom").textContent).toBe("true");
  });

  test("scrollToBottom calls scrollIntoView on the anchor element", async () => {
    const mockScrollIntoView = mock();

    // Create a test component that accesses the context
    const TestComponent = () => {
      const { scrollToBottom } = useMesageScrollContext();

      return (
        <button type="button" onClick={() => scrollToBottom()}>
          Scroll to bottom
        </button>
      );
    };

    // Mock the scrollIntoView implementation
    Element.prototype.scrollIntoView = mockScrollIntoView;

    const user = userEvent.setup();
    render(
      <MessageScrollProvider>
        <MockContainer />
        <TestComponent />
      </MessageScrollProvider>,
    );

    // Click the button to trigger scrollToBottom
    await user.click(screen.getByRole("button", { name: "Scroll to bottom" }));

    // Verify scrollIntoView was called with smooth behavior
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
  });

  test("scrollToBottom accepts smooth option", async () => {
    const mockScrollIntoView = mock();

    const TestComponent = () => {
      const { scrollToBottom } = useMesageScrollContext();

      return (
        <button type="button" onClick={() => scrollToBottom({ smooth: false })}>
          Scroll to bottom without smooth
        </button>
      );
    };

    Element.prototype.scrollIntoView = mockScrollIntoView;

    const user = userEvent.setup();
    render(
      <MessageScrollProvider>
        <MockContainer />
        <TestComponent />
      </MessageScrollProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Scroll to bottom without smooth" }),
    );

    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: "auto" });
  });

  test("context is accessible through useMessageScrollContext hook", () => {
    let contextValue: ReturnType<typeof useMesageScrollContext> | null = null;

    const TestConsumer = () => {
      contextValue = useMesageScrollContext();
      return null;
    };

    render(
      <MessageScrollProvider>
        <MockContainer />
        <TestConsumer />
      </MessageScrollProvider>,
    );

    expect(contextValue).toHaveProperty("scrollContainerRef");
    expect(contextValue).toHaveProperty("scrollAnchorRef");
    expect(contextValue).toHaveProperty("scrollToBottom");
  });
});
