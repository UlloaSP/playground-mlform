import { createMlRegistryPack } from "mlform/builtins-ml";
import { defineReportDefinition } from "mlform/schema";
import { z } from "zod";

const baseReportSchema = {
  id: z.string().optional(),
  label: z.string().optional(),
  description: z.string().optional(),
  source: z.string().optional(),
  ui: z.record(z.string(), z.unknown()).optional(),
};

const formulationPredictionReportDefinition = defineReportDefinition({
  kind: "formulation-prediction",
  schema: z.object({
    kind: z.literal("formulation-prediction"),
    ...baseReportSchema,
  }),
  resolvePayload(config, context) {
    return context.result.reports[config.source ?? "prediction"];
  },
});

const formulationPredictionReportPresenter = {
  kind: "formulation-prediction",
  describe(config, context) {
    if (context.state.status === "idle" && context.payload === undefined) {
      return null;
    }

    return {
      component: "formulation-prediction-report",
      props: {
        id: context.reportId,
        kind: config.kind,
        label: config.label ?? "Prediction",
        description: config.description ?? "",
        payload: context.payload,
        error: context.state.error,
        state: context.state.status,
      },
    };
  },
};

export const createFormulationRegistryPack = () => {
  const pack = createMlRegistryPack();
  pack.registry.registerReport(formulationPredictionReportDefinition);
  pack.descriptorRegistry.registerReport(formulationPredictionReportPresenter);
  return pack;
};
