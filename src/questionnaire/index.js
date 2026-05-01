import { mountQuestionnaire } from "mlform/questionnaire";
import { defaultKitDesignSystem } from "mlform";
import { QUESTIONNAIRE_SCHEMA } from "./schema.js";
import { createQuestionnaireTransport } from "./transport.js";

const DESIGN_SYSTEM = {
  ...defaultKitDesignSystem,
  recipe: "default",
  theme: "cobalt",
  mode: "light",
};

const LABELS = {
  prev: "Back",
  next: "Continue",
  submit: "Run evaluation",
  validating: "Validating...",
  submitting: "Submitting...",
};

const TEXT = {
  stepLabel: (current, total) => `Step ${current} / ${total}`,
};

const PRIMITIVE_TEXT = {
  formEyebrow: "Questionnaire",
  categoryPlaceholder: "Select an option",
  booleanTrue: "Yes",
  booleanFalse: "No",
  formErrorsTitle: "Validation issues",
  helpActionGlyph: "?",
  formStatusLabel: (status) => status.toUpperCase(),
  seriesAddRow: "Add row",
  seriesRemoveRow: "Remove row",
  seriesEmpty: "No rows yet. Add the first one above.",
};

export const mountAppQuestionnaire = (container = document.body) =>
  mountQuestionnaire(container, {
    schema: QUESTIONNAIRE_SCHEMA,
    transport: createQuestionnaireTransport(),
    designSystem: DESIGN_SYSTEM,
    labels: LABELS,
    text: TEXT,
    primitiveText: PRIMITIVE_TEXT,
  });
