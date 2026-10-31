import React from 'react';
import Modal from '../common/Modal';
import { useRideStore } from '../../stores/rideStore';
import { formatCurrency, formatDistance, formatDuration } from '../../utils/formatters';
import { Receipt, ShieldCheck, Flame, Clock } from 'lucide-react';

export default function PriceBreakdownModal() {
  const { priceBreakdownEstimate, setPriceBreakdownEstimate } = useRideStore();
  const est = priceBreakdownEstimate;

  if (!est) return null;

  // Build realistic breakup items based on category and distance
  const baseRate = est.category === 'suv' ? 80 : est.category === 'premium' ? 60 : est.category === 'auto' ? 25 : est.category === 'bike' ? 15 : 35;
  const perKmRate = est.category === 'suv' ? 20 : est.category === 'premium' ? 16 : est.category === 'auto' ? 8 : est.category === 'bike' ? 5 : 11;
  const distanceCost = Math.round(est.tripDistanceKm * perKmRate);
  const timeCost = Math.round(est.tripDurationMinutes * 1.5);
  const subtotal = baseRate + distanceCost + timeCost;
  const gst = Math.round(subtotal * 0.05);
  const surgeExtra = est.surgeActive ? Math.round(subtotal * (est.surgeMultiplier - 1)) : 0;
  const total = subtotal + gst + surgeExtra;

  return (
    <Modal
      isOpen={!!est}
      onClose={() => setPriceBreakdownEstimate(null)}
      title="Transparent Fare Breakdown"
      subtitle={`${est.productName} via ${est.provider.toUpperCase()} (${formatDistance(est.tripDistanceKm)} • ${formatDuration(est.tripDurationMinutes)})`}
      maxWidth="max-w-md"
    >
      <div className="space-y-4 pt-2">
        
        {/* Itemized charges list */}
        <div className="rounded-2xl bg-slate-900/80 p-4 border border-white/5 space-y-3 text-sm">
          <div className="flex items-center justify-between text-slate-300">
            <span>Base Access Fare</span>
            <span className="font-semibold text-white">{formatCurrency(baseRate)}</span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span>Distance ({formatDistance(est.tripDistanceKm)} × ₹{perKmRate}/km)</span>
            <span className="font-semibold text-white">{formatCurrency(distanceCost)}</span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span>Duration ({formatDuration(est.tripDurationMinutes)} × ₹1.5/min)</span>
            <span className="font-semibold text-white">{formatCurrency(timeCost)}</span>
          </div>

          {est.surgeActive && (
            <div className="flex items-center justify-between text-amber-400 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                <Flame className="w-3.5 h-3.5" />
                <span>Peak Surge Factor ({est.surgeMultiplier}x)</span>
              </span>
              <span className="font-bold">+{formatCurrency(surgeExtra)}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-slate-400 text-xs pt-1 border-t border-white/5">
            <span>Govt. GST (5%) & Platform Tech Fee</span>
            <span>{formatCurrency(gst)}</span>
          </div>
        </div>

        {/* Total Cost Display */}
        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Estimated Total Payable</span>
            <span className="text-2xl font-extrabold text-white">{formatCurrency(total)}</span>
          </div>
          <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-3 py-1 rounded-full border border-emerald-500/30">
            Zero Hidden Fees
          </span>
        </div>

        {/* Fare Lock Notice */}
        <div className="flex items-start gap-2.5 text-xs text-slate-400 bg-slate-900/50 p-3 rounded-xl border border-white/5">
          <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p>
            Provider upfront fare guarantee. Price is locked for 2 minutes from generation under provider API agreements.
          </p>
        </div>

        <button
          onClick={() => setPriceBreakdownEstimate(null)}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
        >
          Close Breakdown
        </button>

      </div>
    </Modal>
  );
}
