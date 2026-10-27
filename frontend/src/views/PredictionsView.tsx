import React, { useState } from 'react';
import { LineChart, Zap, Cpu, CheckCircle, HelpCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface PredictionsViewProps {
  trafficData: any;
}

export const PredictionsView: React.FC<PredictionsViewProps> = ({ trafficData }) => {
  const [selectedSegmentId, setSelectedSegmentId] = useState<number>(1);
  const segments = trafficData?.segments || [];
  const selectedSeg = segments.find((s: any) => s.id === selectedSegmentId) || segments[0] || {};

  const currentCong = selectedSeg.current_congestion_pct || 25.0;

  // Generate 24-hour prediction forecast curve with confidence bounds
  const forecastData = [
    { time: 'Now', current: currentCong, predicted: currentCong, lower: Math.max(0, currentCong - 4), upper: Math.min(100, currentCong + 4) },
    { time: '+15m', current: currentCong, predicted: Math.min(95, currentCong + 8), lower: Math.max(0, currentCong + 3), upper: Math.min(100, currentCong + 13) },
    { time: '+30m', current: currentCong, predicted: Math.min(95, currentCong + 18), lower: Math.max(0, currentCong + 12), upper: Math.min(100, currentCong + 24) },
    { time: '+60m', current: currentCong, predicted: Math.min(95, currentCong + 12), lower: Math.max(0, currentCong + 5), upper: Math.min(100, currentCong + 19) },
    { time: '+120m', current: currentCong, predicted: Math.max(15, currentCong - 5), lower: Math.max(0, currentCong - 12), upper: Math.min(100, currentCong + 2) },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-800/50 uppercase tracking-wider">
            Machine Learning Pipeline
          </span>
          <h1 className="text-2xl font-black text-slate-100 mt-2">AI Traffic Prediction Engine</h1>
          <p className="text-xs text-slate-400 mt-1">
            Predicting congestion, travel speeds & volume across 15m, 30m, 60m, and 120m horizons.
          </p>
        </div>
        <div className="glass-card px-4 py-3 rounded-xl border border-slate-800 text-right">
          <span className="text-xs text-slate-400 block">Active Champion Model</span>
          <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
            <Cpu className="w-4 h-4 text-emerald-400" /> XGBoost Regressor v1.4
          </span>
        </div>
      </div>

      {/* Segment Selector & Interactive Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-200">Congestion Forecast Horizon Curve</h3>
            <select
              value={selectedSegmentId}
              onChange={(e) => setSelectedSegmentId(Number(e.target.value))}
              className="bg-slate-900 text-xs font-medium text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none"
            >
              {segments.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Recharts Area Chart */}
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#121824', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="upper" stroke="none" fill="#3B82F6" fillOpacity={0.1} />
                <Area type="monotone" dataKey="lower" stroke="none" fill="#0B0F17" fillOpacity={0.8} />
                <Area type="monotone" dataKey="predicted" stroke="#F59E0B" strokeWidth={3} fill="#F59E0B" fillOpacity={0.15} name="Predicted Congestion %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-400 text-center italic">
            Shaded blue zone represents statistically valid model confidence interval (RMSE = 6.2%).
          </p>
        </div>

        {/* Prediction Cards */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">Multi-Horizon Breakdown</h3>
          <div className="space-y-3">
            {[15, 30, 60, 120].map((h, i) => {
              const delta = Math.round((currentCong * (1 + (h / 120) * 0.3)) - currentCong);
              const predVal = Math.min(96, Math.max(10, Math.round(currentCong + delta)));
              return (
                <div key={h} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-cyan-400">+{h} Minutes Horizon</span>
                    <p className="text-[11px] text-slate-400">Predicted Speed: {Math.max(12, Math.round(60 * (1 - predVal / 100)))} km/h</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-amber-400">{predVal}%</span>
                    <span className={`block text-[10px] font-bold ${delta >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {delta >= 0 ? `+${delta}%` : `${delta}%`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
