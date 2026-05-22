import { mountForm } from "mlform/kit";
import { createAppPrimitiveRegistry, createAppRegistryPack } from "./report-definition.js";
import { PLAYGROUND_DESIGN_SYSTEM, PLAYGROUND_LABELS, PRIMITIVE_TEXT } from "./config.js";
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
) => {
  const pack = createAppRegistryPack();
  return mountForm(container, {
    schema: FORM_SCHEMA,
    transport: createAggregateTransport(),
    registry: pack.registry,
    presentationRegistry: pack.presentationRegistry,
    behaviors: pack.behaviors,
    primitiveRegistry: createAppPrimitiveRegistry(),
    layout: normalizeSinglePageLayout(layout),
    containerStrategy: "replace",
    reportPane: "always",
    designSystem: PLAYGROUND_DESIGN_SYSTEM,
    labels: PLAYGROUND_LABELS,
    primitiveText: PRIMITIVE_TEXT,
  });
};

export const mountWizardPlayground = (container = document.body) => {
  const pack = createAppRegistryPack();
  return mountForm(container, {
    schema: FORM_SCHEMA,
    transport: createAggregateTransport(),
    registry: pack.registry,
    presentationRegistry: pack.presentationRegistry,
    behaviors: pack.behaviors,
    primitiveRegistry: createAppPrimitiveRegistry(),
    layout: PLAYGROUND_WIZARD_LAYOUTS.reports,
    designSystem: PLAYGROUND_DESIGN_SYSTEM,
    labels: {
      prev: "Back",
      next: "Continue",
      submit: PLAYGROUND_LABELS.submit,
      validating: "Validating...",
      submitting: "Running backend comparison...",
    },
    primitiveText: PRIMITIVE_TEXT,
  });
};

export const mountTabsPlayground = (container = document.body) => {
  const pack = createAppRegistryPack();
  return mountForm(container, {
    schema: FORM_SCHEMA,
    transport: createAggregateTransport(),
    registry: pack.registry,
    presentationRegistry: pack.presentationRegistry,
    behaviors: pack.behaviors,
    primitiveRegistry: createAppPrimitiveRegistry(),
    layout: PLAYGROUND_TABS_LAYOUTS.classic,
    designSystem: PLAYGROUND_DESIGN_SYSTEM,
    labels: {
      ...PLAYGROUND_LABELS,
      validating: "Validating...",
      submitting: "Running backend comparison...",
    },
    primitiveText: PRIMITIVE_TEXT,
  });
};
