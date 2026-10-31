import React, { useState } from 'react';
import { useRideStore } from '../../stores/rideStore';
import { useUIStore } from '../../stores/uiStore';
import { 
  Phone, 
  Share2, 
  X, 
  Star, 
  ShieldCheck, 
  KeyRound, 
  Car,
  Clock,
  Check
} from 'lucide-react';
import { formatDuration } from '../../utils/formatters';

export default function DriverStatusCard({ booking, tracking }) {
  const { cancelActiveBooking } = useRideStore();
  const { addToast } = useUIStore();
  const [copied, setCopied] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);

  const driver = tracking?.driver || booking?.driver;
  const otp = tracking?.otp || booking?.otp || '4829';
  const etaMinutes = tracking?.eta?.value ?? 4;
  const vehicle = driver?.vehicle || {
    make: 'Hyundai',
    model: 'Aura',
    licensePlate: 'KA01AB4829',
    color: 'Silver',
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    addToast('Link Copied', 'Live ride telemetry link copied to clipboard.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancel = () => {
    cancelActiveBooking('User cancelled via tracking console');
    setCancelModal(false);
    addToast('Ride Cancelled', 'Driver allocation has been released.', 'info');
  };

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 space-y-6">
      
      {/* Driver Profile Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 font-bold flex items-center justify-center text-xl shadow-md">
              {driver?.name ? driver.name[0] : 'V'}
            </div>
            <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-slate-950">
              <ShieldCheck className="w-3 h-3 font-bold" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">{driver?.name || 'Searching for Driver...'}</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-xs font-bold border border-amber-500/30">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{driver?.rating || '4.85'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {booking?.provider?.toUpperCase()} Verified Partner
            </p>
          </div>
        </div>

        {/* Action Call Button */}
        {driver?.phone && (
          <a
            href={`tel:${driver.phone}`}
            className="p-3 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/30 transition-all shadow-sm"
            title="Call Driver"
          >
            <Phone className="w-5 h-5" />
          </a>
        )}
      </div>

      {/* Vehicle Info & Number Plate Banner */}
      <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-900/80 border border-white/5">
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Vehicle Model</span>
          <span className="text-sm font-bold text-white block mt-0.5">
            {vehicle.color} {vehicle.make} {vehicle.model}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">License Plate</span>
          <span className="inline-block px-2.5 py-1 rounded-md bg-amber-400 text-slate-950 font-mono font-black text-sm tracking-widest mt-0.5 border border-amber-500">
            {vehicle.licensePlate}
          </span>
        </div>
      </div>

      {/* OTP Display Highlight */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500 text-slate-950 font-bold">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Ride Start Pin</span>
            <span className="text-2xl font-mono font-black tracking-widest text-emerald-400">
              {otp}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block">Share with driver</span>
          <span className="text-xs text-emerald-300 font-semibold">To start ride</span>
        </div>
      </div>

      {/* Live Arrival ETA */}
      <div className="flex items-center justify-between text-sm py-2 px-1">
        <div className="flex items-center gap-2 text-slate-300">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>Estimated Driver Arrival:</span>
        </div>
        <span className="text-base font-extrabold text-white">
          {etaMinutes > 0 ? `${etaMinutes} minutes` : 'Arrived at pickup'}
        </span>
      </div>

      {/* Footer Controls: Share & Cancel */}
      <div className="pt-2 flex items-center justify-between gap-3">
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl glass-panel-interactive border border-white/10 text-xs font-semibold text-slate-200 hover:text-white"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-cyan-400" />}
          <span>{copied ? 'Link Copied!' : 'Share Live Telemetry'}</span>
        </button>

        {booking?.status !== 'COMPLETED' && booking?.status !== 'CANCELLED' && (
          <button
            onClick={() => setCancelModal(true)}
            className="px-4 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-colors"
          >
            Cancel Ride
          </button>
        )}
      </div>

      {/* Cancel Confirmation Prompt */}
      {cancelModal && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-3">
          <p className="text-xs text-rose-200 font-semibold">
            Are you sure you want to cancel this ride? The driver will be reassigned.
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setCancelModal(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 font-medium"
            >
              Keep Ride
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs text-white font-bold"
            >
              Yes, Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
