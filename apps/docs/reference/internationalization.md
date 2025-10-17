---
layout: doc
---

# Internationalization

The frontend has [i18next](https://i18next.com) setup via [react-i18next](https://react.i18next.com) with translations asynchronously loaded.

## Setup Information

This project assumes `en` as the default language and bundles the `en` resources by default. 
This simplifies initial setup while still serving other languages via HTTP requests.
When adding a new namespace file, make sure to add it in `apps/frontend/src/i18n.ts`.

Translations are copied from the `locales` folder to the public folder for development and at build time. 
While this is not an ideal setup, it simplifies the initial configuration.

## Translation Files

You can add or edit translations in `apps/frontend/locales/en`. The project follows a namespace-based approach for organizing translations.

### Structure

```
apps/frontend/locales/
├── en/
│   ├── common.json
│   ├── forms.json
│   └── pages.json
└── ...
```

### LLM Prompt 

Here is a prompt you can use to create translations from a single input:

```
For the attached English files, can you add translations for German, Spanish, and French? Please provide a single zip file with each language's files in its own directory (de, es, fr).
```

You can unzip the file and extract the new translations to `apps/frontend/public/locales`.

## Usage in Components

### Basic Usage

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('common');
  
  return <h1>{t('welcome')}</h1>;
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

1. Create a new directory in `apps/frontend/public/locales/` with the language code (e.g., `fr` for French)
2. Copy the structure from the `en` directory
3. Translate the content in each JSON file
4. Update the language configuration in `apps/frontend/src/i18n.ts`

## Best Practices

- Use translation keys that are descriptive and follow a consistent naming convention
- Group related translations in the same namespace
- Use interpolation for dynamic values: `t('hello', { name: 'John' })`
- Consider using pluralization for countable items: `t('items', { count: 5 })`
- Keep translation keys flat when possible to avoid deep nesting
- Use comments in your translation files to provide context for translators
- Consider using a translation management system for larger projects

## Troubleshooting

- If translations aren't loading, check that the namespace is correctly registered in `i18n.ts` and try restarting server.
- Verify that the translation files are correctly copied to the public folder
- Use the debug mode (enabled in development) to see detailed i18next logs
