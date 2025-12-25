import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";
import type { WSContext } from "hono/ws";
import { type UserRole, isAdmin } from "shared/auth/user-role";
import {
  ChatWSMessageType,
  getSendMessageSchema,
  getUpdateMessageSchema,
} from "shared/interfaces/chat";
import { db } from "../db/client";
import { user as userTable } from "../db/schema";
import { auth } from "../lib/auth";
import { checkUserBan } from "../lib/ban-check";
import { chatManager } from "../lib/chat-manager";
import { chatService } from "../lib/chat-service";
import { checkChatThrottle } from "../lib/chat-throttle";
import { decodeWsMessage } from "../lib/ws-message";
import { getMissingFields } from "../config/required-fields";
import { type AuthMiddlewareEnv, authMiddleware } from "../middlewares/auth";
import { checkProfileComplete } from "../middlewares/check-profile-complete";
import type { LoggerMiddlewareEnv } from "../middlewares/logger";

export const chatRouter = new Hono<LoggerMiddlewareEnv & AuthMiddlewareEnv>()
  // WebSocket endpoint
  .get(
    "/ws",
    upgradeWebSocket((c) => {
      const trace = () => ({
        requestId: c.get("requestId"),
        sessionId: c.get("sessionId"),
      });
      const roomId = c.req.query("room") ?? "global";
      const guestId = c.req.query("guestId");
      let userId: string | null = null;
      let userName: string | null = null;
      let role: "guest" | "member" | "admin" = "guest";
      const fallbackGuestId = `ws-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      let presenceId = `guest:${guestId ?? fallbackGuestId}`;
      let isVerified = false;
      let isAdminUser = false;
      let hasIncompleteProfile = false;

      return {
        async onOpen(_evt, ws: WSContext) {
          const logger = c.get("logger");

          // Authenticate via session cookie in upgrade request
          try {
            const session = await auth.api.getSession({
              headers: c.req.raw.headers,
            });

            if (session) {
              // Fetch full user data
              const userData = await db
                .select({
                  id: userTable.id,
                  name: userTable.name,
                  image: userTable.image,
                  emailVerified: userTable.emailVerified,
                  role: userTable.role,
                })
                .from(userTable)
                .where(eq(userTable.id, session.user.id))
                .limit(1)
                .then((rows) => rows[0]);

              if (!userData) {
                ws.close(1011, "User not found");
                logger.error(`User not found: userId=${session.user.id}`);
                return;
              }

              // Check if user is banned
              const banStatus = await checkUserBan(userData.id);
              if (banStatus.banned) {
                const banMessage = banStatus.reason
                  ? `Your account has been banned. Reason: ${banStatus.reason}`
                  : "Your account has been banned";

                ws.send(
                  JSON.stringify({
                    type: ChatWSMessageType.ERROR,
                    error: banMessage,
                    trace: trace(),
                  }),
                );
                ws.close(1008, "User is banned");
                logger.info(
                  `Banned user attempted WebSocket connection: userId=${userData.id}`,
                );
                return;
              }

              // Check if profile is complete
              const missingFields = getMissingFields(session.user);
              if (missingFields.length > 0) {
                hasIncompleteProfile = true;
                logger.info(
                  `User with incomplete profile connected: userId=${userData.id}, missing=${missingFields.join(", ")}`,
                );
              }

              userId = userData.id;
              userName = userData.name || "User";
              isVerified = userData.emailVerified;
              const userRole = userData.role as UserRole | undefined;
              isAdminUser = userRole ? isAdmin(userRole) : false;
              role = isAdminUser ? "admin" : "member";
              presenceId = userId;
              logger.info(`WebSocket opened: userId=${userId}, verified=${isVerified}, incompleteProfile=${hasIncompleteProfile}`);
            } else {
              logger.info("WebSocket opened: unauthenticated user");
            }
          } catch (error) {
            logger.error("WebSocket auth error:", error);
          }

          // Add to connection manager
          chatManager.addClient({ ws, userId, userName, role, presenceId });

          // Send connection confirmation
          ws.send(
            JSON.stringify({
              type: ChatWSMessageType.CONNECTED,
              userId,
              profileIncomplete: hasIncompleteProfile,
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
            const rawMessage = await decodeWsMessage(evt.data);
            // Parse incoming message
            const data = JSON.parse(rawMessage);
            if (data?.type === ChatWSMessageType.PING) {
              chatManager.touchClient(ws);
              return;
            }
            const parsed = getSendMessageSchema({
              allowNewlines: isAdminUser,
            }).safeParse(data);

            if (!parsed.success) {
              const issueMessages = new Set(
                parsed.error.issues.map((issue) => issue.message),
              );
              const errorMessage = issueMessages.has("Message must be a single line")
                ? "Messages must be a single line"
                : issueMessages.has("Message cannot contain HTML tags")
                  ? "Message cannot contain HTML tags"
                  : "Invalid message format";
              ws.send(
                JSON.stringify({
                  type: ChatWSMessageType.ERROR,
                  error: errorMessage,
                  trace: trace(),
                }),
              );
              return;
            }

            chatManager.touchClient(ws);

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

            // Check profile completion
            if (hasIncompleteProfile) {
              ws.send(
                JSON.stringify({
                  type: ChatWSMessageType.ERROR,
                  error: "Please complete your profile before sending messages",
                  profileIncomplete: true,
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

            // Check if user was banned since connection opened
            const banStatus = await checkUserBan(userId);
            if (banStatus.banned) {
              const banMessage = banStatus.reason
                ? `Your account has been banned. Reason: ${banStatus.reason}`
                : "Your account has been banned";

              ws.send(
                JSON.stringify({
                  type: ChatWSMessageType.ERROR,
                  error: banMessage,
                  trace: trace(),
                }),
              );
              ws.close(1008, "User is banned");
              return;
            }

            const throttle = await checkChatThrottle({ userId, roomId });
            if (!throttle.allowed) {
              ws.send(
                JSON.stringify({
                  type: ChatWSMessageType.THROTTLED,
                  retryAfterMs: throttle.retryAfterMs,
                  limit: throttle.limit,
                  windowMs: throttle.windowMs,
                  roomId,
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

        onClose(_evt, ws: WSContext) {
          const logger = c.get("logger");
          logger.info(`WebSocket closed: userId=${userId}`);
          chatManager.removeClient({ ws, userId, userName, role, presenceId });
        },

        onError(evt, _ws: WSContext) {
          const logger = c.get("logger");
          logger.error("WebSocket error:", evt);
        },
      };
    }),
  )

  // REST endpoint for initial message load (optional fallback)
  .get("/history", authMiddleware(), checkProfileComplete(), async (c) => {
    try {
      const limit = Number(c.req.query("limit")) || 100;
      const messages = await chatService.getMessageHistory(limit);
      return c.json({ messages });
    } catch (error) {
      c.get("logger").error("Failed to fetch chat history:", error);
      return c.json({ error: "Failed to fetch chat history" }, 500);
    }
  })

  // Update a message (owner or admin)
  .patch(
    "/messages/:id",
    authMiddleware(),
    checkProfileComplete(),
    zValidator("json", getUpdateMessageSchema()),
    async (c) => {
      const messageId = c.req.param("id");
      const logger = c.get("logger");
      const role = c.var.user.role as UserRole | undefined;
      const isAdminUser = role ? isAdmin(role) : false;

      try {
        const { message } = c.req.valid("json");

        // Additional validation for non-admin users (no newlines)
        if (!isAdminUser && /[\r\n]/.test(message)) {
          return c.json({ success: false, error: "Messages must be a single line" }, 400);
        }

        const messageEntry = await chatService.getMessageById(messageId);

        if (!messageEntry) {
          return c.json({ success: false, error: "Message not found" }, 404);
        }

        if (!isAdminUser && messageEntry.userId !== c.var.user.id) {
          return c.json({ success: false, error: "Forbidden" }, 403);
        }

        const updated = await chatService.updateMessage(messageId, message);

        if (!updated) {
          return c.json({ success: false, error: "Failed to update message" }, 500);
        }

        chatManager.broadcastUpdate(updated);
        logger.info(`Message updated: messageId=${messageId}`);
        return c.json({ success: true, message: updated });
      } catch (error) {
        logger.error(
          { err: error, messageId, userId: c.var.user.id },
          "Failed to update message",
        );
        return c.json({ success: false, error: "Failed to update message" }, 500);
      }
    },
  )

  // Delete a message (owner or admin)
  .delete("/messages/:id", authMiddleware(), checkProfileComplete(), async (c) => {
    const messageId = c.req.param("id");
    const logger = c.get("logger");
    const role = c.var.user.role as UserRole | undefined;
    const isAdminUser = role ? isAdmin(role) : false;

    try {
      const messageEntry = await chatService.getMessageById(messageId);

      if (!messageEntry) {
        return c.json({ success: false, error: "Message not found" }, 404);
      }

      if (!isAdminUser && messageEntry.userId !== c.var.user.id) {
        return c.json({ success: false, error: "Forbidden" }, 403);
      }

      const deleted = await chatService.deleteMessage(messageId);

      if (deleted) {
        // Broadcast deletion to all connected clients
        chatManager.broadcastDeletion(messageId);

        logger.info(
          `${isAdminUser ? "Admin" : "User"} deleted message: messageId=${messageId}`,
        );
        return c.json({ success: true, messageId });
      }

      return c.json({ success: false, error: "Message not found" }, 404);
    } catch (error) {
      logger.error(
        { err: error, messageId, userId: c.var.user.id },
        "Failed to delete message",
      );
      return c.json({ success: false, error: "Failed to delete message" }, 500);
    }
  });
