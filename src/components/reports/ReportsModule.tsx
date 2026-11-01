import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Patient,
  User,
  CounsellingRecord,
  Bill,
  Receipt,
  AuditEvent,
  HospitalSetting,
} from '../../types';
import { ApiClient } from '../../api/client';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Filter,
  Search,
  Building,
  Activity,
  Receipt as ReceiptIcon,
  ShieldAlert,
  CheckCircle,
  Clock,
  UserCheck,
  Eye,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

interface ReportsModuleProps {
  currentUser: User;
  patients: Patient[];
}

type ReportType = 'admissions' | 'surgeries' | 'billing' | 'audit';

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  currentUser,
  patients,
}) => {
  const [activeReport, setActiveReport] = useState<ReportType>('admissions');
  const [counsellingList, setCounsellingList] = useState<CounsellingRecord[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [hospitals, setHospitals] = useState<HospitalSetting[]>([]);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Common Date Filter Presets: Default From Date: 7 days ago, To Date: 14 days in future
  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeekStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const pastMonthStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Filters State
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(nextWeekStr);
  const [selectedHospital, setSelectedHospital] = useState<string>('all');
  const [selectedEye, setSelectedEye] = useState<string>('all');
  const [billingStatusFilter, setBillingStatusFilter] = useState<string>('all');
  const [insuranceFilter, setInsuranceFilter] = useState<string>('all');
  const [auditModuleFilter, setAuditModuleFilter] = useState<string>('all');
  const [auditActorFilter, setAuditActorFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const reportContainerRef = useRef<HTMLDivElement>(null);

  // Load datasets
  useEffect(() => {
    const fetchData = async () => {
      const [cList, bList, rList, aList, hList] = await Promise.all([
        ApiClient.getCounsellingRecords(),
        ApiClient.getBills(),
        ApiClient.getReceipts(),
        ApiClient.getAuditLogs(),
        ApiClient.getHospitals(),
      ]);
      setCounsellingList(cList);
      setBills(bList);
      setReceipts(rList);
      setAuditLogs(aList);
      setHospitals(hList);
    };
    fetchData();
  }, []);

  // When switching reports, set appropriate default date range
  const handleSwitchReport = (type: ReportType) => {
    setActiveReport(type);
    if (type === 'admissions' || type === 'surgeries') {
      setStartDate(todayStr);
      setEndDate(nextWeekStr);
    } else {
      setStartDate(pastMonthStr);
      setEndDate(todayStr);
    }
  };

  // Helper for CSV Export
  const exportToCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const escapeCsv = (str: string | number) => {
      const val = String(str ?? '').replace(/"/g, '""');
      return `"${val}"`;
    };
    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...rows.map(row => row.map(escapeCsv).join(',')),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Native Print Handler
  const handlePrintReport = () => {
    if (!reportContainerRef.current) return;
    const content = reportContainerRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Abhinavas Eye Care - ${activeReport.toUpperCase()} Report</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 10mm 12mm;
            }
            body {
              font-family: Arial, -apple-system, BlinkMacSystemFont, sans-serif;
              color: #0f172a;
              background-color: #ffffff;
              margin: 0;
              padding: 0;
              font-size: 11px;
              line-height: 1.35;
            }
            .header-banner { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 10px; }
            .header-banner h1 { margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; }
            .header-banner p { margin: 2px 0; font-size: 10px; color: #334155; }
            .title-bar { text-align: center; font-size: 13px; font-weight: bold; text-transform: uppercase; background: #e2e8f0; padding: 4px; margin-bottom: 10px; border: 1px solid #cbd5e1; }
            .filter-badge { margin-bottom: 8px; font-size: 10px; color: #475569; }
            table { width: 100%; border-collapse: collapse; margin-top: 6px; }
            th, td { border: 1px solid #94a3b8; padding: 5px 6px; text-align: left; font-size: 10px; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 700);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // PDF Download Handler
  const handleDownloadPdf = async () => {
    if (!reportContainerRef.current) return;
    setIsExportingPdf(true);
    try {
      const element = reportContainerRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = 297;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Abhinavas_EyeCare_${activeReport}_Report_${startDate}_to_${endDate}.pdf`);
    } catch (err) {
      console.error('PDF export error', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // --------------------------------------------------------------------------
  // 1. ADMISSIONS REPORT DATA
  // Filter list of patients admitted/scheduled between dates with procedure information
  // --------------------------------------------------------------------------
  const admissionsData = useMemo(() => {
    return counsellingList
      .filter(record => {
        const inDate =
          (!startDate || record.tentativeSurgeryDate >= startDate) &&
          (!endDate || record.tentativeSurgeryDate <= endDate);

        const inHospital =
          selectedHospital === 'all' ||
          record.hospitalId === selectedHospital ||
          record.hospitalName.toLowerCase().includes(selectedHospital.toLowerCase());

        const inEye = selectedEye === 'all' || record.eyeSelection === selectedEye;

        const pMatch = patients.find(p => p.id === record.patientId);
        const matchesSearch =
          !searchQuery ||
          record.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (record.uhid && record.uhid.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (record.surgeryPlan && record.surgeryPlan.toLowerCase().includes(searchQuery.toLowerCase()));

        return inDate && inHospital && inEye && matchesSearch;
      })
      .sort((a, b) => a.tentativeSurgeryDate.localeCompare(b.tentativeSurgeryDate));
  }, [counsellingList, patients, startDate, endDate, selectedHospital, selectedEye, searchQuery]);

  const handleExportAdmissionsCsv = () => {
    const headers = [
      'S.No',
      'Admission / Surgery Date',
      'Patient Name',
      'UHID',
      'Age',
      'Gender',
      'Contact Phone',
      'Admitting Hospital',
      'Eye',
      'Procedure / Surgery Plan',
      'Planned Consumable / IOL',
      'Counsellor / Surgeon',
      'Insurance',
    ];
    const rows = admissionsData.map((rec, idx) => {
      const p = patients.find(pat => pat.id === rec.patientId);
      return [
        idx + 1,
        rec.tentativeSurgeryDate,
        rec.patientName,
        rec.uhid || rec.patientId,
        p?.age || '',
        p?.gender || '',
        p?.mobileNo || '',
        rec.hospitalName,
        rec.eyeSelection === 'OD' ? 'Left Eye (OD)' : rec.eyeSelection === 'OS' ? 'Right Eye (OS)' : 'Both Eyes (OU)',
        rec.surgeryPlan,
        rec.plannedConsumable,
        rec.counsellorName,
        p?.isInsured ? 'Insured (TPA)' : 'Self-Pay',
      ];
    });
    exportToCsv(`Admissions_Schedule_Report_${startDate}_to_${endDate}.csv`, headers, rows);
  };

  // --------------------------------------------------------------------------
  // 2. SURGERIES REPORT DATA
  // Surgeries with hospital-wise filtering
  // --------------------------------------------------------------------------
  const surgeriesData = useMemo(() => {
    return counsellingList
      .filter(record => {
        const inDate =
          (!startDate || record.tentativeSurgeryDate >= startDate) &&
          (!endDate || record.tentativeSurgeryDate <= endDate);

        const inHospital =
          selectedHospital === 'all' ||
          record.hospitalId === selectedHospital ||
          record.hospitalName.toLowerCase().includes(selectedHospital.toLowerCase());

        const matchesSearch =
          !searchQuery ||
          record.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (record.uhid && record.uhid.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (record.surgeryPlan && record.surgeryPlan.toLowerCase().includes(searchQuery.toLowerCase()));

        return inDate && inHospital && matchesSearch;
      })
      .sort((a, b) => a.tentativeSurgeryDate.localeCompare(b.tentativeSurgeryDate));
  }, [counsellingList, startDate, endDate, selectedHospital, searchQuery]);

  const handleExportSurgeriesCsv = () => {
    const headers = [
      'S.No',
      'Surgery Date',
      'Hospital Name',
      'Patient Name',
      'UHID',
      'Eye',
      'Surgical Procedure',
      'Planned Consumable / IOL',
      'Lens Type',
      'Lens Power',
      'Surgeon / Doctor',
      'Pre-Op Drug Allergies',
    ];
    const rows = surgeriesData.map((rec, idx) => {
      const p = patients.find(pat => pat.id === rec.patientId);
      return [
        idx + 1,
        rec.tentativeSurgeryDate,
        rec.hospitalName,
        rec.patientName,
        rec.uhid || rec.patientId,
        rec.eyeSelection,
        rec.surgeryPlan,
        rec.plannedConsumable,
        rec.lensType || '—',
        rec.lensPower || '—',
        rec.counsellorName,
        p?.drugAllergies || 'None',
      ];
    });
    exportToCsv(`Surgeries_Hospital_Report_${startDate}_to_${endDate}.csv`, headers, rows);
  };

  // --------------------------------------------------------------------------
  // 3. BILLING REPORT DATA
  // Bills within a given period with financial totals
  // --------------------------------------------------------------------------
  const billingData = useMemo(() => {
    return bills.filter(bill => {
      const inDate =
        (!startDate || bill.billDate >= startDate) &&
        (!endDate || bill.billDate <= endDate);

      const inStatus = billingStatusFilter === 'all' || bill.status === billingStatusFilter;
      const inInsurance =
        insuranceFilter === 'all' ||
        (insuranceFilter === 'insured' ? bill.isInsured : !bill.isInsured);

      const matchesSearch =
        !searchQuery ||
        bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bill.uhid && bill.uhid.toLowerCase().includes(searchQuery.toLowerCase()));

      return inDate && inStatus && inInsurance && matchesSearch;
    });
  }, [bills, startDate, endDate, billingStatusFilter, insuranceFilter, searchQuery]);

  const billingTotals = useMemo(() => {
    const gross = billingData.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
    const insuranceApproved = billingData.reduce(
      (acc, b) => acc + (b.isInsured ? (b.finalApprovedAmount || 0) : 0),
      0
    );
    const netPayable = billingData.reduce((acc, b) => acc + (b.patientNetPayable || 0), 0);
    const paid = billingData.reduce((acc, b) => acc + (b.paidAmount || 0), 0);
    const outstanding = billingData.reduce((acc, b) => acc + Math.max(0, b.balanceDue || 0), 0);

    return { gross, insuranceApproved, netPayable, paid, outstanding };
  }, [billingData]);

  const handleExportBillingCsv = () => {
    const headers = [
      'S.No',
      'Bill Date',
      'Bill Number',
      'Patient Name',
      'UHID',
      'Procedure Description',
      'Gross Amount (INR)',
      'Insurance Approved (INR)',
      'Patient Net Payable (INR)',
      'Paid Receipts (INR)',
      'Balance Due (INR)',
      'Status',
      'Payment Mode Breakdown',
    ];
    const rows = billingData.map((b, idx) => {
      return [
        idx + 1,
        b.billDate,
        b.billNumber,
        b.patientName,
        b.uhid || b.patientId,
        b.surgeryDetails || 'Ophthalmic Services',
        b.totalAmount,
        b.isInsured ? (b.finalApprovedAmount || 0) : 0,
        b.patientNetPayable,
        b.paidAmount,
        b.balanceDue,
        b.status,
        b.isInsured ? 'Insurance TPA' : 'Self-Pay',
      ];
    });
    exportToCsv(`Billing_Report_${startDate}_to_${endDate}.csv`, headers, rows);
  };

  // --------------------------------------------------------------------------
  // 4. AUDIT LOG REPORT DATA
  // Forensic tracking of actions across modules
  // --------------------------------------------------------------------------
  const auditData = useMemo(() => {
    return auditLogs.filter(log => {
      const dateStr = log.timestamp.split('T')[0];
      const inDate = (!startDate || dateStr >= startDate) && (!endDate || dateStr <= endDate);
      const inModule = auditModuleFilter === 'all' || log.targetType === auditModuleFilter;
      const inActor = auditActorFilter === 'all' || log.actorName === auditActorFilter;

      const matchesSearch =
        !searchQuery ||
        log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.targetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()));

      return inDate && inModule && inActor && matchesSearch;
    });
  }, [auditLogs, startDate, endDate, auditModuleFilter, auditActorFilter, searchQuery]);

  const handleExportAuditCsv = () => {
    const headers = [
      'S.No',
      'Timestamp',
      'Actor Name',
      'Role',
      'Action Taken',
      'Target Module',
      'Target Entity',
      'Changes',
      'Details',
    ];
    const rows = auditData.map((log, idx) => {
      const changesText = log.changes.map(c => `${c.field}: ${c.from} -> ${c.to}`).join('; ');
      return [
        idx + 1,
        new Date(log.timestamp).toLocaleString('en-IN'),
        log.actorName,
        log.actorRole,
        log.action,
        log.targetType,
        `${log.targetName} (${log.targetId})`,
        changesText,
        log.details || '',
      ];
    });
    exportToCsv(`Audit_Trail_Report_${startDate}_to_${endDate}.csv`, headers, rows);
  };

  // Distinct actors for audit filter
  const uniqueActors = useMemo(() => {
    const set = new Set<string>();
    auditLogs.forEach(l => set.add(l.actorName));
    return Array.from(set);
  }, [auditLogs]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Reports & Hospital Hand-off
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate printable PDF schedules for hospital administration, surgery planning, billing audits, and forensic logs.
          </p>
        </div>

        {/* Global Export & Print Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeReport === 'admissions') handleExportAdmissionsCsv();
              else if (activeReport === 'surgeries') handleExportSurgeriesCsv();
              else if (activeReport === 'billing') handleExportBillingCsv();
              else handleExportAuditCsv();
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExportingPdf ? 'Exporting...' : 'Save PDF'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-2 pt-2 shadow-xs">
        <button
          onClick={() => handleSwitchReport('admissions')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeReport === 'admissions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>1. Admissions Report ({admissionsData.length})</span>
        </button>

        <button
          onClick={() => handleSwitchReport('surgeries')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeReport === 'surgeries'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>2. Surgeries Report ({surgeriesData.length})</span>
        </button>

        <button
          onClick={() => handleSwitchReport('billing')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeReport === 'billing'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ReceiptIcon className="w-4 h-4" />
          <span>3. Billing Report ({billingData.length})</span>
        </button>

        <button
          onClick={() => handleSwitchReport('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeReport === 'audit'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>4. Audit Log Report ({auditData.length})</span>
        </button>
      </div>

      {/* FILTER BAR - Custom filters for each report */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Date range filters */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-600 uppercase">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg p-1.5 bg-slate-50 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-600 uppercase">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg p-1.5 bg-slate-50 focus:outline-none"
            />
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1 border-l pl-3 border-slate-200">
            <button
              onClick={() => {
                setStartDate(todayStr);
                setEndDate(nextWeekStr);
              }}
              className="px-2 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer"
            >
              Next 7 Days
            </button>
            <button
              onClick={() => {
                setStartDate(todayStr);
                setEndDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
              }}
              className="px-2 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer"
            >
              Next 14 Days
            </button>
            <button
              onClick={() => {
                setStartDate(pastMonthStr);
                setEndDate(todayStr);
              }}
              className="px-2 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer"
            >
              Past Month
            </button>
          </div>

          {/* Hospital-wise filter for Admissions & Surgeries */}
          {(activeReport === 'admissions' || activeReport === 'surgeries') && (
            <div className="flex items-center gap-2 border-l pl-3 border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 uppercase">Hospital:</span>
              <select
                value={selectedHospital}
                onChange={e => setSelectedHospital(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg p-1.5 bg-slate-50 focus:outline-none"
              >
                <option value="all">All Hospitals</option>
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Eye filter for Admissions */}
          {activeReport === 'admissions' && (
            <div className="flex items-center gap-2 border-l pl-3 border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 uppercase">Eye:</span>
              <select
                value={selectedEye}
                onChange={e => setSelectedEye(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg p-1.5 bg-slate-50 focus:outline-none"
              >
                <option value="all">All Eyes</option>
                <option value="OD">Left Eye (OD)</option>
                <option value="OS">Right Eye (OS)</option>
                <option value="Both">Both Eyes (OU)</option>
              </select>
            </div>
          )}

          {/* Billing Status filter */}
          {activeReport === 'billing' && (
            <>
              <div className="flex items-center gap-2 border-l pl-3 border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 uppercase">Status:</span>
                <select
                  value={billingStatusFilter}
                  onChange={e => setBillingStatusFilter(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg p-1.5 bg-slate-50 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="Settled">Settled</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Generated">Generated</option>
                  <option value="Refundable">Refundable</option>
                </select>
              </div>

              <div className="flex items-center gap-2 border-l pl-3 border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 uppercase">Insurance:</span>
                <select
                  value={insuranceFilter}
                  onChange={e => setInsuranceFilter(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg p-1.5 bg-slate-50 focus:outline-none"
                >
                  <option value="all">All Patients</option>
                  <option value="insured">TPA Cashless Insured</option>
                  <option value="self_pay">Self-Pay</option>
                </select>
              </div>
            </>
          )}

          {/* Audit filters */}
          {activeReport === 'audit' && (
            <>
              <div className="flex items-center gap-2 border-l pl-3 border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 uppercase">Module:</span>
                <select
                  value={auditModuleFilter}
                  onChange={e => setAuditModuleFilter(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg p-1.5 bg-slate-50 focus:outline-none"
                >
                  <option value="all">All Modules</option>
                  <option value="Patient">Patient Registry</option>
                  <option value="Billing">Billing & Receipts</option>
                  <option value="Estimate">Treatment Estimates</option>
                  <option value="Counselling">Counselling & Surgery</option>
                  <option value="Staff">Staff & Roles</option>
                  <option value="Settings">Settings</option>
                </select>
              </div>

              <div className="flex items-center gap-2 border-l pl-3 border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 uppercase">Actor:</span>
                <select
                  value={auditActorFilter}
                  onChange={e => setAuditActorFilter(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg p-1.5 bg-slate-50 focus:outline-none"
                >
                  <option value="all">All Staff Members</option>
                  {uniqueActors.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Search Input */}
          <div className="flex-1 min-w-[200px] relative ml-auto">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter by name, UHID, details..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* BILLING SUMMARY METRIC BAR (For billing report) */}
      {activeReport === 'billing' && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Invoiced</span>
            <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
              ₹{billingTotals.gross.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-500">{billingData.length} bills in period</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-blue-200 bg-blue-50/20 shadow-xs">
            <span className="text-[10px] font-bold text-blue-700 uppercase block">Insurance Approved</span>
            <div className="text-lg font-black text-blue-900 font-mono mt-0.5">
              ₹{billingTotals.insuranceApproved.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-blue-600">Cashless approved</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Patient Net Share</span>
            <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
              ₹{billingTotals.netPayable.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-500">Co-pay & Deductions</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
            <span className="text-[10px] font-bold text-emerald-700 uppercase block">Total Collected</span>
            <div className="text-lg font-black text-emerald-800 font-mono mt-0.5">
              ₹{billingTotals.paid.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-emerald-600">Receipts in parts</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
            <span className="text-[10px] font-bold text-amber-800 uppercase block">Outstanding Balance</span>
            <div className="text-lg font-black text-amber-900 font-mono mt-0.5">
              ₹{billingTotals.outstanding.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-amber-700">Receivable from patients</div>
          </div>
        </div>
      )}

      {/* PRINTABLE REPORT CONTAINER */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 overflow-x-auto">
        <div ref={reportContainerRef} className="min-w-[800px]">
          {/* Abhinavas Eye Care Official Header */}
          <div className="text-center border-b-2 border-slate-900 pb-3 mb-3">
            <h1 className="text-xl font-extrabold tracking-wider text-slate-900 uppercase">
              ABHINAVAS EYE CARE
            </h1>
            <p className="text-xs text-slate-700 mt-0.5">
              New No. 42, Old No. 25, 2nd Main Road, Kasthuribai Nagar, Adyar, Chennai – 600 020.
            </p>
            <p className="text-[11px] font-medium text-slate-600">
              Phone: 044 24413453 / 044 24426767 / 044 47903019 / 95662 59044
            </p>
          </div>

          {/* Title Bar with dates */}
          <div className="bg-slate-100 border border-slate-300 py-1.5 px-3 flex items-center justify-between mb-3 text-xs">
            <span className="font-extrabold text-slate-900 uppercase tracking-wide">
              {activeReport === 'admissions' && 'OFFICIAL PATIENT ADMISSIONS & SURGERY SCHEDULE REPORT'}
              {activeReport === 'surgeries' && 'HOSPITAL-WISE SURGICAL CASE REGISTER & OT SCHEDULE'}
              {activeReport === 'billing' && 'HOSPITAL BILLING, COLLECTIONS & REVENUE STATEMENT'}
              {activeReport === 'audit' && 'SYSTEM AUDIT TRAIL & CLINICAL MODIFICATION LOG'}
            </span>
            <span className="text-slate-600 font-semibold">
              Period: {startDate} to {endDate}
            </span>
          </div>

          {/* Report 1: Admissions Table */}
          {activeReport === 'admissions' && (
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="border border-slate-300 p-2 text-center w-8">#</th>
                  <th className="border border-slate-300 p-2 w-24">Admission Date</th>
                  <th className="border border-slate-300 p-2 w-44">Patient Name & UHID</th>
                  <th className="border border-slate-300 p-2 w-16 text-center">Age / Gen</th>
                  <th className="border border-slate-300 p-2 w-28">Contact No</th>
                  <th className="border border-slate-300 p-2 w-40">Admitting Hospital</th>
                  <th className="border border-slate-300 p-2 w-16 text-center">Eye</th>
                  <th className="border border-slate-300 p-2">Procedure / Surgery Plan</th>
                  <th className="border border-slate-300 p-2 w-40">Planned Consumable / IOL</th>
                  <th className="border border-slate-300 p-2 w-36">Surgeon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {admissionsData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-slate-400 italic">
                      No patient admissions found for the selected date range ({startDate} to {endDate}).
                    </td>
                  </tr>
                ) : (
                  admissionsData.map((rec, idx) => {
                    const p = patients.find(pat => pat.id === rec.patientId);
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/70">
                        <td className="border border-slate-300 p-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="border border-slate-300 p-2 font-semibold text-slate-900">
                          {new Date(rec.tentativeSurgeryDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="border border-slate-300 p-2">
                          <div className="font-bold text-slate-900">{rec.patientName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">UHID: {rec.uhid || rec.patientId}</div>
                        </td>
                        <td className="border border-slate-300 p-2 text-center text-slate-700">
                          {p ? `${p.age} / ${p.gender.charAt(0)}` : '—'}
                        </td>
                        <td className="border border-slate-300 p-2 text-slate-700 font-mono">
                          {p?.mobileNo || '—'}
                        </td>
                        <td className="border border-slate-300 p-2 font-medium text-slate-800">
                          {rec.hospitalName}
                        </td>
                        <td className="border border-slate-300 p-2 text-center">
                          <span className="font-bold px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-800">
                            {rec.eyeSelection === 'OD' ? 'Left (OD)' : rec.eyeSelection === 'OS' ? 'Right (OS)' : 'Both (OU)'}
                          </span>
                        </td>
                        <td className="border border-slate-300 p-2 text-slate-800 font-medium">
                          {rec.surgeryPlan}
                        </td>
                        <td className="border border-slate-300 p-2 text-slate-700 text-[11px]">
                          {rec.plannedConsumable}
                        </td>
                        <td className="border border-slate-300 p-2 text-slate-800">
                          {rec.counsellorName}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {/* Report 2: Surgeries Table */}
          {activeReport === 'surgeries' && (
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="border border-slate-300 p-2 text-center w-8">#</th>
                  <th className="border border-slate-300 p-2 w-24">Date</th>
                  <th className="border border-slate-300 p-2 w-44">Hospital Facility</th>
                  <th className="border border-slate-300 p-2 w-40">Patient & UHID</th>
                  <th className="border border-slate-300 p-2 w-14 text-center">Eye</th>
                  <th className="border border-slate-300 p-2">Surgical Procedure</th>
                  <th className="border border-slate-300 p-2 w-40">Lens & Consumable</th>
                  <th className="border border-slate-300 p-2 w-32">Surgeon</th>
                  <th className="border border-slate-300 p-2 w-28">Allergies</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {surgeriesData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-400 italic">
                      No surgeries found matching filters.
                    </td>
                  </tr>
                ) : (
                  surgeriesData.map((rec, idx) => {
                    const p = patients.find(pat => pat.id === rec.patientId);
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/70">
                        <td className="border border-slate-300 p-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="border border-slate-300 p-2 font-semibold text-slate-900">
                          {rec.tentativeSurgeryDate}
                        </td>
                        <td className="border border-slate-300 p-2 font-bold text-slate-900">
                          {rec.hospitalName}
                        </td>
                        <td className="border border-slate-300 p-2">
                          <div className="font-semibold text-slate-900">{rec.patientName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{rec.uhid || rec.patientId}</div>
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-bold">
                          {rec.eyeSelection}
                        </td>
                        <td className="border border-slate-300 p-2 text-slate-800">
                          {rec.surgeryPlan}
                        </td>
                        <td className="border border-slate-300 p-2 text-slate-700 text-[11px]">
                          <div>{rec.plannedConsumable}</div>
                          {rec.lensPower && <div className="text-[10px] text-slate-500 font-mono">P: {rec.lensPower}</div>}
                        </td>
                        <td className="border border-slate-300 p-2 text-slate-800">
                          {rec.counsellorName}
                        </td>
                        <td className="border border-slate-300 p-2 text-rose-700 font-medium text-[11px]">
                          {p?.drugAllergies && p.drugAllergies.toLowerCase() !== 'none' ? p.drugAllergies : 'None'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {/* Report 3: Billing Table */}
          {activeReport === 'billing' && (
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="border border-slate-300 p-2 text-center w-8">#</th>
                  <th className="border border-slate-300 p-2 w-20">Bill Date</th>
                  <th className="border border-slate-300 p-2 w-32">Bill Number</th>
                  <th className="border border-slate-300 p-2 w-40">Patient Name & UHID</th>
                  <th className="border border-slate-300 p-2">Surgery / Service</th>
                  <th className="border border-slate-300 p-2 text-right w-24">Gross (₹)</th>
                  <th className="border border-slate-300 p-2 text-right w-28">Insurance (₹)</th>
                  <th className="border border-slate-300 p-2 text-right w-24">Net Share (₹)</th>
                  <th className="border border-slate-300 p-2 text-right w-24">Paid (₹)</th>
                  <th className="border border-slate-300 p-2 text-right w-24">Balance (₹)</th>
                  <th className="border border-slate-300 p-2 text-center w-24">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {billingData.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-8 text-slate-400 italic">
                      No bills found for the selected period.
                    </td>
                  </tr>
                ) : (
                  billingData.map((b, idx) => (
                    <tr key={b.id} className="hover:bg-slate-50/70">
                      <td className="border border-slate-300 p-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="border border-slate-300 p-2 text-slate-700">{b.billDate}</td>
                      <td className="border border-slate-300 p-2 font-mono font-bold text-slate-900">{b.billNumber}</td>
                      <td className="border border-slate-300 p-2">
                        <div className="font-semibold text-slate-900">{b.patientName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{b.uhid || b.patientId}</div>
                      </td>
                      <td className="border border-slate-300 p-2 text-slate-800">{b.surgeryDetails || 'Eye Care'}</td>
                      <td className="border border-slate-300 p-2 text-right font-mono font-semibold text-slate-900">
                        ₹{b.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="border border-slate-300 p-2 text-right font-mono text-blue-700">
                        {b.isInsured ? `₹${(b.finalApprovedAmount || 0).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="border border-slate-300 p-2 text-right font-mono font-bold text-slate-900">
                        ₹{b.patientNetPayable.toLocaleString('en-IN')}
                      </td>
                      <td className="border border-slate-300 p-2 text-right font-mono font-bold text-emerald-700">
                        ₹{b.paidAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                        <span className={b.balanceDue > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                          ₹{Math.abs(b.balanceDue).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="border border-slate-300 p-2 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          b.status === 'Settled'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'Partially Paid'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* Report 4: Audit Trail Table */}
          {activeReport === 'audit' && (
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="border border-slate-300 p-2 text-center w-8">#</th>
                  <th className="border border-slate-300 p-2 w-32">Timestamp</th>
                  <th className="border border-slate-300 p-2 w-36">Staff Actor</th>
                  <th className="border border-slate-300 p-2 w-36">Action</th>
                  <th className="border border-slate-300 p-2 w-24">Module</th>
                  <th className="border border-slate-300 p-2 w-36">Target Record</th>
                  <th className="border border-slate-300 p-2">Changes Recorded</th>
                  <th className="border border-slate-300 p-2 w-44">Forensic Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {auditData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400 italic">
                      No audit events found for selected filters.
                    </td>
                  </tr>
                ) : (
                  auditData.map((log, idx) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="border border-slate-300 p-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="border border-slate-300 p-2 text-slate-600 font-mono text-[10px]">
                        {new Date(log.timestamp).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="border border-slate-300 p-2">
                        <div className="font-semibold text-slate-900">{log.actorName}</div>
                        <div className="text-[10px] text-slate-500 uppercase">{log.actorRole}</div>
                      </td>
                      <td className="border border-slate-300 p-2 font-medium text-slate-900">{log.action}</td>
                      <td className="border border-slate-300 p-2">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                          {log.targetType}
                        </span>
                      </td>
                      <td className="border border-slate-300 p-2 font-mono text-slate-800 text-[11px]">
                        {log.targetName}
                      </td>
                      <td className="border border-slate-300 p-2 text-[10px] text-slate-700">
                        {log.changes.map((c, cIdx) => (
                          <div key={cIdx} className="font-mono">
                            <strong>{c.field}:</strong> {c.from || 'none'} ➔ {c.to}
                          </div>
                        ))}
                      </td>
                      <td className="border border-slate-300 p-2 text-[10px] text-slate-600">
                        {log.details || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* Report Footer */}
          <div className="mt-8 pt-4 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500">
            <div>
              Generated on {new Date().toLocaleString('en-IN')} by {currentUser.name} ({currentUser.role})
            </div>
            <div className="text-right">
              Abhinavas Eye Care Medical Records & Hospital Management Suite
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
