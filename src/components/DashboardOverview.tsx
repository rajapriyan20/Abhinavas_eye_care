import React from 'react';
import { User, Patient } from '../types';
import { TabType } from './Sidebar';

interface DashboardOverviewProps {
  currentUser: User;
  patients: Patient[];
  onNavigateTab: (tab: TabType) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  currentUser,
}) => {
  // Get time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-8 lg:p-12 max-w-5xl mx-auto select-none">
      <div className="space-y-3 py-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {getGreeting()}, {currentUser.name}
        </h1>

        <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
          [This is where dashboard with important metrics will appear in the future]
        </p>
      </div>
    </div>
  );
};
