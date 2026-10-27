import React from 'react';
import { CloudRain, Sun, Wind, Eye, Droplet, AlertTriangle } from 'lucide-react';

interface WeatherViewProps {
  weatherData: any;
}

export const WeatherView: React.FC<WeatherViewProps> = ({ weatherData }) => {
  const w = weatherData || {
    temperature_c: 18.5,
    rainfall_mm: 2.4,
    humidity_pct: 72.0,
    visibility_m: 8500.0,
    wind_speed_kmh: 16.5,
    condition: "Light Rain / Overcast",
    impact_on_congestion_pct: 10.1,
    impact_on_risk_pct: 13.9
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-800/50 uppercase tracking-wider">
            Environmental Correlation Matrix
          </span>
          <h1 className="text-2xl font-black text-slate-100 mt-2">Weather Intelligence</h1>
          <p className="text-xs text-slate-400 mt-1">
            Dynamically modifying congestion prediction models, accident risk probabilities, and safety scores based on live precipitation & visibility sensors.
          </p>
        </div>
      </div>

      {/* Live Sensors Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>PRECIPITATION</span>
            <CloudRain className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl font-black text-slate-100">{w.rainfall_mm} mm/h</span>
          <p className="text-[11px] text-slate-400">{w.condition}</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>VISIBILITY</span>
            <Eye className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-black text-slate-100">{w.visibility_m} m</span>
          <p className="text-[11px] text-slate-400">Optimal Range</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>TEMPERATURE</span>
            <Sun className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-black text-slate-100">{w.temperature_c} °C</span>
          <p className="text-[11px] text-slate-400">Humidity: {w.humidity_pct}%</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>WIND VELOCITY</span>
            <Wind className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-2xl font-black text-slate-100">{w.wind_speed_kmh} km/h</span>
          <p className="text-[11px] text-slate-400">Crosswind Normal</p>
        </div>
      </div>

      {/* Impact Correlation Matrix Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-200">Weather-Induced Risk Impact Matrix</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
            <span className="text-xs text-slate-400 font-semibold block">Predicted Congestion Impact</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-amber-400">+{w.impact_on_congestion_pct}%</span>
              <span className="text-xs text-slate-400">density surge</span>
            </div>
            <p className="text-xs text-slate-400">
              Rainfall increases braking distance and causes drivers to reduce average speed by ~8 km/h.
            </p>
          </div>

          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
            <span className="text-xs text-slate-400 font-semibold block">Accident Risk Multiplier</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-rose-400">+{w.impact_on_risk_pct}%</span>
              <span className="text-xs text-slate-400">accident probability</span>
            </div>
            <p className="text-xs text-slate-400">
              Hydroplaning risk on arterial intersections triggers high-risk classifier alerts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
