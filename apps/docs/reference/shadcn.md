---
layout: doc
---

# shadcn/ui

The project uses [shadcn/ui](https://ui.shadcn.com/) for UI components. All shadcn components live in `packages/frontend-common/components/ui` and are shared across both the `frontend` and `admin` applications.

## Overview

shadcn/ui is a collection of re-usable components built using Radix UI and Tailwind CSS. Unlike traditional component libraries, shadcn components are copied directly into your codebase, giving you full control to customize them.

**Key benefits:**
- Full ownership of component code
- Built on Radix UI primitives for accessibility
- Styled with Tailwind CSS
- TypeScript support
- Copy, paste, and customize

## Project Structure

```
packages/frontend-common/
├── components.json          # shadcn configuration
├── components/
│   └── ui/                  # shadcn components
│       ├── alert.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── popover.tsx
│       ├── select.tsx
│       ├── textarea.tsx
│       ├── theme-toggle.tsx
│       └── index.ts
├── lib/
│   └── utils.ts             # cn() helper function
└── styles/
    └── theme.css            # Theme variables for shadcn
```

## Adding New Components

To add a new shadcn component, navigate to the `frontend-common` package and run the shadcn CLI:

```bash
cd packages/frontend-common
bunx --bun shadcn@latest add [component-name]
```

### Examples

Add a single component:

```bash
cd packages/frontend-common
bunx --bun shadcn@latest add button
```

Add multiple components:

```bash
cd packages/frontend-common
bunx --bun shadcn@latest add button card dialog
```

Add all available components:

```bash
cd packages/frontend-common
bunx --bun shadcn@latest add --all
```

The CLI will:
1. Download the component from the shadcn registry
2. Place it in `components/ui/`
3. Install any required dependencies
4. Update imports automatically

### After Adding Components

After adding new components, export them from `packages/frontend-common/components/ui/index.ts`:

```typescript
// packages/frontend-common/components/ui/index.ts
export * from "./alert";
export * from "./badge";
export * from "./button";
// ... add your new component here
export * from "./new-component";
```

This ensures the component is available through the package's public API.

## Using Components

### In Frontend App

Import shadcn components from `frontend-common`:

```typescript
// apps/frontend/src/pages/Dashboard.tsx
import { Button, Card, Dialog } from "frontend-common/components/ui";

export function Dashboard() {
  return (
    <Card>
      <Button>Click me</Button>
    </Card>
  );
}
```

### In Admin App

Same import pattern works in the admin app:

```typescript
// apps/admin/src/pages/Users.tsx
import { Button, Badge, Input } from "frontend-common/components/ui";

export function Users() {
  return (
    <div>
      <Input placeholder="Search users..." />
      <Badge>Admin</Badge>
    </div>
  );
}
```

### Using the cn() Utility

The `cn()` utility function combines class names and handles Tailwind conflicts:

```typescript
import { cn } from "frontend-common/lib";

<Button className={cn("mt-4", isActive && "bg-primary")} />
```

## Customizing Components

Since components are copied into your codebase, you can customize them directly:

### Modify Existing Components

Edit components in `packages/frontend-common/components/ui/`:

```typescript
// packages/frontend-common/components/ui/button.tsx
export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        // Add your custom variant here
        custom: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
      },
      // ...
    },
  }
);
```

### Create Custom Components

Create app-specific components that use shadcn primitives:

```typescript
// apps/frontend/src/components/FeatureCard.tsx
import { Card } from "frontend-common/components/ui";

export function FeatureCard({ title, description }: Props) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </Card>
  );
}
```

## Theme Configuration

Theme variables are defined in `packages/frontend-common/styles/theme.css` using CSS custom properties:

```css
:root {
  --radius: 0.6rem;
  --background: oklch(0.985 0.008 95);
  --foreground: oklch(0.21 0.02 248);
  --primary: oklch(0.62 0.17 238);
  /* ... more variables */
}

.dark {
  --background: oklch(0.17 0.02 248);
  --foreground: oklch(0.97 0.01 240);
  /* ... dark mode overrides */
}
```

### Customizing Colors

To change the color scheme:

1. Edit `packages/frontend-common/styles/theme.css`
2. Modify the CSS variables for both light and dark modes
3. Changes will apply to all shadcn components across both apps

### Border Radius

Adjust the global border radius:

```css
:root {
  --radius: 0.5rem; /* Change this value */
}
```

## Available Components

Current shadcn components in the project:

- **Alert** - Display important messages
- **Badge** - Small status indicators
- **Button** - Clickable buttons with variants
- **Card** - Container for content
- **Container** - Layout wrapper
- **Dialog** - Modal dialogs
- **Dropdown Menu** - Contextual menus
- **Input** - Text input fields
- **Label** - Form labels
- **Link** - Styled links
- **Popover** - Floating content
- **Select** - Dropdown selection
- **Styled Link** - Enhanced link component
- **Textarea** - Multi-line text input
- **Theme Toggle** - Dark/light mode switcher

Browse all available shadcn components at [ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components).

## Configuration

The `packages/frontend-common/components.json` file configures how shadcn components are installed:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "styles/theme.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@frontend-common/components",
    "utils": "@frontend-common/lib/utils",
    "ui": "@frontend-common/components/ui",
    "lib": "@frontend-common/lib",
    "hooks": "@frontend-common/hooks"
  },
  "iconLibrary": "lucide"
}
```

**Key settings:**
- `style: "new-york"` - Uses the New York design style
- `tsx: true` - Components use TypeScript
- `cssVariables: true` - Uses CSS variables for theming
- `iconLibrary: "lucide"` - Uses Lucide icons

## Troubleshooting

### Component not found after adding

Make sure you've exported the component in `packages/frontend-common/components/ui/index.ts`.

### Import errors in apps

Ensure you're importing from `frontend-common/components/ui`:

```typescript
// ✅ Correct
import { Button } from "frontend-common/components/ui";

// ❌ Wrong
import { Button } from "@frontend-common/components/ui";
```

### Styles not applying

1. Verify `frontend-common/styles/theme.css` is imported in your app's CSS
2. Check that Tailwind is scanning the `frontend-common` package
3. Ensure CSS variables are defined in `theme.css`

### Path alias issues

The `@frontend-common/*` alias in `components.json` points to the `frontend-common` package root. If you encounter path issues, check `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@frontend-common/*": ["./*"]
    }
  }
}
```

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [Radix UI Primitives](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

## Best Practices

1. **Always run shadcn CLI from frontend-common** - This ensures components are added to the shared package
2. **Export new components** - Add exports to `ui/index.ts` after adding components
3. **Customize in one place** - Edit components in `frontend-common`, not in individual apps
4. **Use the cn() utility** - For conditional classes and Tailwind merging
5. **Follow the theme system** - Use CSS variables instead of hardcoded colors
6. **Test in both apps** - Verify components work in both frontend and admin
7. **Check Storybook** - Add stories for new components to showcase them

## Example Workflow

Complete workflow for adding and using a new component:

```bash
# 1. Navigate to frontend-common
cd packages/frontend-common

# 2. Add the component
bunx --bun shadcn@latest add avatar

# 3. Export it (if not auto-exported)
# Edit packages/frontend-common/components/ui/index.ts
# Add: export * from "./avatar";

# 4. Use it in your app
# apps/frontend/src/components/UserProfile.tsx
```

```typescript
import { Avatar } from "frontend-common/components/ui";

export function UserProfile({ user }) {
  return (
    <div>
      <Avatar>
        <img src={user.avatar} alt={user.name} />
      </Avatar>
      <span>{user.name}</span>
    </div>
  );
}
```

```bash
# 5. (Optional) Add a Storybook story
# apps/storybook/src/Avatar.stories.tsx
```
