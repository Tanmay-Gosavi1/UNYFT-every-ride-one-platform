import React from 'react';
import { motion } from 'framer-motion';
import { useRideStore } from '../../stores/rideStore';
import { 
  Car, 
  Sparkles, 
  SlidersHorizontal, 
  ArrowDownUp, 
  Bike, 
  Truck, 
  Gauge
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Rides', icon: Car },
  { id: 'economy', label: 'Economy', icon: Car },
  { id: 'premium', label: 'Prime / Sedan', icon: Sparkles },
  { id: 'suv', label: 'SUV / XL', icon: Truck },
  { id: 'auto', label: 'Auto', icon: Gauge },
  { id: 'bike', label: 'Bike', icon: Bike },
];

const SORT_OPTIONS = [
  { id: 'price', label: 'Lowest Fare (Best Value)' },
  { id: 'eta', label: 'Fastest Pickup (Lowest ETA)' },
  { id: 'rating', label: 'Highest Driver Rating' },
  { id: 'distance', label: 'Direct Distance' },
];

export default function FilterBar({ count = 0 }) {
  const { selectedCategory, setSelectedCategory, sortBy, setSortBy } = useRideStore();

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4 border-b border-white/10">
      
      {/* Category Pills Slider */}
      <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'text-white bg-slate-800 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="filterActivePill"
                  className="absolute inset-0 bg-emerald-500/15 rounded-xl border border-emerald-500/30"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon className={`w-3.5 h-3.5 relative z-10 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="relative z-10">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Controls: Sort Selector & Results Count */}
      <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          {count} options found
        </span>

        <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
          <ArrowDownUp className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 text-[11px] font-semibold uppercase">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer pr-1"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id} className="bg-slate-900 text-white">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

    </div>
  );
}
