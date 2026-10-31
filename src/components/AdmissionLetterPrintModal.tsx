import React, { useRef, useState } from 'react';
import { Patient, CounsellingRecord, HospitalSetting } from '../types';
import { Printer, Download, X, FileText, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

interface AdmissionLetterPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  counselling: CounsellingRecord;
  hospital?: HospitalSetting | null;
}

export const AdmissionLetterPrintModal: React.FC<AdmissionLetterPrintModalProps> = ({
  isOpen,
  onClose,
  patient,
  counselling,
  hospital,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  // Determine hospital address lines
  const hospitalName = hospital?.name || counselling.hospitalName || 'Leela Eye Clinic';
  const hospitalAddr1 = hospital?.addressLine1 || counselling.hospitalAddressLine1 || 'No.2, 25th East Street Kamaraj Nagar';
  const hospitalAddr2 = hospital?.addressLine2 || counselling.hospitalAddressLine2 || 'Thiruvanmiyur Chennai – 600 041.';
  const hospitalPhone = hospital?.phone || counselling.hospitalPhone || '73050 45550';

  // Format Tentative Date (e.g. "14th Oct 2026")
  const formatSurgeryDate = (dateStr?: string) => {
    if (!dateStr) return '_______________';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate();
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      const year = d.getFullYear();
      
      const suffix =
        day === 1 || day === 21 || day === 31
          ? 'st'
          : day === 2 || day === 22
          ? 'nd'
          : day === 3 || day === 23
          ? 'rd'
          : 'th';
      return `${day}${suffix} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  // Check drug allergies
  const allergiesLower = (patient.drugAllergies || '').toLowerCase();
  const hasSulpha = allergiesLower.includes('sulfa') || allergiesLower.includes('sulpha');
  const hasPenicillin = allergiesLower.includes('penicillin');
  const hasTropicamide = allergiesLower.includes('tropicamide') || allergiesLower.includes('phenylephrine');
  const isNilAllergy =
    !patient.drugAllergies ||
    allergiesLower.includes('none') ||
    allergiesLower.includes('nil') ||
    allergiesLower.trim() === '';

  let otherAllergyText = '';
  if (!isNilAllergy && !hasSulpha && !hasPenicillin && !hasTropicamide) {
    otherAllergyText = patient.drugAllergies || '';
  }

  // Handle native browser print
  const handlePrint = () => {
    window.print();
  };

  // Handle PDF download with guaranteed capture of ALL sections without overflow clipping
  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    try {
      setIsGeneratingPdf(true);
      const element = printAreaRef.current;
      
      // Compute full required height so html2canvas never cuts off bottom sections
      const totalWidth = 794;
      const totalHeight = Math.max(element.scrollHeight, element.offsetHeight, 920);

      // Capture canvas at crisp 2x resolution with active ancestor un-clipping
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: totalWidth,
        height: totalHeight,
        windowWidth: totalWidth,
        windowHeight: totalHeight + 300,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        onclone: (clonedDoc, clonedElement) => {
          // Walk up all ancestors in cloned DOM and disable any overflow or max-height constraints
          let curr: HTMLElement | null = clonedElement.parentElement;
          while (curr && curr !== clonedDoc.documentElement) {
            curr.style.overflow = 'visible';
            curr.style.overflowX = 'visible';
            curr.style.overflowY = 'visible';
            curr.style.maxHeight = 'none';
            curr.style.height = 'auto';
            curr.style.position = 'static';
            curr.style.transform = 'none';
            curr.scrollTop = 0;
            curr.scrollLeft = 0;
            curr = curr.parentElement;
          }

          if (clonedDoc.body) {
            clonedDoc.body.style.overflow = 'visible';
            clonedDoc.body.style.maxHeight = 'none';
            clonedDoc.body.style.height = 'auto';
            clonedDoc.body.style.margin = '0';
            clonedDoc.body.style.padding = '0';
            clonedDoc.body.style.backgroundColor = '#ffffff';
          }

          // Force full expanded display on cloned sheet
          clonedElement.style.boxShadow = 'none';
          clonedElement.style.border = 'none';
          clonedElement.style.width = '794px';
          clonedElement.style.maxWidth = '794px';
          clonedElement.style.minHeight = 'auto';
          clonedElement.style.height = 'auto';
          clonedElement.style.maxHeight = 'none';
          clonedElement.style.overflow = 'visible';
          clonedElement.style.position = 'static';
          clonedElement.style.transform = 'none';
          clonedElement.style.margin = '0 auto';
        },
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10; // 10mm page margin
      const printableWidth = pageWidth - margin * 2; // 190mm
      const printableHeight = pageHeight - margin * 2; // 277mm

      // Strictly preserve aspect ratio so text NEVER stretches horizontally
      const canvasAspect = canvas.height / canvas.width;
      let renderWidth = printableWidth;
      let renderHeight = printableWidth * canvasAspect;

      // Fit gracefully on single page if slightly tall
      if (renderHeight > printableHeight) {
        const scale = printableHeight / renderHeight;
        renderWidth = renderWidth * scale;
        renderHeight = printableHeight;
      }

      // Center horizontally and vertically within printable margins
      const xPos = margin + (printableWidth - renderWidth) / 2;
      const yPos = margin + (printableHeight - renderHeight) / 2;

      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', xPos, yPos, renderWidth, renderHeight, undefined, 'FAST');

      const cleanFileName = `Admission_Letter_${patient.uhid || patient.id}_${patient.name.replace(/\s+/g, '_')}.pdf`;
      pdf.save(cleanFileName);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to generate PDF', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Eye display indication
  const eye = counselling.eyeSelection;
  const isRight = eye === 'OS' || eye === 'Both';
  const isLeft = eye === 'OD' || eye === 'Both';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static select-none">
      {/* Print-specific stylesheet */}
      <style>{`
        @media print {
          html, body {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            background: white !important;
          }
          body * {
            visibility: hidden;
          }
          .fixed, .overflow-y-auto, .overflow-hidden {
            overflow: visible !important;
            position: static !important;
            max-height: none !important;
            height: auto !important;
          }
          #admission-letter-print-sheet, #admission-letter-print-sheet * {
            visibility: visible;
          }
          #admission-letter-print-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 8mm 10mm !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}</style>

      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-300 flex flex-col max-h-[96vh] overflow-hidden print:max-h-none print:border-none print:shadow-none print:rounded-none">
        {/* Modal Top Actions Bar */}
        <div className="no-print bg-[#1E3A5F] text-white px-5 py-3.5 flex items-center justify-between shrink-0 border-b border-blue-900">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-sky-300" />
            <div>
              <h2 className="text-sm font-bold tracking-wide">Admission Letter Document</h2>
              <p className="text-[11px] text-blue-200">
                Patient: <span className="font-semibold text-white">{patient.name}</span> ({patient.uhid || patient.id})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {downloadSuccess && (
              <span className="text-xs text-emerald-300 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Downloaded!
              </span>
            )}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Download PDF document"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Print document (Ctrl/Cmd + P)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Letter</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800/60 transition-colors ml-1 cursor-pointer"
              title="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Letter Document Viewer */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/70 print:p-0 print:bg-white print:overflow-visible flex justify-center">
          {/* Printable Sheet: fixed A4 width (794px) to ensure 100% accurate aspect ratio and zero stretching */}
          <div
            id="admission-letter-print-sheet"
            ref={printAreaRef}
            className="w-[794px] max-w-full bg-white p-10 shadow-md border border-slate-300 print:shadow-none print:border-none print:p-6 text-black font-serif text-[13.5px] leading-relaxed shrink-0"
            style={{
              backgroundColor: '#ffffff',
              color: '#000000',
              boxSizing: 'border-box',
            }}
          >
            {/* Page Header (Exact official clinic format) */}
            <div className="text-center pb-3 mb-3 border-b border-black">
              <h1 className="text-2xl font-bold tracking-wide uppercase font-serif text-black">
                ABHINAVAS EYE CARE
              </h1>
              <p className="text-[12px] text-black mt-1 font-sans">
                New No. 42, Old No. 25, 2nd Main Road, Kasthuribai Nagar, Adyar, Chennai – 600 020.
              </p>
              <p className="text-[12px] text-black font-sans font-medium mt-0.5">
                Phone: 044 24413453 / 044 24426767 / 044 47903019 / 95662 59044
              </p>
            </div>

            {/* Document Title */}
            <div className="text-center my-3">
              <h2 className="text-base font-bold uppercase tracking-wider font-serif inline-block pb-0.5">
                ADMISSION LETTER
              </h2>
            </div>

            {/* To & MRD NO. Section */}
            <div className="flex justify-between items-start mt-4 mb-4 text-[13px] font-sans">
              {/* To Clinic Address */}
              <div className="leading-snug">
                <div className="font-bold mb-1">To</div>
                <div className="pl-3 border-l-2 border-black space-y-0.5 text-black">
                  <div className="font-bold text-sm">{hospitalName}</div>
                  <div>{hospitalAddr1}</div>
                  <div>{hospitalAddr2}</div>
                  <div className="font-semibold mt-0.5">Phone no - {hospitalPhone}</div>
                </div>
              </div>

              {/* MRD NO */}
              <div className="text-right pt-1 font-mono">
                <span className="font-bold text-[13px] text-black">MRD NO. : </span>
                <span className="font-bold text-[14px] underline px-1 text-black">
                  {patient.uhid || patient.id}
                </span>
              </div>
            </div>

            {/* Kindly Admit Statement */}
            <div className="mt-4 mb-4 text-[13.5px] leading-relaxed font-sans text-black">
              <div>
                Kindly admit Mr / Mrs / Ms{' '}
                <span className="font-bold border-b border-black px-4 inline-block min-w-[220px] text-center text-[14px]">
                  {patient.name}
                </span>{' '}
                for{' '}
                <span className="font-bold">
                  <span
                    className={`${
                      isRight ? 'underline font-extrabold text-black decoration-2' : 'text-slate-400 line-through'
                    }`}
                  >
                    Right Eye
                  </span>{' '}
                  /{' '}
                  <span
                    className={`${
                      isLeft ? 'underline font-extrabold text-black decoration-2' : 'text-slate-400 line-through'
                    }`}
                  >
                    Left Eye
                  </span>
                </span>
              </div>

              <div className="mt-1.5">
                on{' '}
                <span className="font-bold border-b border-black px-6 inline-block min-w-[160px] text-center">
                  {formatSurgeryDate(counselling.tentativeSurgeryDate)}
                </span>
                .
              </div>
            </div>

            {/* Tables: Drug Allergy (Left) and Intra Ocular Lens (Right) */}
            <div className="grid grid-cols-2 gap-5 my-4 font-sans text-xs">
              {/* Drug Allergy Table */}
              <div className="border border-black">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-black bg-slate-50">
                      <th className="py-2 px-3 text-left font-bold border-r border-black uppercase text-[11px]">
                        DRUG ALLERGY
                      </th>
                      <th className="py-2 px-3 text-center font-bold uppercase text-[11px] w-24">
                        NIL
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black text-[12px]">
                    <tr>
                      <td className="py-1.5 px-3 border-r border-black font-medium">Sulpha</td>
                      <td className="py-1.5 px-3 text-center font-bold">
                        {hasSulpha ? <span className="text-red-700 font-extrabold">ALLERGIC</span> : 'NIL'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 border-r border-black font-medium">Penicillin</td>
                      <td className="py-1.5 px-3 text-center font-bold">
                        {hasPenicillin ? <span className="text-red-700 font-extrabold">ALLERGIC</span> : 'NIL'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 border-r border-black font-medium">
                        Tropicamide / Phenylephrine
                      </td>
                      <td className="py-1.5 px-3 text-center font-bold">
                        {hasTropicamide ? <span className="text-red-700 font-extrabold">ALLERGIC</span> : 'NIL'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 border-r border-black font-medium">
                        Others - {otherAllergyText ? <span className="font-normal italic">({otherAllergyText})</span> : ''}
                      </td>
                      <td className="py-1.5 px-3 text-center font-bold">
                        {otherAllergyText ? <span className="text-red-700 font-extrabold">YES</span> : 'NIL'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Intra Ocular Lens Table */}
              <div className="border border-black">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-black bg-slate-50">
                      <th colSpan={2} className="py-2 px-3 text-center font-bold uppercase text-[11px]">
                        INTRA OCULAR LENS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black text-[12px]">
                    <tr>
                      <td className="py-1.5 px-3 border-r border-black font-medium w-1/2">Lens Type</td>
                      <td className="py-1.5 px-3 text-center font-semibold">
                        {counselling.lensType || 'Foldable Toric'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 border-r border-black font-medium">Power</td>
                      <td className="py-1.5 px-3 text-center font-semibold">
                        {counselling.lensPower || 'Per Biometry'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 border-r border-black font-medium">Other Consumables</td>
                      <td className="py-1.5 px-3 text-center font-semibold">
                        {counselling.plannedConsumable || 'Standard Visco'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Preoperative Instructions Section */}
            <div className="mt-5 font-sans">
              <h3 className="text-center font-bold text-sm mb-2 font-serif uppercase tracking-wider text-black">
                Preoperative Instructions
              </h3>

              <div className="border-2 border-black rounded-xl p-4 text-[12px] leading-relaxed">
                <div className="space-y-1.5">
                  {(counselling.preOpInstructions || '').split('\n').map((line, idx) => {
                    const cleanLine = line.trim();
                    if (!cleanLine) return null;
                    return (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-black font-bold">➤</span>
                        <span className={cleanLine.toLowerCase().includes('oflacin') ? 'font-bold' : ''}>
                          {cleanLine.replace(/^[➤\-*•]\s*/, '')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Surgery Plan Section */}
            <div className="mt-4 border border-black rounded-lg p-3 text-[12px] font-sans">
              <span className="font-bold text-black uppercase text-[11px]">Surgery Plan: </span>
              <span className="text-black font-medium">
                {counselling.surgeryPlan || 'Cataract extraction with posterior chamber intraocular lens implantation under local anesthesia.'}
              </span>
            </div>

            {/* Bottom Signature: Counsellor / Doctor Name on Bottom Right Only */}
            <div className="mt-8 pt-4 flex justify-end font-sans text-xs">
              <div className="text-right">
                <div className="font-bold text-base text-black">
                  {counselling.counsellorName || 'Dr.A.R.Karthik, DO, DNB'}
                </div>
                <div className="text-[11px] text-black mt-0.5 font-medium">
                  Abhinavas Eye Care
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
