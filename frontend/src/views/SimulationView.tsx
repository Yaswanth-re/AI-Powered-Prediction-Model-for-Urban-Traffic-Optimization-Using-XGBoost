import React, { useState } from 'react';
import { Sliders, Play, RotateCcw, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { runSimulation } from '../services/api';

export const SimulationView: React.FC = () => {
  const [volSurge, setVolSurge] = useState(25);
  const [rainfall, setRainfall] = useState(5.0);
  const [roadClosure, setRoadClosure] = useState(true);
  const [eventSurge, setEventSurge] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleRunSim = async () => {
    setLoading(true);
    const res = await runSimulation({
      traffic_volume_change_pct: volSurge,
      rainfall_mm: rainfall,
      road_closure_id: roadClosure ? 1 : null,
      event_surge_flag: eventSurge
    });
    setSimResult(res);
    setLoading(false);
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-800/50 uppercase tracking-wider">
            City Planning Sandbox
          </span>
          <h1 className="text-2xl font-black text-slate-100 mt-2">What-If Scenario Simulator</h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulate hypothetical traffic surges, severe weather, stadium events & road closures to forecast impact on travel times and safety.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <h3 className="text-sm font-bold text-slate-200">Simulation Variables</h3>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Traffic Volume Surge</span>
                <span className="text-amber-400">+{volSurge}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={volSurge}
                onChange={(e) => setVolSurge(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Rainfall Intensity</span>
                <span className="text-cyan-400">{rainfall} mm/h</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="0.5"
                value={rainfall}
                onChange={(e) => setRainfall(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={roadClosure}
                  onChange={(e) => setRoadClosure(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Simulate Major Road Closure (Market St)</span>
              </label>

              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={eventSurge}
                  onChange={(e) => setEventSurge(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Simulate Stadium Concert / Game Event Traffic</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleRunSim}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" /> {loading ? 'Running Physics Simulation...' : 'Execute What-If Forecast'}
          </button>
        </div>

        {/* Results Card */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Simulation Forecast Results</h3>

          {simResult ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Simulated Congestion</span>
                  <span className="text-2xl font-black text-rose-400">{simResult.simulated?.avg_congestion_pct}%</span>
                  <span className="text-[10px] text-rose-400 font-bold block">+{simResult.simulated?.congestion_change_pct}% baseline</span>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Avg Travel Time</span>
                  <span className="text-2xl font-black text-amber-400">{simResult.simulated?.avg_travel_time_min} mins</span>
                  <span className="text-[10px] text-amber-400 font-bold block">+{simResult.simulated?.travel_time_change_min} mins delay</span>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Projected Safety Index</span>
                  <span className="text-2xl font-black text-cyan-400">{simResult.simulated?.city_safety_score} /100</span>
                  <span className="text-[10px] text-rose-400 font-bold block">{simResult.simulated?.safety_score_change} pts penalty</span>
                </div>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="font-bold text-cyan-400 block">AI Impact Analysis Report:</span>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {simResult.impact_analysis?.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs italic">
              Adjust variables on the left and click "Execute What-If Forecast" to generate physical traffic impact projections.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
