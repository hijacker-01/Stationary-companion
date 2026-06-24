import { useEffect } from "react";

/**
 * useArrowOptionNav — app-wide "smart toggle" between option controls.
 *
 * When focus sits on a button / tab / option (NOT a text field), the arrow keys
 * move focus to the adjacent option in the same group, so any row of choices is
 * keyboard-navigable everywhere — synchronised with Enter (activate) and Esc
 * (the global reverse/step-back). It deliberately yields to:
 *   - text/number/date inputs, textareas, selects (they own their arrows),
 *   - tables (useTableNav), open dropdowns (aria-expanded),
 *   - the sidebar/header/right-rail chrome,
 *   - any element whose own handler already consumed the key (defaultPrevented).
 *
 * The "group" is the nearest ancestor that holds 2+ options (a button row, a tab
 * bar, an action bar…), or an explicit [data-option-group]. Right/Down → next,
 * Left/Up → previous, wrapping around.
 */
const OPTION =
  'button:not([disabled]):not([tabindex="-1"]), [role="button"]:not([tabindex="-1"]), [role="tab"]:not([tabindex="-1"]), a[href]:not([tabindex="-1"]), [data-option]:not([tabindex="-1"])';

const CHROME = 'header, nav, aside, [data-section="sidebar"], [data-section="right-sidebar"]';

function isTextField(el) {
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const t = (el.getAttribute("type") || "text").toLowerCase();
    return !["checkbox", "radio", "button", "submit", "reset", "file"].includes(t);
  }
  return false;
}

export function useArrowOptionNav() {
  useEffect(() => {
    const handler = (e) => {
      if (e.defaultPrevented) return;
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;

      const active = document.activeElement;
      if (!active) return;
      if (isTextField(active)) return;                              // inputs own arrows
      if (active.getAttribute("aria-expanded") === "true") return;  // open dropdown owns arrows
      if (active.closest("table")) return;                          // useTableNav owns arrows
      if (active.closest(CHROME)) return;                           // chrome owns arrows
      if (!active.matches(OPTION)) return;                          // only when on an option control

      const visible = (el) => el.offsetParent !== null && !el.closest(CHROME);

      // Find the nearest ancestor group that holds 2+ visible options.
      let opts = [];
      let node = active.closest("[data-option-group]") || active.parentElement;
      while (node) {
        const found = Array.from(node.querySelectorAll(OPTION)).filter(visible);
        if (found.length >= 2) { opts = found; break; }
        if (node.tagName === "MAIN" || node === document.body) break;
        node = node.parentElement;
      }
      const idx = opts.indexOf(active);
      if (idx === -1 || opts.length < 2) return;

      const fwd = e.key === "ArrowRight" || e.key === "ArrowDown";
      const next = opts[(idx + (fwd ? 1 : -1) + opts.length) % opts.length];
      if (next && next !== active) {
        e.preventDefault();
        e.stopPropagation();
        next.focus();
      }
    };
    // Bubble phase: a control's own onKeyDown (React, fires first) can claim the
    // arrow via preventDefault and we'll skip it.
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
