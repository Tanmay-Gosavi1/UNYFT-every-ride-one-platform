import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRideStore, PRESET_LOCATIONS } from '../../stores/rideStore';
import { 
  MapPin, 
  ArrowUpDown, 
  Search, 
  Crosshair, 
  Loader2, 
  Sparkles,
  ChevronDown
} from 'lucide-react';

export default function RouteSearchBox() {
  const { pickup, dropoff, setPickup, setDropoff, swapLocations, fetchEstimates, isSearching } = useRideStore();
  const [pickupInput, setPickupInput] = useState(pickup?.address || '');
  const [dropoffInput, setDropoffInput] = useState(dropoff?.address || '');
  const [locating, setLocating] = useState(false);

  const handleSearch = (e) => {
    e?.preventDefault();
    fetchEstimates();
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const current = {
          name: 'Current Location',
          address: `Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)}`,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setPickup(current);
        setPickupInput(current.address);
        setLocating(false);
      },
      () => {
        setLocating(false);
        // Fallback to Bangalore preset
        setPickup(PRESET_LOCATIONS[0]);
        setPickupInput(PRESET_LOCATIONS[0].address);
      }
    );
  };

  const handleSelectPreset = (preset, target) => {
    if (target === 'pickup') {
      setPickup(preset);
      setPickupInput(preset.address);
    } else {
      setDropoff(preset);
      setDropoffInput(preset.address);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
      <form onSubmit={handleSearch} className="space-y-4">
        
        {/* Origin & Destination Inputs with Swap */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto,1fr] gap-3 items-center">
          
          {/* Pickup Input */}
          <div className="relative">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Pickup Location
              </span>
              <button
                type="button"
                onClick={handleCurrentLocation}
                disabled={locating}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
              >
                <Crosshair className={`w-3 h-3 ${locating ? 'animate-spin' : ''}`} />
                <span>{locating ? 'Locating...' : 'Current GPS'}</span>
              </button>
            </label>
            <div className="relative flex items-center">
              <MapPin className="w-4 h-4 text-emerald-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={pickup?.address || pickupInput}
                onChange={(e) => {
                  setPickupInput(e.target.value);
                  setPickup({ ...pickup, address: e.target.value });
                }}
                placeholder="Enter pickup point or landmark..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900/90 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 transition-all font-medium"
              />
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-1 lg:my-0 pt-4 lg:pt-5">
            <button
              type="button"
              onClick={swapLocations}
              title="Swap pickup and dropoff"
              className="p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white transition-all transform hover:rotate-180 duration-300 shadow-sm"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* Dropoff Input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              Dropoff Destination
            </label>
            <div className="relative flex items-center">
              <MapPin className="w-4 h-4 text-rose-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={dropoff?.address || dropoffInput}
                onChange={(e) => {
                  setDropoffInput(e.target.value);
                  setDropoff({ ...dropoff, address: e.target.value });
                }}
                placeholder="Enter destination, airport, tech park..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900/90 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/40 transition-all font-medium"
              />
            </div>
          </div>

        </div>

        {/* Quick Route Shortcut Chips */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Quick Select:</span>
            {PRESET_LOCATIONS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(preset, 'dropoff')}
                className="px-2.5 py-1 rounded-full bg-slate-800/60 hover:bg-slate-700/80 border border-white/5 text-slate-300 hover:text-white transition-colors text-[11px]"
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Compare Submit Button */}
          <button
            type="submit"
            disabled={isSearching}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-glow-emerald transition-all transform hover:scale-[1.02] disabled:opacity-50"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Querying Providers...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4 text-slate-950" />
                <span>Compare Fares & ETAs</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
