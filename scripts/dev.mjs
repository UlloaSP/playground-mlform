import { createServer as createViteServer } from "vite";

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
    process.exit(code);
  }
};

process.on("SIGINT", () => void shutdown(0));
process.on("SIGTERM", () => void shutdown(0));

try {
  await vite.listen();
  vite.printUrls();
  console.log("[dev] ready");
} catch (error) {
  console.error("[dev] failed", error);
  await shutdown(1);
}
