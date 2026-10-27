import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Polygon, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface TrafficMapProps {
  segments?: any[];
  accidents?: any[];
  hotspots?: any[];
  incidents?: any[];
  activeRoutePath?: number[][];
  activeCity?: string;
  activeLayers?: {
    traffic: boolean;
    accidents: boolean;
    hotspots: boolean;
    incidents: boolean;
    route: boolean;
  };
  onSelectSegment?: (segment: any) => void;
}

const CITY_COORDS: Record<string, [number, number]> = {
  'San Francisco': [37.7749, -122.4194],
  'Bengaluru': [12.9716, 77.5946],
  'New York City': [40.7128, -74.0060],
  'London': [51.5074, -0.1278],
  'Tokyo': [35.6762, 139.6503]
};

// -------------------------------------------------------------------
// MapController: handles recenter + ResizeObserver-based invalidateSize
// This fixes the "blank map after tab switch" bug caused by Leaflet
// not knowing the container changed from 0px to a valid size.
// -------------------------------------------------------------------
const MapController: React.FC<{ center: [number, number]; routePath?: number[][] }> = ({ center, routePath }) => {
  const map = useMap();
  const containerRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    // Use ResizeObserver so Leaflet invalidates its size whenever
    // the container transitions from display:none back to visible.
    const container = map.getContainer();
    containerRef.current = container;

    const invalidate = () => {
      // Only invalidate if the container is actually visible (non-zero dimensions)
      if (container.offsetWidth > 0 && container.offsetHeight > 0) {
        map.invalidateSize({ animate: false });
      }
    };

    // Trigger once immediately in case we just became visible
    invalidate();

    observerRef.current = new ResizeObserver(invalidate);
    observerRef.current.observe(container);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [map]);

  // Recenter/fit bounds when route or center changes
  useEffect(() => {
    if (routePath && routePath.length > 1) {
      try {
        const bounds = L.latLngBounds(routePath as [number, number][]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } catch {
        map.setView(center, 13);
      }
    } else {
      map.setView(center, 13);
    }
  }, [center, routePath, map]);

  return null;
};

const getCongestionColor = (congPct: number) => {
  if (congPct > 75) return '#EF4444'; // Red (Severe)
  if (congPct > 55) return '#F97316'; // Orange (Heavy)
  if (congPct > 35) return '#F59E0B'; // Yellow (Moderate)
  return '#10B981'; // Green (Free Flow)
};

/** Return color and label for a hotspot risk score */
const getHotspotSeverity = (riskScore: number): { color: string; ring: string; label: string } => {
  if (riskScore >= 80) return { color: '#EF4444', ring: '#FCA5A5', label: 'CRITICAL' };
  if (riskScore >= 60) return { color: '#F97316', ring: '#FED7AA', label: 'HIGH' };
  if (riskScore >= 40) return { color: '#F59E0B', ring: '#FDE68A', label: 'MODERATE' };
  return { color: '#10B981', ring: '#6EE7B7', label: 'LOW' };
};

/** Validate that a coordinate is a finite number within plausible lat/lon bounds */
const isValidCoord = (lat: any, lon: any): boolean => {
  if (typeof lat !== 'number' || typeof lon !== 'number') return false;
  if (!isFinite(lat) || !isFinite(lon)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lon < -180 || lon > 180) return false;
  return true;
};

export const TrafficMap: React.FC<TrafficMapProps> = ({
  segments = [],
  accidents = [],
  hotspots = [],
  incidents = [],
  activeRoutePath = [],
  activeCity = 'San Francisco',
  activeLayers = { traffic: true, accidents: true, hotspots: true, incidents: true, route: true },
  onSelectSegment
}) => {
  const centerCoords = CITY_COORDS[activeCity] || CITY_COORDS['San Francisco'];

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      <MapContainer
        center={centerCoords}
        zoom={13}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', minHeight: '450px' }}
      >
        <MapController center={centerCoords} routePath={activeRoutePath} />

        {/* Clean dark GIS tiles — no API key required */}
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; GIS Intelligence'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
        />

        {/* ── 1. TRAFFIC ARTERIAL SEGMENTS ── */}
        {activeLayers.traffic &&
          segments.map((seg) => {
            const color = getCongestionColor(seg.current_congestion_pct);
            const path: [number, number][] = seg.path_coordinates || [[seg.start_lat, seg.start_lon], [seg.end_lat, seg.end_lon]];
            const endPt = path[path.length - 1];

            return (
              <React.Fragment key={`seg-frag-${seg.id}`}>
                <Polyline
                  positions={path}
                  pathOptions={{ color, weight: 5, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }}
                  eventHandlers={{ click: () => onSelectSegment && onSelectSegment(seg) }}
                >
                  <Popup>
                    <div className="p-1.5 space-y-1 font-sans text-xs">
                      <p className="font-bold text-slate-100 text-sm border-b border-slate-700 pb-1">{seg.name}</p>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Current Speed:</span>
                        <span className="font-bold text-emerald-400">{seg.current_speed_kmh} km/h</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Speed Limit:</span>
                        <span className="font-semibold text-slate-300">{seg.speed_limit_kmh} km/h</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Congestion:</span>
                        <span className="font-bold text-amber-400">{seg.current_congestion_pct}%</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Safety Index:</span>
                        <span className="font-bold text-cyan-400">{seg.current_safety_score}/100</span>
                      </div>
                    </div>
                  </Popup>
                </Polyline>
                {endPt && (
                  <CircleMarker
                    center={endPt}
                    radius={3}
                    pathOptions={{ color, fillColor: '#0B0F17', fillOpacity: 1, weight: 2 }}
                  />
                )}
              </React.Fragment>
            );
          })}

        {/* ── 2. ACCIDENT MARKERS ── */}
        {activeLayers.accidents &&
          accidents.filter(acc => isValidCoord(acc.lat, acc.lon)).map((acc) => (
            <CircleMarker
              key={`acc-${acc.id}`}
              center={[acc.lat, acc.lon]}
              radius={acc.severity === 'CRITICAL' ? 7 : 5}
              pathOptions={{
                color: acc.severity === 'CRITICAL' ? '#EF4444' : '#F59E0B',
                fillColor: acc.severity === 'CRITICAL' ? '#EF4444' : '#F59E0B',
                fillOpacity: 0.75,
                weight: 1.5
              }}
            >
              <Popup>
                <div className="p-1 text-xs space-y-1">
                  <p className="font-bold text-rose-400">Accident #{acc.id}</p>
                  <p>Severity: <span className="font-semibold text-white">{acc.severity}</span></p>
                  <p>Vehicles: {acc.vehicles_involved}</p>
                  <p>Weather: {acc.weather_condition}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

        {/* ── 3. DBSCAN HOTSPOTS — actual center_lat / center_lon ── */}
        {activeLayers.hotspots &&
          hotspots.filter(hs => isValidCoord(hs.center_lat, hs.center_lon)).map((hs) => {
            const sev = getHotspotSeverity(hs.risk_score || 0);
            const radiusPx = Math.max(10, Math.min(30, (hs.risk_score || 50) / 4));

            return (
              <React.Fragment key={`hs-${hs.id}`}>
                {/* Outer boundary polygon (dashed outline) */}
                {Array.isArray(hs.boundary_polygon) && hs.boundary_polygon.length >= 3 && (
                  <Polygon
                    positions={hs.boundary_polygon}
                    pathOptions={{
                      color: sev.color,
                      fillColor: sev.color,
                      fillOpacity: 0.08,
                      weight: 1.5,
                      dashArray: '5, 5'
                    }}
                  />
                )}

                {/* Outer glow ring at center */}
                <CircleMarker
                  center={[hs.center_lat, hs.center_lon]}
                  radius={radiusPx + 6}
                  pathOptions={{
                    color: sev.ring,
                    fillColor: sev.color,
                    fillOpacity: 0.12,
                    weight: 1,
                    dashArray: '3, 4'
                  }}
                />

                {/* Inner solid center dot */}
                <CircleMarker
                  center={[hs.center_lat, hs.center_lon]}
                  radius={radiusPx}
                  pathOptions={{
                    color: sev.color,
                    fillColor: sev.color,
                    fillOpacity: 0.70,
                    weight: 2.5
                  }}
                >
                  <Popup>
                    <div className="p-2 text-xs space-y-1.5 min-w-[200px]">
                      <div className="flex items-center gap-1.5 border-b border-slate-700 pb-1.5 mb-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ background: sev.color }}
                        />
                        <p className="font-bold text-rose-300 text-[13px]">{hs.name}</p>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Risk Score:</span>
                        <span className="font-black" style={{ color: sev.color }}>{hs.risk_score}/100 ({sev.label})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">30d Accidents:</span>
                        <span className="font-semibold text-amber-400">{hs.accident_count} incidents</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">High Severity:</span>
                        <span className="font-semibold text-rose-400">{hs.high_severity_count} severe</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Peak Window:</span>
                        <span className="font-semibold text-cyan-400">{hs.peak_risk_hours}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Radius:</span>
                        <span className="text-slate-300">{hs.radius_meters}m</span>
                      </div>
                      <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                        Coordinates: {Number(hs.center_lat).toFixed(5)}, {Number(hs.center_lon).toFixed(5)}
                      </div>
                      {hs.hotspot_type && (
                        <div className="text-[10px] text-amber-400 font-semibold uppercase tracking-wide">
                          {hs.hotspot_type === 'PREDICTED' ? '⚠ Model-Predicted Hotspot' :
                           hs.hotspot_type === 'USER_ADDED' ? '📍 User-Added Hotspot' :
                           '📊 DBSCAN-Detected Cluster'}
                        </div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              </React.Fragment>
            );
          })}

        {/* ── 4. INCIDENT MARKERS ── */}
        {activeLayers.incidents &&
          incidents.filter(inc => isValidCoord(inc.lat, inc.lon)).map((inc) => (
            <CircleMarker
              key={`inc-${inc.id}`}
              center={[inc.lat, inc.lon]}
              radius={5}
              pathOptions={{ color: '#3B82F6', fillColor: '#06B6D4', fillOpacity: 0.9, weight: 2 }}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <p className="font-bold text-cyan-400">Report: {inc.category}</p>
                  <p className="text-slate-300">{inc.description}</p>
                  <p className="text-slate-400 text-[10px]">Confidence: {inc.confidence}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

        {/* ── 5. ACTIVE ROUTE ── */}
        {activeLayers.route && activeRoutePath.length > 0 && (
          <>
            <Polyline
              positions={activeRoutePath as [number, number][]}
              pathOptions={{ color: '#06B6D4', weight: 6, opacity: 0.95, dashArray: '2, 6' }}
            />
            <CircleMarker
              center={activeRoutePath[0] as [number, number]}
              radius={7}
              pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.9, weight: 3 }}
            >
              <Popup><div className="p-1 text-xs font-bold text-emerald-400">Departure Point</div></Popup>
            </CircleMarker>
            <CircleMarker
              center={activeRoutePath[activeRoutePath.length - 1] as [number, number]}
              radius={7}
              pathOptions={{ color: '#F43F5E', fillColor: '#F43F5E', fillOpacity: 0.9, weight: 3 }}
            >
              <Popup><div className="p-1 text-xs font-bold text-rose-400">Arrival Destination</div></Popup>
            </CircleMarker>
          </>
        )}
      </MapContainer>

      {/* ── City Badge ── */}
      <div className="absolute top-4 left-4 z-[1000] glass-panel px-3 py-1.5 rounded-lg text-xs font-bold text-cyan-300 border border-slate-700/60 shadow-lg flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span>{activeCity} GPS Grid</span>
      </div>

      {/* ── Combined Legend ── */}
      <div className="absolute bottom-4 right-4 z-[1000] glass-panel px-3 py-2 rounded-lg text-xs space-y-1 text-slate-200 border border-slate-700/60 shadow-lg max-w-[180px]">
        <p className="font-bold text-slate-300 text-[11px] uppercase tracking-wider mb-1.5">Map Legend</p>
        <p className="font-semibold text-slate-400 text-[10px] mt-0.5 uppercase">Traffic Flow</p>
        <div className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-emerald-500" /><span>Free Flow (&lt;35%)</span></div>
        <div className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-amber-500" /><span>Moderate (35-55%)</span></div>
        <div className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-orange-500" /><span>Heavy (55-75%)</span></div>
        <div className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-rose-500" /><span>Severe (&gt;75%)</span></div>
        <p className="font-semibold text-slate-400 text-[10px] mt-1 uppercase">Hotspot Severity</p>
        <div className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-rose-500 border-2 border-rose-300" /><span>Critical (80+)</span></div>
        <div className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-orange-500 border-2 border-orange-300" /><span>High (60-79)</span></div>
        <div className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-amber-500 border-2 border-amber-300" /><span>Moderate (40-59)</span></div>
        <div className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-emerald-300" /><span>Low (&lt;40)</span></div>
      </div>
    </div>
  );
};
