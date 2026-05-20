export const FORMULATION_PREDICTION_REPORT_TAG = "mlf-formulation-prediction-report";

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

class FormulationPredictionReportElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._descriptor = null;
    this._context = undefined;
  }

  set controller(value) {
    this._controller = value;
  }

  set descriptor(value) {
    this._descriptor = value;
    this.#render();
  }

  set context(value) {
    this._context = value;
    this.#render();
  }

  connectedCallback() {
    this.#render();
  }

  #renderChart(points) {
    if (!Array.isArray(points) || points.length === 0) {
      return `<div class="empty">Prediction curve will appear here.</div>`;
    }

    const width = 520;
    const height = 320;
    const padding = 34;
    const maxX = Math.max(...points.map((point) => point.timeMinutes), 1);
    const maxY = Math.max(...points.map((point) => point.dissolvedPercent), 100);
    const projectX = (value) => padding + (value / maxX) * (width - padding * 2);
    const projectY = (value) => height - padding - (value / maxY) * (height - padding * 2);
    const polyline = points
      .map((point) => `${projectX(point.timeMinutes)},${projectY(point.dissolvedPercent)}`)
      .join(" ");
    const yTicks = [0, 20, 40, 60, 80, 100];

    return `
      <div class="chart-wrap">
        <div class="legend"><span class="swatch"></span>Dissolution over time</div>
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Dissolution over time">
          ${yTicks
            .map(
              (tick) => `
                <g>
                  <line x1="${padding}" y1="${projectY(tick)}" x2="${width - padding}" y2="${projectY(tick)}" class="grid-line"></line>
                  <text x="${padding - 8}" y="${projectY(tick) + 4}" class="label">${tick}</text>
                </g>
              `,
            )
            .join("")}
          <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" class="axis"></line>
          <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" class="axis"></line>
          <polyline class="line" points="${polyline}"></polyline>
          ${points
            .map(
              (point) => `<circle class="point" cx="${projectX(point.timeMinutes)}" cy="${projectY(point.dissolvedPercent)}" r="4"></circle>`,
            )
            .join("")}
          <text x="${width / 2}" y="${height - 6}" class="label center">Time (minutes)</text>
          <text x="12" y="${height / 2}" class="label" transform="rotate(-90 12 ${height / 2})">Amount dissolved (%)</text>
        </svg>
      </div>
    `;
  }

  #render() {
    if (!this.shadowRoot) {
      return;
    }

    const props = this._descriptor?.props ?? {};
    const payload = props.payload;
    const error = typeof props.error === "string" ? props.error : null;
    const summary = payload?.summary ?? null;
    const curve = Array.isArray(payload?.curve) ? payload.curve : [];

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; }
        .grid { display:grid; gap:1rem; grid-template-columns:minmax(260px, .85fr) minmax(360px, 1.15fr); }
        .table { border-top:1px solid color-mix(in srgb, var(--mlf-color-border, #d9dce7) 88%, transparent); }
        .row { display:grid; grid-template-columns:1fr 100px; min-height:3.4rem; border-bottom:1px solid color-mix(in srgb, var(--mlf-color-border, #d9dce7) 88%, transparent); }
        .row span,.row strong { display:flex; align-items:center; padding:.85rem 1rem; }
        .row strong { justify-content:center; font-weight:500; }
        .good { background:rgba(121,226,123,.2); color:#16702a; }
        .bad { background:rgba(239,64,73,.16); color:#b21f28; }
        .chart-wrap { display:grid; gap:.6rem; }
        .legend { display:inline-flex; align-items:center; justify-content:center; gap:.45rem; color:var(--mlf-color-text-muted, #4f4b75); }
        .swatch { width:30px; height:14px; background:#8f8cd2; }
        svg { width:100%; }
        .grid-line { stroke:rgba(143,140,210,.22); stroke-width:1; }
        .axis { stroke:rgba(61,56,93,.55); stroke-width:1.2; }
        .label { fill:#4e4a75; font-size:12px; }
        .center { text-anchor:middle; }
        .line { stroke:#8f8cd2; stroke-width:3; fill:none; }
        .point { fill:#8f8cd2; }
        .error,.empty { padding:.9rem 1rem; border-radius:1rem; }
        .error { color:var(--mlf-color-danger, #dc2626); border:1px solid color-mix(in srgb, var(--mlf-color-danger, #dc2626) 25%, transparent); }
        .empty { border:1px dashed var(--mlf-color-border, #d9dce7); color:var(--mlf-color-text-muted, #5f5a87); }
        @media (max-width:860px) { .grid { grid-template-columns:1fr; } }
      </style>
      ${
        error
          ? `<div class="error">${escapeHtml(error)}</div>`
          : !payload || typeof payload !== "object"
            ? `<div class="empty">Prediction pending.</div>`
            : `
              <section part="formulation-prediction-report" id="${escapeHtml(this._context?.regionId ?? "")}">
                <div class="grid">
                  <div class="table">
                    <div class="row">
                      <span>Mechanical characteristics</span>
                      <strong class="${summary ? "good" : ""}">${escapeHtml(summary?.mechanicalCharacteristics ?? "...")}</strong>
                    </div>
                    <div class="row">
                      <span>Extrusion temperature</span>
                      <strong>${summary ? `${escapeHtml(summary.extrusionTemperature)} °C` : "..."}</strong>
                    </div>
                    <div class="row">
                      <span>Printability</span>
                      <strong class="${summary?.printability === "No" ? "bad" : summary ? "good" : ""}">${escapeHtml(summary?.printability ?? "...")}</strong>
                    </div>
                    <div class="row">
                      <span>Printing temperature</span>
                      <strong>${summary ? `${escapeHtml(summary.printingTemperature)} °C` : "..."}</strong>
                    </div>
                  </div>
                  ${this.#renderChart(curve)}
                </div>
              </section>
            `
      }
    `;
  }
}

if (!customElements.get(FORMULATION_PREDICTION_REPORT_TAG)) {
  customElements.define(FORMULATION_PREDICTION_REPORT_TAG, FormulationPredictionReportElement);
}
