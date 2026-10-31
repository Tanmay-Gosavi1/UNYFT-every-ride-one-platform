import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../stores/uiStore';
import { useRideStore, PRESET_LOCATIONS } from '../../stores/rideStore';
import { 
  Zap, 
  ArrowRight, 
  TrendingDown, 
  Clock, 
  AlertTriangle, 
  Check, 
  Info,
  Car,
  Sliders,
  DollarSign
} from 'lucide-react';
import Badge from '../common/Badge';
import { formatCurrency } from '../../utils/formatters';

const SCENARIOS = [
  {
    id: 'airport',
    title: 'BLR Airport Run',
    pickup: 'Indiranagar 100ft Rd',
    dropoff: 'Kempegowda Int. Airport',
    distance: 36.4,
    normalDuration: 52,
    options: [
      { provider: 'uber', name: 'Uber Premier', category: 'premium', price: 980, eta: 4, surge: 1.0, rating: 4.86 },
      { provider: 'ola', name: 'Prime Sedan', category: 'premium', price: 825, eta: 7, surge: 1.0, rating: 4.75, bestValue: true },
      { provider: 'mock', name: 'Mock XL Cruiser', category: 'suv', price: 1150, eta: 5, surge: 1.0, rating: 4.90 },
    ],
  },
  {
    id: 'office_peak',
    title: 'Evening Rush Commute',
    pickup: 'Koramangala 4th Block',
    dropoff: 'Electronic City Phase 1',
    distance: 14.8,
    normalDuration: 38,
    options: [
      { provider: 'uber', name: 'UberGo', category: 'economy', price: 345, eta: 3, surge: 1.5, rating: 4.80, surgeActive: true },
      { provider: 'ola', name: 'Ola Mini', category: 'economy', price: 260, eta: 4, surge: 1.1, rating: 4.72, bestValue: true },
      { provider: 'ola', name: 'Ola Auto', category: 'auto', price: 175, eta: 2, surge: 1.0, rating: 4.60, quickest: true },
    ],
  },
  {
    id: 'night_hop',
    title: 'Weekend Night Hop',
    pickup: 'Indiranagar 100ft Rd',
    dropoff: 'Koramangala 4th Block',
    distance: 6.2,
    normalDuration: 18,
    options: [
      { provider: 'uber', name: 'UberGo', category: 'economy', price: 165, eta: 2, surge: 1.0, rating: 4.84, quickest: true },
      { provider: 'ola', name: 'Ola Mini', category: 'economy', price: 172, eta: 5, surge: 1.0, rating: 4.70 },
      { provider: 'uber', name: 'Uber Moto', category: 'bike', price: 68, eta: 3, surge: 1.0, rating: 4.88, bestValue: true },
    ],
  },
];

export default function InteractiveSandbox() {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[1]);
  const [surgeBoost, setSurgeBoost] = useState(false);
  const { setActiveTab } = useUIStore();
  const { setPickup, setDropoff, fetchEstimates } = useRideStore();

  const activeOptions = selectedScenario.options.map((opt) => {
    let price = opt.price;
    let surge = opt.surge;
    if (surgeBoost && opt.provider === 'uber') {
      surge = Number((surge * 1.4).toFixed(1));
      price = Math.round(price * 1.4);
    }
    return { ...opt, price, surge, surgeActive: surge > 1.0 };
  });

  // Calculate cheapest and fastest
  const lowestPrice = Math.min(...activeOptions.map((o) => o.price));
  const highestPrice = Math.max(...activeOptions.map((o) => o.price));
  const maxSavings = highestPrice - lowestPrice;

  const handleLaunchScenario = () => {
    setPickup(PRESET_LOCATIONS[0]);
    setDropoff(PRESET_LOCATIONS[1]);
    fetchEstimates();
    setActiveTab('compare');
  };

  return (
    <section id="sandbox-section" className="py-20 border-y border-white/5 bg-[#090e18] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge variant="quickest" size="sm" icon={Zap} className="mb-3">
            INTERACTIVE SIMULATION
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            See the Fare Matrix in Action
          </h2>
          <p className="text-slate-400 mt-3 text-sm sm:text-base">
            Why pay ₹345 when the identical route is ₹260 on an alternative provider 2 minutes away? Test real-life mobility scenarios below.
          </p>
        </div>

        {/* Sandbox Console Container */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden max-w-5xl mx-auto">
          
          {/* Top Controls: Scenario Selectors & Surge Toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Select Test Route Scenario:
              </span>
              <div className="flex flex-wrap gap-2">
                {SCENARIOS.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => setSelectedScenario(sc)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      selectedScenario.id === sc.id
                        ? 'bg-emerald-500 text-slate-950 shadow-glow-emerald font-bold'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {sc.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Surge Simulator Toggle */}
            <div className="flex items-center gap-3 bg-slate-900/90 p-2.5 rounded-2xl border border-white/5">
              <Sliders className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <span className="text-xs font-semibold text-slate-200 block">Simulate Peak Surge</span>
                <span className="text-[10px] text-slate-400">Trigger +40% surge on Uber</span>
              </div>
              <button
                onClick={() => setSurgeBoost(!surgeBoost)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  surgeBoost ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    surgeBoost ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Route Overview Meta Bar */}
          <div className="py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="font-semibold text-white">{selectedScenario.pickup}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              <span className="font-semibold text-white">{selectedScenario.dropoff}</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span>Distance: <strong className="text-slate-200">{selectedScenario.distance} km</strong></span>
              <span>•</span>
              <span>Estimated Duration: <strong className="text-slate-200">{selectedScenario.normalDuration} min</strong></span>
            </div>
          </div>

          {/* Live Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <AnimatePresence mode="wait">
              {activeOptions.map((opt, idx) => {
                const isCheapest = opt.price === lowestPrice;
                return (
                  <motion.div
                    key={opt.name + idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3, delay: idx * 0.08 }}
                    className={`relative rounded-2xl p-5 border transition-all ${
                      isCheapest
                        ? 'bg-emerald-950/20 border-emerald-500/40 shadow-glow-emerald ring-1 ring-emerald-500/30'
                        : 'bg-slate-900/60 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {/* Top badging */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wider ${
                          opt.provider === 'uber' ? 'bg-black text-white border border-white/20' :
                          opt.provider === 'ola' ? 'bg-amber-400 text-black font-black' : 'bg-indigo-600 text-white'
                        }`}>
                          {opt.provider}
                        </span>
                        <span className="text-sm font-bold text-white">{opt.name}</span>
                      </div>
                      {isCheapest && (
                        <Badge variant="bestValue" size="xs">
                          Lowest Fare
                        </Badge>
                      )}
                    </div>

                    {/* Price Display */}
                    <div className="mt-4 mb-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-white tracking-tight">
                          {formatCurrency(opt.price)}
                        </span>
                        {opt.surgeActive && (
                          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                            {opt.surge}x Surge
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 capitalize">
                        {opt.category} vehicle • Driver rating: ★ {opt.rating}
                      </p>
                    </div>

                    {/* Pickup ETA & Progress Bar */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Pickup in <strong>{opt.eta} min</strong></span>
                      </div>
                      {isCheapest && (
                        <span className="text-[11px] font-bold text-emerald-400">
                          Saves ₹{highestPrice - opt.price}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Bottom Live Savings Callout Banner */}
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500 text-slate-950 font-bold shrink-0">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  Max Route Disparity: You save <span className="text-emerald-400 font-extrabold">₹{maxSavings}</span> right now.
                </p>
                <p className="text-xs text-slate-300">
                  Switching between apps manually takes ~3 minutes. UNYFT executes parallel queries in 280ms.
                </p>
              </div>
            </div>

            <button
              onClick={handleLaunchScenario}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-glow-emerald transition-all shrink-0"
            >
              <span>Compare Live Route</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}
