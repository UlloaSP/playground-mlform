import { MATERIAL_CATALOG } from "./material-catalog.js";
import { buildPrediction } from "./prediction.js";

export const createFormulationTransport = () => ({
  async submit(request) {
    const serializedValues = { ...(request.serializedValues ?? {}) };
    serializedValues.materials = MATERIAL_CATALOG.map((material) => ({
      material_id: material.id,
      proportion_w_w: Number(serializedValues[material.id] ?? 0),
    }));

    const prediction = buildPrediction(serializedValues);

    return {
      reports: {
        prediction,
      },
      meta: {
        generatedAt: new Date().toISOString(),
        profile: "mock-v1",
      },
      raw: prediction,
    };
  },
});
