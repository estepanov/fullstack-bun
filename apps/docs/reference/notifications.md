---
layout: doc
---

# Notification System

Real-time, multi-channel notifications for both frontend and admin apps. Features:
- Live updates via Server-Sent Events (SSE) with unread count fan-out.
- Delivery strategy pipeline with email fallback for offline users (push, not implemented, reserved for future).
- Per-user preferences (email/push toggles and per-type controls).
- Actionable notifications with domain allowlisting to prevent unsafe redirects.
- Admin broadcast tool for targeted or global sends.

## Architecture at a Glance
- **Source of truth**: `notification` + `notification_preferences` tables.
- **Service layer**: `apps/api/src/lib/notification-service.ts` handles creation, unread caching (Redis), pagination, and broadcasts.
- **Delivery strategies** (ordered by `DELIVERY_STRATEGY_PRIORITY` in `packages/shared/config/notification.ts`):
  1. `sse` — immediate delivery to connected users via `notification-sse-manager`.
  2. `email` — Nodemailer-based fallback when users are _offline_ and have email enabled.
  3. `push` — _placeholder_ for future expansion.
- **Transport**: SSE endpoint `/notification/stream` (cookie-authenticated). Optional heartbeat `/notification/heartbeat` can be used by clients.
- **Distribution**: When `ENABLE_DISTRIBUTED_CHAT` is enabled, notification pub/sub piggybacks on Redis to fan out SSE events across instances.
- **Caching**: Unread counts cached in Redis (`notification:unread:${userId}`) with TTL from `NOTIFICATION_CONFIG.unreadCountCacheTTL`.

## Data Model
- `notification`
  - `id`, `userId`, `type` (`NotificationType` enum), `title`, `content`
  - `metadata` JSON (actions, priority, arbitrary data)
  - `read` flag, timestamps
- `notification_preferences`
  - `emailEnabled`, `pushEnabled`
  - `emailTypes`, `pushTypes` (per-type delivery toggles)
  - timestamps

## API Surface (all routes under `/notification`, auth required)
| Method & Path | Description |
| --- | --- |
| `GET /stream` | SSE stream. Emits `connected`, `new_notification`, `notification_updated`, `notification_deleted`, `unread_count_changed`, `keep_alive`, `error`. |
| `POST /heartbeat` | Optional client heartbeat to keep presence fresh. |
| `GET /list` | Paginated list with `page`, `limit`, `filter` (`all`,`read`,`unread`), `type`, `search`. |
| `GET /counts` | Counts by status and type for filters. |
| `GET /unread-count` | Cached unread count. |
| `PATCH /:id/read` | Mark a single notification read/unread. |
| `PATCH /mark-all-read` | Mark all as read for the user. |
| `DELETE /:id` | Delete a single notification. |
| `DELETE /delete-all` | Delete all notifications for the user. |
| `GET /preferences` | Fetch preferences (created on first read). |
| `PATCH /preferences` | Update preferences (`emailEnabled`, `pushEnabled`, `emailTypes`, `pushTypes`). |

### Admin Broadcast
- Endpoint: `POST /admin/notifications/send`
- Request schema: `AdminSendNotificationRequest` (`target.scope` = `user` \| `users` \| `all`; `notification` contains type/title/content/metadata/deliveryOptions).
- Batches sends (see `NOTIFICATION_SEND_BATCH_SIZE`) and skips banned users; returns counts and failures for any unmatched identifiers.
- Delivery options can override strategy order per send.

## Frontend Integration
- **SSE client**: `packages/frontend-common/notification/notification-sse-client.ts` wraps `EventSource` with `withCredentials` and per-event listeners.
- **React hook**: `apps/frontend/src/hooks/api/useNotificationSSE.ts` manages connection, local store (bounded by `NOTIFICATION_CONFIG.maxInMemoryNotifications`), and unread sync.
- **Provider**: `apps/frontend/src/providers/NotificationProvider.tsx` wires SSE state into context, shows Sonner toasts for new items, and opens a modal for multi-action notifications. Mounted in `RootAppProvider`.
- **UI primitives**: `NotificationBell`, `NotificationPanel`, `NotificationItem`, `NotificationPreferences` (in `apps/frontend/src/components/notifications/`). These use query/mutation hooks for list, counts, mark read/delete, preference updates, and SSE live updates.
- **Allowed action domains**: `NOTIFICATION_ACTION_ALLOWED_DOMAINS` in `packages/shared/config/notification.ts` guards button/link actions; update when adding new frontend domains.

### `useNotifications` hook
- Exported from `apps/frontend/src/providers/NotificationProvider.tsx`.
- Returns `notifications`, `unreadCount`, `connectionStatus`, `error` from the SSE-powered store.
- Must be used inside `NotificationProvider` (throws otherwise).
- Great for lightweight surfaces like badges, menus, or in-page lists without reimplementing SSE wiring.

### Example: consuming notifications in the app
```typescript
// Wrap the app (already done in RootAppProvider)
<NotificationProvider>
  <AppLayout />
</NotificationProvider>

// Use inside components
const { notifications, unreadCount } = useNotifications();
```

## Delivery & Preference Rules
- Email is attempted only when the user is offline (`notification-sse-manager.isUserOnline`) **and** the type is enabled in preferences (falls back to `DEFAULT_EMAIL_TYPES` when unset).
- Strategy order can be overridden per send via `deliveryOptions.strategies`; otherwise uses `DELIVERY_STRATEGY_PRIORITY`.
- Retention defaults (`NOTIFICATION_RETENTION`): max age 90 days, max 1,000 per user (housekeeping TBD).

## Configuration & Environment
- Shared defaults live in `packages/shared/config/notification.ts`:
  - SSE keep-alive/timeout intervals
  - Max in-memory items, pagination defaults, toast duration
  - Default delivery strategy order and per-type email/push defaults
  - Allowed action domains derived from `FE_BASE_URL`/`FRONTEND_URL`
- Environment variables involved:
  - `REDIS_URL` — unread count cache + pub/sub (required for best performance).
  - `FE_BASE_URL` (or `FRONTEND_URL`) — used for action allowlist and email links.
  - `SMTP_*` — required for email delivery; without SMTP the email strategy no-ops in dev.
  - `ENABLE_DISTRIBUTED_CHAT=true` — also enables distributed notification fan-out.
  - CORS: ensure frontend/admin origins are in `CORS_ALLOWLISTED_ORIGINS` for SSE cookies.

## Adding a New Notification Type
1. Add to `NotificationType` enum in `packages/shared/interfaces/notification.ts`.
2. Decide default delivery (update `DEFAULT_EMAIL_TYPES` / `DEFAULT_PUSH_TYPES` if needed).
3. Add icon mapping in `apps/frontend/src/lib/notification-icons.tsx`.
4. Add i18n strings in `apps/frontend/locales/*/notifications.json` and admin locales if used.
5. If action buttons are included, keep URLs within `NOTIFICATION_ACTION_ALLOWED_DOMAINS`.

## Testing & Verification
- API: `apps/api/test/notification-*.test.ts` cover service, router, and delivery flows.
- Frontend: `apps/frontend/src/pages/notifications.test.tsx` exercises SSE-driven UI, list, and preferences.
- Run full suite before shipping: `bun run test --coverage` and `bun run lint`.
