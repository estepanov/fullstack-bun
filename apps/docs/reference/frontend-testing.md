---
layout: doc
---

# Frontend Testing

This guide covers the testing setup and best practices for the frontend application.

## Overview

Tests are run using Bun's test runner, which provides fast execution and built-in TypeScript support. We use:
- **HappyDOM** for browser environment simulation
- **React Testing Library** for component testing that mirrors real user interactions

## Test File Organization

- Tests are colocated with their corresponding source files
- Test files follow the naming convention: `*.test.tsx` or `*.test.ts`
- Example: `Button.tsx` → `Button.test.tsx`

## Component Testing

### Basic Setup

When testing components that require app context providers, import the custom `render` function:

```typescript
import { render } from '@test/rtl'
```

This `render` function (aliased from `apps/frontend/test/rtl.ts`) automatically wraps your component with the application's default providers.

### Global Test Configuration

To modify global test hooks or configurations, refer to `apps/frontend/testing-library.ts`.

## Testing Tools

The project uses the following testing stack:

- **Bun Test Runner**: Fast JavaScript/TypeScript test runner built into Bun
- **HappyDOM**: A lightweight browser implementation for testing
- **React Testing Library**: For testing React components in a user-centric way
- **MSW (Mock Service Worker)**: For mocking API requests

## API Mocking

We use [Mock Service Worker (MSW)](https://mswjs.io) for API request interception in unit tests. 

> **Note**: MSW is pinned to version `2.3.1` due to [compatibility issues with Bun](https://github.com/oven-sh/bun/issues/13072).

### Best Practices

1. Use React Testing Library's queries that mirror how users interact with your app
2. Test component behavior rather than implementation details
3. Write tests that are resilient to implementation changes
4. Use MSW to mock API responses consistently across tests


