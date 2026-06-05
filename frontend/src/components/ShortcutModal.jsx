import React, { useState, useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

export default function ShortcutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "Alt + S", desc: "Open Billing / Sales Entry" },
    { key: "Alt + P", desc: "Open Purchase Entry" },
    { key: "Alt + I", desc: "Open Items / Inventory" },
    { key: "Alt + L", desc: "Open Ledger" },
    { key: "Alt + D", desc: "Go to Dashboard" },
    { key: "F2", desc: "Focus Product Search (in Billing)" },
    { key: "F3", desc: "Focus Customer Search (in Billing)" },
    { key: "F10", desc: "Save Invoice (in Billing)" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden">
        <div className="bg-slate-900 px-4 py-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-teal-400" />
            <h2 className="font-bold">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="hover:bg-slate-800 p-1 rounded transition-colors text-slate-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 bg-slate-50">
          <p className="text-xs text-slate-500 mb-4">Master these shortcuts to navigate the ERP faster like a power user.</p>
          <div className="space-y-2">
            {shortcuts.map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-white border border-slate-200 rounded p-2 shadow-sm">
                <span className="text-sm font-semibold text-slate-700">{s.desc}</span>
                <span className="text-xs font-bold font-mono bg-slate-100 border border-slate-300 text-slate-600 px-2 py-1 rounded">
                  {s.key}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-100 border-t border-slate-200 px-4 py-3 flex justify-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Press Ctrl + / to toggle this menu anytime</p>
        </div>
      </div>
    </div>
  );
}
