---
layout: doc
---

# Frontend Testing

Tests are run with Bun's test runner. We have happydom loaded and utilize [React Testing Library](https://reactrouter.com) to ensure we can test components more closely to the way users would use the app.

Currently tests are colocated with files and end with `.test.tsx` or `.test.ts`

When you need to render a component, if it needs context provided by app providers, you should import `render` from `@test/rtl` (alias for `apps/frontend/test/rtl.ts`). `render` from `@test/rtl` will wrap your component in apps default providers.

If you want add/change global test hooks please see `apps/frontend/testing-library.ts`

