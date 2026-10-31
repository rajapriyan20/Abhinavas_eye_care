import React from 'react';
import { User } from '../types';
import { LogOut, ChevronDown, PanelLeft } from 'lucide-react';
import { HospitalLogo } from './Logo';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
  onOpenAdapterModal: () => void;
  isLiveServerMode: boolean;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onOpenAdapterModal,
  isLiveServerMode,
  onToggleSidebar,
  isSidebarCollapsed,
}) => {
  const getRoleBadge = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return { label: 'Administrator', color: 'text-amber-800 bg-amber-100/80 border-amber-300' };
      case 'doctor':
        return { label: 'Doctor / Surgeon', color: 'text-blue-800 bg-blue-100/80 border-blue-300' };
      case 'nurse':
        return { label: 'In-Patient Staff', color: 'text-sky-800 bg-sky-100/80 border-sky-300' };
      case 'billing':
        return { label: 'Billing Desk', color: 'text-purple-800 bg-purple-100/80 border-purple-300' };
      default:
        return { label: role, color: 'text-slate-700 bg-slate-200 border-slate-300' };
    }
  };

  const roleInfo = getRoleBadge(currentUser.role);

  return (
    <header className="w-full max-w-full shrink-0 z-30 flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-2.5 bg-[#E1EAF2]/95 backdrop-blur-md border-b border-[#CBD8E4] shadow-xs select-none overflow-hidden">
      {/* Left: Sidebar Toggle + Brand Identity & Hospital Logo */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-[#D4E1ED] transition-colors cursor-pointer shrink-0"
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white p-1 flex items-center justify-center border border-white shadow-xs shrink-0">
            <HospitalLogo className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-900 tracking-tight text-xs sm:text-sm truncate">
                Abhinavas Eye Care
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-blue-900 bg-blue-100 px-1.5 py-0.2 rounded border border-blue-200 shrink-0">
                IP Management
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 hidden xl:block truncate">
              In-Patient Department · Clinical Operations & Patient Management
            </p>
          </div>
        </div>
      </div>

      {/* Right: Dual-Adapter Connection + Staff Badge + Log Out */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Dual-Adapter Server Status Pill (Compact on narrow screens) */}
        <button
          onClick={onOpenAdapterModal}
          title="Click to view network & storage status"
          className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 text-xs rounded-md bg-[#D4E1ED]/70 hover:bg-[#D4E1ED] border border-[#CBD8E4] transition-colors text-slate-700 cursor-pointer shrink-0"
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isLiveServerMode ? 'bg-emerald-600' : 'bg-blue-600'
            }`}
          />
          <span className="font-medium text-slate-800 hidden md:inline text-[11px]">
            {isLiveServerMode ? 'LAN Server (Live)' : 'Clinical Workstation'}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
        </button>

        {/* Staff Profile Badge */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[#CBD8E4] shrink-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            {currentUser.name.charAt(0)}
          </div>
          <div className="hidden lg:block text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs text-slate-900 leading-tight">
                {currentUser.name}
              </span>
              <span className={`px-1.5 py-0.2 text-[9px] font-semibold rounded border ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-500">
              {currentUser.username}
            </p>
          </div>
        </div>

        {/* Log Out Button */}
        <button
          onClick={onLogout}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-100/80 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors cursor-pointer shadow-xs shrink-0"
          title="Sign out of hospital terminal"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Log Out</span>
        </button>
      </div>
    </header>
  );
};
