---
layout: doc
---

# Internationalization

The frontend uses an enterprise-grade [i18next](https://i18next.com) setup via [react-i18next](https://react.i18next.com) with optimized translation loading and CDN support.

## Architecture Overview

This project uses a modern, scalable i18n architecture that:

- **Eliminates dev server issues**: No file copying during development
- **Supports CDN delivery**: Configurable CDN URLs for production deployment
- **Lazy loads translations**: Namespaces are loaded on-demand for better performance  
- **Environment-aware**: Different configurations for development and production
- **Hot-reloadable**: Translation updates are reflected immediately in development

## Development vs Production

### Development
- Translations served dynamically via custom Vite plugin
- No file copying or build-time operations
- Immediate hot-reload when translation files change
- Debug mode enabled for detailed logging

### Production
- Translations bundled as static assets during build
- Optimized caching headers and lazy loading
- Preloading of critical namespaces for better UX

## Translation Files

You can add or edit translations in `apps/frontend/locales/en`. The project follows a namespace-based approach for organizing translations.

### Structure

```
apps/frontend/locales/
├── en/
│   ├── auth.json             # Authentication pages (login, register, etc.)
│   ├── common.json           # Common/shared translations
│   ├── header.json           # Header component
│   ├── footer.json           # Footer component
│   ├── landing_page.json     # Landing page
│   ├── messages.json         # Message form and actions
│   ├── second_page.json      # Second page
│   └── color_mode_toggle.json # Theme toggle
├── de/                       # German translations
│   └── ...
├── es/                       # Spanish translations
│   └── ...
└── fr/                       # French translations
    └── ...
```

### LLM Prompt 

Here is a prompt you can use to create translations from a single input:

```
For the attached English files, can you add translations for German, Spanish, and French? Please provide a single zip file with each language's files in its own directory (de, es, fr).
```

You can unzip the file and extract the new translations to `apps/frontend/locales`.

## Available Namespaces

The project currently includes the following translation namespaces:

- **`auth`** - Authentication pages (login, register, verify email, dashboard)
- **`common`** - Common/shared translations
- **`header`** - Header component translations
- **`footer`** - Footer component translations
- **`landing_page`** - Landing page content
- **`messages`** - Message form and actions
- **`second_page`** - Second page content
- **`color_mode_toggle`** - Theme toggle component

## Usage in Components

### Basic Usage

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('common');

  return <h1>{t('welcome')}</h1>;
}
```

### Authentication Pages Example

```tsx
import { useTranslation } from 'react-i18next';

function LoginPage() {
  const { t } = useTranslation('auth');

  return (
    <div>
      <h1>{t('login.title')}</h1>
      <p>{t('login.subtitle')}</p>
      <button>{t('login.submit_button')}</button>
    </div>
  );
}
```

### With Multiple Namespaces

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation(['common', 'forms']);
  
  return (
    <div>
      <h1>{t('common:welcome')}</h1>
      <p>{t('forms:submit')}</p>
    </div>
  );
}
```

### Advanced Features

#### Interpolation

```tsx
// In your translation file: "welcome": "Hello, {{name}}!"
const { t } = useTranslation('common');
return <p>{t('welcome', { name: 'John' })}</p>;
```

#### Pluralization

```tsx
// In your translation file: 
// "items": "{{count}} item",
// "items_plural": "{{count}} items"
const { t } = useTranslation('common');
return <p>{t('items', { count: 5 })}</p>;
```

## Adding New Languages

1. Create a new directory in `apps/frontend/locales/` with the language code (e.g., `fr` for French)
2. Copy the structure from the `en` directory  
3. Translate the content in each JSON file
4. Update the language configuration in `apps/frontend/src/app.config.ts` (add to `LANGUAGES` array)

Note: New languages are automatically detected and served - no build configuration needed.

## Namespace Organization Best Practices

### When to Create a New Namespace

Create a new namespace when:
- You have a distinct feature or page with many translations (e.g., `auth` for all authentication pages)
- Translations are logically grouped and used together (e.g., `header` for header-specific content)
- The namespace will be loaded on-demand for better performance

### Namespace Naming Conventions

- Use lowercase with underscores for multi-word namespaces: `landing_page`, `color_mode_toggle`
- Name namespaces after the feature/component they serve: `auth`, `header`, `footer`
- Keep namespace names concise but descriptive

### Example: Auth Namespace Structure

The `auth.json` namespace demonstrates good organization:

```json
{
  "login": {
    "title": "Sign In",
    "subtitle": "Welcome back!",
    "email_label": "Email",
    "submit_button": "Sign In"
  },
  "register": {
    "title": "Create Account",
    "email_label": "Email",
    "submit_button": "Create Account"
  },
  "common": {
    "loading": "Loading..."
  }
}
```

**Benefits:**
- Related translations grouped by page/feature
- Shared translations in `common` section
- Clear, hierarchical structure
- Easy to maintain and translate

## Best Practices

- Use translation keys that are descriptive and follow a consistent naming convention
- Group related translations in the same namespace (e.g., all auth pages in `auth.json`)
- Use interpolation for dynamic values: `t('hello', { name: 'John' })`
- Consider using pluralization for countable items: `t('items', { count: 5 })`
- Keep translation keys flat when possible to avoid deep nesting (max 2-3 levels)
- Use comments in your translation files to provide context for translators
- Organize by feature/component rather than by type (e.g., `auth.json` not `buttons.json`)
- Share common translations within a namespace using a `common` section

## Troubleshooting

### Development Issues

- **Translations not loading**: Check that namespace exists in `apps/frontend/locales/{lang}/{namespace}.json`
- **404 errors**: Verify the Vite dev server is running and the i18n plugin is configured correctly
- **Hot reload not working**: Translation files are watched automatically - check browser dev tools for errors

### Production Issues

- **Slow loading**: Check network tab - translations should be cached after first load
- **Missing translations**: Ensure build process includes all language files via the `copyTranslationsPlugin`

### General

- **Enable debug mode**: Set `NODE_ENV=development` to see detailed i18next logs
- **Check browser network**: Look for failed HTTP requests to translation endpoints
- **Namespace auto-discovery**: Namespaces are automatically discovered - no manual registration needed
- **Missing translations**: If translations appear as keys (e.g., "auth.login.title"), check that:
  1. The namespace file exists in `locales/{lang}/{namespace}.json`
  2. The translation key path is correct
  3. The namespace is being loaded via `useTranslation('{namespace}')`

### Performance Optimization

- **Critical namespaces**: Update `preloadNamespaces` in `i18n.ts` for immediate loading
- **Bundle analysis**: Monitor bundle size - only English fallbacks should be bundled
- **CDN caching**: Configure appropriate cache headers (default: 1 hour TTL)
