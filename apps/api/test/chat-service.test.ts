import { describe, expect, test } from "bun:test";
import { redisStore } from "./mocks/redis";
import { ensureTestEnv } from "./mocks/env";

ensureTestEnv();

describe("ChatService", () => {
  test("adds messages and returns oldest-first history", async () => {
    redisStore.clear();
    const { chatService } = await import("../src/lib/chat-service");

    const first = await chatService.addMessage({
      userId: "user-1",
      userName: "Alex",
      userAvatar: null,
      message: "  first message  ",
    });
    const second = await chatService.addMessage({
      userId: "user-2",
      userName: "Taylor",
      userAvatar: null,
      message: "second message",
    });

    expect(first.message).toBe("first message");
    expect(second.message).toBe("second message");

    const history = await chatService.getMessageHistory(2);
    expect(history.length).toBe(2);
    const ids = history.map((entry) => entry.id).sort();
    expect(ids).toEqual([first.id, second.id].sort());
    expect(history[0].timestamp).toBeLessThanOrEqual(history[1].timestamp);
  });

  test("updates and deletes messages", async () => {
    redisStore.clear();
    const { chatService } = await import("../src/lib/chat-service");

    const message = await chatService.addMessage({
      userId: "user-1",
      userName: "Alex",
      userAvatar: null,
      message: "original",
    });

    const updated = await chatService.updateMessage(message.id, "updated");
    expect(updated).toBeDefined();
    expect(updated?.message).toBe("updated");
    expect(updated?.editedAt).toBeDefined();

    const deleted = await chatService.deleteMessage(message.id);
    expect(deleted?.id).toBe(message.id);

    const history = await chatService.getMessageHistory(10);
    expect(history.length).toBe(0);
  });

  test("deletes all messages for a user", async () => {
    redisStore.clear();
    const { chatService } = await import("../src/lib/chat-service");

    await chatService.addMessage({
      userId: "user-1",
      userName: "Alex",
      userAvatar: null,
      message: "one",
    });
    await chatService.addMessage({
      userId: "user-2",
      userName: "Taylor",
      userAvatar: null,
      message: "two",
    });
    await chatService.addMessage({
      userId: "user-1",
      userName: "Alex",
      userAvatar: null,
      message: "three",
    });

    const deletedCount = await chatService.deleteMessagesByUserId("user-1");
    expect(deletedCount).toBe(2);

    const history = await chatService.getMessageHistory(10);
    expect(history.length).toBe(1);
    expect(history[0].userId).toBe("user-2");
  });

  test("clears all messages", async () => {
    redisStore.clear();
    const { chatService } = await import("../src/lib/chat-service");

    await chatService.addMessage({
      userId: "user-1",
      userName: "Alex",
      userAvatar: null,
      message: "one",
    });

    await chatService.clearMessages();
    const history = await chatService.getMessageHistory(10);
    expect(history.length).toBe(0);
  });
});
