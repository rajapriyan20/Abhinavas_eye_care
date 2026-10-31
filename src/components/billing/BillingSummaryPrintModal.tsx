import React, { useRef, useState } from 'react';
import { PatientBillingSummary, Patient } from '../../types';
import { X, Printer, Download, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

interface BillingSummaryPrintModalProps {
  summary: PatientBillingSummary;
  patient?: Patient;
  onClose: () => void;
}

export const BillingSummaryPrintModal: React.FC<BillingSummaryPrintModalProps> = ({
  summary,
  patient,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=900,height=850');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Billing Summary - ${summary.patientName} (${summary.uhid || summary.patientId})</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            body {
              font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              color: #111827;
              background-color: #ffffff;
              margin: 0;
              padding: 0;
              font-size: 12px;
              line-height: 1.4;
            }
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 5px 8px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .header-banner { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 10px; }
            .header-banner h1 { margin: 0; font-size: 18px; font-weight: 800; letter-spacing: 0.5px; color: #0f172a; }
            .header-banner p { margin: 2px 0; font-size: 11px; color: #334155; }
            .title-bar { text-align: center; font-size: 13px; font-weight: bold; text-transform: uppercase; background: #e2e8f0; padding: 4px; margin-bottom: 10px; border: 1px solid #cbd5e1; }
            .status-box { padding: 10px; text-align: center; font-weight: bold; margin: 12px 0; border: 2px solid #334155; border-radius: 4px; }
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

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Billing_Summary_${summary.patientName.replace(/\s+/g, '_')}_${summary.uhid || summary.patientId}.pdf`);
    } catch (err) {
      console.error('Failed to generate Billing Summary PDF', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200">
        {/* Top Control Bar */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wide">Patient Billing Summary Preview</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              {summary.patientName} ({summary.uhid || summary.patientId})
            </span>
            <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
              summary.financialStatus === 'Cleared'
                ? 'bg-emerald-900 text-emerald-300'
                : summary.financialStatus === 'Outstanding'
                ? 'bg-rose-900 text-rose-300'
                : 'bg-amber-900 text-amber-300'
            }`}>
              {summary.financialStatus}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Summary</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100 flex justify-center">
          <div
            ref={printRef}
            className="w-full max-w-[210mm] bg-white p-8 md:p-10 shadow-lg text-slate-900 rounded-sm font-sans"
            style={{ minHeight: '270mm' }}
          >
            {/* Abhinavas Eye Care Official Header */}
            <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-wider text-slate-900 uppercase">
                ABHINAVAS EYE CARE
              </h1>
              <p className="text-xs text-slate-700 mt-1">
                New No. 42, Old No. 25, 2nd Main Road, Kasthuribai Nagar, Adyar, Chennai – 600 020.
              </p>
              <p className="text-xs font-medium text-slate-600">
                Phone: 044 24413453 / 044 24426767 / 044 47903019 / 95662 59044
              </p>
            </div>

            {/* Document Title Header */}
            <div className="bg-slate-100 border border-slate-300 py-1.5 px-3 text-center mb-4">
              <span className="font-extrabold text-sm tracking-wider uppercase text-slate-900">
                CONSOLIDATED PATIENT BILLING & FINANCIAL SETTLEMENT STATEMENT
              </span>
            </div>

            {/* Patient Profile Snapshot */}
            <div className="border border-slate-300 rounded p-3 mb-4 text-xs bg-slate-50/60">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Patient Name</span>
                  <span className="font-bold text-slate-900">{summary.patientName}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">UHID / Patient ID</span>
                  <span className="font-bold text-slate-900 font-mono">{summary.uhid || summary.patientId}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Age / Gender</span>
                  <span className="text-slate-900">
                    {patient ? `${patient.age} Yrs / ${patient.gender}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Insurance Category</span>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    summary.isInsured ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {summary.isInsured ? 'Insured (TPA / Cashless)' : 'Self-Pay'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Contact Mobile</span>
                  <span className="text-slate-900">{patient?.mobileNo || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Attending Doctor</span>
                  <span className="text-slate-900">{patient?.attendingDoctor || 'Dr.A.R.Karthik, DO, DNB'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Statement Date</span>
                  <span className="text-slate-900 font-semibold">
                    {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Overall Financial State</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    summary.financialStatus === 'Cleared'
                      ? 'bg-emerald-100 text-emerald-800'
                      : summary.financialStatus === 'Outstanding'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {summary.financialStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 1: Invoices / Bills Generated */}
            <div className="mb-4">
              <div className="font-bold text-xs uppercase text-slate-800 tracking-wider mb-1.5 flex items-center justify-between">
                <span>1. Hospital Bills Issued ({summary.bills.length})</span>
                <span className="text-slate-500 text-[10px]">Total Billed: ₹{summary.totalBilled.toLocaleString('en-IN')}</span>
              </div>
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="border border-slate-300 py-1.5 px-2 text-center w-8">#</th>
                    <th className="border border-slate-300 py-1.5 px-2.5">Bill No & Date</th>
                    <th className="border border-slate-300 py-1.5 px-2.5">Surgery / Service</th>
                    <th className="border border-slate-300 py-1.5 px-2 text-right">Gross Total</th>
                    <th className="border border-slate-300 py-1.5 px-2 text-right">Insurance Approved</th>
                    <th className="border border-slate-300 py-1.5 px-2 text-right">Patient Share</th>
                    <th className="border border-slate-300 py-1.5 px-2 text-center w-24">Bill Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {summary.bills.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-3 text-slate-500 italic">No bills generated yet</td>
                    </tr>
                  ) : (
                    summary.bills.map((bill, idx) => (
                      <tr key={bill.id}>
                        <td className="border border-slate-300 py-1.5 px-2 text-center text-slate-500">{idx + 1}</td>
                        <td className="border border-slate-300 py-1.5 px-2.5">
                          <div className="font-mono font-bold text-slate-900">{bill.billNumber}</div>
                          <div className="text-[10px] text-slate-500">{bill.billDate}</div>
                        </td>
                        <td className="border border-slate-300 py-1.5 px-2.5 text-slate-800">
                          {bill.surgeryDetails || 'General Ophthalmic Services'}
                        </td>
                        <td className="border border-slate-300 py-1.5 px-2 text-right font-mono text-slate-900">
                          ₹{bill.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="border border-slate-300 py-1.5 px-2 text-right font-mono text-blue-700">
                          {bill.isInsured ? `₹${(bill.finalApprovedAmount || 0).toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="border border-slate-300 py-1.5 px-2 text-right font-mono font-bold text-slate-900">
                          ₹{bill.patientNetPayable.toLocaleString('en-IN')}
                        </td>
                        <td className="border border-slate-300 py-1.5 px-2 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            bill.status === 'Settled'
                              ? 'bg-emerald-100 text-emerald-800'
                              : bill.status === 'Partially Paid'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {bill.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Section 2: Payments / Receipts Received */}
            <div className="mb-4">
              <div className="font-bold text-xs uppercase text-slate-800 tracking-wider mb-1.5 flex items-center justify-between">
                <span>2. Payment Receipts Collected ({summary.receipts.length})</span>
                <span className="text-slate-500 text-[10px]">Total Received: ₹{summary.totalPaid.toLocaleString('en-IN')}</span>
              </div>
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="border border-slate-300 py-1.5 px-2 text-center w-8">#</th>
                    <th className="border border-slate-300 py-1.5 px-2.5">Receipt No & Date</th>
                    <th className="border border-slate-300 py-1.5 px-2.5">Tagged Bill</th>
                    <th className="border border-slate-300 py-1.5 px-2.5">Payment Mode</th>
                    <th className="border border-slate-300 py-1.5 px-2.5">Transaction Ref / UTR</th>
                    <th className="border border-slate-300 py-1.5 px-2 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {summary.receipts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-3 text-slate-500 italic">No payment receipts recorded yet</td>
                    </tr>
                  ) : (
                    summary.receipts.map((rcp, idx) => (
                      <tr key={rcp.id}>
                        <td className="border border-slate-300 py-1.5 px-2 text-center text-slate-500">{idx + 1}</td>
                        <td className="border border-slate-300 py-1.5 px-2.5">
                          <div className="font-mono font-bold text-slate-900">{rcp.receiptNumber}</div>
                          <div className="text-[10px] text-slate-500">{rcp.paymentDate}</div>
                        </td>
                        <td className="border border-slate-300 py-1.5 px-2.5 font-mono text-blue-700">
                          {rcp.billNumber}
                        </td>
                        <td className="border border-slate-300 py-1.5 px-2.5">
                          <span className="font-semibold text-slate-800">{rcp.paymentMode}</span>
                        </td>
                        <td className="border border-slate-300 py-1.5 px-2.5 font-mono text-slate-700">
                          {rcp.referenceNumber || '—'}
                        </td>
                        <td className="border border-slate-300 py-1.5 px-2 text-right font-mono font-bold text-emerald-700">
                          ₹{rcp.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Section 3: Financial Settlement Ledger Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              {/* Financial State Banner */}
              <div className={`rounded border p-4 flex flex-col justify-center items-center text-center ${
                summary.financialStatus === 'Cleared'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : summary.financialStatus === 'Outstanding'
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}>
                {summary.financialStatus === 'Cleared' && (
                  <>
                    <CheckCircle className="w-8 h-8 text-emerald-600 mb-1" />
                    <div className="text-sm font-extrabold uppercase tracking-wide">
                      ACCOUNT STATUS: CLEARED
                    </div>
                    <p className="text-xs text-emerald-700 mt-1">
                      All hospital bills have been fully settled. No outstanding dues remain.
                    </p>
                  </>
                )}
                {summary.financialStatus === 'Outstanding' && (
                  <>
                    <AlertTriangle className="w-8 h-8 text-rose-600 mb-1" />
                    <div className="text-sm font-extrabold uppercase tracking-wide">
                      OUTSTANDING BALANCE DUE
                    </div>
                    <div className="text-2xl font-black font-mono text-rose-700 my-1">
                      ₹{summary.balanceDue.toLocaleString('en-IN')}
                    </div>
                    <p className="text-xs text-rose-700">
                      Balance payable by the patient towards completed/planned clinical services.
                    </p>
                  </>
                )}
                {summary.financialStatus === 'Refundable' && (
                  <>
                    <AlertCircle className="w-8 h-8 text-amber-600 mb-1" />
                    <div className="text-sm font-extrabold uppercase tracking-wide">
                      REFUNDABLE CREDIT BALANCE
                    </div>
                    <div className="text-2xl font-black font-mono text-amber-700 my-1">
                      ₹{Math.abs(summary.balanceDue).toLocaleString('en-IN')}
                    </div>
                    <p className="text-xs text-amber-700">
                      Excess amount received over final net liability. Refundable to patient.
                    </p>
                  </>
                )}
              </div>

              {/* Settlement Calculation Table */}
              <div className="border border-slate-300 rounded text-xs bg-white">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 px-3 text-slate-600">Total Gross Billed:</td>
                      <td className="py-1.5 px-3 text-right font-mono font-medium text-slate-900">
                        ₹{summary.totalBilled.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200 text-blue-700">
                      <td className="py-1.5 px-3">Less: Final Insurance Approved Amount:</td>
                      <td className="py-1.5 px-3 text-right font-mono font-medium">
                        -₹{summary.totalInsuranceApproved.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200 bg-slate-50 font-bold">
                      <td className="py-1.5 px-3 text-slate-900">Total Patient Net Responsibility:</td>
                      <td className="py-1.5 px-3 text-right font-mono text-slate-900">
                        ₹{summary.totalPatientNetPayable.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200 text-emerald-700">
                      <td className="py-1.5 px-3">Less: Total Part Receipts Collected:</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold">
                        -₹{summary.totalPaid.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className={`font-extrabold text-sm ${
                      summary.financialStatus === 'Cleared'
                        ? 'bg-emerald-100 text-emerald-900'
                        : summary.financialStatus === 'Outstanding'
                        ? 'bg-rose-100 text-rose-900'
                        : 'bg-amber-100 text-amber-900'
                    }`}>
                      <td className="py-2.5 px-3">
                        {summary.financialStatus === 'Cleared'
                          ? 'Net Balance (Settled):'
                          : summary.financialStatus === 'Outstanding'
                          ? 'Net Outstanding Due:'
                          : 'Net Refund Due:'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        ₹{Math.abs(summary.balanceDue).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer with sign */}
            <div className="pt-6 border-t border-slate-300 text-xs">
              <div className="flex justify-between items-end">
                <div className="text-[10px] text-slate-500">
                  <p>• Verified statement of accounts generated from Abhinavas Eye Care billing system.</p>
                  <p>• Valid for clinical discharge and medical reimbursement purposes.</p>
                </div>
                <div className="text-center w-52">
                  <div className="h-10"></div>
                  <div className="border-t border-slate-800 pt-1 font-bold text-slate-900 text-xs">
                    Accounts Officer / Authorised Signatory
                  </div>
                  <div className="text-[10px] text-slate-500">Abhinavas Eye Care, Chennai</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
