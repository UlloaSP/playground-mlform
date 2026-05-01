import { createFanoutTransport, createJsonTransport, pipe, withRetry, withTimeout } from "mlform";
import { BACKENDS, buildBackendResponse, getBackendUrl } from "./shared/model.js";

const isRecord = (value) => typeof value === "object" && value !== null;

const normalizeBackendResponse = (backend, response) => {
  const payload = isRecord(response) ? response : {};

  return {
    id: backend.id,
    label: backend.label,
    reports: isRecord(payload.reports) ? payload.reports : {},
    meta: isRecord(payload.meta) ? payload.meta : {},
    raw: isRecord(payload) && "raw" in payload ? payload.raw : payload,
  };
};

const parseGraphqlResponse = async (response) => {
  const payload = await response.json();
  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    throw new Error(payload.errors.map((entry) => entry.message).join("; "));
  }

  return payload?.data?.predict ?? null;
};

const parseRpcResponse = async (response) => {
  const payload = await response.json();
  if (payload?.error) {
    throw new Error(payload.error.message ?? "JSON-RPC backend failed.");
  }

  return payload?.result ?? null;
};

const GRAPHQL_QUERY = `
	mutation Predict($inputs: JSON!) {
		predict(inputs: $inputs) {
			reports
			meta
			raw
		}
	}
`;

const createRestTransport = (backend) =>
  createJsonTransport({
    endpoint: getBackendUrl(backend),
    source: backend.id,
  });

const createGraphqlTransport = (backend) =>
  createJsonTransport({
    endpoint: getBackendUrl(backend),
    source: backend.id,
    body: (request) =>
      JSON.stringify({
        query: GRAPHQL_QUERY,
        variables: {
          inputs: request.serializedValues,
        },
      }),
    parse: parseGraphqlResponse,
  });

const createRpcTransport = (backend) =>
  createJsonTransport({
    endpoint: getBackendUrl(backend),
    source: backend.id,
    body: (request) =>
      JSON.stringify({
        jsonrpc: "2.0",
        id: `${backend.id}-${Date.now()}`,
        method: "predict",
        params: {
          inputs: request.serializedValues,
        },
      }),
    parse: parseRpcResponse,
  });

const createProtocolTransport = (backend) => {
  switch (backend.protocol) {
    case "graphql":
      return createGraphqlTransport(backend);
    case "json-rpc":
      return createRpcTransport(backend);
    case "rest":
    default:
      return createRestTransport(backend);
  }
};

const createBackendTransport = (backend) =>
  pipe(
    createProtocolTransport(backend),
    withTimeout(4_000),
    withRetry({
      attempts: 2,
      baseDelay: 120,
      allowUnsafeRetry: true,
    }),
  );

export const createAggregateTransport = () =>
  createFanoutTransport({
    transports: Object.fromEntries(
      BACKENDS.map((backend) => [backend.id, createBackendTransport(backend)]),
    ),
    merge({ results, failures }) {
      const backends = Object.fromEntries(
        results.map((result) => {
          const backend = BACKENDS.find((candidate) => candidate.id === result.id);
          if (!backend) {
            throw new Error(`Unknown backend "${String(result.id)}" in fanout merge.`);
          }

          return [backend.id, normalizeBackendResponse(backend, result.response)];
        }),
      );
      const reports = {};

      for (const backend of BACKENDS) {
        const backendReports = backends[backend.id]?.reports ?? {};
        for (const [reportKey, payload] of Object.entries(backendReports)) {
          reports[`${backend.id}.${reportKey}`] = payload;
        }
      }

      return {
        reports,
        meta: {
          aggregatedAt: new Date().toISOString(),
          backends: BACKENDS.map(({ id, label, protocol }) => ({
            id,
            label,
            protocol,
          })),
          failures: failures.map((failure) => ({
            id: failure.id,
            index: failure.index,
            message: failure.error instanceof Error ? failure.error.message : String(failure.error),
          })),
        },
        raw: {
          backends,
        },
      };
    },
  });

export const createMockAggregateTransport = () => ({
  submit: async (request) => {
    const inputs = request.serializedValues ?? {};

    await new Promise((resolve) => setTimeout(resolve, 220));

    const backends = Object.fromEntries(
      BACKENDS.map((backend) => [backend.id, { ...buildBackendResponse(backend, inputs), id: backend.id, label: backend.label }]),
    );
    const reports = {};

    for (const backend of BACKENDS) {
      const backendReports = backends[backend.id]?.reports ?? {};
      for (const [reportKey, payload] of Object.entries(backendReports)) {
        reports[`${backend.id}.${reportKey}`] = payload;
      }
    }

    return {
      reports,
      meta: {
        aggregatedAt: new Date().toISOString(),
        mock: true,
        backends: BACKENDS.map(({ id, label, protocol }) => ({
          id,
          label,
          protocol,
        })),
      },
      raw: {
        backends,
      },
    };
  },
});
