import React from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Car, 
  MapPin, 
  Play, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';

const STEPS = [
  { id: 'ALLOTMENT_PENDING', label: 'Matching Driver', icon: Search },
  { id: 'DRIVER_EN_ROUTE', label: 'Driver En Route', icon: Car },
  { id: 'DRIVER_ARRIVED', label: 'At Pickup', icon: MapPin },
  { id: 'IN_PROGRESS', label: 'On Trip', icon: Play },
  { id: 'COMPLETED', label: 'Completed', icon: CheckCircle2 },
];

export default function TripStepper({ status = 'ALLOTMENT_PENDING' }) {
  if (status === 'CANCELLED') {
    return (
      <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-sm">
        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
        <div>
          <span className="font-bold block">Ride Cancelled</span>
          <span className="text-xs text-rose-400">This booking was cancelled. No cancellation fee applied.</span>
        </div>
      </div>
    );
  }

  // Determine active step index
  const statusHierarchy = {
    BOOKING_REQUESTED: 0,
    ALLOTMENT_PENDING: 0,
    DRIVER_ALLOCATED: 1,
    DRIVER_EN_ROUTE: 1,
    DRIVER_ARRIVED: 2,
    IN_PROGRESS: 3,
    COMPLETED: 4,
  };

  const currentIndex = statusHierarchy[status] ?? 0;

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-white/10">
      <div className="flex items-center justify-between relative">
        
        {/* Continuous progress track behind dots */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 -z-0" />
        <div 
          className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-500 -z-0 transition-all duration-700"
          style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isPending = idx > currentIndex;

          return (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              <motion.div
                animate={{
                  scale: isCurrent ? [1, 1.15, 1] : 1,
                }}
                transition={{ repeat: isCurrent ? Infinity : 0, duration: 2 }}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                  isDone
                    ? 'bg-emerald-500 text-slate-950 shadow-glow-emerald'
                    : isCurrent
                    ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-400 shadow-glow-emerald'
                    : 'bg-slate-900 text-slate-500 border border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.div>
              <span className={`text-[11px] sm:text-xs mt-2 font-semibold text-center whitespace-nowrap ${
                isCurrent ? 'text-emerald-400 font-bold' : isDone ? 'text-slate-200' : 'text-slate-500'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}

      </div>
    </div>
  );
}
