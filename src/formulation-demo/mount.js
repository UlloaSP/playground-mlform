import { createFormView, defaultKitLabels } from "mlform/kit";
import { primitiveStaticText } from "mlform/primitives";
import { FORMULATION_EXAMPLES, getExampleById } from "./examples.js";
import { MATERIAL_CATALOG, getMaterialFieldId, getMaterialOptionLabel } from "./material-catalog.js";
import { createFormulationPrimitiveRegistry } from "./primitive-registry.js";
import { createFormulationRegistry } from "./registry.js";
import { createFormulationSchema } from "./schema.js";
import { createFormulationTransport } from "./transport.js";

const FIELD_FRAME_TAG = "mlf-field-frame";
const REPORT_FRAME_TAG = "mlf-report-frame";

const PRIMITIVE_TEXT = {
  ...primitiveStaticText,
  formEyebrow: "Formulation",
  reportEyebrow: "Prediction",
  reportsEmptyTitle: "Prediction pending",
  reportsEmptyBody: "Complete formulation and submit to generate prediction.",
  formErrorsTitle: "Validation issues",
  formStatusLabel: (status) => status.toUpperCase(),
  reportStatusLabel: (status) => status.toUpperCase(),
  categoryPlaceholder: "Select an option",
};

const FORM_LABELS = {
  ...defaultKitLabels,
  submit: "Complete Prediction",
  validating: "Validating...",
  submitting: "Running prediction...",
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const MATERIAL_FIELD_IDS = MATERIAL_CATALOG.map((material) => getMaterialFieldId(material.id));

const getMaterialTotal = (values) =>
  MATERIAL_CATALOG.reduce((sum, material) => sum + Number(values[getMaterialFieldId(material.id)] ?? 0), 0);

const getActiveMaterials = (values) =>
  MATERIAL_CATALOG.map((material) => ({
    ...material,
    fieldId: getMaterialFieldId(material.id),
    value: Number(values[getMaterialFieldId(material.id)] ?? 0),
  })).filter((material) => Math.abs(material.value) > 0.0001);

const createShell = () => {
  const page = document.createElement("main");
  page.className = "fd-shell";
  page.innerHTML = `
    <div class="fd-page">
      <section class="fd-card fd-top-card">
        <button class="fd-top-toggle" type="button" aria-expanded="true">
          <div>
            <h1>Load an example</h1>
            <p>Select an example</p>
          </div>
          <span class="fd-top-caret is-open" aria-hidden="true">^</span>
        </button>
        <div class="fd-top-body">
          <div class="fd-top-form">
            <label class="fd-host-field">
              <span>Select an example</span>
              <select data-role="example-select"></select>
            </label>
            <button class="fd-host-button" type="button" data-role="load-example">
              Load materials
              <span aria-hidden="true">⚗</span>
            </button>
          </div>
        </div>
      </section>
      <section class="fd-form-shell">
        <div class="fd-form-host" data-role="form-host"></div>
      </section>
    </div>
  `;
  return page;
};

const populateExampleSelect = (select, selectedId) => {
  select.replaceChildren(
    ...FORMULATION_EXAMPLES.map((example) => {
      const option = document.createElement("option");
      option.value = example.id;
      option.textContent = example.label;
      option.selected = example.id === selectedId;
      return option;
    }),
  );
};

const createValidators = () => [
  ({ values }) => {
    const total = getMaterialTotal(values);
    const activeCount = getActiveMaterials(values).length;

    if (activeCount === 0) {
      return { form: ["Add at least one material before prediction."] };
    }

    if (Math.abs(total - 100) > 0.001) {
      return {
        form: [`Current materials must total exactly 100% w/w before prediction. Current total ${total.toFixed(2)}.`],
      };
    }

    return undefined;
  },
];

const createLayout = () => ({
  kind: "stacked",
  children: [
    {
      kind: "section",
      id: "form-column",
      children: [
        {
          kind: "section",
          id: "materials-section",
          title: "Materials",
          description: "Model uses all possible materials. Every material starts at 0 and total must sum 100% w/w.",
          children: MATERIAL_CATALOG.map((material) => ({
            kind: "field",
            field: getMaterialFieldId(material.id),
          })),
        },
        {
          kind: "section",
          id: "params-section",
          title: "Other parameters",
          description: "Extrusion & printing",
          children: [
            {
              kind: "group",
              id: "params-grid",
              columns: 3,
              children: [
                { kind: "field", field: "extruderbrand" },
                { kind: "field", field: "extrusionspeed" },
                { kind: "field", field: "printerbrand" },
                { kind: "field", field: "platetemperature" },
                { kind: "field", field: "printingspeed" },
                { kind: "field", field: "objecttype" },
                { kind: "field", field: "shape" },
                { kind: "field", field: "surfacearea" },
                { kind: "field", field: "volume" },
                { kind: "field", field: "mediavolume" },
                { kind: "field", field: "mediaph" },
              ],
            },
          ],
        },
        {
          kind: "section",
          id: "prediction-section",
          title: "Prediction",
          children: [{ kind: "report", report: "prediction" }],
        },
      ],
    },
  ],
});

const createView = (initialValues) =>
  createFormView({
    schema: createFormulationSchema(),
    transport: createFormulationTransport(),
    registry: createFormulationRegistry(),
    initialValues,
    validators: createValidators(),
    layout: createLayout(),
  });

const resolveReportDescriptor = (report) => {
  if (report.descriptor) {
    return report.descriptor;
  }

  if (report.kind === "formulation-prediction") {
    return {
      component: "formulation-prediction-report",
      props: {
        id: report.id,
        kind: report.kind,
        label: report.config.label ?? "Prediction",
        description: report.config.description ?? "",
        payload: report.state.payload,
        error: report.state.error,
        state: report.state.status,
      },
    };
  }

  return null;
};

const renderFieldFrame = (field, registry) => {
  const element = document.createElement(FIELD_FRAME_TAG);
  element.controller = field.controller;
  element.descriptor = field.descriptor;
  element.registry = registry;
  element.text = PRIMITIVE_TEXT;
  return element;
};

const renderReportFrame = (report, registry, lastResult) => {
  const descriptor = resolveReportDescriptor(report);

  if (!descriptor) {
    const fallback = document.createElement("pre");
    fallback.className = "fd-report-debug";
    fallback.textContent = JSON.stringify(
      {
        id: report.id,
        kind: report.kind,
        state: report.state,
        descriptor: report.descriptor,
      },
      null,
      2,
    );
    return fallback;
  }

  const element = document.createElement(REPORT_FRAME_TAG);
  element.controller = report.controller;
  element.descriptor = descriptor;
  element.registry = registry;
  element.text = PRIMITIVE_TEXT;
  element.lastResult = lastResult;
  return element;
};

const createMaterialsPanel = (snapshot, view) => {
  const panel = document.createElement("section");
  panel.className = "fd-materials-panel";

  const values = snapshot.form.values;
  const activeMaterials = getActiveMaterials(values);
  const availableMaterials = MATERIAL_CATALOG.filter(
    (material) => !activeMaterials.some((entry) => entry.id === material.id),
  );
  const firstAvailable = availableMaterials[0];
  const total = getMaterialTotal(values);
  const totalClass =
    Math.abs(total - 100) < 0.001 ? "good" : total > 100 ? "bad" : "warn";

  panel.innerHTML = `
    <style>
      .fd-materials-panel,.fd-materials-panel *{box-sizing:border-box}
      .fd-materials-panel{display:grid;gap:1rem}
      .fd-materials-split{display:grid;gap:1rem;grid-template-columns:minmax(260px,.78fr) minmax(360px,1.22fr);align-items:start}
      .fd-material-card{display:grid;gap:.9rem;padding:1rem;border:1px solid color-mix(in srgb,var(--mlf-color-border,#d9dce7) 88%,transparent);border-radius:1rem;background:color-mix(in srgb,var(--mlf-color-surface,#fff) 96%,transparent)}
      .fd-material-card.current{grid-template-rows:auto minmax(0,1fr);min-height:0}
      .fd-material-heading{margin:0;text-align:center;font-size:1.85rem;font-weight:500}
      .fd-material-sub{margin:0;text-align:center;color:var(--mlf-color-text-muted,#5f5a87)}
      .fd-material-grid{display:grid;gap:.9rem;grid-template-columns:1fr 140px}
      .fd-material-label{display:grid;gap:.35rem}
      .fd-material-label span{text-align:center;font-size:.95rem;color:var(--mlf-color-text,#2c2847)}
      .fd-material-label select,.fd-material-label input{width:100%;min-height:var(--mlf-control-height,3rem);padding:.7rem .95rem;border-radius:var(--mlf-input-radius,12px);border:1px solid var(--mlf-color-border,#d9dce7);background:var(--mlf-color-surface,#fff);color:var(--mlf-color-text,#2c2847);font:inherit}
      .fd-material-add{justify-self:center;display:inline-flex;align-items:center;gap:.65rem;padding:.72rem 1rem;border:0;border-radius:.45rem;background:#5f5f63;color:#fff;cursor:pointer}
      .fd-material-toolbar{display:flex;align-items:center;justify-content:space-between;gap:1rem}
      .fd-material-badge{display:inline-flex;align-items:center;justify-content:center;padding:.28rem .7rem;border-radius:999px;font-size:.92rem;font-weight:700}
      .fd-material-badge.good{background:rgba(121,226,123,.2);color:#16702a}
      .fd-material-badge.warn{background:rgba(255,195,60,.18);color:#8f5a00}
      .fd-material-badge.bad{background:rgba(239,64,73,.16);color:#b21f28}
      .fd-material-danger{border:0;border-radius:.4rem;background:#ef4049;color:#fff;padding:.72rem .95rem;cursor:pointer}
      .fd-material-list{display:grid;gap:.8rem;max-height:34rem;overflow:auto;padding-right:.25rem}
      .fd-material-row{display:grid;gap:.8rem;padding:.9rem;border-radius:.8rem;border:1px solid color-mix(in srgb,var(--mlf-color-border,#d9dce7) 88%,transparent)}
      .fd-material-top{display:flex;align-items:center;justify-content:space-between;gap:.7rem}
      .fd-material-name{flex:1;text-align:center;color:var(--mlf-color-text,#2c2847)}
      .fd-material-remove{border:0;background:transparent;cursor:pointer}
      .fd-material-controls{display:grid;gap:.9rem;align-items:center;grid-template-columns:1fr 112px}
      .fd-material-range{width:100%;accent-color:#8f8cd2}
      .fd-material-mini{display:grid;justify-items:center;gap:.3rem}
      .fd-material-mini input{width:100%;min-height:2.85rem;padding:.45rem .7rem;border-radius:.55rem;border:1px solid var(--mlf-color-border,#d9dce7)}
      .fd-material-mini span{font-size:.84rem;color:var(--mlf-color-text-muted,#5f5a87)}
      .fd-material-empty{padding:.9rem 1rem;border-radius:.8rem;border:1px dashed var(--mlf-color-border,#d9dce7);text-align:center;color:var(--mlf-color-text-muted,#5f5a87)}
      @media (max-width:860px){.fd-materials-split,.fd-material-grid,.fd-material-controls{grid-template-columns:1fr}.fd-material-toolbar{flex-direction:column;align-items:stretch}}
    </style>
    <div class="fd-materials-split">
      <section class="fd-material-card current">
        <h3 class="fd-material-heading">Materials</h3>
        <p class="fd-material-sub">Select a material</p>
        <div class="fd-material-grid">
          <label class="fd-material-label">
            <span>Select a material</span>
            <select data-role="material-select">
              ${
                availableMaterials.length === 0
                  ? '<option value="">No more materials</option>'
                  : availableMaterials
                      .map(
                        (material) => `<option value="${escapeHtml(material.id)}"${
                          material.id === firstAvailable?.id ? " selected" : ""
                        }>${escapeHtml(getMaterialOptionLabel(material.id))}</option>`,
                      )
                      .join("")
              }
            </select>
          </label>
          <label class="fd-material-label">
            <span>Proportion (w/w)</span>
            <input data-role="draft-proportion" type="number" min="0" max="100" step="1" value="0" />
          </label>
        </div>
        <button class="fd-material-add" type="button" data-role="add-material"${
          availableMaterials.length === 0 ? " disabled" : ""
        }>Add material <strong>+</strong></button>
      </section>
      <section class="fd-material-card">
        <div class="fd-material-toolbar">
          <button class="fd-submit-button" type="button" data-role="submit-inline"></button>
          <h3 class="fd-material-heading">Current Materials</h3>
          <div class="fd-material-badge ${totalClass}">Current % (w/w): ${escapeHtml(total.toFixed(2))}</div>
          <button class="fd-material-danger" type="button" data-role="remove-all"${
            activeMaterials.length === 0 ? " disabled" : ""
          }>Remove All</button>
        </div>
        <div class="fd-material-list">
          ${
            activeMaterials.length === 0
              ? '<div class="fd-material-empty">All materials currently at 0% w/w.</div>'
              : activeMaterials
                  .map(
                    (material) => `
                      <article class="fd-material-row">
                        <div class="fd-material-top">
                          <div class="fd-material-name">${escapeHtml(getMaterialOptionLabel(material.id))}</div>
                          <button class="fd-material-remove" type="button" data-role="remove-material" data-material-id="${escapeHtml(material.id)}">🗑</button>
                        </div>
                        <div class="fd-material-controls">
                          <input class="fd-material-range" type="range" min="0" max="100" step="1" value="${escapeHtml(material.value)}" data-role="material-range" data-material-id="${escapeHtml(material.id)}" />
                          <div class="fd-material-mini">
                            <input type="number" min="0" max="100" step="1" value="${escapeHtml(material.value)}" data-role="material-number" data-material-id="${escapeHtml(material.id)}" />
                            <span>% w/w</span>
                          </div>
                        </div>
                      </article>
                    `,
                  )
                  .join("")
          }
        </div>
      </section>
    </div>
  `;

  const setMaterialValue = (materialId, value) => {
    const numeric = Number(value);
    const clamped = Number.isFinite(numeric) ? Math.min(100, Math.max(0, numeric)) : 0;
    view.form.getField(getMaterialFieldId(materialId))?.setValue(clamped);
  };

  panel.querySelector('[data-role="add-material"]')?.addEventListener("click", () => {
    const select = panel.querySelector('[data-role="material-select"]');
    const draft = panel.querySelector('[data-role="draft-proportion"]');
    const materialId = select instanceof HTMLSelectElement ? select.value : "";
    const proportion = draft instanceof HTMLInputElement ? draft.value : "0";
    if (materialId) {
      setMaterialValue(materialId, proportion);
    }
  });

  panel.querySelector('[data-role="remove-all"]')?.addEventListener("click", () => {
    view.form.setValues(Object.fromEntries(MATERIAL_FIELD_IDS.map((fieldId) => [fieldId, 0])));
  });

  panel.querySelector('[data-role="submit-inline"]')?.addEventListener("click", () => {
    view.submit();
  });

  panel.querySelectorAll('[data-role="remove-material"]').forEach((button) => {
    button.addEventListener("click", () => {
      setMaterialValue(button.getAttribute("data-material-id"), 0);
    });
  });

  panel.querySelectorAll('[data-role="material-range"]').forEach((input) => {
    input.addEventListener("input", (event) => {
      setMaterialValue(input.getAttribute("data-material-id"), event.target.value);
    });
  });

  panel.querySelectorAll('[data-role="material-number"]').forEach((input) => {
    input.addEventListener("input", (event) => {
      setMaterialValue(input.getAttribute("data-material-id"), event.target.value);
    });
  });

  const inlineSubmit = panel.querySelector('[data-role="submit-inline"]');
  if (inlineSubmit instanceof HTMLButtonElement) {
    const status = snapshot.form.status;
    inlineSubmit.disabled = status === "validating" || status === "submitting";
    inlineSubmit.textContent =
      status === "validating"
        ? FORM_LABELS.validating
        : status === "submitting"
          ? FORM_LABELS.submitting
          : FORM_LABELS.submit;
  }

  return panel;
};

const renderNode = (node, snapshot, view, primitiveRegistry, reportRefs) => {
  if (node.kind === "section") {
    const section = document.createElement("section");
    section.className = "fd-layout-section";
    section.dataset.sectionId = node.id;

    if (node.title || node.description) {
      const copy = document.createElement("div");
      copy.className = "fd-layout-copy";

      if (node.title) {
        const title = document.createElement("h2");
        title.className = "fd-layout-title";
        title.textContent = node.title;
        copy.append(title);
      }

      if (node.description) {
        const description = document.createElement("p");
        description.className = "fd-layout-description";
        description.textContent = node.description;
        copy.append(description);
      }

      section.append(copy);
    }

    const children = document.createElement("div");
    children.className = "fd-layout-children";

    if (node.id === "materials-section") {
      children.append(createMaterialsPanel(snapshot, view));
    } else {
      node.children.forEach((child) => {
        children.append(renderNode(child, snapshot, view, primitiveRegistry, reportRefs));
      });
    }

    section.append(children);
    return section;
  }

  if (node.kind === "group") {
    const group = document.createElement("div");
    group.className = `fd-layout-group${node.columns ? ` fd-columns-${node.columns}` : ""}`;
    group.dataset.groupId = node.id;
    node.children.forEach((child) => {
      group.append(renderNode(child, snapshot, view, primitiveRegistry, reportRefs));
    });
    return group;
  }

  if (node.kind === "field") {
    const field = snapshot.fields.find((entry) => entry.id === node.field);
    return field ? renderFieldFrame(field, primitiveRegistry) : document.createElement("div");
  }

  if (node.kind === "report") {
    const report = snapshot.reports.find((entry) => entry.id === node.report);
    const element = report
      ? renderReportFrame(report, primitiveRegistry, snapshot.form.lastResult)
      : document.createElement("div");
    if (report) {
      reportRefs.push(element);
    }
    return element;
  }

  return document.createElement("div");
};

const createViewShell = (view, host, primitiveRegistry) => {
  const render = (snapshot) => {
    const reportRefs = [];
    const root = document.createElement("div");
    root.className = "fd-layout-root";

    snapshot.layout.children.forEach((node) => {
      root.append(renderNode(node, snapshot, view, primitiveRegistry, reportRefs));
    });

    const formColumn = root.querySelector('[data-section-id="form-column"] > .fd-layout-children');
    if (formColumn instanceof HTMLElement) {
      const errors = document.createElement("div");
      errors.className = "fd-form-errors";
      errors.dataset.role = "form-errors";

      const formErrors = snapshot.form.errors.form ?? [];
      if (formErrors.length === 0) {
        errors.hidden = true;
      } else {
        errors.replaceChildren(
          ...formErrors.map((message) => {
            const item = document.createElement("p");
            item.textContent = message;
            return item;
          }),
        );
      }

      const actions = document.createElement("div");
      actions.className = "fd-form-actions";
      actions.innerHTML = `
        <div class="fd-form-status" data-role="form-status"></div>
        <button class="fd-submit-button" type="button" data-role="submit-button"></button>
      `;

      formColumn.append(errors, actions);
    }

    host.replaceChildren(root);

    reportRefs.forEach((reportElement) => {
      reportElement.lastResult = snapshot.form.lastResult;
    });

    const submitButton = host.querySelector('[data-role="submit-button"]');
    if (submitButton instanceof HTMLButtonElement) {
      const status = snapshot.form.status;
      submitButton.disabled = status === "validating" || status === "submitting";
      submitButton.textContent =
        status === "validating"
          ? FORM_LABELS.validating
          : status === "submitting"
            ? FORM_LABELS.submitting
            : FORM_LABELS.submit;
      submitButton.addEventListener("click", () => {
        view.submit();
      });
    }

    const statusNode = host.querySelector('[data-role="form-status"]');
    if (statusNode instanceof HTMLElement) {
      const total = getMaterialTotal(snapshot.form.values);
      statusNode.textContent = `Status ${PRIMITIVE_TEXT.formStatusLabel(snapshot.form.status)} | Total ${total.toFixed(2)}/100`;
    }
  };

  render(view.getSnapshot());
  return { sync: render };
};

export const mountFormulationDemo = (container = document.body) => {
  const shell = createShell();
  container.replaceChildren(shell);

  const select = shell.querySelector('[data-role="example-select"]');
  const loadButton = shell.querySelector('[data-role="load-example"]');
  const formHost = shell.querySelector('[data-role="form-host"]');
  const topToggle = shell.querySelector(".fd-top-toggle");
  const topBody = shell.querySelector(".fd-top-body");
  const caret = shell.querySelector(".fd-top-caret");

  if (
    !(select instanceof HTMLSelectElement) ||
    !(loadButton instanceof HTMLButtonElement) ||
    !(formHost instanceof HTMLElement)
  ) {
    throw new Error("Formulation demo shell failed to initialize.");
  }

  let selectedExampleId = "example-2";
  populateExampleSelect(select, selectedExampleId);

  let view = null;
  let rendered = null;
  let unsubscribe = () => {};
  const primitiveRegistry = createFormulationPrimitiveRegistry();

  const mountView = (initialValues) => {
    unsubscribe();
    view = createView(initialValues);
    rendered = createViewShell(view, formHost, primitiveRegistry);
    unsubscribe = view.subscribe((snapshot) => {
      rendered.sync(snapshot);
    });
  };

  mountView(getExampleById(selectedExampleId)?.values);

  select.addEventListener("change", () => {
    selectedExampleId = select.value;
  });

  loadButton.addEventListener("click", () => {
    const example = getExampleById(selectedExampleId);
    if (!example) {
      return;
    }
    mountView(example.values);
  });

  topToggle?.addEventListener("click", () => {
    const expanded = topToggle.getAttribute("aria-expanded") !== "false";
    topToggle.setAttribute("aria-expanded", String(!expanded));
    if (topBody instanceof HTMLElement) {
      topBody.hidden = expanded;
    }
    caret?.classList.toggle("is-open", !expanded);
  });

  return {
    unmount() {
      unsubscribe();
      shell.remove();
    },
  };
};
