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
- **Passkey (WebAuthn) Support** for passwordless authentication
- **Magic Link** for email-based passwordless login
- **Email OTP** for one-time password authentication
- **Social Login** (GitHub, Google, etc.) - optional
- **Admin Features** including user roles, bans, and impersonation
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

## Shared Authentication Configuration

Authentication configuration is shared across the API and frontend apps to keep validation,
profile requirements, and client behavior consistent. The source of truth lives in the
workspace packages.

### Shared User Profile Rules

`packages/shared/config/user-profile.ts` defines the reusable constraints that power both
backend validation and frontend UI:

- `USERNAME_CONFIG` (length, pattern, description) is consumed by:
  - `apps/api/src/lib/auth.ts` (better-auth `username` plugin)
  - `packages/shared/auth/user-profile-fields.ts` (Zod schema)
  - `apps/frontend/src/pages/profile/complete.tsx` (form validation)
- `REQUIRED_USER_FIELDS` drives profile completion:
  - `apps/api/src/config/required-fields.ts` checks missing fields
  - `apps/frontend` profile completion UX ensures the same fields are required

**When changing required fields**
1. Update `packages/shared/config/user-profile.ts`.
2. Add validators in `packages/shared/auth/user-profile-fields.ts` if needed.
3. Update the user profile schema in the API database (if you add columns).
4. Update the profile completion UI in `apps/frontend/src/pages/profile/complete.tsx`.

### Shared Auth Client Setup

Frontend apps should create a better-auth client instance using the shared helper in
`packages/frontend-common/auth`:

```typescript
import { createAuthClientInstance } from "frontend-common/auth";

export const authClient = createAuthClientInstance(
  import.meta.env.VITE_API_BASE_URL
);
```

The shared client configuration:
- Sets `basePath` to `/auth` so all apps hit the same API routes.
- Enables the shared plugins (admin, magic-link, username).

### Requirements

To keep shared authentication configuration working across apps:

- Ensure the consuming app depends on `shared` and `frontend-common` workspace packages.
- Configure `VITE_API_BASE_URL` in frontend/admin so the shared client points at the API.
- Keep API `API_BASE_URL` aligned with the API URL, and `FE_BASE_URL`/`CORS_ALLOWLISTED_ORIGINS` aligned with the frontend URL.

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
import { ProtectedRoute } from "@frontend/src/components/ProtectedRoute";

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
import { useSession } from "@frontend/src/lib/auth-client";

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
import { signOut } from "@frontend/src/lib/auth-client";

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
import { signIn } from "@frontend/src/lib/auth-client";

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

## Passkey Authentication (WebAuthn)

Passkeys provide a secure, passwordless authentication method using biometrics or security keys. This feature is enabled by default.

### What are Passkeys?

Passkeys use **WebAuthn** (Web Authentication API) to enable users to sign in using:
- Fingerprint sensors
- Face recognition
- Hardware security keys (YubiKey, etc.)
- Platform authenticators (Touch ID, Windows Hello, etc.)

### Configuration

Passkeys are enabled by default in `packages/shared/config/auth.ts`:

```typescript
passkey: {
  enabled: true,
}
```

To disable passkeys, set `enabled: false` and restart the API.

### Registering a Passkey

Users can register a passkey after signing up or from their account settings:

```typescript
import { passkey } from "@frontend/src/lib/auth-client";

export function RegisterPasskey() {
  const handleRegisterPasskey = async () => {
    try {
      await passkey.addPasskey({
        name: "My Security Key", // Optional: name for the passkey
      });

      toast.success("Passkey registered successfully!");
    } catch (error) {
      console.error("Passkey registration failed:", error);
      toast.error("Failed to register passkey");
    }
  };

  return (
    <button onClick={handleRegisterPasskey}>
      Add Passkey
    </button>
  );
}
```

### Signing In with Passkey

```typescript
import { signIn } from "@frontend/src/lib/auth-client";

export function PasskeyLogin() {
  const handlePasskeyLogin = async () => {
    try {
      await signIn.passkey();

      navigate("/dashboard");
    } catch (error) {
      console.error("Passkey login failed:", error);
      toast.error("Failed to sign in with passkey");
    }
  };

  return (
    <button onClick={handlePasskeyLogin}>
      Sign in with Passkey
    </button>
  );
}
```

### Listing User's Passkeys

```typescript
import { passkey } from "@frontend/src/lib/auth-client";

export function PasskeyList() {
  const { data: passkeys } = useQuery({
    queryKey: ["passkeys"],
    queryFn: async () => {
      const response = await passkey.listPasskeys();
      return response.data;
    },
  });

  return (
    <ul>
      {passkeys?.map((pk) => (
        <li key={pk.id}>
          {pk.name || "Unnamed Passkey"} - Created: {new Date(pk.createdAt).toLocaleDateString()}
        </li>
      ))}
    </ul>
  );
}
```

### Browser Support

Passkeys are supported in:
- Chrome/Edge 67+
- Safari 13+
- Firefox 60+
- All modern mobile browsers

The API automatically handles browser compatibility checks.

## Magic Link Authentication

Magic links allow users to sign in by clicking a link sent to their email - no password required.

### Configuration

Magic links are enabled by default in `packages/shared/config/auth.ts`:

```typescript
magicLink: {
  enabled: true,
}
```

### SMTP Setup

Magic links require SMTP configuration (same as email verification):

```txt
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="Fullstack Bun <noreply@example.com>"
```

### Requesting a Magic Link

```typescript
import { signIn } from "@frontend/src/lib/auth-client";

export function MagicLinkLogin() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSendMagicLink = async () => {
    try {
      await signIn.magicLink({
        email,
        callbackURL: "/dashboard",
      });

      setSent(true);
      toast.success("Magic link sent! Check your email.");
    } catch (error) {
      console.error("Failed to send magic link:", error);
      toast.error("Failed to send magic link");
    }
  };

  return sent ? (
    <div>Check your email for the magic link!</div>
  ) : (
    <form onSubmit={(e) => { e.preventDefault(); handleSendMagicLink(); }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
      />
      <button type="submit">Send Magic Link</button>
    </form>
  );
}
```

### Development Mode

If SMTP is not configured, the magic link URL will be logged to the console:

```
📧 Magic Link for user@example.com:
http://localhost:5173/auth/magic-link/verify?token=abc123...
```

## Email OTP (One-Time Password)

Email OTP sends a temporary code to the user's email for authentication.

### How It Works

1. User enters their email
2. System sends a 6-digit OTP code via email
3. User enters the code to complete authentication
4. Code expires after a set time period

### Requesting an OTP

```typescript
import { signIn } from "@frontend/src/lib/auth-client";

export function EmailOTPLogin() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");

  const handleRequestOTP = async () => {
    try {
      await signIn.emailOtp({
        email,
      });

      setStep("otp");
      toast.success("OTP sent to your email!");
    } catch (error) {
      console.error("Failed to send OTP:", error);
      toast.error("Failed to send OTP");
    }
  };

  const handleVerifyOTP = async () => {
    try {
      await signIn.emailOtp({
        email,
        otp,
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Invalid OTP:", error);
      toast.error("Invalid or expired OTP");
    }
  };

  return step === "email" ? (
    <form onSubmit={(e) => { e.preventDefault(); handleRequestOTP(); }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
      />
      <button type="submit">Send OTP</button>
    </form>
  ) : (
    <form onSubmit={(e) => { e.preventDefault(); handleVerifyOTP(); }}>
      <input
        type="text"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        placeholder="Enter 6-digit code"
        maxLength={6}
      />
      <button type="submit">Verify</button>
    </form>
  );
}
```

### Security Features

The email OTP implementation includes:
- **IP tracking** - Shows the IP address in the email for security
- **Location tracking** - Shows approximate location (if available)
- **Timestamp** - Shows when the OTP was requested
- **Expiration** - OTP codes expire after a set time period

### Email Template

OTP emails include security information:

```
Your verification code: 123456

Security Information:
IP Address: 192.168.1.1
Location: San Francisco, CA, US
Time: 2024-01-15T10:30:00Z

If you didn't request this code, please ignore this email.
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
SMTP_FROM="Fullstack Bun <noreply@example.com>"
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
