import { join, resolve } from "node:path";
import { serve } from "bun";
import { createRequestHandler } from "react-router";

const port = Number(process.env.PORT) || 5173;
const host = process.env.HOST || "0.0.0.0";

// Import the server build
// @ts-expect-error
const build = await import("./build/server/index.js");

// Create the request handler
const handleRequest = createRequestHandler(build, "production");

// Path to static assets
const clientBuildPath = resolve("./build/client");

serve({
  port,
  hostname: host,
  async fetch(request) {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;

      // Serve static assets from build/client
      if (
        pathname.startsWith("/assets/") ||
        pathname.startsWith("/locales/") ||
        pathname === "/favicon.ico" ||
        pathname.endsWith(".png") ||
        pathname.endsWith(".jpg") ||
        pathname.endsWith(".jpeg") ||
        pathname.endsWith(".svg") ||
        pathname.endsWith(".webp") ||
        pathname.endsWith(".ico")
      ) {
        const filePath = join(clientBuildPath, pathname);
        const file = Bun.file(filePath);

        if (await file.exists()) {
          return new Response(file);
        }
        // If file doesn't exist, fall through to 404
        return new Response("Not Found", { status: 404 });
      }

      // Handle all other requests with React Router
      return await handleRequest(request);
    } catch (error) {
      console.error("Error handling request:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
});

console.log(`Server running at http://${host}:${port}`);
