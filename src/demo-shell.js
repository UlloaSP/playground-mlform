import { mountFormulationDemo } from "./formulation-demo/index.jsx";
import {
  mountAccordionPlayground,
  mountPlayground,
  mountTabsPlayground,
  mountWizardPlayground,
} from "./playground/index.js";

const DEMOS = [
  {
    id: "formulation-kit",
    label: "Formulation kit",
    eyebrow: "Custom layout",
    description: "Formulation page using `createFormView` and custom layout tree.",
    mount: (container) => mountFormulationDemo(container),
  },
  {
    id: "playground-stacked",
    label: "Playground stacked",
    eyebrow: "Built-in layout",
    description: "Default one-column playground using built-in stacked layout.",
    mount: (container) => mountPlayground(container, { layout: "stacked", reportPane: "always" }),
  },
  {
    id: "playground-split",
    label: "Playground split",
    eyebrow: "Built-in layout",
    description: "Two-pane playground with form and reports side by side.",
    mount: (container) => mountPlayground(container, { layout: "split", reportPane: "always" }),
  },
  {
    id: "playground-wizard",
    label: "Wizard concise",
    eyebrow: "Wizard config",
    description: "Three-step wizard with compact grouping and aggregate report in final step.",
    mount: (container) => mountWizardPlayground(container, { variant: "concise" }),
  },
  {
    id: "wizard-review",
    label: "Wizard review",
    eyebrow: "Wizard config",
    description: "Four-step review flow with sections, groups and per-backend reports.",
    mount: (container) => mountWizardPlayground(container, { variant: "review" }),
  },
  {
    id: "wizard-reports",
    label: "Wizard reports",
    eyebrow: "Wizard config",
    description: "Wizard ending in full report gallery step with grouped classifier and latency views.",
    mount: (container) => mountWizardPlayground(container, { variant: "reports" }),
  },
  {
    id: "tabs-classic",
    label: "Tabs classic",
    eyebrow: "Tabs layout",
    description: "Built-in tabs layout with basics, signals and reports separated into free-navigation tabs.",
    mount: (container) => mountTabsPlayground(container, { variant: "classic" }),
  },
  {
    id: "tabs-compact",
    label: "Tabs compact",
    eyebrow: "Tabs layout",
    description: "Two-tab layout with all inputs in one tab and all reports in another.",
    mount: (container) => mountTabsPlayground(container, { variant: "compact" }),
  },
  {
    id: "accordion-classic",
    label: "Accordion classic",
    eyebrow: "Accordion layout",
    description: "Built-in accordion with release controls, signals and reports as expandable sections.",
    mount: (container) => mountAccordionPlayground(container, { variant: "classic" }),
  },
  {
    id: "accordion-review",
    label: "Accordion review",
    eyebrow: "Accordion layout",
    description: "Review-oriented accordion with compact identity, evidence and decision sections.",
    mount: (container) => mountAccordionPlayground(container, { variant: "review" }),
  },
];

const DEFAULT_DEMO_ID = DEMOS[0].id;

const getDemoById = (demoId) => DEMOS.find((demo) => demo.id === demoId) ?? DEMOS[0];

const getRouteDemoId = () => {
  const hash = window.location.hash.replace(/^#/, "").trim();
  return DEMOS.some((demo) => demo.id === hash) ? hash : DEFAULT_DEMO_ID;
};

const createShell = () => {
  const shell = document.createElement("main");
  shell.className = "app-shell";
  shell.innerHTML = `
    <div class="app-frame">
      <header class="app-header">
        <div class="app-brand">
          <p class="app-kicker">mlform demos</p>
          <h1>Layout switchboard</h1>
          <p class="app-copy">
            Change between formulation demo and playground layouts without reloading page.
          </p>
        </div>
        <nav class="app-tabs" aria-label="Demo selector" data-role="tabs"></nav>
      </header>
      <section class="app-stage-card">
        <div class="app-stage-head">
          <div>
            <p class="app-stage-kicker" data-role="demo-eyebrow"></p>
            <h2 data-role="demo-title"></h2>
          </div>
          <p class="app-stage-copy" data-role="demo-description"></p>
        </div>
        <div class="app-stage" data-role="demo-outlet"></div>
      </section>
    </div>
  `;
  return shell;
};

const renderTabs = (tabsHost, activeDemoId, onSelect) => {
  tabsHost.replaceChildren(
    ...DEMOS.map((demo) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `app-tab${demo.id === activeDemoId ? " is-active" : ""}`;
      button.textContent = demo.label;
      button.dataset.demoId = demo.id;
      button.addEventListener("click", () => {
        onSelect(demo.id);
      });
      return button;
    }),
  );
};

export const mountDemoShell = (container = document.body) => {
  const shell = createShell();
  container.replaceChildren(shell);

  const tabsHost = shell.querySelector('[data-role="tabs"]');
  const demoOutlet = shell.querySelector('[data-role="demo-outlet"]');
  const demoEyebrow = shell.querySelector('[data-role="demo-eyebrow"]');
  const demoTitle = shell.querySelector('[data-role="demo-title"]');
  const demoDescription = shell.querySelector('[data-role="demo-description"]');

  if (
    !(tabsHost instanceof HTMLElement) ||
    !(demoOutlet instanceof HTMLElement) ||
    !(demoEyebrow instanceof HTMLElement) ||
    !(demoTitle instanceof HTMLElement) ||
    !(demoDescription instanceof HTMLElement)
  ) {
    throw new Error("Demo shell failed to initialize.");
  }

  let currentUnmount = null;
  let currentDemoId = "";

  const mountSelectedDemo = (demoId) => {
    const nextDemo = getDemoById(demoId);
    if (currentDemoId === nextDemo.id) {
      return;
    }

    currentUnmount?.();
    currentUnmount = null;
    demoOutlet.replaceChildren();

    currentDemoId = nextDemo.id;
    window.location.hash = nextDemo.id;
    demoEyebrow.textContent = nextDemo.eyebrow;
    demoTitle.textContent = nextDemo.label;
    demoDescription.textContent = nextDemo.description;
    renderTabs(tabsHost, nextDemo.id, mountSelectedDemo);

    const mounted = nextDemo.mount(demoOutlet);
    currentUnmount = typeof mounted?.unmount === "function" ? () => mounted.unmount() : null;
  };

  const syncFromHash = () => {
    mountSelectedDemo(getRouteDemoId());
  };

  window.addEventListener("hashchange", syncFromHash);
  syncFromHash();

  return {
    unmount() {
      window.removeEventListener("hashchange", syncFromHash);
      currentUnmount?.();
      shell.remove();
    },
  };
};
