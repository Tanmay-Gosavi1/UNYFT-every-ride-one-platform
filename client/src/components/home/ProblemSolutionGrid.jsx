import React from 'react';
import { motion } from 'framer-motion';
import { 
  XCircle, 
  CheckCircle2, 
  Smartphone, 
  Zap, 
  Clock, 
  TrendingUp, 
  Layers, 
  Repeat,
  ShieldAlert,
  Flame
} from 'lucide-react';

export default function ProblemSolutionGrid() {
  return (
    <section className="py-20 bg-[#080c14] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Built for Riders Who Value Time & Money
          </h2>
          <p className="text-slate-400 mt-3 text-sm sm:text-base">
            Why commuters lose an average of ₹4,200/year and 48 hours to app switching fatigue.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">
          
          {/* Problem Card (Multi-app fatigue) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl p-7 bg-rose-950/10 border border-rose-500/20 relative flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2.5 text-rose-400 font-bold text-xs uppercase tracking-wider mb-4">
                <XCircle className="w-4 h-4 text-rose-500" />
                <span>The Multi-App Friction</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Fragmented App Toggling
              </h3>

              <div className="space-y-4 text-sm text-slate-300">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
                  <Smartphone className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block text-xs">Switching between 3-4 separate apps</strong>
                    <span className="text-xs text-slate-400">Re-typing pickup & dropoff coordinates repeatedly across Uber, Ola, and Rapido.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
                  <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block text-xs">Unpredictable surge spikes while waiting</strong>
                    <span className="text-xs text-slate-400">By the time you compare Ola, Uber's surge jumped from 1.2x to 1.7x and the fare lock expired.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
                  <Repeat className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block text-xs">Driver cancellation loops</strong>
                    <span className="text-xs text-slate-400">Driver cancels after 6 minutes. You start the whole multi-app comparison search all over again.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-rose-500/10 text-xs text-rose-300 font-medium">
              Result: 4-6 minutes wasted per trip, paying ₹80-₹200 more per ride.
            </div>
          </motion.div>

          {/* Solution Card (UNYFT Unified Platform) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl p-7 bg-emerald-950/15 border border-emerald-500/30 relative flex flex-col justify-between shadow-glow-emerald"
          >
            <div>
              <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>The UNYFT Solution</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                One Unified Dispatch Deck
              </h3>

              <div className="space-y-4 text-sm text-slate-300">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/20">
                  <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block text-xs">Parallel API Fan-out in &lt; 300ms</strong>
                    <span className="text-xs text-slate-400">Enter pickup once. Our backend strategy adapters query all providers concurrently.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/20">
                  <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block text-xs">Live Surge Detection & Price Matrix</strong>
                    <span className="text-xs text-slate-400">Instant sorting by Best Price, Fastest ETA, or Category. Highlighted savings at a glance.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/20">
                  <Layers className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block text-xs">Universal Telemetry & Driver Radar</strong>
                    <span className="text-xs text-slate-400">Track driver location, vehicle license, and trip status in one unified live map interface.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-emerald-500/20 text-xs text-emerald-300 font-medium">
              Result: 18-24% average fare saved, instant booking, zero cognitive load.
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
