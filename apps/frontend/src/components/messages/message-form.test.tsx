import { describe, expect, test } from "bun:test";
import type { FESession } from "@/lib/auth-client";
import { postExample } from "@test/factory/post-example";
import { server } from "@test/msw";
import { render, screen } from "@test/rtl";
import { waitFor } from "@testing-library/dom";
import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MESSAGE_CONFIG } from "shared";
import { MessageForm } from "./message-form";

describe("MessageForm", () => {
  const session = { user: { emailVerified: true } } as FESession;
  const baseProps = {
    sendMessage: () => true,
    isAuthenticated: true,
    session,
    connectionStatus: "connected" as const,
    throttle: null,
  };

  test("Includes a textarea", async () => {
    render(<MessageForm {...baseProps} />);
    const textarea = await screen.findByRole("textbox");
    expect(textarea).toBeInTheDocument();
  });

  test("Includes a submit button", async () => {
    render(<MessageForm {...baseProps} />);
    const submitButton = await screen.findByRole("button", { name: "Send" });
    expect(submitButton).toBeInTheDocument();
  });

  test("shows error on form submission when the message is empty", async () => {
    const user = userEvent.setup();
    render(<MessageForm {...baseProps} />);
    const textbox = await screen.findByRole("textbox");
    await user.click(textbox);
    await user.keyboard("{Enter}");
    await screen.findByText("Message cannot be empty");
  });

  test("shows error on form submission when the message is too long", async () => {
    render(<MessageForm {...baseProps} />);
    const textbox = await screen.findByRole("textbox");
    const longMessage = "a".repeat(MESSAGE_CONFIG.MAX_LENGTH + 1);
    fireEvent.change(textbox, {
      target: { value: longMessage },
    });
    await waitFor(() => expect(textbox).toHaveValue(longMessage));
    const form = textbox.closest("form");
    if (!form) {
      throw new Error("Expected textarea to be inside a form.");
    }
    fireEvent.submit(form);
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
          return true;
        }}
      />,
    );
    const textbox = await screen.findByRole("textbox");
    await user.type(textbox, NEW_MESSAGE.message);
    expect(textbox).toHaveValue(NEW_MESSAGE.message);
    await user.click(await screen.findByRole("button", { name: "Send" }));
    expect(sentMessage).toBe(NEW_MESSAGE.message as never);
    expect(textbox).toHaveValue("");
  });

  test("normalizes multi-line input for non-admins", async () => {
    render(<MessageForm {...baseProps} isAdmin={false} />);
    const textbox = await screen.findByRole("textbox");
    fireEvent.change(textbox, { target: { value: "hello\nworld" } });
    await waitFor(() => expect(textbox).toHaveValue("hello world"));
  });

  test("disables sending and shows throttle notice when throttled", async () => {
    render(
      <MessageForm
        {...baseProps}
        throttle={{ remainingMs: 4500, limit: 5, windowMs: 10000 }}
      />,
    );
    const submitButton = await screen.findByRole("button", { name: "Send" });
    expect(submitButton).toBeDisabled();
    await screen.findByText("You're sending messages too fast. Try again in 5s.");
  });

  test("restores the last message when throttled", async () => {
    render(
      <MessageForm
        {...baseProps}
        throttle={{
          remainingMs: 3000,
          limit: 4,
          windowMs: 15000,
          restoreMessage: "Keep this message",
        }}
      />,
    );
    const textbox = await screen.findByRole("textbox");
    await waitFor(() => expect(textbox).toHaveValue("Keep this message"));
  });
});
