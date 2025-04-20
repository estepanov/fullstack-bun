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
      text: Reference
      link: /reference

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
  - title: React Testing Library
    details: The RTL you love run via Bun's test runner
  - title: Shadcn
    details: Bring the components you love via the CLI
  - title: Hono API + Hono client setup
    details: Fullstack type safe hono client and react-query setup
  - title: Zod validation
    details: Use the same schema for API and frontend validation.
  - title: Logging
    details: Logging setup out of the box
  - title: Traceability
    details: Every request/session has a UUID attached to the header/logger.
  - title: Biome
    details: Biome for linting and formatting. Easy to use, quick to run, and it "just works".

---

<br /><br />

# About

This is all about creating a simple boilerplate to hit the ground running.
The project will lean on Bun as much as possible through out the development processto keep the project light and easy to maintain.

Currently a static frontend and a Hono API are included.

Some DB work is coming but not yet implemented.

## Roadmap

- Unit tests
- E2E playwright tests
- Attach postgres db 
- Attach redis cache
- Frontend Auth 
  - Attaching auth headers
  - Auth hook
    - get auth state
    - get token/user info
  - Protected routes
  - Auth actions
    - sign in
    - sign up
    - etc...
- Backend Auth
  - Middleware for protected routes
  - Attach user id to request logger
  - oauth support
  - email otp support
  - sms otp support ? who knows ?
- Email sending API
- Github actions
  - Automated PR tests check

