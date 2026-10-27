import React, { useState } from 'react';
import { Building2, Layers, ShieldAlert, Activity, Navigation, Siren } from 'lucide-react';
import { TrafficMap } from '../components/MapContainer';

interface CityCommandViewProps {
  trafficData: any;
  accidents: any[];
  hotspots: any[];
  incidents: any[];
  onSelectSegment: (segment: any) => void;
}

export const CityCommandView: React.FC<CityCommandViewProps> = ({
  trafficData,
  accidents,
  hotspots,
  incidents,
  onSelectSegment
}) => {
  const [layers, setLayers] = useState({
    traffic: true,
    accidents: true,
    hotspots: true,
    incidents: true,
    route: false
  });

  const segments = trafficData?.segments || [];

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col space-y-4">
      {/* Top Command Banner */}
      <div className="glass-panel p-4 rounded-2xl border border-cyan-500/40 bg-cyan-950/10 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              City Authority Command Center <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30 font-mono">PALANTIR-STYLE MATRIX</span>
            </h1>
            <p className="text-xs text-slate-400">Multi-layer spatial monitoring & emergency priority response dashboard.</p>
          </div>
        </div>

        {/* Quick Toggles */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setLayers({ ...layers, traffic: !layers.traffic })}
            className={`px-3 py-1.5 rounded-lg border font-bold ${layers.traffic ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'}`}
          >
            Traffic Flow
          </button>
          <button
            onClick={() => setLayers({ ...layers, hotspots: !layers.hotspots })}
            className={`px-3 py-1.5 rounded-lg border font-bold ${layers.hotspots ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'}`}
          >
            Hotspots
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden">
        {/* Map Area */}
        <div className="lg:col-span-3 h-full rounded-2xl overflow-hidden relative">
          <TrafficMap
            segments={segments}
            accidents={accidents}
            hotspots={hotspots}
            incidents={incidents}
            activeLayers={layers}
            onSelectSegment={onSelectSegment}
          />
        </div>

        {/* Right Command Feed */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-4 overflow-y-auto">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 border-b border-slate-800 pb-2">
            Priority Telemetry Alerts
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-rose-950/40 rounded-xl border border-rose-800/50 space-y-1">
              <span className="font-bold text-rose-400 block">CRITICAL HOTSPOT ACTIVE</span>
              <p className="text-slate-300 text-[11px]">US-101 Bay Bridge Interchange risk index: 94/100.</p>
            </div>

            <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-800/50 space-y-1">
              <span className="font-bold text-amber-400 block">WEATHER RISK SURGE</span>
              <p className="text-slate-300 text-[11px]">2.4mm rain forecast to increase evening congestion by +18%.</p>
            </div>

            <div className="p-3 bg-cyan-950/40 rounded-xl border border-cyan-800/50 space-y-1">
              <span className="font-bold text-cyan-400 block">SIGNAL PREEMPTION READY</span>
              <p className="text-slate-300 text-[11px]">Ambulance-07 priority corridor cleared on Market Street.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
