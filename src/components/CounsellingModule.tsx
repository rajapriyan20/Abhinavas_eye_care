import React, { useState, useEffect, useMemo } from 'react';
import {
  Patient,
  User,
  CounsellingRecord,
  HospitalSetting,
  ConsumableSetting,
  CounsellorSetting,
  EyeSelection,
} from '../types';
import { ApiClient } from '../api/client';
import { AdmissionLetterPrintModal } from './AdmissionLetterPrintModal';
import { DischargeSummaryPrintModal } from './DischargeSummaryPrintModal';
import {
  Search,
  Calendar,
  Building2,
  Package,
  Printer,
  Save,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Eye,
  Plus,
  ArrowLeft,
  Edit3,
  Trash2,
  UserCheck,
  FileText,
  HeartPulse,
} from 'lucide-react';

interface CounsellingModuleProps {
  patients: Patient[];
  currentUser: User;
  onNavigateToSettings?: () => void;
  initialPatientId?: string;
}

export const CounsellingModule: React.FC<CounsellingModuleProps> = ({
  patients,
  currentUser,
  initialPatientId = '',
}) => {
  // Navigation view: 'list' or 'form'
  const [viewMode, setViewMode] = useState<'list' | 'form'>(initialPatientId ? 'form' : 'list');
  // Read-only state for form
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);

  // Counselling Records List
  const [counsellingList, setCounsellingList] = useState<CounsellingRecord[]>([]);
  const [listSearchQuery, setListSearchQuery] = useState('');

  // Search & Patient selection for form
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Settings data
  const [hospitals, setHospitals] = useState<HospitalSetting[]>([]);
  const [consumables, setConsumables] = useState<ConsumableSetting[]>([]);
  const [counsellors, setCounsellors] = useState<CounsellorSetting[]>([]);
  const [defaultPreOp, setDefaultPreOp] = useState<string>('');

  // Form Fields
  const [counsellingId, setCounsellingId] = useState<string>('');
  const [eyeSelection, setEyeSelection] = useState<EyeSelection>('OD');
  const [tentativeDate, setTentativeDate] = useState<string>('');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [counsellorName, setCounsellorName] = useState<string>('Dr.A.R.Karthik, DO, DNB');
  const [plannedConsumable, setPlannedConsumable] = useState<string>('');
  const [lensType, setLensType] = useState<string>('Foldable Toric IOL');
  const [lensPower, setLensPower] = useState<string>('Per Biometry');
  const [surgeryPlan, setSurgeryPlan] = useState<string>('');
  const [preOpInstructions, setPreOpInstructions] = useState<string>('');

  // Print Modals
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
  const [printCounsellingRecord, setPrintCounsellingRecord] = useState<CounsellingRecord | null>(null);
  const [printPatient, setPrintPatient] = useState<Patient | null>(null);

  // UI status
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load records and settings
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    const [hospList, consList, counsList, preOp, records] = await Promise.all([
      ApiClient.getHospitals(),
      ApiClient.getConsumables(),
      ApiClient.getCounsellors(),
      ApiClient.getPreOpInstructions(),
      ApiClient.getCounsellingRecords(),
    ]);

    setHospitals(hospList);
    setConsumables(consList);
    setCounsellors(counsList);
    setDefaultPreOp(preOp);
    setCounsellingList(records);

    if (hospList.length > 0 && !selectedHospitalId) {
      setSelectedHospitalId(hospList[0].id);
    }
    if (consList.length > 0 && !plannedConsumable) {
      setPlannedConsumable(consList[0].name);
    }
    if (counsList.length > 0) {
      setCounsellorName(counsList[0].name);
    }
  };

  // Sync selected patient and existing counselling record
  useEffect(() => {
    if (!selectedPatientId) {
      setSelectedPatient(null);
      return;
    }

    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return;
    setSelectedPatient(patient);

    const loadPatientCounselling = async () => {
      const existing = await ApiClient.getCounsellingForPatient(patient.id);
      if (existing) {
        setCounsellingId(existing.id);
        setEyeSelection(existing.eyeSelection || 'OD');
        setTentativeDate(existing.tentativeSurgeryDate || '');
        setSelectedHospitalId(existing.hospitalId || (hospitals[0]?.id ?? ''));
        setCounsellorName(existing.counsellorName || (counsellors[0]?.name ?? 'Dr.A.R.Karthik, DO, DNB'));
        setPlannedConsumable(existing.plannedConsumable || (consumables[0]?.name ?? ''));
        setLensType(existing.lensType || 'Foldable Toric IOL');
        setLensPower(existing.lensPower || 'Per Biometry');
        setSurgeryPlan(existing.surgeryPlan || '');
        setPreOpInstructions(existing.preOpInstructions || defaultPreOp);
      } else {
        setCounsellingId('');
        let defaultEye: EyeSelection = 'OD';
        if (patient.eye === 'Left (OS)') defaultEye = 'OS';
        else if (patient.eye === 'Both (OU)') defaultEye = 'Both';
        setEyeSelection(defaultEye);

        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        setTentativeDate(nextWeek.toISOString().slice(0, 10));

        setSelectedHospitalId(hospitals[0]?.id || '');
        setCounsellorName(counsellors[0]?.name || 'Dr.A.R.Karthik, DO, DNB');
        setPlannedConsumable(consumables[0]?.name || '');
        setLensType('Foldable Toric IOL');
        setLensPower('Per Biometry');
        setSurgeryPlan(
          patient.procedure
            ? `Planned procedure: ${patient.procedure}. Clear corneal incision, phacoemulsification, and in-the-bag IOL implantation.`
            : 'Phacoemulsification with Foldable IOL implantation under local anesthesia.'
        );
        setPreOpInstructions(defaultPreOp);
      }
    };

    loadPatientCounselling();
  }, [selectedPatientId, patients, hospitals, consumables, counsellors, defaultPreOp]);

  // Autocomplete search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return patients
      .filter(p => {
        return (
          p.name.toLowerCase().includes(q) ||
          (p.uhid && p.uhid.toLowerCase().includes(q)) ||
          p.id.toLowerCase().includes(q) ||
          (p.mobileNo && p.mobileNo.includes(q))
        );
      })
      .slice(0, 8);
  }, [patients, searchQuery]);

  // Filtered counselling list
  const filteredCounsellingList = useMemo(() => {
    const q = listSearchQuery.toLowerCase().trim();
    if (!q) return counsellingList;
    return counsellingList.filter(item => {
      return (
        item.patientName.toLowerCase().includes(q) ||
        item.uhid.toLowerCase().includes(q) ||
        item.hospitalName.toLowerCase().includes(q) ||
        item.counsellorName.toLowerCase().includes(q) ||
        item.plannedConsumable.toLowerCase().includes(q)
      );
    });
  }, [counsellingList, listSearchQuery]);

  // Active hospital
  const currentHospital = useMemo(() => {
    return hospitals.find(h => h.id === selectedHospitalId) || hospitals[0] || null;
  }, [hospitals, selectedHospitalId]);

  // Action: Open New Counselling Form
  const handleOpenNewCounselling = () => {
    setSelectedPatientId('');
    setSelectedPatient(null);
    setCounsellingId('');
    setSearchQuery('');
    setEyeSelection('OD');
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setTentativeDate(nextWeek.toISOString().slice(0, 10));
    setSelectedHospitalId(hospitals[0]?.id || '');
    setCounsellorName(counsellors[0]?.name || 'Dr.A.R.Karthik, DO, DNB');
    setPlannedConsumable(consumables[0]?.name || '');
    setLensType('Foldable Toric IOL');
    setLensPower('Per Biometry');
    setSurgeryPlan('Phacoemulsification with Foldable IOL implantation under local anesthesia.');
    setPreOpInstructions(defaultPreOp);
    setIsReadOnly(false);
    setViewMode('form');
  };

  // Action: Select existing Counselling line item from list
  const handleSelectExistingItem = (record: CounsellingRecord) => {
    setSelectedPatientId(record.patientId);
    setCounsellingId(record.id);
    setEyeSelection(record.eyeSelection);
    setTentativeDate(record.tentativeSurgeryDate);
    setSelectedHospitalId(record.hospitalId);
    setCounsellorName(record.counsellorName);
    setPlannedConsumable(record.plannedConsumable);
    setLensType(record.lensType || 'Foldable Toric IOL');
    setLensPower(record.lensPower || 'Per Biometry');
    setSurgeryPlan(record.surgeryPlan);
    setPreOpInstructions(record.preOpInstructions);
    setIsReadOnly(true);
    setViewMode('form');
  };

  // Action: Save Counselling
  const handleSaveCounselling = async () => {
    if (!selectedPatient) return;
    setIsSaving(true);
    try {
      const record = await ApiClient.saveCounsellingRecord(
        {
          id: counsellingId || undefined,
          patientId: selectedPatient.id,
          uhid: selectedPatient.uhid || selectedPatient.id,
          patientName: selectedPatient.name,
          eyeSelection,
          tentativeSurgeryDate: tentativeDate,
          hospitalId: currentHospital?.id || '',
          hospitalName: currentHospital?.name || 'Leela Eye Clinic',
          hospitalAddressLine1: currentHospital?.addressLine1,
          hospitalAddressLine2: currentHospital?.addressLine2,
          hospitalPhone: currentHospital?.phone,
          counsellorName,
          plannedConsumable,
          lensType,
          lensPower,
          surgeryPlan,
          preOpInstructions,
        },
        currentUser
      );
      setCounsellingId(record.id);
      setIsReadOnly(true); // Form becomes read-only after saving!
      setSaveStatus('Counselling plan saved successfully!');
      setTimeout(() => setSaveStatus(null), 3500);

      const records = await ApiClient.getCounsellingRecords();
      setCounsellingList(records);
    } catch (err) {
      console.error('Failed to save counselling plan', err);
      setSaveStatus('Error saving counselling plan.');
    } finally {
      setIsSaving(false);
    }
  };

  // Action: Delete Counselling Record from list
  const handleDeleteCounselling = async (recordId: string, patientName: string) => {
    if (window.confirm(`Are you sure you want to delete the counselling plan for ${patientName}?`)) {
      await ApiClient.deleteCounsellingRecord(recordId, currentUser);
      const records = await ApiClient.getCounsellingRecords();
      setCounsellingList(records);
    }
  };

  // Action: Print Admission Letter from List
  const handlePrintFromList = (record: CounsellingRecord) => {
    const patientMatch = patients.find(p => p.id === record.patientId || p.uhid === record.uhid);
    if (!patientMatch) {
      const fallbackPatient: Patient = {
        id: record.patientId,
        uhid: record.uhid,
        name: record.patientName,
        age: 0,
        gender: 'Male',
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };
      setPrintPatient(fallbackPatient);
    } else {
      setPrintPatient(patientMatch);
    }
    setPrintCounsellingRecord(record);
    setIsPrintModalOpen(true);
  };

  // Action: Generate Discharge Summary from List
  const handleDischargeFromList = (record: CounsellingRecord) => {
    const patientMatch = patients.find(p => p.id === record.patientId || p.uhid === record.uhid);
    if (!patientMatch) {
      const fallbackPatient: Patient = {
        id: record.patientId,
        uhid: record.uhid,
        name: record.patientName,
        age: 0,
        gender: 'Male',
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };
      setPrintPatient(fallbackPatient);
    } else {
      setPrintPatient(patientMatch);
    }
    setPrintCounsellingRecord(record);
    setIsDischargeModalOpen(true);
  };

  // Build current snapshot for form print
  const currentCounsellingSnapshot: CounsellingRecord = {
    id: counsellingId || 'draft',
    patientId: selectedPatient?.id || '',
    uhid: selectedPatient?.uhid || selectedPatient?.id || '',
    patientName: selectedPatient?.name || '',
    eyeSelection,
    tentativeSurgeryDate: tentativeDate,
    hospitalId: currentHospital?.id || '',
    hospitalName: currentHospital?.name || 'Leela Eye Clinic',
    hospitalAddressLine1: currentHospital?.addressLine1,
    hospitalAddressLine2: currentHospital?.addressLine2,
    hospitalPhone: currentHospital?.phone,
    counsellorName,
    plannedConsumable,
    lensType,
    lensPower,
    surgeryPlan,
    preOpInstructions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 select-none">
      {/* Toast Notification */}
      {saveStatus && (
        <div className="fixed top-14 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-blue-900 text-white text-xs font-semibold rounded-xl shadow-xl border border-blue-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* VIEW 1: COUNSELLING PLAN LIST (Default view when opening module) */}
      {viewMode === 'list' && (
        <div className="space-y-5">
          {/* Top Header Banner with New Counselling Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CBD8E4]">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Counselling
                </h1>
                <span className="text-xs font-semibold text-blue-900 bg-blue-100/90 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {counsellingList.length} {counsellingList.length === 1 ? 'Plan' : 'Plans'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenNewCounselling}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Counselling</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="bg-[#F2F7FA] p-3 rounded-xl border border-[#CBD8E4] shadow-xs flex items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={listSearchQuery}
                onChange={e => setListSearchQuery(e.target.value)}
                placeholder="Search counselling plans by Patient, UHID, or Hospital..."
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-[#CBD8E4] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-800"
              />
            </div>
            <span className="text-xs text-slate-500">
              Showing {filteredCounsellingList.length} records
            </span>
          </div>

          {/* Counselling Plans Table */}
          <div className="bg-white rounded-2xl border border-[#CBD8E4] shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-3.5 px-4">Patient Name & UHID</th>
                  <th className="py-3.5 px-4">Eye</th>
                  <th className="py-3.5 px-4">Tentative Date</th>
                  <th className="py-3.5 px-4">Hospital</th>
                  <th className="py-3.5 px-4">Counsellor</th>
                  <th className="py-3.5 px-4">Planned Consumable</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCounsellingList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">No counselling records found</p>
                      <button
                        onClick={handleOpenNewCounselling}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 rounded-lg cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Create New Counselling Plan
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredCounsellingList.map(record => (
                    <tr
                      key={record.id}
                      onClick={() => handleSelectExistingItem(record)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                    >
                      {/* Patient Name & UHID */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-blue-700">
                          {record.patientName}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400">
                          UHID: {record.uhid}
                        </div>
                      </td>

                      {/* Eye */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[11px]">
                          {record.eyeSelection === 'Both'
                            ? 'Both Eyes'
                            : record.eyeSelection === 'OD'
                            ? 'OD (Left)'
                            : 'OS (Right)'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {record.tentativeSurgeryDate || '—'}
                      </td>

                      {/* Hospital */}
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {record.hospitalName}
                      </td>

                      {/* Counsellor */}
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {record.counsellorName}
                      </td>

                      {/* Consumable */}
                      <td className="py-3.5 px-4 text-slate-600 truncate max-w-xs">
                        {record.plannedConsumable}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSelectExistingItem(record)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded border border-slate-200 transition-colors cursor-pointer"
                            title="View and Edit plan"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handlePrintFromList(record)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="Generate Admission letter"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDischargeFromList(record)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                            title="Generate discharge summary"
                          >
                            <HeartPulse className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCounselling(record.id, record.patientName)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: COUNSELLING FORM (New or View/Edit Existing) */}
      {viewMode === 'form' && (
        <div className="space-y-6">
          {/* Top Form Header with Back and Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CBD8E4]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('list')}
                className="w-8 h-8 rounded-lg bg-white border border-[#CBD8E4] flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Back to Counselling List"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  {selectedPatient ? selectedPatient.name : 'New Counselling Session'}
                </h1>
                <p className="text-xs text-slate-500">
                  {isReadOnly ? 'Viewing Counselling Plan (Read-Only)' : 'Editing Counselling Details'}
                </p>
              </div>
            </div>

            {/* Actions: Edit toggle / Print */}
            <div className="flex items-center gap-2.5">
              {isReadOnly && (
                <button
                  type="button"
                  onClick={() => setIsReadOnly(false)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-[#CBD8E4] rounded-lg shadow-xs transition-colors cursor-pointer"
                  title="Make changes to this counselling record"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Edit</span>
                </button>
              )}

              {selectedPatient && (
                <button
                  type="button"
                  onClick={() => {
                    setPrintPatient(selectedPatient);
                    setPrintCounsellingRecord(currentCounsellingSnapshot);
                    setIsPrintModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Admission Letter</span>
                </button>
              )}
            </div>
          </div>

          {/* STEP 1: PATIENT SEARCH & SELECTION (only shown if not read-only or no patient yet) */}
          {!isReadOnly && !selectedPatient && (
            <div className="bg-[#F2F7FA] p-5 rounded-2xl border border-[#CBD8E4] shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  1
                </div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Patient Search & Selection
                </h2>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search registered patient by Name, UHID, or Mobile..."
                  className="w-full pl-10 pr-24 py-2.5 text-xs bg-white border border-[#CBD8E4] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Clear
                  </button>
                )}

                {/* Autocomplete Dropdown */}
                {searchQuery.trim().length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-[#CBD8E4] z-30 max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {searchResults.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No registered patients found matching "{searchQuery}"
                      </div>
                    ) : (
                      searchResults.map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedPatientId(p.id);
                            setSearchQuery('');
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-blue-50/70 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-900">{p.name}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-blue-900 font-medium">{p.uhid || p.id}</span>
                              <span>•</span>
                              <span>{p.gender}, {p.age} yrs</span>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                              p.isInsured
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {p.isInsured ? 'Insured' : 'Self-Pay'}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Quick Select Buttons */}
              <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                <span className="text-[11px] font-semibold text-slate-500">Quick Select:</span>
                {patients.slice(0, 5).map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-[#CBD8E4] hover:bg-blue-50/60 hover:border-blue-300 transition-all cursor-pointer"
                  >
                    {p.name} ({p.uhid || p.id})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: PATIENT DETAILS CARD (Registration details) */}
          {selectedPatient && (
            <div className="bg-white rounded-2xl border border-[#CBD8E4] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-800 font-bold text-lg flex items-center justify-center border border-blue-200">
                    {selectedPatient.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900">{selectedPatient.name}</h3>
                      <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        MRD / UHID: {selectedPatient.uhid || selectedPatient.id}
                      </span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                          selectedPatient.isInsured
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {selectedPatient.isInsured ? 'Insured Patient' : 'Non-Insured (Self-Pay)'}
                      </span>
                    </div>
                  </div>
                </div>

                {!isReadOnly && (
                  <button
                    onClick={() => setSelectedPatientId('')}
                    className="text-xs text-slate-400 hover:text-slate-700 underline cursor-pointer"
                  >
                    Change Patient
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Age & Gender
                  </span>
                  <span className="font-semibold text-slate-800 mt-1 block">
                    {selectedPatient.age} yrs • {selectedPatient.gender}
                  </span>
                </div>

                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Contact Phone
                  </span>
                  <span className="font-semibold text-slate-800 mt-1 block flex items-center gap-1 font-mono">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {selectedPatient.mobileNo || 'Not recorded'}
                  </span>
                </div>

                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200 col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Residential Address
                  </span>
                  <span className="font-medium text-slate-700 mt-1 block truncate">
                    {selectedPatient.address || 'Address not registered'}
                  </span>
                </div>

                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Attending Doctor
                  </span>
                  <span className="font-semibold text-slate-800 mt-1 block truncate">
                    {selectedPatient.attendingDoctor || 'Dr. Karthik Raman'}
                  </span>
                </div>

                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Registered Eye
                  </span>
                  <span className="font-semibold text-slate-800 mt-1 block">
                    {selectedPatient.eye || 'Both (OU)'}
                  </span>
                </div>
              </div>

              {/* Drug Allergy Alert */}
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                  selectedPatient.drugAllergies &&
                  !selectedPatient.drugAllergies.toLowerCase().includes('none') &&
                  !selectedPatient.drugAllergies.toLowerCase().includes('nil')
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-slate-600" />
                <div>
                  <span className="font-bold">Drug Allergies: </span>
                  <span>{selectedPatient.drugAllergies || 'Nil reported'}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: COUNSELLING MODULE FORM */}
          {selectedPatient && (
            <div className="bg-white rounded-2xl border border-[#CBD8E4] p-6 shadow-xs space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
                {/* Field 1: Eye Selection */}
                <div className="space-y-2">
                  <label className="block font-bold text-slate-800">
                    Eye for Surgery <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => setEyeSelection('OD')}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isReadOnly ? 'cursor-default' : 'cursor-pointer'
                      } ${
                        eyeSelection === 'OD'
                          ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                          : 'bg-[#F8FAFC] text-slate-700 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-xs font-bold">OD</div>
                      <div className={`text-[10px] mt-0.5 ${eyeSelection === 'OD' ? 'text-blue-100' : 'text-slate-500'}`}>
                        Left Eye
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => setEyeSelection('OS')}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isReadOnly ? 'cursor-default' : 'cursor-pointer'
                      } ${
                        eyeSelection === 'OS'
                          ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                          : 'bg-[#F8FAFC] text-slate-700 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-xs font-bold">OS</div>
                      <div className={`text-[10px] mt-0.5 ${eyeSelection === 'OS' ? 'text-blue-100' : 'text-slate-500'}`}>
                        Right Eye
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => setEyeSelection('Both')}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isReadOnly ? 'cursor-default' : 'cursor-pointer'
                      } ${
                        eyeSelection === 'Both'
                          ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                          : 'bg-[#F8FAFC] text-slate-700 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-xs font-bold">Both Eyes</div>
                      <div className={`text-[10px] mt-0.5 ${eyeSelection === 'Both' ? 'text-blue-100' : 'text-slate-500'}`}>
                        OD & OS
                      </div>
                    </button>
                  </div>
                </div>

                {/* Field 2: Tentative Date of Surgery */}
                <div className="space-y-2">
                  <label className="block font-bold text-slate-800">
                    Tentative Date of Surgery <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="date"
                      disabled={isReadOnly}
                      value={tentativeDate}
                      onChange={e => setTentativeDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-800 text-xs disabled:opacity-75"
                    />
                  </div>
                </div>

                {/* Field 3: Tentative Hospital (Dropdown from settings) */}
                <div className="space-y-2">
                  <label className="block font-bold text-slate-800">
                    Tentative Hospital <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <select
                      disabled={isReadOnly}
                      value={selectedHospitalId}
                      onChange={e => setSelectedHospitalId(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-800 text-xs disabled:opacity-75"
                    >
                      {hospitals.map(h => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.addressLine2 || h.addressLine1})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Field 4: Counsellor Name (Dropdown from settings) */}
                <div className="space-y-2">
                  <label className="block font-bold text-slate-800">
                    Counsellor Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <select
                      disabled={isReadOnly}
                      value={counsellorName}
                      onChange={e => setCounsellorName(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-800 text-xs disabled:opacity-75"
                    >
                      {counsellors.map(c => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Field 5: Planned Consumable (Dropdown from settings) */}
                <div className="space-y-2">
                  <label className="block font-bold text-slate-800">
                    Planned Consumable <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Package className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <select
                      disabled={isReadOnly}
                      value={plannedConsumable}
                      onChange={e => setPlannedConsumable(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-800 text-xs disabled:opacity-75"
                    >
                      {consumables.map(c => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* IOL Details (Lens Type & Power) */}
                <div className="space-y-2">
                  <label className="block font-bold text-slate-800">
                    Lens Type & Power (Biometry)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={lensType}
                      onChange={e => setLensType(e.target.value)}
                      placeholder="Lens Type"
                      className="w-full px-2.5 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs disabled:opacity-75"
                    />
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={lensPower}
                      onChange={e => setLensPower(e.target.value)}
                      placeholder="Power"
                      className="w-full px-2.5 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs disabled:opacity-75"
                    />
                  </div>
                </div>
              </div>

              {/* Field 6: Surgery Plan */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block font-bold text-slate-800">
                  Surgery Plan
                </label>
                <textarea
                  rows={4}
                  disabled={isReadOnly}
                  value={surgeryPlan}
                  onChange={e => setSurgeryPlan(e.target.value)}
                  placeholder="Detail surgical plan, technique, anesthesia, planned toric axis, incisional width, ocular viscoelastic devices..."
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs text-slate-800 leading-relaxed font-sans disabled:opacity-75"
                />
              </div>

              {/* Field 7: Pre-op Instructions */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block font-bold text-slate-800">
                  Pre-Operative Instructions
                </label>
                <textarea
                  rows={4}
                  disabled={isReadOnly}
                  value={preOpInstructions}
                  onChange={e => setPreOpInstructions(e.target.value)}
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs text-slate-800 leading-relaxed font-sans disabled:opacity-75"
                />
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Counselling List</span>
                </button>

                <div className="flex items-center gap-3">
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={handleSaveCounselling}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSaving ? 'Saving...' : 'Save Counselling Plan'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setPrintPatient(selectedPatient);
                      setPrintCounsellingRecord(currentCounsellingSnapshot);
                      setIsPrintModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Generate Admission letter</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPrintPatient(selectedPatient);
                      setPrintCounsellingRecord(currentCounsellingSnapshot);
                      setIsDischargeModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    <HeartPulse className="w-4 h-4" />
                    <span>Generate discharge summary</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admission Letter Print Modal */}
      {printPatient && printCounsellingRecord && (
        <AdmissionLetterPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          patient={printPatient}
          counselling={printCounsellingRecord}
          hospital={hospitals.find(h => h.id === printCounsellingRecord.hospitalId) || currentHospital}
        />
      )}

      {/* Discharge Summary & Post-Op Care Print Modal */}
      {printPatient && printCounsellingRecord && (
        <DischargeSummaryPrintModal
          isOpen={isDischargeModalOpen}
          onClose={() => setIsDischargeModalOpen(false)}
          patient={printPatient}
          counselling={printCounsellingRecord}
          hospital={hospitals.find(h => h.id === printCounsellingRecord.hospitalId) || currentHospital}
        />
      )}
    </div>
  );
};
