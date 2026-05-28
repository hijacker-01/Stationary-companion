type ShortcutHandler = () => void;

const registry = new Map<string, ShortcutHandler>();

export function registerShortcut(key: string, handler: ShortcutHandler) {
  registry.set(key.toLowerCase(), handler);
}

export function unregisterShortcut(key: string) {
  registry.delete(key.toLowerCase());
}

export function handleShortcut(event: KeyboardEvent) {
  const key = `${event.ctrlKey ? "ctrl+" : ""}${event.altKey ? "alt+" : ""}${event.shiftKey ? "shift+" : ""}${event.key}`.toLowerCase();
  const handler = registry.get(key);
  if (handler) {
    event.preventDefault();
    handler();
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("keydown", handleShortcut);
}
