import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { Window } from "happy-dom";

const alreadyRegistered = (globalThis as { __happyDomRegistered?: boolean })
  .__happyDomRegistered;

if (!alreadyRegistered) {
  GlobalRegistrator.register();
  (globalThis as { __happyDomRegistered?: boolean }).__happyDomRegistered = true;
}

if (typeof document === "undefined" || !document.body) {
  const windowInstance = new Window();
  globalThis.window = windowInstance as unknown as Window & typeof globalThis.window;
  // @ts-expect-error
  globalThis.document = windowInstance.document;
  // @ts-expect-error
  globalThis.navigator = windowInstance.navigator;
  // @ts-expect-error
  globalThis.HTMLElement = windowInstance.HTMLElement;
  // @ts-expect-error
  globalThis.Node = windowInstance.Node;
  // @ts-expect-error
  globalThis.customElements = windowInstance.customElements;
  // @ts-expect-error
  globalThis.getComputedStyle = windowInstance.getComputedStyle;
  // @ts-expect-error
  globalThis.requestAnimationFrame = windowInstance.requestAnimationFrame;
  // @ts-expect-error
  globalThis.cancelAnimationFrame = windowInstance.cancelAnimationFrame;
  // @ts-expect-error
  globalThis.Event = windowInstance.Event;
  // @ts-expect-error
  globalThis.MouseEvent = windowInstance.MouseEvent;
  // @ts-expect-error
  globalThis.KeyboardEvent = windowInstance.KeyboardEvent;
}
