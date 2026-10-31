import React from 'react';
import { motion } from 'framer-motion';
import { useRideStore } from '../../stores/rideStore';
import { 
  Clock, 
  Users, 
  Info, 
  ArrowRight, 
  Zap, 
  Star,
  ShieldCheck,
  Flame,
  CheckCircle2
} from 'lucide-react';
import Badge from '../common/Badge';
import { formatCurrency, formatDuration, formatDistance } from '../../utils/formatters';

export default function RideCard({ estimate, isCheapest = false, isQuickest = false }) {
  const { setPriceBreakdownEstimate, setBookingModalEstimate } = useRideStore();

  const providerLogoStyles = {
    uber: 'bg-black text-white border-white/20',
    ola: 'bg-amber-400 text-black font-black',
    rapido: 'bg-amber-500 text-black font-black',
    mock: 'bg-indigo-600 text-white font-bold',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`glass-panel-interactive rounded-2xl p-5 border relative flex flex-col justify-between ${
        isCheapest
          ? 'border-emerald-500/50 bg-emerald-950/15 shadow-glow-emerald ring-1 ring-emerald-500/30'
          : isQuickest
          ? 'border-cyan-500/40 bg-cyan-950/10'
          : 'border-white/10'
      }`}
    >
      {/* Top Header: Provider Tag, Category, Best Badges */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] uppercase font-black px-2 py-0.5 rounded tracking-wider border ${
                providerLogoStyles[estimate.provider] || 'bg-slate-800 text-white'
              }`}
            >
              {estimate.provider}
            </span>
            <span className="text-base font-bold text-white tracking-tight">
              {estimate.productName}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isCheapest && (
              <Badge variant="bestValue" size="xs">
                Best Value
              </Badge>
            )}
            {isQuickest && !isCheapest && (
              <Badge variant="quickest" size="xs">
                Quickest
              </Badge>
            )}
            {estimate.surgeActive && (
              <Badge variant="surge" size="xs" icon={Flame}>
                {estimate.surgeMultiplier}x Surge
              </Badge>
            )}
          </div>
        </div>

        {/* Vehicle Specs Pill */}
        <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{estimate.capacity || 4} Seats</span>
          </span>
          <span>•</span>
          <span className="capitalize">{estimate.category}</span>
          <span>•</span>
          <span>{formatDistance(estimate.tripDistanceKm)}</span>
        </div>

        {/* Pricing & ETA Row */}
        <div className="flex items-baseline justify-between pt-1 pb-3 border-y border-white/5">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {formatCurrency(estimate.fareEstimated || estimate.fareMin)}
              </span>
              {estimate.fareMax && estimate.fareMax !== estimate.fareMin && (
                <span className="text-xs text-slate-400">
                  - {formatCurrency(estimate.fareMax)}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setPriceBreakdownEstimate(estimate)}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mt-1 font-medium hover:underline"
            >
              <Info className="w-3 h-3" />
              <span>Fare breakup & taxes</span>
            </button>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-slate-200 font-bold text-sm">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{estimate.pickupEtaMinutes} min</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Pickup arrival ETA
            </span>
          </div>
        </div>
      </div>

      {/* Card Action Footer: Trip Time & Book CTA */}
      <div className="mt-4 pt-3 flex items-center justify-between gap-3">
        <div className="text-[11px] text-slate-400">
          Trip: <strong className="text-slate-300">{formatDuration(estimate.tripDurationMinutes)}</strong>
        </div>

        <button
          onClick={() => setBookingModalEstimate(estimate)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all transform hover:scale-[1.02] ${
            isCheapest
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-glow-emerald font-extrabold'
              : 'bg-white/10 hover:bg-emerald-500 hover:text-slate-950 text-white border border-white/10'
          }`}
        >
          <span>Book with {estimate.provider}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
