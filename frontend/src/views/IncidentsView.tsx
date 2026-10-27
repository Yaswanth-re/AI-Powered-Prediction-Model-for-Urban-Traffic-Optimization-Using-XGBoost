import React, { useState } from 'react';
import { AlertCircle, Plus, ThumbsUp, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { submitIncident } from '../services/api';

interface IncidentsViewProps {
  incidents: any[];
  onRefresh: () => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({ incidents, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState('Accident');
  const [description, setDescription] = useState('');
  const [roadName, setRoadName] = useState('Market Street');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;

    await submitIncident({
      category,
      description,
      lat: 37.7830 + (Math.random() - 0.5) * 0.02,
      lon: -122.4070 + (Math.random() - 0.5) * 0.02,
      road_name: roadName
    });

    setShowModal(false);
    setDescription('');
    onRefresh();
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-800/50 uppercase tracking-wider">
            Crowdsourced Intelligence
          </span>
          <h1 className="text-2xl font-black text-slate-100 mt-2">Real-Time Incident Reporting</h1>
          <p className="text-xs text-slate-400 mt-1">
            Community & sensor verified road hazards. Automatically updates live map risk levels and traffic prediction pipelines.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Report New Incident
        </button>
      </div>

      {/* Incident List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {incidents.map((inc: any) => (
          <div key={inc.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/50">
                  {inc.category}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  inc.confidence === 'VERIFIED' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-slate-800 text-slate-300'
                }`}>
                  {inc.confidence}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-200">{inc.road_name}</h3>
              <p className="text-xs text-slate-300">{inc.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-400">
              <div className="flex items-center space-x-1">
                <ThumbsUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>{inc.upvotes} Confirmations</span>
              </div>
              <span className="text-[10px]">{new Date(inc.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[3000] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-slate-700 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" /> Submit Incident Report
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 focus:outline-none"
                >
                  <option value="Accident">Accident / Collision</option>
                  <option value="Pothole">Pothole / Road Damage</option>
                  <option value="Traffic Jam">Severe Traffic Jam</option>
                  <option value="Signal Malfunction">Traffic Signal Malfunction</option>
                  <option value="Flooding">Flooding / Waterlogging</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Road / Corridor Name</label>
                <input
                  type="text"
                  value={roadName}
                  onChange={(e) => setRoadName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide brief details on lane blockages or hazards..."
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 h-24 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs"
              >
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
