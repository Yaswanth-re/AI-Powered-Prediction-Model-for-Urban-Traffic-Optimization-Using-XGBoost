import React from 'react';
import {
  LayoutDashboard, Navigation, LineChart, ShieldAlert, Target,
  Activity, Navigation2, Siren, AlertCircle, CloudRain, BarChart3,
  Bot, Building2, Sliders, Cpu, Settings
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, userRole }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, roleAccess: ['ALL'] },
    { id: 'live-traffic', label: 'Live Traffic GIS', icon: Navigation, roleAccess: ['ALL'] },
    { id: 'predictions', label: 'AI Traffic Forecast', icon: LineChart, roleAccess: ['ALL'] },
    { id: 'accidents', label: 'Accident Intelligence', icon: ShieldAlert, roleAccess: ['ALL'] },
    { id: 'hotspots', label: 'DBSCAN Hotspots', icon: Target, roleAccess: ['ALL'] },
    { id: 'safety', label: 'Road Safety Index', icon: Activity, roleAccess: ['ALL'] },
    { id: 'routes', label: 'Smart Routing Engine', icon: Navigation2, roleAccess: ['ALL'] },
    { id: 'emergency', label: 'Emergency Priority', icon: Siren, roleAccess: ['EMERGENCY_RESPONDER', 'CITY_AUTHORITY', 'ADMIN'] },
    { id: 'incidents', label: 'Incident Reporting', icon: AlertCircle, roleAccess: ['ALL'] },
    { id: 'weather', label: 'Weather Telemetry', icon: CloudRain, roleAccess: ['ALL'] },
    { id: 'analytics', label: 'City Analytics', icon: BarChart3, roleAccess: ['ALL'] },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, roleAccess: ['ALL'] },
    { id: 'city-command', label: 'Command Center', icon: Building2, roleAccess: ['CITY_AUTHORITY', 'ADMIN'] },
    { id: 'simulation', label: 'Scenario Simulator', icon: Sliders, roleAccess: ['CITY_AUTHORITY', 'ADMIN'] },
    { id: 'models', label: 'ML Model Registry', icon: Cpu, roleAccess: ['ADMIN', 'CITY_AUTHORITY'] },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col justify-between p-3 select-none">
      <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-5rem)]">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1.5">Navigation Modules</p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isAllowed = item.roleAccess.includes('ALL') || item.roleAccess.includes(userRole);

          if (!isAllowed) return null;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="pt-2 border-t border-slate-800 px-2 text-[10px] text-slate-500 flex justify-between items-center">
        <span>URBAN-SHIELD Core v1.0</span>
        <span className="text-emerald-400 font-mono">DB Active</span>
      </div>
    </aside>
  );
};
