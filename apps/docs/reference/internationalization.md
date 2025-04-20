---
layout: doc
---

# Internationalization

The frontend has [i18next](https://i18next.com) setup via [react-i18next](https://react.i18next.com). With translations asynchronously loaded.

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

You can unzip the file and extract the new translations to `apps/frontend/public/locales`

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
