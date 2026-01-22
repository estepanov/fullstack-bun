---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Delicious fullstack Bun boilerplate"
  text: "Hono + React"
  tagline: A simple boilerplate to hit the ground running.
  actions:
    - theme: brand
      text: Get Started
      link: /get-started
    - theme: alt
      text: Demo Frontend
      link: https://frontend.demo.fullstackbun.dev
    - theme: alt
      text: Demo Mocked Admin
      link: https://admin-mock.demo.fullstackbun.dev
    - theme: alt
      text: Demo Storybook
      link: https://storybook.demo.fullstackbun.dev

features:
  - title: React 19 + Vite
    details: The latest React version powered by Vite
  - title: React Router 7
    details: Type safe routing with framework mode ready to-go
  - title: TanStack Form
    details: Type safe form handling with TanStack Form
  - title: Internationalization
    details: Powered by i18next and react-i18next. Just add translations and you are ready to go.
  - title: TailwindCSS 4
    details: The latest Tailwind release
  - title: React Testing Library & MSW
    details: The React Testing Library you love run via Bun's test runner. Oh and we have MSW for mocking APIs/intercepting requests.
  - title: Shadcn
    details: Bring the components you love via the CLI
  - title: Shared Component Library
    details: Reusable UI primitives in frontend-common for consistent interfaces.
  - title: Storybook
    details: Document and preview shared UI components with a dedicated Storybook app.
  - title: Hono API + Hono client setup
    details: Fullstack type safe hono client and react-query setup
  - title: Zod validation
    details: Use the same schema for API and frontend validation.
  - title: PostgreSQL + Drizzle ORM
    details: Type-safe database access with Drizzle ORM and PostgreSQL 15. Migrations, schema management, and Drizzle Studio included.
  - title: better-auth Authentication
    details: Complete authentication system with email/password, email verification, session management, and optional OAuth support (GitHub, Google).
  - title: Email Verification
    details: Built-in email verification flow using Nodemailer with SMTP support. Development mode logs verification URLs to console.
  - title: Protected Routes
    details: Frontend and backend route protection. ProtectedRoute component for React and authMiddleware for Hono API.
  - title: Logging
    details: Logging setup out of the box with Pino
  - title: Traceability
    details: Every request/session has a UUID attached to the header/logger.
  - title: Biome
    details: Biome for linting and formatting. Easy to use, quick to run, and it "just works".
  - title: Docker Support
    details: Full containerization for development and production with Docker Compose. Hot reload, health checks, and multi-stage builds included.
  - title: PostgreSQL + Drizzle
    details: First-class database setup with PostgreSQL 15 and Drizzle ORM, ready for migrations and local dev.
  - title: Redis
    details: Redis is provisioned alongside Postgres via Docker Compose for caching/session-style workloads.

---

<br /><br />

# About

This is a production-ready fullstack boilerplate designed to help you hit the ground running with modern web development.

The project leverages **Bun** as much as possible throughout the development process to keep things fast, light, and easy to maintain.

## What's Included

- **Frontend:** React 19 with Vite, React Router 7, TailwindCSS 4, and Shadcn UI components
- **Backend:** Hono API with type-safe client integration and React Query
- **Database:** PostgreSQL 15 with Drizzle ORM for type-safe database access
- **Authentication:** Complete auth system using better-auth with email verification and session management
- **Internationalization:** Multi-language support with i18next (English, German, Spanish, French)
- **Testing:** Bun test runner with React Testing Library and MSW for API mocking
- **Docker:** Full containerization for development and production environments
- **Developer Experience:** Biome for linting/formatting, Pino for logging, UUID-based request tracing

## Features

- **Notifications:** 
  - Live notifications. Users on the website see live toasts and notification counts. 
  - If a user is offline, depending on the users preferences, they can receieve emails about notifications.
  - Tracks read/unread notifications.
  - User notification preference honored

## Roadmap

Future enhancements we're considering:

- **E2E Testing:** Playwright test suite for end-to-end testing
- **Advanced Auth Features:**
  - SMS OTP support for two-factor authentication
- **CI/CD Pipeline:**
  - Automated deployments
- **Performance Monitoring:** Integration with performance monitoring tools
- **Rate Limiting:** API rate limiting middleware
- **File Uploads:** S3-compatible file upload handling
