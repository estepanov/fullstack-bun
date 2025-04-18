---
layout: doc
---

# Forms

This project uses [TanStack Forms](https://tanstack.com/form/latest) for form handling. TanStack Forms provides a performant, flexible and extensible forms library with easy-to-use validation.

We use the same zod schema for both API and frontend validation by creating the core schemas in `packages/shared`. 

### Key Features Used:
- Form validation
- Field-level error handling
- Form state management
- Type-safe form handling
- Integration with React components

For more information about TanStack Forms, visit the [official documentation](https://tanstack.com/form/latest).

## Best Practices

- Use Zod schemas for consistent validation between frontend and API. This is what the `shared` package is for.
- Create reusable form components for common field types
- Implement proper error handling and display
- Use field-level validation for immediate feedback
- Consider using form state for conditional rendering
- Implement proper loading and error states for form submission
