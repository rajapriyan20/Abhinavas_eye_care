/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { User, Patient, DevComment } from './types';
import { ApiClient } from './api/client';
import { Header } from './components/Header';
import { Sidebar, TabType } from './components/Sidebar';
import { LoginScreen } from './components/LoginScreen';
import { DashboardOverview } from './components/DashboardOverview';
import { PatientList } from './components/PatientList';
import { CounsellingModule } from './components/CounsellingModule';
import { BillingModule } from './components/billing/BillingModule';
import { ReportsModule } from './components/reports/ReportsModule';
import { SettingsModule } from './components/SettingsModule';
import { UserManagement } from './components/UserManagement';
import { DevFeedbackModule } from './components/dev/DevFeedbackModule';
import { DevCommentOverlay } from './components/dev/DevCommentOverlay';

import { DualAdapterModal } from './components/DualAdapterModal';
import { Monitor } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('patients');
  const [counsellingPatientId, setCounsellingPatientId] = useState<string>('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAdapterModalOpen, setIsAdapterModalOpen] = useState(false);
  const [isLiveServerMode, setIsLiveServerMode] = useState(false);
  const [isScreenTooSmall, setIsScreenTooSmall] = useState(false);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);

  const handleJumpToComment = (comment: DevComment) => {
    setActiveTab(comment.tab as TabType);
    setHighlightedCommentId(comment.id);
    // Auto clear pulse highlight after 5 seconds
    setTimeout(() => {
      setHighlightedCommentId(null);
    }, 5000);
  };

  // Load session & data
  const loadData = useCallback(async () => {
    const sessionUser = ApiClient.getCurrentSession();
    setCurrentUser(sessionUser);
    setIsLiveServerMode(ApiClient.isLiveServerMode());

    const patientList = await ApiClient.getPatients();
    setPatients(patientList);
  }, []);

  useEffect(() => {
    loadData();

    // Check viewport width for desktop responsiveness
    const checkScreen = () => {
      setIsScreenTooSmall(window.innerWidth < 850);
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      }
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, [loadData]);

  // Auth Handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    loadData();
  };

  const handleLogout = async () => {
    await ApiClient.logout();
    setCurrentUser(null);
    setActiveTab('overview');
  };

  const handleRefreshSessionUser = (updated: User) => {
    setCurrentUser(updated);
    ApiClient.setSession(updated);
  };

  // If not logged in, show Login Screen
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        isLiveServerMode={isLiveServerMode}
      />
    );
  }

  return (
    // Bluish-white background throughout the entire app
    <div className="h-screen w-screen overflow-hidden bg-[#EAF0F6] flex flex-col text-slate-800 antialiased font-sans select-none">
      {/* Desktop resolution advisory (for displays < 850px) */}
      {isScreenTooSmall && (
        <div className="bg-amber-600/90 text-white text-xs px-3 sm:px-4 py-1.5 flex items-center justify-between font-medium shrink-0 z-40">
          <div className="flex items-center gap-2 truncate">
            <Monitor className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              <strong>Desktop View:</strong> Optimized for clinical workstations.
            </span>
          </div>
          <button
            onClick={() => setIsScreenTooSmall(false)}
            className="text-amber-100 hover:text-white underline text-[11px] ml-2 shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Header - Always fits within screen without overflow */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAdapterModal={() => setIsAdapterModalOpen(true)}
        isLiveServerMode={isLiveServerMode}
        onToggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      {/* Main Workspace: Collapsible Sidebar on Left + Content View on Right */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Left Collapsible Navigation Menu */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
          currentUser={currentUser}
        />

        {/* Content Body - strictly constrained to viewport with internal smooth scroll */}
        <main className="flex-1 overflow-y-auto min-h-0 bg-[#EAF0F6] focus:outline-none">
          {activeTab === 'overview' && (
            <DashboardOverview
              currentUser={currentUser}
              patients={patients}
              onNavigateTab={tab => setActiveTab(tab)}
            />
          )}

          {activeTab === 'patients' && (
            <PatientList
              patients={patients}
              currentUser={currentUser}
              onRefresh={loadData}
              onNavigateToCounselling={patientId => {
                setCounsellingPatientId(patientId);
                setActiveTab('counselling');
              }}
            />
          )}

          {activeTab === 'counselling' && (
            <CounsellingModule
              patients={patients}
              currentUser={currentUser}
              onNavigateToSettings={() => setActiveTab('settings')}
              initialPatientId={counsellingPatientId}
            />
          )}

          {activeTab === 'billing' && (
            <BillingModule
              currentUser={currentUser}
              patients={patients}
              onNavigateToSettings={() => setActiveTab('settings')}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsModule
              currentUser={currentUser}
              patients={patients}
            />
          )}

          {activeTab === 'dev_feedback' && (
            <DevFeedbackModule
              currentUser={currentUser}
              onJumpToComment={handleJumpToComment}
            />
          )}

          {activeTab === 'settings' && (

            <SettingsModule
              currentUser={currentUser}
              onRefreshSessionUser={handleRefreshSessionUser}
            />
          )}

          {activeTab === 'users' && (
            <UserManagement
              currentUser={currentUser}
              onRefreshSessionUser={handleRefreshSessionUser}
              initialTab="staff"
            />
          )}

          {activeTab === 'audit' && (
            <UserManagement
              currentUser={currentUser}
              onRefreshSessionUser={handleRefreshSessionUser}
              initialTab="audit"
            />
          )}
        </main>
      </div>

      {/* Dual-Adapter Architecture Inspector Modal */}
      <DualAdapterModal
        isOpen={isAdapterModalOpen}
        onClose={() => setIsAdapterModalOpen(false)}
        onDataReset={loadData}
      />

      {/* Development Feedback Overlay: Right-click disable & screen balloon markers */}
      <DevCommentOverlay
        currentUser={currentUser}
        activeTab={activeTab}
        onNavigateTab={tab => setActiveTab(tab)}
        highlightedCommentId={highlightedCommentId}
        onClearHighlight={() => setHighlightedCommentId(null)}
      />
    </div>
  );
}
