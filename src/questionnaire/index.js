import { defaultKitDesignSystem, mountForm } from "mlform/kit";
import { QUESTIONNAIRE_SCHEMA } from "./schema.js";
import { createQuestionnaireTransport } from "./transport.js";

const DESIGN_SYSTEM = {
  ...defaultKitDesignSystem,
  recipe: "default",
  theme: "airbnb",
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
  mountForm(container, {
    schema: {
      fields: QUESTIONNAIRE_SCHEMA.steps.flatMap((step) => step.fields),
      reports: [
        {
          id: "evalScore",
          kind: "regressor",
          label: "Evaluation score",
          unit: "pts",
          precision: 2,
        },
      ],
      explanations: [],
    },
    layout: {
      kind: "wizard",
      steps: QUESTIONNAIRE_SCHEMA.steps.map((step, index) => ({
        id: step.id,
        title: step.title,
        description: step.description,
        children: [
          ...step.fields.map((field) => ({
            kind: "field",
            field: field.id,
          })),
          ...(index === QUESTIONNAIRE_SCHEMA.steps.length - 1
            ? [{ kind: "report", report: "evalScore" }]
            : []),
        ],
      })),
    },
    transport: createQuestionnaireTransport(),
    designSystem: DESIGN_SYSTEM,
    labels: LABELS,
    text: TEXT,
    primitiveText: PRIMITIVE_TEXT,
  });
