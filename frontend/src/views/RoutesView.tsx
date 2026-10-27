import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation2, Clock, ShieldCheck, Leaf, Siren, ArrowRight,
  ArrowUpDown, Search, X, Loader2, MapPin, AlertCircle,
  CheckCircle2, Sparkles, AlertTriangle, Compass
} from 'lucide-react';
import {
  planRoute, fetchPlaceAutocomplete, fetchPlaceDetails,
  PlaceSuggestion
} from '../services/api';
import { TrafficMap } from '../components/MapContainer';

interface RoutesViewProps {
  activeCity?: string;
  segments?: any[];
  onRouteCalculated?: (path: number[][]) => void;
}

interface SelectedLocation {
  name: string;
  address: string;
  lat: number;
  lon: number;
  place_id?: string;
  source?: string;
}

const DEFAULT_CITY_PRESETS: Record<string, { origin: SelectedLocation; destination: SelectedLocation }> = {
  'San Francisco': {
    origin: {
      name: 'Market Street Central Arterial',
      address: 'Downtown Financial District, San Francisco',
      lat: 37.7885,
      lon: -122.4005,
      source: 'city_corridor',
    },
    destination: {
      name: 'Mission Street Commercial Way',
      address: 'Mission District, San Francisco',
      lat: 37.7600,
      lon: -122.4190,
      source: 'city_corridor',
    },
  },
  'Bengaluru': {
    origin: {
      name: 'Outer Ring Road (ORR Tech Belt)',
      address: 'Bellandur to Marathahalli, Bengaluru',
      lat: 12.9352,
      lon: 77.6947,
      source: 'city_corridor',
    },
    destination: {
      name: 'MG Road Central Boulevard',
      address: 'CBD Central Business District, Bengaluru',
      lat: 12.9756,
      lon: 77.6066,
      source: 'city_corridor',
    },
  },
  'New York City': {
    origin: {
      name: 'Broadway Manhattan Avenue',
      address: 'Times Square to City Hall, New York City',
      lat: 40.7580,
      lon: -73.9855,
      source: 'city_corridor',
    },
    destination: {
      name: 'FDR Drive Waterfront Highway',
      address: 'East River Waterfront, New York City',
      lat: 40.7100,
      lon: -73.9780,
      source: 'city_corridor',
    },
  },
  'London': {
    origin: {
      name: 'Piccadilly Circus Central Way',
      address: 'West End Theatre District, London',
      lat: 51.5100,
      lon: -0.1340,
      source: 'city_corridor',
    },
    destination: {
      name: 'Tower Bridge Approach Route',
      address: 'City of London to Southwark, London',
      lat: 51.5080,
      lon: -0.0760,
      source: 'city_corridor',
    },
  },
  'Tokyo': {
    origin: {
      name: 'Shibuya Crossing Main Arterial',
      address: 'Shibuya Station District, Tokyo',
      lat: 35.6595,
      lon: 139.7005,
      source: 'city_corridor',
    },
    destination: {
      name: 'Roppongi Dori Tech Corridor',
      address: 'Roppongi Hills to Akasaka, Tokyo',
      lat: 35.6628,
      lon: 139.7315,
      source: 'city_corridor',
    },
  },
};

export const RoutesView: React.FC<RoutesViewProps> = ({
  activeCity = 'San Francisco',
  segments = [],
  onRouteCalculated,
}) => {
  const [mode, setMode] = useState('Balanced');
  const [routeResult, setRouteResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Departure Location State
  const defaultPreset = DEFAULT_CITY_PRESETS[activeCity] || DEFAULT_CITY_PRESETS['San Francisco'];
  const [originText, setOriginText] = useState(defaultPreset.origin.name);
  const [originLocation, setOriginLocation] = useState<SelectedLocation | null>(defaultPreset.origin);
  const [originSuggestions, setOriginSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [originWarning, setOriginWarning] = useState<string | null>(null);
  const originAbortRef = useRef<AbortController | null>(null);

  // Destination Location State
  const [destText, setDestText] = useState(defaultPreset.destination.name);
  const [destLocation, setDestLocation] = useState<SelectedLocation | null>(defaultPreset.destination);
  const [destSuggestions, setDestSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearchingDest, setIsSearchingDest] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [destWarning, setDestWarning] = useState<string | null>(null);
  const destAbortRef = useRef<AbortController | null>(null);

  // Reset defaults when activeCity changes
  useEffect(() => {
    const preset = DEFAULT_CITY_PRESETS[activeCity] || DEFAULT_CITY_PRESETS['San Francisco'];
    setOriginText(preset.origin.name);
    setOriginLocation(preset.origin);
    setDestText(preset.destination.name);
    setDestLocation(preset.destination);
    setRouteResult(null);
    setGeneralError(null);
  }, [activeCity]);

  // Debounced search for Departure Location
  useEffect(() => {
    if (!originText.trim()) {
      setOriginSuggestions([]);
      setIsSearchingOrigin(false);
      return;
    }

    // If text matches current selected location name, don't trigger re-search
    if (originLocation && originLocation.name.toLowerCase() === originText.trim().toLowerCase()) {
      return;
    }

    if (originAbortRef.current) {
      originAbortRef.current.abort();
    }
    const controller = new AbortController();
    originAbortRef.current = controller;

    setIsSearchingOrigin(true);
    const handler = setTimeout(async () => {
      try {
        const res = await fetchPlaceAutocomplete(originText, activeCity, controller.signal);
        setOriginSuggestions(res.suggestions || []);
        setOriginWarning(res.warning || null);
        setShowOriginDropdown(true);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Origin autocomplete error:', err);
        }
      } finally {
        setIsSearchingOrigin(false);
      }
    }, 300);

    return () => {
      clearTimeout(handler);
      controller.abort();
    };
  }, [originText, activeCity]);

  // Debounced search for Destination Location
  useEffect(() => {
    if (!destText.trim()) {
      setDestSuggestions([]);
      setIsSearchingDest(false);
      return;
    }

    // If text matches current selected location name, don't trigger re-search
    if (destLocation && destLocation.name.toLowerCase() === destText.trim().toLowerCase()) {
      return;
    }

    if (destAbortRef.current) {
      destAbortRef.current.abort();
    }
    const controller = new AbortController();
    destAbortRef.current = controller;

    setIsSearchingDest(true);
    const handler = setTimeout(async () => {
      try {
        const res = await fetchPlaceAutocomplete(destText, activeCity, controller.signal);
        setDestSuggestions(res.suggestions || []);
        setDestWarning(res.warning || null);
        setShowDestDropdown(true);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Destination autocomplete error:', err);
        }
      } finally {
        setIsSearchingDest(false);
      }
    }, 300);

    return () => {
      clearTimeout(handler);
      controller.abort();
    };
  }, [destText, activeCity]);

  // Select suggestion for Departure
  const handleSelectOrigin = async (item: PlaceSuggestion) => {
    setShowOriginDropdown(false);
    setOriginText(item.name);
    setGeneralError(null);

    if (item.lat !== undefined && item.lon !== undefined) {
      setOriginLocation({
        name: item.name,
        address: item.address,
        lat: item.lat,
        lon: item.lon,
        place_id: item.place_id,
        source: item.source,
      });
      return;
    }

    // Fetch details to get coordinates
    try {
      setIsSearchingOrigin(true);
      const details = await fetchPlaceDetails(item.place_id);
      if (details.lat && details.lon) {
        setOriginLocation({
          name: details.name || item.name,
          address: details.address || item.address,
          lat: details.lat,
          lon: details.lon,
          place_id: item.place_id,
          source: details.source,
        });
      } else {
        setGeneralError(`Could not resolve coordinates for ${item.name}. Please select another location.`);
      }
    } catch (e: any) {
      setGeneralError('Failed to fetch place coordinates from backend.');
    } finally {
      setIsSearchingOrigin(false);
    }
  };

  // Select suggestion for Destination
  const handleSelectDest = async (item: PlaceSuggestion) => {
    setShowDestDropdown(false);
    setDestText(item.name);
    setGeneralError(null);

    if (item.lat !== undefined && item.lon !== undefined) {
      setDestLocation({
        name: item.name,
        address: item.address,
        lat: item.lat,
        lon: item.lon,
        place_id: item.place_id,
        source: item.source,
      });
      return;
    }

    // Fetch details to get coordinates
    try {
      setIsSearchingDest(true);
      const details = await fetchPlaceDetails(item.place_id);
      if (details.lat && details.lon) {
        setDestLocation({
          name: details.name || item.name,
          address: details.address || item.address,
          lat: details.lat,
          lon: details.lon,
          place_id: item.place_id,
          source: details.source,
        });
      } else {
        setGeneralError(`Could not resolve coordinates for ${item.name}. Please select another location.`);
      }
    } catch (e: any) {
      setGeneralError('Failed to fetch place coordinates from backend.');
    } finally {
      setIsSearchingDest(false);
    }
  };

  // Swap Departure and Destination
  const handleSwapLocations = () => {
    const tempText = originText;
    const tempLoc = originLocation;

    setOriginText(destText);
    setOriginLocation(destLocation);
    setDestText(tempText);
    setDestLocation(tempLoc);

    setShowOriginDropdown(false);
    setShowDestDropdown(false);
    setGeneralError(null);
  };

  // Calculate Route
  const handleCalculateRoute = async () => {
    setGeneralError(null);

    // Validation 1: Check presence
    if (!originText.trim()) {
      setGeneralError('Please enter a Departure / Start Location.');
      return;
    }
    if (!destText.trim()) {
      setGeneralError('Please enter a Destination / Arrival Location.');
      return;
    }

    // Validation 2: Ensure coordinates are resolved
    if (!originLocation?.lat || !originLocation?.lon) {
      setGeneralError('Please select a valid Departure location from the suggestions dropdown to verify coordinates.');
      return;
    }
    if (!destLocation?.lat || !destLocation?.lon) {
      setGeneralError('Please select a valid Destination location from the suggestions dropdown to verify coordinates.');
      return;
    }

    // Validation 3: Check distinct locations
    if (
      Math.abs(originLocation.lat - destLocation.lat) < 0.0001 &&
      Math.abs(originLocation.lon - destLocation.lon) < 0.0001
    ) {
      setGeneralError('Departure and Destination must be distinct locations.');
      return;
    }

    setLoading(true);
    try {
      const res = await planRoute(
        { lat: originLocation.lat, lon: originLocation.lon },
        { lat: destLocation.lat, lon: destLocation.lon },
        mode,
        activeCity,
        originLocation.name,
        destLocation.name
      );

      if (res?.error) {
        setGeneralError(res.error);
        setRouteResult(null);
      } else {
        setRouteResult(res);
        if (res?.active_route?.path_coordinates && onRouteCalculated) {
          onRouteCalculated(res.active_route.path_coordinates);
        }
      }
    } catch (err: any) {
      console.error('Route calculation error:', err);
      setGeneralError('Unable to calculate route. Check backend connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const options = routeResult?.all_options || {};
  const activeRoute = routeResult?.active_route;
  const isGoogleTraffic = activeRoute?.traffic_source === 'GOOGLE_ROUTES_API_TRAFFIC_AWARE' ||
                          activeRoute?.traffic_source === 'GOOGLE_DIRECTIONS_API';

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-800/50 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              Multi-Objective Routing Engine
            </span>
            <span className="text-xs font-semibold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
              {activeCity} GPS Network
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 mt-2">Smart Route Planning &amp; Optimization</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Calculates live multi-objective transit paths with telemetry. Avoids high-risk accident hotspots, high-congestion corridors, and optimizes time and safety.
          </p>
        </div>
      </div>

      {/* Main Grid: Left Controls & Comparison, Right Map Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Route Search, Mode Selection & Options */}
        <div className="lg:col-span-7 space-y-5">
          {/* Plan Route Input Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 relative">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>Route Origin &amp; Destination Search</span>
            </h2>

            {/* Error Banner */}
            {generalError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{generalError}</span>
              </div>
            )}

            {/* Departure / Start Location Input */}
            <div className="relative">
              <label
                htmlFor="departure-input"
                className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
                  Departure / Start Location
                </span>
                {originLocation && (
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                    GPS: {originLocation.lat.toFixed(4)}, {originLocation.lon.toFixed(4)}
                  </span>
                )}
              </label>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  id="departure-input"
                  type="text"
                  placeholder="Enter place, street, landmark, or address..."
                  value={originText}
                  onChange={(e) => {
                    setOriginText(e.target.value);
                    setOriginLocation(null);
                  }}
                  onFocus={() => {
                    if (originSuggestions.length > 0) setShowOriginDropdown(true);
                  }}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-9 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
                />
                {isSearchingOrigin ? (
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin absolute right-3 top-3" />
                ) : originText ? (
                  <button
                    type="button"
                    onClick={() => {
                      setOriginText('');
                      setOriginLocation(null);
                      setOriginSuggestions([]);
                    }}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 p-0.5"
                    aria-label="Clear departure input"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>

              {/* Origin Autocomplete Dropdown */}
              {showOriginDropdown && originText.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                  {originWarning && (
                    <div className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-[10px] text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                      <span>{originWarning}</span>
                    </div>
                  )}

                  {isSearchingOrigin ? (
                    <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>Searching locations...</span>
                    </div>
                  ) : originSuggestions.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">
                      No matching locations found for "{originText}".
                    </div>
                  ) : (
                    originSuggestions.map((item) => (
                      <button
                        key={item.place_id}
                        type="button"
                        onClick={() => handleSelectOrigin(item)}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-slate-800/90 border-b border-slate-800/60 last:border-0 transition-colors flex items-start gap-2.5"
                      >
                        <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-xs text-slate-100 truncate">{item.name}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                item.source === 'google'
                                  ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/40'
                                  : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/40'
                              }`}
                            >
                              {item.source === 'google' ? 'Google Places' : 'City Corridor'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.address}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Swap Button Divider */}
            <div className="flex items-center justify-center my-1 relative">
              <div className="h-px bg-slate-800 w-full absolute top-1/2"></div>
              <button
                type="button"
                id="swap-locations-btn"
                onClick={handleSwapLocations}
                className="relative z-10 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-cyan-400 rounded-full border border-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all"
                title="Swap Departure and Destination"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
                <span>Swap Locations</span>
              </button>
            </div>

            {/* Destination / Arrival Location Input */}
            <div className="relative">
              <label
                htmlFor="destination-input"
                className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-sm shadow-rose-400/50"></span>
                  Destination / Arrival Location
                </span>
                {destLocation && (
                  <span className="text-[10px] text-rose-400 font-mono bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/40">
                    GPS: {destLocation.lat.toFixed(4)}, {destLocation.lon.toFixed(4)}
                  </span>
                )}
              </label>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  id="destination-input"
                  type="text"
                  placeholder="Enter place, street, landmark, or address..."
                  value={destText}
                  onChange={(e) => {
                    setDestText(e.target.value);
                    setDestLocation(null);
                  }}
                  onFocus={() => {
                    if (destSuggestions.length > 0) setShowDestDropdown(true);
                  }}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-9 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
                />
                {isSearchingDest ? (
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin absolute right-3 top-3" />
                ) : destText ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDestText('');
                      setDestLocation(null);
                      setDestSuggestions([]);
                    }}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 p-0.5"
                    aria-label="Clear destination input"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>

              {/* Destination Autocomplete Dropdown */}
              {showDestDropdown && destText.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                  {destWarning && (
                    <div className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-[10px] text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                      <span>{destWarning}</span>
                    </div>
                  )}

                  {isSearchingDest ? (
                    <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>Searching locations...</span>
                    </div>
                  ) : destSuggestions.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">
                      No matching locations found for "{destText}".
                    </div>
                  ) : (
                    destSuggestions.map((item) => (
                      <button
                        key={item.place_id}
                        type="button"
                        onClick={() => handleSelectDest(item)}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-slate-800/90 border-b border-slate-800/60 last:border-0 transition-colors flex items-start gap-2.5"
                      >
                        <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-xs text-slate-100 truncate">{item.name}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                item.source === 'google'
                                  ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/40'
                                  : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/40'
                              }`}
                            >
                              {item.source === 'google' ? 'Google Places' : 'City Corridor'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.address}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Optimization Mode Selector */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Select Optimization Objective Mode
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'Fastest', label: 'Fastest', sub: 'Min Time', icon: Clock, color: 'text-amber-400' },
                  { id: 'Safest', label: 'Safest', sub: 'Min Risk', icon: ShieldCheck, color: 'text-emerald-400' },
                  { id: 'Balanced', label: 'Balanced', sub: 'Optimal', icon: Navigation2, color: 'text-cyan-400' },
                  { id: 'Eco', label: 'Eco Fuel', sub: 'Low CO₂', icon: Leaf, color: 'text-green-400' },
                  { id: 'Emergency', label: 'Emergency', sub: 'Priority', icon: Siren, color: 'text-rose-400' },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSel = mode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMode(m.id)}
                      className={`p-3 rounded-xl border text-left space-y-1 transition-all ${
                        isSel
                          ? 'bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-500/10'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${m.color}`} />
                      <div>
                        <span className="font-bold text-xs text-slate-100 block">{m.label}</span>
                        <span className="text-[9px] text-slate-400">{m.sub}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Plan Route Submission Button */}
            <button
              type="button"
              id="plan-route-btn"
              onClick={handleCalculateRoute}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Optimizing Multi-Objective Path...</span>
                </>
              ) : (
                <>
                  <span>Plan Optimal Route</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Traffic Telemetry Status Banner */}
          {routeResult && (
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isGoogleTraffic ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'
                  }`}
                ></span>
                <span className="font-bold text-slate-200">
                  {routeResult.traffic_status || 'Active Path Telemetry'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    isGoogleTraffic
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                      : 'bg-slate-900 text-cyan-300 border border-slate-800'
                  }`}
                >
                  {isGoogleTraffic ? 'Google Real-Time Traffic' : 'City GIS Telemetry'}
                </span>
              </div>

              {routeResult.provider_notice && (
                <div className="w-full mt-1 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>{routeResult.provider_notice}</span>
                </div>
              )}
            </div>
          )}

          {/* Side-by-Side Comparison of Candidate Options */}
          {routeResult && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Fastest */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Route A: Fastest Path
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{options.Fastest?.distance_km} km</span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-black text-slate-100">
                    {options.Fastest?.estimated_time_minutes} min
                  </span>
                  <span className="text-xs text-slate-400">estimated time</span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Safety Index:</span>
                    <span className="font-bold text-amber-400">{options.Fastest?.safety_score}/100</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Hotspots Encountered:</span>
                    <span className="font-bold text-rose-400">{options.Fastest?.hotspots_encountered}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Est. CO₂:</span>
                    <span className="font-medium text-slate-400">{options.Fastest?.co2_emissions_kg} kg</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 italic">{options.Fastest?.recommendation}</p>
              </div>

              {/* Option 2: Safest */}
              <div className="glass-panel p-5 rounded-2xl border border-cyan-500/60 bg-cyan-950/10 space-y-3 relative overflow-hidden">
                <span className="absolute top-2 right-2 text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/40">
                  RECOMMENDED
                </span>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Route B: Safest Path
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{options.Safest?.distance_km} km</span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-black text-slate-100">
                    {options.Safest?.estimated_time_minutes} min
                  </span>
                  <span className="text-xs text-slate-400">estimated time</span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Safety Index:</span>
                    <span className="font-bold text-emerald-400">{options.Safest?.safety_score}/100</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Hotspots Avoided:</span>
                    <span className="font-bold text-emerald-400">0 High-Risk Spots</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Est. CO₂:</span>
                    <span className="font-medium text-slate-400">{options.Safest?.co2_emissions_kg} kg</span>
                  </div>
                </div>
                <p className="text-xs text-emerald-300 font-medium">{options.Safest?.recommendation}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Route Visualization Map */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                Live Route GIS Visualization
              </h3>
              {activeRoute && (
                <span className="text-[11px] text-cyan-400 font-mono font-semibold">
                  {activeRoute.distance_km} km &bull; {activeRoute.estimated_time_minutes} min
                </span>
              )}
            </div>

            {/* Embedded Interactive Map */}
            <div className="w-full h-[520px] rounded-xl overflow-hidden relative border border-slate-800 shadow-xl">
              <TrafficMap
                segments={segments}
                activeCity={activeCity}
                activeRoutePath={activeRoute?.path_coordinates || []}
                activeLayers={{
                  traffic: true,
                  accidents: true,
                  hotspots: true,
                  incidents: true,
                  route: true,
                }}
              />
            </div>

            {/* Route Status Footnote */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Origin</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span>Destination</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-1 bg-cyan-400 rounded"></span>
                  <span>Optimal Path</span>
                </span>
              </div>
              <span className="text-[10px] text-slate-500">Auto-aligning GPS bounds</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoutesView;
