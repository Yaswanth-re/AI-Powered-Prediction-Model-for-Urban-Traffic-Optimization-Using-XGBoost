import React, { useState } from 'react';
import { Shield, Lock, Mail, User, ArrowRight, Sparkles, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface LoginModalProps {
  onLoginSuccess: (user: any, token: string) => void;
  onClose?: () => void;
  isOpen: boolean;
}

const ROLE_PRESETS: Record<string, { email: string; pass: string; title: string; desc: string; badge: string }> = {
  CITY_AUTHORITY: {
    email: 'authority@urbanshield.ai',
    pass: 'authority123',
    title: 'Director Marcus (DOT)',
    desc: 'Full municipal traffic intelligence, scenario simulations & GIS controls',
    badge: 'City Authority'
  },
  EMERGENCY_RESPONDER: {
    email: 'responder@urbanshield.ai',
    pass: 'responder123',
    title: 'Captain Sarah (EMS)',
    desc: 'Emergency priority routing, green-wave signal clearance & active dispatch',
    badge: 'Emergency'
  },
  ADMIN: {
    email: 'admin@urbanshield.ai',
    pass: 'admin123',
    title: 'System Administrator',
    desc: 'ML Model registry, dataset management & system configuration',
    badge: 'Admin'
  },
  COMMUTER: {
    email: 'commuter@urbanshield.ai',
    pass: 'commuter123',
    title: 'Alex Commuter',
    desc: 'Public road safety index, live navigation & incident alerts',
    badge: 'Commuter'
  }
};

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess, onClose, isOpen }) => {
  const [selectedRole, setSelectedRole] = useState('CITY_AUTHORITY');
  const [email, setEmail] = useState(ROLE_PRESETS.CITY_AUTHORITY.email);
  const [password, setPassword] = useState(ROLE_PRESETS.CITY_AUTHORITY.pass);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRoleSelect = (roleKey: string) => {
    setSelectedRole(roleKey);
    const preset = ROLE_PRESETS[roleKey];
    if (preset) {
      setEmail(preset.email);
      setPassword(preset.pass);
    }
  };

  const handleDirectInstantAccess = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid email or password.');
      }

      localStorage.setItem('auth_token', data.access_token);
      onLoginSuccess(data.user, data.access_token);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Authentication failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-[4000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-lg rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden p-6 md:p-8 space-y-6 relative">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header */}
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#0B0F17] rounded-[14px] flex items-center justify-center">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-black text-slate-100 text-lg">URBAN-SHIELD AI</h2>
              <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-cyan-500/30">
                Persona Sign-In
              </span>
            </div>
            <p className="text-xs text-slate-400">Select any operating persona to launch with tailored permissions</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Role Quick Selector Grid */}
        <div className="space-y-2">
          <label className="text-slate-300 font-bold block text-xs">Choose Operating Persona (1-Click Switch)</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(ROLE_PRESETS).map(([key, p]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleRoleSelect(key)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  selectedRole === key
                    ? 'bg-cyan-500/15 border-cyan-500/60 text-slate-100 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">{p.badge}</span>
                  {selectedRole === key && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="font-bold text-xs text-slate-200 mt-0.5">{p.title}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Credentials Form */}
        <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
          <div>
            <label className="text-slate-400 font-medium block mb-1 text-[11px]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
          <div>
            <label className="text-slate-400 font-medium block mb-1 text-[11px]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
        </div>

        <button
          onClick={handleDirectInstantAccess}
          disabled={loading || !email || !password}
          className="w-full py-3.5 bg-gradient-to-r from-cyan-600 via-blue-600 to-emerald-500 hover:from-cyan-500 hover:to-emerald-400 text-white font-bold text-xs rounded-xl shadow-xl shadow-cyan-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Sparkles className="w-4 h-4" /> {loading ? 'Authorizing & Opening...' : `Sign In as ${ROLE_PRESETS[selectedRole]?.badge || 'User'}`} <ArrowRight className="w-4 h-4" />
        </button>

        <div className="text-[11px] text-slate-500 text-center">
          Pre-configured for local smart city demo • All roles unlocked
        </div>
      </div>
    </div>
  );
};

