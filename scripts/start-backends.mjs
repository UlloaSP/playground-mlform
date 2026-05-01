import http from "node:http";
import { pathToFileURL } from "node:url";
import { BACKENDS, buildBackendResponse } from "../src/playground/shared/model.js";

const HOST = "127.0.0.1";

const sendJson = (response, status, payload) => {
  response.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Content-Type": "application/json",
  });
  response.end(JSON.stringify(payload));
};

const sendNotFound = (response, backend) => {
  sendJson(response, 404, {
    message: `${backend.id} backend route not found.`,
  });
};

const parseJsonBody = async (request) => {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
};

const withCors = (request, response) => {
  if (request.method !== "OPTIONS") {
    return false;
  }

  response.writeHead(204, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  response.end();
  return true;
};

const createRestServer = (backend) =>
  http.createServer(async (request, response) => {
    if (withCors(request, response)) {
      return;
    }

    const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(response, 200, { ok: true, backend: backend.id, protocol: backend.protocol });
      return;
    }

    if (request.method !== "POST" || url.pathname !== backend.path) {
      sendNotFound(response, backend);
      return;
    }

    const body = await parseJsonBody(request);
    sendJson(response, 200, buildBackendResponse(backend, body.inputs ?? {}));
  });

const createGraphqlServer = (backend) =>
  http.createServer(async (request, response) => {
    if (withCors(request, response)) {
      return;
    }

    const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(response, 200, { ok: true, backend: backend.id, protocol: backend.protocol });
      return;
    }

    if (request.method !== "POST" || url.pathname !== backend.path) {
      sendNotFound(response, backend);
      return;
    }

    const body = await parseJsonBody(request);
    sendJson(response, 200, {
      data: {
        predict: buildBackendResponse(backend, body?.variables?.inputs ?? {}),
      },
    });
  });

const createRpcServer = (backend) =>
  http.createServer(async (request, response) => {
    if (withCors(request, response)) {
      return;
    }

    const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(response, 200, { ok: true, backend: backend.id, protocol: backend.protocol });
      return;
    }

    if (request.method !== "POST" || url.pathname !== backend.path) {
      sendNotFound(response, backend);
      return;
    }

    const body = await parseJsonBody(request);
    sendJson(response, 200, {
      jsonrpc: "2.0",
      id: body?.id ?? null,
      result: buildBackendResponse(backend, body?.params?.inputs ?? {}),
    });
  });

const createServerForBackend = (backend) => {
  switch (backend.protocol) {
    case "graphql":
      return createGraphqlServer(backend);
    case "json-rpc":
      return createRpcServer(backend);
    case "rest":
    default:
      return createRestServer(backend);
  }
};

const servers = BACKENDS.map((backend) => ({
  backend,
  server: createServerForBackend(backend),
}));

export const startBackendServers = async () => {
  await Promise.all(
    servers.map(
      ({ backend, server }) =>
        new Promise((resolve, reject) => {
          server.once("error", reject);
          server.listen(backend.port, HOST, () => {
            server.off("error", reject);
            console.log(
              `[backend:${backend.id}] ${backend.protocol} http://${HOST}:${backend.port}${backend.path}`,
            );
            resolve();
          });
        }),
    ),
  );
};

export const stopBackendServers = async () => {
  await Promise.all(
    servers.map(
      ({ server }) =>
        new Promise((resolve) => {
          server.close(() => resolve());
        }),
    ),
  );
};

const isMainModule =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  let shuttingDown = false;

  const shutdown = async (code) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    await stopBackendServers();
    process.exit(code);
  };

  process.on("SIGINT", () => void shutdown(0));
  process.on("SIGTERM", () => void shutdown(0));

  try {
    await startBackendServers();
    console.log("[backends] ready");
  } catch (error) {
    console.error("[backends] failed", error);
    await shutdown(1);
  }
}
