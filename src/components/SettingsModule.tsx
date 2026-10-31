import React, { useState, useEffect } from 'react';
import { User, HospitalSetting, ConsumableSetting, CounsellorSetting } from '../types';
import {
  ApiClient,
  DEFAULT_PREOP_INSTRUCTIONS,
  DEFAULT_DISCHARGE_MEDICATIONS,
  DEFAULT_POSTOP_CARE,
} from '../api/client';
import {
  Building2,
  Package,
  FileText,
  Plus,
  Trash2,
  Edit2,
  Save,
  RotateCcw,
  Check,
  X,
  Phone,
  MapPin,
  UserCheck,
  Sparkles,
  HeartPulse,
} from 'lucide-react';

interface SettingsModuleProps {
  currentUser: User;
  onRefreshSessionUser?: (user: User) => void;
  initialSection?: 'hospitals' | 'consumables' | 'counsellors' | 'preop' | 'discharge';
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  currentUser,
  initialSection = 'hospitals',
}) => {
  const [activeSection, setActiveSection] = useState<'hospitals' | 'consumables' | 'counsellors' | 'preop' | 'discharge'>(initialSection);

  // Hospitals state
  const [hospitals, setHospitals] = useState<HospitalSetting[]>([]);
  const [isHospitalModalOpen, setIsHospitalModalOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState<HospitalSetting | null>(null);
  const [hospitalForm, setHospitalForm] = useState({
    name: '',
    addressLine1: '',
    addressLine2: '',
    phone: '',
  });

  // Consumables state
  const [consumables, setConsumables] = useState<ConsumableSetting[]>([]);
  const [newConsumableName, setNewConsumableName] = useState('');
  const [editingConsumable, setEditingConsumable] = useState<ConsumableSetting | null>(null);
  const [editingConsumableName, setEditingConsumableName] = useState('');

  // Counsellors state
  const [counsellors, setCounsellors] = useState<CounsellorSetting[]>([]);
  const [newCounsellorName, setNewCounsellorName] = useState('');
  const [newCounsellorRole, setNewCounsellorRole] = useState('Consultant Surgeon');
  const [editingCounsellor, setEditingCounsellor] = useState<CounsellorSetting | null>(null);
  const [editingCounsellorName, setEditingCounsellorName] = useState('');

  // Pre-Op Instructions state
  const [preOpText, setPreOpText] = useState('');

  // Discharge Summary & Post-Op Care states
  const [dischargeMedications, setDischargeMedications] = useState('');
  const [postOpCareText, setPostOpCareText] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const [hList, cList, counsList, pText, dMeds, pCare] = await Promise.all([
      ApiClient.getHospitals(),
      ApiClient.getConsumables(),
      ApiClient.getCounsellors(),
      ApiClient.getPreOpInstructions(),
      ApiClient.getDischargeMedications(),
      ApiClient.getPostOpCare(),
    ]);
    setHospitals(hList);
    setConsumables(cList);
    setCounsellors(counsList);
    setPreOpText(pText);
    setDischargeMedications(dMeds);
    setPostOpCareText(pCare);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ----------------- HOSPITALS -----------------
  const handleOpenAddHospital = () => {
    setEditingHospital(null);
    setHospitalForm({
      name: '',
      addressLine1: '',
      addressLine2: '',
      phone: '',
    });
    setIsHospitalModalOpen(true);
  };

  const handleOpenEditHospital = (h: HospitalSetting) => {
    setEditingHospital(h);
    setHospitalForm({
      name: h.name,
      addressLine1: h.addressLine1,
      addressLine2: h.addressLine2,
      phone: h.phone,
    });
    setIsHospitalModalOpen(true);
  };

  const handleSaveHospitalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalForm.name.trim()) return;

    await ApiClient.saveHospital(
      {
        id: editingHospital?.id,
        name: hospitalForm.name,
        addressLine1: hospitalForm.addressLine1,
        addressLine2: hospitalForm.addressLine2,
        phone: hospitalForm.phone,
      },
      currentUser
    );

    setIsHospitalModalOpen(false);
    showToast(editingHospital ? 'Hospital updated successfully' : 'Hospital added to list');
    await loadSettings();
  };

  const handleDeleteHospital = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove hospital "${name}"?`)) {
      await ApiClient.deleteHospital(id, currentUser);
      showToast('Hospital removed');
      await loadSettings();
    }
  };

  // ----------------- CONSUMABLES -----------------
  const handleAddConsumableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConsumableName.trim()) return;

    await ApiClient.saveConsumable({ name: newConsumableName }, currentUser);
    setNewConsumableName('');
    showToast('Consumable item added to list');
    await loadSettings();
  };

  const handleSaveEditConsumable = async () => {
    if (!editingConsumable || !editingConsumableName.trim()) return;

    await ApiClient.saveConsumable(
      { id: editingConsumable.id, name: editingConsumableName },
      currentUser
    );
    setEditingConsumable(null);
    setEditingConsumableName('');
    showToast('Consumable item updated');
    await loadSettings();
  };

  const handleDeleteConsumable = async (id: string, name: string) => {
    if (window.confirm(`Remove consumable "${name}" from dropdown list?`)) {
      await ApiClient.deleteConsumable(id, currentUser);
      showToast('Consumable removed');
      await loadSettings();
    }
  };

  // ----------------- COUNSELLORS -----------------
  const handleAddCounsellorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCounsellorName.trim()) return;

    await ApiClient.saveCounsellor(
      { name: newCounsellorName, role: newCounsellorRole },
      currentUser
    );
    setNewCounsellorName('');
    showToast('Counsellor added to dropdown list');
    await loadSettings();
  };

  const handleSaveEditCounsellor = async () => {
    if (!editingCounsellor || !editingCounsellorName.trim()) return;

    await ApiClient.saveCounsellor(
      { id: editingCounsellor.id, name: editingCounsellorName, role: editingCounsellor.role },
      currentUser
    );
    setEditingCounsellor(null);
    setEditingCounsellorName('');
    showToast('Counsellor updated');
    await loadSettings();
  };

  const handleDeleteCounsellor = async (id: string, name: string) => {
    if (window.confirm(`Remove counsellor "${name}" from dropdown list?`)) {
      await ApiClient.deleteCounsellor(id, currentUser);
      showToast('Counsellor removed');
      await loadSettings();
    }
  };

  // ----------------- PRE-OP INSTRUCTIONS -----------------
  const handleSavePreOp = async () => {
    await ApiClient.savePreOpInstructions(preOpText, currentUser);
    showToast('Pre-operative instructions template saved!');
  };

  const handleResetPreOpToDefault = () => {
    if (window.confirm('Reset pre-op instructions to the clinic standard template?')) {
      setPreOpText(DEFAULT_PREOP_INSTRUCTIONS);
      ApiClient.savePreOpInstructions(DEFAULT_PREOP_INSTRUCTIONS, currentUser);
      showToast('Reset to clinic default');
    }
  };

  // ----------------- DISCHARGE TAB HANDLERS -----------------
  const handleSaveMedications = async () => {
    await ApiClient.saveDischargeMedications(dischargeMedications, currentUser);
    showToast('Discharge medications template saved!');
  };

  const handleResetMedicationsToDefault = () => {
    if (window.confirm('Reset discharge medications to clinic standard template?')) {
      setDischargeMedications(DEFAULT_DISCHARGE_MEDICATIONS);
      ApiClient.saveDischargeMedications(DEFAULT_DISCHARGE_MEDICATIONS, currentUser);
      showToast('Reset medications to clinic default');
    }
  };

  const handleSavePostOpCare = async () => {
    await ApiClient.savePostOpCare(postOpCareText, currentUser);
    showToast('Post-operative care instructions template saved!');
  };

  const handleResetPostOpCareToDefault = () => {
    if (window.confirm('Reset post-operative care instructions to clinic standard template?')) {
      setPostOpCareText(DEFAULT_POSTOP_CARE);
      ApiClient.savePostOpCare(DEFAULT_POSTOP_CARE, currentUser);
      showToast('Reset post-op care to clinic default');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-blue-900 text-white text-xs font-semibold rounded-xl shadow-xl border border-blue-700 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CBD8E4]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure hospital facilities, planned consumables, counsellor directory, pre-op instructions, and discharge templates
          </p>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#D4E1ED] rounded-xl text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveSection('hospitals')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSection === 'hospitals'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Hospitals ({hospitals.length})</span>
          </button>

          <button
            onClick={() => setActiveSection('consumables')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSection === 'consumables'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-purple-600" />
            <span>Planned Consumables ({consumables.length})</span>
          </button>

          <button
            onClick={() => setActiveSection('counsellors')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSection === 'counsellors'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Counsellors ({counsellors.length})</span>
          </button>

          <button
            onClick={() => setActiveSection('preop')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSection === 'preop'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            <span>Pre-Op Instructions</span>
          </button>

          <button
            onClick={() => setActiveSection('discharge')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSection === 'discharge'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
            <span>Discharge</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: HOSPITALS */}
      {activeSection === 'hospitals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Hospitals & Facilities
              </h2>
              <p className="text-xs text-slate-500">
                Hospital facilities printed on admission letters and selectable in counselling.
              </p>
            </div>

            <button
              onClick={handleOpenAddHospital}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Hospital</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hospitals.map(h => (
              <div
                key={h.id}
                className="bg-white rounded-2xl border border-[#CBD8E4] p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">{h.name}</h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditHospital(h)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Edit Hospital"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteHospital(h.id, h.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Hospital"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600 font-sans">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <div>{h.addressLine1 || '—'}</div>
                        <div>{h.addressLine2 || '—'}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-700 pt-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-[11px] font-semibold">
                        Phone: {h.phone || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Available in Counselling</span>
                  <span className="text-emerald-700 font-medium">Active Facility</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: PLANNED CONSUMABLES */}
      {activeSection === 'consumables' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Planned Consumables & IOLs
              </h2>
              <p className="text-xs text-slate-500">
                Consumable items and intra-ocular lenses available in the Counselling module.
              </p>
            </div>
          </div>

          {/* Add Consumable Form */}
          <form
            onSubmit={handleAddConsumableSubmit}
            className="bg-white p-4 rounded-2xl border border-[#CBD8E4] shadow-xs flex items-center gap-3"
          >
            <div className="relative flex-1">
              <Package className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={newConsumableName}
                onChange={e => setNewConsumableName(e.target.value)}
                placeholder="Enter consumable item (e.g. Foldable Hydrophobic Toric IOL, PanOptix, Viscoat...)"
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Consumable</span>
            </button>
          </form>

          {/* Consumables List */}
          <div className="bg-white rounded-2xl border border-[#CBD8E4] shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Consumable Item Description</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {consumables.map((c, idx) => {
                  const isEditing = editingConsumable?.id === c.id;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingConsumableName}
                              onChange={e => setEditingConsumableName(e.target.value)}
                              className="px-2.5 py-1 text-xs border border-blue-400 rounded-lg bg-white w-full max-w-md focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={handleSaveEditConsumable}
                              className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingConsumable(null)}
                              className="p-1 rounded bg-slate-200 text-slate-600 hover:bg-slate-300 cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="font-semibold text-slate-800 text-xs">
                            {c.name}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {!isEditing && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingConsumable(c);
                                setEditingConsumableName(c.name);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit item"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteConsumable(c.id, c.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: COUNSELLORS */}
      {activeSection === 'counsellors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Counsellors Directory
              </h2>
              <p className="text-xs text-slate-500">
                These counsellor names populate the dropdown in the Counselling module and sign the Admission Letter.
              </p>
            </div>
          </div>

          {/* Add Counsellor Form */}
          <form
            onSubmit={handleAddCounsellorSubmit}
            className="bg-white p-4 rounded-2xl border border-[#CBD8E4] shadow-xs flex flex-col sm:flex-row items-center gap-3"
          >
            <div className="relative flex-1 w-full">
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={newCounsellorName}
                onChange={e => setNewCounsellorName(e.target.value)}
                placeholder="Enter counsellor name (e.g. Dr.A.R.Karthik, DO, DNB)"
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
              />
            </div>
            <input
              type="text"
              value={newCounsellorRole}
              onChange={e => setNewCounsellorRole(e.target.value)}
              placeholder="Designation (e.g. Consultant Surgeon)"
              className="px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 w-full sm:w-56"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5 w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Add Counsellor</span>
            </button>
          </form>

          {/* Counsellors List */}
          <div className="bg-white rounded-2xl border border-[#CBD8E4] shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Counsellor Name</th>
                  <th className="py-3 px-4">Role / Title</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {counsellors.map((c, idx) => {
                  const isEditing = editingCounsellor?.id === c.id;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingCounsellorName}
                              onChange={e => setEditingCounsellorName(e.target.value)}
                              className="px-2.5 py-1 text-xs border border-blue-400 rounded-lg bg-white w-full max-w-md focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={handleSaveEditCounsellor}
                              className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingCounsellor(null)}
                              className="p-1 rounded bg-slate-200 text-slate-600 hover:bg-slate-300 cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="font-semibold text-slate-900 text-xs">
                            {c.name}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {c.role || 'Counsellor'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {!isEditing && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingCounsellor(c);
                                setEditingCounsellorName(c.name);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit item"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCounsellor(c.id, c.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: PRE-OP INSTRUCTIONS */}
      {activeSection === 'preop' && (
        <div className="bg-white rounded-2xl border border-[#CBD8E4] p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Default Pre-Operative Instructions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Static text paragraph template auto-populated into Counselling and Admission Letters.
              </p>
            </div>

            <button
              onClick={handleResetPreOpToDefault}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Clinic Standard</span>
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Static Instructions Paragraph Template
            </label>
            <textarea
              rows={6}
              value={preOpText}
              onChange={e => setPreOpText(e.target.value)}
              className="w-full p-3.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs text-slate-800 leading-relaxed font-sans"
              placeholder="Enter standard pre-operative instructions..."
            />
          </div>

          {/* Live Preview */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Admission Letter Printed View:</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-300 font-serif text-[12.5px] leading-relaxed text-black">
              {preOpText.split('\n').map((line, i) => (
                <div key={i} className="mb-1">
                  {line}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSavePreOp}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Instructions Template</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 5: DISCHARGE SUMMARY & POST-OP CARE */}
      {activeSection === 'discharge' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Discharge Summary & Post-Operative Care Templates
              </h2>
              <p className="text-xs text-slate-500">
                Manage default medication regimens and comprehensive post-operative care instructions printed on patient discharge summaries.
              </p>
            </div>
          </div>

          {/* Panel 1: Medications Regimen Template */}
          <div className="bg-white rounded-2xl border border-[#CBD8E4] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Medication Regimen Template (Discharge Summary Page 1)
                </h3>
              </div>

              <button
                type="button"
                onClick={handleResetMedicationsToDefault}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset to Clinic Default</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Default Medication Text & Instructions:
              </label>
              <textarea
                rows={8}
                value={dischargeMedications}
                onChange={e => setDischargeMedications(e.target.value)}
                className="w-full p-3.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs text-slate-800 leading-relaxed font-sans"
                placeholder="Enter default medications, tapering schedules, warning signs, and notes..."
              />
            </div>

            {/* Live Preview */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                <span>Discharge Summary Printed View Preview:</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-300 font-sans text-[12px] leading-relaxed text-black whitespace-pre-wrap">
                {dischargeMedications}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveMedications}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Medications Template</span>
              </button>
            </div>
          </div>

          {/* Panel 2: Post-Operative Care Instructions Template */}
          <div className="bg-white rounded-2xl border border-[#CBD8E4] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Post-Operative Care Instructions Template (Page 2)
                </h3>
              </div>

              <button
                type="button"
                onClick={handleResetPostOpCareToDefault}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset to Clinic Default</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Post-Operative Instructions Text (Categories & Guidelines):
              </label>
              <textarea
                rows={12}
                value={postOpCareText}
                onChange={e => setPostOpCareText(e.target.value)}
                className="w-full p-3.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs text-slate-800 leading-relaxed font-sans"
                placeholder="Enter post-operative care instructions..."
              />
            </div>

            {/* Live Preview */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Post-Op Care Printed Page Preview:</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-300 font-sans text-[11.5px] leading-relaxed text-black whitespace-pre-wrap max-h-60 overflow-y-auto">
                {postOpCareText}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSavePostOpCare}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Post-Op Care Template</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Hospital */}
      {isHospitalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingHospital ? 'Edit Hospital Details' : 'Add Hospital'}
                </h3>
              </div>
              <button
                onClick={() => setIsHospitalModalOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveHospitalSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Hospital / Clinic Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={hospitalForm.name}
                  onChange={e => setHospitalForm({ ...hospitalForm, name: e.target.value })}
                  placeholder="e.g. Leela Eye Clinic"
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Address Line 1
                </label>
                <input
                  type="text"
                  value={hospitalForm.addressLine1}
                  onChange={e => setHospitalForm({ ...hospitalForm, addressLine1: e.target.value })}
                  placeholder="e.g. No.2, 25th East Street Kamaraj Nagar"
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Address Line 2 (Area, City, Pincode)
                </label>
                <input
                  type="text"
                  value={hospitalForm.addressLine2}
                  onChange={e => setHospitalForm({ ...hospitalForm, addressLine2: e.target.value })}
                  placeholder="e.g. Thiruvanmiyur Chennai – 600 041."
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  value={hospitalForm.phone}
                  onChange={e => setHospitalForm({ ...hospitalForm, phone: e.target.value })}
                  placeholder="e.g. 73050 45550"
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsHospitalModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Save Hospital
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
