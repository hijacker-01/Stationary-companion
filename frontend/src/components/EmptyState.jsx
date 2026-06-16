import React from 'react';
import * as LucideIcons from 'lucide-react';

export default function EmptyState({ icon, title, description, actionLabel, onAction }) {
  const IconComponent = typeof icon === 'string' ? LucideIcons[icon] : icon;

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
        {IconComponent && <IconComponent className="w-8 h-8 text-slate-400" strokeWidth={1.5} />}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">{description}</p>
      
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
