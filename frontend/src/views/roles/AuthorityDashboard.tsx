import React, { useState } from 'react';
import { Building2, Layers, Activity, Sliders, Leaf, ShieldAlert, ArrowRight, Play } from 'lucide-react';
import { TrafficMap } from '../../components/MapContainer';
import { runSimulation } from '../../services/api';

interface AuthorityDashboardProps {
  trafficData: any;
  accidents: any[];
  hotspots: any[];
  incidents: any[];
  activeCity: string;
  onSelectSegment: (seg: any) => void;
  onNavigateTab: (tab: string) => void;
}

export const AuthorityDashboard: React.FC<AuthorityDashboardProps> = ({
  trafficData,
  accidents,
  hotspots,
  incidents,
  activeCity,
  onSelectSegment,
  onNavigateTab
}) => {
  const [volSurge, setVolSurge] = useState(25);
  const [rainfall, setRainfall] = useState(5.0);
  const [simResult, setSimResult] = useState<any>(null);
  const [loadingSim, setLoadingSim] = useState(false);

  const handleRunSim = async () => {
    setLoadingSim(true);
    const res = await runSimulation({
      traffic_volume_change_pct: volSurge,
      rainfall_mm: rainfall,
      road_closure_id: 1,
      event_surge_flag: true
    });
    setSimResult(res);
    setLoadingSim(false);
  };

  const segments = trafficData?.segments || [];

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Role Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-500/40 bg-cyan-950/10 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800 uppercase tracking-wider">
              Department of Transportation • {activeCity} Command
            </span>
            <h1 className="text-xl font-bold text-slate-100 mt-1">Municipal Traffic Intelligence & Urban Command Center</h1>
            <p className="text-xs text-slate-400">Palantir-style spatial control, what-if urban planning simulations & CO₂ analytics.</p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('simulation')}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/20 flex items-center gap-1.5 transition-all"
        >
          Full Simulator Sandbox <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Authority KPI Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Monitored Segments</span>
          <span className="text-2xl font-black text-slate-100 block">150 Corridors</span>
          <span className="text-[11px] text-emerald-400">Across 5 Smart Cities</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">City Safety Score</span>
          <span className="text-2xl font-black text-cyan-400 block">76 / 100</span>
          <span className="text-[11px] text-slate-400">Safe Rating</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">CO₂ Impact Today</span>
          <span className="text-2xl font-black text-slate-100 block">14.8 Tonnes</span>
          <span className="text-[11px] text-emerald-400">3.2t Potential Savings</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">DBSCAN Hotspots</span>
          <span className="text-2xl font-black text-rose-400 block">15 Active Clusters</span>
          <span className="text-[11px] text-rose-400 font-bold">Requires Infrastructure Attention</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quick What-If Planning Sandbox */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" /> Urban What-If Simulator
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span>Simulated Traffic Surge</span>
                  <span className="text-amber-400 font-bold">+{volSurge}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={volSurge}
                  onChange={(e) => setVolSurge(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span>Rainfall Intensity</span>
                  <span className="text-cyan-400 font-bold">{rainfall} mm/h</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={rainfall}
                  onChange={(e) => setRainfall(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>

            <button
              onClick={handleRunSim}
              disabled={loadingSim}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-white" /> {loadingSim ? 'Computing Physics Forecast...' : 'Run Quick Scenario'}
            </button>
          </div>

          {simResult && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <span className="text-[10px] font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                FORECAST RESULT
              </span>
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-lg font-black text-rose-400">Congestion: {simResult.simulated?.avg_congestion_pct}%</span>
                <span className="text-slate-400">Delay: +{simResult.simulated?.travel_time_change_min}m</span>
              </div>
              <p className="text-[11px] text-slate-300 bg-slate-900/80 p-2 rounded border border-slate-800">
                {simResult.impact_analysis?.[0] || 'Traffic congestion increases due to volume surge.'}
              </p>
            </div>
          )}
        </div>

        {/* Right: Palantir Spatial GIS Control */}
        <div className="lg:col-span-2 glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" /> Palantir Multi-Layer GIS Control ({activeCity})
            </h3>
            <span className="text-xs text-cyan-400 font-mono">Real-time Stream Active</span>
          </div>
          <div className="h-[460px] w-full rounded-xl overflow-hidden">
            <TrafficMap
              segments={segments}
              accidents={accidents}
              hotspots={hotspots}
              incidents={incidents}
              activeCity={activeCity}
              onSelectSegment={onSelectSegment}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
