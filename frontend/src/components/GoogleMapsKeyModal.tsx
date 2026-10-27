import React, { useState, useEffect } from 'react';
import { Key, CheckCircle2, ExternalLink, ShieldAlert, Sparkles, X, Trash2, Eye, EyeOff } from 'lucide-react';

interface GoogleMapsKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: (key: string) => void;
}

export const GoogleMapsKeyModal: React.FC<GoogleMapsKeyModalProps> = ({
  isOpen,
  onClose,
  onKeySaved
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      const existing = localStorage.getItem('google_maps_api_key') || (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';
      setApiKey(existing);
      setSavedSuccess(false);
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setErrorMessage('Please enter a valid Google Maps API Key.');
      return;
    }
    if (!trimmed.startsWith('AIza')) {
      // Google API keys virtually always start with AIza
      // Allow it but warn
    }
    localStorage.setItem('google_maps_api_key', trimmed);
    setSavedSuccess(true);
    setErrorMessage('');
    setTimeout(() => {
      onKeySaved(trimmed);
      onClose();
    }, 800);
  };

  const handleRemove = () => {
    localStorage.removeItem('google_maps_api_key');
    setApiKey('');
    onKeySaved('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-cyan-500/30 bg-[#0c121d] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Google Maps Live Real-Time Traffic
                <span className="text-[10px] bg-cyan-500/20 text-cyan-400 font-mono px-2 py-0.5 rounded border border-cyan-500/30">
                  REAL-TIME API
                </span>
              </h2>
              <p className="text-xs text-slate-400">Stream genuine Google live traffic flows & high-definition street maps</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* How it works card */}
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              What Google Maps Live Traffic Provides:
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-300">
              <li><strong className="text-white">Authentic Live Congestion</strong>: Green (Free Flow), Orange/Yellow (Slow), Red (Heavy Congestion), and Dark Red (Gridlock) directly on all city roads.</li>
              <li><strong className="text-white">Crystal Clear Roadmap</strong>: Crisp, readable street names, highway labels, and high-contrast vector clarity.</li>
              <li><strong className="text-white">Full Integration</strong>: URBAN-SHIELD accident hotspots, safety scores, and smart routing overlaid cleanly on the live Google Map.</li>
            </ul>
          </div>

          {/* Instructions Box */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                How to get your free Google Maps API Key (2 mins):
              </span>
              <a
                href="https://console.cloud.google.com/google/maps-apis/overview"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] font-semibold"
              >
                Google Cloud Console <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-slate-400 pl-1 leading-relaxed">
              <li>
                Visit the <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-medium">Google Cloud Console</a> and select or create a project.
              </li>
              <li>
                Navigate to <strong className="text-slate-200">APIs & Services &gt; Library</strong>.
              </li>
              <li>
                Search for <strong className="text-cyan-400">Maps JavaScript API</strong> and click <strong className="text-emerald-400">Enable</strong>.
              </li>
              <li>
                Go to <strong className="text-slate-200">APIs & Services &gt; Credentials</strong>, click <strong className="text-cyan-400">+ Create Credentials</strong> &rarr; <strong className="text-cyan-400">API Key</strong>.
              </li>
              <li>
                Copy your API Key (starts with <code className="text-amber-400 bg-slate-950 px-1 py-0.5 rounded font-mono">AIza...</code>) and paste it below.
              </li>
            </ol>
            <p className="text-[11px] text-slate-500 italic">
              Note: Google Cloud offers a $200 free monthly credit for Maps JavaScript API, which covers up to ~28,000 map loads per month at zero cost.
            </p>
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <label className="font-bold text-slate-200 block text-xs">
              Paste your Google Maps API Key:
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 font-mono text-xs focus:outline-none focus:border-cyan-500 pr-20"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[11px]"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errorMessage && (
              <p className="text-rose-400 flex items-center gap-1 text-xs">
                <ShieldAlert className="w-3.5 h-3.5" /> {errorMessage}
              </p>
            )}
            {savedSuccess && (
              <p className="text-emerald-400 flex items-center gap-1 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> API Key saved successfully! Activating Google Live Traffic...
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div>
            {localStorage.getItem('google_maps_api_key') && (
              <button
                onClick={handleRemove}
                className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove Stored Key
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl border border-slate-700 text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/30 flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" /> Save & Activate Google Live Traffic
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
