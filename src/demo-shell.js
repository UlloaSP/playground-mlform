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
const THEMES = builtinDesignSystemRegistry.listThemes();
const RECIPES = builtinDesignSystemRegistry.listRecipes();
const MODES = [
  { id: "light", label: "Claro" },
  { id: "dark", label: "Oscuro" },
];

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
        aria-label="Seleccionar playground y diseño"
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
  const demoOutlet = shell.querySelector('[data-role="demo-outlet"]');

  if (
    !(menu instanceof HTMLElement) ||
    !(menuButton instanceof HTMLButtonElement) ||
    !(menuPanel instanceof HTMLElement) ||
    !(menuList instanceof HTMLElement) ||
    !(themeSelect instanceof HTMLSelectElement) ||
    !(recipeSelect instanceof HTMLSelectElement) ||
    !(modeSelect instanceof HTMLSelectElement) ||
    !(demoOutlet instanceof HTMLElement)
  ) {
    throw new Error("Demo shell failed to initialize.");
  }

  let currentUnmount = null;
  let currentMounted = null;
  let currentDemoId = "";
  let designSystem = readDesignSystem();

  fillSelect(themeSelect, THEMES, designSystem.theme);
  fillSelect(recipeSelect, RECIPES, designSystem.recipe);
  fillSelect(modeSelect, MODES, designSystem.mode);
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

  const mountSelectedDemo = (demoId, restoreMenuFocus = false) => {
    const nextDemo = getDemoById(demoId);
    if (currentDemoId === nextDemo.id) {
      setMenuOpen(false);
      if (restoreMenuFocus) menuButton.focus();
      return;
    }

    currentUnmount?.();
    currentUnmount = null;
    currentMounted = null;
    demoOutlet.replaceChildren();

    currentDemoId = nextDemo.id;
    shell.dataset.demoId = nextDemo.id;
    shell.classList.toggle("is-fixed-layout", FIXED_LAYOUT_DEMO_IDS.has(nextDemo.id));
    window.location.hash = nextDemo.id;
    renderMenu(menuList, nextDemo.id, mountSelectedDemo);
    setMenuOpen(false);

    const mounted = nextDemo.mount(demoOutlet, designSystem);
    currentMounted = mounted;
    currentUnmount = typeof mounted?.unmount === "function" ? () => mounted.unmount() : null;
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
  };

  const handleThemeChange = () => handleDesignChange("theme", themeSelect.value);
  const handleRecipeChange = () => handleDesignChange("recipe", recipeSelect.value);
  const handleModeChange = () => handleDesignChange("mode", modeSelect.value);

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
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("keydown", handleDocumentKeydown);
      currentUnmount?.();
      shell.remove();
    },
  };
};
