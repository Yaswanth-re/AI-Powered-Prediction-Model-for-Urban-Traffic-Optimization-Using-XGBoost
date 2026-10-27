import React, { useState, useEffect } from 'react';
import {
  Target,
  AlertCircle,
  Clock,
  Search,
  PlusCircle,
  MapPin,
  CheckCircle2,
  Sliders,
  ShieldAlert,
  Loader2,
  Navigation,
  Flame,
  Layers,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { TrafficMap } from '../components/MapContainer';
import { createHotspot } from '../services/api';

const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'San Francisco': { lat: 37.7749, lon: -122.4194 },
  'New York City': { lat: 40.7128, lon: -74.006 },
  'New York': { lat: 40.7128, lon: -74.006 },
  'Bengaluru': { lat: 12.9716, lon: 77.5946 },
  'London': { lat: 51.5074, lon: -0.1278 },
  'Tokyo': { lat: 35.6762, lon: 139.6503 },
  'Paris': { lat: 48.8566, lon: 2.3522 },
};

interface HotspotsViewProps {
  hotspotsData: any;
  activeCity?: string;
  onHotspotAdded?: (hotspot: any) => void;
}

export const HotspotsView: React.FC<HotspotsViewProps> = ({
  hotspotsData,
  activeCity = 'San Francisco',
  onHotspotAdded,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'USER_ADDED'>('ALL');
  const [search, setSearch] = useState('');

  // Form state
  const defaultCoord = CITY_COORDINATES[activeCity] || CITY_COORDINATES['San Francisco'];
  const [formName, setFormName] = useState('');
  const [formLat, setFormLat] = useState<string>(defaultCoord.lat.toFixed(4));
  const [formLon, setFormLon] = useState<string>(defaultCoord.lon.toFixed(4));
  const [formRadius, setFormRadius] = useState<number>(300);
  const [formRisk, setFormRisk] = useState<number>(85);
  const [formRoad, setFormRoad] = useState('');
  const [formPeakHours, setFormPeakHours] = useState('17:00 - 20:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Update form lat/lon if activeCity changes and form has not been touched much
  useEffect(() => {
    const c = CITY_COORDINATES[activeCity];
    if (c) {
      setFormLat(c.lat.toFixed(4));
      setFormLon(c.lon.toFixed(4));
    }
  }, [activeCity]);

  const hotspots: any[] = hotspotsData?.hotspots || [];

  const handleFillCityCenter = () => {
    const c = CITY_COORDINATES[activeCity] || CITY_COORDINATES['San Francisco'];
    // Add tiny random jitter so multiple additions don't sit exactly on top of each other
    const jitterLat = (Math.random() - 0.5) * 0.015;
    const jitterLon = (Math.random() - 0.5) * 0.015;
    setFormLat((c.lat + jitterLat).toFixed(4));
    setFormLon((c.lon + jitterLon).toFixed(4));
  };

  const handleCreateHotspot = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const lat = parseFloat(formLat);
    const lon = parseFloat(formLon);

    if (!formName.trim()) {
      setFormError('Please enter a descriptive hotspot name.');
      return;
    }
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setFormError('Latitude must be a valid number between -90 and 90.');
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      setFormError('Longitude must be a valid number between -180 and 180.');
      return;
    }
    if (!formRoad.trim()) {
      setFormError('Please enter the primary road or corridor name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createHotspot({
        name: formName.trim(),
        center_lat: lat,
        center_lon: lon,
        radius_meters: formRadius,
        risk_score: formRisk,
        primary_road_name: formRoad.trim(),
        peak_risk_hours: formPeakHours.trim() || '17:00 - 20:00',
      });

      if (res.error) {
        setFormError(res.error);
      } else {
        setFormSuccess(`Hotspot "${res.name}" registered and rendered on map.`);
        if (onHotspotAdded) {
          onHotspotAdded(res);
        }
        // Reset form inputs except city center
        setFormName('');
        setFormRoad('');
        setFormRisk(80);
        setFormRadius(300);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to register hotspot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = hotspots.filter((h) => {
    const risk = h.risk_score || 0;
    const isUserAdded = h.hotspot_type === 'USER_ADDED';
    const matchesFilter =
      filter === 'ALL' ||
      (filter === 'CRITICAL' && risk >= 80) ||
      (filter === 'HIGH' && risk >= 60 && risk < 80) ||
      (filter === 'USER_ADDED' && isUserAdded);
    const matchesSearch =
      !search ||
      h.name?.toLowerCase().includes(search.toLowerCase()) ||
      h.primary_road_name?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const criticalCount = hotspots.filter((h) => (h.risk_score || 0) >= 80).length;
  const highRiskCount = hotspots.filter((h) => (h.risk_score || 0) >= 60 && (h.risk_score || 0) < 80).length;
  const userAddedCount = hotspots.filter((h) => h.hotspot_type === 'USER_ADDED').length;

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded border border-rose-800/50 uppercase tracking-wider">
              Spatial Intelligence
            </span>
            <span className="text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-800/50">
              {activeCity}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 mt-2">DBSCAN Hotspot Detection & Zone Registry</h1>
          <p className="text-xs text-slate-400 mt-1">
            Visualizing spatial point density accident clusters with center coordinates, boundary polygons, and dynamic operator additions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-card px-4 py-2.5 rounded-xl border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Active Hotspots</span>
            <span className="text-xl font-black text-rose-400">{hotspots.length} Clusters</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Add Hotspot Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Map Display */}
        <div className="lg:col-span-7 glass-panel rounded-2xl border border-slate-800 p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span className="text-sm font-bold text-slate-200">Geographic Hotspot Visualizer</span>
              <span className="text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {hotspots.length} on map
              </span>
            </div>
            <div className="flex items-center space-x-3 text-[11px] text-slate-400">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                <span>Critical (80+)</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span>High (60-79)</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
                <span>User Added</span>
              </span>
            </div>
          </div>

          {/* Leaflet Map Container */}
          <div className="w-full h-[440px] rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950 relative">
            <TrafficMap
              hotspots={hotspots}
              activeCity={activeCity}
              activeLayers={{
                traffic: false,
                accidents: false,
                hotspots: true,
                incidents: false,
                route: false,
              }}
            />
          </div>
        </div>

        {/* Add Hotspot Form */}
        <div className="lg:col-span-5 glass-panel rounded-2xl border border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100">Register New Hotspot Zone</h3>
              </div>
              <button
                type="button"
                onClick={handleFillCityCenter}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-800/50 px-2 py-1 rounded transition-colors flex items-center space-x-1"
                title="Populate coordinates near current active city center"
              >
                <Navigation className="w-3 h-3" />
                <span>Fill Near {activeCity}</span>
              </button>
            </div>

            {formError && (
              <div className="mb-3 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mb-3 p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateHotspot} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Hotspot Zone Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., 4th & King High Crash Corridor"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Latitude (-90 to 90) *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="37.7749"
                    value={formLat}
                    onChange={(e) => setFormLat(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Longitude (-180 to 180) *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="-122.4194"
                    value={formLon}
                    onChange={(e) => setFormLon(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Primary Road / Intersection *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Market St & 5th Ave"
                  value={formRoad}
                  onChange={(e) => setFormRoad(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold text-slate-300">
                      Radius: <span className="text-cyan-400">{formRadius}m</span>
                    </label>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="1500"
                    step="50"
                    value={formRadius}
                    onChange={(e) => setFormRadius(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold text-slate-300">
                      Risk Score: <span className={formRisk >= 80 ? 'text-rose-400' : 'text-amber-400'}>{formRisk}/100</span>
                    </label>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="1"
                    value={formRisk}
                    onChange={(e) => setFormRisk(Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Peak Risk Hours Window
                </label>
                <input
                  type="text"
                  placeholder="e.g., 07:30 - 10:00 / 17:00 - 20:00"
                  value={formPeakHours}
                  onChange={(e) => setFormPeakHours(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-rose-600 hover:from-cyan-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Persisting Hotspot to Database...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Save Hotspot & Update Map</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Total Clusters</span>
            <Target className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 mt-2">{hotspots.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Spatial DBSCAN (Eps=350m)</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-rose-950/40 bg-rose-950/10">
          <div className="flex justify-between items-center text-xs text-rose-300">
            <span>Critical Severity (80+)</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 mt-2">{criticalCount}</div>
          <div className="text-[10px] text-rose-500/80 mt-0.5">Urgent municipal priority</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-amber-950/40 bg-amber-950/10">
          <div className="flex justify-between items-center text-xs text-amber-300">
            <span>High Severity (60-79)</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">{highRiskCount}</div>
          <div className="text-[10px] text-amber-500/80 mt-0.5">Cautionary corridors</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-cyan-950/40 bg-cyan-950/10">
          <div className="flex justify-between items-center text-xs text-cyan-300">
            <span>User Defined Hotspots</span>
            <PlusCircle className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400 mt-2">{userAddedCount}</div>
          <div className="text-[10px] text-cyan-500/80 mt-0.5">Manually registered & synced</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {(['ALL', 'CRITICAL', 'HIGH', 'USER_ADDED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                filter === f
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {f === 'ALL'
                ? `All (${hotspots.length})`
                : f === 'CRITICAL'
                ? `Critical (${criticalCount})`
                : f === 'HIGH'
                ? `High (${highRiskCount})`
                : `User Added (${userAddedCount})`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by name or corridor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* Hotspots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((hs: any, idx: number) => {
          const risk = hs.risk_score || 0;
          const isUser = hs.hotspot_type === 'USER_ADDED';
          return (
            <div
              key={hs.id || idx}
              className={`glass-panel p-5 rounded-2xl border transition-all hover:border-slate-700 space-y-4 ${
                isUser ? 'border-cyan-500/40 bg-cyan-950/5' : 'border-slate-800'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        risk >= 80
                          ? 'text-rose-400 bg-rose-950/60 border-rose-800/50'
                          : 'text-amber-400 bg-amber-950/60 border-amber-800/50'
                      }`}
                    >
                      HOTSPOT #{String(hs.id || idx + 1).padStart(2, '0')}
                    </span>
                    {isUser && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                        USER ADDED
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-100 mt-1">{hs.name}</h3>
                  {hs.primary_road_name && (
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Corridor: {hs.primary_road_name}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className={`text-xl font-black ${risk >= 80 ? 'text-rose-400' : 'text-amber-400'}`}>
                    {risk}
                  </span>
                  <span className="text-[10px] text-slate-400 block">/100 Risk</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${risk >= 80 ? 'bg-rose-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(100, risk)}%` }}
                ></div>
              </div>

              {/* Coordinates display */}
              <div className="text-[11px] bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800/80 flex items-center justify-between text-slate-300 font-mono">
                <span className="text-slate-400 font-sans">Center:</span>
                <span>
                  {typeof hs.center_lat === 'number' ? hs.center_lat.toFixed(4) : 'N/A'},{' '}
                  {typeof hs.center_lon === 'number' ? hs.center_lon.toFixed(4) : 'N/A'}
                </span>
                {hs.radius_meters && (
                  <span className="text-cyan-400">r={hs.radius_meters}m</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block font-semibold">Incident Count</span>
                  <span className="text-sm font-bold text-amber-400">{hs.accident_count ?? 12} Incidents</span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block font-semibold">High Severity</span>
                  <span className="text-sm font-bold text-rose-400">{hs.high_severity_count ?? 4} Severe</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-900/40 p-2 rounded-lg border border-slate-800">
                <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  Peak Hours: <strong className="text-cyan-300">{hs.peak_risk_hours || '17:00 - 20:00'}</strong>
                </span>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full p-12 text-center glass-panel rounded-2xl border border-slate-800 text-slate-400">
            <Target className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-300">No hotspot clusters found for current selection.</p>
            <p className="text-xs text-slate-500 mt-1">Try switching filters or register a new hotspot using the form above.</p>
          </div>
        )}
      </div>
    </div>
  );
};
