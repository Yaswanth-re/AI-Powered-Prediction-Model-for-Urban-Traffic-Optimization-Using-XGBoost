import React from 'react';
import { Cpu, CheckCircle2, Award, BarChart2 } from 'lucide-react';

interface ModelsViewProps {
  models: any[];
}

export const ModelsView: React.FC<ModelsViewProps> = ({ models }) => {
  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800/50 uppercase tracking-wider">
            MLOps & Model Registry
          </span>
          <h1 className="text-2xl font-black text-slate-100 mt-2">Machine Learning Model Performance</h1>
          <p className="text-xs text-slate-400 mt-1">
            Tracking trained models across regression, classification, time-series forecasting, and spatial DBSCAN clustering algorithms.
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-200">Active Champion Models & Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Model Name</th>
                <th className="p-3">Algorithm</th>
                <th className="p-3">Version</th>
                <th className="p-3">Task</th>
                <th className="p-3">MAE</th>
                <th className="p-3">RMSE</th>
                <th className="p-3">R² Score</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {models.map((m) => (
                <tr key={m.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3 font-bold text-slate-100 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-cyan-400" /> {m.name}
                  </td>
                  <td className="p-3 font-mono text-cyan-300">{m.algorithm}</td>
                  <td className="p-3 text-slate-400 font-mono">{m.version}</td>
                  <td className="p-3 text-slate-300">{m.task}</td>
                  <td className="p-3 font-mono">{m.mae !== null ? m.mae : 'N/A'}</td>
                  <td className="p-3 font-mono">{m.rmse !== null ? m.rmse : 'N/A'}</td>
                  <td className="p-3 font-mono text-emerald-400 font-bold">{m.r2_score !== null ? m.r2_score : (m.f1_score ? `F1: ${m.f1_score}` : 'N/A')}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      m.is_active ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {m.is_active ? 'CHAMPION / PRODUCTION' : 'EXPERIMENT'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
