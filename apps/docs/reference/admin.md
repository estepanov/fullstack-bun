---
layout: doc
---

# Admin Features

This project includes comprehensive admin features powered by better-auth's admin plugin and access control system.

## Overview

The admin system provides:
- **Role-Based Access Control (RBAC)** - Define granular permissions for different user roles
- **User Management** - View, update, and manage users
- **User Bans** - Temporarily or permanently ban users with optional expiration
- **Role Assignment** - Assign and change user roles
- **User Impersonation** - Admins can impersonate users for debugging and support
- **Session Management** - View and revoke user sessions

## User Roles

The system defines three roles with different permission levels:

### Admin Role

Full system access with all permissions:

```typescript
{
  user: ["create", "read", "update", "delete", "list", "set-role", "ban", "unban"],
  session: ["list", "revoke", "delete"],
  impersonation: ["start", "stop"]
}
```

Admins can:
- Create, read, update, and delete users
- List all users in the system
- Change user roles
- Ban and unban users
- View, revoke, and delete sessions
- Impersonate other users (including other admins)

### Moderator Role

Limited moderation capabilities:

```typescript
{
  user: ["read", "list", "ban", "unban"],
  session: ["list"],
  impersonation: []
}
```

Moderators can:
- View user information
- List all users
- Ban and unban users
- View active sessions
- Cannot change roles or impersonate users

### User Role

Standard user permissions (default for all users):

```typescript
{
  user: ["read"],
  session: [],
  impersonation: []
}
```

Regular users can only read their own user information.

## Configuration

Admin features are configured in `apps/api/src/lib/auth.ts`:

```typescript
admin({
  ac,
  roles,
  defaultRole: "user",
  adminRoles: ["admin"],
  impersonationSessionDuration: 3600 / 2, // 30 minutes
  allowImpersonatingAdmins: true,
})
```

### Configuration Options

- **defaultRole**: Role assigned to new users (default: "user")
- **adminRoles**: Array of roles considered admins (default: ["admin"])
- **impersonationSessionDuration**: How long impersonation sessions last in seconds (default: 30 minutes)
- **allowImpersonatingAdmins**: Whether admins can impersonate other admins (default: true)

## Admin Endpoints

All admin endpoints are protected and require appropriate permissions.

### List Users

**Endpoint:** `GET /api/admin/users`

**Required Permission:** `user:list`

**Query Parameters:**
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 10)
- `search` (string) - Search by email or username

**Response:**
```json
{
  "users": [
    {
      "id": "user-123",
      "email": "user@example.com",
      "username": "john_doe",
      "role": "user",
      "emailVerified": true,
      "banned": false,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

### Set User Role

**Endpoint:** `POST /api/admin/set-role`

**Required Permission:** `user:set-role`

**Request Body:**
```json
{
  "userId": "user-123",
  "role": "moderator"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-123",
    "role": "moderator"
  }
}
```

### Ban User

**Endpoint:** `POST /api/admin/ban-user`

**Required Permission:** `user:ban`

**Request Body:**
```json
{
  "userId": "user-123",
  "reason": "Violating community guidelines",
  "expiresAt": "2024-12-31T23:59:59Z" // Optional: permanent if not provided
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-123",
    "banned": true,
    "banReason": "Violating community guidelines",
    "banExpiresAt": "2024-12-31T23:59:59Z"
  }
}
```

### Unban User

**Endpoint:** `POST /api/admin/unban-user`

**Required Permission:** `user:unban`

**Request Body:**
```json
{
  "userId": "user-123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-123",
    "banned": false,
    "banReason": null,
    "banExpiresAt": null
  }
}
```

### List User Sessions

**Endpoint:** `GET /api/admin/sessions/:userId`

**Required Permission:** `session:list`

**Response:**
```json
{
  "sessions": [
    {
      "id": "session-123",
      "userId": "user-123",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-01-15T10:00:00Z",
      "expiresAt": "2024-01-16T10:00:00Z"
    }
  ]
}
```

### Revoke Session

**Endpoint:** `POST /api/admin/revoke-session`

**Required Permission:** `session:revoke`

**Request Body:**
```json
{
  "sessionId": "session-123"
}
```

**Response:**
```json
{
  "success": true
}
```

## User Impersonation

Impersonation allows admins to view the application as another user for debugging or support purposes.

### Start Impersonation

**Endpoint:** `POST /api/admin/impersonate`

**Required Permission:** `impersonation:start`

**Request Body:**
```json
{
  "userId": "user-123"
}
```

**Response:**
```json
{
  "success": true,
  "impersonationSession": {
    "userId": "user-123",
    "expiresAt": "2024-01-15T10:30:00Z"
  }
}
```

### Stop Impersonation

**Endpoint:** `POST /api/admin/stop-impersonation`

**Required Permission:** `impersonation:stop`

**Response:**
```json
{
  "success": true
}
```

### Frontend Usage

```typescript
import { admin } from "@frontend/src/lib/auth-client";

export function ImpersonateButton({ userId }: { userId: string }) {
  const handleImpersonate = async () => {
    try {
      await admin.impersonateUser({
        userId,
      });

      toast.success("Now viewing as user");
      navigate("/dashboard");
    } catch (error) {
      console.error("Impersonation failed:", error);
      toast.error("Failed to impersonate user");
    }
  };

  return (
    <button onClick={handleImpersonate}>
      Impersonate User
    </button>
  );
}

export function StopImpersonateButton() {
  const handleStopImpersonation = async () => {
    try {
      await admin.stopImpersonation();

      toast.success("Returned to admin account");
      navigate("/admin");
    } catch (error) {
      console.error("Failed to stop impersonation:", error);
    }
  };

  return (
    <button onClick={handleStopImpersonation}>
      Stop Impersonation
    </button>
  );
}
```

## Admin Dashboard

The project includes a complete admin dashboard at `apps/admin/` with:

- **User List Page** - Paginated table of all users with search
- **User Details** - View detailed user information
- **Role Management** - Change user roles with dropdown
- **Ban Management** - Ban/unban users with reason and expiration
- **Session View** - View and revoke user sessions

### Accessing the Admin Dashboard

1. Start the admin app:
   ```bash
   bun run dev
   # Or specifically:
   bun --filter=admin dev
   ```

2. Navigate to `http://localhost:5174` (default admin port)

3. Login with an admin account

4. Access admin features from the dashboard

### Protecting Admin Routes (Frontend)

Use the admin middleware to protect admin-only pages:

```typescript
import { useSession } from "@frontend/src/lib/auth-client";
import { Navigate } from "react-router";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!session || session.user.role !== "admin") {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}
```

### Protecting Admin Routes (Backend)

Use the access control middleware:

```typescript
import { authMiddleware } from "../middlewares/auth";
import { adminMiddleware } from "../middlewares/admin";

const adminRouter = new Hono()
  .use("*", authMiddleware())
  .use("*", adminMiddleware(["admin"])) // Require admin role
  .get("/users", (c) => {
    // Only admins can access
    // ...
  });
```

## Checking Permissions

### Backend Permission Checks

```typescript
import { auth } from "../lib/auth";

// Check if user has specific permission
const hasPermission = await auth.api.hasPermission({
  userId: "user-123",
  resource: "user",
  action: "ban",
});

if (hasPermission) {
  // User can ban other users
}
```

### Frontend Permission Checks

```typescript
import { useSession } from "@frontend/src/lib/auth-client";

export function AdminFeature() {
  const { data: session } = useSession();

  const isAdmin = session?.user.role === "admin";
  const isModerator = session?.user.role === "moderator";

  if (!isAdmin && !isModerator) {
    return null; // Hide feature for regular users
  }

  return (
    <div>
      {isAdmin && <button>Delete User</button>}
      {(isAdmin || isModerator) && <button>Ban User</button>}
    </div>
  );
}
```

## Security Best Practices

### 1. Audit Logging

Always log admin actions:

```typescript
logger.info("Admin action performed", {
  adminId: session.user.id,
  action: "ban_user",
  targetUserId: userId,
  reason: banReason,
  timestamp: new Date().toISOString(),
});
```

### 2. Require Re-authentication

For sensitive actions (delete user, change admin role), require re-authentication:

```typescript
// Verify user recently authenticated
if (Date.now() - session.lastAuthTime > 5 * 60 * 1000) {
  throw new Error("Please re-authenticate to perform this action");
}
```

### 3. Impersonation Safeguards

- Limit impersonation duration (default: 30 minutes)
- Log all impersonation sessions
- Display clear UI indicator when impersonating
- Auto-expire impersonation sessions

### 4. Rate Limiting

Implement rate limiting on admin endpoints:

```typescript
import { rateLimiter } from "../middlewares/rate-limiter";

adminRouter.use("/ban-user", rateLimiter({ max: 10, window: 60000 }));
```

## Troubleshooting

### User Can't Access Admin Features

**Symptoms:** User has admin role but can't access admin endpoints

**Checks:**
1. Verify user role in database: `SELECT role FROM "user" WHERE id = 'user-123'`
2. Check `adminRoles` config in `auth.ts`
3. Verify session is fresh (logout/login)
4. Check for permission errors in API logs

**Solution:**
```typescript
// Manually set user role in database
UPDATE "user" SET role = 'admin' WHERE email = 'admin@example.com';
```

### Impersonation Not Working

**Symptoms:** Impersonation fails or immediately expires

**Checks:**
1. Verify `allowImpersonatingAdmins: true` if trying to impersonate admin
2. Check impersonation duration setting
3. Verify admin has `impersonation:start` permission

**Solution:**
```typescript
// Increase impersonation duration
admin({
  // ...
  impersonationSessionDuration: 3600, // 1 hour
})
```

### Ban Not Persisting

**Symptoms:** User can still login after being banned

**Checks:**
1. Verify ban record in database
2. Check if ban has expired (`banExpiresAt`)
3. Ensure auth middleware checks ban status

**Solution:**
```sql
-- Check ban status
SELECT banned, "banReason", "banExpiresAt" FROM "user" WHERE id = 'user-123';

-- Manually ban user
UPDATE "user" SET banned = true, "banReason" = 'Test ban' WHERE id = 'user-123';
```

## API Reference

For more details on the better-auth admin plugin, see:
- [better-auth Admin Plugin Documentation](https://www.better-auth.com/docs/plugins/admin)
- [better-auth Access Control Documentation](https://www.better-auth.com/docs/plugins/access-control)
