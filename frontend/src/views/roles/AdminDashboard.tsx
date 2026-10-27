import React from 'react';
import { Cpu, Database, CheckCircle2, Shield, Server, Activity, Terminal } from 'lucide-react';

interface AdminDashboardProps {
  models: any[];
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ models, onNavigateTab }) => {
  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Role Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-500/40 bg-purple-950/10 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/20">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800 uppercase tracking-wider">
              System Admin & MLOps Control
            </span>
            <h1 className="text-xl font-bold text-slate-100 mt-1">Platform Infrastructure & Model Registry</h1>
            <p className="text-xs text-slate-400">Monitor database health, ML champion models, server logs, and pipeline execution.</p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('models')}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/20 transition-all flex items-center gap-1.5"
        >
          Model Registry <Cpu className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Admin KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Database Health</span>
          <span className="text-xl font-black text-emerald-400 block">100% ONLINE</span>
          <span className="text-[11px] text-slate-400">SQLite + PostGIS Dual Mode</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active ML Models</span>
          <span className="text-xl font-black text-purple-400 block">{models.length} Trained Models</span>
          <span className="text-[11px] text-slate-400">XGBoost v1.4 Champion</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Database Records</span>
          <span className="text-xl font-black text-slate-100 block">3,200+ Rows</span>
          <span className="text-[11px] text-cyan-400">5 Global Cities Seeded</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Server Latency</span>
          <span className="text-xl font-black text-emerald-400 block">14 ms</span>
          <span className="text-[11px] text-slate-400">FastAPI Uvicorn Engine</span>
        </div>
      </div>

      {/* Main Admin Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Registry Summary */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" /> Active Machine Learning Champions
          </h3>
          <div className="space-y-2 text-xs">
            {models.map((m) => (
              <div key={m.id} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-100 block">{m.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{m.algorithm} ({m.version})</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-400 block">{m.r2_score ? `R² ${m.r2_score}` : (m.f1_score ? `F1 ${m.f1_score}` : `MAE ${m.mae}`)}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${m.is_active ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'}`}>
                    {m.is_active ? 'PRODUCTION' : 'OFFLINE'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Server Logs Window */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-cyan-400" /> Infrastructure System Log Stream
          </h3>
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono space-y-1.5 text-slate-400 h-64 overflow-y-auto">
            <p className="text-emerald-400">[INFO] FastAPI backend running on http://0.0.0.0:8000</p>
            <p className="text-cyan-400">[OK] Weather telemetry sync completed (2.4mm rain)</p>
            <p className="text-amber-400">[WARN] High accident probability (78%) detected on Market Street</p>
            <p className="text-purple-400">[ML] XGBoost Inference pipeline executed in 1.2ms</p>
            <p className="text-slate-400">[INFO] WebSockets pub-sub broadcast sent to active clients</p>
            <p className="text-emerald-400">[OK] Clean arterial corridors loaded across 5 global smart cities</p>
          </div>
        </div>
      </div>
    </div>
  );
};
