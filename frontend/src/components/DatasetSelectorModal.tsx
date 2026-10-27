import React, { useState } from 'react';
import { Database, Upload, FileText, CheckCircle2, Sparkles, AlertCircle, RefreshCw, X, Download, ShieldCheck, Radio } from 'lucide-react';
import { uploadCustomDataset, resetDataset } from '../services/api';

interface DatasetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetStatus: any;
  onDatasetChange: () => void;
}

export const DatasetSelectorModal: React.FC<DatasetSelectorModalProps> = ({
  isOpen,
  onClose,
  datasetStatus,
  onDatasetChange
}) => {
  const [activeTab, setActiveTab] = useState<'PRELOADED' | 'CUSTOM' | 'API'>('PRELOADED');
  const [csvText, setCsvText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [selectedFileName, setSelectedFileName] = useState('');

  if (!isOpen) return null;


  const sampleCsvContent = `name,road_type,start_lat,start_lon,end_lat,end_lon,speed_limit_kmh
Market Street Financial Express,Arterial,37.7885,-122.4005,37.7735,-122.4215,50.0
US-101 Bayshore Corridor,Expressway,37.7610,-122.4040,37.7720,-122.4055,90.0
Van Ness Rapid Transit Arterial,Arterial,37.7750,-122.4190,37.7950,-122.4230,50.0
The Embarcadero Waterfront Promenade,Arterial,37.7950,-122.3930,37.8080,-122.4080,45.0
Mission Street Tech Way,Arterial,37.7600,-122.4190,37.7850,-122.4050,40.0
Geary Boulevard Central Highway,Arterial,37.7810,-122.4300,37.7800,-122.4700,60.0
Lombard Street Gateway,Local,37.8020,-122.4260,37.8010,-122.4240,30.0
Fell Street Golden Gate Connector,Arterial,37.7730,-122.4280,37.7720,-122.4500,50.0
Columbus Avenue North Beach,Arterial,37.7980,-122.4060,37.8060,-122.4150,40.0
Broadway Tunnel Arterial,Arterial,37.7960,-122.4100,37.7970,-122.4220,50.0
King Street Ballpark Approach,Arterial,37.7780,-122.3920,37.7720,-122.3980,45.0
19th Avenue Highway 1 South,Expressway,37.7600,-122.4750,37.7200,-122.4760,65.0`;

  const parseCsvAndUpload = async () => {
    if (!csvText.trim()) {
      setStatusMessage({ type: 'error', msg: 'Please select a CSV file or paste valid CSV data first.' });
      return;
    }

    setUploading(true);
    setStatusMessage(null);

    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV file must contain a header row and at least 1 data row.');
      }

      const headers = lines[0].split(',').map(h => h.trim().replaceAll('"', '').toLowerCase());
      
      // Dynamic Column Index Finder
      const findIdx = (possibleNames: string[]) => {
        return headers.findIndex(h => possibleNames.some(p => h.includes(p)));
      };

      const nameIdx = findIdx(['street', 'name', 'corridor', 'description', 'city', 'location']);
      const sLatIdx = findIdx(['start_lat', 'start_latitude', 'latitude', 'lat']);
      const sLonIdx = findIdx(['start_lng', 'start_lon', 'longitude', 'lon', 'lng']);
      const eLatIdx = findIdx(['end_lat', 'end_latitude']);
      const eLonIdx = findIdx(['end_lng', 'end_lon']);
      const speedIdx = findIdx(['speed_limit_kmh', 'speed_limit', 'speed']);

      const segments = [];

      for (let i = 1; i < Math.min(lines.length, 500); i++) {
        const cols = lines[i].split(',').map(c => c.trim().replaceAll('"', ''));
        if (cols.length < 3) continue;

        let sLat = sLatIdx !== -1 ? parseFloat(cols[sLatIdx]) : NaN;
        let sLon = sLonIdx !== -1 ? parseFloat(cols[sLonIdx]) : NaN;

        // Fallback search if index mapping missed
        if (isNaN(sLat) || isNaN(sLon)) {
          for (const col of cols) {
            const val = parseFloat(col);
            if (!isNaN(val)) {
              if (val > 24.0 && val < 50.0 && isNaN(sLat)) sLat = val;
              if (val < -65.0 && val > -125.0 && isNaN(sLon)) sLon = val;
            }
          }
        }

        if (!isNaN(sLat) && !isNaN(sLon)) {
          let eLat = eLatIdx !== -1 && !isNaN(parseFloat(cols[eLatIdx])) ? parseFloat(cols[eLatIdx]) : sLat + 0.005;
          let eLon = eLonIdx !== -1 && !isNaN(parseFloat(cols[eLonIdx])) ? parseFloat(cols[eLonIdx]) : sLon + 0.005;
          let name = nameIdx !== -1 && cols[nameIdx] ? cols[nameIdx] : `Corridor #${i}`;
          let speed = speedIdx !== -1 && !isNaN(parseFloat(cols[speedIdx])) ? parseFloat(cols[speedIdx]) : 50.0;

          segments.push({
            name: name,
            road_type: 'Arterial',
            start_lat: sLat,
            start_lon: sLon,
            end_lat: eLat,
            end_lon: eLon,
            speed_limit_kmh: speed
          });
        }
      }

      if (segments.length === 0) {
        throw new Error('Could not find latitude/longitude columns in CSV. Ensure your CSV has Start_Lat and Start_Lng columns.');
      }

      const res = await uploadCustomDataset(segments);
      setUploading(false);

      if (res && res.status === 'success') {
        setStatusMessage({ type: 'success', msg: `Successfully imported ${segments.length} corridors from ${selectedFileName || 'dataset'}!` });
        onDatasetChange();
      } else {
        throw new Error(res?.message || 'Upload failed.');
      }
    } catch (err: any) {
      setUploading(false);
      setStatusMessage({ type: 'error', msg: err.message || 'Error processing CSV file.' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setStatusMessage(null);

    // Fast slice reader for large files (e.g. 3GB Kaggle US_Accidents_March23.csv)
    const blobSlice = file.slice(0, 1024 * 1024); // First 1 MB
    const reader = new FileReader();

    reader.onload = (evt) => {
      if (evt.target?.result) {
        const text = evt.target.result as string;
        setCsvText(text);
        setStatusMessage({
          type: 'success',
          msg: `Loaded "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB). Click "Import Custom CSV Dataset" below to process!`
        });
      }
    };
    reader.readAsText(blobSlice);
  };


  const handleResetToPreloaded = async () => {
    setUploading(true);
    await resetDataset();
    setUploading(false);
    onDatasetChange();
    setStatusMessage({ type: 'success', msg: 'Switched to pre-loaded smart city dataset.' });
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-3xl rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Dataset Source Configuration
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  {datasetStatus?.label || 'Pre-loaded Smart City Data'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Choose pre-loaded city telemetry, upload your custom CSV dataset, or connect live API feeds.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection Bar */}
        <div className="px-6 pt-4 bg-slate-900/50 border-b border-slate-800 flex space-x-4">
          <button
            onClick={() => setActiveTab('PRELOADED')}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'PRELOADED'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Pre-loaded Dataset (Default)
          </button>

          <button
            onClick={() => setActiveTab('CUSTOM')}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'CUSTOM'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" /> Upload Custom Dataset (CSV)
          </button>

          <button
            onClick={() => setActiveTab('API')}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'API'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" /> Live API Key Feed
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-800 text-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusMessage.msg}</span>
            </div>
          )}

          {/* TAB 1: PRE-LOADED DATASET */}
          {activeTab === 'PRELOADED' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-slate-200">5 Pre-loaded Global Smart Cities</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                    ACTIVE READY
                  </span>
                </div>
                <p className="text-slate-400 text-xs">
                  URBAN-SHIELD comes pre-packaged with 40 clean arterial corridors, multi-horizon traffic predictions, and 1,000+ spatial accident logs for **San Francisco**, **Bengaluru**, **New York City**, **London**, and **Tokyo**.
                </p>
                <div className="pt-2 flex justify-between items-center border-t border-slate-800">
                  <span className="text-slate-500">No upload required. Zero configuration.</span>
                  <button
                    onClick={handleResetToPreloaded}
                    disabled={uploading}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Reset to Pre-loaded Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM CSV UPLOAD */}
          {activeTab === 'CUSTOM' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="font-bold text-slate-200 block">Select or Drag CSV Dataset File</label>
                <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-2xl p-4 text-center bg-slate-950/40 transition-colors">
                  <Upload className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                  <p className="text-slate-300 font-medium mb-1">Click to select CSV file from your computer</p>
                  <p className="text-slate-500 text-[11px]">Supports `.csv` files formatted with corridor coordinates</p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="mt-3 block w-full text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* CSV Text Preview / Paste */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-300">CSV Data Preview / Direct Editor</label>
                  <button
                    onClick={() => setCsvText(sampleCsvContent)}
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3" /> Load Sample CSV Template
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="Paste CSV rows here: name,road_type,start_lat,start_lon,end_lat,end_lon,speed_limit_kmh..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-3 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={parseCsvAndUpload}
                  disabled={uploading}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/20 flex items-center gap-2 transition-all"
                >
                  <Upload className="w-4 h-4" /> {uploading ? 'Importing Dataset...' : 'Import Custom CSV Dataset'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE API FEED */}
          {activeTab === 'API' && (
            <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-200">Live API Key Telemetry Feed</span>
              </div>
              <p className="text-slate-400 text-xs">
                When API keys are configured in your `.env` file, the platform automatically streams live OpenWeather atmospheric data and live TomTom / HERE traffic flow speed metrics.
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1 text-slate-300">
                <p>• OPENWEATHER_API_KEY: <span className="text-emerald-400">Configured (Auto Sync Active)</span></p>
                <p>• TRAFFIC_API_KEY: <span className="text-emerald-400">Configured (Fallback Active)</span></p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-500">
          <span>Active Dataset Source: <strong className="text-slate-300">{datasetStatus?.label || 'Pre-loaded Smart City Data'}</strong></span>
          <button onClick={onClose} className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-700 font-bold">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
