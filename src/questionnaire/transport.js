/**
 * Stub transport for the questionnaire — returns a deterministic mock score
 * derived from the submitted values so the report pane shows live data.
 */
export const createQuestionnaireTransport = () => ({
  submit: async (request) => {
    const values = request.serializedValues ?? {};

    // Simulate a small network delay.
    await new Promise((resolve) => setTimeout(resolve, 400));

    const accuracy = typeof values["accuracy-threshold"] === "number"
      ? values["accuracy-threshold"]
      : 0.5;
    const approved = values["approval"] === true ? 1 : 0;
    const benchmarkCount = Array.isArray(values["benchmark-scores"])
      ? values["benchmark-scores"].length
      : 0;
    const capabilityCount = Array.isArray(values["capability-flags"])
      ? values["capability-flags"].filter((row) => row?.field2 === true).length
      : 0;

    const score = Number(
      (accuracy * 50 + approved * 20 + benchmarkCount * 3 + capabilityCount * 2).toFixed(2),
    );

    return {
      reports: {
        evalScore: {
          value: score,
          execution_time: 0.4,
        },
      },
      meta: {
        stub: true,
        computedAt: new Date().toISOString(),
      },
    };
  },
});
