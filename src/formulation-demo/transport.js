import { MATERIAL_CATALOG } from "./material-catalog.js";
import { buildPrediction } from "./prediction.js";

export const createFormulationTransport = () => ({
  async submit(request) {
    const modelValues = { ...request.modelValues };
    modelValues.materials = MATERIAL_CATALOG.map((material) => ({
      material_id: material.id,
      proportion_w_w: Number(modelValues[material.id] ?? 0),
    }));

    const prediction = buildPrediction(modelValues);

    return {
      reports: [{ mappedTo: "prediction", payload: prediction }],
      meta: {
        generatedAt: new Date().toISOString(),
        profile: "mock-v1",
      },
      raw: prediction,
    };
  },
});
