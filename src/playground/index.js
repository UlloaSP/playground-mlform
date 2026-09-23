import { mountForm } from "mlform/kit";
import { BACKEND_COMPARE_PLUGIN, createAppPrimitiveRegistry } from "./report-definition.js";
import { PLAYGROUND_DESIGN_SYSTEM, PLAYGROUND_LABELS, PRIMITIVE_TEXT } from "./config.js";
import { FIELD_COMBINATIONS_SCHEMA } from "./field-combinations-schema.js";
import { FORM_SCHEMA } from "./schema.js";
import { PLAYGROUND_SECTIONED_LAYOUT } from "./section-layouts.js";
import { PLAYGROUND_TABS_LAYOUTS } from "./tabs-layouts.js";
import { createAggregateTransport } from "./transport.js";
import { PLAYGROUND_WIZARD_LAYOUTS } from "./wizard-layouts.js";

const normalizeSinglePageLayout = (layout) =>
  layout === "sectioned" ? PLAYGROUND_SECTIONED_LAYOUT : typeof layout === "string" ? { kind: layout } : layout;

export const mountPlayground = (
  container = document.body,
  layout = "stacked",
  schema = FORM_SCHEMA,
) => {
  return mountForm(container, {
    schema,
    transport: createAggregateTransport(),
    plugins: [BACKEND_COMPARE_PLUGIN],
    primitiveRegistry: createAppPrimitiveRegistry(),
    layout: normalizeSinglePageLayout(layout),
    containerStrategy: "replace",
    reportPane: "always",
    reportFetchMode: "all",
    designSystem: PLAYGROUND_DESIGN_SYSTEM,
    labels: PLAYGROUND_LABELS,
    primitiveText: PRIMITIVE_TEXT,
  });
};

export const mountFieldCombinationsPlayground = (container = document.body) =>
  mountPlayground(container, "split", FIELD_COMBINATIONS_SCHEMA);

export const mountWizardPlayground = (container = document.body) => {
  return mountForm(container, {
    schema: FORM_SCHEMA,
    transport: createAggregateTransport(),
    plugins: [BACKEND_COMPARE_PLUGIN],
    primitiveRegistry: createAppPrimitiveRegistry(),
    layout: PLAYGROUND_WIZARD_LAYOUTS.reports,
    designSystem: PLAYGROUND_DESIGN_SYSTEM,
    reportFetchMode: "all",
    labels: {
      prev: "Back",
      next: "Continue",
      submit: PLAYGROUND_LABELS.submit,
      validating: "Validating…",
      submitting: "Running backend comparison…",
    },
    primitiveText: PRIMITIVE_TEXT,
  });
};

export const mountTabsPlayground = (container = document.body) => {
  return mountForm(container, {
    schema: FORM_SCHEMA,
    transport: createAggregateTransport(),
    plugins: [BACKEND_COMPARE_PLUGIN],
    primitiveRegistry: createAppPrimitiveRegistry(),
    layout: PLAYGROUND_TABS_LAYOUTS.classic,
    designSystem: PLAYGROUND_DESIGN_SYSTEM,
    reportFetchMode: "all",
    labels: {
      ...PLAYGROUND_LABELS,
      validating: "Validating…",
      submitting: "Running backend comparison…",
    },
    primitiveText: PRIMITIVE_TEXT,
  });
};
