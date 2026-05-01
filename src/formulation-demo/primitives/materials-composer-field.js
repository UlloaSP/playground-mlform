import { getMaterialOptionLabel } from "../material-catalog.js";

export const MATERIALS_COMPOSER_FIELD_TAG = "mlf-materials-composer-field";

const createRowId = () =>
  `material-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const round = (value, digits = 2) => Number(value.toFixed(digits));

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

class MaterialsComposerFieldElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._controller = undefined;
    this._descriptor = null;
    this._context = undefined;
    this._selectedMaterialId = "";
    this._draftProportion = "";
    this._localError = "";
  }

  set controller(value) {
    this._controller = value;
  }

  set descriptor(value) {
    this._descriptor = value;
    this.#syncDrafts();
    this.#render();
  }

  set context(value) {
    this._context = value;
    this.#render();
  }

  connectedCallback() {
    this.#syncDrafts();
    this.#render();
  }

  #props() {
    return this._descriptor?.props ?? {};
  }

  #rows() {
    const rows = this.#props().rows;
    return Array.isArray(rows) ? rows : [];
  }

  #catalog() {
    const catalog = this.#props().catalog;
    const used = new Set(this.#rows().map((row) => row.materialId));
    return Array.isArray(catalog) ? catalog.filter((material) => !used.has(material.id)) : [];
  }

  #total() {
    return round(this.#rows().reduce((sum, row) => sum + Number(row.proportion ?? 0), 0), 2);
  }

  #badgeClass(total) {
    if (Math.abs(total - 100) < 0.001) {
      return "good";
    }
    if (total > 100) {
      return "bad";
    }
    return "warn";
  }

  #syncDrafts() {
    const catalog = this.#catalog();
    if (!catalog.some((material) => material.id === this._selectedMaterialId)) {
      this._selectedMaterialId = catalog[0]?.id ?? "";
    }
    if (catalog[0] && this._draftProportion === "") {
      this._draftProportion = String(catalog[0].defaultPercent ?? 0);
    }
  }

  #commitValue(value) {
    if (this._context?.disabled || this._context?.readOnly) {
      return;
    }
    this._controller?.setValue(value);
  }

  #commitBlur() {
    this._controller?.blur();
    void this._controller?.validate();
  }

  #handleAdd() {
    const material = this.#catalog().find((entry) => entry.id === this._selectedMaterialId);
    if (!material) {
      this._localError = "Select a valid material.";
      this.#render();
      return;
    }

    const parsed = Number(this._draftProportion === "" ? material.defaultPercent : this._draftProportion);
    if (!Number.isFinite(parsed) || parsed < 0) {
      this._localError = "Proportion must be a valid positive number.";
      this.#render();
      return;
    }

    this._localError = "";
    this._draftProportion = String(material.defaultPercent ?? parsed);
    this.#commitValue(
      this.#rows().concat({
        rowId: createRowId(),
        materialId: material.id,
        proportion: parsed,
      }),
    );
  }

  #handleUpdate(rowId, nextProportion) {
    const parsed = Number(nextProportion);
    this.#commitValue(
      this.#rows().map((row) =>
        row.rowId === rowId
          ? { ...row, proportion: Number.isFinite(parsed) ? parsed : 0 }
          : row,
      ),
    );
  }

  #handleRemove(rowId) {
    this.#commitValue(this.#rows().filter((row) => row.rowId !== rowId));
  }

  #handleRemoveAll() {
    this.#commitValue([]);
  }

  #render() {
    if (!this.shadowRoot) {
      return;
    }

    const rows = this.#rows();
    const catalog = this.#catalog();
    const total = this.#total();
    const fieldErrors = Array.isArray(this.#props().errors) ? this.#props().errors : [];

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; }
        .shell { display:grid; gap:1rem; }
        .split { display:grid; gap:1rem; grid-template-columns:minmax(260px, .8fr) minmax(360px, 1.2fr); }
        .card { display:grid; gap:.9rem; border:1px solid color-mix(in srgb, var(--mlf-color-border, #d9dce7) 88%, transparent); border-radius:1rem; background:color-mix(in srgb, var(--mlf-color-surface, #fff) 96%, transparent); padding:1rem; }
        .heading { margin:0; font-size:1.85rem; font-weight:500; text-align:center; }
        .sub { margin:0; text-align:center; color:var(--mlf-color-text-muted, #5f5a87); }
        .field-grid { display:grid; gap:.9rem; grid-template-columns:1fr 150px; }
        label { display:grid; gap:.35rem; color:var(--mlf-color-text, #2c2847); }
        label span { text-align:center; font-size:.95rem; }
        select, input[type="number"] { width:100%; min-height:var(--mlf-control-height, 3rem); padding:.7rem .95rem; border-radius:var(--mlf-input-radius, 12px); border:1px solid var(--mlf-color-border, #d9dce7); background:var(--mlf-color-surface, #fff); color:var(--mlf-color-text, #2c2847); font:inherit; box-sizing:border-box; }
        .button, .danger, .icon { border:0; cursor:pointer; font:inherit; }
        .button { justify-self:center; display:inline-flex; align-items:center; gap:.7rem; padding:.7rem 1rem; border-radius:.45rem; background:#5f5f63; color:#fff; }
        .toolbar { display:flex; gap:1rem; align-items:center; justify-content:space-between; }
        .badge { display:inline-flex; align-items:center; justify-content:center; padding:.3rem .7rem; border-radius:999px; font-size:.92rem; font-weight:600; }
        .badge.good { background:rgba(121,226,123,.2); color:#16702a; }
        .badge.warn { background:rgba(255,195,60,.18); color:#8f5a00; }
        .badge.bad { background:rgba(239,64,73,.16); color:#b21f28; }
        .danger { border-radius:.4rem; background:#ef4049; color:#fff; padding:.7rem .95rem; }
        .list { display:grid; gap:.8rem; margin-top:.8rem; }
        .row { display:grid; gap:.85rem; padding:.9rem; border-radius:.8rem; border:1px solid color-mix(in srgb, var(--mlf-color-border, #d9dce7) 88%, transparent); }
        .row-top { display:flex; align-items:center; justify-content:space-between; gap:.7rem; }
        .row-name { flex:1; text-align:center; }
        .icon { background:transparent; font-size:1rem; }
        .row-controls { display:grid; gap:.9rem; align-items:center; grid-template-columns:1fr 112px; }
        input[type="range"] { width:100%; accent-color:#8f8cd2; }
        .mini { display:grid; justify-items:center; gap:.3rem; }
        .mini span { font-size:.84rem; color:var(--mlf-color-text-muted, #5f5a87); }
        .empty, .error { border-radius:.8rem; padding:.9rem 1rem; }
        .empty { border:1px dashed var(--mlf-color-border, #d9dce7); color:var(--mlf-color-text-muted, #5f5a87); text-align:center; }
        .error { background:rgba(239,64,73,.12); color:#9e2028; }
        @media (max-width:860px) { .split,.field-grid,.row-controls { grid-template-columns:1fr; } .toolbar { flex-direction:column; align-items:stretch; } }
      </style>
      <div class="shell">
        <div class="split">
          <section class="card">
            <h3 class="heading">Materials</h3>
            <p class="sub">Select a material</p>
            <div class="field-grid">
              <label>
                <span>Select a material</span>
                <select data-role="material-select">
                  ${catalog.length === 0 ? '<option value="">No more materials</option>' : ""}
                  ${catalog
                    .map(
                      (material) =>
                        `<option value="${escapeHtml(material.id)}"${
                          material.id === this._selectedMaterialId ? " selected" : ""
                        }>${escapeHtml(getMaterialOptionLabel(material.id))}</option>`,
                    )
                    .join("")}
                </select>
              </label>
              <label>
                <span>Proportion (w/w)</span>
                <input data-role="draft-proportion" type="number" min="0" max="100" step="1" value="${escapeHtml(this._draftProportion)}" />
              </label>
            </div>
            <button class="button" type="button" data-role="add-material"${catalog.length === 0 ? " disabled" : ""}>Add material <strong>+</strong></button>
            ${this._localError ? `<div class="error">${escapeHtml(this._localError)}</div>` : ""}
          </section>
          <section class="card">
            <div class="toolbar">
              <h3 class="heading">Current Materials</h3>
              <div class="badge ${this.#badgeClass(total)}">Current % (w/w): ${escapeHtml(total)}/100</div>
              <button class="danger" type="button" data-role="remove-all"${rows.length === 0 ? " disabled" : ""}>Remove All</button>
            </div>
            <div class="list">
              ${
                rows.length === 0
                  ? '<div class="empty">No materials yet.</div>'
                  : rows
                      .map(
                        (row) => `
                          <article class="row">
                            <div class="row-top">
                              <div class="row-name">${escapeHtml(getMaterialOptionLabel(row.materialId))}</div>
                              <button class="icon" type="button" data-remove-row="${escapeHtml(row.rowId)}">🗑</button>
                            </div>
                            <div class="row-controls">
                              <input type="range" min="0" max="100" step="1" value="${escapeHtml(row.proportion)}" data-range-row="${escapeHtml(row.rowId)}" />
                              <div class="mini">
                                <input type="number" min="0" max="100" step="1" value="${escapeHtml(row.proportion)}" data-number-row="${escapeHtml(row.rowId)}" />
                                <span>% w/w</span>
                              </div>
                            </div>
                          </article>
                        `,
                      )
                      .join("")
              }
            </div>
            ${fieldErrors.length > 0 ? `<div class="error">${escapeHtml(fieldErrors[0])}</div>` : ""}
          </section>
        </div>
      </div>
    `;

    const select = this.shadowRoot.querySelector('[data-role="material-select"]');
    const draft = this.shadowRoot.querySelector('[data-role="draft-proportion"]');
    const add = this.shadowRoot.querySelector('[data-role="add-material"]');
    const removeAll = this.shadowRoot.querySelector('[data-role="remove-all"]');

    select?.addEventListener("change", (event) => {
      this._selectedMaterialId = event.target.value;
      const selected = this.#catalog().find((material) => material.id === this._selectedMaterialId);
      if (selected && (this._draftProportion === "" || this._draftProportion === "0")) {
        this._draftProportion = String(selected.defaultPercent ?? 0);
      }
      this.#render();
    });

    draft?.addEventListener("input", (event) => {
      this._draftProportion = event.target.value;
    });
    draft?.addEventListener("blur", () => this.#commitBlur());
    add?.addEventListener("click", () => this.#handleAdd());
    removeAll?.addEventListener("click", () => this.#handleRemoveAll());

    this.shadowRoot.querySelectorAll("[data-remove-row]").forEach((button) => {
      button.addEventListener("click", () => this.#handleRemove(button.getAttribute("data-remove-row")));
    });

    this.shadowRoot.querySelectorAll("[data-range-row]").forEach((input) => {
      input.addEventListener("input", (event) =>
        this.#handleUpdate(input.getAttribute("data-range-row"), event.target.value),
      );
    });

    this.shadowRoot.querySelectorAll("[data-number-row]").forEach((input) => {
      input.addEventListener("input", (event) =>
        this.#handleUpdate(input.getAttribute("data-number-row"), event.target.value),
      );
      input.addEventListener("blur", () => this.#commitBlur());
    });
  }
}

if (!customElements.get(MATERIALS_COMPOSER_FIELD_TAG)) {
  customElements.define(MATERIALS_COMPOSER_FIELD_TAG, MaterialsComposerFieldElement);
}
