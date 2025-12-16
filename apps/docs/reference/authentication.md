---
layout: doc
---

# Authentication

This project uses [better-auth](https://www.better-auth.com/) for authentication - a comprehensive TypeScript-first authentication framework.

## Features

- **Email/Password Authentication** with email verification
- **Session Management** with automatic token refresh
- **Type-Safe** client and server with end-to-end TypeScript support
- **Password Reset Flow** for forgotten passwords
- **Social Login** (GitHub, Google, etc.) - optional
- **Built-in Security** with battle-tested best practices

## Authentication Flow

### 1. User Registration

```
User fills registration form
  ↓
POST /auth/sign-up/email
  ↓
User created in database
  ↓
Verification email sent
  ↓
User clicks verification link
  ↓
POST /auth/verify-email
  ↓
Email marked as verified
```

### 2. User Login

```
User enters credentials
  ↓
POST /auth/sign-in/email
  ↓
Credentials verified
  ↓
Session created
  ↓
User authenticated
```

### 3. Session Management

better-auth automatically handles JWT tokens and session management. Tokens are refreshed automatically when needed.

## API Endpoints

All endpoints are handled by better-auth automatically at `/auth/*`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/sign-up/email` | POST | Register new user with email/password |
| `/auth/sign-in/email` | POST | Login with email/password |
| `/auth/sign-out` | POST | Logout current user |
| `/auth/verify-email` | POST | Verify email with token |
| `/auth/get-session` | GET | Get current session |
| `/auth/forget-password` | POST | Request password reset |
| `/auth/reset-password` | POST | Reset password with token |

## Protecting Routes (Backend)

Use the `authMiddleware` to protect API routes:

```typescript
import { authMiddleware } from "../middlewares/auth";
import type { AuthMiddlewareEnv } from "../middlewares/auth";
import type { LoggerMiddlewareEnv } from "../middlewares/logger";

const router = new Hono<LoggerMiddlewareEnv & AuthMiddlewareEnv>()
  .get("/protected", authMiddleware(), (c) => {
    // Access authenticated user
    const user = c.var.user;
    const session = c.var.session;

    return c.json({
      message: "Protected data",
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });
  });
```

**Type Safety**: The middleware provides type-safe access to `user` and `session` via `c.var`.

## Protecting Routes (Frontend)

Use the `ProtectedRoute` component to wrap pages that require authentication:

```typescript
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>
        This content is only visible to authenticated users
      </div>
    </ProtectedRoute>
  );
}
```

**How it works**:
1. Checks if user is authenticated using `useSession` hook
2. Shows loading state while checking session
3. Redirects to `/auth/login` if not authenticated
4. Renders children if authenticated

## Using Auth in Components

### Get Current Session

```typescript
import { useSession } from "@/lib/auth-client";

export function MyComponent() {
  const { data: session, isPending, error } = useSession();

  if (isPending) return <div>Loading...</div>;

  if (!session) {
    return <Link to="/auth/login">Please login</Link>;
  }

  return (
    <div>
      <p>Welcome, {session.user.email}</p>
      <p>Email verified: {session.user.emailVerified ? "Yes" : "No"}</p>
    </div>
  );
}
```

### Sign Out

```typescript
import { signOut } from "@/lib/auth-client";

export function LogoutButton() {
  return (
    <button onClick={() => signOut()}>
      Sign Out
    </button>
  );
}
```

### Social Login (Optional)

If you've configured OAuth providers (like GitHub):

```typescript
import { signIn } from "@/lib/auth-client";

export function SocialLogin() {
  const handleGitHubLogin = async () => {
    await signIn.social(
      { provider: "github" },
      {
        onSuccess: () => {
          navigate("/dashboard");
        },
        onError: (error) => {
          console.error("Login failed:", error);
        },
      }
    );
  };

  return (
    <button onClick={handleGitHubLogin}>
      Sign in with GitHub
    </button>
  );
}
```

## Email Verification

Email verification is enabled by default. Users must verify their email before they can log in.

### Setup

Configure SMTP in your `.env` file:

```txt
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@yourapp.com"
```

### Development

If SMTP is not configured, the verification URL will be logged to the console instead:

```
📧 Email Verification URL for user@example.com:
http://localhost:5173/auth/verify-email?token=abc123...
```

## Setting Up Social Login

### GitHub OAuth

1. **Create GitHub OAuth App**:
   - Go to https://github.com/settings/developers
   - Click "New OAuth App"
   - Set Authorization callback URL: `http://localhost:3001/auth/callback/github`

2. **Add Credentials to `.env`**:
   ```txt
   GITHUB_CLIENT_ID="your-client-id"
   GITHUB_CLIENT_SECRET="your-client-secret"
   ```

3. **Use in Frontend**:
   ```typescript
   await signIn.social({ provider: "github" });
   ```

## Security Best Practices

### Production Checklist

- ✅ Use HTTPS in production
- ✅ Keep `BETTER_AUTH_SECRET` secure and never commit it
- ✅ Rotate secrets periodically (at least annually)
- ✅ Use strong password requirements (enforced by better-auth)
- ✅ Enable email verification (enabled by default)
- ✅ Use secure SMTP credentials
- ✅ Set up rate limiting on auth endpoints (recommended)
- ✅ Monitor failed login attempts

### Password Requirements

better-auth enforces:
- Minimum 8 characters
- Additional complexity rules can be configured

### Session Security

- Sessions are stored securely with JWT
- Access tokens expire after 15 minutes
- Refresh tokens are used to obtain new access tokens
- Sessions can be invalidated on logout

## Troubleshooting

### Email Verification Not Working

1. **Check SMTP Configuration**: Ensure all SMTP environment variables are set correctly
2. **Check Logs**: Look for email sending errors in console output
3. **Check Spam Folder**: Verification emails might be marked as spam
4. **Development Mode**: Use the console-logged verification URL

### User Can't Login

1. **Email Not Verified**: User must verify email before login
2. **Incorrect Credentials**: Check that email and password are correct
3. **Check Database**: Ensure user exists in the `users` table

### Session Not Persisting

1. **Check CORS**: Ensure `CORS_ALLOWLISTED_ORIGINS` includes your frontend URL
2. **Check Cookies**: Some browsers block third-party cookies
3. **Check Network**: Look for failed session requests in browser DevTools

## API Reference

For more details, see the [better-auth documentation](https://www.better-auth.com/).
