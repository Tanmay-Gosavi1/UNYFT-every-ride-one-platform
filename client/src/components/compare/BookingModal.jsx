import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import Modal from '../common/Modal';
import { useRideStore } from '../../stores/rideStore';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency, formatDistance } from '../../utils/formatters';
import { 
  Car, 
  MapPin, 
  ArrowRight, 
  Clock, 
  CreditCard, 
  Wallet, 
  Banknote, 
  Loader2, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function BookingModal() {
  const { bookingModalEstimate, setBookingModalEstimate, bookRide, pickup, dropoff } = useRideStore();
  const { setActiveTab, addToast } = useUIStore();
  const { isAuthenticated, openAuthModal } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [secondsLeft, setSecondsLeft] = useState(120);

  const est = bookingModalEstimate;

  // 2-minute fare lock countdown
  useEffect(() => {
    if (!est) return;
    setSecondsLeft(120);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [est]);

  if (!est) return null;

  const handleConfirmBooking = async () => {
    if (!isAuthenticated) {
      addToast('Sign in required', 'Please sign in or continue as guest to book a ride.', 'info');
      openAuthModal('login');
      return;
    }

    setLoading(true);
    const result = await bookRide(est);
    setLoading(false);

    if (result.success) {
      // Fire celebration confetti!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#10b981', '#06b6d4', '#6366f1', '#f59e0b'],
      });

      addToast('Ride Dispatched!', `Searching for nearby ${est.provider.toUpperCase()} driver.`, 'success');
      setActiveTab('tracking');
    } else {
      addToast('Booking failed', result.error || 'Could not complete booking', 'error');
    }
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <Modal
      isOpen={!!est}
      onClose={() => !loading && setBookingModalEstimate(null)}
      title="Confirm Ride Dispatch"
      subtitle={`Direct dispatch via ${est.provider.toUpperCase()} mobility gateway`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-5 pt-1">
        
        {/* Route Preview Card */}
        <div className="rounded-2xl bg-slate-900/80 p-4 border border-white/5 space-y-3">
          <div className="flex items-start gap-3 text-xs">
            <div className="flex flex-col items-center gap-1 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="w-0.5 h-6 bg-slate-700"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Pickup</span>
                <span className="text-white font-medium text-xs truncate block">{pickup?.address}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Dropoff</span>
                <span className="text-white font-medium text-xs truncate block">{dropoff?.address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Ride & Price Summary */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-black text-white border border-white/20">
                {est.provider}
              </span>
              <span className="text-sm font-bold text-white">{est.productName}</span>
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              Driver arrival in ~{est.pickupEtaMinutes} mins
            </span>
          </div>

          <div className="text-right">
            <span className="text-2xl font-extrabold text-white">
              {formatCurrency(est.fareEstimated || est.fareMin)}
            </span>
            <div className="flex items-center justify-end gap-1 text-[11px] text-amber-400 font-mono mt-0.5">
              <Clock className="w-3 h-3" />
              <span>Fare lock: {minutes}:{seconds.toString().padStart(2, '0')}</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Select Payment Method:
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setPaymentMode('cash')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                paymentMode === 'cash'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span className="text-xs font-semibold">Cash</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMode('upi')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                paymentMode === 'upi'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span className="text-xs font-semibold">UPI / QR</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMode('card')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                paymentMode === 'card'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span className="text-xs font-semibold">Razorpay</span>
            </button>
          </div>
        </div>

        {/* Security guarantee */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Encrypted token dispatch. Provider OTP issued after driver allocation.</span>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirmBooking}
          disabled={loading || secondsLeft === 0}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-glow-emerald transition-all transform hover:scale-[1.01] disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              <span>Contacting {est.provider.toUpperCase()} Gateway...</span>
            </>
          ) : secondsLeft === 0 ? (
            <span>Fare Expired — Please Re-fetch</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Confirm & Dispatch Ride</span>
            </>
          )}
        </button>

      </div>
    </Modal>
  );
}
