# VS Code DevContainer Setup

This directory contains the configuration for developing the fullstack-bun monorepo in a VS Code DevContainer. The devcontainer provides a consistent, isolated development environment with all necessary tools and services pre-configured.

## What is a DevContainer?

A DevContainer is a Docker-based development environment that runs inside VS Code. It provides:
- Consistent development environment across all team members
- Isolated workspace that doesn't pollute your host machine
- Pre-configured tools, extensions, and services (Git, GitHub CLI, Docker-in-Docker, Oh My Zsh)
- Instant onboarding for new developers
- PostgreSQL and Redis services automatically started from docker-compose.yml

## Quick Start

### Prerequisites
- [Visual Studio Code](https://code.visualstudio.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Dev Containers Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Opening the Project in DevContainer

1. Open this project in VS Code
2. When prompted, click **"Reopen in Container"**
   - Or use Command Palette (Cmd/Ctrl+Shift+P) → "Dev Containers: Reopen in Container"
3. Wait for the container to build and initialize (first time takes 5-10 minutes)
4. Once ready, you'll have a fully configured development environment!

## Available Services

The devcontainer automatically starts these services:

| Service | Port | Description |
|---------|------|-------------|
| **API** | 3001 | Backend API server |
| **Frontend** | 5173 | Frontend React application |
| **Frontend HMR** | 5174 | Hot Module Replacement |
| **Admin** | 5175 | Admin React application |
| **Admin HMR** | 5176 | Hot Module Replacement |
| **PostgreSQL** | 5432 | Database server |
| **Redis** | 6379 | Cache and session store |
| **Storybook** | 4173 | Component documentation |

## Common Commands

### Using VS Code Tasks
Press `Cmd/Ctrl+Shift+P` → "Tasks: Run Task" to access:

- **Start All Services** - Runs API, Frontend, and Admin concurrently
- **Start API** - Run only the API server
- **Start Frontend** - Run only the Frontend app
- **Start Admin** - Run only the Admin app
- **Start Storybook** - Run Storybook for component development
- **Run Database Migrations** - Apply database migrations
- **Open Database Studio** - Open Drizzle Studio for database management
- **Run Tests** - Execute all tests
- **Run Tests with Coverage** - Execute tests with coverage report
- **Lint All** - Run linting across all packages
- **Format All** - Format all code with Biome
- **Build All** - Build all applications for production

### Terminal Commands

```bash
# Start all services (API, Frontend, Admin)
bun run dev

# Start individual services
bun --filter=api dev
bun --filter=frontend dev
bun --filter=admin dev

# Run tests
bun run test
bun run test:coverage

# Linting and formatting
bun run lint
bun run format

# Database operations
cd apps/api
bun run db:migrate
bun run db:studio

# Build for production
bun run build
```

## Debugging

The devcontainer comes with pre-configured debug configurations:

1. Open the **Run and Debug** panel (Cmd/Ctrl+Shift+D)
2. Select a configuration:
   - **Debug API** - Debug the API server with hot reload
   - **Debug Frontend** - Debug the Frontend application
   - **Debug Admin** - Debug the Admin application
   - **Test Current File** - Debug the currently open test file
   - **Test All** - Debug all tests
3. Press **F5** or click the green play button

Set breakpoints by clicking in the gutter next to line numbers.

## Installed Extensions

The devcontainer automatically installs these VS Code extensions:

- **Biome** - Fast formatter and linter
- **Bun for VS Code** - Bun runtime support
- **Tailwind CSS IntelliSense** - Autocomplete for Tailwind classes
- **Docker** - Docker container management
- **GitLens** - Git supercharged
- **Error Lens** - Inline error highlighting
- **Code Spell Checker** - Catch typos in code
- **IntelliCode** - AI-assisted development
- **Todo Tree** - Highlight TODO comments
- **Material Icon Theme** - Better file icons

## Environment Variables

Environment variables are automatically configured in the container:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `NODE_ENV` - Set to `development`
- `VITE_API_BASE_URL` - API URL for frontend apps
- All other variables from `.env` file

The post-create script automatically creates a `.env` file if it doesn't exist.

## Hot Reload

All applications support hot reload:
- **API**: Changes to TypeScript files automatically restart the server
- **Frontend/Admin**: Changes trigger Vite HMR for instant updates
- **Packages**: Changes in shared packages trigger rebuilds

## Troubleshooting

### Container fails to start
- Ensure Docker Desktop is running
- Check that ports 3001, 5173, 5175, 5432, 6379 are not in use on your host
- Try rebuilding: Command Palette → "Dev Containers: Rebuild Container"

### Database connection errors
- Wait for PostgreSQL to be fully healthy (check post-start script output)
- Verify `DATABASE_URL` environment variable is correct
- Test connection: `bun -e "import postgres from 'postgres'; const sql = postgres(process.env.DATABASE_URL); sql\`SELECT 1\`.then(console.log).finally(() => sql.end());"`

### Redis connection errors
- Verify Redis is running: `redis-cli -h redis -p 6379 -a redispassword ping`
- Check `REDIS_URL` environment variable

### Hot reload not working
- On Linux, you may need to increase file watcher limits:
  ```bash
  echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
  ```
- Restart the dev server

### Permission errors
- The container runs as `bunapp` user (non-root)
- File permissions should be automatically mapped to your host user
- If issues persist, rebuild with: "Dev Containers: Rebuild Container Without Cache"

### Slow performance
- **macOS/Windows**: Use named volumes for `node_modules` (already configured)
- Ensure Docker Desktop has sufficient resources (Settings → Resources)
- Consider increasing memory allocation to at least 4GB

### Ports not forwarding
- Check the "Ports" tab in VS Code terminal panel
- Manually forward a port: Right-click in Ports tab → "Forward Port"
- Verify services are running: `ps aux | grep bun`

## Customization

### Adding VS Code Extensions
Edit `.devcontainer/devcontainer.json` and add to the `customizations.vscode.extensions` array.

### Installing Additional Tools
Edit `.devcontainer/scripts/post-create.sh` to run additional setup commands.

### Modifying Services
Edit `docker-compose.devcontainer.yml` to:
- Add new services
- Change environment variables
- Modify resource limits

### Dotfiles
The devcontainer supports dotfiles repositories. Set your dotfiles repo in VS Code settings:
```json
{
  "dotfiles.repository": "your-username/dotfiles"
}
```

## Files Overview

```
.devcontainer/
├── devcontainer.json              # Main configuration
├── ../docker-compose.devcontainer.yml # Workspace service definition
├── scripts/
│   ├── post-create.sh            # Runs once on container creation
│   └── post-start.sh             # Runs on every container start
├── .zsh_history                  # Persisted shell history
└── README.md                     # This file
```

## GitHub Codespaces

This devcontainer configuration is compatible with GitHub Codespaces. To use:

1. Go to your repository on GitHub
2. Click "Code" → "Codespaces" → "Create codespace on main"
3. Wait for the environment to initialize
4. Start developing in your browser!

## Additional Resources

- [VS Code DevContainers Documentation](https://code.visualstudio.com/docs/devcontainers/containers)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Bun Documentation](https://bun.sh/docs)
- [Project Documentation](https://fullstackbun.dev)

## Support

If you encounter issues with the devcontainer setup:
1. Check this troubleshooting guide
2. Review the [Docker documentation](apps/docs/docker.md)
3. Open an issue on GitHub with:
   - Error messages from post-create/post-start scripts
   - Docker Desktop version
   - Operating system
   - Steps to reproduce
