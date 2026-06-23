import { useEffect } from "react";

/**
 * useTableNav — Keyboard navigation inside HTML tables.
 * ArrowUp/Down: move between rows in same column
 * Enter: if on a cell, enter edit mode; if in an input, move to next cell in row, then wrap to next row
 * Escape: exit edit mode
 * Defers to custom dropdowns when aria-expanded="true"
 */
export function useTableNav() {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const active = document.activeElement;
      if (!active) return;

      const table = active.closest('table');
      if (!table) return;
      
      const tbody = active.closest('tbody');
      if (!tbody) return;

      const currentCell = active.closest('td, th');
      const currentRow = active.closest('tr');
      if (!currentCell || !currentRow) return;

      const cells = Array.from(currentRow.children);
      const colIndex = cells.indexOf(currentCell);
      
      const rows = Array.from(tbody.children);
      const rowIndex = rows.indexOf(currentRow);

      // Find the next cell with a focusable element, skipping empty cells
      const focusCellSmart = (r, startCol, direction) => {
        if (r < 0 || r >= rows.length) return false;
        const row = rows[r];
        const rowCells = Array.from(row.children);
        
        let c = startCol;
        while (c >= 0 && c < rowCells.length) {
          const targetCell = rowCells[c];
          if (targetCell) {
            const focusable = targetCell.querySelector('input:not([disabled]):not([readonly]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])');
            if (focusable) {
              focusable.focus();
              if (focusable.tagName === 'INPUT' && focusable.type !== 'checkbox') {
                setTimeout(() => focusable.select(), 0);
              }
              return true;
            }
          }
          c += direction;
        }
        return false;
      };

      const focusCell = (r, c) => {
        if (r >= 0 && r < rows.length) {
          const row = rows[r];
          const targetCell = row.children[c];
          if (targetCell) {
            const focusable = targetCell.querySelector('input:not([disabled]):not([readonly]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])');
            if (focusable) {
              focusable.focus();
              if (focusable.tagName === 'INPUT' && focusable.type !== 'checkbox') {
                setTimeout(() => focusable.select(), 0);
              }
              return true;
            }
          }
        }
        return false;
      };

      const isTextInput = active.tagName === 'INPUT' && (active.type === 'text' || active.type === 'number' || active.type === 'password' || active.type === 'email');

      // If the input has a custom dropdown open, let it handle its own navigation
      if (active.getAttribute('aria-expanded') === 'true' && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter')) return;

      if (e.key === 'ArrowUp') {
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
        if (!isTextInput || e.ctrlKey || active.selectionStart === 0) {
          if (!isTextInput || e.ctrlKey) e.preventDefault();
          // Move left, skipping cells with no focusable element
          let c = colIndex - 1;
          while (c >= 0) {
            if (focusCell(rowIndex, c)) break;
            c--;
          }
        }
      } else if (e.key === 'ArrowRight') {
        if (!isTextInput || e.ctrlKey || active.selectionStart === active.value.length) {
          if (!isTextInput || e.ctrlKey) e.preventDefault();
          let c = colIndex + 1;
          while (c < cells.length) {
            if (focusCell(rowIndex, c)) break;
            c++;
          }
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
      } else if (e.key === 'Enter') {
        // If focused on the cell itself (not an input), try to focus input inside to "edit"
        if (active === currentCell) {
          const input = currentCell.querySelector('input, select, textarea');
          if (input) {
            e.preventDefault();
            input.focus();
            if (input.tagName === 'INPUT') setTimeout(() => input.select(), 0);
          }
        } else if (isTextInput || active.tagName === 'SELECT') {
          // Inside an input/select — move to next focusable cell in row, then wrap to next row
          e.preventDefault();
          e.stopPropagation();
          
          // Try to find next focusable cell in same row
          let found = false;
          for (let c = colIndex + 1; c < cells.length; c++) {
            if (focusCell(rowIndex, c)) { found = true; break; }
          }
          
          // If not found, move to first focusable cell of next row
          if (!found && rowIndex + 1 < rows.length) {
            focusCellSmart(rowIndex + 1, 0, 1);
          }
        }
      } else if (e.key === ' ' && active === currentCell) {
        e.preventDefault();
        const checkbox = currentRow.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.click();
      } else if (e.key === 'a' && e.ctrlKey) {
        e.preventDefault();
        const thead = table.querySelector('thead');
        if (thead) {
          const selectAllCheckbox = thead.querySelector('input[type="checkbox"]');
          if (selectAllCheckbox) selectAllCheckbox.click();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, []);
}
