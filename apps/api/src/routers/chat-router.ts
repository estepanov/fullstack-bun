import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";
import type { WSContext } from "hono/ws";
import {
  ChatWSMessageType,
  type SendMessagePayload,
  sendMessageSchema,
} from "shared/interfaces/chat";
import { isAdmin, type UserRole } from "shared/auth/user-role";
import { db } from "../db/client";
import { user as userTable } from "../db/schema";
import { auth } from "../lib/auth";
import { chatManager } from "../lib/chat-manager";
import { chatService } from "../lib/chat-service";
import { type AuthMiddlewareEnv, authMiddleware } from "../middlewares/auth";
import type { LoggerMiddlewareEnv } from "../middlewares/logger";
import { requireAdmin } from "../middlewares/require-admin";

export const chatRouter = new Hono<LoggerMiddlewareEnv & AuthMiddlewareEnv>()
  // WebSocket endpoint
  .get(
    "/ws",
    upgradeWebSocket((c) => {
      const trace = () => ({
        requestId: c.get("requestId"),
        sessionId: c.get("sessionId"),
      });
      let userId: string | null = null;
      let userName: string | null = null;
      let userAvatar: string | null = null;
      let isVerified = false;
      let isAdminUser = false;

      return {
        async onOpen(evt, ws: WSContext) {
          const logger = c.get("logger");

          // Authenticate via session cookie in upgrade request
          try {
            const session = await auth.api.getSession({
              headers: c.req.raw.headers,
            });

            if (session) {
              userId = session.user.id;
              userName = session.user.name;
              userAvatar = session.user.image ?? null;
              isVerified = session.user.emailVerified;
              const role = session.user.role as UserRole | undefined;
              isAdminUser = role ? isAdmin(role) : false;

              logger.info(`WebSocket opened: userId=${userId}, verified=${isVerified}`);
            } else {
              logger.info("WebSocket opened: unauthenticated user");
            }
          } catch (error) {
            logger.error("WebSocket auth error:", error);
          }

          // Add to connection manager
          chatManager.addClient({ ws, userId, userName });

          // Send connection confirmation
          ws.send(
            JSON.stringify({
              type: ChatWSMessageType.CONNECTED,
              userId,
              trace: trace(),
            }),
          );

          // Send message history
          try {
            const history = await chatService.getMessageHistory(100);
            ws.send(
              JSON.stringify({
                type: ChatWSMessageType.MESSAGE_HISTORY,
                data: history,
                trace: trace(),
              }),
            );
          } catch (error) {
            logger.error("Failed to load message history:", error);
          }
        },

        async onMessage(evt, ws: WSContext) {
          const logger = c.get("logger");

          try {
            const rawMessage =
              typeof evt.data === "string"
                ? evt.data
                : new TextDecoder().decode(evt.data);
            // Parse incoming message
            const data = JSON.parse(rawMessage);
            const parsed = sendMessageSchema.safeParse(data);

            if (!parsed.success) {
              ws.send(
                JSON.stringify({
                  type: ChatWSMessageType.ERROR,
                  error: "Invalid message format",
                  trace: trace(),
                }),
              );
              return;
            }

            // Check authentication
            if (!userId) {
              ws.send(
                JSON.stringify({
                  type: ChatWSMessageType.ERROR,
                  error: "You must be logged in to send messages",
                  trace: trace(),
                }),
              );
              return;
            }

            // Check email verification
            if (!isVerified) {
              ws.send(
                JSON.stringify({
                  type: ChatWSMessageType.ERROR,
                  error: "Please verify your email before sending messages",
                  trace: trace(),
                }),
              );
              return;
            }

            if (!isAdminUser && /[\r\n]/.test(parsed.data.message)) {
              ws.send(
                JSON.stringify({
                  type: ChatWSMessageType.ERROR,
                  error: "Messages must be a single line",
                  trace: trace(),
                }),
              );
              return;
            }

            // Fetch fresh user data (in case name/avatar changed)
            const userData = await db
              .select({
                name: userTable.name,
                image: userTable.image,
              })
              .from(userTable)
              .where(eq(userTable.id, userId))
              .limit(1)
              .then((rows) => rows[0]);

            if (!userData) {
              ws.send(
                JSON.stringify({
                  type: ChatWSMessageType.ERROR,
                  error: "User not found",
                  trace: trace(),
                }),
              );
              return;
            }

            // Store message in Redis
            const chatMessage = await chatService.addMessage({
              userId,
              userName: userData.name,
              userAvatar: userData.image,
              message: parsed.data.message,
            });

            // Broadcast to all connected clients
            chatManager.broadcast(chatMessage);

            logger.info(`Message sent: userId=${userId}, messageId=${chatMessage.id}`);
          } catch (error) {
            logger.error({ err: error }, "WebSocket message error");
            ws.send(
              JSON.stringify({
                type: ChatWSMessageType.ERROR,
                error: "Failed to send message",
                trace: trace(),
              }),
            );
          }
        },

        onClose(evt, ws: WSContext) {
          const logger = c.get("logger");
          logger.info(`WebSocket closed: userId=${userId}`);
          chatManager.removeClient({ ws, userId, userName });
        },

        onError(evt, ws: WSContext) {
          const logger = c.get("logger");
          logger.error("WebSocket error:", evt);
        },
      };
    }),
  )

  // REST endpoint for initial message load (optional fallback)
  .get("/history", async (c) => {
    try {
      const limit = Number(c.req.query("limit")) || 100;
      const messages = await chatService.getMessageHistory(limit);
      return c.json({ messages });
    } catch (error) {
      c.get("logger").error("Failed to fetch chat history:", error);
      return c.json({ error: "Failed to fetch chat history" }, 500);
    }
  })

  // Admin endpoint to delete a message
  .delete("/messages/:id", authMiddleware(), requireAdmin(), async (c) => {
    const messageId = c.req.param("id");
    const logger = c.get("logger");

    try {
      const deleted = await chatService.deleteMessage(messageId);

      if (deleted) {
        // Broadcast deletion to all connected clients
        chatManager.broadcastDeletion(messageId);

        logger.info(`Message deleted by admin: messageId=${messageId}`);
        return c.json({ success: true, messageId });
      }

      return c.json({ success: false, error: "Message not found" }, 404);
    } catch (error) {
      logger.error("Failed to delete message:", error);
      return c.json({ success: false, error: "Failed to delete message" }, 500);
    }
  });
