import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { SegmentInspector } from './components/SegmentInspector';
import { LoginModal } from './components/LoginModal';
import { DatasetSelectorModal } from './components/DatasetSelectorModal';

import { DashboardView } from './views/DashboardView';
import { LiveTrafficView } from './views/LiveTrafficView';
import { PredictionsView } from './views/PredictionsView';
import { AccidentsView } from './views/AccidentsView';
import { HotspotsView } from './views/HotspotsView';
import { SafetyView } from './views/SafetyView';
import { RoutesView } from './views/RoutesView';
import { EmergencyView } from './views/EmergencyView';
import { IncidentsView } from './views/IncidentsView';
import { WeatherView } from './views/WeatherView';
import { AnalyticsView } from './views/AnalyticsView';
import { AIAssistantView } from './views/AIAssistantView';
import { CityCommandView } from './views/CityCommandView';
import { SimulationView } from './views/SimulationView';
import { ModelsView } from './views/ModelsView';

import {
  fetchLiveTraffic, fetchAccidents, fetchHotspots, fetchIncidents,
  fetchWeather, fetchAnalyticsSummary, fetchModels, fetchAlerts, fetchDatasetStatus,
  fetchWithTimeout
} from './services/api';

// Tabs that contain a Leaflet or Google Map — kept mounted to prevent
// the "blank map on return" bug caused by Leaflet losing its container
// dimensions when the component unmounts and remounts.
const MAP_TABS = new Set(['dashboard', 'live-traffic', 'city-command', 'hotspots']);

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRole, setUserRole] = useState('CITY_AUTHORITY');
  const [activeCity, setActiveCity] = useState('San Francisco');
  const [selectedSegment, setSelectedSegment] = useState<any>(null);

  // Dataset State
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const [datasetStatus, setDatasetStatus] = useState<any>({
    source: 'PRELOADED',
    label: 'Pre-loaded Smart City Data',
    custom_count: 0
  });

  // Auth State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Live Data State
  const [trafficData, setTrafficData] = useState<any>(null);
  const [accidents, setAccidents] = useState<any[]>([]);
  const [hotspotsData, setHotspotsData] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [analyticsSummary, setAnalyticsSummary] = useState<any>(null);
  const [models, setModels] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(true);
  const failureCountRef = useRef(0);

  const loadAllData = async () => {
    try {
      if (!localStorage.getItem('auth_token')) {
        try {
          const authRes = await fetchWithTimeout(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/login`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: 'authority@urbanshield.ai', password: 'authority123' }),
            },
            4000
          );
          if (authRes.ok) {
            const authData = await authRes.json();
            localStorage.setItem('auth_token', authData.access_token);
            if (!currentUser) {
              setCurrentUser(authData.user);
            }
          }
        } catch (e) {
          console.warn('Auto auth initialization skipped:', e);
        }
      }

      const [tData, accData, hsData, incData, wData, aSummary, mData, alData, dStatus] = await Promise.all([
        fetchLiveTraffic(activeCity),
        fetchAccidents(),
        fetchHotspots(activeCity),
        fetchIncidents(),
        fetchWeather(activeCity),
        fetchAnalyticsSummary(),
        fetchModels(),
        fetchAlerts(),
        fetchDatasetStatus()
      ]);

      if (tData || accData?.length || hsData) {
        failureCountRef.current = 0;
        setIsBackendOnline(true);
      } else {
        failureCountRef.current += 1;
        if (failureCountRef.current >= 2) {
          setIsBackendOnline(false);
        }
      }

      if (tData && !tData.detail) setTrafficData(tData);
      if (Array.isArray(accData)) setAccidents(accData);
      if (hsData && !hsData.detail) setHotspotsData(hsData);
      if (Array.isArray(incData)) setIncidents(incData);
      if (wData && !wData.detail) setWeatherData(wData);
      if (aSummary && !aSummary.detail) setAnalyticsSummary(aSummary);
      if (Array.isArray(mData)) setModels(mData);
      if (Array.isArray(alData)) setAlerts(alData);
      if (dStatus && !dStatus.detail) setDatasetStatus(dStatus);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      failureCountRef.current += 1;
      if (failureCountRef.current >= 2) {
        setIsBackendOnline(false);
      }
    }
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 15000);
    return () => clearInterval(interval);
  }, [activeCity]);

  const handleLoginSuccess = (user: any, token: string) => {
    localStorage.setItem('auth_token', token);
    setCurrentUser(user);
    setUserRole(user.role);
    setIsLoginModalOpen(false);
    loadAllData();
  };

  // Callback for HotspotsView to add a new hotspot locally and refresh
  const handleHotspotAdded = (newHotspot: any) => {
    setHotspotsData((prev: any) => {
      const existing = prev?.hotspots || [];
      // Prevent duplicates by id
      const deduped = existing.filter((h: any) => h.id !== newHotspot.id);
      return {
        ...(prev || {}),
        hotspots: [...deduped, newHotspot],
        total_hotspots: deduped.length + 1,
      };
    });
  };

  const hotspots = hotspotsData?.hotspots || [];

  // ---------------------------------------------------------------
  // PERSISTENT MAP PATTERN:
  //   Views that contain maps are rendered once and toggled via CSS
  //   display property so Leaflet / Google Maps never loses its DOM
  //   container. Non-map views are unmounted normally to save memory.
  // ---------------------------------------------------------------
  const persistedTabs = ['dashboard', 'live-traffic', 'city-command', 'hotspots'];

  const renderPersistentViews = () => (
    <>
      {/* Dashboard — keep mounted, show/hide */}
      <div style={{ display: activeTab === 'dashboard' ? 'flex' : 'none', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }}>
        <DashboardView
          userRole={userRole}
          trafficData={trafficData}
          accidents={accidents}
          hotspots={hotspots}
          incidents={incidents}
          models={models}
          activeCity={activeCity}
          onSelectSegment={(seg) => setSelectedSegment(seg)}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      </div>

      {/* Live Traffic — keep mounted */}
      <div style={{ display: activeTab === 'live-traffic' ? 'flex' : 'none', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }}>
        <LiveTrafficView
          trafficData={trafficData}
          accidents={accidents}
          hotspots={hotspots}
          incidents={incidents}
          activeCity={activeCity}
          onSelectSegment={(seg) => setSelectedSegment(seg)}
        />
      </div>

      {/* City Command — keep mounted */}
      <div style={{ display: activeTab === 'city-command' ? 'flex' : 'none', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }}>
        <CityCommandView
          trafficData={trafficData}
          accidents={accidents}
          hotspots={hotspots}
          incidents={incidents}
          onSelectSegment={(seg) => setSelectedSegment(seg)}
        />
      </div>

      {/* Hotspots — keep mounted (map + add panel) */}
      <div style={{ display: activeTab === 'hotspots' ? 'block' : 'none', width: '100%', height: '100%', overflow: 'auto' }}>
        <HotspotsView
          hotspotsData={hotspotsData}
          activeCity={activeCity}
          onHotspotAdded={handleHotspotAdded}
        />
      </div>
    </>
  );

  const renderActiveView = () => {
    // These views are conditionally rendered (no map inside)
    switch (activeTab) {
      case 'predictions':
        return <PredictionsView trafficData={trafficData} />;
      case 'accidents':
        return <AccidentsView accidents={accidents} />;
      case 'safety':
        return <SafetyView trafficData={trafficData} />;
      case 'routes':
        return (
          <RoutesView
            activeCity={activeCity}
            segments={trafficData?.segments || []}
          />
        );
      case 'emergency':
        return <EmergencyView />;
      case 'incidents':
        return <IncidentsView incidents={incidents} onRefresh={loadAllData} />;
      case 'weather':
        return <WeatherView weatherData={weatherData} />;
      case 'analytics':
        return <AnalyticsView analyticsSummary={analyticsSummary} />;
      case 'ai-assistant':
        return <AIAssistantView />;
      case 'simulation':
        return <SimulationView />;
      case 'models':
        return <ModelsView models={models} />;
      default:
        return null;
    }
  };

  const isPersistedTab = persistedTabs.includes(activeTab);

  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col font-sans text-slate-100 overflow-hidden">
      <Navbar
        currentRole={userRole}
        onRoleChange={(r) => setUserRole(r)}
        activeCity={activeCity}
        onCityChange={(c) => setActiveCity(c)}
        alerts={alerts}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={() => setCurrentUser(null)}
        datasetLabel={datasetStatus?.label || 'Pre-loaded Smart City Data'}
        onOpenDatasetModal={() => setIsDatasetModalOpen(true)}
      />

      {!isBackendOnline && (
        <div className="bg-amber-950/70 border-b border-amber-500/30 px-4 py-1.5 text-center text-xs text-amber-300 font-medium flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>FastAPI backend unreachable at http://localhost:8000. Telemetry and route optimizer operating in resilient offline fallback mode.</span>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={(t) => setActiveTab(t)}
          userRole={userRole}
        />

        <main className="flex-1 overflow-hidden relative">
          {/* Always-mounted map views (toggled via CSS display) */}
          {renderPersistentViews()}

          {/* Conditionally rendered non-map views */}
          {!isPersistedTab && (
            <div className="absolute inset-0 overflow-auto">
              {renderActiveView()}
            </div>
          )}
        </main>
      </div>

      {/* Segment Inspector Drawer */}
      {selectedSegment && (
        <SegmentInspector
          segment={selectedSegment}
          onClose={() => setSelectedSegment(null)}
        />
      )}

      {/* Dataset Source Configuration Modal */}
      <DatasetSelectorModal
        isOpen={isDatasetModalOpen}
        onClose={() => setIsDatasetModalOpen(false)}
        datasetStatus={datasetStatus}
        onDatasetChange={loadAllData}
      />

      {/* Unified Single Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onLoginSuccess={handleLoginSuccess}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}

export default App;
