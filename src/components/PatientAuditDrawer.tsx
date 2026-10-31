import React, { useState, useEffect } from 'react';
import { AuditEvent, Patient } from '../types';
import { ApiClient } from '../api/client';
import { X, ShieldCheck, ArrowRight, History } from 'lucide-react';

interface PatientAuditDrawerProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PatientAuditDrawer: React.FC<PatientAuditDrawerProps> = ({
  patient,
  isOpen,
  onClose,
}) => {
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (patient && isOpen) {
      setIsLoading(true);
      ApiClient.getAuditLogsForPatient(patient.id).then(events => {
        setLogs(events);
        setIsLoading(false);
      });
    }
  }, [patient, isOpen]);

  if (!isOpen || !patient) return null;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
    } catch {
      return { date: isoString, time: '' };
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-amber-800 bg-amber-50/90 border-amber-200/80';
      case 'doctor':
        return 'text-sky-800 bg-sky-50/90 border-sky-200/80';
      case 'nurse':
        return 'text-emerald-800 bg-emerald-50/90 border-emerald-200/80';
      case 'billing':
        return 'text-purple-800 bg-purple-50/90 border-purple-200/80';
      default:
        return 'text-stone-800 bg-stone-100 border-stone-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-[#F4F8FA] shadow-2xl flex flex-col border-l border-stone-200/80">
          {/* Drawer Top Header (macOS style warm paper) */}
          <div className="p-6 border-b border-stone-200/70 bg-stone-100/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-800">
                <History className="w-4 h-4 text-sky-600" />
                <span>Patient Audit Timeline</span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-stone-200/80 flex items-center justify-center text-stone-500 hover:text-stone-800 transition-colors"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3">
              <h2 className="text-xl font-bold text-stone-900">
                {patient.name}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
                <span className="font-mono font-medium text-stone-700">{patient.id}</span>
                <span>·</span>
                <span>UHID: {patient.uhid}</span>
                <span>·</span>
                <span>{patient.procedure}</span>
              </div>
            </div>

            {/* Current State Summary Pill */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#F4F8FA] border border-stone-200/80">
                <span className="text-stone-400 block text-[10px] uppercase font-semibold">
                  Patient Status
                </span>
                <span className="font-semibold text-stone-800 mt-0.5 block">
                  {patient.patientStatus || 'Active'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F4F8FA] border border-stone-200/80">
                <span className="text-stone-400 block text-[10px] uppercase font-semibold">
                  Billing Status
                </span>
                <span className="font-semibold text-stone-800 mt-0.5 block">
                  {patient.billingStatus || 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="font-semibold text-stone-700">Historical Event Trail</span>
              <span className="text-[11px] text-stone-400 font-mono">
                {logs.length} logged record{logs.length !== 1 ? 's' : ''}
              </span>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-xs text-stone-400">
                <div className="w-5 h-5 mx-auto mb-2 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                Retrieving patient audit events...
              </div>
            ) : logs.length === 0 ? (
              <div className="py-12 text-center text-stone-400 border-2 border-dashed border-stone-200 rounded-xl">
                <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                <p className="text-xs font-medium text-stone-600">No modifications logged yet</p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Any updates to patient profile, billing, or status will appear here.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                {logs.map(log => {
                  const dt = formatDate(log.timestamp);
                  return (
                    <div key={log.id} className="relative group">
                      {/* Timeline node */}
                      <div className="absolute -left-6 top-1.5 w-4 h-4 rounded-full bg-[#FAFAF9] border-2 border-sky-600 group-hover:scale-110 transition-transform shadow-xs" />

                      <div className="bg-stone-100/60 hover:bg-stone-100 p-4 rounded-xl border border-stone-200/80 transition-colors">
                        {/* Action Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-stone-900 block">
                              {log.action}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-500">
                              <span className="font-medium text-stone-700">{log.actorName}</span>
                              <span
                                className={`px-1.5 py-0.2 text-[10px] font-semibold rounded border ${getRoleBadgeStyle(
                                  log.actorRole
                                )}`}
                              >
                                {log.actorRole}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono text-[11px] text-stone-600 font-medium block">
                              {dt.time}
                            </span>
                            <span className="text-[10px] text-stone-400 block">{dt.date}</span>
                          </div>
                        </div>

                        {/* Changed Fields Diff */}
                        {log.changes && log.changes.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-stone-200/80 space-y-1.5">
                            <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider">
                              Specific Fields Changed:
                            </span>
                            {log.changes.map((ch, idx) => (
                              <div
                                key={idx}
                                className="text-xs bg-[#FAFAF9] p-2 rounded-lg border border-stone-200/70 font-mono flex items-center justify-between gap-2"
                              >
                                <span className="font-semibold text-stone-700">{ch.field}:</span>
                                <div className="flex items-center gap-1.5 text-[11px] truncate">
                                  <span className="text-rose-700 line-through bg-rose-50 px-1 py-0.5 rounded">
                                    {ch.from || 'None'}
                                  </span>
                                  <ArrowRight className="w-3 h-3 text-stone-400 shrink-0" />
                                  <span className="text-emerald-800 font-semibold bg-emerald-50 px-1 py-0.5 rounded">
                                    {ch.to}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Optional notes/details */}
                        {log.details && (
                          <p className="mt-2 text-xs text-stone-600 italic">
                            "{log.details}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-stone-200/80 bg-stone-100/70 flex items-center justify-between text-xs text-stone-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Immutable Clinical IP Audit Trail</span>
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 font-medium text-stone-800 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
