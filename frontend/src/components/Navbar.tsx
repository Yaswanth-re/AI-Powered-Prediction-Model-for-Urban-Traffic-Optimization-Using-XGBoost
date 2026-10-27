import React, { useState } from 'react';
import { Shield, Bell, User, Cpu, AlertTriangle, Activity, LogIn, Database } from 'lucide-react';

interface NavbarProps {
  currentRole: string;
  onRoleChange: (role: string) => void;
  activeCity: string;
  onCityChange: (city: string) => void;
  alerts: any[];
  currentUser: any | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  datasetLabel?: string;
  onOpenDatasetModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  activeCity,
  onCityChange,
  alerts = [],
  currentUser,
  onOpenLogin,
  onLogout,
  datasetLabel = "Pre-loaded Smart City Data",
  onOpenDatasetModal
}) => {
  const [showAlertsMenu, setShowAlertsMenu] = useState(false);

  return (
    <header className="h-16 glass-panel border-b border-slate-800 px-6 flex items-center justify-between z-[1500] relative">
      {/* Brand Logo & Tagline */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/20">
          <div className="w-full h-full bg-[#0B0F17] rounded-[10px] flex items-center justify-center">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-black tracking-wider text-base text-slate-100">URBAN-SHIELD</span>
            <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-cyan-500/30">AI v1.0</span>
          </div>
          <p className="text-[10px] text-slate-400 tracking-wide">Predict Traffic. Prevent Risk. Move Smarter.</p>
        </div>
      </div>

      {/* City Status Ticker */}
      <div className="hidden lg:flex items-center space-x-6 glass-card px-4 py-1.5 rounded-full border border-slate-800 text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-400">City Status:</span>
          <span className="font-bold text-slate-200">MODERATE</span>
        </div>
        <div className="h-3 w-px bg-slate-800"></div>
        <div className="flex items-center space-x-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">Safety Index:</span>
          <span className="font-bold text-cyan-400">76/100</span>
        </div>
        <div className="h-3 w-px bg-slate-800"></div>
        <div className="flex items-center space-x-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">Incidents:</span>
          <span className="font-bold text-amber-400">4 Active</span>
        </div>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center space-x-3">
        {/* DATASET CONFIGURATION BADGE & BUTTON */}
        <button
          onClick={onOpenDatasetModal}
          className="hidden md:inline-flex items-center gap-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[11px] font-bold px-2.5 py-1.5 rounded-xl border border-cyan-500/30 transition-all cursor-pointer shadow-sm"
          title="Click to configure Dataset (Pre-loaded, Upload CSV, or API feed)"
        >
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="truncate max-w-[160px]">{datasetLabel}</span>
        </button>

        {/* City Selector */}
        <select
          value={activeCity}
          onChange={(e) => onCityChange(e.target.value)}
          className="bg-slate-900 text-xs font-medium text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
        >
          <option value="San Francisco">San Francisco (USA)</option>
          <option value="Bengaluru">Bengaluru (India)</option>
          <option value="New York City">New York City (USA)</option>
          <option value="London">London (UK)</option>
          <option value="Tokyo">Tokyo (Japan)</option>
        </select>

        {/* User Account / Login Button */}
        {currentUser ? (
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <div className="w-6 h-6 rounded-full bg-cyan-600/30 text-cyan-400 font-bold flex items-center justify-center text-[11px] border border-cyan-500/40">
              {currentUser.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <span className="font-bold text-slate-200 block text-[11px] leading-tight">{currentUser.name}</span>
              <span className="text-[9px] text-cyan-400 font-mono leading-none">{currentUser.role}</span>
            </div>
            <button
              onClick={onOpenLogin}
              title="Switch Account"
              className="p-1 text-slate-400 hover:text-cyan-400 transition-colors ml-1"
            >
              <LogIn className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-600/20 flex items-center gap-1.5 transition-all"
          >
            <LogIn className="w-3.5 h-3.5" /> Sign In
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowAlertsMenu(!showAlertsMenu)}
            className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
                {alerts.length}
              </span>
            )}
          </button>

          {showAlertsMenu && (
            <div className="absolute right-0 mt-2 w-80 glass-panel rounded-xl border border-slate-700 p-3 shadow-2xl space-y-2 z-[3000]">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200">System Alerts ({alerts.length})</span>
                <button onClick={() => setShowAlertsMenu(false)} className="text-[10px] text-cyan-400 hover:underline">Close</button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {alerts.map((a: any, i: number) => (
                  <div key={i} className="p-2 bg-slate-900/80 rounded border border-slate-800 text-xs space-y-1">
                    <p className="font-bold text-rose-400">{a.title}</p>
                    <p className="text-slate-300 text-[11px]">{a.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

