// Lazy loader for the embeddable assistant widget. The widget bundle is self-hosted in
// academy/public and the <harness-assistant> custom element is registered on load.

const SCRIPT_ID = "harness-assistant-widget";
const ELEMENT_TAG = "harness-assistant";

let loadPromise: Promise<void> | null = null;

export interface WidgetAttrs {
  apiBaseUrl: string;
  academyRoute?: string;
  academyTitle?: string;
}

/** Inject the widget script once. Idempotent: concurrent/repeat calls share one promise. */
export function loadWidgetScript(src: string): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  if (customElements.get(ELEMENT_TAG)) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(
      SCRIPT_ID,
    ) as HTMLScriptElement | null;
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null; // allow a retry on the next click
      reject(new Error("Could not load script assistant!"));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}

/** Create-or-reuse the single <harness-assistant> element and refresh its context attributes. */
export function ensureWidgetElement(attrs: WidgetAttrs): HTMLElement {
  let el = document.querySelector(ELEMENT_TAG) as HTMLElement | null;
  if (!el) {
    el = document.createElement(ELEMENT_TAG);
    document.body.appendChild(el);
  }
  el.setAttribute("api-base-url", attrs.apiBaseUrl);
  if (attrs.academyRoute) el.setAttribute("academy-route", attrs.academyRoute);
  if (attrs.academyTitle) el.setAttribute("academy-title", attrs.academyTitle);
  else el.removeAttribute("academy-title");
  return el;
}

export function openWidget(el: HTMLElement): void {
  el.setAttribute("open", "");
}
