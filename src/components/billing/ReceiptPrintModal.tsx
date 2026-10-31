import React, { useRef, useState } from 'react';
import { Receipt, Bill } from '../../types';
import { X, Printer, Download, CheckCircle2 } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

interface ReceiptPrintModalProps {
  receipt: Receipt;
  bill?: Bill;
  onClose: () => void;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({
  receipt,
  bill,
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
    const printWindow = window.open('', '_blank', 'width=850,height=750');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt - ${receipt.receiptNumber} - ${receipt.patientName}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm 20mm;
            }
            body {
              font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              color: #111827;
              background-color: #ffffff;
              margin: 0;
              padding: 0;
              font-size: 13px;
              line-height: 1.5;
            }
            .header-banner { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px; }
            .header-banner h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; color: #0f172a; }
            .header-banner p { margin: 2px 0; font-size: 11px; color: #334155; }
            .title-bar { text-align: center; font-size: 14px; font-weight: bold; text-transform: uppercase; background: #f1f5f9; padding: 4px; margin-bottom: 14px; border: 1px solid #cbd5e1; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; }
            .amount-highlight { background: #f0fdf4; border: 2px solid #22c55e; padding: 12px; text-align: center; margin: 15px 0; border-radius: 4px; }
            .amount-val { font-size: 24px; font-weight: bold; color: #15803d; }
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
      pdf.save(`Receipt_${receipt.receiptNumber.replace(/[^a-zA-Z0-9]/g, '_')}_${receipt.patientName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Failed to generate Receipt PDF', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200">
        {/* Top Control Bar */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wide">Payment Receipt Preview</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              {receipt.receiptNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
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

        {/* Receipt Voucher Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100 flex justify-center">
          <div
            ref={printRef}
            className="w-full max-w-[210mm] bg-white p-8 md:p-12 shadow-lg text-slate-900 rounded-sm font-sans"
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
            <div className="bg-slate-100 border border-slate-300 py-1 px-3 text-center mb-6">
              <span className="font-extrabold text-sm tracking-wider uppercase text-slate-900">
                OFFICIAL PAYMENT RECEIPT VOUCHER
              </span>
            </div>

            {/* Receipt Identification & Date */}
            <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-200 mb-5">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Receipt Number:</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{receipt.receiptNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Payment Date:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {new Date(receipt.paymentDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Receipt Details Box */}
            <div className="space-y-4 text-xs leading-relaxed">
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded border border-slate-200">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Received From:</span>
                  <span className="font-bold text-slate-900 text-sm">{receipt.patientName}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Patient UHID:</span>
                  <span className="font-bold text-slate-900 font-mono">{receipt.uhid || receipt.patientId}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Tagged Bill Reference:</span>
                  <span className="font-semibold text-blue-700 font-mono">{receipt.billNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Payment Mode:</span>
                  <span className="font-bold text-slate-900 bg-slate-200/80 px-2 py-0.5 rounded text-[11px] inline-block">
                    {receipt.paymentMode}
                  </span>
                </div>
              </div>

              {/* Amount Highlight Card */}
              <div className="border-2 border-emerald-500 bg-emerald-50/70 rounded-lg p-4 text-center my-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Amount Received
                </span>
                <div className="text-3xl font-extrabold text-emerald-700 font-mono my-1">
                  ₹{receipt.amount.toLocaleString('en-IN')}
                </div>
                <div className="text-xs font-semibold text-slate-700 italic">
                  {numberToWords(receipt.amount)}
                </div>
              </div>

              {/* Transaction details & Remarks */}
              <div className="border border-slate-200 rounded p-3 text-xs space-y-2">
                {receipt.referenceNumber && (
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Transaction Ref / UTR / Cheque No:</span>
                    <span className="font-mono font-bold text-slate-900">{receipt.referenceNumber}</span>
                  </div>
                )}
                {receipt.bankName && (
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Bank / Channel Name:</span>
                    <span className="font-medium text-slate-900">{receipt.bankName}</span>
                  </div>
                )}
                {receipt.chequeDate && (
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Cheque Date:</span>
                    <span className="text-slate-900">{receipt.chequeDate}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Remarks / Purpose:</span>
                  <span className="text-slate-800 font-medium">{receipt.remarks || 'Towards eye surgery / hospital charges'}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Received By:</span>
                  <span className="font-semibold text-slate-800">{receipt.receivedBy}</span>
                </div>
              </div>

              {/* Bill Status Snapshot */}
              {bill && (
                <div className="border border-slate-200 rounded p-3 bg-slate-50 text-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block mb-2">
                    Bill Settlement Status Snapshot
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Total Bill (Net Payable)</span>
                      <span className="font-bold text-slate-900">₹{bill.patientNetPayable.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Total Paid Till Date</span>
                      <span className="font-bold text-emerald-700">₹{bill.paidAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className={`p-2 rounded border ${
                      bill.balanceDue === 0
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : bill.balanceDue > 0
                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                        : 'bg-amber-50 border-amber-300 text-amber-800'
                    }`}>
                      <span className="text-[10px] block font-bold">
                        {bill.balanceDue === 0 ? 'Balance Status' : bill.balanceDue > 0 ? 'Balance Remaining' : 'Refund Due'}
                      </span>
                      <span className="font-extrabold">
                        {bill.balanceDue === 0 ? 'FULLY CLEARED' : `₹${Math.abs(bill.balanceDue).toLocaleString('en-IN')}`}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with sign */}
            <div className="mt-8 pt-6 border-t border-slate-300 text-xs">
              <div className="flex justify-between items-end">
                <div className="text-[10px] text-slate-500">
                  <p>• Official acknowledgment of receipt of payment.</p>
                  <p>• Payments made through Cheque are subject to realization.</p>
                </div>
                <div className="text-center w-48">
                  <div className="h-10"></div>
                  <div className="border-t border-slate-800 pt-1 font-bold text-slate-900 text-xs">
                    Authorised Cashier / Accounts
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
