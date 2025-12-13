---
layout: doc
---

# Get Started

## Prerequisites

You will need to have the following installed your machine:

- Git
- [Bun](https://bun.sh)

## Start the projects

How to get started, a very rough initial guide.

1. Clone the repo:

```sh
git clone git@github.com:estepanov/fullstack-bun.git
```

2. Open project:

```sh
cd fullstack-bun
```

3. Install dependencies:

```sh
bun install
```

4. Run setup command

```sh
bun run setup
```

The setup commmand currently just copies `.env.example` to `.env` in the front and backend projects. 

Add the following to `apps/api/.env`:

```txt
CORS_ALLOWLISTED_ORIGINS="http://localhost:3000"
PORT="3001"
NODE_ENV="development"
```

Add the following to `apps/frontend/.env`:

```txt
VITE_API_BASE_URL="http://localhost:3001"
NODE_ENV="development"
```

To learn more about specific variables visit the [environment variables reference page](/reference/environment-variables.md).

5. Start the app

To launch BOTH the frontend and backend you can run the dev command in the root of the project

```sh
bun run dev
```

6. Tada! Open [http://localhost:3000](http://localhost:3000) to see the app!
