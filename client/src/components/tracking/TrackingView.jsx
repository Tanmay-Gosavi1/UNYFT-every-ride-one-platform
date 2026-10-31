import React from 'react';
import { useRideStore, PRESET_LOCATIONS } from '../../stores/rideStore';
import { useUIStore } from '../../stores/uiStore';
import TripStepper from './TripStepper';
import DriverStatusCard from './DriverStatusCard';
import LiveRadarMap from './LiveRadarMap';
import { Radar, Car, ArrowRight, ShieldCheck, Radio } from 'lucide-react';

export default function TrackingView() {
  const { activeBooking, liveTracking, pickup, dropoff, startLocalTrackingSimulation } = useRideStore();
  const { setActiveTab } = useUIStore();

  // If user visits tracking without an active booking, create a demo active tracking session so they can inspect the UI!
  const hasActiveRide = activeBooking && activeBooking.status !== 'CANCELLED';

  const handleStartDemoTracking = () => {
    const demoBooking = {
      _id: 'bk_demo_' + Date.now(),
      provider: 'ola',
      providerBookingId: 'CRN-849201',
      status: 'DRIVER_EN_ROUTE',
      pickup: PRESET_LOCATIONS[0],
      dropoff: PRESET_LOCATIONS[1],
      vehicleCategory: 'economy',
      otp: '7492',
      driver: {
        name: 'Suresh Patel',
        phone: '+91 98765 12345',
        rating: 4.88,
        vehicle: {
          make: 'Maruti',
          model: 'Dzire Prime',
          licensePlate: 'KA03MJ7492',
          color: 'White',
        },
      },
    };
    startLocalTrackingSimulation(demoBooking);
  };

  if (!hasActiveRide) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24 px-4">
        <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-white/10 flex items-center justify-center mx-auto mb-4 text-emerald-400">
          <Radar className="w-8 h-8 animate-pulse" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Active Ride Dispatch in Radar</h3>
        <p className="text-sm text-slate-400 mb-8 max-w-md mx-auto">
          You don't currently have an active ride dispatched. You can compare and book a ride or launch a live telemetry simulation.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setActiveTab('compare')}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-glow-emerald transition-all"
          >
            Find & Book a Ride
          </button>
          <button
            onClick={handleStartDemoTracking}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl glass-panel-interactive border border-white/10 text-slate-200 text-xs font-semibold hover:text-white"
          >
            Launch Live Radar Simulation
          </button>
        </div>
      </div>
    );
  }

  const currentStatus = liveTracking?.status || activeBooking?.status || 'DRIVER_EN_ROUTE';
  const driverLocation = liveTracking?.driverLocation;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      
      {/* Header Bar with Live Indicator */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-emerald-400 animate-pulse" />
            <span>Universal Driver Radar</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry stream via Socket.IO room <code className="text-emerald-400 font-mono">booking:{activeBooking._id}</code>
          </p>
        </div>

        <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
          CRN: {activeBooking.providerBookingId || 'DISPATCH-LIVE'}
        </span>
      </div>

      {/* Stepper Progression */}
      <TripStepper status={currentStatus} />

      {/* Main Radar Layout: Interactive Map + Driver Status Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Map Column (7 cols) */}
        <div className="lg:col-span-7">
          <LiveRadarMap
            pickup={activeBooking.pickup || pickup}
            dropoff={activeBooking.dropoff || dropoff}
            driverLocation={driverLocation}
          />
        </div>

        {/* Right Driver Status Card Column (5 cols) */}
        <div className="lg:col-span-5">
          <DriverStatusCard
            booking={activeBooking}
            tracking={liveTracking}
          />
        </div>

      </div>

    </div>
  );
}
