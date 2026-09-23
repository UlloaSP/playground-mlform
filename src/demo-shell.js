import { mountFormulationDemo } from "./formulation-demo/index.js";
import {
  mountFieldCombinationsPlayground,
  mountPlayground,
  mountTabsPlayground,
  mountWizardPlayground,
} from "./playground/index.js";

const DEMOS = [
  {
    id: "formulation-kit",
    label: "M3DISEEN",
    mount: (container) => mountFormulationDemo(container),
  },
  {
    id: "playground-stacked",
    label: "Stacked",
    mount: (container) => mountPlayground(container, "sectioned"),
  },
  {
    id: "playground-split",
    label: "Split",
    mount: (container) => mountPlayground(container, "split"),
  },
  {
    id: "field-combinations",
    label: "Field combos",
    mount: (container) => mountFieldCombinationsPlayground(container),
  },
  {
    id: "wizard-reports",
    label: "Wizard",
    mount: (container) => mountWizardPlayground(container),
  },
  {
    id: "tabs-classic",
    label: "Tabs",
    mount: (container) => mountTabsPlayground(container),
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
        aria-label="Select demo"
        aria-haspopup="menu"
        aria-expanded="false"
        aria-controls="demo-menu-list"
        data-role="menu-button"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      <div class="app-menu-list" id="demo-menu-list" role="menu" aria-label="Demo selector" data-role="menu-list" hidden></div>
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

export const mountDemoShell = (container = document.body) => {
  const shell = createShell();
  container.replaceChildren(shell);

  const menu = shell.querySelector('[data-role="menu"]');
  const menuButton = shell.querySelector('[data-role="menu-button"]');
  const menuList = shell.querySelector('[data-role="menu-list"]');
  const demoOutlet = shell.querySelector('[data-role="demo-outlet"]');

  if (
    !(menu instanceof HTMLElement) ||
    !(menuButton instanceof HTMLButtonElement) ||
    !(menuList instanceof HTMLElement) ||
    !(demoOutlet instanceof HTMLElement)
  ) {
    throw new Error("Demo shell failed to initialize.");
  }

  let currentUnmount = null;
  let currentDemoId = "";

  const setMenuOpen = (open) => {
    menu.classList.toggle("is-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuList.hidden = !open;
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
    demoOutlet.replaceChildren();

    currentDemoId = nextDemo.id;
    shell.dataset.demoId = nextDemo.id;
    shell.classList.toggle("is-fixed-layout", FIXED_LAYOUT_DEMO_IDS.has(nextDemo.id));
    window.location.hash = nextDemo.id;
    renderMenu(menuList, nextDemo.id, mountSelectedDemo);
    setMenuOpen(false);

    const mounted = nextDemo.mount(demoOutlet);
    currentUnmount = typeof mounted?.unmount === "function" ? () => mounted.unmount() : null;
    if (restoreMenuFocus) menuButton.focus();
  };

  const syncFromHash = () => {
    mountSelectedDemo(getRouteDemoId());
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
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleDocumentKeydown);
  syncFromHash();

  return {
    unmount() {
      window.removeEventListener("hashchange", syncFromHash);
      menuButton.removeEventListener("click", handleMenuButtonClick);
      menuButton.removeEventListener("keydown", handleMenuButtonKeydown);
      menuList.removeEventListener("keydown", handleMenuListKeydown);
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("keydown", handleDocumentKeydown);
      currentUnmount?.();
      shell.remove();
    },
  };
};
