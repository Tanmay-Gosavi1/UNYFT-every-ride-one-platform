import React from 'react';
import { motion } from 'framer-motion';
import { useUIStore } from '../../stores/uiStore';
import { useRideStore, PRESET_LOCATIONS } from '../../stores/rideStore';
import { 
  ArrowRight, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  TrendingDown, 
  Clock, 
  Layers, 
  Radio,
  MapPin
} from 'lucide-react';
import Badge from '../common/Badge';

export default function HeroSection() {
  const { setActiveTab } = useUIStore();
  const { pickup, dropoff, setPickup, setDropoff, fetchEstimates } = useRideStore();

  const handleQuickLaunch = (start, end) => {
    setPickup(start);
    setDropoff(end);
    fetchEstimates();
    setActiveTab('compare');
  };

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden bg-radial-mesh">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Announcement Pill */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-emerald-500/30 text-xs font-semibold text-emerald-300 shadow-glow-emerald">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Unified Multi-Provider Dispatch Engine</span>
            <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
            <span className="text-slate-400 font-normal">v1.0 Public Beta</span>
          </div>
        </motion.div>

        {/* Main Hero Header */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]"
          >
            Stop App Switching. <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Every Ride in One Place.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-300 font-normal max-w-2xl mx-auto leading-relaxed"
          >
            Compare real-time fares, driver ETAs, and surge multipliers across <span className="text-white font-semibold">Uber</span>, <span className="text-white font-semibold">Ola</span>, and regional providers simultaneously. One search, zero lock-in.
          </motion.p>

          {/* Action CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button
              onClick={() => {
                fetchEstimates();
                setActiveTab('compare');
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-glow-emerald transition-all transform hover:scale-[1.03]"
            >
              <span>Launch Live Comparison</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('sandbox-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-2xl glass-panel-interactive border border-white/10 text-slate-200 font-semibold text-sm hover:text-white"
            >
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Interactive Fare Sandbox</span>
            </button>
          </motion.div>

          {/* Quick Route Shortcuts */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="pt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400"
          >
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Test Popular Routes:</span>
            <button
              onClick={() => handleQuickLaunch(PRESET_LOCATIONS[0], PRESET_LOCATIONS[3])}
              className="px-3 py-1 rounded-full bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-white/5 text-slate-300 hover:text-emerald-300 transition-colors"
            >
              Indiranagar ➔ BLR Airport
            </button>
            <button
              onClick={() => handleQuickLaunch(PRESET_LOCATIONS[1], PRESET_LOCATIONS[2])}
              className="px-3 py-1 rounded-full bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-white/5 text-slate-300 hover:text-emerald-300 transition-colors"
            >
              Koramangala ➔ Electronic City
            </button>
            <button
              onClick={() => handleQuickLaunch(PRESET_LOCATIONS[0], PRESET_LOCATIONS[4])}
              className="px-3 py-1 rounded-full bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-white/5 text-slate-300 hover:text-emerald-300 transition-colors"
            >
              Indiranagar ➔ Whitefield ITPL
            </button>
          </motion.div>
        </div>

        {/* Feature Benefit Metrics */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-16 max-w-5xl mx-auto"
        >
          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white">18-24%</div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">Average trip savings per ride</div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white">&lt; 3.5 min</div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">Faster pickup ETA discovery</div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white">Parallel API</div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">Sub-300ms multi-provider fan-out</div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white">Zero Lock-in</div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">Transparent base & surge rates</div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
