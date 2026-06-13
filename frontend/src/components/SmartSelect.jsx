import React, { useState, useRef, useEffect, useCallback } from "react";

/**
 * SmartSelect — A keyboard-first dropdown replacement for native <select>.
 * 
 * Features:
 * - Auto-opens on focus (dropdown appears immediately)
 * - Arrow keys navigate options one-by-one
 * - Enter selects the highlighted option AND auto-advances focus to next field
 * - Type-ahead: pressing a letter key jumps to matching option
 * - Mouse click on option selects AND auto-advances
 * - Escape closes dropdown without selecting
 * - Scrolls active item into view
 * 
 * Props:
 * - value: current selected value
 * - onChange: callback({ target: { value } })
 * - options: [{ value, label, disabled? }]
 * - className: styling for the input
 * - placeholder: placeholder text
 * - disabled: disable the select
 * - autoFocus: auto-focus on mount
 * - id: HTML id attribute
 */
export default function SmartSelect({ value, onChange, options = [], className = "", placeholder = "", disabled, autoFocus, id }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  
  const selectedLabel = options.find(o => String(o.value) === String(value))?.label || placeholder || "";

  // When dropdown opens, highlight the currently selected value
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex(o => String(o.value) === String(value));
      setActiveIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, value, options]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listRef.current && activeIndex >= 0) {
      const items = listRef.current.children;
      if (items[activeIndex]) {
        items[activeIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen, activeIndex]);

  // Auto-focus on mount if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 50);
    }
  }, [autoFocus]);

  // Helper: move focus to next focusable element after this SmartSelect
  const advanceFocus = useCallback((fromElement) => {
    setTimeout(() => {
      const scope = (fromElement || inputRef.current)?.closest('[data-form-scope]') || 
                    (fromElement || inputRef.current)?.closest('main') || 
                    document.body;
      const focusables = Array.from(scope.querySelectorAll(
        'input:not([disabled]):not([type="hidden"]):not([readonly]), select:not([disabled]), textarea:not([disabled]):not([readonly]), button:not([disabled])'
      )).filter(el => {
        if (el.closest('header, nav, aside, [data-section="sidebar"]')) return false;
        if (el.offsetParent === null) return false;
        return true;
      });
      const currentInput = fromElement || inputRef.current;
      const idx = focusables.indexOf(currentInput);
      if (idx > -1 && focusables[idx + 1]) {
        focusables[idx + 1].focus();
      }
    }, 10);
  }, []);

  const handleSelect = useCallback((optValue) => {
    if (onChange) onChange({ target: { value: optValue } });
    setIsOpen(false);
    advanceFocus(inputRef.current);
  }, [onChange, advanceFocus]);

  return (
    <div className="relative inline-block w-full" ref={containerRef} data-smart-select="true">
       <input
          ref={inputRef}
          id={id}
          value={selectedLabel}
          readOnly
          disabled={disabled}
          aria-expanded={isOpen ? 'true' : 'false'}
          onFocus={() => { if (!disabled) setIsOpen(true); }}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          onKeyDown={(e) => {
             if (e.key === 'ArrowDown') {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(true);
                setActiveIndex(p => Math.min(p + 1, options.length - 1));
             } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(true);
                setActiveIndex(p => Math.max(p - 1, 0));
             } else if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                if (isOpen && activeIndex >= 0 && options[activeIndex] && !options[activeIndex].disabled) {
                   handleSelect(options[activeIndex].value);
                } else {
                   // Not open or nothing to select — just advance
                   setIsOpen(false);
                   advanceFocus(inputRef.current);
                }
             } else if (e.key === 'Escape') {
                e.preventDefault();
                setIsOpen(false);
             } else if (e.key === 'Tab') {
                // Let Tab work naturally but close dropdown
                setIsOpen(false);
             } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey) {
                // Type-ahead: jump to first matching option
                const char = e.key.toLowerCase();
                const idx = options.findIndex((o, i) => i > activeIndex && !o.disabled && o.label.toLowerCase().startsWith(char));
                const fallbackIdx = options.findIndex(o => !o.disabled && o.label.toLowerCase().startsWith(char));
                if (idx >= 0) setActiveIndex(idx);
                else if (fallbackIdx >= 0) setActiveIndex(fallbackIdx);
             }
          }}
          className={`${className} cursor-pointer`} 
          placeholder={placeholder}
       />
       {isOpen && !disabled && options.length > 0 && (
         <ul ref={listRef} className="absolute z-[100] w-full bg-white border border-gray-400 shadow-2xl max-h-48 overflow-y-auto top-full left-0 m-0 p-0 list-none text-left">
           {options.map((opt, idx) => (
             <li 
               key={`${opt.value}-${idx}`}
               className={`px-2 py-1.5 text-xs cursor-pointer border-b border-gray-50 last:border-0
                 ${opt.disabled ? 'text-gray-400 bg-gray-50 cursor-not-allowed' : 'text-black'} 
                 ${idx === activeIndex && !opt.disabled ? 'bg-[#1b4985] text-white font-bold' : 'hover:bg-blue-50'}`}
               onMouseDown={(e) => {
                 e.preventDefault();
                 if (!opt.disabled) {
                   handleSelect(opt.value);
                 }
               }}
             >
               {opt.label}
             </li>
           ))}
         </ul>
       )}
    </div>
  );
}
