import React from 'react';
import { User } from '../types';
import {
  LayoutDashboard,
  Users,
  UserCog,
  Shield,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  HeartHandshake,
  Settings,
  Receipt,
  BarChart3,
} from 'lucide-react';

export type TabType = 'overview' | 'patients' | 'counselling' | 'billing' | 'reports' | 'settings' | 'users' | 'audit';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentUser: User;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  onToggleCollapse,
  currentUser,
}) => {
  const isAdmin = currentUser.role === 'admin';

  const menuItems = [
    {
      id: 'overview' as const,
      label: 'Dashboard',
      sublabel: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'patients' as const,
      label: 'Patient List',
      sublabel: 'Patient Registry',
      icon: Users,
    },
    {
      id: 'counselling' as const,
      label: 'Counselling',
      sublabel: 'Surgery & Admission',
      icon: HeartHandshake,
    },
    {
      id: 'billing' as const,
      label: 'Billing',
      sublabel: 'Bills, Receipts & Ledger',
      icon: Receipt,
    },
    {
      id: 'reports' as const,
      label: 'Reports',
      sublabel: 'Admissions, Surgeries & Audit',
      icon: BarChart3,
    },
    {
      id: 'settings' as const,
      label: 'Settings',
      sublabel: 'Facilities & Clinical',
      icon: Settings,
    },

    {
      id: 'users' as const,
      label: isAdmin ? 'User Management' : 'Staff Settings',
      sublabel: isAdmin ? 'Staff & Roles' : 'My Credentials',
      icon: UserCog,
    },
    {
      id: 'audit' as const,
      label: 'Audit Trail',
      sublabel: 'Forensic History',
      icon: Shield,
    },
  ];

  return (
    <aside
      className={`h-full bg-[#E1EAF2]/95 backdrop-blur-md border-r border-[#CBD8E4] flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 z-20 select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Section */}
      <div className="p-3">
        {/* Toggle Collapse Button Header */}
        <div
          className={`flex items-center mb-3 pb-2 border-b border-[#CBD8E4] ${
            isCollapsed ? 'justify-center' : 'justify-between px-1'
          }`}
        >
          {!isCollapsed && (
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Navigation
            </span>
          )}
          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-[#D2DFEB] transition-colors cursor-pointer"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Items List */}
        <nav className="space-y-1.5">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 rounded-xl transition-all cursor-pointer ${
                    isCollapsed
                      ? 'justify-center h-10 w-10 mx-auto px-0'
                      : 'px-3 py-2.5 text-left'
                  } ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-[#D4E1ED]/90'
                  }`}
                  aria-label={item.label}
                >
                  <Icon
                    className={`shrink-0 ${
                      isCollapsed ? 'w-5 h-5' : 'w-4 h-4'
                    } ${isActive ? 'text-white' : 'text-slate-600'}`}
                  />

                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate leading-tight flex items-center justify-between">
                        <span>{item.label}</span>
                        {item.id === 'settings' && isAdmin && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
                            title="Admin privileges"
                          />
                        )}
                      </div>
                      <div
                        className={`text-[10px] truncate leading-tight mt-0.5 ${
                          isActive ? 'text-blue-100' : 'text-slate-500'
                        }`}
                      >
                        {item.sublabel}
                      </div>
                    </div>
                  )}
                </button>

                {/* Floating tooltip when sidebar is collapsed */}
                {isCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                    <div className="font-semibold">{item.label}</div>
                    <div className="text-[10px] text-slate-300">{item.sublabel}</div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section - Removed "in patient terminal" text as requested */}
      <div className="p-3 border-t border-[#CBD8E4]">
        {!isCollapsed ? (
          <div className="p-3 rounded-xl bg-[#D2DFEB]/60 border border-[#CBD8E4] text-xs">
            <div className="flex items-center gap-1.5 text-blue-800 font-bold text-[11px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Clinical Suite</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
              Workstation v2.4
            </p>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={onToggleCollapse}
              title="Expand sidebar"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-[#D2DFEB] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
