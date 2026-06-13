import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
// `?inline` returns the compiled Tailwind CSS as a string instead of injecting it into the
// document — so we can scope it inside the Shadow DOM and never leak styles into the host page.
import widgetCss from "../styles.css?inline";
import { setApiBaseUrl } from "../lib/runtimeConfig";
import { parseWidgetConfig } from "./config";
import { WidgetApp } from "./WidgetApp";

const ELEMENT_NAME = "harness-assistant";

const FONT_HREFS = [
  "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap",
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap",
];

/**
 * Fonts (Manrope/Inter/JetBrains Mono + Material Symbols) must live in the host document head —
 * @font-face is global and crosses the shadow boundary, whereas everything else stays scoped.
 * Idempotent: each href is injected at most once per page.
 */
function ensureFonts(): void {
  for (const href of FONT_HREFS) {
    if (document.head.querySelector(`link[href="${href}"]`)) continue;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }
}

class HarnessAssistantElement extends HTMLElement {
  private root: Root | null = null;
  private mountPoint: HTMLDivElement | null = null;

  static get observedAttributes(): string[] {
    return ["data-academy-route", "data-academy-title", "data-chat-open", "data-theme", "theme"];
  }

  connectedCallback(): void {
    // The fixed-position panel escapes layout, so the host element itself takes no space.
    this.style.display = "contents";
    ensureFonts();

    const shadow = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = widgetCss;
    shadow.appendChild(style);

    this.mountPoint = document.createElement("div");
    shadow.appendChild(this.mountPoint);

    this.root = createRoot(this.mountPoint);
    this.render();
  }

  attributeChangedCallback(): void {
    if (this.root) this.render();
  }

  disconnectedCallback(): void {
    this.root?.unmount();
    this.root = null;
  }

  private render(): void {
    if (!this.root) return;
    const config = parseWidgetConfig(this);
    if (config.apiBaseUrl) setApiBaseUrl(config.apiBaseUrl);
    if (this.mountPoint) {
      const theme = config.theme ?? "light";
      this.mountPoint.className = `assistant-theme-${theme} ${theme}`;
    }
    this.root.render(
      <StrictMode>
        <WidgetApp config={config} />
      </StrictMode>,
    );
  }
}

/** Register `<harness-assistant>` once. Safe to call multiple times (e.g. re-imported script). */
export function defineHarnessAssistant(): void {
  if (typeof window === "undefined") return;
  if (!customElements.get(ELEMENT_NAME)) {
    customElements.define(ELEMENT_NAME, HarnessAssistantElement);
  }
}

defineHarnessAssistant();
