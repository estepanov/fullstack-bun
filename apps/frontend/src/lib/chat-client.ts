import { createChatClientInstance } from "frontend-common/chat";

export const chatClient = createChatClientInstance({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
});

export type ChatClient = typeof chatClient;
