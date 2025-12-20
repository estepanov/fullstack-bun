import { describe, expect, test } from "bun:test";
import type { FESession } from "@/lib/auth-client";
import { postExample } from "@test/factory/post-example";
import { server } from "@test/msw";
import { render, screen } from "@test/rtl";
import { waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { MESSAGE_CONFIG } from "shared";
import { MessageForm } from "./message-form";

describe("MessageForm", () => {
  const session = { user: { emailVerified: true } } as FESession;
  const baseProps = {
    sendMessage: () => {},
    isAuthenticated: true,
    session,
    connectionStatus: "connected" as const,
  };

  test("Includes a textarea", () => {
    render(<MessageForm {...baseProps} />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeInTheDocument();
  });

  test("Includes a submit button", () => {
    render(<MessageForm {...baseProps} />);
    const submitButton = screen.getByRole("button", { name: "Send" });
    expect(submitButton).toBeInTheDocument();
  });

  test("shows error on form submission when the message is empty", async () => {
    const user = userEvent.setup();
    render(<MessageForm {...baseProps} />);
    const submitButton = screen.getByRole("button", { name: "Send" });
    await waitFor(() => expect(submitButton).toBeEnabled());
    await user.click(submitButton);
    await screen.findByText("Message cannot be empty");
  });

  test("shows error on form submission when the message is too long", async () => {
    const user = userEvent.setup();
    render(<MessageForm {...baseProps} />);
    await user.type(
      screen.getByRole("textbox"),
      "a".repeat(MESSAGE_CONFIG.MAX_LENGTH + 1),
    );
    const submitButton = screen.getByRole("button", { name: "Send" });
    await user.click(submitButton);
    await screen.findByText(
      `Message cannot exceed ${MESSAGE_CONFIG.MAX_LENGTH} characters`,
    );
  });

  test("submits the form when the message is valid", async () => {
    const NEW_MESSAGE = {
      id: "1",
      message: "hello+world+1234567890",
      postedAt: new Date().toISOString(),
    };
    const user = userEvent.setup();
    server.use(postExample());
    let sentMessage: string | null = null;
    render(
      <MessageForm
        {...baseProps}
        sendMessage={(message) => {
          sentMessage = message;
        }}
      />,
    );
    const textbox = screen.getByRole("textbox");
    await user.type(textbox, NEW_MESSAGE.message);
    expect(textbox).toHaveValue(NEW_MESSAGE.message);
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(sentMessage).toBe(NEW_MESSAGE.message as never);
    expect(textbox).toHaveValue("");
  });

  test("normalizes multi-line input for non-admins", async () => {
    const user = userEvent.setup();
    render(<MessageForm {...baseProps} isAdmin={false} />);
    const textbox = screen.getByRole("textbox");
    await user.paste(textbox, "hello\nworld");
    expect(textbox).toHaveValue("hello world");
  });
});
