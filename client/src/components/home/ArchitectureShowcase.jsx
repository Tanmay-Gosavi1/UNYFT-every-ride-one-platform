import React from 'react';
import { motion } from 'framer-motion';
import { 
  Cpu, 
  Database, 
  Radio, 
  ShieldCheck, 
  GitBranch, 
  ArrowRight,
  Server,
  Layers,
  Lock
} from 'lucide-react';

export default function ArchitectureShowcase() {
  return (
    <section className="py-20 border-t border-white/5 bg-[#090e18]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-semibold mb-3">
            <Cpu className="w-3.5 h-3.5" />
            <span>MODULAR PLUG & PLAY ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Built on Strategy Pattern & Async Fan-out
          </h2>
          <p className="text-slate-400 mt-3 text-sm sm:text-base">
            Engineered so new providers (Rapido, BluSmart, Bolt, Lyft) can be added in hours without touching core dispatch or frontend logic.
          </p>
        </div>

        {/* Visual Architecture Flow Diagram */}
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-white/10 max-w-5xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
            
            {/* Step 1: Client Query */}
            <div className="rounded-2xl p-6 bg-slate-900/80 border border-white/5 relative">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-sm mb-4 border border-cyan-500/20">
                01
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Unified Client Query</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Rider enters pickup and dropoff once. Request is validated via Joi and dispatches a single POST to <code className="text-cyan-300 bg-slate-800 px-1 py-0.5 rounded">/api/rides/estimate</code>.
              </p>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 text-[11px] text-slate-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span>Zustand State Engine</span>
              </div>
            </div>

            {/* Step 2: Aggregation Core & Fan-out */}
            <div className="rounded-2xl p-6 bg-emerald-950/20 border border-emerald-500/30 relative shadow-glow-emerald">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-sm mb-4 border border-emerald-500/40">
                02
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Parallel Strategy Fan-out</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                <code className="text-emerald-300 bg-emerald-950/60 px-1 py-0.5 rounded">ProviderRegistry</code> executes <code className="text-emerald-300 bg-emerald-950/60 px-1 py-0.5 rounded">Promise.allSettled</code> across all active adapters. Failsafes prevent one slow provider from blocking others.
              </p>
              <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center gap-2 text-[11px] text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Sub-300ms Multi-dispatch</span>
              </div>
            </div>

            {/* Step 3: Normalization & Telemetry */}
            <div className="rounded-2xl p-6 bg-slate-900/80 border border-white/5 relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm mb-4 border border-indigo-500/20">
                03
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Normalized Radar & Matrix</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Response mappers normalize Uber v1.2, Ola Partner, and Mock schemas into one unified contract. Socket.IO streams live driver coordinates directly into client radar.
              </p>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 text-[11px] text-slate-400">
                <Radio className="w-3.5 h-3.5 text-indigo-400" />
                <span>Socket.IO Live Telemetry</span>
              </div>
            </div>

          </div>

          {/* Adapter Provider List */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 text-center">
              Active Provider Adapter Layer (Abstract Class ProviderAdapter)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
                <div className="text-xs font-bold text-white">UberAdapter</div>
                <div className="text-[10px] text-slate-400 mt-1">REST API v1.2 • Fare Lock</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
                <div className="text-xs font-bold text-white">OlaAdapter</div>
                <div className="text-[10px] text-amber-400 mt-1">Partner API • CRN + OTP</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
                <div className="text-xs font-bold text-white">RapidoAdapter</div>
                <div className="text-[10px] text-slate-400 mt-1">Bike & Auto Spec</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
                <div className="text-xs font-bold text-emerald-400">MockAdapter</div>
                <div className="text-[10px] text-emerald-400 mt-1">Sandbox Radar Simulator</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
