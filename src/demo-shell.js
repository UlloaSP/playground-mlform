import { mountFormulationDemo } from "./formulation-demo/index.js";
import { builtinDesignSystemRegistry } from "mlform/design";
import {
  mountFieldCombinationsPlayground,
  mountPlayground,
  mountTabsPlayground,
  mountWizardPlayground,
} from "./playground/index.js";
import { PLAYGROUND_DESIGN_SYSTEM } from "./playground/config.js";

const DESIGN_STORAGE_KEY = "mlform-playground-design";
const VIEWPORT_STORAGE_KEY = "mlform-playground-viewport";
const THEMES = builtinDesignSystemRegistry.listThemes();
const RECIPES = builtinDesignSystemRegistry.listRecipes();
const MODES = [
  { id: "light", label: "Claro" },
  { id: "dark", label: "Oscuro" },
];
const VIEWPORTS = [
  { id: "actual", label: "Pantalla actual" },
  { id: "phone", label: "Phone · 390 × 844", width: 390, height: 844 },
  { id: "tablet", label: "Tablet · 820 × 1180", width: 820, height: 1180 },
  { id: "laptop", label: "Laptop · 1366 × 768", width: 1366, height: 768 },
  { id: "pc", label: "PC · 1920 × 1080", width: 1920, height: 1080 },
  { id: "ultrawide", label: "Ultrawide · 2560 × 1080", width: 2560, height: 1080 },
  { id: "custom", label: "Personalizado" },
];
const SIZE_LIMITS = { width: [1, 8192], height: [1, 8192] };

const validSize = (value, [min, max]) =>
  Number.isInteger(value) && value >= min && value <= max;

const readViewport = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(VIEWPORT_STORAGE_KEY) ?? "null");
    return {
      id: VIEWPORTS.some(({ id }) => id === saved?.id) ? saved.id : "actual",
      customWidth: validSize(saved?.customWidth, SIZE_LIMITS.width) ? saved.customWidth : 1280,
      customHeight: validSize(saved?.customHeight, SIZE_LIMITS.height) ? saved.customHeight : 800,
    };
  } catch {
    return { id: "actual", customWidth: 1280, customHeight: 800 };
  }
};

const getViewportSize = (viewport) =>
  viewport.id === "custom"
    ? { width: viewport.customWidth, height: viewport.customHeight }
    : VIEWPORTS.find(({ id }) => id === viewport.id);

const readDesignSystem = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(DESIGN_STORAGE_KEY) ?? "null");
    return {
      theme: THEMES.some(({ id }) => id === saved?.theme) ? saved.theme : PLAYGROUND_DESIGN_SYSTEM.theme,
      recipe: RECIPES.some(({ id }) => id === saved?.recipe) ? saved.recipe : PLAYGROUND_DESIGN_SYSTEM.recipe,
      mode: MODES.some(({ id }) => id === saved?.mode) ? saved.mode : PLAYGROUND_DESIGN_SYSTEM.mode,
    };
  } catch {
    return { ...PLAYGROUND_DESIGN_SYSTEM };
  }
};

const DEMOS = [
  {
    id: "formulation-kit",
    label: "M3DISEEN",
    mount: (container, designSystem) => mountFormulationDemo(container, designSystem),
  },
  {
    id: "playground-stacked",
    label: "Stacked",
    mount: (container, designSystem) => mountPlayground(container, "sectioned", undefined, designSystem),
  },
  {
    id: "playground-split",
    label: "Split",
    mount: (container, designSystem) => mountPlayground(container, "split", undefined, designSystem),
  },
  {
    id: "field-combinations",
    label: "Field combos",
    mount: (container, designSystem) => mountFieldCombinationsPlayground(container, designSystem),
  },
  {
    id: "wizard-reports",
    label: "Wizard",
    mount: (container, designSystem) => mountWizardPlayground(container, designSystem),
  },
  {
    id: "tabs-classic",
    label: "Tabs",
    mount: (container, designSystem) => mountTabsPlayground(container, designSystem),
  },
];

const DEFAULT_DEMO_ID = DEMOS[0].id;
const FIXED_LAYOUT_DEMO_IDS = new Set([
  "playground-split",
  "field-combinations",
  "wizard-reports",
  "tabs-classic",
]);

const getDemoById = (demoId) => DEMOS.find((demo) => demo.id === demoId) ?? DEMOS[0];

const getRouteDemoId = () => {
  const hash = window.location.hash.replace(/^#/, "").trim();
  return DEMOS.some((demo) => demo.id === hash) ? hash : DEFAULT_DEMO_ID;
};

const createShell = () => {
  const shell = document.createElement("main");
  shell.className = "app-shell";
  shell.innerHTML = `
    <div class="app-menu" data-role="menu">
      <button
        class="app-menu-button"
        type="button"
        aria-label="Opciones del playground"
        aria-haspopup="dialog"
        aria-expanded="false"
        aria-controls="demo-menu-panel"
        data-role="menu-button"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      <div class="app-menu-panel" id="demo-menu-panel" role="dialog" aria-label="Opciones del playground" data-role="menu-panel" hidden>
        <div class="app-menu-section-label">Playground</div>
        <div class="app-menu-list" role="menu" aria-label="Demo selector" data-role="menu-list"></div>
        <div class="app-menu-settings">
          <label class="app-menu-field">Design system<select data-role="theme-select"></select></label>
          <label class="app-menu-field">Estilo<select data-role="recipe-select"></select></label>
          <label class="app-menu-field">Apariencia<select data-role="mode-select"></select></label>
          <label class="app-menu-field">Tamaño de pantalla<select data-role="viewport-select"></select></label>
          <div class="app-menu-custom-size" data-role="custom-size" hidden>
            <label class="app-menu-field">Ancho (px)<input data-role="custom-width" type="number" min="1" max="8192" step="1" inputmode="numeric" /></label>
            <label class="app-menu-field">Alto (px)<input data-role="custom-height" type="number" min="1" max="8192" step="1" inputmode="numeric" /></label>
          </div>
        </div>
      </div>
    </div>
    <div class="app-frame">
      <div class="app-stage" data-role="demo-outlet"></div>
    </div>
  `;
  return shell;
};

const renderMenu = (menuList, activeDemoId, onSelect) => {
  menuList.replaceChildren(
    ...DEMOS.map((demo) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `app-menu-option${demo.id === activeDemoId ? " is-active" : ""}`;
      button.setAttribute("role", "menuitemradio");
      button.setAttribute("aria-checked", String(demo.id === activeDemoId));
      button.tabIndex = demo.id === activeDemoId ? 0 : -1;
      button.textContent = demo.label;
      button.dataset.demoId = demo.id;
      button.addEventListener("click", (event) => {
        onSelect(demo.id, event.detail === 0);
      });
      return button;
    }),
  );
};

const fillSelect = (select, options, selectedId) => {
  select.replaceChildren(...options.map(({ id, label }) => {
    const option = new Option(label, id);
    option.selected = id === selectedId;
    return option;
  }));
};

export const mountDemoShell = (container = document.body) => {
  const shell = createShell();
  container.replaceChildren(shell);

  const menu = shell.querySelector('[data-role="menu"]');
  const menuButton = shell.querySelector('[data-role="menu-button"]');
  const menuPanel = shell.querySelector('[data-role="menu-panel"]');
  const menuList = shell.querySelector('[data-role="menu-list"]');
  const themeSelect = shell.querySelector('[data-role="theme-select"]');
  const recipeSelect = shell.querySelector('[data-role="recipe-select"]');
  const modeSelect = shell.querySelector('[data-role="mode-select"]');
  const viewportSelect = shell.querySelector('[data-role="viewport-select"]');
  const customSize = shell.querySelector('[data-role="custom-size"]');
  const customWidth = shell.querySelector('[data-role="custom-width"]');
  const customHeight = shell.querySelector('[data-role="custom-height"]');
  const demoOutlet = shell.querySelector('[data-role="demo-outlet"]');

  if (
    !(menu instanceof HTMLElement) ||
    !(menuButton instanceof HTMLButtonElement) ||
    !(menuPanel instanceof HTMLElement) ||
    !(menuList instanceof HTMLElement) ||
    !(themeSelect instanceof HTMLSelectElement) ||
    !(recipeSelect instanceof HTMLSelectElement) ||
    !(modeSelect instanceof HTMLSelectElement) ||
    !(viewportSelect instanceof HTMLSelectElement) ||
    !(customSize instanceof HTMLElement) ||
    !(customWidth instanceof HTMLInputElement) ||
    !(customHeight instanceof HTMLInputElement) ||
    !(demoOutlet instanceof HTMLElement)
  ) {
    throw new Error("Demo shell failed to initialize.");
  }

  let currentUnmount = null;
  let currentMounted = null;
  let currentDemoId = "";
  let designSystem = readDesignSystem();
  let viewport = readViewport();
  let previewFrame = null;
  let previewViewport = null;
  let previewLabel = null;

  fillSelect(themeSelect, THEMES, designSystem.theme);
  fillSelect(recipeSelect, RECIPES, designSystem.recipe);
  fillSelect(modeSelect, MODES, designSystem.mode);
  fillSelect(viewportSelect, VIEWPORTS, viewport.id);
  customWidth.value = String(viewport.customWidth);
  customHeight.value = String(viewport.customHeight);
  customSize.hidden = viewport.id !== "custom";
  shell.dataset.mode = designSystem.mode;

  const setMenuOpen = (open) => {
    menu.classList.toggle("is-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuPanel.hidden = !open;
  };

  const getMenuOptions = () => [...menuList.querySelectorAll(".app-menu-option")];

  const focusMenuOption = (index) => {
    const options = getMenuOptions();
    if (options.length === 0) return;
    const targetIndex = (index + options.length) % options.length;
    options.forEach((option, optionIndex) => {
      option.tabIndex = optionIndex === targetIndex ? 0 : -1;
    });
    options[targetIndex]?.focus();
  };

  const sendDesignToPreview = () => {
    previewFrame?.contentWindow?.postMessage(
      { type: "mlform-preview-design", designSystem },
      window.location.origin,
    );
  };

  const updatePreviewSize = () => {
    if (!previewFrame || !previewViewport || !previewLabel) return;
    const { width, height } = getViewportSize(viewport);
    const scale = Math.min(1, demoOutlet.clientWidth / width);
    previewViewport.style.width = `${width * scale}px`;
    previewViewport.style.height = `${height * scale}px`;
    previewFrame.style.width = `${width}px`;
    previewFrame.style.height = `${height}px`;
    previewFrame.style.transform = `scale(${scale})`;
    previewLabel.textContent = `${VIEWPORTS.find(({ id }) => id === viewport.id)?.label.split(" · ")[0]} · ${width} × ${height} px${scale < 1 ? ` · ${Math.round(scale * 100)} %` : ""}`;
  };

  const mountCurrentDemo = () => {
    currentUnmount?.();
    currentUnmount = null;
    currentMounted = null;
    previewFrame = null;
    previewViewport = null;
    previewLabel = null;
    demoOutlet.replaceChildren();

    const simulated = viewport.id !== "actual";
    shell.classList.toggle("is-preview", simulated);
    shell.classList.toggle("is-fixed-layout", !simulated && FIXED_LAYOUT_DEMO_IDS.has(currentDemoId));

    if (simulated) {
      const preview = document.createElement("div");
      preview.className = "app-preview";
      previewLabel = document.createElement("div");
      previewLabel.className = "app-preview-label";
      previewViewport = document.createElement("div");
      previewViewport.className = "app-preview-viewport";
      previewFrame = document.createElement("iframe");
      previewFrame.className = "app-preview-frame";
      previewFrame.title = "Vista previa del playground";
      const url = new URL(window.location.href);
      url.search = "?preview=1";
      url.hash = currentDemoId;
      previewFrame.src = url.href;
      previewFrame.addEventListener("load", sendDesignToPreview);
      previewViewport.append(previewFrame);
      preview.append(previewLabel, previewViewport);
      demoOutlet.append(preview);
      updatePreviewSize();
      return;
    }

    const mounted = getDemoById(currentDemoId).mount(demoOutlet, designSystem);
    currentMounted = mounted;
    currentUnmount = typeof mounted?.unmount === "function" ? () => mounted.unmount() : null;
  };

  const previewResizeObserver = new ResizeObserver(updatePreviewSize);
  previewResizeObserver.observe(demoOutlet);

  const mountSelectedDemo = (demoId, restoreMenuFocus = false) => {
    const nextDemo = getDemoById(demoId);
    if (currentDemoId === nextDemo.id) {
      setMenuOpen(false);
      if (restoreMenuFocus) menuButton.focus();
      return;
    }

    currentDemoId = nextDemo.id;
    shell.dataset.demoId = nextDemo.id;
    window.location.hash = nextDemo.id;
    renderMenu(menuList, nextDemo.id, mountSelectedDemo);
    setMenuOpen(false);
    mountCurrentDemo();
    if (restoreMenuFocus) menuButton.focus();
  };

  const syncFromHash = () => {
    mountSelectedDemo(getRouteDemoId());
  };

  const handleDesignChange = (key, value) => {
    designSystem = { ...designSystem, [key]: value };
    shell.dataset.mode = designSystem.mode;
    currentMounted?.updateDesignSystem?.(designSystem);
    try {
      window.localStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify(designSystem));
    } catch {
      // The selection still works when storage is unavailable.
    }
    sendDesignToPreview();
  };

  const handleThemeChange = () => handleDesignChange("theme", themeSelect.value);
  const handleRecipeChange = () => handleDesignChange("recipe", recipeSelect.value);
  const handleModeChange = () => handleDesignChange("mode", modeSelect.value);

  const saveViewport = () => {
    try {
      window.localStorage.setItem(VIEWPORT_STORAGE_KEY, JSON.stringify(viewport));
    } catch {
      // The preview still works when storage is unavailable.
    }
  };

  const handleViewportChange = () => {
    const wasSimulated = viewport.id !== "actual";
    viewport = { ...viewport, id: viewportSelect.value };
    customSize.hidden = viewport.id !== "custom";
    saveViewport();
    if (wasSimulated !== (viewport.id !== "actual")) mountCurrentDemo();
    else updatePreviewSize();
  };

  const handleCustomSizeChange = () => {
    const width = customWidth.valueAsNumber;
    const height = customHeight.valueAsNumber;
    if (!validSize(width, SIZE_LIMITS.width) || !validSize(height, SIZE_LIMITS.height)) {
      customWidth.value = String(viewport.customWidth);
      customHeight.value = String(viewport.customHeight);
      return;
    }
    viewport = { ...viewport, customWidth: width, customHeight: height };
    saveViewport();
    updatePreviewSize();
  };

  const handleMenuButtonClick = () => {
    const open = !menu.classList.contains("is-open");
    setMenuOpen(open);
    if (open) {
      const activeIndex = getMenuOptions().findIndex(
        (option) => option.getAttribute("aria-checked") === "true",
      );
      focusMenuOption(Math.max(0, activeIndex));
    }
  };

  const handleMenuButtonKeydown = (event) => {
    if (event.key !== "ArrowDown") return;
    event.preventDefault();
    setMenuOpen(true);
    focusMenuOption(0);
  };

  const handleMenuListKeydown = (event) => {
    const options = getMenuOptions();
    const currentIndex = options.indexOf(document.activeElement);
    const keyTargets = {
      ArrowDown: currentIndex + 1,
      ArrowUp: currentIndex - 1,
      Home: 0,
      End: options.length - 1,
    };
    if (!(event.key in keyTargets)) return;
    event.preventDefault();
    focusMenuOption(keyTargets[event.key]);
  };

  const handleDocumentClick = (event) => {
    if (!menu.contains(event.target)) {
      setMenuOpen(false);
    }
  };

  const handleDocumentKeydown = (event) => {
    if (event.key === "Escape" && menu.classList.contains("is-open")) {
      setMenuOpen(false);
      menuButton.focus();
    }
  };

  window.addEventListener("hashchange", syncFromHash);
  menuButton.addEventListener("click", handleMenuButtonClick);
  menuButton.addEventListener("keydown", handleMenuButtonKeydown);
  menuList.addEventListener("keydown", handleMenuListKeydown);
  themeSelect.addEventListener("change", handleThemeChange);
  recipeSelect.addEventListener("change", handleRecipeChange);
  modeSelect.addEventListener("change", handleModeChange);
  viewportSelect.addEventListener("change", handleViewportChange);
  customWidth.addEventListener("change", handleCustomSizeChange);
  customHeight.addEventListener("change", handleCustomSizeChange);
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleDocumentKeydown);
  syncFromHash();

  return {
    unmount() {
      window.removeEventListener("hashchange", syncFromHash);
      menuButton.removeEventListener("click", handleMenuButtonClick);
      menuButton.removeEventListener("keydown", handleMenuButtonKeydown);
      menuList.removeEventListener("keydown", handleMenuListKeydown);
      themeSelect.removeEventListener("change", handleThemeChange);
      recipeSelect.removeEventListener("change", handleRecipeChange);
      modeSelect.removeEventListener("change", handleModeChange);
      viewportSelect.removeEventListener("change", handleViewportChange);
      customWidth.removeEventListener("change", handleCustomSizeChange);
      customHeight.removeEventListener("change", handleCustomSizeChange);
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("keydown", handleDocumentKeydown);
      previewResizeObserver.disconnect();
      currentUnmount?.();
      shell.remove();
    },
  };
};

export const mountDemoPreview = (container = document.getElementById("root") ?? document.body) => {
  const outlet = document.createElement("main");
  outlet.className = "preview-stage";
  container.replaceChildren(outlet);
  document.documentElement.classList.add("preview-page");

  let currentDemoId = "";
  let currentUnmount = null;
  let currentMounted = null;
  let designSystem = readDesignSystem();
  document.body.dataset.mode = designSystem.mode;

  const syncFromHash = () => {
    const nextDemo = getDemoById(getRouteDemoId());
    if (currentDemoId === nextDemo.id) return;
    currentUnmount?.();
    outlet.replaceChildren();
    currentDemoId = nextDemo.id;
    outlet.classList.toggle("is-fixed-layout", FIXED_LAYOUT_DEMO_IDS.has(nextDemo.id));
    currentMounted = nextDemo.mount(outlet, designSystem);
    currentUnmount = typeof currentMounted?.unmount === "function"
      ? () => currentMounted.unmount()
      : null;
  };

  const handleMessage = (event) => {
    if (
      event.origin !== window.location.origin ||
      event.source !== window.parent ||
      event.data?.type !== "mlform-preview-design"
    ) return;
    designSystem = event.data.designSystem;
    document.body.dataset.mode = designSystem.mode;
    currentMounted?.updateDesignSystem?.(designSystem);
  };

  window.addEventListener("hashchange", syncFromHash);
  window.addEventListener("message", handleMessage);
  syncFromHash();

  return {
    unmount() {
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener("message", handleMessage);
      currentUnmount?.();
      outlet.remove();
      document.documentElement.classList.remove("preview-page");
    },
  };
};
