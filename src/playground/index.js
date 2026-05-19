import { mountForm } from "mlform/kit";
import { PLAYGROUND_ACCORDION_LAYOUTS } from "./accordion-layouts.js";
import { createAppPrimitiveRegistry, createAppRegistry } from "./report-definition.js";
import { PLAYGROUND_DESIGN_SYSTEM, PLAYGROUND_LABELS, PRIMITIVE_TEXT } from "./config.js";
import { FORM_SCHEMA } from "./schema.js";
import { PLAYGROUND_TABS_LAYOUTS } from "./tabs-layouts.js";
import { createAggregateTransport, createMockAggregateTransport } from "./transport.js";
import { PLAYGROUND_WIZARD_LAYOUTS } from "./wizard-layouts.js";

const createTransport = (transportMode) =>
  transportMode === "network" ? createAggregateTransport() : createMockAggregateTransport();

const normalizeSinglePageLayout = (layout) =>
  typeof layout === "string" ? { kind: layout } : layout;

export const mountPlayground = (
  container = document.body,
  { layout = "stacked", reportPane = "always", transportMode = "mock" } = {},
) =>
  mountForm(container, {
    schema: FORM_SCHEMA,
    transport: createTransport(transportMode),
    registry: createAppRegistry(),
    primitiveRegistry: createAppPrimitiveRegistry(),
    layout: normalizeSinglePageLayout(layout),
    containerStrategy: "replace",
    reportPane,
    designSystem: PLAYGROUND_DESIGN_SYSTEM,
    labels: PLAYGROUND_LABELS,
    primitiveText: PRIMITIVE_TEXT,
  });

export const mountWizardPlayground = (
  container = document.body,
  { variant = "concise", transportMode = "mock" } = {},
) =>
  mountForm(container, {
    schema: FORM_SCHEMA,
    transport: createTransport(transportMode),
    registry: createAppRegistry(),
    primitiveRegistry: createAppPrimitiveRegistry(),
    layout: PLAYGROUND_WIZARD_LAYOUTS[variant] ?? PLAYGROUND_WIZARD_LAYOUTS.concise,
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

export const mountTabsPlayground = (
  container = document.body,
  { variant = "classic", transportMode = "mock" } = {},
) =>
  mountForm(container, {
    schema: FORM_SCHEMA,
    transport: createTransport(transportMode),
    registry: createAppRegistry(),
    primitiveRegistry: createAppPrimitiveRegistry(),
    layout: PLAYGROUND_TABS_LAYOUTS[variant] ?? PLAYGROUND_TABS_LAYOUTS.classic,
    designSystem: PLAYGROUND_DESIGN_SYSTEM,
    labels: {
      ...PLAYGROUND_LABELS,
      validating: "Validating...",
      submitting: "Running backend comparison...",
    },
    primitiveText: PRIMITIVE_TEXT,
  });

export const mountAccordionPlayground = (
  container = document.body,
  { variant = "classic", transportMode = "mock" } = {},
) =>
  mountForm(container, {
    schema: FORM_SCHEMA,
    transport: createTransport(transportMode),
    registry: createAppRegistry(),
    primitiveRegistry: createAppPrimitiveRegistry(),
    layout: PLAYGROUND_ACCORDION_LAYOUTS[variant] ?? PLAYGROUND_ACCORDION_LAYOUTS.classic,
    designSystem: PLAYGROUND_DESIGN_SYSTEM,
    labels: {
      ...PLAYGROUND_LABELS,
      validating: "Validating...",
      submitting: "Running backend comparison...",
    },
    primitiveText: PRIMITIVE_TEXT,
  });
