import React from 'react';
import HeroSection from './HeroSection';
import InteractiveSandbox from './InteractiveSandbox';
import ProblemSolutionGrid from './ProblemSolutionGrid';
import ArchitectureShowcase from './ArchitectureShowcase';
import { useUIStore } from '../../stores/uiStore';
import { useRideStore } from '../../stores/rideStore';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function HomeView() {
  const { setActiveTab } = useUIStore();
  const { fetchEstimates } = useRideStore();

  const handleLaunch = () => {
    fetchEstimates();
    setActiveTab('compare');
  };

  return (
    <div className="space-y-0">
      <HeroSection />
      <InteractiveSandbox />
      <ProblemSolutionGrid />
      <ArchitectureShowcase />

      {/* Final Action Callout Banner */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-transparent to-[#040810]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="glass-panel rounded-3xl p-8 sm:p-14 border border-emerald-500/30 shadow-glow-emerald relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
            
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Ready to Upgrade Your Daily Commute?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto mb-8">
              Experience the power of parallel mobility dispatch. Compare Uber, Ola, and regional fleets in seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleLaunch}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-glow-emerald flex items-center justify-center gap-2 transform hover:scale-[1.02] transition-all"
              >
                <span>Launch Live Fare Matrix</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero Subscription Fee</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Real-Time Provider Surge</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>AES-256 Encrypted Security</span>
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
