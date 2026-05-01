import { createServer as createViteServer } from "vite";
import { startBackendServers, stopBackendServers } from "./start-backends.mjs";

const vite = await createViteServer({
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
});

let shuttingDown = false;

const shutdown = async (code) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  try {
    await vite.close();
  } finally {
    await stopBackendServers();
    process.exit(code);
  }
};

process.on("SIGINT", () => void shutdown(0));
process.on("SIGTERM", () => void shutdown(0));

try {
  await startBackendServers();
  await vite.listen();
  vite.printUrls();
  console.log("[dev] ready");
} catch (error) {
  console.error("[dev] failed", error);
  await shutdown(1);
}
