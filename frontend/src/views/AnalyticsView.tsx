import React from 'react';
import { BarChart3, TrendingUp, Leaf, Clock, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsViewProps {
  analyticsSummary: any;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analyticsSummary }) => {
  const s = analyticsSummary || {};

  const hourlyCongestionData = [
    { hour: '06:00', congestion: 18 },
    { hour: '08:00', congestion: 78 },
    { hour: '10:00', congestion: 45 },
    { hour: '12:00', congestion: 38 },
    { hour: '14:00', congestion: 42 },
    { hour: '16:00', congestion: 65 },
    { hour: '18:00', congestion: 88 },
    { hour: '20:00', congestion: 52 },
    { hour: '22:00', congestion: 24 },
  ];

  const weekdayAccidentData = [
    { day: 'Mon', accidents: 42 },
    { day: 'Tue', accidents: 38 },
    { day: 'Wed', accidents: 45 },
    { day: 'Thu', accidents: 52 },
    { day: 'Fri', accidents: 68 },
    { day: 'Sat', accidents: 74 },
    { day: 'Sun', accidents: 61 },
  ];

  const severityPieData = [
    { name: 'Low', value: 50, color: '#10B981' },
    { name: 'Medium', value: 35, color: '#F59E0B' },
    { name: 'High', value: 12, color: '#F97316' },
    { name: 'Critical', value: 3, color: '#EF4444' },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-800/50 uppercase tracking-wider">
            Municipal Data Analytics
          </span>
          <h1 className="text-2xl font-black text-slate-100 mt-2">City Analytics & Environmental Impact</h1>
          <p className="text-xs text-slate-400 mt-1">
            Statistical analysis of congestion cycles, accident distribution, peak risk hours & estimated CO₂ emissions.
          </p>
        </div>
      </div>

      {/* Sustainability Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
            <Leaf className="w-4 h-4 text-emerald-400" /> CO₂ Emissions Estimated Today
          </span>
          <span className="text-3xl font-black text-slate-100">{s.co2_emissions_today_tonnes || 14.8} Tonnes</span>
          <p className="text-[11px] text-slate-400">Based on fuel burn idling in traffic.</p>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-cyan-400" /> Potential Route CO₂ Savings
          </span>
          <span className="text-3xl font-black text-emerald-400">{s.co2_savings_potential_tonnes || 3.2} Tonnes</span>
          <p className="text-[11px] text-slate-400">With 45% Eco-route adoption.</p>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400" /> Average City Travel Time
          </span>
          <span className="text-3xl font-black text-slate-100">{s.average_travel_time_min || 24.5} mins</span>
          <p className="text-[11px] text-slate-400">Corridor average across 120 segments.</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Hourly Congestion Trend */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200">24-Hour Diurnal Congestion Cycle (%)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyCongestionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="hour" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#121824', borderColor: '#334155', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="congestion" stroke="#06B6D4" strokeWidth={3} dot={{ fill: '#06B6D4' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Weekday Accident Distribution */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Accident Distribution by Weekday</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekdayAccidentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#121824', borderColor: '#334155', borderRadius: '8px' }} />
                <Bar dataKey="accidents" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
