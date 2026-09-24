import { createPrimitiveAdapter, defaultKitLabels } from "mlform/kit";
import { attachDesignSystem } from "mlform/design";
import { createFormView } from "mlform/view";
import { primitiveStaticText } from "mlform/primitives";
import { FORMULATION_EXAMPLES, getExampleById } from "./examples.js";
import { MATERIAL_CATALOG, getMaterialFieldId, getMaterialOptionLabel } from "./material-catalog.js";
import { createFormulationPrimitiveRegistry } from "./primitive-registry.js";
import { FORMULATION_PLUGIN } from "./registry.js";
import { createFormulationSchema } from "./schema.js";
import { createFormulationTransport } from "./transport.js";

const PRIMITIVE_TEXT = {
  ...primitiveStaticText,
  formEyebrow: "Formulation",
  reportEyebrow: "Prediction",
  reportsEmptyTitle: "Prediction pending",
  reportsEmptyBody: "Complete formulation and submit to generate prediction.",
  formErrorsTitle: "Validation issues",
  formStateLabel: (operation, submissionStatus) =>
    primitiveStaticText.formStateLabel(operation, submissionStatus).toUpperCase(),
  reportStatusLabel: (status) => status.toUpperCase(),
  categoryPlaceholder: "Select an option",
};

const FORM_LABELS = {
  ...defaultKitLabels,
  submit: "Complete Prediction",
  validating: "Validating…",
  submitting: "Running prediction…",
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
        <button class="fd-top-toggle" type="button" aria-label="Toggle example loader" aria-expanded="true">
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
              <select name="example" autocomplete="off" data-role="example-select"></select>
            </label>
            <button class="fd-host-button" type="button" data-role="load-example">
              Load materials
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
      kind: "group",
      id: "form-column",
      children: [
        {
          kind: "section",
          id: "materials-section",
          title: "Materials",
          description: "Model uses all possible materials. Every material starts at 0 and total must sum 100% w/w.",
          children: [{ kind: "custom", id: "materials", fields: MATERIAL_FIELD_IDS }],
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

const createView = (initialValues) => {
  return createFormView({
    schema: createFormulationSchema(),
    transport: createFormulationTransport(),
    plugins: [FORMULATION_PLUGIN],
    initialValues,
    validators: createValidators(),
    layout: createLayout(),
    reportFetchMode: "all",
  });
};

const renderMaterialOptions = (materials) =>
  materials.length === 0
    ? '<option value="">No more materials</option>'
    : materials
        .map(
          (material) =>
            `<option value="${escapeHtml(material.id)}">${escapeHtml(getMaterialOptionLabel(material.id))}</option>`,
        )
        .join("");

const renderMaterialRows = (materials) =>
  materials.length === 0
    ? '<div class="fd-material-empty">All materials currently at 0% w/w.</div>'
    : materials
        .map(
          (material) => `
            <article class="fd-material-row" data-material-id="${escapeHtml(material.id)}">
              <div class="fd-material-top">
                <div class="fd-material-name">${escapeHtml(getMaterialOptionLabel(material.id))}</div>
                <button class="fd-material-remove" type="button" aria-label="Remove ${escapeHtml(getMaterialOptionLabel(material.id))}" data-role="remove-material" data-material-id="${escapeHtml(material.id)}">Remove</button>
              </div>
              <div class="fd-material-controls">
                <input class="fd-material-range" aria-label="${escapeHtml(getMaterialOptionLabel(material.id))} proportion" name="${escapeHtml(material.id)}-range" type="range" min="0" max="100" step="1" value="${escapeHtml(material.value)}" data-role="material-range" data-material-id="${escapeHtml(material.id)}" />
                <div class="fd-material-mini">
                  <input aria-label="${escapeHtml(getMaterialOptionLabel(material.id))} percentage" name="${escapeHtml(material.id)}-percentage" autocomplete="off" type="number" min="0" max="100" step="1" value="${escapeHtml(material.value)}" data-role="material-number" data-material-id="${escapeHtml(material.id)}" />
                  <span>% w/w</span>
                </div>
              </div>
            </article>
          `,
        )
        .join("");

const createMaterialsPanel = (snapshot, view) => {
  const panel = document.createElement("section");
  panel.className = "fd-materials-panel";

  const values = snapshot.form.values;
  const activeMaterials = getActiveMaterials(values);
  const availableMaterials = MATERIAL_CATALOG.filter(
    (material) => !activeMaterials.some((entry) => entry.id === material.id),
  );
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
      .fd-material-add{justify-self:center;display:inline-flex;align-items:center;gap:.65rem;padding:.72rem 1rem;border:0;border-radius:.45rem;background:var(--mlf-color-accent,#5f5f63);color:var(--mlf-color-text-inverse,#fff);cursor:pointer}
      .fd-material-toolbar{display:flex;align-items:center;justify-content:space-between;gap:1rem}
      .fd-material-badge{display:inline-flex;align-items:center;justify-content:center;padding:.28rem .7rem;border-radius:999px;font-size:.92rem;font-weight:700}
      .fd-material-badge.good{background:var(--mlf-color-surface-muted,#e8f8e9);color:var(--mlf-color-success,#16702a)}
      .fd-material-badge.warn{background:var(--mlf-color-surface-muted,#fff4d7);color:var(--mlf-color-warning,#8f5a00)}
      .fd-material-badge.bad{background:var(--mlf-color-danger-soft,rgba(239,64,73,.16));color:var(--mlf-color-danger,#b21f28)}
      .fd-material-danger{border:0;border-radius:.4rem;background:var(--mlf-color-danger,#ef4049);color:var(--mlf-color-text-inverse,#fff);padding:.72rem .95rem;cursor:pointer}
      .fd-material-list{display:grid;gap:.8rem;max-height:34rem;overflow:auto;padding-right:.25rem}
      .fd-material-row{display:grid;gap:.8rem;padding:.9rem;border-radius:.8rem;border:1px solid color-mix(in srgb,var(--mlf-color-border,#d9dce7) 88%,transparent)}
      .fd-material-top{display:flex;align-items:center;justify-content:space-between;gap:.7rem}
      .fd-material-name{flex:1;text-align:center;color:var(--mlf-color-text,#2c2847)}
      .fd-material-remove{border:0;border-radius:.35rem;background:transparent;color:var(--mlf-color-text-muted,#5f5a87);cursor:pointer;font-size:.78rem;padding:.35rem .45rem}
      .fd-material-remove:hover{background:var(--mlf-color-hover-surface,rgba(95,90,135,.1));color:var(--mlf-color-text,#2c2847)}
      .fd-material-controls{display:grid;gap:.9rem;align-items:center;grid-template-columns:1fr 112px}
      .fd-material-range{width:100%;accent-color:var(--mlf-color-accent,#8f8cd2)}
      .fd-material-mini{display:grid;justify-items:center;gap:.3rem}
      .fd-material-mini input{width:100%;min-height:2.85rem;padding:.45rem .7rem;border-radius:.55rem;border:1px solid var(--mlf-color-border,#d9dce7);background:var(--mlf-color-surface,#fff);color:var(--mlf-color-text,#2c2847)}
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
              <select name="material" autocomplete="off" data-role="material-select">
              ${renderMaterialOptions(availableMaterials)}
            </select>
          </label>
          <label class="fd-material-label">
            <span>Proportion (w/w)</span>
            <input aria-label="Draft material proportion" name="draft-proportion" autocomplete="off" data-role="draft-proportion" type="number" min="0" max="100" step="1" value="0" />
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
          ${renderMaterialRows(activeMaterials)}
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

  panel.addEventListener("click", (event) => {
    const target = event.target instanceof Element
      ? event.target.closest('[data-role="remove-material"]')
      : null;
    if (target) setMaterialValue(target.dataset.materialId, 0);
  });
  panel.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.dataset.role === "material-range" || target.dataset.role === "material-number") {
      setMaterialValue(target.dataset.materialId, target.value);
    }
  });

  let activeIds = activeMaterials.map((material) => material.id).join("|");
  const sync = (nextSnapshot) => {
    const nextActive = getActiveMaterials(nextSnapshot.form.values);
    const nextIds = nextActive.map((material) => material.id).join("|");
    const list = panel.querySelector(".fd-material-list");
    if (nextIds !== activeIds) {
      activeIds = nextIds;
      list.innerHTML = renderMaterialRows(nextActive);
      const available = MATERIAL_CATALOG.filter(
        (material) => !nextActive.some((entry) => entry.id === material.id),
      );
      const select = panel.querySelector('[data-role="material-select"]');
      select.innerHTML = renderMaterialOptions(available);
      panel.querySelector('[data-role="add-material"]').disabled = available.length === 0;
    } else {
      for (const material of nextActive) {
        const row = Array.from(list.querySelectorAll("[data-material-id]")).find(
          (entry) => entry.classList.contains("fd-material-row") && entry.dataset.materialId === material.id,
        );
        row?.querySelectorAll("input").forEach((input) => {
          if (input !== panel.ownerDocument.activeElement) input.value = String(material.value);
        });
      }
    }
    const nextTotal = getMaterialTotal(nextSnapshot.form.values);
    const badge = panel.querySelector(".fd-material-badge");
    badge.className = `fd-material-badge ${Math.abs(nextTotal - 100) < 0.001 ? "good" : nextTotal > 100 ? "bad" : "warn"}`;
    badge.textContent = `Current % (w/w): ${nextTotal.toFixed(2)}`;
    panel.querySelector('[data-role="remove-all"]').disabled = nextActive.length === 0;
    const operation = nextSnapshot.form.operation;
    const inlineSubmit = panel.querySelector('[data-role="submit-inline"]');
    inlineSubmit.disabled =
      nextSnapshot.form.lifecycle !== "active" ||
      operation === "validating" ||
      operation === "submitting";
    inlineSubmit.textContent =
      operation === "validating"
        ? FORM_LABELS.validating
        : operation === "submitting"
          ? FORM_LABELS.submitting
          : FORM_LABELS.submit;
  };
  sync(snapshot);
  return { element: panel, sync };
};

const renderNode = (node, snapshot, view, ui, materialSyncs) => {
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

    node.children.forEach((child) => {
      children.append(renderNode(child, snapshot, view, ui, materialSyncs));
    });

    section.append(children);
    return section;
  }

  if (node.kind === "group") {
    const group = document.createElement("div");
    group.className = `fd-layout-group${node.columns ? ` fd-columns-${node.columns}` : ""}`;
    group.dataset.groupId = node.id;
    node.children.forEach((child) => {
      group.append(renderNode(child, snapshot, view, ui, materialSyncs));
    });
    return group;
  }

  if (node.kind === "field") {
    const slot = document.createElement("div");
    slot.className = "fd-control-slot";
    ui.mountField(slot, node.field);
    return slot;
  }

  if (node.kind === "report") {
    const slot = document.createElement("div");
    slot.className = "fd-control-slot";
    ui.mountReport(slot, node.report);
    return slot;
  }

  if (node.kind === "custom" && node.id === "materials") {
    const panel = createMaterialsPanel(snapshot, view);
    materialSyncs.push(panel.sync);
    return panel.element;
  }

  throw new TypeError(`Unknown layout node "${node.kind}".`);
};

const createViewShell = (view, host, primitiveRegistry) => {
  const ui = createPrimitiveAdapter(view, { primitiveRegistry, primitiveText: PRIMITIVE_TEXT });
  const snapshot = view.getSnapshot();
  const materialSyncs = [];
  const root = document.createElement("div");
  root.className = "fd-layout-root";
  try {
    snapshot.layout.children.forEach((node) => {
      root.append(renderNode(node, snapshot, view, ui, materialSyncs));
    });
  } catch (error) {
    ui.dispose();
    throw error;
  }

  const formColumn = root.querySelector('[data-group-id="form-column"]');
  const errors = document.createElement("div");
  errors.className = "fd-form-errors";
  errors.setAttribute("role", "alert");
  errors.dataset.role = "form-errors";
  const actions = document.createElement("div");
  actions.className = "fd-form-actions";
  actions.innerHTML = `
    <div class="fd-form-status" data-role="form-status" aria-live="polite"></div>
    <button class="fd-submit-button" type="button" data-role="submit-button"></button>
  `;
  formColumn?.append(errors, actions);
  host.replaceChildren(root);

  const submitButton = actions.querySelector('[data-role="submit-button"]');
  submitButton?.addEventListener("click", () => view.submit());
  const statusNode = actions.querySelector('[data-role="form-status"]');
  const sync = (nextSnapshot) => {
    materialSyncs.forEach((update) => update(nextSnapshot));
    const formErrors = nextSnapshot.form.errors.form ?? [];
    errors.hidden = formErrors.length === 0;
    errors.replaceChildren(
      ...formErrors.map((message) => {
        const item = document.createElement("p");
        item.textContent = message;
        return item;
      }),
    );
    const operation = nextSnapshot.form.operation;
    submitButton.disabled =
      nextSnapshot.form.lifecycle !== "active" ||
      operation === "validating" ||
      operation === "submitting";
    submitButton.textContent =
      operation === "validating"
        ? FORM_LABELS.validating
        : operation === "submitting"
          ? FORM_LABELS.submitting
          : FORM_LABELS.submit;
    const total = getMaterialTotal(nextSnapshot.form.values);
    statusNode.textContent = `Status ${PRIMITIVE_TEXT.formStateLabel(operation, nextSnapshot.form.submissionStatus)} | Total ${total.toFixed(2)}/100`;
  };
  sync(snapshot);
  return { sync, dispose: () => ui.dispose() };
};

export const mountFormulationDemo = (container = document.body, designSystem) => {
  const shell = createShell();
  container.replaceChildren(shell);
  const attachedDesign = attachDesignSystem(shell, { config: designSystem });

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
    rendered?.dispose();
    view?.dispose();
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
    updateDesignSystem(config) {
      attachedDesign.update(config);
    },
    unmount() {
      unsubscribe();
      rendered?.dispose();
      view?.dispose();
      attachedDesign.disconnect();
      shell.remove();
    },
  };
};
