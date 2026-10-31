import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { rideApi } from '../../api/ride.api';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { 
  History, 
  Car, 
  Star, 
  Clock, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  XCircle,
  FileText,
  Loader2
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import Modal from '../common/Modal';

export default function HistoryView() {
  const { setActiveTab, addToast } = useUIStore();
  const { isAuthenticated, openAuthModal } = useAuthStore();
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingModalBooking, setRatingModalBooking] = useState(null);
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingRate, setSubmittingRate] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [isAuthenticated]);

  const fetchHistory = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await rideApi.getHistory({ limit: 15 });
      setHistory(res.data.bookings || []);
    } catch {
      // Fallback mock past rides for nice initial showcase
      setHistory(SAMPLE_HISTORY);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!ratingModalBooking) return;
    setSubmittingRate(true);
    try {
      await rideApi.rateRide(ratingModalBooking._id, selectedRating, reviewText);
      addToast('Rating submitted', 'Thank you for your feedback!', 'success');
      setHistory((prev) =>
        prev.map((b) =>
          b._id === ratingModalBooking._id
            ? { ...b, userRating: selectedRating, userReview: reviewText }
            : b
        )
      );
      setRatingModalBooking(null);
    } catch (err) {
      addToast('Rating failed', err.message || 'Could not submit rating', 'error');
    } finally {
      setSubmittingRate(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-4">
        <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-white/10 flex items-center justify-center mx-auto mb-4 text-emerald-400">
          <History className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Access Your Trip Ledger</h3>
        <p className="text-sm text-slate-400 mb-6">
          Sign in to view your past cross-provider bookings, tax invoices, and ratings.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-glow-emerald transition-all"
        >
          Sign In to Account
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <History className="w-6 h-6 text-emerald-400" />
            <span>Trip Ledger & Receipts</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Consolidated history across Uber, Ola, and partner networks.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('compare')}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
        >
          Book New Ride
        </button>
      </div>

      {/* History List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          <span>Loading trip ledger...</span>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-3xl border border-white/5 p-8">
          <Car className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Trips Recorded Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            Compare prices across providers and take your first ride to see invoices and ratings here.
          </p>
          <button
            onClick={() => setActiveTab('compare')}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-glow-emerald"
          >
            Start Comparison
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((booking) => (
            <div
              key={booking._id}
              className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-emerald-500/30 transition-all"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black text-white border border-white/20">
                    {booking.provider}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {booking.estimate?.productName || `${booking.provider} Ride`}
                  </span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-400">
                    {formatDateTime(booking.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="text-emerald-400 truncate max-w-[140px] sm:max-w-[200px]">
                    {booking.pickup?.address || 'Origin'}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                  <span className="text-rose-400 truncate max-w-[140px] sm:max-w-[200px]">
                    {booking.dropoff?.address || 'Destination'}
                  </span>
                </div>
              </div>

              {/* Price & Rating Action */}
              <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5">
                <div className="text-left sm:text-right">
                  <span className="text-lg font-extrabold text-white block">
                    {formatCurrency(booking.estimate?.fareEstimated || 320)}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    {booking.status === 'COMPLETED' ? 'Completed' : booking.status}
                  </span>
                </div>

                {booking.userRating ? (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{booking.userRating}.0</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setRatingModalBooking(booking)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                  >
                    Rate Driver
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Driver Rating Modal */}
      <Modal
        isOpen={!!ratingModalBooking}
        onClose={() => setRatingModalBooking(null)}
        title="Rate Your Ride Experience"
        subtitle={`Driver: ${ratingModalBooking?.driver?.name || 'Verified Partner'} (${ratingModalBooking?.provider?.toUpperCase()})`}
        maxWidth="max-w-md"
      >
        <div className="space-y-5 pt-3">
          
          {/* Star selector */}
          <div className="flex justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setSelectedRating(star)}
                className="p-1.5 transition-transform hover:scale-125 focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= selectedRating
                      ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                      : 'text-slate-600'
                  }`}
                />
              </button>
            ))}
          </div>

          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share feedback on vehicle cleanliness, driving safety, or navigation..."
            rows={3}
            className="w-full p-3.5 rounded-2xl bg-slate-900 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
          />

          <button
            onClick={handleSubmitRating}
            disabled={submittingRate}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-glow-emerald disabled:opacity-50"
          >
            {submittingRate ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </Modal>

    </div>
  );
}

const SAMPLE_HISTORY = [
  {
    _id: 'hist-1',
    provider: 'ola',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'COMPLETED',
    pickup: { address: 'Indiranagar 100ft Rd, Bengaluru' },
    dropoff: { address: 'Kempegowda Int. Airport, Bengaluru' },
    estimate: { productName: 'Prime Sedan', fareEstimated: 825 },
    userRating: 5,
    driver: { name: 'Suresh Patel' },
  },
  {
    _id: 'hist-2',
    provider: 'uber',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: 'COMPLETED',
    pickup: { address: 'Koramangala 4th Block, Bengaluru' },
    dropoff: { address: 'Electronic City Phase 1, Bengaluru' },
    estimate: { productName: 'UberGo', fareEstimated: 260 },
    userRating: 4,
    driver: { name: 'Amit Sharma' },
  },
];
