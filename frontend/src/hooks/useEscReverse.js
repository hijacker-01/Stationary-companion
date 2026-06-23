import { useEffect } from "react";

/**
 * useEscReverse — Esc is the exact reverse of Enter.
 *
 * Enter moves focus forward one input (field -> field, cell -> next cell ->
 * next row). Esc moves it back one input along that same path and selects the
 * field it lands on, so the previous entry can be retyped ("take it back").
 *
 * Runs in the capture phase BEFORE useTableNav / useFormNav (the forward Enter
 * navigation) and before the global back handler, so a single rule covers
 * forms, item-row tables and modals uniformly:
 *  - If a suggestion dropdown is open (aria-expanded), it yields so the first
 *    Esc just closes the dropdown (that was the most recent step forward).
 *  - When it steps back, it stops all other Esc handling for this event.
 *  - At the very first input it does nothing, letting the page step its view
 *    back and the global handler go back a page — the final links in the chain.
 */
const FOCUSABLE =
  'input:not([disabled]):not([type="hidden"]):not([readonly]):not([tabindex="-1"]), ' +
  'select:not([disabled]):not([tabindex="-1"]), ' +
  'textarea:not([disabled]):not([readonly]):not([tabindex="-1"]), ' +
  'button:not([disabled]):not([tabindex="-1"]), ' +
  '[data-smart-select] input:not([disabled])';

const CHROME = 'header, nav, aside, [data-section="sidebar"], [data-section="right-sidebar"]';

export function useEscReverse() {
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;

      const active = document.activeElement;
      if (!active) return;

      // Only reverse while sitting in an editable field.
      if (!["INPUT", "SELECT", "TEXTAREA"].includes(active.tagName)) return;
      // Let an open dropdown/suggestion list close first.
      if (active.getAttribute("aria-expanded") === "true") return;
      // Leave the app chrome (header/sidebars) to their own handlers.
      if (active.closest(CHROME)) return;

      // Reverse within the nearest meaningful scope: a modal, an explicit form
      // scope, a form, otherwise the main content area.
      const scope =
        active.closest('[role="dialog"], .fixed.inset-0') ||
        active.closest("[data-form-scope]") ||
        active.closest("form") ||
        active.closest("main") ||
        document.body;

      const els = Array.from(scope.querySelectorAll(FOCUSABLE)).filter((el) => {
        if (el.closest(CHROME)) return false;
        if (el.offsetParent === null && el.type !== "hidden") return false; // skip hidden
        return true;
      });

      const idx = els.indexOf(active);
      if (idx > 0) {
        // Step back one input and claim the event so nothing else reacts.
        e.preventDefault();
        e.stopImmediatePropagation();
        const prev = els[idx - 1];
        prev.focus();
        if (prev.tagName === "INPUT" && prev.type !== "checkbox" && prev.type !== "radio") {
          setTimeout(() => { try { prev.select(); } catch (_) { /* number inputs etc. */ } }, 0);
        }
      }
      // idx <= 0 (first input) or not found: do nothing — boundary handlers
      // (page view step-back, then global "go back a page") take over.
    };

    // Capture phase + registered first, so it precedes the forward Enter-nav.
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, []);
}
