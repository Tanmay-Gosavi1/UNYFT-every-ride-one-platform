import React from 'react';

export default function Badge({ children, variant = 'neutral', size = 'sm', icon: Icon, className = '' }) {
  const variantStyles = {
    bestValue: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-sm',
    quickest: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 shadow-sm',
    surge: 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse',
    neutral: 'bg-slate-800/60 text-slate-300 border-slate-700/60',
    uber: 'bg-black text-white border-white/20',
    ola: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
    mock: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  };

  const sizeStyles = {
    xs: 'text-[10px] px-2 py-0.5 font-medium gap-1',
    sm: 'text-xs px-2.5 py-1 font-semibold gap-1.5',
    md: 'text-sm px-3 py-1.5 font-semibold gap-2',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border backdrop-blur-md ${variantStyles[variant] || variantStyles.neutral} ${sizeStyles[size] || sizeStyles.sm} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      {children}
    </span>
  );
}
