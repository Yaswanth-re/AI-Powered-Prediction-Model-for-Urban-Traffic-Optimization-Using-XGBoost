import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, LoadScript, TrafficLayer, Circle } from '@react-google-maps/api';
import { GoogleMapsKeyModal } from './GoogleMapsKeyModal';
import { TrafficMap } from './MapContainer';
import { KeyRound, MapPin, RefreshCw, Sparkles } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '450px',
  borderRadius: '0.75rem',
  overflow: 'hidden',
};

const defaultCenter = { lat: 37.7749, lng: -122.4194 };
const libraries: ("visualization" | "places")[] = ['visualization', 'places'];

interface GoogleLiveTrafficMapProps {
  activeCity?: string;
  segments?: any[];
  accidents?: any[];
  hotspots?: any[];
  incidents?: any[];
  activeRoutePath?: number[][];
  activeLayers?: {
    traffic: boolean;
    accidents: boolean;
    hotspots: boolean;
    incidents: boolean;
    route: boolean;
  };
  onSelectSegment?: (segment: any) => void;
}

export const GoogleLiveTrafficMap: React.FC<GoogleLiveTrafficMapProps> = ({
  activeCity = 'San Francisco',
  segments = [],
  accidents = [],
  hotspots = [],
  incidents = [],
  activeRoutePath = [],
  activeLayers = { traffic: true, accidents: true, hotspots: true, incidents: true, route: true },
  onSelectSegment,
}) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [center, setCenter] = useState(defaultCenter);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  // Always default to Vector GIS for reliable, zero-error telemetry rendering
  const [mapEngine, setMapEngine] = useState<'vector' | 'google'>('vector');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load key from localStorage or env
  useEffect(() => {
    // Clear any legacy mode forcing Google mode on startup
    localStorage.removeItem('urban_shield_map_mode');
    const envKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';
    const stored = localStorage.getItem('google_maps_api_key') || '';
    const key = (stored || envKey || '').trim();
    // Ignore placeholder dummy keys
    if (key && !key.startsWith('YOUR_') && key !== 'AIzaSyAMlkSSwnUl-xURCm-RFzXBS85spFrg61U') {
      setApiKey(key);
    } else {
      setApiKey('');
    }
  }, []);

  // Map center by city
  useEffect(() => {
    const cityMap: Record<string, { lat: number; lng: number }> = {
      'San Francisco': { lat: 37.7749, lng: -122.4194 },
      Bengaluru: { lat: 12.9716, lng: 77.5946 },
      'New York City': { lat: 40.7128, lng: -74.006 },
      London: { lat: 51.5074, lng: -0.1278 },
      Tokyo: { lat: 35.6762, lng: 139.6503 },
    };
    if (activeCity && cityMap[activeCity]) setCenter(cityMap[activeCity]);
    else setCenter(defaultCenter);
  }, [activeCity]);

  // Handle Google Maps script failure and timeout
  useEffect(() => {
    const origAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      console.warn('Google Maps Authentication Failed: reverting to Vector GIS.');
      setMapEngine('vector');
      if (origAuthFailure) origAuthFailure();
    };

    if (mapEngine === 'google') {
      if (timerRef.current) clearTimeout(timerRef.current);
      // Timeout: if Google Maps does not load within 3s, switch cleanly to Vector GIS without showing errors
      timerRef.current = setTimeout(() => {
        if (!mapLoaded) {
          console.warn('Google Maps script loading timed out. Switched to Vector GIS.');
          setMapEngine('vector');
        }
      }, 3000);
    }

    return () => {
      (window as any).gm_authFailure = origAuthFailure;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [mapEngine, mapLoaded]);

  const handleKeySaved = (key: string) => {
    const trimmed = key.trim();
    setApiKey(trimmed);
    localStorage.setItem('google_maps_api_key', trimmed);
    setShowModal(false);
    if (trimmed) {
      setMapLoaded(false);
      setMapEngine('google');
    }
  };

  const switchToGoogle = () => {
    if (!apiKey) {
      setShowModal(true);
      return;
    }
    setMapLoaded(false);
    setMapEngine('google');
  };

  const switchToVector = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMapEngine('vector');
  };

  // ── 1. VECTOR GIS MODE (Clean, fast, reliable, zero billing error) ──
  if (mapEngine === 'vector' || !apiKey) {
    return (
      <div className="relative w-full h-full flex flex-col">
        {/* Top Floating Controls */}
        <div className="absolute top-3 right-3 z-[1000] flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-slate-900/95 p-1 rounded-xl border border-slate-700/80 shadow-2xl backdrop-blur-md">
            <button
              onClick={switchToVector}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 flex items-center space-x-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
              <span>Vector GIS</span>
            </button>
            <button
              onClick={switchToGoogle}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors flex items-center space-x-1"
              title="Switch to Google Maps Live Traffic"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Google Traffic</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
              title="Configure Google Maps API Key"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* High-Performance GIS Vector Map */}
        <TrafficMap
          segments={segments}
          accidents={accidents}
          hotspots={hotspots}
          incidents={incidents}
          activeRoutePath={activeRoutePath}
          activeCity={activeCity}
          activeLayers={activeLayers}
          onSelectSegment={onSelectSegment}
        />

        {showModal && (
          <GoogleMapsKeyModal
            isOpen={true}
            onClose={() => setShowModal(false)}
            onKeySaved={handleKeySaved}
          />
        )}
      </div>
    );
  }

  // ── 2. GOOGLE MAPS MODE ──
  return (
    <div className="relative w-full h-full">
      {/* Top Floating Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center space-x-2">
        <div className="flex items-center space-x-1 bg-slate-900/95 p-1 rounded-xl border border-slate-700/80 shadow-2xl backdrop-blur-md">
          <button
            onClick={switchToVector}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors flex items-center space-x-1"
          >
            <MapPin className="w-3 h-3 text-emerald-400" />
            <span>Vector GIS</span>
          </button>
          <button
            onClick={switchToGoogle}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 flex items-center space-x-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-pulse"></span>
            <span>Google Traffic</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
            title="Configure Google Maps API Key"
          >
            <KeyRound className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <LoadScript
        googleMapsApiKey={apiKey}
        libraries={libraries}
        onError={(err) => {
          console.warn('Google Maps LoadScript error, falling back to Vector GIS:', err);
          setMapEngine('vector');
        }}
        loadingElement={
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 min-h-[450px]">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-300">Connecting to Google Maps Live Traffic...</p>
            <p className="text-xs text-slate-500 mt-1">Applying TrafficLayer telemetry for {activeCity}</p>
            <button
              onClick={switchToVector}
              className="mt-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-cyan-400 rounded-lg transition-colors"
            >
              Return to Vector GIS Mode
            </button>
          </div>
        }
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={13}
          onLoad={() => setMapLoaded(true)}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            styles: [
              { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
              { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
              { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
              {
                featureType: 'administrative.locality',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#d59563' }],
              },
              {
                featureType: 'poi',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#d59563' }],
              },
              {
                featureType: 'poi.park',
                elementType: 'geometry',
                stylers: [{ color: '#263c3f' }],
              },
              {
                featureType: 'road',
                elementType: 'geometry',
                stylers: [{ color: '#38414e' }],
              },
              {
                featureType: 'road',
                elementType: 'geometry.stroke',
                stylers: [{ color: '#212a37' }],
              },
              {
                featureType: 'road',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#9ca5b3' }],
              },
              {
                featureType: 'road.highway',
                elementType: 'geometry',
                stylers: [{ color: '#746855' }],
              },
              {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#17263c' }],
              },
            ],
          }}
        >
          {activeLayers.traffic && <TrafficLayer />}
          {activeLayers.hotspots &&
            hotspots
              .filter((hs) => typeof hs.center_lat === 'number' && typeof hs.center_lon === 'number')
              .map((hs, i) => {
                const risk = hs.risk_score || 75;
                const color = risk >= 80 ? '#EF4444' : risk >= 60 ? '#F97316' : '#EAB308';
                return (
                  <Circle
                    key={`gm-hs-${hs.id || i}`}
                    center={{ lat: hs.center_lat, lng: hs.center_lon }}
                    radius={hs.radius_meters || 300}
                    options={{
                      fillColor: color,
                      fillOpacity: 0.35,
                      strokeColor: color,
                      strokeWeight: 2,
                      strokeOpacity: 0.85,
                    }}
                  />
                );
              })}
        </GoogleMap>
      </LoadScript>

      {showModal && (
        <GoogleMapsKeyModal
          isOpen={true}
          onClose={() => setShowModal(false)}
          onKeySaved={handleKeySaved}
        />
      )}
    </div>
  );
};
