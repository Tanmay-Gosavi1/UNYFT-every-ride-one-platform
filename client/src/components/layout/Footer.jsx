import React from 'react';
import { Car, ShieldCheck, Zap, Github, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#060a10] text-slate-400 text-xs mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500 text-black">
                <Car className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">UNYFT</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Unified multi-provider ride dispatch and fare matrix. Eliminating multi-app friction with real-time API fanout.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                APIs Operational
              </span>
            </div>
          </div>

          {/* Supported Providers */}
          <div>
            <h4 className="text-white font-semibold mb-3 tracking-wider uppercase text-[11px]">Integrated Networks</h4>
            <ul className="space-y-2">
              <li className="flex items-center justify-between text-slate-300">
                <span>Uber Global v1.2</span>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-emerald-400">REST API</span>
              </li>
              <li className="flex items-center justify-between text-slate-300">
                <span>Ola Cabs Partner</span>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-amber-400">OAuth 2.0</span>
              </li>
              <li className="flex items-center justify-between text-slate-300">
                <span>Rapido Auto & Bike</span>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Adapter</span>
              </li>
              <li className="flex items-center justify-between text-slate-300">
                <span>Mock Sandbox Engine</span>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400">Simulator</span>
              </li>
            </ul>
          </div>

          {/* Architecture & Security */}
          <div>
            <h4 className="text-white font-semibold mb-3 tracking-wider uppercase text-[11px]">System Architecture</h4>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Parallel Fan-out Sub-300ms</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>AES-256 Token Encryption</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-slate-500">•</span>
                <span>Socket.IO Live Driver Telemetry</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-slate-500">•</span>
                <span>Strategy Pattern Adapter Mesh</span>
              </li>
            </ul>
          </div>

          {/* Legal / Disclaimer */}
          <div>
            <h4 className="text-white font-semibold mb-3 tracking-wider uppercase text-[11px]">Compliance & Disclosures</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              UNYFT aggregates authorized ride options via public or sandbox developer interfaces. All trademarks, service marks, and trade names are the property of their respective owners.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © 2026 UNYFT Mobility Aggregator. Production-grade architecture.
          </div>
          <div className="flex items-center gap-4">
            <span>Built with React + Tailwind + Framer Motion</span>
            <span>•</span>
            <span>Express + MongoDB Atlas</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
