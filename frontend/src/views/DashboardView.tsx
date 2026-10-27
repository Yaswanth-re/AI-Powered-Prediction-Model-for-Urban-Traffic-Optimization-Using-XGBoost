import React from 'react';
import { CommuterDashboard } from './roles/CommuterDashboard';
import { EmergencyDashboard } from './roles/EmergencyDashboard';
import { AuthorityDashboard } from './roles/AuthorityDashboard';
import { AdminDashboard } from './roles/AdminDashboard';

interface DashboardViewProps {
  userRole: string;
  trafficData: any;
  accidents: any[];
  hotspots: any[];
  incidents: any[];
  models: any[];
  activeCity: string;
  onSelectSegment: (segment: any) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userRole,
  trafficData,
  accidents,
  hotspots,
  incidents,
  models,
  activeCity,
  onSelectSegment,
  onNavigateTab
}) => {
  switch (userRole) {
    case 'COMMUTER':
      return (
        <CommuterDashboard
          trafficData={trafficData}
          accidents={accidents}
          hotspots={hotspots}
          incidents={incidents}
          activeCity={activeCity}
          onSelectSegment={onSelectSegment}
          onNavigateTab={onNavigateTab}
        />
      );
    case 'EMERGENCY_RESPONDER':
      return (
        <EmergencyDashboard
          trafficData={trafficData}
          accidents={accidents}
          hotspots={hotspots}
          incidents={incidents}
          activeCity={activeCity}
          onSelectSegment={onSelectSegment}
        />
      );
    case 'ADMIN':
      return (
        <AdminDashboard
          models={models}
          onNavigateTab={onNavigateTab}
        />
      );
    case 'CITY_AUTHORITY':
    default:
      return (
        <AuthorityDashboard
          trafficData={trafficData}
          accidents={accidents}
          hotspots={hotspots}
          incidents={incidents}
          activeCity={activeCity}
          onSelectSegment={onSelectSegment}
          onNavigateTab={onNavigateTab}
        />
      );
  }
};
