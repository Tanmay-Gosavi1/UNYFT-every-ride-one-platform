import React, { useState, useEffect } from 'react';
import { providerApi } from '../../api/provider.api';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { 
  PlugZap, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  ShieldCheck, 
  RefreshCw,
  Power,
  Trash2
} from 'lucide-react';

export default function ProviderManager() {
  const { user, isAuthenticated, openAuthModal } = useAuthStore();
  const { addToast } = useUIStore();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await providerApi.listProviders();
      setProviders(res.data.providers || []);
    } catch {
      // Fallback display
      setProviders(DEFAULT_PROVIDERS);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (providerId) => {
    if (!isAuthenticated) {
      addToast('Sign in required', 'Please sign in to link provider accounts.', 'info');
      openAuthModal('login');
      return;
    }

    try {
      const res = await providerApi.getAuthUrl(providerId);
      if (res.data.authUrl) {
        window.location.href = res.data.authUrl;
      }
    } catch (err) {
      addToast('OAuth initiation', `Simulating ${providerId.toUpperCase()} OAuth consent screen...`, 'info');
    }
  };

  const handleUnlink = async (providerId) => {
    try {
      await providerApi.unlinkProvider(providerId);
      addToast('Account unlinked', `${providerId.toUpperCase()} account disconnected.`, 'success');
      fetchProviders();
    } catch (err) {
      addToast('Unlink error', err.message || 'Could not unlink provider', 'error');
    }
  };

  const isLinked = (providerId) => {
    return user?.providerAccounts?.some((p) => p.provider === providerId && p.hasAccess);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      
      {/* Header */}
      <div className="mb-8 pb-4 border-b border-white/10">
        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <PlugZap className="w-6 h-6 text-cyan-400" />
          <span>Mobility Provider Integrations</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Link your third-party ride-hailing accounts to enable 1-click in-app bookings and upfront pricing.
        </p>
      </div>

      {/* Security callout */}
      <div className="mb-8 p-4 rounded-2xl bg-slate-900/80 border border-white/5 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300">
          <strong className="text-white block mb-0.5">Zero Plaintext Token Storage</strong>
          Provider OAuth access & refresh tokens are encrypted at rest using AES-256-CBC with randomized IVs. We never store credit cards or payment credentials directly.
        </div>
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((p) => {
          const linked = isLinked(p.id) || p.id === 'mock';
          return (
            <div
              key={p.id}
              className={`glass-panel rounded-2xl p-6 border transition-all ${
                linked ? 'border-emerald-500/30' : 'border-white/10'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white capitalize">{p.name}</span>
                    {p.id === 'mock' && (
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono font-bold">
                        SANDBOX
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{p.description}</p>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                  linked
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-white/5'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${linked ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  <span>{linked ? 'Connected' : 'Not Linked'}</span>
                </span>
              </div>

              {/* Supported vehicle classes */}
              <div className="pt-3 border-t border-white/5 flex flex-wrap items-center gap-1.5 mb-5">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Categories:</span>
                {p.vehicleCategories?.map((cat) => (
                  <span
                    key={cat}
                    className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded capitalize"
                  >
                    {cat}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-1 flex items-center justify-between">
                {p.id === 'mock' ? (
                  <span className="text-xs text-slate-500 italic">Always enabled for testing</span>
                ) : linked ? (
                  <button
                    onClick={() => handleUnlink(p.id)}
                    className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Disconnect Account</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(p.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-white/10 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Link with OAuth</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

const DEFAULT_PROVIDERS = [
  {
    id: 'uber',
    name: 'Uber Global',
    description: 'Book UberGo, Premier, and UberXL via official v1.2 API.',
    vehicleCategories: ['economy', 'premium', 'suv', 'bike'],
    requiresOAuth: true,
  },
  {
    id: 'ola',
    name: 'Ola Cabs',
    description: 'Connect Ola Micro, Mini, and Auto via partner developer endpoints.',
    vehicleCategories: ['economy', 'premium', 'auto', 'bike'],
    requiresOAuth: true,
  },
  {
    id: 'mock',
    name: 'Mock Simulation Engine',
    description: 'Autonomous development simulator with real-time driver movement.',
    vehicleCategories: ['economy', 'premium', 'suv', 'auto', 'bike'],
    requiresOAuth: false,
  },
];
