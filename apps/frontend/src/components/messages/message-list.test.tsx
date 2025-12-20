import { describe, expect, test } from "bun:test";
import { render, screen } from "@test/rtl";
import userEvent from "@testing-library/user-event";
import { CHAT_CONFIG } from "shared";
import type { ChatMessage } from "shared/interfaces/chat";
import { MessageList } from "./message-list";

const createMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: "message-1",
  userId: "user-1",
  userName: "Alex",
  userAvatar: null,
  message: "Hello world",
  timestamp: 1_720_000_000_000,
  createdAt: new Date("2024-06-01T10:00:00.000Z").toISOString(),
  ...overrides,
});

describe("MessageList", () => {
  test("renders returned messages", () => {
    const message = createMessage();
    render(
      <MessageList
        messages={[message]}
        currentUserId="user-2"
        isAdmin={false}
        disableVirtualization
      />,
    );
    expect(screen.getByText(message.message)).toBeInTheDocument();
    expect(screen.getByText(message.userName)).toBeInTheDocument();
  });

  test("shows delete actions for admins", async () => {
    const user = userEvent.setup();
    const message = createMessage();
    render(
      <MessageList
        messages={[message]}
        currentUserId="user-2"
        isAdmin
        disableVirtualization
      />,
    );
    const menuButton = await screen.findByLabelText("Message actions");
    await user.click(menuButton);
    expect(await screen.findByText("Delete message")).toBeInTheDocument();
  });

  test("renders emoji-only messages at larger size", () => {
    const emojiMessage = createMessage({
      message: "😀😀😀",
    });
    render(
      <MessageList
        messages={[emojiMessage]}
        currentUserId="user-2"
        isAdmin={false}
        disableVirtualization
      />,
    );
    expect(screen.getByText(emojiMessage.message)).toHaveClass("text-3xl");
  });

  test("renders non-emoji or over-limit messages at normal size", () => {
    const overLimit = createMessage({
      message: "😀".repeat(CHAT_CONFIG.EMOJI_ONLY_MAX + 1),
    });
    const mixed = createMessage({
      id: "message-2",
      message: "hi 😀",
    });
    render(
      <MessageList
        messages={[overLimit, mixed]}
        currentUserId="user-2"
        isAdmin={false}
        disableVirtualization
      />,
    );
    const overLimitBubble = screen
      .getByText(overLimit.message)
      .closest("[data-message-bubble]");
    const mixedBubble = screen.getByText(mixed.message).closest("[data-message-bubble]");
    expect(overLimitBubble).toHaveClass("text-sm");
    expect(mixedBubble).toHaveClass("text-sm");
  });
});
