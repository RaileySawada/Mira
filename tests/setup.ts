jest.mock("../src/components/confirmAction", () => ({ confirmAction: jest.fn().mockResolvedValue(true) }));
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";

type Media = {
  matches: boolean;
  media: string;
  listeners: Set<() => void>;
  addEventListener: (event: string, listener: () => void) => void;
  removeEventListener: (event: string, listener: () => void) => void;
};
const mediaQueries = new Map<string, Media>();
export function setMedia(query: string, matches: boolean) {
  window.matchMedia(query);
  const media = mediaQueries.get(query)!;
  media.matches = matches;
  media.listeners.forEach((listener) => listener());
}
Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: jest.fn((query: string) => {
    if (!mediaQueries.has(query)) {
      const listeners = new Set<() => void>();
      mediaQueries.set(query, {
        matches: false,
        media: query,
        listeners,
        addEventListener: (_event, listener) => {
          listeners.add(listener);
        },
        removeEventListener: (_event, listener) => {
          listeners.delete(listener);
        },
      });
    }
    return mediaQueries.get(query);
  }),
});
Object.defineProperty(window, "scrollTo", {
  configurable: true,
  value: jest.fn(),
});
Object.defineProperty(Element.prototype, "scrollIntoView", {
  configurable: true,
  value: jest.fn(),
});
Object.defineProperty(Element.prototype, "animate", {
  configurable: true,
  value: jest.fn(),
});
Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
  configurable: true,
  value: function (this: HTMLDialogElement) {
    this.open = true;
  },
});
Object.defineProperty(HTMLDialogElement.prototype, "close", {
  configurable: true,
  value: function (this: HTMLDialogElement) {
    this.open = false;
  },
});
Object.defineProperty(URL, "createObjectURL", {
  configurable: true,
  value: jest.fn(() => "blob:mira-test"),
});
Object.defineProperty(URL, "revokeObjectURL", {
  configurable: true,
  value: jest.fn(),
});
Object.defineProperty(window, "confirm", {
  configurable: true,
  value: jest.fn(() => true),
});
Object.defineProperty(window, "alert", {
  configurable: true,
  value: jest.fn(),
});

beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, "", "/");
  document.documentElement.removeAttribute("style");
  document.documentElement.removeAttribute("data-theme");
  document.body.removeAttribute("style");
  mediaQueries.clear();
});
afterEach(() => {
  cleanup();
  jest.useRealTimers();
});

// jsdom has no layout engine; give responsive charts a stable viewport.
const originalBounds = Element.prototype.getBoundingClientRect;
Element.prototype.getBoundingClientRect = function () {
  if (this.classList.contains("recharts-responsive-container"))
    return { x: 0, y: 0, top: 0, left: 0, bottom: 200, right: 320, width: 320, height: 200, toJSON: () => ({}) };
  return originalBounds.call(this);
};
class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(globalThis, "ResizeObserver", { configurable: true, value: TestResizeObserver });
