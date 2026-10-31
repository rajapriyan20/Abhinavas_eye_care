import React, { useState, useEffect } from 'react';
import { User, UserRole, AuditEvent, FieldChange } from '../types';
import { ApiClient } from '../api/client';
import {
  Users,
  UserPlus,
  KeyRound,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  Trash2,
  X,
  Lock,
  Search,
  Download,
  Calendar,
  ArrowRight,
} from 'lucide-react';

interface UserManagementProps {
  currentUser: User;
  onRefreshSessionUser: (user: User) => void;
  initialTab?: 'staff' | 'audit';
}

export const UserManagement: React.FC<UserManagementProps> = ({
  currentUser,
  onRefreshSessionUser,
  initialTab = 'staff',
}) => {
  const [subTab, setSubTab] = useState<'staff' | 'audit'>(initialTab);

  useEffect(() => {
    setSubTab(initialTab);
  }, [initialTab]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [searchStaff, setSearchStaff] = useState('');

  // Modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isResetPinModalOpen, setIsResetPinModalOpen] = useState(false);
  const [isSelfPinModalOpen, setIsSelfPinModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Add User Form
  const [addForm, setAddForm] = useState<{
    name: string;
    username: string;
    role: UserRole;
    pin: string;
  }>({
    name: '',
    username: '',
    role: 'nurse',
    pin: '',
  });

  // Reset PIN Form
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Global Audit Trail Filters
  const [auditStaffFilter, setAuditStaffFilter] = useState('all');
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [auditSearch, setAuditSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const u = await ApiClient.getUsers();
    setUsers(u);
    const logs = await ApiClient.getAuditLogs();
    setAuditLogs(logs);
  };

  const isAdmin = currentUser.role === 'admin';

  // Handler: Add New Staff Member
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.username.trim() || addForm.pin.length !== 4) {
      setPinError('Please fill all fields and provide a 4-digit PIN');
      return;
    }

    // Check duplicate username
    if (users.some(u => u.username.toLowerCase() === addForm.username.trim().toLowerCase())) {
      setPinError('Username already taken by another staff member');
      return;
    }

    await ApiClient.createUser(
      {
        name: addForm.name.trim(),
        username: addForm.username.trim(),
        role: addForm.role,
        pin: addForm.pin.trim(),
      },
      currentUser
    );

    setIsAddUserModalOpen(false);
    setAddForm({ name: '', username: '', role: 'nurse', pin: '' });
    setPinError('');
    await loadData();
  };

  // Handler: Reset Staff PIN
  const handleResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || newPin.length !== 4) {
      setPinError('PIN must be exactly 4 numeric digits');
      return;
    }

    await ApiClient.updateUserPin(selectedUser.id, newPin, currentUser);
    setIsResetPinModalOpen(false);
    setSelectedUser(null);
    setNewPin('');
    setPinError('');
    await loadData();
  };

  // Handler: Self Update PIN
  const handleSelfPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4) {
      setPinError('PIN must be exactly 4 numeric digits');
      return;
    }

    await ApiClient.updateUserPin(currentUser.id, newPin, currentUser);
    setIsSelfPinModalOpen(false);
    setNewPin('');
    setPinError('');
    await loadData();
    onRefreshSessionUser({ ...currentUser, pin: newPin });
  };

  // Handler: Toggle Staff Status
  const handleToggleStatus = async (user: User) => {
    if (user.id === currentUser.id) {
      alert('You cannot deactivate your own administrative account.');
      return;
    }
    await ApiClient.toggleUserStatus(user.id, currentUser);
    await loadData();
  };

  // Handler: Delete Staff User
  const handleDeleteUser = async (user: User) => {
    if (user.id === currentUser.id) {
      alert('You cannot delete your own administrative account.');
      return;
    }
    if (window.confirm(`Are you sure you want to remove staff member "${user.name}" (@${user.username})?`)) {
      await ApiClient.deleteUser(user.id, currentUser);
      await loadData();
    }
  };

  // Export Audit Trail to CSV
  const handleExportAuditCsv = () => {
    const headers = ['ID', 'Timestamp', 'Actor', 'Role', 'Action', 'TargetType', 'TargetName', 'Changes', 'Details'];
    const rows = filteredAuditLogs.map(log => [
      log.id,
      log.timestamp,
      `"${log.actorName}"`,
      log.actorRole,
      `"${log.action}"`,
      log.targetType,
      `"${log.targetName}"`,
      `"${log.changes.map(c => `${c.field}: ${c.from}->${c.to}`).join('; ')}"`,
      `"${log.details || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `abhinavas_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Users
  const filteredUsers = users.filter(u => {
    return (
      u.name.toLowerCase().includes(searchStaff.toLowerCase()) ||
      u.username.toLowerCase().includes(searchStaff.toLowerCase()) ||
      u.role.toLowerCase().includes(searchStaff.toLowerCase())
    );
  });

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesStaff = auditStaffFilter === 'all' || log.actorName === auditStaffFilter;
    const matchesAction = auditActionFilter === 'all' || log.targetType === auditActionFilter;
    const matchesSearch =
      auditSearch === '' ||
      log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.targetName.toLowerCase().includes(auditSearch.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(auditSearch.toLowerCase()));
    const matchesDate = !selectedDate || log.timestamp.startsWith(selectedDate);

    return matchesStaff && matchesAction && matchesSearch && matchesDate;
  });

  const getRoleBadgeStyle = (role: UserRole) => {
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
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 select-none">
      {/* Top Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200/70">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-stone-900">
              {subTab === 'audit'
                ? 'Audit Trail'
                : isAdmin
                ? 'User Management'
                : 'Staff Profile & Security'}
            </h1>
            <span className="text-[11px] font-medium text-stone-600 bg-stone-200/60 px-2 py-0.5 rounded border border-stone-300/60">
              {isAdmin ? 'Administrative Access' : 'Read-Only Clearance'}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            {subTab === 'audit'
              ? 'Forensic activity logs, patient clinical modifications, and compliance timestamps.'
              : isAdmin
              ? 'Manage hospital personnel, authenticate roles, and configure 4-digit security PINs.'
              : 'Review your clinical credentials, active privileges, and personal 4-digit security PIN.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && subTab === 'staff' && (
            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>
          )}

          {subTab === 'audit' && (
            <button
              onClick={handleExportAuditCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-[#F4F8FA] hover:bg-stone-100 border border-stone-200/80 rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Export forensic audit log"
            >
              <Download className="w-4 h-4 text-stone-500" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* NON-ADMIN VIEW (Regular Staff: Doctor, Nurse, Billing) */}
      {!isAdmin && (
        <div className="space-y-6">
          <div className="bg-[#F4F8FA] p-6 rounded-2xl border border-stone-200/80 shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-sky-100/80 text-sky-800 font-bold text-xl flex items-center justify-center border border-sky-200/80">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900">{currentUser.name}</h2>
                  <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
                    <span className="font-mono text-stone-700">@{currentUser.username}</span>
                    <span>·</span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${getRoleBadgeStyle(currentUser.role)}`}>
                      {currentUser.role.toUpperCase()}
                    </span>
                    <span>·</span>
                    <span className="text-emerald-700 font-medium">Account Active</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsSelfPinModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100/70 hover:bg-stone-200/70 border border-stone-200/80 rounded-lg transition-colors cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-stone-500" />
                <span>Change My 4-Digit PIN</span>
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-stone-200/60 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-stone-100/60 rounded-xl border border-stone-200/60">
                <span className="text-stone-400 block text-[11px] font-semibold uppercase">
                  Privilege Level
                </span>
                <span className="font-semibold text-stone-800 mt-1 block">
                  Clinical In-Patient Operations
                </span>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Authorized for patient clinical records & medical procedures.
                </p>
              </div>

              <div className="p-3 bg-stone-100/60 rounded-xl border border-stone-200/60">
                <span className="text-stone-400 block text-[11px] font-semibold uppercase">
                  Audit Provenance
                </span>
                <span className="font-semibold text-stone-800 mt-1 block">
                  Full Action Tracking Active
                </span>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  All clinical modifications timestamped under your name.
                </p>
              </div>

              <div className="p-3 bg-stone-100/60 rounded-xl border border-stone-200/60">
                <span className="text-stone-400 block text-[11px] font-semibold uppercase">
                  Admin Governance
                </span>
                <span className="font-semibold text-stone-800 mt-1 block">
                  Staff Role: Protected
                </span>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Role assignments and credential resets governed by Admin.
                </p>
              </div>
            </div>
          </div>

          {/* Read-Only Notice */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 flex items-center gap-3 text-xs text-amber-900">
            <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Restricted Staff Mode:</span> Hospital staff accounts are governed by institutional RBAC. To add other personnel or review forensic logs across all staff, sign in with an Administrator account (e.g. username <code className="font-mono font-bold bg-amber-100/80 px-1 py-0.5 rounded">admin</code>).
            </div>
          </div>
        </div>
      )}

      {/* ADMIN VIEW - SUBTAB 1: STAFF MANAGEMENT */}
      {isAdmin && subTab === 'staff' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-[#F4F8FA] p-3 rounded-xl border border-stone-200/70 shadow-xs flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchStaff}
                onChange={e => setSearchStaff(e.target.value)}
                placeholder="Search staff by name, username, or role..."
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-stone-100/70 focus:bg-[#F4F8FA] border border-stone-200/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 text-stone-800"
              />
            </div>
            <div className="text-xs text-stone-500">
              {filteredUsers.length} active hospital personnel
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-[#F4F8FA] rounded-xl border border-stone-200/70 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-100/80 border-b border-stone-200/80 text-stone-600 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role & Clearance</th>
                  <th className="py-3 px-4">Security PIN</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100/80">
                {filteredUsers.map(user => {
                  const isCurrent = user.id === currentUser.id;
                  return (
                    <tr key={user.id} className="hover:bg-stone-100/60 transition-colors">
                      {/* Name & Username */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-stone-900 text-sm">
                          {user.name}
                        </div>
                        <div className="font-mono text-[11px] text-stone-500">
                          @{user.username} {isCurrent && '(You)'}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getRoleBadgeStyle(user.role)}`}>
                          {user.role.toUpperCase()}
                        </span>
                      </td>

                      {/* PIN */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-stone-700">
                          <Lock className="w-3.5 h-3.5 text-stone-400" />
                          <span>••••</span>
                          <span className="text-[10px] text-stone-400">({user.pin})</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                            user.isActive
                              ? 'text-emerald-800 bg-emerald-50/90 border border-emerald-200/80'
                              : 'text-rose-800 bg-rose-50/90 border border-rose-200/80'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {user.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      {/* Last Activity */}
                      <td className="py-3 px-4 text-[11px] text-stone-500 font-mono">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Never'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setNewPin('');
                              setPinError('');
                              setIsResetPinModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-medium text-stone-700 hover:text-sky-800 bg-stone-200/60 hover:bg-sky-100/70 rounded border border-stone-300/60 hover:border-sky-300/70 transition-colors cursor-pointer"
                            title="Reset 4-digit security PIN"
                          >
                            Reset PIN
                          </button>

                          {!isCurrent && (
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className={`p-1 rounded border transition-colors cursor-pointer ${
                                user.isActive
                                  ? 'text-amber-800 hover:bg-amber-100/80 border-amber-200/80'
                                  : 'text-emerald-800 hover:bg-emerald-100/80 border-emerald-200/80'
                              }`}
                              title={user.isActive ? 'Deactivate staff account' : 'Reactivate staff account'}
                            >
                              {user.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          {!isCurrent && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-1 rounded text-rose-700 hover:bg-rose-100/80 border border-rose-200/80 transition-colors cursor-pointer"
                              title="Permanently remove staff member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADMIN VIEW - SUBTAB 2: GLOBAL AUDIT TRAIL */}
      {isAdmin && subTab === 'audit' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-[#F4F8FA] p-4 rounded-xl border border-stone-200/70 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search text */}
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                  placeholder="Filter by action or patient..."
                  className="w-full pl-8 pr-3 py-1.5 bg-stone-100/70 border border-stone-200/80 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 text-stone-800"
                />
              </div>

              {/* Staff Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-stone-500 font-medium">Staff:</span>
                <select
                  value={auditStaffFilter}
                  onChange={e => setAuditStaffFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-stone-100/70 border border-stone-200/80 rounded-lg font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="all">All Personnel</option>
                  {users.map(u => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Type Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-stone-500 font-medium">Domain:</span>
                <select
                  value={auditActionFilter}
                  onChange={e => setAuditActionFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-stone-100/70 border border-stone-200/80 rounded-lg font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="all">All Actions</option>
                  <option value="Patient">Patient Records</option>
                  <option value="Billing">Billing & Claims</option>
                  <option value="Staff">Staff Management</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="px-2 py-1 bg-stone-100/70 border border-stone-200/80 rounded-lg text-xs text-stone-700"
                />
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate('')}
                    className="text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
                    title="Clear date filter"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="text-stone-400 font-mono text-[11px]">
              Showing {filteredAuditLogs.length} audit event{filteredAuditLogs.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Global Audit Trail Table */}
          <div className="bg-[#F4F8FA] rounded-xl border border-stone-200/70 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-100/80 border-b border-stone-200/80 text-stone-600 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Acting Staff</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Record</th>
                  <th className="py-3 px-4">Specific Changes (Field-Level Diff)</th>
                  <th className="py-3 px-4">Compliance Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100/80 font-sans">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-stone-400">
                      <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                      <p className="text-xs font-medium text-stone-600">No audit events match current criteria</p>
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map(log => {
                    const date = new Date(log.timestamp);
                    return (
                      <tr key={log.id} className="hover:bg-stone-100/60 transition-colors">
                        {/* Timestamp */}
                        <td className="py-3 px-4 font-mono text-[11px] text-stone-600 whitespace-nowrap">
                          <div className="font-semibold text-stone-800">
                            {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                          <div className="text-[10px] text-stone-400">
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </td>

                        {/* Staff */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-stone-900">{log.actorName}</div>
                          <span className={`px-1.5 py-0.2 text-[10px] font-semibold rounded border ${getRoleBadgeStyle(log.actorRole)}`}>
                            {log.actorRole}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-stone-800 block">{log.action}</span>
                          <span className="text-[10px] text-stone-400 uppercase font-mono">{log.targetType}</span>
                        </td>

                        {/* Target */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-stone-800">{log.targetName}</div>
                          <div className="text-[11px] font-mono text-stone-400">{log.targetId}</div>
                        </td>

                        {/* Changes Diff */}
                        <td className="py-3 px-4">
                          {log.changes && log.changes.length > 0 ? (
                            <div className="space-y-1">
                              {log.changes.map((c, i) => (
                                <div key={i} className="text-[11px] font-mono flex items-center gap-1.5">
                                  <span className="font-semibold text-stone-700">{c.field}:</span>
                                  <span className="text-rose-700 line-through bg-rose-50 px-1 py-0.2 rounded text-[10px]">
                                    {c.from || 'None'}
                                  </span>
                                  <ArrowRight className="w-3 h-3 text-stone-400 shrink-0" />
                                  <span className="text-emerald-800 font-semibold bg-emerald-50 px-1 py-0.2 rounded text-[10px]">
                                    {c.to}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-stone-400 text-[11px]">—</span>
                          )}
                        </td>

                        {/* Details */}
                        <td className="py-3 px-4 text-xs text-stone-600 italic">
                          {log.details || 'System verified transaction'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Add Staff Member */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs select-none">
          <div className="w-full max-w-md bg-[#F4F8FA] rounded-2xl shadow-xl border border-stone-200/80 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-stone-200/70 bg-stone-100/70">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-sky-700" />
                <h3 className="font-bold text-stone-900 text-sm">Add Hospital Staff Member</h3>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="p-6 space-y-4 text-xs">
              {pinError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium">
                  {pinError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. Dr. Sneha Reddy or Staff Rajesh"
                  className="w-full px-3 py-2 bg-stone-100/70 border border-stone-200/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium text-stone-800"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Staff Username</label>
                <input
                  type="text"
                  value={addForm.username}
                  onChange={e => setAddForm({ ...addForm, username: e.target.value })}
                  placeholder="e.g. Dr. Sneha"
                  className="w-full px-3 py-2 bg-stone-100/70 border border-stone-200/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium text-stone-800"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Designated Role</label>
                <select
                  value={addForm.role}
                  onChange={e => setAddForm({ ...addForm, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 bg-stone-100/70 border border-stone-200/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium text-stone-800"
                >
                  <option value="doctor">Doctor / Surgeon</option>
                  <option value="nurse">Nurse / In-Patient Staff</option>
                  <option value="billing">Billing Desk / Accounts</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Initial 4-Digit Security PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={addForm.pin}
                  onChange={e => setAddForm({ ...addForm, pin: e.target.value.replace(/\D/g, '') })}
                  placeholder="e.g. 1234"
                  className="w-full px-3 py-2 bg-stone-100/70 border border-stone-200/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono text-center tracking-widest text-stone-800 font-bold"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200/70">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Create Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Reset Staff PIN */}
      {isResetPinModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs select-none">
          <div className="w-full max-w-sm bg-[#F4F8FA] rounded-2xl shadow-xl border border-stone-200/80 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-stone-200/70 bg-stone-100/70">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-stone-900 text-sm">Reset Security PIN</h3>
              </div>
              <button
                onClick={() => setIsResetPinModalOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPinSubmit} className="p-5 space-y-4 text-xs">
              {pinError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium">
                  {pinError}
                </div>
              )}

              <div>
                <span className="text-stone-400 block text-[11px]">Staff Account</span>
                <span className="font-semibold text-stone-800 text-sm">
                  {selectedUser.name} (@{selectedUser.username})
                </span>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">New 4-Digit Numeric PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-3 py-2 bg-stone-100/70 border border-stone-200/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-center tracking-widest text-stone-800 font-bold text-base"
                  required
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200/70">
                <button
                  type="button"
                  onClick={() => setIsResetPinModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Save New PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Self Update PIN */}
      {isSelfPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs select-none">
          <div className="w-full max-w-sm bg-[#F4F8FA] rounded-2xl shadow-xl border border-stone-200/80 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-stone-200/70 bg-stone-100/70">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-sky-700" />
                <h3 className="font-bold text-stone-900 text-sm">Update Your 4-Digit PIN</h3>
              </div>
              <button
                onClick={() => setIsSelfPinModalOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSelfPinSubmit} className="p-5 space-y-4 text-xs">
              {pinError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium">
                  {pinError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Enter New 4-Digit Numeric PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-3 py-2 bg-stone-100/70 border border-stone-200/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono text-center tracking-widest text-stone-800 font-bold text-base"
                  required
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200/70">
                <button
                  type="button"
                  onClick={() => setIsSelfPinModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Confirm PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
