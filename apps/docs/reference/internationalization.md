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
- Optional CDN support via `VITE_I18N_CDN_URL` environment variable
- Optimized caching headers and lazy loading
- Preloading of critical namespaces for better UX

## Translation Files

You can add or edit translations in `apps/frontend/public/locales/en`. The project follows a namespace-based approach for organizing translations.

### Structure

```
apps/frontend/public/locales/
├── en/
│   ├── common.json
│   ├── forms.json
│   └── pages.json
└── ...
```

### LLM Prompt 

Here is a promt you can use to create translation from a single input:

```
For the attached english files, can you add translations for german, spanish, and french. Please provide a subfke zip file each languages file in its own directory like (de, es, fr)
```

You can unzip the file and extract the new translations to `apps/frontend/locales`.

## Usage in Components

### Basic Usage

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('common');
  
  return <h1>{t('welcome')}</h1>;
}
```

### With Namespaces

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

## CDN Configuration

For production deployments, you can serve translations from a CDN for better performance and global distribution.

### Setup

1. Add your CDN URL to the environment variables:
   ```bash
   VITE_I18N_CDN_URL="https://cdn.example.com"
   ```

2. Deploy your translation files to the CDN at the path: `{CDN_URL}/locales/{language}/{namespace}.json`

3. The application will automatically use the CDN URL in production when configured

### Benefits

- **Global Distribution**: Translations served from edge locations
- **Reduced Server Load**: Static assets offloaded from main application server
- **Better Caching**: CDN-level caching with configurable TTL
- **Scalability**: Independent scaling of translation delivery

## Adding New Languages

1. Create a new directory in `apps/frontend/locales/` with the language code (e.g., `fr` for French)
2. Copy the structure from the `en` directory  
3. Translate the content in each JSON file
4. Update the language configuration in `apps/frontend/src/app.config.ts` (add to `LANGUAGES` array)

Note: New languages are automatically detected and served - no build configuration needed.

## Best Practices

- Use translation keys that are descriptive and follow a consistent naming convention
- Group related translations in the same namespace
- Use interpolation for dynamic values: `t('hello', { name: 'John' })`
- Consider using pluralization for countable items: `t('items', { count: 5 })`
- Keep translation keys flat when possible to avoid deep nesting
- Use comments in your translation files to provide context for translators
- Consider using a translation management system for larger projects

## Troubleshooting

### Development Issues

- **Translations not loading**: Check that namespace exists in `apps/frontend/locales/{lang}/{namespace}.json`
- **404 errors**: Verify the Vite dev server is running and the i18n plugin is configured correctly
- **Hot reload not working**: Translation files are watched automatically - check browser dev tools for errors

### Production Issues

- **CDN translations failing**: Verify `VITE_I18N_CDN_URL` is set correctly and files are deployed to CDN
- **Slow loading**: Check network tab - translations should be cached after first load
- **Missing translations**: Ensure build process includes all language files via the `copyTranslationsPlugin`

### General

- **Enable debug mode**: Set `NODE_ENV=development` to see detailed i18next logs
- **Check browser network**: Look for failed HTTP requests to translation endpoints
- **Namespace registration**: Ensure new namespaces are added to the `ns` array in `i18n.ts`

### Performance Optimization

- **Critical namespaces**: Update `preloadNamespaces` in `i18n.ts` for immediate loading
- **Bundle analysis**: Monitor bundle size - only English fallbacks should be bundled
- **CDN caching**: Configure appropriate cache headers (default: 1 hour TTL)
