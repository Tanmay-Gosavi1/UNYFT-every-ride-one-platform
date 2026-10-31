import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ToastContainer from './components/common/Toast';
import AuthModal from './components/auth/AuthModal';

// Views
import HomeView from './components/home/HomeView';
import CompareView from './components/compare/CompareView';
import TrackingView from './components/tracking/TrackingView';
import HistoryView from './components/history/HistoryView';
import ProviderManager from './components/providers/ProviderManager';

import { useUIStore } from './stores/uiStore';
import { useAuthStore } from './stores/authStore';

export default function App() {
  const { activeTab } = useUIStore();
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, []);

  const renderView = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView />;
      case 'compare':
        return <CompareView />;
      case 'tracking':
        return <TrackingView />;
      case 'history':
        return <HistoryView />;
      case 'providers':
        return <ProviderManager />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <Navbar />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />

      {/* Global Modals & Toast notifications */}
      <AuthModal />
      <ToastContainer />
    </div>
  );
}
