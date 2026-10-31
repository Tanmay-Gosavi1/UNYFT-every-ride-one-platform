import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { Mail, Lock, User, Phone, Loader2, Sparkles } from 'lucide-react';

export default function AuthModal() {
  const { authModalOpen, authModalMode, closeAuthModal, openAuthModal, login, register, loading } = useAuthStore();
  const { addToast } = useUIStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const isLogin = authModalMode === 'login';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLogin) {
      const res = await login(email, password);
      if (res.success) {
        addToast('Welcome back!', 'Successfully signed in to your UNYFT account.', 'success');
      } else {
        addToast('Login error', res.error || 'Invalid email or password', 'error');
      }
    } else {
      const res = await register({
        email,
        password,
        firstName,
        lastName,
        phone: phoneNumber,
      });
      if (res.success) {
        addToast('Account created!', 'Welcome to UNYFT Mobility Aggregator.', 'success');
      } else {
        addToast('Registration error', res.error || 'Failed to create account', 'error');
      }
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo.rider@unyft.local');
    setPassword('DemoPass123!');
    const res = await login('demo.rider@unyft.local', 'DemoPass123!');
    if (!res.success) {
      // Register demo user if doesn't exist
      await register({
        email: 'demo.rider@unyft.local',
        password: 'DemoPass123!',
        firstName: 'Alex',
        lastName: 'Rider',
        phone: '+919876543210',
      });
      addToast('Demo Account Ready', 'Signed in as Alex Rider.', 'success');
    } else {
      addToast('Demo Sign In', 'Welcome back Alex!', 'success');
    }
  };

  return (
    <Modal
      isOpen={authModalOpen}
      onClose={closeAuthModal}
      title={isLogin ? 'Sign In to UNYFT' : 'Create Rider Account'}
      subtitle={isLogin ? 'Access your saved routes and ride history' : 'One unified account for all ride providers'}
      maxWidth="max-w-md"
    >
      <div className="space-y-4 pt-1">
        
        {/* Toggle Mode Tabs */}
        <div className="flex p-1 rounded-xl bg-slate-900 border border-white/5">
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              isLogin ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => openAuthModal('register')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              !isLogin ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Demo Account Quick Pill */}
        <button
          type="button"
          onClick={handleDemoLogin}
          className="w-full py-2.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>One-Click Demo Rider Sign In</span>
        </button>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>
          )}

          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 8 chars, 1 uppercase, 1 number)"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {!isLogin && (
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Mobile phone (+91...)"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-glow-emerald hover:from-emerald-400 hover:to-teal-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>{isLogin ? 'Sign In to Account' : 'Create Free Account'}</span>
            )}
          </button>
        </form>

      </div>
    </Modal>
  );
}
