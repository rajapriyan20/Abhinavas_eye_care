import React, { useState, useEffect, useMemo } from 'react';
import {
  Bill,
  Receipt,
  Patient,
  User,
  CounsellingRecord,
  BillItem,
  PaymentMode,
  BillPaymentStatus,
  PatientBillingSummary,
  Estimate,
  EstimateStatus,
  ConsumableSetting,
  BillItemCategory,
} from '../../types';
import { ApiClient } from '../../api/client';
import { BillPrintModal } from './BillPrintModal';
import { ReceiptPrintModal } from './ReceiptPrintModal';
import { BillingSummaryPrintModal } from './BillingSummaryPrintModal';
import { EstimatePrintModal } from './EstimatePrintModal';
import {
  Receipt as ReceiptIcon,
  Plus,
  Search,
  Printer,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileText,
  UserCheck,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Calendar,
  X,
  Calculator,
  RefreshCw,
  Package,
} from 'lucide-react';

interface BillingModuleProps {
  currentUser: User;
  patients: Patient[];
  onNavigateToSettings?: () => void;
}

export const BillingModule: React.FC<BillingModuleProps> = ({
  currentUser,
  patients,
  onNavigateToSettings,
}) => {
  // Tab state: 'estimates' before 'bills' as requested
  const [activeTab, setActiveTab] = useState<'estimates' | 'bills' | 'receipts' | 'summary'>('estimates');
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [counsellingRecords, setCounsellingRecords] = useState<CounsellingRecord[]>([]);
  const [consumablesRateCard, setConsumablesRateCard] = useState<ConsumableSetting[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');

  // Print Modals
  const [selectedEstimateForPrint, setSelectedEstimateForPrint] = useState<Estimate | null>(null);
  const [selectedBillForPrint, setSelectedBillForPrint] = useState<Bill | null>(null);
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<Receipt | null>(null);
  const [selectedSummaryForPrint, setSelectedSummaryForPrint] = useState<PatientBillingSummary | null>(null);

  // Modals for Create / Edit
  const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState<Estimate | null>(null);

  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [preselectedBillId, setPreselectedBillId] = useState<string>('');

  // Selected patient for Summary Tab
  const [summaryPatientId, setSummaryPatientId] = useState<string>('');
  const [patientSummaryData, setPatientSummaryData] = useState<PatientBillingSummary | null>(null);

  // Load all billing & rate card data
  const loadBillingData = async () => {
    const [fetchedEstimates, fetchedBills, fetchedReceipts, fetchedCounselling, fetchedConsumables] = await Promise.all([
      ApiClient.getEstimates(),
      ApiClient.getBills(),
      ApiClient.getReceipts(),
      ApiClient.getCounsellingRecords(),
      ApiClient.getConsumables(),
    ]);

    setEstimates(fetchedEstimates);
    setBills(fetchedBills);
    setReceipts(fetchedReceipts);
    setCounsellingRecords(fetchedCounselling);
    setConsumablesRateCard(fetchedConsumables);

    if (summaryPatientId) {
      const summary = await ApiClient.getPatientBillingSummary(summaryPatientId);
      setPatientSummaryData(summary || null);
    } else if (patients.length > 0 && !summaryPatientId) {
      setSummaryPatientId(patients[0].id);
      const summary = await ApiClient.getPatientBillingSummary(patients[0].id);
      setPatientSummaryData(summary || null);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, [patients]);

  useEffect(() => {
    if (summaryPatientId) {
      ApiClient.getPatientBillingSummary(summaryPatientId).then(res => {
        setPatientSummaryData(res || null);
      });
    }
  }, [summaryPatientId, bills, receipts]);

  // Overall statistics
  const stats = useMemo(() => {
    const totalEstimates = estimates.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
    const totalBilled = bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalInsuranceApproved = bills.reduce(
      (sum, b) => sum + (b.isInsured ? (b.finalApprovedAmount || 0) : 0),
      0
    );
    const totalReceipts = receipts.reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalNetPayable = bills.reduce((sum, b) => sum + (b.patientNetPayable || 0), 0);
    const totalOutstanding = Math.max(0, totalNetPayable - totalReceipts);

    return {
      totalEstimates,
      totalBilled,
      totalInsuranceApproved,
      totalReceipts,
      totalOutstanding,
      activeEstimatesCount: estimates.filter(e => e.status === 'Active').length,
      settledCount: bills.filter(b => b.status === 'Settled').length,
      partialCount: bills.filter(b => b.status === 'Partially Paid').length,
    };
  }, [estimates, bills, receipts]);

  // Filtered estimates
  const filteredEstimates = useMemo(() => {
    return estimates.filter(e => {
      const matchesSearch =
        e.estimateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.uhid && e.uhid.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.surgeryDetails && e.surgeryDetails.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [estimates, searchTerm, statusFilter]);

  // Filtered bills
  const filteredBills = useMemo(() => {
    return bills.filter(b => {
      const matchesSearch =
        b.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.uhid && b.uhid.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.surgeryDetails && b.surgeryDetails.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'insured' ? b.isInsured : b.status === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [bills, searchTerm, statusFilter]);

  // Filtered receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter(r => {
      const matchesSearch =
        r.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.uhid && r.uhid.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.referenceNumber && r.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesMode = modeFilter === 'all' || r.paymentMode === modeFilter;
      return matchesSearch && matchesMode;
    });
  }, [receipts, searchTerm, modeFilter]);

  // Convert estimate to bill
  const handleConvertToBill = async (estimateId: string) => {
    const est = estimates.find(e => e.id === estimateId);
    if (!est) return;

    if (confirm(`Convert Estimate "${est.estimateNumber}" for ${est.patientName} into an actual Hospital Bill?`)) {
      const newBill = await ApiClient.convertEstimateToBill(estimateId, currentUser);
      await loadBillingData();
      setSelectedEstimateForPrint(null);
      setActiveTab('bills');
      setSelectedBillForPrint(newBill);
    }
  };

  // Handle Delete Estimate
  const handleDeleteEstimate = async (estimateId: string) => {
    if (confirm('Are you sure you want to delete this estimate?')) {
      await ApiClient.deleteEstimate(estimateId, currentUser);
      await loadBillingData();
    }
  };

  // Handle Delete Bill
  const handleDeleteBill = async (billId: string) => {
    if (confirm('Are you sure you want to delete this bill? All tagged receipts will also be deleted.')) {
      await ApiClient.deleteBill(billId, currentUser);
      await loadBillingData();
    }
  };

  // Handle Delete Receipt
  const handleDeleteReceipt = async (receiptId: string) => {
    if (confirm('Are you sure you want to remove this payment receipt? The linked bill balance will be recalculated.')) {
      await ApiClient.deleteReceipt(receiptId, currentUser);
      await loadBillingData();
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <ReceiptIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Hospital Billing & Financials
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Treatment cost estimates, rate-card based invoices, insurance cashless settlements, and payment vouchers.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Generate Estimate */}
          <button
            onClick={() => {
              setEditingEstimate(null);
              setIsEstimateModalOpen(true);
            }}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Calculator className="w-4 h-4" />
            <span>Generate Estimate</span>
          </button>

          {/* User Request #1: Replace "Generate New Hospital Bill" with "Generate New Bill" */}
          <button
            onClick={() => {
              setEditingBill(null);
              setIsBillModalOpen(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Bill</span>
          </button>

          {/* Record Payment */}
          <button
            onClick={() => {
              setPreselectedBillId(bills[0]?.id || '');
              setIsReceiptModalOpen(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
            Cost Estimates
          </span>
          <div className="text-xl font-black text-amber-950 font-mono mt-0.5">
            ₹{stats.totalEstimates.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-amber-700 mt-1 flex items-center gap-1">
            <span className="font-semibold">{stats.activeEstimatesCount}</span> active treatment estimates
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Billed
          </span>
          <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
            ₹{stats.totalBilled.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            <span className="font-semibold text-slate-700">{bills.length}</span> bills issued
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-blue-200 bg-blue-50/30 shadow-xs">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
            Insurance Approved
          </span>
          <div className="text-xl font-black text-blue-900 font-mono mt-0.5">
            ₹{stats.totalInsuranceApproved.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-blue-600 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            TPA settled cashless
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
            Receipts Collected
          </span>
          <div className="text-xl font-black text-emerald-800 font-mono mt-0.5">
            ₹{stats.totalReceipts.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span className="font-semibold">{receipts.length}</span> receipts in parts
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs - User Request #4: Estimates tab BEFORE Bills (renamed to Bills) */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-2 pt-2 shadow-xs">
        <button
          onClick={() => {
            setActiveTab('estimates');
            setStatusFilter('all');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'estimates'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Estimates ({estimates.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('bills');
            setStatusFilter('all');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'bills'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Bills ({bills.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('receipts')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'receipts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ReceiptIcon className="w-4 h-4" />
          <span>Payment Receipts ({receipts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'summary'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Patient Statements & Summary</span>
        </button>
      </div>

      {/* TAB 1: ESTIMATES */}
      {activeTab === 'estimates' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search estimate no, patient name, UHID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[11px] font-semibold text-slate-500 shrink-0">Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none text-slate-700"
              >
                <option value="all">All Estimates</option>
                <option value="Active">Active Estimates</option>
                <option value="Converted to Bill">Converted to Bill</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>

          {/* Estimates List Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <th className="py-3 px-3.5">Estimate No & Date</th>
                    <th className="py-3 px-3.5">Patient Details</th>
                    <th className="py-3 px-3.5">Proposed Surgery</th>
                    <th className="py-3 px-3 text-right">Total Estimate</th>
                    <th className="py-3 px-3 text-right">Insurance Expected</th>
                    <th className="py-3 px-3 text-right">Patient Est. Share</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEstimates.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400 italic">
                        No estimates found. Click "Generate Estimate" to create one.
                      </td>
                    </tr>
                  ) : (
                    filteredEstimates.map(est => (
                      <tr key={est.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="font-mono font-bold text-slate-900">{est.estimateNumber}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(est.estimateDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="font-semibold text-slate-900">{est.patientName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            UHID: {est.uhid || est.patientId}
                          </div>
                          {est.isInsured && (
                            <span className="inline-block mt-0.5 text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                              {est.insuranceCompany || 'TPA'}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3.5 max-w-[220px]">
                          <div className="text-slate-800 font-medium truncate" title={est.surgeryDetails}>
                            {est.surgeryDetails || 'Eye Care Treatment'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {est.items.length} particulars
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          ₹{est.totalAmount.toLocaleString('en-IN')}
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-blue-700">
                          {est.isInsured ? (
                            <span>₹{(est.estimatedInsuranceCoverage || est.preAuthAmount || 0).toLocaleString('en-IN')}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-amber-900">
                          ₹{est.patientEstimatedNetPayable.toLocaleString('en-IN')}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            est.status === 'Converted to Bill'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {est.status}
                          </span>
                          {est.convertedBillNumber && (
                            <div className="text-[9px] font-mono text-blue-600 mt-0.5">
                              {est.convertedBillNumber}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Convert to Bill Button */}
                            {est.status === 'Active' && (
                              <button
                                onClick={() => handleConvertToBill(est.id)}
                                title="Convert Estimate to Bill"
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                              >
                                <ArrowRight className="w-3 h-3" />
                                <span>To Bill</span>
                              </button>
                            )}

                            {/* Print Estimate */}
                            <button
                              onClick={() => setSelectedEstimateForPrint(est)}
                              title="Print Cost Estimate"
                              className="p-1.5 text-amber-700 hover:text-white hover:bg-amber-600 rounded-lg transition-colors cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Estimate */}
                            {est.status === 'Active' && (
                              <button
                                onClick={() => {
                                  setEditingEstimate(est);
                                  setIsEstimateModalOpen(true);
                                }}
                                title="Edit Estimate"
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteEstimate(est.id)}
                              title="Delete Estimate"
                              className="p-1.5 text-rose-500 hover:text-white hover:bg-rose-600 rounded-lg transition-colors cursor-pointer"
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
        </div>
      )}

      {/* TAB 2: BILLS (Renamed from Hospital Bills) */}
      {activeTab === 'bills' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by patient, UHID, bill number..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[11px] font-semibold text-slate-500 shrink-0">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none text-slate-700"
              >
                <option value="all">All Bills</option>
                <option value="Settled">Settled (Cleared)</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Generated">Generated (Unpaid)</option>
                <option value="insured">Insurance Cashless</option>
              </select>
            </div>
          </div>

          {/* Bills List Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <th className="py-3 px-3.5">Bill Number & Date</th>
                    <th className="py-3 px-3.5">Patient Details</th>
                    <th className="py-3 px-3.5">Surgery Details</th>
                    <th className="py-3 px-3 text-right">Gross Total</th>
                    <th className="py-3 px-3 text-right">Insurance Approved</th>
                    <th className="py-3 px-3 text-right">Net Payable</th>
                    <th className="py-3 px-3 text-right">Paid Amount</th>
                    <th className="py-3 px-3 text-right">Balance Due</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBills.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-slate-400 italic">
                        No bills found matching your criteria. Click "Generate New Bill" to create one.
                      </td>
                    </tr>
                  ) : (
                    filteredBills.map(bill => (
                      <tr key={bill.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="font-mono font-bold text-slate-900">{bill.billNumber}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(bill.billDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="font-semibold text-slate-900">{bill.patientName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            UHID: {bill.uhid || bill.patientId}
                          </div>
                          {bill.isInsured && (
                            <span className="inline-block mt-0.5 text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                              {bill.insuranceCompany || 'TPA Insured'}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3.5 max-w-[200px]">
                          <div className="text-slate-800 font-medium truncate" title={bill.surgeryDetails}>
                            {bill.surgeryDetails || 'Eye Care Services'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {bill.items.length} itemized particulars
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-medium text-slate-900">
                          ₹{bill.totalAmount.toLocaleString('en-IN')}
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-blue-700">
                          {bill.isInsured ? (
                            <span className="font-bold">
                              ₹{(bill.finalApprovedAmount || 0).toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          ₹{bill.patientNetPayable.toLocaleString('en-IN')}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                          ₹{bill.paidAmount.toLocaleString('en-IN')}
                        </td>

                        <td className="py-3 px-3 text-right font-mono">
                          <span className={`font-bold ${
                            bill.balanceDue === 0
                              ? 'text-emerald-700'
                              : bill.balanceDue > 0
                              ? 'text-rose-700'
                              : 'text-amber-700'
                          }`}>
                            ₹{Math.abs(bill.balanceDue).toLocaleString('en-IN')}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            bill.status === 'Settled'
                              ? 'bg-emerald-100 text-emerald-800'
                              : bill.status === 'Partially Paid'
                              ? 'bg-amber-100 text-amber-800'
                              : bill.status === 'Refundable'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {bill.status}
                          </span>
                        </td>

                        <td className="py-3 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Print Bill */}
                            <button
                              onClick={() => setSelectedBillForPrint(bill)}
                              title="Print Bill Invoice"
                              className="p-1.5 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition-colors cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Record Receipt against this bill */}
                            <button
                              onClick={() => {
                                setPreselectedBillId(bill.id);
                                setIsReceiptModalOpen(true);
                              }}
                              title="Record Payment Receipt"
                              className="p-1.5 text-emerald-600 hover:text-white hover:bg-emerald-600 rounded-lg transition-colors cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Bill */}
                            <button
                              onClick={() => {
                                setEditingBill(bill);
                                setIsBillModalOpen(true);
                              }}
                              title="Edit Bill Details"
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteBill(bill.id)}
                              title="Delete Bill"
                              className="p-1.5 text-rose-500 hover:text-white hover:bg-rose-600 rounded-lg transition-colors cursor-pointer"
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
        </div>
      )}

      {/* TAB 3: RECEIPTS */}
      {activeTab === 'receipts' && (
        <div className="space-y-4">
          {/* Search & Mode Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search receipt, bill, reference, patient..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[11px] font-semibold text-slate-500 shrink-0">Payment Mode:</span>
              <select
                value={modeFilter}
                onChange={e => setModeFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none text-slate-700"
              >
                <option value="all">All Modes</option>
                <option value="GPay / UPI">GPay / UPI</option>
                <option value="Cash">Cash</option>
                <option value="Online Transfer">Online Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Card">Debit / Credit Card</option>
              </select>
            </div>
          </div>

          {/* Receipts Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <th className="py-3 px-3.5">Receipt Number</th>
                    <th className="py-3 px-3.5">Date</th>
                    <th className="py-3 px-3.5">Patient Details</th>
                    <th className="py-3 px-3.5">Tagged Bill Reference</th>
                    <th className="py-3 px-3.5">Payment Mode</th>
                    <th className="py-3 px-3.5">Transaction Ref / Details</th>
                    <th className="py-3 px-3 text-right">Amount Received</th>
                    <th className="py-3 px-3.5">Received By</th>
                    <th className="py-3 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-400 italic">
                        No receipts found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredReceipts.map(rcp => {
                      const linkedBill = bills.find(b => b.id === rcp.billId);

                      return (
                        <tr key={rcp.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3.5 font-mono font-bold text-slate-900">
                            {rcp.receiptNumber}
                          </td>

                          <td className="py-3 px-3.5 text-slate-700">
                            {new Date(rcp.paymentDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>

                          <td className="py-3 px-3.5">
                            <div className="font-semibold text-slate-900">{rcp.patientName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              UHID: {rcp.uhid || rcp.patientId}
                            </div>
                          </td>

                          <td className="py-3 px-3.5">
                            <span className="font-mono text-blue-700 font-semibold">
                              {rcp.billNumber}
                            </span>
                            {linkedBill && (
                              <div className="text-[10px] text-slate-500">
                                Bill Net: ₹{linkedBill.patientNetPayable.toLocaleString('en-IN')}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3.5">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                              {rcp.paymentMode}
                            </span>
                          </td>

                          <td className="py-3 px-3.5 text-slate-700 font-mono">
                            <div>{rcp.referenceNumber || '—'}</div>
                            {rcp.bankName && <div className="text-[10px] text-slate-500">{rcp.bankName}</div>}
                          </td>

                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 text-sm">
                            ₹{rcp.amount.toLocaleString('en-IN')}
                          </td>

                          <td className="py-3 px-3.5 text-slate-600 text-[11px]">
                            {rcp.receivedBy}
                          </td>

                          <td className="py-3 px-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Print Receipt */}
                              <button
                                onClick={() => setSelectedReceiptForPrint(rcp)}
                                title="Print Receipt Voucher"
                                className="p-1.5 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition-colors cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Receipt */}
                              <button
                                onClick={() => handleDeleteReceipt(rcp.id)}
                                title="Delete Receipt"
                                className="p-1.5 text-rose-500 hover:text-white hover:bg-rose-600 rounded-lg transition-colors cursor-pointer"
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
        </div>
      )}

      {/* TAB 4: PATIENT SUMMARY & STATEMENTS */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          {/* Patient Selection Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Select Patient for Account Statement:
                </label>
                <select
                  value={summaryPatientId}
                  onChange={e => setSummaryPatientId(e.target.value)}
                  className="mt-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.uhid || p.id}) - {p.gender}, {p.age} Yrs
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {patientSummaryData && (
              <button
                onClick={() => setSelectedSummaryForPrint(patientSummaryData)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Printer className="w-4 h-4" />
                <span>Print Billing Summary</span>
              </button>
            )}
          </div>

          {/* Statement View */}
          {patientSummaryData && (
            <div className="space-y-4">
              {/* Financial Status Highlight Banner */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                patientSummaryData.financialStatus === 'Cleared'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : patientSummaryData.financialStatus === 'Outstanding'
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}>
                <div className="flex items-center gap-3">
                  {patientSummaryData.financialStatus === 'Cleared' && (
                    <CheckCircle className="w-8 h-8 text-emerald-600 shrink-0" />
                  )}
                  {patientSummaryData.financialStatus === 'Outstanding' && (
                    <AlertCircle className="w-8 h-8 text-rose-600 shrink-0" />
                  )}
                  {patientSummaryData.financialStatus === 'Refundable' && (
                    <AlertCircle className="w-8 h-8 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider block">
                      Account Status: {patientSummaryData.financialStatus}
                    </span>
                    <p className="text-xs opacity-90 mt-0.5">
                      {patientSummaryData.financialStatus === 'Cleared' && 'All issued bills have been settled in full. Zero outstanding balance.'}
                      {patientSummaryData.financialStatus === 'Outstanding' && `Pending balance of ₹${patientSummaryData.balanceDue.toLocaleString('en-IN')} to be collected.`}
                      {patientSummaryData.financialStatus === 'Refundable' && `Excess credit balance of ₹${Math.abs(patientSummaryData.balanceDue).toLocaleString('en-IN')} refundable to patient.`}
                    </p>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:pl-4 sm:border-slate-300">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Net Balance</span>
                  <div className="text-2xl font-black font-mono">
                    ₹{Math.abs(patientSummaryData.balanceDue).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Financial Breakdown Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Billed</span>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                    ₹{patientSummaryData.totalBilled.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-500">{patientSummaryData.bills.length} bills issued</div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-blue-200 bg-blue-50/20">
                  <span className="text-[10px] uppercase font-bold text-blue-700 block">Insurance Approved</span>
                  <div className="text-lg font-bold font-mono text-blue-900 mt-0.5">
                    ₹{patientSummaryData.totalInsuranceApproved.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-blue-600">Cashless TPA settled</div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Patient Net Share</span>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                    ₹{patientSummaryData.totalPatientNetPayable.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-500">Co-pay & Non-medical</div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-emerald-50/20">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Receipts Paid</span>
                  <div className="text-lg font-bold font-mono text-emerald-800 mt-0.5">
                    ₹{patientSummaryData.totalPaid.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-emerald-600">{patientSummaryData.receipts.length} parts collected</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT ESTIMATE MODAL */}
      {isEstimateModalOpen && (
        <InvoiceEditorModal
          mode="estimate"
          currentUser={currentUser}
          existingItem={editingEstimate}
          patients={patients}
          counsellingRecords={counsellingRecords}
          consumablesRateCard={consumablesRateCard}
          onClose={() => setIsEstimateModalOpen(false)}
          onSaved={async () => {
            setIsEstimateModalOpen(false);
            await loadBillingData();
          }}
        />
      )}

      {/* CREATE / EDIT BILL MODAL (User Request #1: Replace "Generate New Hospital Bill" with "Generate New Bill") */}
      {isBillModalOpen && (
        <InvoiceEditorModal
          mode="bill"
          currentUser={currentUser}
          existingItem={editingBill}
          patients={patients}
          counsellingRecords={counsellingRecords}
          consumablesRateCard={consumablesRateCard}
          onClose={() => setIsBillModalOpen(false)}
          onSaved={async () => {
            setIsBillModalOpen(false);
            await loadBillingData();
          }}
        />
      )}

      {/* CREATE RECEIPT MODAL */}
      {isReceiptModalOpen && (
        <ReceiptCreateModal
          currentUser={currentUser}
          bills={bills}
          preselectedBillId={preselectedBillId}
          onClose={() => setIsReceiptModalOpen(false)}
          onSaved={async () => {
            setIsReceiptModalOpen(false);
            await loadBillingData();
          }}
        />
      )}

      {/* PRINT MODALS */}
      {selectedEstimateForPrint && (
        <EstimatePrintModal
          estimate={selectedEstimateForPrint}
          patient={patients.find(p => p.id === selectedEstimateForPrint.patientId)}
          onClose={() => setSelectedEstimateForPrint(null)}
          onConvertToBill={handleConvertToBill}
        />
      )}

      {selectedBillForPrint && (
        <BillPrintModal
          bill={selectedBillForPrint}
          patient={patients.find(p => p.id === selectedBillForPrint.patientId)}
          onClose={() => setSelectedBillForPrint(null)}
        />
      )}

      {selectedReceiptForPrint && (
        <ReceiptPrintModal
          receipt={selectedReceiptForPrint}
          bill={bills.find(b => b.id === selectedReceiptForPrint.billId)}
          onClose={() => setSelectedReceiptForPrint(null)}
        />
      )}

      {selectedSummaryForPrint && (
        <BillingSummaryPrintModal
          summary={selectedSummaryForPrint}
          patient={patients.find(p => p.id === selectedSummaryForPrint.patientId)}
          onClose={() => setSelectedSummaryForPrint(null)}
        />
      )}
    </div>
  );
};

/**
 * Universal Unified Invoice Editor Modal for both Bills and Estimates
 * Supports:
 * - Rate Card auto-population for Consumables
 * - Optional Description field after selecting category and subcategories
 * - Insurance pre-auth and final approved amount
 */
interface InvoiceEditorModalProps {
  mode: 'bill' | 'estimate';
  currentUser: User;
  existingItem: Bill | Estimate | null;
  patients: Patient[];
  counsellingRecords: CounsellingRecord[];
  consumablesRateCard: ConsumableSetting[];
  onClose: () => void;
  onSaved: () => void;
}

const InvoiceEditorModal: React.FC<InvoiceEditorModalProps> = ({
  mode,
  currentUser,
  existingItem,
  patients,
  counsellingRecords,
  consumablesRateCard,
  onClose,
  onSaved,
}) => {
  const isBill = mode === 'bill';
  const existingBill = isBill ? (existingItem as Bill) : null;
  const existingEstimate = !isBill ? (existingItem as Estimate) : null;

  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    existingItem?.patientId || patients[0]?.id || ''
  );
  const [docDate, setDocDate] = useState<string>(
    isBill
      ? (existingBill?.billDate || new Date().toISOString().split('T')[0])
      : (existingEstimate?.estimateDate || new Date().toISOString().split('T')[0])
  );
  const [surgeryDate, setSurgeryDate] = useState<string>(existingItem?.surgeryDate || '');
  const [surgeryDetails, setSurgeryDetails] = useState<string>(existingItem?.surgeryDetails || '');
  const [doctorName, setDoctorName] = useState<string>(
    existingItem?.doctorName || 'Dr.A.R.Karthik, DO, DNB'
  );
  const [isInsured, setIsInsured] = useState<boolean>(existingItem?.isInsured || false);
  const [insuranceCompany, setInsuranceCompany] = useState<string>(existingItem?.insuranceCompany || '');
  const [tpaName, setTpaName] = useState<string>(existingItem?.tpaName || '');
  const [policyNumber, setPolicyNumber] = useState<string>(existingItem?.policyNumber || '');
  const [claimNumber, setClaimNumber] = useState<string>(existingBill?.claimNumber || '');
  const [preAuthAmount, setPreAuthAmount] = useState<number>(existingItem?.preAuthAmount || 0);
  const [finalApprovedAmount, setFinalApprovedAmount] = useState<number>(
    isBill
      ? (existingBill?.finalApprovedAmount || 0)
      : (existingEstimate?.estimatedInsuranceCoverage || 0)
  );
  const [coPayPercent, setCoPayPercent] = useState<number>(existingItem?.coPayPercent || 0);
  const [coPayAmount, setCoPayAmount] = useState<number>(existingItem?.coPayAmount || 0);
  const [nonMedicalDeductions, setNonMedicalDeductions] = useState<number>(
    existingItem?.nonMedicalDeductions || 0
  );
  const [discount, setDiscount] = useState<number>(existingItem?.discount || 0);
  const [notes, setNotes] = useState<string>(existingItem?.notes || '');

  // Default Item Lines
  const [items, setItems] = useState<BillItem[]>(
    existingItem?.items || [
      {
        id: 'item_1',
        description: 'Surgeon fee towards eye surgery',
        category: 'surgeon_fee',
        quantity: 1,
        unitPrice: 25000,
        amount: 25000,
      },
      {
        id: 'item_2',
        description: 'Consumables - Foldable IOL & Viscoelastic pack',
        category: 'consumable',
        consumableId: consumablesRateCard[0]?.id || 'cons_1',
        quantity: 1,
        unitPrice: consumablesRateCard[0]?.unitPrice || 12000,
        amount: consumablesRateCard[0]?.unitPrice || 12000,
      },
      {
        id: 'item_3',
        description: 'OT & Phaco machine charges',
        category: 'ot_charges',
        quantity: 1,
        unitPrice: 7000,
        amount: 7000,
      },
    ]
  );

  // Active Patient
  const activePatient = patients.find(p => p.id === selectedPatientId);

  // Check matching counselling plan
  const matchingCounselling = counsellingRecords.find(
    c => c.patientId === selectedPatientId || (activePatient?.uhid && c.uhid === activePatient.uhid)
  );

  // Auto-populate from Surgery Plan
  const handleAutoPopulateFromSurgery = () => {
    if (!matchingCounselling) return;
    setSurgeryDate(matchingCounselling.tentativeSurgeryDate);
    const details = `${matchingCounselling.eyeSelection === 'OD' ? 'Left eye (OD)' : matchingCounselling.eyeSelection === 'OS' ? 'Right eye (OS)' : 'Both eyes'} Phacoemulsification with ${matchingCounselling.plannedConsumable}`;
    setSurgeryDetails(details);
    if (matchingCounselling.counsellorName) {
      setDoctorName(matchingCounselling.counsellorName);
    }

    // Match consumable from rate card
    const matchedConsumable = consumablesRateCard.find(
      c => c.name.toLowerCase().includes(matchingCounselling.plannedConsumable.toLowerCase()) ||
           matchingCounselling.plannedConsumable.toLowerCase().includes(c.name.toLowerCase())
    );
    const consPrice = matchedConsumable?.unitPrice || 18000;

    const sDate = new Date(matchingCounselling.tentativeSurgeryDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    setItems([
      {
        id: `item_${Date.now()}_1`,
        description: `Surgeon fee towards ${details} on ${sDate}`,
        category: 'surgeon_fee',
        quantity: 1,
        unitPrice: 25000,
        amount: 25000,
      },
      {
        id: `item_${Date.now()}_2`,
        description: `Consumables - ${matchingCounselling.plannedConsumable}`,
        category: 'consumable',
        consumableId: matchedConsumable?.id,
        quantity: 1,
        unitPrice: consPrice,
        amount: consPrice,
      },
      {
        id: `item_${Date.now()}_3`,
        description: 'Operation Theatre & Daycare Sterilization charges',
        category: 'ot_charges',
        quantity: 1,
        unitPrice: 7000,
        amount: 7000,
      },
    ]);
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const grossTotal = Math.max(0, subtotal - discount);
  const patientNetPayable = isInsured
    ? Math.max(0, grossTotal - finalApprovedAmount)
    : grossTotal;

  // Add Item
  const handleAddItem = () => {
    const firstCons = consumablesRateCard[0];
    setItems([
      ...items,
      {
        id: `item_${Date.now()}`,
        description: '',
        category: 'consumable',
        consumableId: firstCons?.id,
        quantity: 1,
        unitPrice: firstCons?.unitPrice || 2500,
        amount: firstCons?.unitPrice || 2500,
      },
    ]);
  };

  // Update Item & handle rate card auto-population
  const handleUpdateItem = (id: string, updates: Partial<BillItem>) => {
    setItems(
      items.map(i => {
        if (i.id === id) {
          const updated = { ...i, ...updates };

          // If consumableId was changed, auto-populate unitPrice from rate card!
          if (updates.consumableId !== undefined) {
            const matched = consumablesRateCard.find(c => c.id === updates.consumableId);
            if (matched && matched.unitPrice !== undefined) {
              updated.unitPrice = matched.unitPrice;
              // If description is empty, auto-populate item name
              if (!updated.description || updated.description.trim() === '') {
                updated.description = matched.name;
              }
            }
          }

          // If category changed to consumable, select first rate card consumable
          if (updates.category === 'consumable' && !updated.consumableId) {
            const first = consumablesRateCard[0];
            if (first) {
              updated.consumableId = first.id;
              updated.unitPrice = first.unitPrice || 5000;
              if (!updated.description) updated.description = first.name;
            }
          }

          if (updates.quantity !== undefined || updates.unitPrice !== undefined || updates.consumableId !== undefined) {
            updated.amount = (Number(updated.quantity) || 1) * (Number(updated.unitPrice) || 0);
          }
          return updated;
        }
        return i;
      })
    );
  };

  // Remove Item
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      alert('Must contain at least one item line.');
      return;
    }
    setItems(items.filter(i => i.id !== id));
  };

  // Save handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient) return;

    // Ensure all items have a description fallback if left optional
    const preparedItems = items.map(item => {
      let desc = item.description?.trim();
      if (!desc) {
        if (item.category === 'consumable' && item.consumableId) {
          const matched = consumablesRateCard.find(c => c.id === item.consumableId);
          desc = matched ? matched.name : 'Surgical Consumable';
        } else if (item.category === 'surgeon_fee') {
          desc = `Surgeon fee towards ${surgeryDetails || 'ophthalmic surgery'}`;
        } else if (item.category === 'ot_charges') {
          desc = 'Operation Theatre & Sterilization charges';
        } else if (item.category === 'investigation') {
          desc = 'Pre-operative Diagnostic investigations';
        } else {
          desc = `${item.category.replace('_', ' ').toUpperCase()} charges`;
        }
      }
      return { ...item, description: desc };
    });

    if (isBill) {
      await ApiClient.saveBill(
        {
          id: existingBill?.id,
          billNumber: existingBill?.billNumber || '',
          patientId: activePatient.id,
          uhid: activePatient.uhid,
          patientName: activePatient.name,
          billDate: docDate,
          surgeryDate,
          surgeryDetails,
          doctorName,
          items: preparedItems,
          subtotal,
          discount,
          tax: 0,
          totalAmount: grossTotal,
          isInsured,
          insuranceCompany,
          tpaName,
          policyNumber,
          claimNumber,
          preAuthAmount,
          finalApprovedAmount,
          coPayPercent,
          coPayAmount,
          nonMedicalDeductions,
          patientNetPayable,
          paidAmount: existingBill?.paidAmount || 0,
          balanceDue: patientNetPayable - (existingBill?.paidAmount || 0),
          status: existingBill?.status || 'Generated',
          notes,
        },
        currentUser
      );
    } else {
      await ApiClient.saveEstimate(
        {
          id: existingEstimate?.id,
          estimateNumber: existingEstimate?.estimateNumber || '',
          patientId: activePatient.id,
          uhid: activePatient.uhid,
          patientName: activePatient.name,
          estimateDate: docDate,
          surgeryDate,
          surgeryDetails,
          doctorName,
          items: preparedItems,
          subtotal,
          discount,
          tax: 0,
          totalAmount: grossTotal,
          isInsured,
          insuranceCompany,
          tpaName,
          policyNumber,
          preAuthAmount,
          estimatedInsuranceCoverage: finalApprovedAmount,
          coPayPercent,
          coPayAmount,
          nonMedicalDeductions,
          patientEstimatedNetPayable: patientNetPayable,
          status: existingEstimate?.status || 'Active',
          notes,
        },
        currentUser
      );
    }

    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200">
        {/* Header - User Request #1: "Generate New Bill" */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {isBill ? <FileText className="w-4 h-4 text-blue-400" /> : <Calculator className="w-4 h-4 text-amber-400" />}
            <span className="font-bold text-sm">
              {isBill
                ? (existingBill ? `Edit Bill (${existingBill.billNumber})` : 'Generate New Bill')
                : (existingEstimate ? `Edit Estimate (${existingEstimate.estimateNumber})` : 'Generate Treatment Estimate')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Patient & Surgery Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Select Patient <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedPatientId}
                disabled={Boolean(existingItem)}
                onChange={e => {
                  setSelectedPatientId(e.target.value);
                  const p = patients.find(pat => pat.id === e.target.value);
                  if (p?.isInsured) setIsInsured(true);
                }}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.uhid || p.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                {isBill ? 'Bill Date' : 'Estimate Date'}
              </label>
              <input
                type="date"
                value={docDate}
                onChange={e => setDocDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Surgeon / Doctor Name</label>
              <input
                type="text"
                value={doctorName}
                onChange={e => setDoctorName(e.target.value)}
                placeholder="Dr.A.R.Karthik, DO, DNB"
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {isBill ? 'Surgery Date' : 'Tentative Surgery Date'}
                </label>
                <input
                  type="date"
                  value={surgeryDate}
                  onChange={e => setSurgeryDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Surgery Details / Procedure Description
                </label>
                <input
                  type="text"
                  value={surgeryDetails}
                  onChange={e => setSurgeryDetails(e.target.value)}
                  placeholder="e.g. Left eye Phacoemulsification with Foldable Toric IOL"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Quick sync with counselling */}
            {matchingCounselling && (
              <div className="md:col-span-3 bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex items-center justify-between">
                <div className="text-blue-900">
                  <span className="font-bold">Counselling Record Found:</span> Scheduled for{' '}
                  <strong>{matchingCounselling.tentativeSurgeryDate}</strong> ({matchingCounselling.plannedConsumable})
                </div>
                <button
                  type="button"
                  onClick={handleAutoPopulateFromSurgery}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3 h-3" /> Auto-populate from Surgery Plan
                </button>
              </div>
            )}
          </div>

          {/* Insurance Approval / Coverage Section */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isInsured}
                  onChange={e => setIsInsured(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-0 cursor-pointer"
                />
                <span className="font-bold text-slate-800 text-xs">
                  Insurance / Cashless TPA Covered Patient
                </span>
              </label>

              {isInsured && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  Cashless TPA Enabled
                </span>
              )}
            </div>

            {isInsured && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                    Insurance Provider
                  </label>
                  <input
                    type="text"
                    value={insuranceCompany}
                    onChange={e => setInsuranceCompany(e.target.value)}
                    placeholder="e.g. Star Health, United India"
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                    TPA Name / Desk
                  </label>
                  <input
                    type="text"
                    value={tpaName}
                    onChange={e => setTpaName(e.target.value)}
                    placeholder="e.g. Medi Assist, Paramount"
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                    Pre-Auth Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={preAuthAmount || ''}
                    onChange={e => setPreAuthAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs font-mono"
                  />
                </div>

                <div className="bg-emerald-50/70 p-2 rounded border border-emerald-300">
                  <label className="text-[10px] uppercase font-extrabold text-emerald-900 block mb-1">
                    {isBill ? 'Final Approved Amount (₹)' : 'Estimated Coverage (₹)'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={finalApprovedAmount || ''}
                    onChange={e => setFinalApprovedAmount(Number(e.target.value))}
                    className="w-full bg-white border border-emerald-400 rounded p-1 text-xs font-mono font-bold text-emerald-900 focus:outline-none"
                    placeholder="Approved sum"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                    Co-Payment (%)
                  </label>
                  <input
                    type="number"
                    value={coPayPercent || ''}
                    onChange={e => {
                      const pct = Number(e.target.value);
                      setCoPayPercent(pct);
                      if (finalApprovedAmount && pct) {
                        setCoPayAmount(Math.round((finalApprovedAmount * pct) / 100));
                      }
                    }}
                    placeholder="e.g. 10%"
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                    Co-Pay Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={coPayAmount || ''}
                    onChange={e => setCoPayAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                    Non-Medical Deductions (₹)
                  </label>
                  <input
                    type="number"
                    value={nonMedicalDeductions || ''}
                    onChange={e => setNonMedicalDeductions(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-blue-900 block mb-1">
                    Patient Net Responsibility (₹)
                  </label>
                  <div className="font-mono font-bold text-sm text-blue-900 p-1.5 bg-blue-50 rounded border border-blue-200">
                    ₹{patientNetPayable.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Itemized Particulars with Rate Card Auto-Population & Optional Description (User Requests #2 & #3) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 p-2.5 font-bold text-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>Itemized Particulars (Rate Card Enabled)</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  • Selecting Consumable auto-populates price from rate card. Description is optional.
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-semibold rounded flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Item Line
              </button>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-2 w-8 text-center">#</th>
                  <th className="p-2 w-36">Category</th>
                  <th className="p-2 w-48">Rate Card Item / Subcategory</th>
                  <th className="p-2">Description (Optional)</th>
                  <th className="p-2 w-16 text-center">Qty</th>
                  <th className="p-2 w-24 text-right">Rate (₹)</th>
                  <th className="p-2 w-28 text-right">Amount (₹)</th>
                  <th className="p-2 w-8 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => {
                  const isConsumable = item.category === 'consumable';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-2 text-center text-slate-400 font-mono">{index + 1}</td>

                      {/* Category Selector */}
                      <td className="p-2">
                        <select
                          value={item.category}
                          onChange={e => handleUpdateItem(item.id, { category: e.target.value as BillItemCategory })}
                          className="w-full border border-slate-300 rounded p-1 text-xs bg-white font-medium"
                        >
                          <option value="consumable">Consumable (Rate Card)</option>
                          <option value="surgeon_fee">Surgeon Fee</option>
                          <option value="ot_charges">OT Charges</option>
                          <option value="investigation">Investigation</option>
                          <option value="room">Room / Daycare</option>
                          <option value="pharmacy">Pharmacy</option>
                          <option value="other">Other</option>
                        </select>
                      </td>

                      {/* Subcategory / Rate Card Dropdown */}
                      <td className="p-2">
                        {isConsumable ? (
                          <select
                            value={item.consumableId || ''}
                            onChange={e => handleUpdateItem(item.id, { consumableId: e.target.value })}
                            className="w-full border border-blue-400 rounded p-1 text-xs bg-blue-50/50 font-semibold text-blue-950"
                          >
                            <option value="">-- Select Rate Card Item --</option>
                            {consumablesRateCard.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.name} {c.unitPrice ? `(₹${c.unitPrice.toLocaleString('en-IN')})` : ''}
                              </option>
                            ))}
                          </select>
                        ) : item.category === 'surgeon_fee' ? (
                          <select
                            onChange={e => {
                              const val = e.target.value;
                              if (val) {
                                handleUpdateItem(item.id, {
                                  description: val,
                                  unitPrice: val.includes('Bilateral') ? 45000 : 25000,
                                });
                              }
                            }}
                            className="w-full border border-slate-300 rounded p-1 text-xs bg-white"
                          >
                            <option value="">-- Standard Procedure --</option>
                            <option value="Surgeon fee towards Phacoemulsification with Foldable IOL">Phaco with Foldable IOL (₹25,000)</option>
                            <option value="Surgeon fee towards Trabeculectomy with MMC">Trabeculectomy with MMC (₹24,000)</option>
                            <option value="Surgeon fee towards Bilateral Femto-LASIK">Bilateral Femto-LASIK (₹45,000)</option>
                            <option value="Surgeon fee towards Vitrectomy & Endolaser">Vitrectomy & Endolaser (₹30,000)</option>
                          </select>
                        ) : item.category === 'ot_charges' ? (
                          <select
                            onChange={e => {
                              const val = e.target.value;
                              if (val) {
                                handleUpdateItem(item.id, {
                                  description: val,
                                  unitPrice: val.includes('Daycare') ? 4000 : 7000,
                                });
                              }
                            }}
                            className="w-full border border-slate-300 rounded p-1 text-xs bg-white"
                          >
                            <option value="">-- Standard OT Particulars --</option>
                            <option value="Operation Theatre & Phaco Machine Sterilization charges">OT & Phaco Machine Sterilization (₹7,000)</option>
                            <option value="Daycare Bed & Nursing Care charges">Daycare Bed & Nursing Care (₹4,000)</option>
                            <option value="Anaesthesia & Monitored Care">Anaesthesia & Monitored Care (₹5,000)</option>
                          </select>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Custom service</span>
                        )}
                      </td>

                      {/* Description - User Request #3: Description is optional */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => handleUpdateItem(item.id, { description: e.target.value })}
                          placeholder={isConsumable ? '(Optional extra details or notes)' : '(Optional description)'}
                          className="w-full border border-slate-300 rounded p-1 text-xs bg-white placeholder:text-slate-400"
                        />
                      </td>

                      {/* Quantity */}
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => handleUpdateItem(item.id, { quantity: Number(e.target.value) })}
                          className="w-12 text-center border border-slate-300 rounded p-1 text-xs"
                        />
                      </td>

                      {/* Rate (Auto-populated from Rate Card for consumables!) */}
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={e => handleUpdateItem(item.id, { unitPrice: Number(e.target.value) })}
                          className="w-20 text-right border border-slate-300 rounded p-1 text-xs font-mono font-semibold"
                        />
                      </td>

                      {/* Line Amount */}
                      <td className="p-2 text-right font-mono font-bold text-slate-900">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </td>

                      {/* Delete Line */}
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Internal Remarks / Clinical Notes
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Notes for accounting and insurance records..."
                rows={3}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Discount / Concession (₹):</span>
                <input
                  type="number"
                  value={discount || ''}
                  onChange={e => setDiscount(Number(e.target.value))}
                  className="w-24 text-right bg-white border border-slate-300 rounded p-1 text-xs"
                />
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Gross Total {isBill ? 'Bill' : 'Estimate'}:</span>
                <span>₹{grossTotal.toLocaleString('en-IN')}</span>
              </div>
              {isInsured && (
                <div className="flex justify-between text-blue-700 font-semibold">
                  <span>Less Insurance {isBill ? 'Approved' : 'Expected'}:</span>
                  <span>-₹{finalApprovedAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm text-emerald-800 pt-1 border-t border-slate-300">
                <span>{isInsured ? 'Patient Net Payable:' : 'Net Payable:'}</span>
                <span>₹{patientNetPayable.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer ${
                isBill ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {isBill
                ? (existingBill ? 'Save Bill Changes' : 'Generate & Save Bill')
                : (existingEstimate ? 'Save Estimate Changes' : 'Generate & Save Estimate')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Receipt Create Submodal
 */
interface ReceiptCreateModalProps {
  currentUser: User;
  bills: Bill[];
  preselectedBillId: string;
  onClose: () => void;
  onSaved: () => void;
}

const ReceiptCreateModal: React.FC<ReceiptCreateModalProps> = ({
  currentUser,
  bills,
  preselectedBillId,
  onClose,
  onSaved,
}) => {
  const [selectedBillId, setSelectedBillId] = useState<string>(
    preselectedBillId || bills[0]?.id || ''
  );
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('GPay / UPI');
  const [amount, setAmount] = useState<number>(0);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [chequeDate, setChequeDate] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('Part payment towards surgery bill');
  const [receivedBy, setReceivedBy] = useState<string>(
    currentUser.name || 'Accounts Desk'
  );

  // Selected Bill
  const activeBill = bills.find(b => b.id === selectedBillId);

  // When bill changes, suggest amount to settle or remaining balance
  useEffect(() => {
    if (activeBill) {
      const remaining = Math.max(0, activeBill.balanceDue);
      setAmount(remaining);
    }
  }, [selectedBillId, activeBill]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBill) return;
    if (amount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    await ApiClient.saveReceipt(
      {
        receiptNumber: '',
        billId: activeBill.id,
        billNumber: activeBill.billNumber,
        patientId: activeBill.patientId,
        uhid: activeBill.uhid,
        patientName: activeBill.patientName,
        paymentDate,
        amount,
        paymentMode,
        referenceNumber,
        bankName,
        chequeDate,
        receivedBy,
        remarks,
      },
      currentUser
    );

    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-sm">Record Payment Receipt</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Tagged Bill Reference <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedBillId}
              onChange={e => setSelectedBillId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
              required
            >
              {bills.map(b => (
                <option key={b.id} value={b.id}>
                  {b.billNumber} — {b.patientName} (Net: ₹{b.patientNetPayable.toLocaleString('en-IN')}, Due: ₹{b.balanceDue.toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          {activeBill && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] text-slate-500 block">Total Net Bill</span>
                <span className="font-bold font-mono text-slate-900">₹{activeBill.patientNetPayable.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Already Paid</span>
                <span className="font-bold font-mono text-emerald-700">₹{activeBill.paidAmount.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Balance Remaining</span>
                <span className="font-bold font-mono text-rose-700">₹{activeBill.balanceDue.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Amount Received (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={amount || ''}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold text-emerald-800 focus:outline-none focus:border-emerald-500"
                placeholder="e.g. 5000"
                required
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">Supports partial payments</span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Payment Mode <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['GPay / UPI', 'Cash', 'Online Transfer', 'Cheque', 'Card'] as PaymentMode[]).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center ${
                    paymentMode === mode
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Transaction Ref / UTR / Cheque No
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                placeholder="e.g. UPI-983174921 / UTR"
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Bank / Channel Name</label>
              <input
                type="text"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                placeholder="e.g. HDFC Bank, GPay"
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
              />
            </div>
          </div>

          {paymentMode === 'Cheque' && (
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Cheque Date</label>
              <input
                type="date"
                value={chequeDate}
                onChange={e => setChequeDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
              />
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Remarks / Note</label>
            <input
              type="text"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="e.g. Part payment towards cataract surgery"
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
            />
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Record Receipt</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
