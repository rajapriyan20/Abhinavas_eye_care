import React, { useRef, useState, useEffect } from 'react';
import { Patient, CounsellingRecord, HospitalSetting } from '../types';
import { Printer, Download, X, FileText, CheckCircle2, ShieldAlert, HeartPulse, Sparkles } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { ApiClient, DEFAULT_DISCHARGE_MEDICATIONS, DEFAULT_POSTOP_CARE } from '../api/client';

interface DischargeSummaryPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  counselling: CounsellingRecord;
  hospital?: HospitalSetting | null;
}

export const DischargeSummaryPrintModal: React.FC<DischargeSummaryPrintModalProps> = ({
  isOpen,
  onClose,
  patient,
  counselling,
  hospital,
}) => {
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Editable fields in preview
  const [procedureText, setProcedureText] = useState('');
  const [medicationsText, setMedicationsText] = useState('');
  const [postOpCareText, setPostOpCareText] = useState('');
  const [reviewDate1, setReviewDate1] = useState('');
  const [reviewDate2, setReviewDate2] = useState('');
  const [reviewDate3, setReviewDate3] = useState('');
  const [isEditingContent, setIsEditingContent] = useState(false);

  // Load templates from settings on open
  useEffect(() => {
    if (!isOpen) return;

    const loadTemplates = async () => {
      const [meds, postOp] = await Promise.all([
        ApiClient.getDischargeMedications(),
        ApiClient.getPostOpCare(),
      ]);

      setMedicationsText(counselling.dischargeMedications || meds || DEFAULT_DISCHARGE_MEDICATIONS);
      setPostOpCareText(counselling.dischargePostOpCare || postOp || DEFAULT_POSTOP_CARE);

      // Format default procedure done sentence based on counselling details
      const eyeLabel =
        counselling.eyeSelection === 'OD'
          ? 'Left eye'
          : counselling.eyeSelection === 'OS'
          ? 'Right eye'
          : 'Both eyes';

      const lensLabel =
        counselling.lensType ||
        counselling.plannedConsumable ||
        'foldable intraocular lens';

      const surgeryDateStr = counselling.tentativeSurgeryDate
        ? formatShortDate(counselling.tentativeSurgeryDate)
        : formatShortDate(new Date().toISOString());

      const defaultProc = counselling.surgeryPlan
        ? `${counselling.surgeryPlan} on ${surgeryDateStr}.`
        : `${eyeLabel} phacoemulsification with ${lensLabel} implantation under LA/TA on ${surgeryDateStr}.`;

      setProcedureText(defaultProc);

      // Set review dates if saved or defaults
      setReviewDate1(counselling.reviewDate1 || '');
      setReviewDate2(counselling.reviewDate2 || '');
      setReviewDate3(counselling.reviewDate3 || '');
    };

    loadTemplates();
  }, [isOpen, counselling]);

  if (!isOpen) return null;

  function formatShortDate(dateStr?: string): string {
    if (!dateStr) return '_______________';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  }

  // Handle native browser print
  const handlePrint = () => {
    window.print();
  };

  // Helper to render one page to canvas with ancestor unclipping
  const capturePageCanvas = async (element: HTMLElement) => {
    const totalWidth = 794;
    const totalHeight = Math.max(element.scrollHeight, element.offsetHeight, 920);

    return await html2canvas(element, {
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
  };

  // Handle high-resolution 2-page PDF generation
  const handleDownloadPdf = async () => {
    if (!page1Ref.current || !page2Ref.current) return;
    try {
      setIsGeneratingPdf(true);

      const [canvas1, canvas2] = await Promise.all([
        capturePageCanvas(page1Ref.current),
        capturePageCanvas(page2Ref.current),
      ]);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const printableWidth = pageWidth - margin * 2; // 190mm
      const printableHeight = pageHeight - margin * 2; // 277mm

      // Helper to add canvas as a centered page
      const addCanvasToPdf = (canvas: HTMLCanvasElement, isFirst: boolean) => {
        if (!isFirst) {
          pdf.addPage();
        }

        const canvasAspect = canvas.height / canvas.width;
        let renderWidth = printableWidth;
        let renderHeight = printableWidth * canvasAspect;

        if (renderHeight > printableHeight) {
          const scale = printableHeight / renderHeight;
          renderWidth = renderWidth * scale;
          renderHeight = printableHeight;
        }

        const xPos = margin + (printableWidth - renderWidth) / 2;
        const yPos = margin + (printableHeight - renderHeight) / 2;

        const imgData = canvas.toDataURL('image/png', 1.0);
        pdf.addImage(imgData, 'PNG', xPos, yPos, renderWidth, renderHeight, undefined, 'FAST');
      };

      // Page 1: Discharge Summary
      addCanvasToPdf(canvas1, true);

      // Page 2: Post Operative Care Instructions
      addCanvasToPdf(canvas2, false);

      const cleanFileName = `Discharge_Summary_${patient.uhid || patient.id}_${patient.name.replace(/\s+/g, '_')}.pdf`;
      pdf.save(cleanFileName);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to generate Discharge Summary PDF', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const eye = counselling.eyeSelection;
  const eyeDisplay =
    eye === 'OD'
      ? 'Left Eye (OD)'
      : eye === 'OS'
      ? 'Right Eye (OS)'
      : 'Both Eyes (OU)';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static select-none">
      {/* Print-specific stylesheet with strict page breaks */}
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
          #discharge-summary-sheet-1, #discharge-summary-sheet-1 *,
          #discharge-summary-sheet-2, #discharge-summary-sheet-2 * {
            visibility: visible;
          }
          #discharge-summary-sheet-1 {
            position: relative;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 8mm 10mm !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
            page-break-after: always !important;
            break-after: page !important;
          }
          #discharge-summary-sheet-2 {
            position: relative;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 8mm 10mm !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
            page-break-before: always !important;
            break-before: page !important;
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
        {/* Top Actions Bar */}
        <div className="no-print bg-[#1E3A5F] text-white px-5 py-3.5 flex items-center justify-between shrink-0 border-b border-blue-900">
          <div className="flex items-center gap-2.5">
            <HeartPulse className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wide">Discharge Summary & Post-Op Care</h2>
                <span className="text-[10px] bg-blue-800/80 text-blue-200 px-2 py-0.5 rounded font-mono">
                  2 Pages
                </span>
              </div>
              <p className="text-[11px] text-blue-200">
                Patient: <span className="font-semibold text-white">{patient.name}</span> ({patient.uhid || patient.id})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsEditingContent(!isEditingContent)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                isEditingContent
                  ? 'bg-amber-400 text-slate-900 font-bold'
                  : 'bg-blue-800/80 text-blue-100 hover:text-white hover:bg-blue-700'
              }`}
            >
              {isEditingContent ? 'Done Editing' : 'Edit Text'}
            </button>

            {downloadSuccess && (
              <span className="text-xs text-emerald-300 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Downloaded!
              </span>
            )}

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Download 2-page PDF document"
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
              <span>Print Summary</span>
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/70 print:p-0 print:bg-white print:overflow-visible flex flex-col items-center gap-6">
          
          {/* Quick Edit Panel (if toggled) */}
          {isEditingContent && (
            <div className="w-[794px] max-w-full bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-slate-800 space-y-3 no-print">
              <div className="flex items-center justify-between font-bold text-amber-900">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Quick Edit Content for Discharge Summary Print
                </span>
                <span className="text-[11px] text-amber-700 font-normal">
                  (Changes reflect immediately on the printed sheets below)
                </span>
              </div>

              <div>
                <label className="font-bold block mb-1">Procedure Done Text:</label>
                <input
                  type="text"
                  value={procedureText}
                  onChange={e => setProcedureText(e.target.value)}
                  className="w-full p-2 bg-white border border-amber-200 rounded text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold block mb-1">1st Review Date:</label>
                  <input
                    type="text"
                    value={reviewDate1}
                    onChange={e => setReviewDate1(e.target.value)}
                    placeholder="e.g. 15/10/2026"
                    className="w-full p-2 bg-white border border-amber-200 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">2nd Review Date:</label>
                  <input
                    type="text"
                    value={reviewDate2}
                    onChange={e => setReviewDate2(e.target.value)}
                    placeholder="e.g. 22/10/2026"
                    className="w-full p-2 bg-white border border-amber-200 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">3rd Review Date:</label>
                  <input
                    type="text"
                    value={reviewDate3}
                    onChange={e => setReviewDate3(e.target.value)}
                    placeholder="e.g. 15/11/2026"
                    className="w-full p-2 bg-white border border-amber-200 rounded text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Medication Regimen (Settings template):</label>
                <textarea
                  rows={4}
                  value={medicationsText}
                  onChange={e => setMedicationsText(e.target.value)}
                  className="w-full p-2 bg-white border border-amber-200 rounded text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PAGE 1: DISCHARGE SUMMARY SHEET                           */}
          {/* ========================================================= */}
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-semibold text-slate-500 mb-1 no-print">
              PAGE 1: DISCHARGE SUMMARY
            </span>
            <div
              id="discharge-summary-sheet-1"
              ref={page1Ref}
              className="w-[794px] max-w-full bg-white p-10 shadow-md border border-slate-300 print:shadow-none print:border-none print:p-6 text-black font-serif text-[13.5px] leading-relaxed shrink-0"
              style={{
                backgroundColor: '#ffffff',
                color: '#000000',
                boxSizing: 'border-box',
              }}
            >
              {/* Header */}
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

              {/* Title */}
              <div className="text-center my-3">
                <h2 className="text-base font-bold uppercase tracking-wider font-serif inline-block border-b-2 border-black pb-0.5">
                  DISCHARGE SUMMARY
                </h2>
              </div>

              {/* Patient Meta and Photo/Stamp Box */}
              <div className="flex justify-between items-start mt-4 mb-4 font-sans text-xs">
                <div className="space-y-1.5 leading-snug">
                  <div>
                    <span className="font-bold text-black min-w-[120px] inline-block">Patient Name :</span>
                    <span className="font-bold text-sm text-black uppercase underline ml-1">
                      {patient.name}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-black min-w-[120px] inline-block">Mrd No :</span>
                    <span className="font-bold font-mono text-sm text-black ml-1">
                      {patient.uhid || patient.id}
                    </span>
                  </div>
                  {(patient.age || patient.gender) && (
                    <div>
                      <span className="font-bold text-black min-w-[120px] inline-block">Age / Gender :</span>
                      <span className="font-medium text-black ml-1">
                        {patient.age ? `${patient.age} Yrs` : ''} {patient.gender ? `/ ${patient.gender}` : ''}
                      </span>
                    </div>
                  )}
                  {patient.mobileNo && (
                    <div>
                      <span className="font-bold text-black min-w-[120px] inline-block">Contact No :</span>
                      <span className="font-mono text-black ml-1">
                        {patient.mobileNo}
                      </span>
                    </div>
                  )}
                </div>

                {/* Patient photo / stamp box */}
                <div className="w-24 h-14 border border-black flex items-center justify-center text-[10px] text-slate-500 font-sans">
                  Stamp / Photo
                </div>
              </div>

              {/* Procedure Done */}
              <div className="mt-4 mb-5 font-sans text-xs border-y border-black py-2.5 leading-relaxed">
                <span className="font-bold text-black">Procedure done: </span>
                <span className="text-black font-medium">{procedureText}</span>
              </div>

              {/* Medication Section */}
              <div className="mt-4 font-sans text-xs">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm uppercase tracking-wide font-serif text-black underline">
                    MEDICATION
                  </h3>
                  <span className="font-bold text-xs bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded">
                    Operated Eye: {eyeDisplay}
                  </span>
                </div>

                <div className="border border-black rounded-lg p-4 bg-white space-y-3 leading-relaxed">
                  <div className="whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-black">
                    {medicationsText}
                  </div>
                </div>
              </div>

              {/* Review Visits Block */}
              <div className="mt-5 font-sans text-xs">
                <div className="font-bold text-black mb-2 uppercase text-[11.5px]">
                  Review Schedule:
                </div>
                <div className="grid grid-cols-3 gap-4 border border-black p-3 rounded-lg">
                  <div>
                    <span className="font-semibold block text-[11px] text-black">1st Review on</span>
                    <span className="font-bold border-b border-black inline-block w-full pt-1 text-center min-h-[22px]">
                      {reviewDate1 || '_______________'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold block text-[11px] text-black">2nd Review on</span>
                    <span className="font-bold border-b border-black inline-block w-full pt-1 text-center min-h-[22px]">
                      {reviewDate2 || '_______________'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold block text-[11px] text-black">3rd Review on</span>
                    <span className="font-bold border-b border-black inline-block w-full pt-1 text-center min-h-[22px]">
                      {reviewDate3 || '_______________'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Doctor / Consultant Signature */}
              <div className="mt-10 pt-4 flex justify-end font-sans text-xs">
                <div className="text-right">
                  <div className="font-bold text-base text-black">
                    {counselling.counsellorName || 'Dr.A.R.Karthik, DO, DNB'}
                  </div>
                  <div className="text-[12px] text-black font-semibold mt-0.5">
                    Consultant Ophthalmologist
                  </div>
                  <div className="text-[11px] text-black font-medium">
                    Abhinavas Eye Care
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* PAGE 2: POST OPERATIVE CARE INSTRUCTIONS SHEET             */}
          {/* ========================================================= */}
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-semibold text-slate-500 mb-1 no-print">
              PAGE 2: POST OPERATIVE CARE INSTRUCTIONS
            </span>
            <div
              id="discharge-summary-sheet-2"
              ref={page2Ref}
              className="w-[794px] max-w-full bg-white p-10 shadow-md border border-slate-300 print:shadow-none print:border-none print:p-6 text-black font-serif text-[13.5px] leading-relaxed shrink-0"
              style={{
                backgroundColor: '#ffffff',
                color: '#000000',
                boxSizing: 'border-box',
              }}
            >
              {/* Header */}
              <div className="text-center pb-2 mb-3 border-b border-black">
                <h1 className="text-xl font-bold tracking-wide uppercase font-serif text-black">
                  ABHINAVAS EYE CARE
                </h1>
                <p className="text-[11.5px] text-black mt-0.5 font-sans">
                  New No. 42, Old No. 25, 2nd Main Road, Kasthuribai Nagar, Adyar, Chennai – 600 020.
                </p>
                <p className="text-[11.5px] text-black font-sans font-medium mt-0.5">
                  Phone: 044 24413453 / 044 24426767 / 044 47903019 / 95662 59044
                </p>
              </div>

              {/* Post Operative Care Banner Title */}
              <div className="text-center my-3">
                <div className="inline-block border-2 border-black px-6 py-1 font-serif font-bold text-sm uppercase tracking-wider">
                  POST OPERATIVE CARE
                </div>
              </div>

              {/* Patient Identification strip */}
              <div className="flex justify-between items-center text-xs font-sans border-b border-black pb-2 mb-4">
                <div>
                  <span className="font-bold text-black">Patient: </span>
                  <span className="font-semibold text-black">{patient.name}</span>
                </div>
                <div>
                  <span className="font-bold text-black">MRD No: </span>
                  <span className="font-mono font-bold text-black">{patient.uhid || patient.id}</span>
                </div>
                <div>
                  <span className="font-bold text-black">Eye: </span>
                  <span className="font-semibold text-black">{eyeDisplay}</span>
                </div>
              </div>

              {/* Post-Op Care Content */}
              <div className="font-sans text-[11.5px] leading-relaxed space-y-3">
                <div className="whitespace-pre-wrap leading-relaxed text-black">
                  {postOpCareText}
                </div>
              </div>

              {/* Bottom Verification Note */}
              <div className="mt-6 pt-3 border-t border-black flex justify-between items-center text-[11px] font-sans">
                <div className="text-slate-700 italic">
                  * Follow all instructions strictly for optimal visual recovery. For urgent queries, contact clinic numbers.
                </div>
                <div className="text-right">
                  <span className="font-bold text-black">Abhinavas Eye Care Centre</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
