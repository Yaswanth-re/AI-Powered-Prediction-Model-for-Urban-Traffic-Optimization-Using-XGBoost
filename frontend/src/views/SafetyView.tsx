import React, { useState } from 'react';
import { Activity, Info, ShieldCheck, HelpCircle, ChevronRight } from 'lucide-react';

interface SafetyViewProps {
  trafficData: any;
}

export const SafetyView: React.FC<SafetyViewProps> = ({ trafficData }) => {
  const [selectedSeg, setSelectedSeg] = useState<any>(null);
  const segments = trafficData?.segments || [];

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-800/50 uppercase tracking-wider">
            Transparent Safety Analytics
          </span>
          <h1 className="text-2xl font-black text-slate-100 mt-2">Road Safety Index (0 - 100)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Combining accident frequency, severity penalty, congestion density, weather exposure & intersection risk into an explainable score.
          </p>
        </div>
      </div>

      {/* Formula Explanation Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
          <Info className="w-4 h-4" /> Transparent Safety Score Formula
        </h3>
        <p className="text-xs text-slate-300 font-mono bg-slate-900/90 p-3 rounded-xl border border-slate-800">
          Safety Score = 100 - (Accident Penalty + Congestion Penalty + Weather Penalty + Intersection Penalty + Historical Penalty)
        </p>
        <div className="grid grid-cols-5 gap-2 text-[11px] pt-1">
          <div className="p-2 bg-emerald-950/40 rounded border border-emerald-800/40 text-center"><span className="font-bold text-emerald-400 block">80 - 100</span>Very Safe</div>
          <div className="p-2 bg-cyan-950/40 rounded border border-cyan-800/40 text-center"><span className="font-bold text-cyan-400 block">60 - 79</span>Safe</div>
          <div className="p-2 bg-amber-950/40 rounded border border-amber-800/40 text-center"><span className="font-bold text-amber-400 block">40 - 59</span>Moderate</div>
          <div className="p-2 bg-orange-950/40 rounded border border-orange-800/40 text-center"><span className="font-bold text-orange-400 block">20 - 39</span>Dangerous</div>
          <div className="p-2 bg-rose-950/40 rounded border border-rose-800/40 text-center"><span className="font-bold text-rose-400 block">0 - 19</span>Critical</div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-200">Corridor Safety Score Leaderboard</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Corridor Name</th>
                <th className="p-3">Road Type</th>
                <th className="p-3">Speed</th>
                <th className="p-3">Congestion</th>
                <th className="p-3">Safety Score</th>
                <th className="p-3">Rating</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {segments.map((seg: any) => {
                const score = seg.current_safety_score || 75;
                return (
                  <tr key={seg.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 font-bold text-slate-200">{seg.name}</td>
                    <td className="p-3 text-slate-400">{seg.road_type}</td>
                    <td className="p-3 text-emerald-400 font-semibold">{seg.current_speed_kmh} km/h</td>
                    <td className="p-3 text-amber-400 font-semibold">{seg.current_congestion_pct}%</td>
                    <td className="p-3">
                      <span className="text-base font-black text-cyan-400">{score}</span> /100
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        score >= 80 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        score >= 60 ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                        score >= 40 ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                        'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {score >= 80 ? 'Very Safe' : score >= 60 ? 'Safe' : score >= 40 ? 'Moderate' : 'Critical'}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => setSelectedSeg(seg)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                      >
                        Explain <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
