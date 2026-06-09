import React, { useState, useRef, useEffect } from "react";

export default function SmartSelect({ value, onChange, options, className, placeholder, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  
  const selectedLabel = options.find(o => String(o.value) === String(value))?.label || placeholder || "";

  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex(o => String(o.value) === String(value));
      setActiveIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, value, options]);

  return (
    <div className="relative inline-block w-full" ref={containerRef}>
       <input 
          value={selectedLabel}
          readOnly
          disabled={disabled}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={(e) => {
             if (e.key === 'ArrowDown') {
                e.preventDefault();
                setIsOpen(true);
                setActiveIndex(p => Math.min(p + 1, options.length - 1));
             } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setIsOpen(true);
                setActiveIndex(p => Math.max(p - 1, 0));
             } else if (e.key === 'Enter') {
                e.preventDefault();
                if (isOpen && activeIndex >= 0 && !options[activeIndex].disabled) {
                   if (onChange) onChange({ target: { value: options[activeIndex].value } });
                }
                setIsOpen(false);
                // Move focus!
                setTimeout(() => {
                   const scope = document.activeElement.closest('form') || document.body;
                   const focusables = Array.from(scope.querySelectorAll('input:not([disabled]):not([type="hidden"]):not([readonly]), select:not([disabled]), textarea:not([disabled]):not([readonly]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
                   const idx = focusables.indexOf(e.target);
                   if (idx > -1 && focusables[idx + 1]) focusables[idx + 1].focus();
                }, 0);
             } else if (e.key === 'Escape') {
                e.preventDefault();
                setIsOpen(false);
             } else if (e.key.length === 1) {
                // Quick search by typing
                const char = e.key.toLowerCase();
                const idx = options.findIndex(o => o.label.toLowerCase().startsWith(char));
                if (idx >= 0) setActiveIndex(idx);
             }
          }}
          className={`${className} cursor-pointer`} 
          placeholder={placeholder}
       />
       {isOpen && !disabled && (
         <ul className="absolute z-[100] w-full bg-white border border-gray-400 shadow-2xl max-h-48 overflow-y-auto top-full left-0 m-0 p-0 list-none text-left">
           {options.map((opt, idx) => (
             <li 
               key={idx} 
               className={`px-2 py-1 text-xs cursor-pointer ${opt.disabled ? 'text-gray-400 bg-gray-100' : 'text-black'} ${idx === activeIndex && !opt.disabled ? 'bg-[#1b4985] text-white font-bold' : 'hover:bg-blue-50'}`}
               onMouseDown={(e) => {
                 e.preventDefault(); // prevent blur
                 if (!opt.disabled) {
                   if (onChange) onChange({ target: { value: opt.value } });
                   setIsOpen(false);
                   // Auto focus next field after click
                   setTimeout(() => {
                      const scope = containerRef.current.closest('form') || document.body;
                      const focusables = Array.from(scope.querySelectorAll('input:not([disabled]):not([type="hidden"]):not([readonly]), select:not([disabled]), textarea:not([disabled]):not([readonly]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
                      const inputEl = containerRef.current.querySelector('input');
                      const idx = focusables.indexOf(inputEl);
                      if (idx > -1 && focusables[idx + 1]) focusables[idx + 1].focus();
                   }, 0);
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
