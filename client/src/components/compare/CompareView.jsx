import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RouteSearchBox from './RouteSearchBox';
import FilterBar from './FilterBar';
import RideCard from './RideCard';
import PriceBreakdownModal from './PriceBreakdownModal';
import BookingModal from './BookingModal';
import { useRideStore } from '../../stores/rideStore';
import { Car, Loader2, Sparkles, TrendingDown, Clock, ShieldCheck } from 'lucide-react';
import { formatDistance, formatDuration } from '../../utils/formatters';

export default function CompareView() {
  const { estimates, isSearching, fetchEstimates, pickup, dropoff } = useRideStore();

  useEffect(() => {
    if (estimates.length === 0) {
      fetchEstimates();
    }
  }, []);

  // Compute lowest price & lowest ETA
  const validEstimates = estimates.filter((e) => (e.fareEstimated || e.fareMin) > 0);
  const lowestPrice = validEstimates.length > 0 ? Math.min(...validEstimates.map((e) => e.fareEstimated || e.fareMin)) : 0;
  const lowestEta = validEstimates.length > 0 ? Math.min(...validEstimates.map((e) => e.pickupEtaMinutes || 99)) : 0;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      
      {/* Search Console */}
      <RouteSearchBox />

      {/* Filter and sorting pills */}
      <FilterBar count={estimates.length} />

      {/* Main Comparison Matrix Content */}
      {isSearching ? (
        <div className="py-24 text-center glass-panel rounded-3xl border border-white/10 space-y-4">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20"></span>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Parallel Fan-out Dispatched...</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Querying Uber v1.2, Ola Partner, and Mock APIs concurrently for real-time fares and driver ETAs.
            </p>
          </div>
        </div>
      ) : estimates.length === 0 ? (
        <div className="py-20 text-center glass-panel rounded-3xl border border-white/5 p-8">
          <Car className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Rides Found For Selected Filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            Try switching vehicle category filter to "All Rides" or adjust pickup coordinates.
          </p>
          <button
            onClick={() => fetchEstimates()}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-glow-emerald"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Quick Route Summary Meta Bar */}
          <div className="glass-panel-subtle rounded-2xl px-5 py-3.5 border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300 font-semibold">Active Parallel Route:</span>
              <span className="text-white font-bold truncate max-w-[200px] sm:max-w-[280px]">{pickup?.address}</span>
              <span className="text-slate-600 font-bold">➔</span>
              <span className="text-white font-bold truncate max-w-[200px] sm:max-w-[280px]">{dropoff?.address}</span>
            </div>

            {estimates[0] && (
              <div className="flex items-center gap-4 text-slate-400 text-xs font-medium">
                <span>Trip: <strong className="text-slate-200">{formatDistance(estimates[0].tripDistanceKm)}</strong></span>
                <span>•</span>
                <span>Est. Time: <strong className="text-slate-200">{formatDuration(estimates[0].tripDurationMinutes)}</strong></span>
              </div>
            )}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {estimates.map((est) => (
                <RideCard
                  key={est.id || est.productId}
                  estimate={est}
                  isCheapest={(est.fareEstimated || est.fareMin) === lowestPrice}
                  isQuickest={est.pickupEtaMinutes === lowestEta}
                />
              ))}
            </AnimatePresence>
          </div>

        </div>
      )}

      {/* Modals */}
      <PriceBreakdownModal />
      <BookingModal />

    </div>
  );
}
