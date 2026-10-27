import React, { useState } from 'react';
import { X, ShieldAlert, Activity, AlertTriangle, MapPin, ChevronRight, CheckCircle2, Navigation, Info } from 'lucide-react';

interface SegmentInspectorProps {
  segment: any | null;
  onClose: () => void;
}

export const SegmentInspector: React.FC<SegmentInspectorProps> = ({ segment, onClose }) => {
  const [showExplainModal, setShowExplainModal] = useState(false);

  if (!segment) return null;

  const safety = segment.safety_details || {
    safety_score: segment.current_safety_score || 75.0,
    rating: "Safe",
    penalties_breakdown: []
  };

  const risk = segment.accident_risk_details || {
    accident_probability_pct: 35.0,
    risk_category: segment.current_risk_level || "MEDIUM",
    top_contributing_factors: []
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[420px] glass-panel border-l border-slate-700/80 z-[2000] p-5 overflow-y-auto shadow-2xl flex flex-col justify-between transition-transform duration-300">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-700/60 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
              {segment.road_type} Corridor #{segment.id}
            </span>
            <h2 className="text-lg font-bold text-slate-100 mt-1">{segment.name}</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Location: Lat {segment.start_lat?.toFixed(4)}, Lon {segment.start_lon?.toFixed(4)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Location & GIS Details Card */}
        <div className="glass-card p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-400">Length:</span>
            <span className="font-semibold">{segment.length_km} km</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-400">Road Capacity:</span>
            <span className="font-semibold">{segment.capacity_vph} Vehicles/Hour</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-400">Start Coordinates:</span>
            <span className="font-mono text-cyan-300">[{segment.start_lat?.toFixed(4)}, {segment.start_lon?.toFixed(4)}]</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-400">End Coordinates:</span>
            <span className="font-mono text-cyan-300">[{segment.end_lat?.toFixed(4)}, {segment.end_lon?.toFixed(4)}]</span>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-3 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-400">Current Speed</span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-2xl font-black text-emerald-400">{segment.current_speed_kmh}</span>
              <span className="text-xs text-slate-400">/ {segment.speed_limit_kmh} km/h</span>
            </div>
          </div>

          <div className="glass-card p-3 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-400">Congestion Density</span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className={`text-2xl font-black ${segment.current_congestion_pct > 60 ? 'text-rose-400' : 'text-amber-400'}`}>
                {segment.current_congestion_pct}%
              </span>
              <span className="text-xs text-slate-400">density</span>
            </div>
          </div>
        </div>

        {/* Safety Score Section */}
        <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" /> Road Safety Index
            </span>
            <button
              onClick={() => setShowExplainModal(true)}
              className="text-xs text-cyan-400 hover:underline flex items-center gap-0.5"
            >
              Explain Score <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center space-x-4 pt-1">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 border-2 border-cyan-500/40">
              <span className="text-xl font-black text-cyan-400">{safety.safety_score}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-100">{safety.rating}</p>
              <p className="text-xs text-slate-400">Based on accident history, weather exposure & congestion density.</p>
            </div>
          </div>
        </div>

        {/* Accident Risk Analysis */}
        <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> Accident Risk Classifier
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
              risk.risk_category === 'CRITICAL' ? 'bg-rose-950 text-rose-400 border-rose-800' :
              risk.risk_category === 'HIGH' ? 'bg-amber-950 text-amber-400 border-amber-800' :
              'bg-emerald-950 text-emerald-400 border-emerald-800'
            }`}>
              {risk.risk_category} RISK
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <p className="text-slate-300 font-medium">Top Contributing Factors:</p>
            {risk.top_contributing_factors && risk.top_contributing_factors.length > 0 ? (
              risk.top_contributing_factors.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center bg-slate-900/60 p-2 rounded border border-slate-800 text-slate-300">
                  <span>{item.factor}</span>
                  <span className="text-rose-400 font-mono font-bold">{item.contribution}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 italic">Optimal driving conditions recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between items-center">
        <span>ID: RS-{String(segment.id).padStart(4, '0')}</span>
        <span>Last telemetry: 1 min ago</span>
      </div>

      {/* Explain Score Modal */}
      {showExplainModal && (
        <div className="fixed inset-0 z-[3000] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-slate-700 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Info className="w-5 h-5 text-cyan-400" /> Explain Road Safety Score
              </h3>
              <button onClick={() => setShowExplainModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Formula: <code className="bg-slate-900 px-2 py-1 rounded text-cyan-300 font-mono">Safety Score = 100 - Total Deducted Penalties</code>
              </p>

              <div className="space-y-2">
                {safety.penalties_breakdown?.map((p: any, i: number) => (
                  <div key={i} className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-200">{p.name}</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">{p.reason}</p>
                    </div>
                    <span className="text-rose-400 font-mono font-bold text-sm">-{p.points_deducted} pts</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowExplainModal(false)}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs transition-colors"
            >
              Close Explanation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
