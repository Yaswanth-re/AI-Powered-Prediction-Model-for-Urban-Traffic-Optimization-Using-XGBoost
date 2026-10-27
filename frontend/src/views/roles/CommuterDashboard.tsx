import React, { useState } from 'react';
import { User, Navigation, ShieldCheck, Clock, AlertCircle, CloudRain, ArrowRight, ThumbsUp, MapPin } from 'lucide-react';
import { TrafficMap } from '../../components/MapContainer';
import { planRoute } from '../../services/api';

interface CommuterDashboardProps {
  trafficData: any;
  accidents: any[];
  hotspots: any[];
  incidents: any[];
  activeCity: string;
  onSelectSegment: (seg: any) => void;
  onNavigateTab: (tab: string) => void;
}

export const CommuterDashboard: React.FC<CommuterDashboardProps> = ({
  trafficData,
  accidents,
  hotspots,
  incidents,
  activeCity,
  onSelectSegment,
  onNavigateTab
}) => {
  const [commuteStart, setCommuteStart] = useState('Home (Downtown Corridor)');
  const [commuteEnd, setCommuteEnd] = useState('Workplace (Tech Bay)');
  const [routeResult, setRouteResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePlanCommute = async () => {
    setLoading(true);
    const res = await planRoute(
      { lat: 37.7885, lon: -122.4005 },
      { lat: 37.7735, lon: -122.4215 },
      'Balanced'
    );
    setRouteResult(res);
    setLoading(false);
  };

  const segments = trafficData?.segments || [];

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Role Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-emerald-500/40 bg-emerald-950/10 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-tr from-emerald-600 to-cyan-600 rounded-2xl shadow-lg shadow-emerald-500/20">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 uppercase tracking-wider">
              Commuter Portal • {activeCity}
            </span>
            <h1 className="text-xl font-bold text-slate-100 mt-1">Smart Personal Mobility & Daily Route Assistant</h1>
            <p className="text-xs text-slate-400">Find the safest, fastest daily commute and receive live hazard updates.</p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('routes')}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
        >
          Full Route Planner <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Commuter Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Personal Commute Planner */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" /> Daily Commute Calculator
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Starting Point</label>
                <input
                  type="text"
                  value={commuteStart}
                  onChange={(e) => setCommuteStart(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Destination</label>
                <input
                  type="text"
                  value={commuteEnd}
                  onChange={(e) => setCommuteEnd(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={handlePlanCommute}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
            >
              {loading ? 'Evaluating Safe & Speed Paths...' : 'Analyze My Commute'}
            </button>
          </div>

          {/* Route Comparison Output */}
          {routeResult && (
            <div className="glass-panel p-5 rounded-2xl border border-emerald-500/40 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                RECOMMENDED COMMUTE ROUTE
              </span>
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-black text-slate-100">{routeResult.all_options?.Safest?.estimated_time_minutes} min</span>
                <span className="text-xs font-bold text-emerald-400">Safety Index: {routeResult.all_options?.Safest?.safety_score}/100</span>
              </div>
              <p className="text-xs text-emerald-300 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/40">
                {routeResult.all_options?.Safest?.recommendation}
              </p>
            </div>
          )}

          {/* Quick Hazard Report Trigger */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400" /> See a Road Hazard?
            </h3>
            <p className="text-xs text-slate-400">Report potholes, accidents, or signal issues to alert fellow commuters.</p>
            <button
              onClick={() => onNavigateTab('incidents')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs rounded-xl transition-colors border border-slate-700"
            >
              Report Incident Now
            </button>
          </div>
        </div>

        {/* Right: Live Interactive Map */}
        <div className="lg:col-span-2 glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-400" /> {activeCity} Live Commuter Map
            </h3>
            <span className="text-xs text-slate-400 font-mono">120 Segments Monitored</span>
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
