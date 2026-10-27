import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Filter, Search, Car, CloudRain, Zap, ChevronLeft, ChevronRight } from 'lucide-react';

interface AccidentsViewProps {
  accidents: any[];
}

export const AccidentsView: React.FC<AccidentsViewProps> = ({ accidents = [] }) => {
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const criticalCount = accidents.filter(a => a.severity === 'CRITICAL').length;
  const highCount = accidents.filter(a => a.severity === 'HIGH').length;
  const multiVehicleCount = accidents.filter(a => (a.vehicles_involved || 1) > 2).length;

  const filtered = accidents.filter(acc => {
    const matchesSev = selectedSeverity === 'ALL' || acc.severity === selectedSeverity;
    const matchesSearch = !searchTerm || 
      acc.weather_condition?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.lighting_condition?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(acc.contributing_factors) ? acc.contributing_factors.join(' ') : String(acc.contributing_factors || '')).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(acc.id).includes(searchTerm);
    return matchesSev && matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded border border-amber-800/50 uppercase tracking-wider">
            Risk Classification & Spatial Telemetry
          </span>
          <h1 className="text-2xl font-black text-slate-100 mt-2">Accident Intelligence System</h1>
          <p className="text-xs text-slate-400 mt-1">
            Historical incident telemetry with ML-driven severity grading and contributing risk factors.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-card px-4 py-2.5 rounded-xl border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Total Records</span>
            <span className="text-xl font-black text-amber-400">{accidents.length} Logged</span>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Total Logs</span>
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 mt-2">{accidents.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Telemetry archive</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-rose-950/40 bg-rose-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-300 font-semibold">Critical Collisions</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 mt-2">{criticalCount}</div>
          <div className="text-[10px] text-rose-500/80 mt-0.5">High-impact events</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-amber-950/40 bg-amber-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300 font-semibold">High Severity</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">{highCount}</div>
          <div className="text-[10px] text-amber-500/80 mt-0.5">Corridor risk spikes</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Multi-Vehicle (3+)</span>
            <Car className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">{multiVehicleCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Chain collisions</div>
        </div>
      </div>

      {/* Table & Filtering */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-200">Historical Accident Incident Log</h3>
            <span className="bg-slate-800 text-slate-300 text-[11px] font-bold px-2 py-0.5 rounded-full">
              {filtered.length} found
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search weather, factor..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-500 w-48"
              />
            </div>

            {/* Severity Filter Chips */}
            <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800">
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => { setSelectedSeverity(sev); setPage(1); }}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    selectedSeverity === sev
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Log ID</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Vehicles</th>
                <th className="p-3">Weather</th>
                <th className="p-3">Lighting</th>
                <th className="p-3">Contributing Factors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginated.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3 font-mono text-cyan-400 font-bold">#ACC-{String(acc.id).padStart(4, '0')}</td>
                  <td className="p-3 text-slate-400">{new Date(acc.timestamp).toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      acc.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                      acc.severity === 'HIGH' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      acc.severity === 'MEDIUM' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {acc.severity}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-slate-200">{acc.vehicles_involved} vehicles</td>
                  <td className="p-3 text-slate-300">{acc.weather_condition}</td>
                  <td className="p-3 text-slate-400">{acc.lighting_condition}</td>
                  <td className="p-3 font-mono text-[11px] text-amber-300">
                    {Array.isArray(acc.contributing_factors) ? acc.contributing_factors.join(', ') : 'Speeding'}
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No matching accident logs found for the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
          <span>
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} records
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-slate-200">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
