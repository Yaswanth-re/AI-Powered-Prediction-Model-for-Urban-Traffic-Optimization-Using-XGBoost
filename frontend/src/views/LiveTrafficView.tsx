import React, { useState } from 'react';
import { GoogleLiveTrafficMap } from '../components/GoogleLiveTrafficMap';
import { Layers, Search, Filter } from 'lucide-react';

interface LiveTrafficViewProps {
  trafficData: any;
  accidents: any[];
  hotspots: any[];
  incidents: any[];
  activeCity?: string;
  onSelectSegment: (segment: any) => void;
}

export const LiveTrafficView: React.FC<LiveTrafficViewProps> = ({
  trafficData,
  accidents,
  hotspots,
  incidents,
  activeCity,
  onSelectSegment
}) => {
  const [layers, setLayers] = useState({
    traffic: true,
    accidents: true,
    hotspots: true,
    incidents: true,
    route: false
  });

  const [searchQuery, setSearchQuery] = useState('');
  const segments = trafficData?.segments || [];

  const filteredSegments = searchQuery
    ? segments.filter((s: any) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : segments;

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col space-y-4">
      {/* Top Map Control Bar */}
      <div className="glass-panel p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search road or corridor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center space-x-2 text-xs font-semibold">
          <span className="text-slate-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-cyan-400" /> Layers:
          </span>
          <button
            onClick={() => setLayers({ ...layers, traffic: !layers.traffic })}
            className={`px-2.5 py-1 rounded border transition-colors ${
              layers.traffic ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            Traffic Flow
          </button>
          <button
            onClick={() => setLayers({ ...layers, accidents: !layers.accidents })}
            className={`px-2.5 py-1 rounded border transition-colors ${
              layers.accidents ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            Accidents
          </button>
          <button
            onClick={() => setLayers({ ...layers, hotspots: !layers.hotspots })}
            className={`px-2.5 py-1 rounded border transition-colors ${
              layers.hotspots ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            DBSCAN Hotspots
          </button>
          <button
            onClick={() => setLayers({ ...layers, incidents: !layers.incidents })}
            className={`px-2.5 py-1 rounded border transition-colors ${
              layers.incidents ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            Incidents
          </button>
        </div>
      </div>

      {/* Map Body */}
      <div className="flex-1 w-full rounded-2xl overflow-hidden relative">
        <GoogleLiveTrafficMap
          activeCity={activeCity}
          segments={filteredSegments}
          accidents={accidents}
          hotspots={hotspots}
          incidents={incidents}
          activeLayers={layers}
          onSelectSegment={onSelectSegment}
        />
      </div>
    </div>
  );
};
