import React, { useRef, useState } from 'react';
import { Bill, Patient } from '../../types';
import { X, Printer, Download, CheckCircle, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

interface BillPrintModalProps {
  bill: Bill;
  patient?: Patient;
  onClose: () => void;
}

export const BillPrintModal: React.FC<BillPrintModalProps> = ({
  bill,
  patient,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Convert numbers to Indian Rupees words
  const numberToWords = (num: number): string => {
    if (!num || num === 0) return 'Zero Rupees Only';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n: number): string => {
      let str = '';
      if (n >= 10000000) {
        str += inWords(Math.floor(n / 10000000)) + 'Crore ';
        n %= 10000000;
      }
      if (n >= 100000) {
        str += inWords(Math.floor(n / 100000)) + 'Lakh ';
        n %= 100000;
      }
      if (n >= 1000) {
        str += inWords(Math.floor(n / 1000)) + 'Thousand ';
        n %= 1000;
      }
      if (n >= 100) {
        str += inWords(Math.floor(n / 100)) + 'Hundred ';
        n %= 100;
      }
      if (n > 0) {
        if (str !== '') str += 'and ';
        if (n < 20) str += a[n];
        else {
          str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
        }
      }
      return str;
    };

    return 'Rupees ' + inWords(Math.floor(num)).trim() + ' Only';
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hospital Bill - ${bill.billNumber} - ${bill.patientName}</title>
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
              font-size: 13px;
              line-height: 1.4;
            }
            .no-print { display: none !important; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #94a3b8; padding: 6px 8px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .header-banner { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px; }
            .header-banner h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; color: #0f172a; }
            .header-banner p { margin: 2px 0; font-size: 11px; color: #334155; }
            .title-bar { text-align: center; font-size: 14px; font-weight: bold; text-transform: uppercase; background: #e2e8f0; padding: 4px; margin-bottom: 12px; border: 1px solid #cbd5e1; }
            .meta-grid { width: 100%; margin-bottom: 14px; border: 1px solid #cbd5e1; }
            .meta-grid td { border: none; padding: 4px 8px; font-size: 12px; vertical-align: top; }
            .financial-box { margin-top: 12px; border: 1px solid #94a3b8; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }
            .badge-settled { background: #dcfce7; color: #166534; }
            .badge-part { background: #fef3c7; color: #92400e; }
            .badge-due { background: #fee2e2; color: #991b1b; }
            .footer-sign { margin-top: 35px; display: flex; justify-content: space-between; }
            .sign-box { text-align: center; width: 200px; border-top: 1px solid #475569; padding-top: 6px; font-size: 11px; }
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
      pdf.save(`Bill_${bill.billNumber.replace(/[^a-zA-Z0-9]/g, '_')}_${bill.patientName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Failed to generate Bill PDF', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200">
        {/* Modal Top Control Bar */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wide">Hospital Bill Print Preview</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              {bill.billNumber}
            </span>
            {bill.status === 'Settled' && (
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Settled
              </span>
            )}
            {bill.status === 'Partially Paid' && (
              <span className="text-xs px-2 py-0.5 rounded bg-amber-900/80 text-amber-300 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" /> Partially Paid
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Bill</span>
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

        {/* Scrollable Printable Document Paper */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100 flex justify-center">
          <div
            ref={printRef}
            className="w-full max-w-[210mm] bg-white p-8 md:p-10 shadow-lg text-slate-900 rounded-sm font-sans"
            style={{ minHeight: '270mm' }}
          >
            {/* Abhinavas Eye Care Official Mandatory Header */}
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
                IN-PATIENT / SURGICAL BILL & INVOICE
              </span>
            </div>

            {/* Meta Details Grid */}
            <div className="border border-slate-300 rounded-xs mb-4 text-xs bg-slate-50/50 p-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Bill Number</span>
                  <span className="font-bold text-slate-900 font-mono">{bill.billNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Bill Date</span>
                  <span className="font-bold text-slate-900">
                    {new Date(bill.billDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Patient Name</span>
                  <span className="font-bold text-slate-900">{bill.patientName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">UHID / MRD No</span>
                  <span className="font-bold text-slate-900 font-mono">{bill.uhid || bill.patientId}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Age / Gender</span>
                  <span className="text-slate-900">
                    {patient ? `${patient.age} Yrs / ${patient.gender}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Contact Mobile</span>
                  <span className="text-slate-900">{patient?.mobileNo || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Consultant / Surgeon</span>
                  <span className="font-semibold text-slate-900">
                    {bill.doctorName || 'Dr.A.R.Karthik, DO, DNB'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Payment Status</span>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    bill.status === 'Settled'
                      ? 'bg-emerald-100 text-emerald-800'
                      : bill.status === 'Partially Paid'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {bill.status}
                  </span>
                </div>

                {bill.surgeryDate && (
                  <div className="col-span-2 md:col-span-4 pt-1 border-t border-slate-200 mt-1">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">
                      Surgery Date & Procedure Description
                    </span>
                    <span className="font-medium text-slate-900">
                      <strong>{new Date(bill.surgeryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong> — {bill.surgeryDetails || 'Ophthalmic Procedure'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Insurance Details Box (if applicable) */}
            {bill.isInsured && (
              <div className="border border-blue-200 bg-blue-50/60 rounded-xs p-3 mb-4 text-xs">
                <div className="flex items-center gap-1.5 text-blue-900 font-bold mb-2 pb-1 border-b border-blue-200">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  <span className="uppercase text-[11px] tracking-wider">Insurance & TPA Approval Details</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Insurance Company</span>
                    <span className="font-semibold text-slate-800">{bill.insuranceCompany || 'TPA Insured'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">TPA / Claim Ref</span>
                    <span className="text-slate-800">{bill.tpaName || '—'} {bill.claimNumber ? `(${bill.claimNumber})` : ''}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Pre-Auth / Estimated</span>
                    <span className="text-slate-800">₹{(bill.preAuthAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-emerald-50 p-1.5 rounded border border-emerald-200">
                    <span className="text-emerald-800 text-[10px] uppercase font-bold block">Final Approved Amount</span>
                    <span className="font-bold text-emerald-900 text-sm">
                      ₹{(bill.finalApprovedAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {Boolean(bill.coPayPercent || bill.coPayAmount) && (
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block">Co-Payment Details</span>
                      <span className="text-slate-800 font-medium">
                        {bill.coPayPercent ? `${bill.coPayPercent}% ` : ''}
                        (₹{(bill.coPayAmount || 0).toLocaleString('en-IN')})
                      </span>
                    </div>
                  )}
                  {Boolean(bill.nonMedicalDeductions) && (
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block">Non-Medical Deductions</span>
                      <span className="text-slate-800 font-medium">
                        ₹{(bill.nonMedicalDeductions || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="text-slate-500 text-[10px] uppercase block">Patient Co-Pay / Net Responsibility</span>
                    <span className="font-bold text-slate-900">
                      ₹{bill.patientNetPayable.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Itemized Bill Table */}
            <div className="mb-4">
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="border border-slate-300 py-2 px-2.5 text-center w-10">#</th>
                    <th className="border border-slate-300 py-2 px-3 text-left">Particulars / Service Description</th>
                    <th className="border border-slate-300 py-2 px-2 text-center w-20">Category</th>
                    <th className="border border-slate-300 py-2 px-2 text-center w-12">Qty</th>
                    <th className="border border-slate-300 py-2 px-3 text-right w-24">Rate (₹)</th>
                    <th className="border border-slate-300 py-2 px-3 text-right w-28">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {bill.items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="border border-slate-300 py-2 px-2.5 text-center text-slate-500">
                        {index + 1}
                      </td>
                      <td className="border border-slate-300 py-2 px-3 text-slate-900 font-medium">
                        {item.description}
                      </td>
                      <td className="border border-slate-300 py-2 px-2 text-center text-[10px] uppercase text-slate-500">
                        {item.category.replace('_', ' ')}
                      </td>
                      <td className="border border-slate-300 py-2 px-2 text-center text-slate-700">
                        {item.quantity}
                      </td>
                      <td className="border border-slate-300 py-2 px-3 text-right text-slate-700 font-mono">
                        {item.unitPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="border border-slate-300 py-2 px-3 text-right font-semibold text-slate-900 font-mono">
                        {item.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Calculation Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1 uppercase text-[10px] tracking-wider">
                  Amount In Words:
                </span>
                <p className="font-medium italic text-slate-800 leading-relaxed">
                  {numberToWords(bill.isInsured ? bill.patientNetPayable : bill.totalAmount)}
                </p>

                {bill.notes && (
                  <div className="mt-3 pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-700 block text-[10px] uppercase">Remarks / Notes:</span>
                    <p className="text-slate-600 text-[11px] mt-0.5">{bill.notes}</p>
                  </div>
                )}
              </div>

              {/* Totals Table */}
              <div className="border border-slate-300 rounded text-xs bg-white">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 px-3 text-slate-600">Subtotal:</td>
                      <td className="py-1.5 px-3 text-right font-mono font-medium text-slate-800">
                        ₹{bill.subtotal.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    {Boolean(bill.discount) && (
                      <tr className="border-b border-slate-200 text-emerald-700">
                        <td className="py-1.5 px-3">Discount:</td>
                        <td className="py-1.5 px-3 text-right font-mono font-medium">
                          -₹{bill.discount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    )}
                    <tr className="border-b border-slate-300 bg-slate-50 font-bold">
                      <td className="py-2 px-3 text-slate-900">Gross Total Bill:</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-900">
                        ₹{bill.totalAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    {bill.isInsured && (
                      <tr className="border-b border-slate-200 text-blue-800 bg-blue-50/50">
                        <td className="py-1.5 px-3">Less: Insurance Final Approved:</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold">
                          -₹{(bill.finalApprovedAmount || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    )}
                    <tr className="border-b border-slate-200 bg-slate-100 font-bold text-slate-900">
                      <td className="py-1.5 px-3">
                        {bill.isInsured ? 'Patient Net Payable (Co-pay / Deductions):' : 'Net Payable:'}
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono">
                        ₹{bill.patientNetPayable.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200 text-emerald-800">
                      <td className="py-1.5 px-3">Paid via Receipts:</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold">
                        -₹{bill.paidAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className={`font-extrabold text-sm ${
                      bill.balanceDue === 0
                        ? 'bg-emerald-50 text-emerald-800'
                        : bill.balanceDue > 0
                        ? 'bg-rose-50 text-rose-800'
                        : 'bg-amber-50 text-amber-800'
                    }`}>
                      <td className="py-2.5 px-3">
                        {bill.balanceDue === 0
                          ? 'Balance Due (Cleared):'
                          : bill.balanceDue > 0
                          ? 'Balance Outstanding:'
                          : 'Refundable Excess to Patient:'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        ₹{Math.abs(bill.balanceDue).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Terms and Signatures */}
            <div className="pt-6 border-t border-slate-300 text-xs">
              <div className="flex justify-between items-end mt-4">
                <div className="text-[10px] text-slate-500 max-w-sm space-y-1">
                  <p>• This is a computer generated bill issued under Abhinavas Eye Care clinical protocols.</p>
                  <p>• Accepted payment modes: Cash, GPay / UPI, Online NEFT/RTGS, Credit & Debit Cards.</p>
                </div>
                <div className="text-center w-48">
                  <div className="h-10"></div>
                  <div className="border-t border-slate-800 pt-1 font-bold text-slate-900 text-xs">
                    Authorised Billing Signatory
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
