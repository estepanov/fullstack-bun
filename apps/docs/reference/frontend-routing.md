---
layout: doc
---

# Frontend Routing

This project uses [React Router](https://reactrouter.com) for client-side routing.

You can edit the configuration `apps/frontend/react-router.config.ts` to pre-render specific routes
or work to enable SSR.

You can add or edit routes in `apps/frontend/src/routes.ts`.


## Best Practices

- Keep route components focused on layout and composition
- Use lazy loading for routes that aren't immediately needed
- Implement proper error boundaries for each route
- Use consistent naming conventions for route components
- Consider using route-based code splitting for better performance
