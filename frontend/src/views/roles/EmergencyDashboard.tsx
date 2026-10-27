import React, { useState } from 'react';
import { Siren, ShieldAlert, Zap, Navigation, Clock, CheckCircle2, Building2 } from 'lucide-react';
import { TrafficMap } from '../../components/MapContainer';
import { planRoute } from '../../services/api';

interface EmergencyDashboardProps {
  trafficData: any;
  accidents: any[];
  hotspots: any[];
  incidents: any[];
  activeCity: string;
  onSelectSegment: (seg: any) => void;
}

export const EmergencyDashboard: React.FC<EmergencyDashboardProps> = ({
  trafficData,
  accidents,
  hotspots,
  incidents,
  activeCity,
  onSelectSegment
}) => {
  const [vehicle, setVehicle] = useState('AMBULANCE-07');
  const [destination, setDestination] = useState(`${activeCity} General Hospital`);
  const [activeDispatch, setActiveDispatch] = useState(false);
  const [routeInfo, setRouteInfo] = useState<any>(null);

  const handleDispatch = async () => {
    const res = await planRoute(
      { lat: 37.7885, lon: -122.4005 },
      { lat: 37.7735, lon: -122.4215 },
      'Emergency'
    );
    setRouteInfo(res?.active_route);
    setActiveDispatch(true);
  };

  const segments = trafficData?.segments || [];

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Role Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-rose-800/80 bg-rose-950/20 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-tr from-rose-600 to-amber-600 rounded-2xl shadow-lg shadow-rose-600/30">
            <Siren className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800 uppercase tracking-wider">
              Emergency Dispatch • {activeCity} Command
            </span>
            <h1 className="text-xl font-bold text-slate-100 mt-1">Tactical Emergency Response & Priority Dispatch</h1>
            <p className="text-xs text-slate-400">Green-wave signal priority recommendation engine for EMS, Fire & Law Enforcement.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
          <span className="text-xs font-black text-rose-400 uppercase tracking-wider">DISPATCH ENGINE LIVE</span>
        </div>
      </div>

      {/* Main Tactical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Dispatch Form & Active Status */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-rose-900/60 bg-slate-900/80 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Initiate Priority Dispatch
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Emergency Unit</label>
                <select
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-rose-500 font-bold"
                >
                  <option value="AMBULANCE-07">AMBULANCE-07 (EMS Unit)</option>
                  <option value="FIRE-ENGINE-02">FIRE-ENGINE-02 (Battalion)</option>
                  <option value="POLICE-PATROL-14">POLICE-PATROL-14 (Cruiser)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Emergency Destination</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-rose-500 font-bold"
                />
              </div>
            </div>

            <button
              onClick={handleDispatch}
              className="w-full py-3 bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Siren className="w-4 h-4" /> Trigger Green-Wave Priority
            </button>
          </div>

          {/* Active Emergency Status Box */}
          {activeDispatch && routeInfo && (
            <div className="glass-panel p-5 rounded-2xl border border-rose-500/60 bg-rose-950/30 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                  PRIORITY UNIT EN ROUTE
                </span>
                <span className="text-xs font-bold text-emerald-400">ETA: {routeInfo.estimated_time_minutes} mins</span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between"><span>Unit:</span><span className="font-mono text-cyan-400 font-bold">{vehicle}</span></div>
                <div className="flex justify-between"><span>Route Length:</span><span className="font-mono text-slate-200">{routeInfo.distance_km} km</span></div>
                <div className="flex justify-between"><span>Hotspots Bypassed:</span><span className="font-mono text-emerald-400 font-bold">{routeInfo.hotspots_encountered}</span></div>
              </div>
              <div className="p-2.5 bg-emerald-950/40 rounded-xl border border-emerald-800/40 text-[11px] text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Traffic Signals Preempted (Simulated Green-Wave)</span>
              </div>
            </div>
          )}

          {/* Hospital Matrix */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 text-xs">
            <h3 className="font-bold text-slate-200 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-rose-400" /> Nearest Trauma Centers
            </h3>
            <div className="space-y-2">
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-200">{activeCity} Central Trauma</p>
                  <p className="text-[10px] text-slate-400">Capacity: 12 Beds Available</p>
                </div>
                <span className="font-bold text-emerald-400">4.2 min ETA</span>
              </div>
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-200">St. Jude Emergency Center</p>
                  <p className="text-[10px] text-slate-400">Capacity: 4 Beds Available</p>
                </div>
                <span className="font-bold text-amber-400">8.5 min ETA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Tactical Emergency GIS Map */}
        <div className="lg:col-span-2 glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Siren className="w-4 h-4 text-rose-400" /> Tactical Emergency GIS View ({activeCity})
            </h3>
            <span className="text-xs text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
              Hotspots Layer Forced ON
            </span>
          </div>
          <div className="h-[480px] w-full rounded-xl overflow-hidden">
            <TrafficMap
              segments={segments}
              accidents={accidents}
              hotspots={hotspots}
              incidents={incidents}
              activeCity={activeCity}
              activeRoutePath={routeInfo?.path_coordinates || []}
              onSelectSegment={onSelectSegment}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
