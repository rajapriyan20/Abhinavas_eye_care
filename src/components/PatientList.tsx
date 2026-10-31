import React, { useState, useMemo } from 'react';
import { Patient, User } from '../types';
import { ApiClient } from '../api/client';
import {
  UserPlus,
  Search,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  X,
  Check,
  Eye,
  Trash2,
  Edit3,
  Plus,
  Tag,
  HeartHandshake,
} from 'lucide-react';

interface PatientListProps {
  patients: Patient[];
  currentUser: User;
  onRefresh: () => void;
  onNavigateToCounselling?: (patientId: string) => void;
}

const COMMON_DRUG_ALLERGIES = [
  'Penicillin',
  'Sulfa drugs',
  'Aspirin / NSAIDs',
  'Ciprofloxacin',
  'Tropicamide',
  'Latex',
];

export const PatientList: React.FC<PatientListProps> = ({
  patients,
  currentUser,
  onRefresh,
  onNavigateToCounselling,
}) => {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [insuranceFilter, setInsuranceFilter] = useState<'all' | 'insured' | 'non-insured'>('all');

  // Modal states
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const [editAllergiesList, setEditAllergiesList] = useState<string[]>([]);
  const [editAllergyInput, setEditAllergyInput] = useState('');
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  // Registration Form State
  const [formData, setFormData] = useState({
    name: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    dob: '',
    age: '',
    uhid: '',
    address: '',
    mobileNo: '',
    isInsured: false,
    notes: '',
  });

  // Drug allergies list state for registration form
  const [allergiesList, setAllergiesList] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Auto-calculate age from DOB if user enters DOB
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dobValue = e.target.value;
    setFormData(prev => {
      let calculatedAge = prev.age;
      if (dobValue) {
        const birthDate = new Date(dobValue);
        if (!isNaN(birthDate.getTime())) {
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          if (age >= 0 && age <= 130) {
            calculatedAge = String(age);
          }
        }
      }
      return {
        ...prev,
        dob: dobValue,
        age: calculatedAge,
      };
    });
  };

  // Add allergy to registration list
  const handleAddAllergy = (allergyName: string) => {
    const trimmed = allergyName.trim();
    if (!trimmed) return;
    if (!allergiesList.some(item => item.toLowerCase() === trimmed.toLowerCase())) {
      setAllergiesList(prev => [...prev, trimmed]);
    }
    setAllergyInput('');
  };

  // Remove allergy from registration list
  const handleRemoveAllergy = (index: number) => {
    setAllergiesList(prev => prev.filter((_, i) => i !== index));
  };

  // Add allergy to edit list
  const handleAddEditAllergy = (allergyName: string) => {
    const trimmed = allergyName.trim();
    if (!trimmed) return;
    if (!editAllergiesList.some(item => item.toLowerCase() === trimmed.toLowerCase())) {
      setEditAllergiesList(prev => [...prev, trimmed]);
    }
    setEditAllergyInput('');
  };

  const handleRemoveEditAllergy = (index: number) => {
    setEditAllergiesList(prev => prev.filter((_, i) => i !== index));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      gender: 'Male',
      dob: '',
      age: '',
      uhid: '',
      address: '',
      mobileNo: '',
      isInsured: false,
      notes: '',
    });
    setAllergiesList([]);
    setAllergyInput('');
    setFormError(null);
  };

  // Submit registration form
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // ONLY Name is mandatory!
    if (!formData.name.trim()) {
      setFormError('Patient Name is mandatory');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedAge = formData.age.trim() ? parseInt(formData.age, 10) : undefined;
      const formattedAllergies = allergiesList.length > 0 ? allergiesList.join(', ') : undefined;

      await ApiClient.registerPatient(
        {
          name: formData.name.trim(),
          gender: formData.gender,
          dob: formData.dob.trim() || undefined,
          age: !isNaN(Number(parsedAge)) ? parsedAge : undefined,
          uhid: formData.uhid.trim() || undefined,
          address: formData.address.trim() || undefined,
          mobileNo: formData.mobileNo.trim() || undefined,
          isInsured: formData.isInsured,
          drugAllergies: formattedAllergies,
          notes: formData.notes.trim() || undefined,
        },
        currentUser
      );

      setIsRegisterModalOpen(false);
      resetForm();
      onRefresh();

      setSuccessToast(`Patient "${formData.name.trim()}" registered successfully!`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch {
      setFormError('Failed to register patient. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (patient: Patient) => {
    setPatientToEdit({ ...patient });
    if (patient.drugAllergies && patient.drugAllergies.trim()) {
      const parsed = patient.drugAllergies
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      setEditAllergiesList(parsed);
    } else {
      setEditAllergiesList([]);
    }
    setEditAllergyInput('');
    setIsEditModalOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientToEdit) return;

    if (!patientToEdit.name.trim()) {
      setFormError('Patient Name is mandatory');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedAllergies = editAllergiesList.length > 0 ? editAllergiesList.join(', ') : undefined;

      await ApiClient.updatePatient(
        patientToEdit.id,
        {
          name: patientToEdit.name.trim(),
          gender: patientToEdit.gender,
          dob: patientToEdit.dob || undefined,
          age: patientToEdit.age,
          uhid: patientToEdit.uhid || undefined,
          address: patientToEdit.address || undefined,
          mobileNo: patientToEdit.mobileNo || undefined,
          isInsured: patientToEdit.isInsured,
          drugAllergies: formattedAllergies,
        },
        [
          { field: 'name', from: 'Previous', to: patientToEdit.name.trim() },
          { field: 'updatedRegistration', from: 'Old Data', to: 'New Profile' },
        ],
        'Updated Patient Profile',
        currentUser
      );

      setIsEditModalOpen(false);
      setPatientToEdit(null);
      onRefresh();
      setSuccessToast(`Patient details updated successfully!`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch {
      setFormError('Failed to update patient details');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDeletePatient = async () => {
    if (!patientToDelete) return;
    try {
      await ApiClient.deletePatient(patientToDelete.id, currentUser);
      setPatientToDelete(null);
      if (selectedPatient?.id === patientToDelete.id) {
        setSelectedPatient(null);
      }
      onRefresh();
      setSuccessToast(`Patient record removed.`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch {
      // error
    }
  };

  // Format Registration Date
  const formatRegistrationDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Filtered patients
  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        patient.name.toLowerCase().includes(q) ||
        (patient.uhid && patient.uhid.toLowerCase().includes(q)) ||
        (patient.gender && patient.gender.toLowerCase().includes(q)) ||
        (patient.mobileNo && patient.mobileNo.toLowerCase().includes(q));

      let matchesInsurance = true;
      if (insuranceFilter === 'insured') {
        matchesInsurance = patient.isInsured === true;
      } else if (insuranceFilter === 'non-insured') {
        matchesInsurance = patient.isInsured === false || patient.isInsured === undefined;
      }

      return matchesSearch && matchesInsurance;
    });
  }, [patients, searchQuery, insuranceFilter]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 select-none">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-14 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-blue-900 text-white text-xs font-semibold rounded-xl shadow-xl border border-blue-700 animate-in fade-in slide-in-from-top-3">
          <Check className="w-4 h-4 text-sky-300" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Header: Title, Total Count, and Patient Registration Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CBD8E4]">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Patient List
            </h1>
            <span className="text-xs font-semibold text-blue-900 bg-blue-100/90 px-2.5 py-0.5 rounded-full border border-blue-200">
              {filteredPatients.length} {filteredPatients.length === 1 ? 'Patient' : 'Patients'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hospital master patient records and medical registrations
          </p>
        </div>

        {/* Top Patient Registration Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              resetForm();
              setIsRegisterModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer hover:shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            <span>Patient Registration</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-[#F2F7FA] p-3 rounded-xl border border-[#CBD8E4] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Patient Name or UHID..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-[#E5EFF6] focus:bg-white border border-[#CBD8E4] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-800 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Insurance Filter */}
        <div className="flex items-center p-0.5 bg-[#D4E1ED] rounded-lg text-xs font-medium">
          <button
            onClick={() => setInsuranceFilter('all')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              insuranceFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setInsuranceFilter('insured')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              insuranceFilter === 'insured'
                ? 'bg-white text-blue-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Insurance
          </button>
          <button
            onClick={() => setInsuranceFilter('non-insured')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              insuranceFilter === 'non-insured'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Non-Insurance
          </button>
        </div>
      </div>

      {/* Patient List Table: ONLY Patient Name, Gender, Age, Insurance Status, Date of Registration */}
      <div className="bg-[#F2F7FA] rounded-xl border border-[#CBD8E4] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#E1EAF2] border-b border-[#CBD8E4] text-slate-700 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-5">Patient Name</th>
                <th className="py-3.5 px-5">Gender</th>
                <th className="py-3.5 px-5">Age</th>
                <th className="py-3.5 px-5">Insurance Status</th>
                <th className="py-3.5 px-5">Date of Registration</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1EAF2]">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <UserPlus className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm font-medium text-slate-700">No patients found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {searchQuery || insuranceFilter !== 'all'
                        ? 'Try clearing the search or filter.'
                        : 'Click "Patient Registration" at the top to register a patient.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPatients.map(patient => {
                  return (
                    <tr
                      key={patient.id}
                      className="hover:bg-[#EAF0F6]/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedPatient(patient)}
                    >
                      {/* 1. Patient Name */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                            {patient.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">
                              {patient.name}
                            </div>
                            {patient.uhid && (
                              <div className="text-[10px] text-slate-500 font-mono">
                                UHID: {patient.uhid}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Gender */}
                      <td className="py-3.5 px-5">
                        <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-[#E1EAF2] text-slate-800 border border-[#CBD8E4]">
                          {patient.gender || '—'}
                        </span>
                      </td>

                      {/* 3. Age (Not the DOB!) */}
                      <td className="py-3.5 px-5">
                        <span className="text-slate-900 font-medium text-sm">
                          {patient.age !== undefined && patient.age > 0 ? `${patient.age} yrs` : '—'}
                        </span>
                      </td>

                      {/* 4. Insurance Status */}
                      <td className="py-3.5 px-5">
                        {patient.isInsured ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                            <ShieldCheck className="w-3 h-3 text-blue-700 shrink-0" />
                            <span>Insurance</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <span>Non-Insurance</span>
                          </span>
                        )}
                      </td>

                      {/* 5. Date of Registration */}
                      <td className="py-3.5 px-5 text-slate-700">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatRegistrationDate(patient.createdAt)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={e => e.stopPropagation()}
                        >
                          {onNavigateToCounselling && (
                            <button
                              onClick={() => onNavigateToCounselling(patient.id)}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-[#D4E1ED] rounded-md transition-colors cursor-pointer"
                              title="Counselling & Surgery Planning"
                            >
                              <HeartHandshake className="w-3.5 h-3.5 text-emerald-700" />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedPatient(patient)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-[#D4E1ED] rounded-md transition-colors cursor-pointer"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(patient)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-[#D4E1ED] rounded-md transition-colors cursor-pointer"
                            title="Edit patient"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setPatientToDelete(patient)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Delete patient record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PATIENT REGISTRATION MODAL */}
      {/* ========================================================================= */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#F2F7FA] w-full max-w-xl rounded-2xl border border-[#CBD8E4] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header: Removed "Add new patient to clinical ... mandatory." */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#E1EAF2] border-b border-[#CBD8E4]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Patient Registration</h3>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsRegisterModalOpen(false);
                  resetForm();
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-[#CBD8E4]/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRegisterSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Patient Name: Only asterix, no "Required" text */}
              <div>
                <label className="block text-slate-800 font-semibold mb-1">
                  Patient Name <span className="text-rose-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Anand Kumar"
                  className="w-full px-3 py-2 bg-[#E5EFF6] focus:bg-white border border-[#CBD8E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 text-xs transition-colors"
                />
              </div>

              {/* 2. Gender & UHID (Removed "(Alphanumeric id)") */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Gender */}
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        gender: e.target.value as 'Male' | 'Female' | 'Other',
                      })
                    }
                    className="w-full px-3 py-2 bg-[#E5EFF6] focus:bg-white border border-[#CBD8E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 text-xs transition-colors"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* UHID */}
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    UHID
                  </label>
                  <input
                    type="text"
                    value={formData.uhid}
                    onChange={e => setFormData({ ...formData, uhid: e.target.value })}
                    placeholder="e.g. AEC-9840 or UHID102"
                    className="w-full px-3 py-2 bg-[#E5EFF6] focus:bg-white border border-[#CBD8E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 text-xs font-mono transition-colors"
                  />
                </div>
              </div>

              {/* 3. Date of Birth & Age (Next to each other, age auto-calculates from DOB, no "DOB" text) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Date of Birth */}
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={handleDobChange}
                    className="w-full px-3 py-2 bg-[#E5EFF6] focus:bg-white border border-[#CBD8E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 text-xs transition-colors"
                  />
                </div>

                {/* Age (Auto-shown based on DOB, next to DOB) */}
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="130"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                    placeholder="Calculated automatically or enter"
                    className="w-full px-3 py-2 bg-[#E5EFF6] focus:bg-white border border-[#CBD8E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 text-xs transition-colors"
                  />
                </div>
              </div>

              {/* 4. Mobile No & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Mobile No
                  </label>
                  <input
                    type="tel"
                    value={formData.mobileNo}
                    onChange={e => setFormData({ ...formData, mobileNo: e.target.value })}
                    placeholder="e.g. 98401 23456"
                    className="w-full px-3 py-2 bg-[#E5EFF6] focus:bg-white border border-[#CBD8E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 text-xs transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="City / residential address"
                    className="w-full px-3 py-2 bg-[#E5EFF6] focus:bg-white border border-[#CBD8E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 text-xs transition-colors"
                  />
                </div>
              </div>

              {/* 5. Reduced Size Insurance Patient Field (No help text) */}
              <div className="py-1">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isInsured}
                    onChange={e => setFormData({ ...formData, isInsured: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-[#CBD8E4] focus:ring-blue-600 cursor-pointer"
                  />
                  <span className="font-semibold text-slate-800 text-xs">
                    Insurance Patient
                  </span>
                </label>
              </div>

              {/* 6. Drug Allergy Field AS A LIST */}
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Drug Allergy
                </label>
                
                {/* Allergy Input + Add Button */}
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={allergyInput}
                    onChange={e => setAllergyInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAllergy(allergyInput);
                      }
                    }}
                    placeholder="Type drug allergy and press Enter or Add..."
                    className="flex-1 px-3 py-2 bg-[#E5EFF6] focus:bg-white border border-[#CBD8E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 text-xs transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddAllergy(allergyInput)}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {/* Quick Suggestion Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <span className="text-[10px] text-slate-400 font-medium">Quick add:</span>
                  {COMMON_DRUG_ALLERGIES.map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleAddAllergy(item)}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#E1EAF2] hover:bg-[#D4E1ED] text-slate-700 border border-[#CBD8E4] transition-colors cursor-pointer"
                    >
                      + {item}
                    </button>
                  ))}
                </div>

                {/* Displayed Drug Allergies List */}
                {allergiesList.length > 0 ? (
                  <div className="p-2.5 bg-[#E1EAF2]/60 rounded-xl border border-[#CBD8E4] flex flex-wrap gap-1.5">
                    {allergiesList.map((allergy, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200"
                      >
                        <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                        <span>{allergy}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAllergy(index)}
                          className="text-rose-500 hover:text-rose-800 hover:bg-rose-100 rounded p-0.5 transition-colors cursor-pointer"
                          title="Remove allergy"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-2 text-[11px] text-slate-400 italic bg-[#E5EFF6]/60 rounded-lg border border-dashed border-[#CBD8E4]">
                    No drug allergies added to list (Optional).
                  </div>
                )}
              </div>

              {/* Removed the note at the end saying "Only the name ..." */}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#CBD8E4]">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-[#CBD8E4]/60 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Registering...' : 'Register Patient'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PATIENT DETAILS MODAL */}
      {/* ========================================================================= */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#F2F7FA] w-full max-w-lg rounded-2xl border border-[#CBD8E4] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#E1EAF2] border-b border-[#CBD8E4]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {selectedPatient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedPatient.name}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <span>UHID: {selectedPatient.uhid || 'Not assigned'}</span>
                    <span>•</span>
                    <span>ID: {selectedPatient.id}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-[#CBD8E4]/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Details */}
            <div className="p-6 space-y-4 text-xs overflow-y-auto">
              {/* Demographics Grid */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#E1EAF2]/60 rounded-xl border border-[#CBD8E4]">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Gender</span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {selectedPatient.gender || 'Not specified'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Age / Date of Birth</span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {selectedPatient.age !== undefined && selectedPatient.age > 0 ? `${selectedPatient.age} years` : 'Not recorded'}
                    {selectedPatient.dob ? ` (${selectedPatient.dob})` : ''}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Mobile Number</span>
                  <p className="font-semibold text-slate-900 mt-0.5 font-mono">
                    {selectedPatient.mobileNo || 'Not recorded'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Insurance</span>
                  <div className="mt-0.5">
                    {selectedPatient.isInsured ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                        <ShieldCheck className="w-3 h-3 text-blue-700" />
                        <span>Insurance Covered</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        <span>Non-Insurance</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Drug Allergies List */}
              <div className="p-3 bg-[#E1EAF2]/60 rounded-xl border border-[#CBD8E4]">
                <div className="flex items-center gap-1.5 font-semibold text-xs mb-2 text-slate-800">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Drug Allergies</span>
                </div>
                {selectedPatient.drugAllergies && selectedPatient.drugAllergies.trim() ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPatient.drugAllergies.split(',').map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200"
                      >
                        <Tag className="w-3 h-3 text-rose-500" />
                        <span>{item.trim()}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No drug allergies reported.</p>
                )}
              </div>

              {/* Address */}
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                  Residential Address
                </span>
                <p className="p-3 bg-[#E1EAF2]/60 rounded-xl border border-[#CBD8E4] text-slate-800">
                  {selectedPatient.address || 'Address not recorded.'}
                </p>
              </div>

              {/* Date of Registration */}
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                  Date of Registration
                </span>
                <p className="p-2.5 bg-[#E1EAF2]/60 rounded-xl border border-[#CBD8E4] text-slate-800 font-medium">
                  {formatRegistrationDate(selectedPatient.createdAt)}
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#E1EAF2] border-t border-[#CBD8E4]">
              <button
                onClick={() => setPatientToDelete(selectedPatient)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-rose-700 hover:text-rose-900 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  {onNavigateToCounselling && (
                    <button
                      onClick={() => {
                        const pid = selectedPatient.id;
                        setSelectedPatient(null);
                        onNavigateToCounselling(pid);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <HeartHandshake className="w-3.5 h-3.5" />
                      <span>Counselling & Admission</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleOpenEdit(selectedPatient);
                    }}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-blue-900 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-[#CBD8E4] rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT PATIENT MODAL */}
      {/* ========================================================================= */}
      {isEditModalOpen && patientToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#F2F7FA] w-full max-w-xl rounded-2xl border border-[#CBD8E4] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-[#E1EAF2] border-b border-[#CBD8E4]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Edit Patient Profile</h3>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setPatientToEdit(null);
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-800 font-semibold mb-1">
                  Patient Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={patientToEdit.name}
                  onChange={e => setPatientToEdit({ ...patientToEdit, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#E5EFF6] focus:bg-white border border-[#CBD8E4] rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Gender</label>
                  <select
                    value={patientToEdit.gender || 'Other'}
                    onChange={e =>
                      setPatientToEdit({
                        ...patientToEdit,
                        gender: e.target.value as 'Male' | 'Female' | 'Other',
                      })
                    }
                    className="w-full px-3 py-2 bg-[#E5EFF6] focus:bg-white border border-[#CBD8E4] rounded-lg text-slate-900"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">UHID</label>
                  <input
                    type="text"
                    value={patientToEdit.uhid || ''}
                    onChange={e => setPatientToEdit({ ...patientToEdit, uhid: e.target.value })}
                    className="w-full px-3 py-2 bg-[#E5EFF6] focus:bg-white border border-[#CBD8E4] rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={patientToEdit.dob || ''}
                    onChange={e => {
                      const dobVal = e.target.value;
                      let calculatedAge = patientToEdit.age;
                      if (dobVal) {
                        const birthDate = new Date(dobVal);
                        if (!isNaN(birthDate.getTime())) {
                          const today = new Date();
                          let age = today.getFullYear() - birthDate.getFullYear();
                          const monthDiff = today.getMonth() - birthDate.getMonth();
                          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                            age--;
                          }
                          if (age >= 0 && age <= 130) {
                            calculatedAge = age;
                          }
                        }
                      }
                      setPatientToEdit({
                        ...patientToEdit,
                        dob: dobVal,
                        age: calculatedAge,
                      });
                    }}
                    className="w-full px-3 py-2 bg-[#E5EFF6] focus:bg-white border border-[#CBD8E4] rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Age</label>
                  <input
                    type="number"
                    value={patientToEdit.age ?? ''}
                    onChange={e =>
                      setPatientToEdit({
                        ...patientToEdit,
                        age: e.target.value ? parseInt(e.target.value, 10) : 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#E5EFF6] focus:bg-white border border-[#CBD8E4] rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Mobile No</label>
                  <input
                    type="tel"
                    value={patientToEdit.mobileNo || ''}
                    onChange={e => setPatientToEdit({ ...patientToEdit, mobileNo: e.target.value })}
                    className="w-full px-3 py-2 bg-[#E5EFF6] focus:bg-white border border-[#CBD8E4] rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Address</label>
                  <input
                    type="text"
                    value={patientToEdit.address || ''}
                    onChange={e => setPatientToEdit({ ...patientToEdit, address: e.target.value })}
                    className="w-full px-3 py-2 bg-[#E5EFF6] focus:bg-white border border-[#CBD8E4] rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="py-1">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={patientToEdit.isInsured ?? false}
                    onChange={e =>
                      setPatientToEdit({ ...patientToEdit, isInsured: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="font-semibold text-slate-800 text-xs">Insurance Patient</span>
                </label>
              </div>

              {/* Drug Allergy List in Edit */}
              <div>
                <label className="block text-slate-700 font-medium mb-1">Drug Allergy</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={editAllergyInput}
                    onChange={e => setEditAllergyInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEditAllergy(editAllergyInput);
                      }
                    }}
                    placeholder="Type drug allergy and press Enter..."
                    className="flex-1 px-3 py-2 bg-[#E5EFF6] focus:bg-white border border-[#CBD8E4] rounded-lg text-slate-900 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddEditAllergy(editAllergyInput)}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                {editAllergiesList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-[#E1EAF2]/60 rounded-xl border border-[#CBD8E4]">
                    {editAllergiesList.map((allergy, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200"
                      >
                        <span>{allergy}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEditAllergy(idx)}
                          className="text-rose-500 hover:text-rose-800 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#CBD8E4]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {patientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#F2F7FA] w-full max-w-sm rounded-2xl border border-[#CBD8E4] shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Delete Patient Record</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong>{patientToDelete.name}</strong> from the
                patient registry? This action will be audited.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPatientToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#CBD8E4]/60 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePatient}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-xs cursor-pointer"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
