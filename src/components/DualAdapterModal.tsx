import React, { useState, useEffect } from 'react';
import { ApiClient } from '../api/client';
import { Database, RefreshCw, X, Check, Laptop } from 'lucide-react';
import { HospitalLogo } from './Logo';

interface DualAdapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReset: () => void;
}

export const DualAdapterModal: React.FC<DualAdapterModalProps> = ({
  isOpen,
  onClose,
  onDataReset,
}) => {
  const [stats, setStats] = useState({ userCount: 0, patientCount: 0, auditCount: 0, sizeKb: 0 });
  const [forcedMode, setForcedMode] = useState<'auto' | 'preview' | 'live'>('auto');
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStats(ApiClient.getStorageStats());
      const current = localStorage.getItem('abhinavas_eyecare_forced_mode') as 'auto' | 'preview' | 'live' | null;
      setForcedMode(current || 'auto');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentEffectiveLive = ApiClient.isLiveServerMode();
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';

  const handleModeChange = (mode: 'auto' | 'preview' | 'live') => {
    setForcedMode(mode);
    ApiClient.setSimulationMode(mode);
    setStats(ApiClient.getStorageStats());
  };

  const handleResetData = () => {
    if (window.confirm('Reset all hospital data, patients, staff, and audit logs to original seed values?')) {
      ApiClient.resetToDefaults();
      setStats(ApiClient.getStorageStats());
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 2500);
      onDataReset();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs select-none">
      <div className="w-full max-w-xl bg-[#F4F8FA] rounded-2xl shadow-2xl border border-[#DDD5C7] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#DDD5C7] bg-[#EBE4D8]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F4F8FA] p-0.5 flex items-center justify-center border border-[#DDD5C7] shadow-xs">
              <HospitalLogo className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-stone-900 text-sm">
                  Hospital System & Database Adapter
                </h3>
              </div>
              <p className="text-[11px] text-stone-500">
                Runtime environment detection & data adapter configuration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-stone-200/80 flex items-center justify-center text-stone-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Active Adapter Card */}
          <div className="p-4 rounded-xl bg-stone-100/70 border border-stone-200/80">
            <div className="flex items-center justify-between">
              <span className="text-stone-500 font-medium">Current Hostname:</span>
              <span className="font-mono font-semibold text-stone-800 bg-[#F4F8FA] px-2 py-0.5 rounded border border-stone-200/80">
                {currentHostname}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-200/70">
              <span className="text-stone-500 font-medium">Active Runtime Adapter:</span>
              <span
                className={`font-semibold inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded ${
                  currentEffectiveLive
                    ? 'text-emerald-800 bg-emerald-100/80 border border-emerald-200/80'
                    : 'text-sky-800 bg-sky-100/80 border border-sky-200/80'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    currentEffectiveLive ? 'bg-emerald-500' : 'bg-sky-600'
                  }`}
                />
                {currentEffectiveLive
                  ? 'Live LAN Server Mode (REST fetch)'
                  : 'Hospital Local Storage Database'}
              </span>
            </div>
          </div>

          {/* Specification details */}
          <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200/70 text-sky-950 text-[11px] leading-relaxed">
            <div className="font-semibold mb-1 flex items-center gap-1.5 text-sky-900">
              <Laptop className="w-3.5 h-3.5 text-sky-600" />
              Dual-Adapter Detection Logic (Technical Requirement 5):
            </div>
            <code className="block p-2 bg-[#F4F8FA] rounded border border-sky-200/80 font-mono text-[10px] text-stone-800 whitespace-pre overflow-x-auto">
{`const isLiveServer = window.location.hostname === 'localhost' || 
                     window.location.hostname.startsWith('192.168.') ||
                     window.location.hostname.startsWith('10.');`}
            </code>
          </div>

          {/* Local Storage Telemetry Stats */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-stone-500" />
                Browser Local Storage Telemetry
              </span>
              <span className="text-[11px] font-mono text-stone-500">
                Payload: {stats.sizeKb} KB
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-[#F4F8FA] rounded-xl border border-stone-200/80">
                <span className="text-stone-500 text-[10px] uppercase font-semibold block">
                  Staff Accounts
                </span>
                <span className="text-lg font-bold text-stone-800 font-mono">
                  {stats.userCount}
                </span>
              </div>
              <div className="p-3 bg-[#F4F8FA] rounded-xl border border-stone-200/80">
                <span className="text-stone-500 text-[10px] uppercase font-semibold block">
                  In-Patients
                </span>
                <span className="text-lg font-bold text-stone-800 font-mono">
                  {stats.patientCount}
                </span>
              </div>
              <div className="p-3 bg-[#F4F8FA] rounded-xl border border-stone-200/80">
                <span className="text-stone-500 text-[10px] uppercase font-semibold block">
                  Audit Events
                </span>
                <span className="text-lg font-bold text-stone-800 font-mono">
                  {stats.auditCount}
                </span>
              </div>
            </div>
          </div>

          {/* Simulation Toggle for Tester */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1.5">
              Adapter Override (For Review & Testing)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleModeChange('auto')}
                className={`py-2 px-3 rounded-lg border text-center transition-all cursor-pointer ${
                  forcedMode === 'auto'
                    ? 'border-sky-600 bg-sky-50 text-sky-900 font-semibold shadow-xs'
                    : 'border-stone-200/80 bg-[#F4F8FA] text-stone-600 hover:bg-stone-100'
                }`}
              >
                Auto Detect
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('preview')}
                className={`py-2 px-3 rounded-lg border text-center transition-all cursor-pointer ${
                  forcedMode === 'preview'
                    ? 'border-sky-600 bg-sky-50 text-sky-900 font-semibold shadow-xs'
                    : 'border-stone-200/80 bg-[#F4F8FA] text-stone-600 hover:bg-stone-100'
                }`}
              >
                Force Local Mode
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('live')}
                className={`py-2 px-3 rounded-lg border text-center transition-all cursor-pointer ${
                  forcedMode === 'live'
                    ? 'border-sky-600 bg-sky-50 text-sky-900 font-semibold shadow-xs'
                    : 'border-stone-200/80 bg-[#F4F8FA] text-stone-600 hover:bg-stone-100'
                }`}
              >
                Force LAN Live REST
              </button>
            </div>
          </div>

          {/* Reset Seeds */}
          <div className="pt-2 border-t border-stone-200/70 flex items-center justify-between">
            <div>
              <span className="font-semibold text-stone-800 block">Reset Seed Data</span>
              <span className="text-[11px] text-stone-500">
                Restores original staff (admin/Dr. Karthik), patients, & audit trails.
              </span>
            </div>
            <button
              type="button"
              onClick={handleResetData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-800 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>
          </div>

          {resetSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200/80 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Hospital seed data successfully re-initialized!</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200/70 bg-stone-100/70 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 text-white font-semibold rounded-lg hover:bg-stone-800 transition-colors text-xs cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
