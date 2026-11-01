import React, { useRef, useState } from 'react';
import { Estimate, Patient } from '../../types';
import { X, Printer, Download, ArrowRight, ShieldCheck, FileCheck, CheckCircle2 } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

interface EstimatePrintModalProps {
  estimate: Estimate;
  patient?: Patient;
  onClose: () => void;
  onConvertToBill?: (estimateId: string) => void;
}

export const EstimatePrintModal: React.FC<EstimatePrintModalProps> = ({
  estimate,
  patient,
  onClose,
  onConvertToBill,
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
          <title>Cost Estimate - ${estimate.estimateNumber} - ${estimate.patientName}</title>
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
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #94a3b8; padding: 6px 8px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .header-banner { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px; }
            .header-banner h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; color: #0f172a; }
            .header-banner p { margin: 2px 0; font-size: 11px; color: #334155; }
            .title-bar { text-align: center; font-size: 14px; font-weight: bold; text-transform: uppercase; background: #e2e8f0; padding: 4px; margin-bottom: 12px; border: 1px solid #cbd5e1; }
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
      pdf.save(`Estimate_${estimate.estimateNumber.replace(/[^a-zA-Z0-9]/g, '_')}_${estimate.patientName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Failed to generate Estimate PDF', err);
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
            <span className="font-bold text-sm tracking-wide">Treatment Cost Estimate Preview</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              {estimate.estimateNumber}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
              estimate.status === 'Converted to Bill'
                ? 'bg-blue-900 text-blue-300'
                : 'bg-emerald-900 text-emerald-300'
            }`}>
              {estimate.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {estimate.status === 'Active' && onConvertToBill && (
              <button
                onClick={() => onConvertToBill(estimate.id)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Convert to Bill</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Estimate</span>
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
            <div className="bg-amber-50 border border-amber-300 py-1.5 px-3 text-center mb-4">
              <span className="font-extrabold text-sm tracking-wider uppercase text-amber-950">
                SURGICAL & CLINICAL TREATMENT COST ESTIMATE
              </span>
            </div>

            {/* Meta Details Grid */}
            <div className="border border-slate-300 rounded-xs mb-4 text-xs bg-slate-50/50 p-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Estimate Number</span>
                  <span className="font-bold text-slate-900 font-mono">{estimate.estimateNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Date of Estimate</span>
                  <span className="font-bold text-slate-900">
                    {new Date(estimate.estimateDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Patient Name</span>
                  <span className="font-bold text-slate-900">{estimate.patientName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">UHID / MRD No</span>
                  <span className="font-bold text-slate-900 font-mono">{estimate.uhid || estimate.patientId}</span>
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
                    {estimate.doctorName || 'Dr.A.R.Karthik, DO, DNB'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Estimate Validity</span>
                  <span className="font-medium text-slate-800">
                    {estimate.validUntil ? new Date(estimate.validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '30 Days from date'}
                  </span>
                </div>

                {estimate.surgeryDate && (
                  <div className="col-span-2 md:col-span-4 pt-1 border-t border-slate-200 mt-1">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">
                      Proposed Surgery Date & Procedure Description
                    </span>
                    <span className="font-medium text-slate-900">
                      <strong>{new Date(estimate.surgeryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong> — {estimate.surgeryDetails || 'Ophthalmic Procedure'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Insurance Details Box (if applicable) */}
            {estimate.isInsured && (
              <div className="border border-blue-200 bg-blue-50/60 rounded-xs p-3 mb-4 text-xs">
                <div className="flex items-center gap-1.5 text-blue-900 font-bold mb-2 pb-1 border-b border-blue-200">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  <span className="uppercase text-[11px] tracking-wider">Estimated Insurance & TPA Coverage</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Insurance Company</span>
                    <span className="font-semibold text-slate-800">{estimate.insuranceCompany || 'TPA Covered'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">TPA / Policy Ref</span>
                    <span className="text-slate-800">{estimate.tpaName || '—'} {estimate.policyNumber ? `(${estimate.policyNumber})` : ''}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Pre-Auth / Expected Approval</span>
                    <span className="text-slate-800 font-bold font-mono">
                      ₹{(estimate.estimatedInsuranceCoverage || estimate.preAuthAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Estimated Patient Co-Pay</span>
                    <span className="font-bold text-slate-900 font-mono">
                      ₹{estimate.patientEstimatedNetPayable.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Itemized Table */}
            <div className="mb-4">
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="border border-slate-300 py-2 px-2.5 text-center w-10">#</th>
                    <th className="border border-slate-300 py-2 px-3 text-left">Estimated Particulars / Package Inclusions</th>
                    <th className="border border-slate-300 py-2 px-2 text-center w-20">Category</th>
                    <th className="border border-slate-300 py-2 px-2 text-center w-12">Qty</th>
                    <th className="border border-slate-300 py-2 px-3 text-right w-24">Rate (₹)</th>
                    <th className="border border-slate-300 py-2 px-3 text-right w-28">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {estimate.items.map((item, index) => (
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

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1 uppercase text-[10px] tracking-wider">
                  Estimated Amount in Words:
                </span>
                <p className="font-medium italic text-slate-800 leading-relaxed">
                  {numberToWords(estimate.isInsured ? estimate.patientEstimatedNetPayable : estimate.totalAmount)}
                </p>

                {estimate.notes && (
                  <div className="mt-3 pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-700 block text-[10px] uppercase">Notes:</span>
                    <p className="text-slate-600 text-[11px] mt-0.5">{estimate.notes}</p>
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
                        ₹{estimate.subtotal.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    {Boolean(estimate.discount) && (
                      <tr className="border-b border-slate-200 text-emerald-700">
                        <td className="py-1.5 px-3">Package Concession / Discount:</td>
                        <td className="py-1.5 px-3 text-right font-mono font-medium">
                          -₹{estimate.discount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    )}
                    <tr className="border-b border-slate-300 bg-slate-50 font-bold">
                      <td className="py-2 px-3 text-slate-900">Total Treatment Cost:</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-900">
                        ₹{estimate.totalAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    {estimate.isInsured && (
                      <tr className="border-b border-slate-200 text-blue-800 bg-blue-50/50">
                        <td className="py-1.5 px-3">Less: Estimated TPA Coverage:</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold">
                          -₹{(estimate.estimatedInsuranceCoverage || estimate.preAuthAmount || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-amber-50 text-amber-900 font-extrabold text-sm">
                      <td className="py-2.5 px-3">
                        {estimate.isInsured ? 'Patient Estimated Net Payable:' : 'Estimated Net Payable:'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        ₹{estimate.patientEstimatedNetPayable.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Terms and Advisory */}
            <div className="pt-4 border-t border-slate-300 text-xs">
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded text-[10px] text-slate-600 space-y-1 mb-4">
                <p>• <strong>Advisory:</strong> This is an estimate of surgical & clinical expenses and not a final hospital bill. Actual charges may vary based on unforeseen intraoperative findings, requirement of additional consumables, or final cashless TPA approvals.</p>
                <p>• <strong>Rate Card Basis:</strong> Consumables and intraocular lenses are calculated as per current hospital rate card standards.</p>
              </div>

              <div className="flex justify-between items-end">
                <div className="text-[10px] text-slate-500">
                  <p>Prepared by Counselling & Clinical Estimation Desk</p>
                </div>
                <div className="text-center w-52">
                  <div className="h-8"></div>
                  <div className="border-t border-slate-800 pt-1 font-bold text-slate-900 text-xs">
                    Counsellor / Medical Superintendent
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
