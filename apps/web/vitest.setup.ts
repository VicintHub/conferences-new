import "@testing-library/jest-dom/vitest";

// jsdom has no matchMedia. Tests choose the viewport with `setDesktop(true)`; phones by default.
let desktop = false;
export const setDesktop = (v: boolean) => {
  desktop = v;
};
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: /min-width:\s*\d+px/.test(query) ? desktop : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
    onchange: null,
  }),
});
