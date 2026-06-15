import { useEffect } from "react";

/**
 * useDocumentKeyboard — Reusable keyboard handlers for transaction forms.
 *
 * Provides:
 * - Shift+Enter to finish/save (calls onFinish)
 * - Enter on preview to print (calls onPrint)
 * - Automatically wired to form's current `view` state
 *
 * Usage:
 *   const { view, setView } = useState("list"); // list | create | preview
 *   const handleSave = () => { ... };
 *   const handlePrint = () => window.print();
 *   useDocumentKeyboard({ view, onFinish: handleSave, onPrint: handlePrint });
 */
export function useDocumentKeyboard({ view, onFinish, onPrint }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter' && e.shiftKey && view === 'create') {
        e.preventDefault();
        e.stopPropagation();
        onFinish?.();
      } else if (e.key === 'Enter' && view === 'preview') {
        e.preventDefault();
        e.stopPropagation();
        onPrint?.();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [view, onFinish, onPrint]);
}
