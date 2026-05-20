import { BACKENDS, buildBackendResponse } from "./shared/model.js";

export const createAggregateTransport = () => ({
  submit: async (request) => {
    const inputs = request.serializedValues ?? {};

    await new Promise((resolve) => setTimeout(resolve, 220));

    const backends = Object.fromEntries(
      BACKENDS.map((backend) => [
        backend.id,
        { ...buildBackendResponse(backend, inputs), id: backend.id, label: backend.label },
      ]),
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
        backends: BACKENDS.map(({ id, label }) => ({ id, label })),
      },
      raw: {
        backends,
      },
    };
  },
});
