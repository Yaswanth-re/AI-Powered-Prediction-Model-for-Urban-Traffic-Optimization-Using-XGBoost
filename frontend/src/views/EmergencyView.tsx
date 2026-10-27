import React, { useState } from 'react';
import { Siren, ShieldAlert, Navigation, Zap, CheckCircle2, Clock } from 'lucide-react';
import { planRoute } from '../services/api';

export const EmergencyView: React.FC = () => {
  const [vehicle, setVehicle] = useState('AMBULANCE-07');
  const [destination, setDestination] = useState('SF General City Hospital');
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [routeInfo, setRouteInfo] = useState<any>(null);

  const handleDispatch = async () => {
    const res = await planRoute(
      { lat: 37.7885, lon: -122.4005 },
      { lat: 37.7735, lon: -122.4215 },
      'Emergency'
    );
    setRouteInfo(res?.active_route);
    setEmergencyActive(true);
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      <div className="glass-panel p-6 rounded-2xl border border-rose-800/60 bg-rose-950/10 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded border border-rose-800/50 uppercase tracking-wider flex items-center gap-1.5 w-fit">
            <Siren className="w-4 h-4 animate-pulse" /> Emergency Response System
          </span>
          <h1 className="text-2xl font-black text-slate-100 mt-2">Priority Dispatch & Signal Preemption</h1>
          <p className="text-xs text-slate-400 mt-1">
            Optimizes emergency response time while avoiding congested bottlenecks. Simulates green-wave traffic signal priority recommendations.
          </p>
        </div>
      </div>

      {/* Dispatch Controls & Active Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Dispatch Setup</h3>
          
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Select Emergency Unit</label>
              <select
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 focus:outline-none"
              >
                <option value="AMBULANCE-07">Ambulance Unit #07</option>
                <option value="FIRE-ENGINE-02">Fire Engine Battalion #02</option>
                <option value="POLICE-CRUISER-14">Police Tactical Cruiser #14</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Target Destination</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleDispatch}
            className="w-full py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Siren className="w-4 h-4" /> Trigger Emergency Green-Wave Route
          </button>
        </div>

        {/* Active Emergency Status Dashboard */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> ACTIVE EMERGENCY DISPATCH
            </h3>
            <span className={`text-xs font-bold px-2.5 py-1 rounded border ${emergencyActive ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-slate-800 text-slate-400'}`}>
              {emergencyActive ? 'UNIT EN ROUTE' : 'STANDBY'}
            </span>
          </div>

          {emergencyActive && routeInfo ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Unit Identifier</span>
                  <span className="text-sm font-black text-slate-100">{vehicle}</span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Optimized ETA</span>
                  <span className="text-sm font-black text-emerald-400">{routeInfo.estimated_time_minutes} mins</span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Route Distance</span>
                  <span className="text-sm font-black text-cyan-400">{routeInfo.distance_km} km</span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Route Risk Level</span>
                  <span className="text-sm font-black text-emerald-400">LOW (Cleared)</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-2 text-xs">
                <div className="flex items-center space-x-2 font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Traffic Signal Priority Preemption Active (Simulated)</span>
                </div>
                <p className="text-slate-300">
                  Green-wave signals recommended across Market Street & Mission Street multi-lane corridors. Bypasses 3 active congested intersections.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs italic">
              No active emergency dispatch currently in progress. Enter details on the left to initiate green-wave priority.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
