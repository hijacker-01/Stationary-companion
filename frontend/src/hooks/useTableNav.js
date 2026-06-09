import { useEffect } from "react";

export function useTableNav() {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const active = document.activeElement;
      if (!active) return;

      const isCellOrInputInTable = active.closest('table');
      if (!isCellOrInputInTable) return;
      
      const tbody = active.closest('tbody');
      if (!tbody) return;

      const currentCell = active.closest('td, th');
      const currentRow = active.closest('tr');
      if (!currentCell || !currentRow) return;

      const cells = Array.from(currentRow.children);
      const colIndex = cells.indexOf(currentCell);
      
      const rows = Array.from(tbody.children);
      const rowIndex = rows.indexOf(currentRow);

      const focusCell = (r, c) => {
        if (r >= 0 && r < rows.length) {
          const row = rows[r];
          const targetCell = row.children[c];
          if (targetCell) {
            const focusable = targetCell.querySelector('input, select, textarea, button, [tabindex]:not([tabindex="-1"])');
            if (focusable) {
              focusable.focus();
              if (focusable.tagName === 'INPUT') setTimeout(() => focusable.select(), 0);
            } else {
              if(!targetCell.hasAttribute('tabindex')) targetCell.setAttribute('tabindex', '-1');
              targetCell.focus();
            }
          }
        }
      };

      const isTextInput = active.tagName === 'INPUT' && (active.type === 'text' || active.type === 'number' || active.type === 'password' || active.type === 'email');

      // If the input has a custom dropdown open, let it handle its own navigation
      if (active.getAttribute('aria-expanded') === 'true' && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter')) return;

      if (e.key === 'ArrowUp') {
        // Only prevent default if we're not inside a multiline textarea
        if (active.tagName !== 'TEXTAREA') {
          e.preventDefault();
          focusCell(rowIndex - 1, colIndex);
        }
      } else if (e.key === 'ArrowDown') {
        if (active.tagName !== 'TEXTAREA') {
          e.preventDefault();
          focusCell(rowIndex + 1, colIndex);
        }
      } else if (e.key === 'ArrowLeft') {
        // If it's a text input, only move cell if cursor is at the beginning or Ctrl is pressed
        if (!isTextInput || e.ctrlKey || active.selectionStart === 0) {
          if (!isTextInput || e.ctrlKey) e.preventDefault();
          focusCell(rowIndex, Math.max(0, colIndex - 1));
        }
      } else if (e.key === 'ArrowRight') {
        // If it's a text input, only move cell if cursor is at the end or Ctrl is pressed
        if (!isTextInput || e.ctrlKey || active.selectionStart === active.value.length) {
          if (!isTextInput || e.ctrlKey) e.preventDefault();
          focusCell(rowIndex, Math.min(cells.length - 1, colIndex + 1));
        }
      } else if (e.key === 'PageUp') {
        e.preventDefault();
        focusCell(Math.max(0, rowIndex - 10), colIndex);
      } else if (e.key === 'PageDown') {
        e.preventDefault();
        focusCell(Math.min(rows.length - 1, rowIndex + 10), colIndex);
      } else if (e.key === 'Home' && e.ctrlKey) {
        e.preventDefault();
        focusCell(0, colIndex);
      } else if (e.key === 'End' && e.ctrlKey) {
        e.preventDefault();
        focusCell(rows.length - 1, colIndex);
      } else if (e.key === 'Escape') {
        if (active.tagName === 'INPUT' || active.tagName === 'SELECT') {
          e.preventDefault();
          active.blur();
          if(!currentCell.hasAttribute('tabindex')) currentCell.setAttribute('tabindex', '-1');
          currentCell.focus();
        }
      } else if (e.key === 'F2' || e.key === 'Enter') {
        // If focused on the cell (not an input), try to focus input inside to "edit"
        if (active === currentCell) {
          const input = currentCell.querySelector('input, select, textarea');
          if (input) {
            e.preventDefault();
            input.focus();
            if (input.tagName === 'INPUT') setTimeout(() => input.select(), 0);
          }
        } else if (e.key === 'Enter' && (isTextInput || active.tagName === 'SELECT')) {
           // Inside input, move to next cell
           e.preventDefault();
           if (colIndex < cells.length - 1) {
              focusCell(rowIndex, colIndex + 1);
           } else {
              focusCell(rowIndex + 1, 0);
           }
        }
      } else if (e.key === ' ' && active === currentCell) {
        // Space to select row
        e.preventDefault();
        const checkbox = currentRow.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.click();
      } else if (e.key === 'a' && e.ctrlKey) {
        // Ctrl+A to select all rows
        e.preventDefault();
        const thead = active.closest('table').querySelector('thead');
        if (thead) {
          const selectAllCheckbox = thead.querySelector('input[type="checkbox"]');
          if (selectAllCheckbox) selectAllCheckbox.click();
        }
      }
    };

    // Use capture phase so we can intercept before inputs handle it, if necessary
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, []);
}
