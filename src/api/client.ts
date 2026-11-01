import {
  User,
  Patient,
  AuditEvent,
  FieldChange,
  HospitalSetting,
  ConsumableSetting,
  CounsellorSetting,
  CounsellingRecord,
  Bill,
  BillItem,
  Receipt,
  PatientBillingSummary,
  PaymentMode,
  BillPaymentStatus,
  Estimate,
  EstimateStatus,
} from '../types';

/**
 * Dual-Adapter Architecture
 * Automatically detects whether running in cloud workstation or on a local LAN server.
 */
export const isLiveServer = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname.startsWith('192.168.') ||
  window.location.hostname.startsWith('10.')
);

const STORAGE_KEYS = {
  USERS: 'abhinavas_eyecare_users',
  PATIENTS: 'abhinavas_eyecare_patients',
  AUDIT: 'abhinavas_eyecare_audit_logs',
  SESSION: 'abhinavas_eyecare_current_session',
  SIMULATE_MODE: 'abhinavas_eyecare_forced_mode',
  HOSPITALS: 'abhinavas_eyecare_hospitals',
  CONSUMABLES: 'abhinavas_eyecare_consumables',
  COUNSELLORS: 'abhinavas_eyecare_counsellors',
  PREOP_INSTRUCTIONS: 'abhinavas_eyecare_preop_instructions',
  COUNSELLING: 'abhinavas_eyecare_counselling_records',
  DISCHARGE_MEDICATIONS: 'abhinavas_eyecare_discharge_medications',
  POSTOP_CARE: 'abhinavas_eyecare_postop_care',
  BILLS: 'abhinavas_eyecare_bills',
  RECEIPTS: 'abhinavas_eyecare_receipts',
  ESTIMATES: 'abhinavas_eyecare_estimates',
};

export const SEED_HOSPITALS: HospitalSetting[] = [
  {
    id: 'hosp_leela',
    name: 'Leela Eye Clinic',
    addressLine1: 'No.2, 25th East Street Kamaraj Nagar',
    addressLine2: 'Thiruvanmiyur Chennai – 600 041.',
    phone: '73050 45550',
  },
  {
    id: 'hosp_abhinavas',
    name: 'Abhinavas Eye Care Centre',
    addressLine1: 'New No. 42, Old No. 25, 2nd Main Road',
    addressLine2: 'Kasthuribai Nagar, Adyar, Chennai – 600 020.',
    phone: '044 24413453 / 95662 59044',
  },
  {
    id: 'hosp_apollo',
    name: 'Apollo Spectra Hospitals',
    addressLine1: 'No. 12, C.P. Ramaswamy Road, Alwarpet',
    addressLine2: 'Chennai – 600 018.',
    phone: '044 6686 2000',
  },
  {
    id: 'hosp_fortis',
    name: 'Fortis Malar Hospital',
    addressLine1: 'No. 52, 1st Main Road, Gandhi Nagar',
    addressLine2: 'Adyar, Chennai – 600 020.',
    phone: '044 4289 2222',
  },
];

export const SEED_CONSUMABLES: ConsumableSetting[] = [
  { id: 'cons_1', name: 'Foldable Hydrophobic Monofocal IOL', unitPrice: 12000, category: 'IOL' },
  { id: 'cons_2', name: 'Foldable Hydrophobic Toric IOL', unitPrice: 18000, category: 'IOL' },
  { id: 'cons_3', name: 'Multifocal PanOptix IOL + Viscoelastic', unitPrice: 35000, category: 'IOL' },
  { id: 'cons_4', name: 'EDOF (Extended Depth of Focus) IOL', unitPrice: 28000, category: 'IOL' },
  { id: 'cons_5', name: 'Viscoelastic (2% HPMC + Healon GV)', unitPrice: 3500, category: 'Viscoelastic' },
  { id: 'cons_6', name: 'Trypan Blue + CTR Ring + Viscoat', unitPrice: 4500, category: 'Surgical Pack' },
  { id: 'cons_7', name: '25G Vitrectomy Pack + Silicone Oil', unitPrice: 15000, category: 'Surgical Pack' },
  { id: 'cons_8', name: 'Custom Corneal Blade 2.8mm + Side Port 1.2mm', unitPrice: 2500, category: 'Blade' },
];

export const SEED_COUNSELLORS: CounsellorSetting[] = [
  { id: 'couns_1', name: 'Dr.A.R.Karthik, DO, DNB', role: 'Chief Consultant' },
  { id: 'couns_2', name: 'Dr.A.R.Kathik, DO, DNB', role: 'Consultant Surgeon' },
  { id: 'couns_3', name: 'Nurse Priya & Staff', role: 'Clinical Counsellor' },
  { id: 'couns_4', name: 'Ananya Sharma', role: 'Patient Counsellor' },
];

export const DEFAULT_PREOP_INSTRUCTIONS = `➤ Bland diet one hour prior to surgery
➤ Oflacin eye drops 6 times a day (8 am, 10 am, 12 noon, 2 pm, 4 pm, 6 pm)
➤ To continue all systemic medications (e.g. Diabetes, Hypertension) as per physician advise.
➤ To bring all lab reports for surgery and other medical documents at the time of admission`;

export const DEFAULT_DISCHARGE_MEDICATIONS = `1. Prednisolone Acetate Eye drop
   • 6 times a day for 1 week
   • 4 times a day for 1 week
   • 3 times a day for 1 week
   • 2 times a day for 1 week
   • Once a day for 1 week

2. Moxifloxacin Eye drop
   • 6 times a day for 1 week

To continue all systemic medications as per physician advise

❖ Report to the clinic immediately if there is:
   • Sudden decrease in vision
   • Severe pain or redness
   • Swelling of eyelids

Kindly bring summary on every visit`;

export const DEFAULT_POSTOP_CARE = `Eye Protection
• Wear dark goggles throughout the day to protect your eyes from dust and injury.
• Do not lie down on the operated side for 1 week.
• Do not rub your eyes for any reason.

Diet
• Avoid spicy food on the day of surgery.
• To follow diet restrictions as per physician advise if you are having general ailments.

Bathing and shaving
• Bathing below neck is allowed from the first postoperative day.
• Face can be mopped clean with a, wet cloth avoiding the operated eye. Do not splash water on the face.
• Head bath can be done after 2 weeks
• Shaving of the beard can be done after 1 week. Do not splash water on the face.
• Avoid all kind of cosmetics for 1 month.
• The operated eye can be cleaned using sterile cotton as advised by the staff.

Physical and social activities
• Watching T.V. can be done from the first post-operative day.
• Reading can be done from the first post-operative day; however reading with the operated eye might be difficult since you would need glasses for the same.
• Avoid all forms of exercise like jogging, swimming, cycling and contact sports.
• Avoid strenuous work, forward bending and lifting heavy weights.
• Cooking can be done after 2 weeks.
• Avoid visiting crowded public places.
• Do not smoke or consume alcohol.

Getting back to work
• Your doctor will advise you regarding this depending on the nature of your work and type of surgery performed.

Medication
• To use eye drops as mentioned in the discharge summary.
• Care should be taken not to touch the nozzle of the medication. The nozzle of the bottle should only be opened with the cap of the bottle. Do not use pen/safety pin for doing it.

Technique of eye drop instillation
• Eye drops must be applied by the patient's attender.
• Attender must wash his or her hands with soap, dry it and use an antiseptic hand sanitizer prior to applying the medication.
• Attender has to pull the lower lid down and instill one drop of medication between the eye ball and the lower lid.
• Excess medication flowing out can be wiped off using sterile cotton.
• At least a gap of 10 minutes has to be given between two drops.
• All systemic medication to be continued as per your physician advice.`;

const SEED_COUNSELLING: CounsellingRecord[] = [
  {
    id: 'cnsl_101',
    patientId: 'IP-2026-101',
    uhid: 'AEC-8821',
    patientName: 'Ramesh Patel',
    eyeSelection: 'OD',
    tentativeSurgeryDate: '2026-11-05',
    hospitalId: 'hosp_leela',
    hospitalName: 'Leela Eye Clinic',
    hospitalAddressLine1: 'No.2, 25th East Street Kamaraj Nagar',
    hospitalAddressLine2: 'Thiruvanmiyur Chennai – 600 041.',
    hospitalPhone: '73050 45550',
    counsellorName: 'Dr.A.R.Karthik, DO, DNB',
    plannedConsumable: 'Foldable Hydrophobic Toric IOL',
    lensType: 'Toric Hydrophobic Monofocal (AcrySof IQ)',
    lensPower: '+21.5 D',
    surgeryPlan: 'Phacoemulsification under topical anesthesia with 2.2mm clear corneal incision and in-the-bag implantation of foldable Toric IOL. Biometry verified.',
    preOpInstructions: DEFAULT_PREOP_INSTRUCTIONS,
    createdAt: '2026-10-13T10:15:00Z',
    updatedAt: '2026-10-13T10:15:00Z',
  },
];

export const SEED_BILLS: Bill[] = [
  {
    id: 'bill_001',
    billNumber: 'AEC/BILL/2026/0101',
    patientId: 'IP-2026-101',
    uhid: 'AEC-8821',
    patientName: 'Ramesh Patel',
    billDate: '2026-10-14',
    counsellingId: 'cnsl_101',
    surgeryDate: '2026-10-14',
    surgeryDetails: 'Left eye Phacoemulsification with Foldable Toric IOL',
    doctorName: 'Dr.A.R.Karthik, DO, DNB',
    items: [
      {
        id: 'item_1_1',
        description: 'Surgeon fee towards Left eye Phacoemulsification on 14/10/2026',
        category: 'surgeon_fee',
        quantity: 1,
        unitPrice: 25000,
        amount: 25000,
      },
      {
        id: 'item_1_2',
        description: 'Consumables - Foldable Hydrophobic Toric IOL & Viscoelastic pack',
        category: 'consumable',
        quantity: 1,
        unitPrice: 18000,
        amount: 18000,
      },
      {
        id: 'item_1_3',
        description: 'OT & Phaco Cassette Theatre Sterilization charges',
        category: 'ot_charges',
        quantity: 1,
        unitPrice: 7000,
        amount: 7000,
      },
      {
        id: 'item_1_4',
        description: 'Pre-op A-Scan Biometry & Keratometry Diagnostic charges',
        category: 'investigation',
        quantity: 1,
        unitPrice: 2000,
        amount: 2000,
      },
    ],
    subtotal: 52000,
    discount: 0,
    tax: 0,
    totalAmount: 52000,
    isInsured: true,
    insuranceCompany: 'Star Health & Allied Insurance',
    tpaName: 'Medi Assist TPA',
    policyNumber: 'SH-8849201',
    claimNumber: 'CLM-2026-9921',
    preAuthAmount: 50000,
    finalApprovedAmount: 44000,
    coPayPercent: 10,
    coPayAmount: 4400,
    nonMedicalDeductions: 3600,
    patientNetPayable: 8000,
    paidAmount: 8000,
    balanceDue: 0,
    status: 'Settled',
    notes: 'Insurance claim settled. Final approval ₹44,000 received. Patient net payable of ₹8,000 cleared in 2 parts.',
    createdAt: '2026-10-14T09:00:00Z',
    updatedAt: '2026-10-15T16:00:00Z',
  },
  {
    id: 'bill_002',
    billNumber: 'AEC/BILL/2026/0102',
    patientId: 'IP-2026-102',
    uhid: '1806869',
    patientName: 'Mrs. Varadhammal R',
    billDate: '2026-10-15',
    surgeryDate: '2026-10-15',
    surgeryDetails: 'Right eye Micro-incision Phacoemulsification with Foldable Monofocal IOL',
    doctorName: 'Dr.A.R.Karthik, DO, DNB',
    items: [
      {
        id: 'item_2_1',
        description: 'Surgeon fee towards Right eye Phaco on 15/10/2026',
        category: 'surgeon_fee',
        quantity: 1,
        unitPrice: 22000,
        amount: 22000,
      },
      {
        id: 'item_2_2',
        description: 'Consumables - Foldable Monofocal IOL + Trypan Blue + Viscoat',
        category: 'consumable',
        quantity: 1,
        unitPrice: 14000,
        amount: 14000,
      },
      {
        id: 'item_2_3',
        description: 'OT Theatre Charges & Daycare Bed',
        category: 'ot_charges',
        quantity: 1,
        unitPrice: 6000,
        amount: 6000,
      },
    ],
    subtotal: 42000,
    discount: 0,
    tax: 0,
    totalAmount: 42000,
    isInsured: false,
    patientNetPayable: 42000,
    paidAmount: 20000,
    balanceDue: 22000,
    status: 'Partially Paid',
    notes: 'Self-pay patient. Initial part payment ₹20,000 received via Online Transfer. Balance ₹22,000 outstanding.',
    createdAt: '2026-10-15T10:00:00Z',
    updatedAt: '2026-10-15T11:00:00Z',
  },
  {
    id: 'bill_003',
    billNumber: 'AEC/BILL/2026/0103',
    patientId: 'IP-2026-103',
    uhid: 'AEC-9104',
    patientName: 'Anandhi Sridhar',
    billDate: '2026-10-16',
    surgeryDate: '2026-10-18',
    surgeryDetails: 'Bilateral Femto-LASIK Refractive Correction',
    doctorName: 'Dr. Karthik Raman',
    items: [
      {
        id: 'item_3_1',
        description: 'Surgeon fee towards Bilateral Femto-LASIK on 18/10/2026',
        category: 'surgeon_fee',
        quantity: 1,
        unitPrice: 45000,
        amount: 45000,
      },
      {
        id: 'item_3_2',
        description: 'Consumables - Suction ring & patient interface laser pack',
        category: 'consumable',
        quantity: 1,
        unitPrice: 15000,
        amount: 15000,
      },
      {
        id: 'item_3_3',
        description: 'Pentacam Corneal Topography & Aberrometry Diagnostics',
        category: 'investigation',
        quantity: 1,
        unitPrice: 5000,
        amount: 5000,
      },
    ],
    subtotal: 65000,
    discount: 0,
    tax: 0,
    totalAmount: 65000,
    isInsured: false,
    patientNetPayable: 65000,
    paidAmount: 0,
    balanceDue: 65000,
    status: 'Generated',
    notes: 'Bill generated for scheduled laser refractive procedure.',
    createdAt: '2026-10-16T09:30:00Z',
    updatedAt: '2026-10-16T09:30:00Z',
  },
];

export const SEED_RECEIPTS: Receipt[] = [
  {
    id: 'rcp_001',
    receiptNumber: 'AEC/REC/2026/0101',
    billId: 'bill_001',
    billNumber: 'AEC/BILL/2026/0101',
    patientId: 'IP-2026-101',
    uhid: 'AEC-8821',
    patientName: 'Ramesh Patel',
    paymentDate: '2026-10-14',
    amount: 5000,
    paymentMode: 'GPay / UPI',
    referenceNumber: 'UPI/9831749122/HDFC',
    receivedBy: 'Anand Sharma (Billing)',
    remarks: 'Part payment 1 (Admission Co-pay)',
    createdAt: '2026-10-14T10:30:00Z',
  },
  {
    id: 'rcp_002',
    receiptNumber: 'AEC/REC/2026/0102',
    billId: 'bill_001',
    billNumber: 'AEC/BILL/2026/0101',
    patientId: 'IP-2026-101',
    uhid: 'AEC-8821',
    patientName: 'Ramesh Patel',
    paymentDate: '2026-10-15',
    amount: 3000,
    paymentMode: 'Cash',
    referenceNumber: 'CASH-REC-482',
    receivedBy: 'Anand Sharma (Billing)',
    remarks: 'Part payment 2 (Final non-medical settlement)',
    createdAt: '2026-10-15T16:00:00Z',
  },
  {
    id: 'rcp_003',
    receiptNumber: 'AEC/REC/2026/0103',
    billId: 'bill_002',
    billNumber: 'AEC/BILL/2026/0102',
    patientId: 'IP-2026-102',
    uhid: '1806869',
    patientName: 'Mrs. Varadhammal R',
    paymentDate: '2026-10-15',
    amount: 20000,
    paymentMode: 'Online Transfer',
    referenceNumber: 'NEFT-ICIC29481920',
    bankName: 'ICICI Bank',
    receivedBy: 'Anand Sharma (Billing)',
    remarks: 'Advance deposit towards surgery',
    createdAt: '2026-10-15T11:00:00Z',
  },
];

export const SEED_ESTIMATES: Estimate[] = [
  {
    id: 'est_001',
    estimateNumber: 'AEC/EST/2026/0101',
    patientId: 'IP-2026-104',
    uhid: 'AEC-9452',
    patientName: 'Meenakshi Sundaram',
    estimateDate: '2026-10-18',
    validUntil: '2026-11-18',
    surgeryDate: '2026-11-02',
    surgeryDetails: 'Right eye Trabeculectomy with Mitomycin-C (MMC)',
    doctorName: 'Dr. Karthik Raman',
    items: [
      {
        id: 'est_item_1',
        description: 'Surgeon fee towards Right eye Trabeculectomy on 02/11/2026',
        category: 'surgeon_fee',
        quantity: 1,
        unitPrice: 24000,
        amount: 24000,
      },
      {
        id: 'est_item_2',
        description: 'Consumables - Mitomycin-C (MMC) ampoule + 10-0 Nylon suture + Viscoat',
        category: 'consumable',
        consumableId: 'cons_5',
        quantity: 1,
        unitPrice: 11000,
        amount: 11000,
      },
      {
        id: 'est_item_3',
        description: 'Operation Theatre & Daycare Glaucoma Suite charges',
        category: 'ot_charges',
        quantity: 1,
        unitPrice: 7000,
        amount: 7000,
      },
    ],
    subtotal: 42000,
    discount: 0,
    tax: 0,
    totalAmount: 42000,
    isInsured: false,
    patientEstimatedNetPayable: 42000,
    status: 'Active',
    notes: 'Surgical cost estimate issued for planned trabeculectomy.',
    createdAt: '2026-10-18T09:00:00Z',
    updatedAt: '2026-10-18T09:00:00Z',
  },
];

// Seed default hospital staff
const SEED_USERS: User[] = [

  {
    id: 'usr_admin',
    username: 'admin',
    name: 'System Administrator',
    role: 'admin',
    pin: '5566',
    isActive: true,
    createdAt: '2026-10-01T08:00:00Z',
    lastLoginAt: '2026-10-14T08:30:00Z',
  },
  {
    id: 'usr_dr_karthik',
    username: 'Dr. Karthik',
    name: 'Dr. Karthik Raman',
    role: 'doctor',
    pin: '1234',
    isActive: true,
    createdAt: '2026-10-02T09:00:00Z',
    lastLoginAt: '2026-10-14T08:15:00Z',
  },
  {
    id: 'usr_support',
    username: 'Support staff',
    name: 'Nurse Priya & Staff',
    role: 'nurse',
    pin: '1234',
    isActive: true,
    createdAt: '2026-10-02T09:30:00Z',
    lastLoginAt: '2026-10-14T07:45:00Z',
  },
  {
    id: 'usr_billing',
    username: 'Billing Desk',
    name: 'Anand Sharma (Billing)',
    role: 'billing',
    pin: '1234',
    isActive: true,
    createdAt: '2026-10-03T10:00:00Z',
    lastLoginAt: '2026-10-14T08:00:00Z',
  },
];

// Seed realistic Ophthalmology In-Patients
const SEED_PATIENTS: Patient[] = [
  {
    id: 'IP-2026-101',
    uhid: 'AEC-8821',
    name: 'Ramesh Patel',
    dob: '1963-04-12',
    age: 63,
    gender: 'Male',
    address: 'No. 14, 2nd Main Road, T. Nagar, Chennai',
    mobileNo: '98401 23456',
    isInsured: true,
    drugAllergies: 'None reported',
    eye: 'Right (OD)',
    procedure: 'Phacoemulsification + Foldable Toric IOL',
    attendingDoctor: 'Dr. Karthik Raman',
    patientStatus: 'Active',
    billingStatus: 'Insurance Approved',
    estimatedCost: 48000,
    notes: 'Mild hypertension controlled. Eye patch in situ, clear anterior chamber.',
    createdAt: '2026-10-13T09:30:00Z',
    updatedAt: '2026-10-14T06:30:00Z',
  },
  {
    id: 'IP-2026-102',
    uhid: 'AEC-9104',
    name: 'Sunita Devi',
    dob: '1968-08-25',
    age: 58,
    gender: 'Female',
    address: 'Plot 45, Anna Nagar West, Chennai',
    mobileNo: '98412 87654',
    isInsured: true,
    drugAllergies: 'Sulfa antibiotics (skin rash)',
    eye: 'Left (OS)',
    procedure: '25G Pars Plana Vitrectomy + Gas Tamponade',
    attendingDoctor: 'Dr. Karthik Raman',
    patientStatus: 'Active',
    billingStatus: 'Pre-Auth Submitted',
    estimatedCost: 85000,
    notes: 'Diabetic retinopathy vitreous hemorrhage. Strict prone positioning required post-op.',
    createdAt: '2026-10-13T14:15:00Z',
    updatedAt: '2026-10-13T14:15:00Z',
  },
  {
    id: 'IP-2026-103',
    uhid: 'AEC-9340',
    name: 'Arun Subramaniam',
    dob: '1984-11-03',
    age: 42,
    gender: 'Male',
    address: 'Flat 3B, Greenways Road, R.A. Puram, Chennai',
    mobileNo: '97890 12345',
    isInsured: false,
    drugAllergies: 'Penicillin (anaphylaxis)',
    eye: 'Both (OU)',
    procedure: 'Custom Wavefront Femto-LASIK',
    attendingDoctor: 'Dr. Karthik Raman',
    patientStatus: 'Completed',
    billingStatus: 'Self-Pay Cleared',
    estimatedCost: 65000,
    notes: 'Flaps well aligned. Follow-up drop regimen explained. Clear for discharge.',
    createdAt: '2026-10-14T07:00:00Z',
    updatedAt: '2026-10-14T08:10:00Z',
  },
  {
    id: 'IP-2026-104',
    uhid: 'AEC-9452',
    name: 'Meenakshi Sundaram',
    dob: '1955-02-18',
    age: 71,
    gender: 'Female',
    address: '12 Temple Street, Mylapore, Chennai',
    mobileNo: '94440 98765',
    isInsured: false,
    drugAllergies: 'None',
    eye: 'Right (OD)',
    procedure: 'Trabeculectomy with Mitomycin-C (MMC)',
    attendingDoctor: 'Dr. Karthik Raman',
    patientStatus: 'Under Treatment',
    billingStatus: 'Pending',
    estimatedCost: 42000,
    notes: 'Uncontrolled primary open-angle glaucoma (IOP 28 mmHg). Pre-op drops instilled.',
    createdAt: '2026-10-14T06:45:00Z',
    updatedAt: '2026-10-14T07:15:00Z',
  },
];

// Seed initial audit events
const SEED_AUDIT_LOGS: AuditEvent[] = [
  {
    id: 'audit_001',
    timestamp: '2026-10-13T09:30:00Z',
    actorId: 'usr_support',
    actorName: 'Nurse Priya & Staff',
    actorRole: 'nurse',
    action: 'Registered Patient',
    targetType: 'Patient',
    targetId: 'IP-2026-101',
    targetName: 'Ramesh Patel',
    changes: [
      { field: 'patientStatus', from: 'None', to: 'Registered' },
      { field: 'name', from: 'None', to: 'Ramesh Patel' },
    ],
    details: 'Patient registered for cataract phaco surgery evaluation.',
  },
  {
    id: 'audit_002',
    timestamp: '2026-10-13T11:45:00Z',
    actorId: 'usr_billing',
    actorName: 'Anand Sharma (Billing)',
    actorRole: 'billing',
    action: 'Changed Billing Status',
    targetType: 'Billing',
    targetId: 'IP-2026-101',
    targetName: 'Ramesh Patel',
    changes: [
      { field: 'billingStatus', from: 'Pending', to: 'Insurance Approved' },
      { field: 'approvedAmount', from: '0', to: '48000' },
    ],
    details: 'TPA claim pre-authorization confirmed via Star Health.',
  },
  {
    id: 'audit_003',
    timestamp: '2026-10-13T16:20:00Z',
    actorId: 'usr_dr_karthik',
    actorName: 'Dr. Karthik Raman',
    actorRole: 'doctor',
    action: 'Updated Patient Record',
    targetType: 'Patient',
    targetId: 'IP-2026-101',
    targetName: 'Ramesh Patel',
    changes: [
      { field: 'patientStatus', from: 'Active', to: 'Completed' },
      { field: 'procedureCheck', from: 'Pending', to: 'IOL stable, clear anterior chamber' },
    ],
    details: 'Surgery completed successfully. Post-procedure review recorded.',
  },
  {
    id: 'audit_004',
    timestamp: '2026-10-14T07:15:00Z',
    actorId: 'usr_admin',
    actorName: 'System Administrator',
    actorRole: 'admin',
    action: 'Registered Patient',
    targetType: 'Patient',
    targetId: 'IP-2026-104',
    targetName: 'Meenakshi Sundaram',
    changes: [
      { field: 'patientStatus', from: 'None', to: 'Registered' },
      { field: 'procedure', from: 'None', to: 'Trabeculectomy' },
    ],
    details: 'Emergency glaucoma patient registration completed.',
  },
];

// Helper to initialize local storage
function ensureInitialized(): void {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PATIENTS)) {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(SEED_PATIENTS));
  } else {
    // If previously seeded without dob/insurance, enrich them
    try {
      const stored: Patient[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PATIENTS) || '[]');
      let modified = false;
      const updated = stored.map(p => {
        const seedMatch = SEED_PATIENTS.find(s => s.id === p.id);
        if (seedMatch && (!p.dob || p.isInsured === undefined)) {
          modified = true;
          return {
            ...seedMatch,
            ...p,
            dob: p.dob || seedMatch.dob,
            mobileNo: p.mobileNo || seedMatch.mobileNo,
            address: p.address || seedMatch.address,
            isInsured: p.isInsured !== undefined ? p.isInsured : seedMatch.isInsured,
            drugAllergies: p.drugAllergies || seedMatch.drugAllergies,
          };
        }
        return p;
      });
      if (modified) {
        localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(updated));
      }
    } catch {
      // ignore
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.AUDIT)) {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(SEED_AUDIT_LOGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.HOSPITALS)) {
    localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(SEED_HOSPITALS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CONSUMABLES)) {
    localStorage.setItem(STORAGE_KEYS.CONSUMABLES, JSON.stringify(SEED_CONSUMABLES));
  } else {
    // Enrich existing consumables with rate card unitPrice if missing
    try {
      const storedConsumables: ConsumableSetting[] = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.CONSUMABLES) || '[]'
      );
      let consMod = false;
      const updatedConsumables = storedConsumables.map(c => {
        const seedMatch = SEED_CONSUMABLES.find(
          s => s.id === c.id || s.name.toLowerCase().trim() === c.name.toLowerCase().trim()
        );
        if (seedMatch && (c.unitPrice === undefined || !c.category)) {
          consMod = true;
          return {
            ...c,
            unitPrice: c.unitPrice !== undefined ? c.unitPrice : seedMatch.unitPrice,
            category: c.category || seedMatch.category,
          };
        }
        return c;
      });
      if (consMod) {
        localStorage.setItem(STORAGE_KEYS.CONSUMABLES, JSON.stringify(updatedConsumables));
      }
    } catch {
      // ignore
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.COUNSELLORS)) {
    localStorage.setItem(STORAGE_KEYS.COUNSELLORS, JSON.stringify(SEED_COUNSELLORS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PREOP_INSTRUCTIONS)) {
    localStorage.setItem(STORAGE_KEYS.PREOP_INSTRUCTIONS, DEFAULT_PREOP_INSTRUCTIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.COUNSELLING)) {
    localStorage.setItem(STORAGE_KEYS.COUNSELLING, JSON.stringify(SEED_COUNSELLING));
  }
  if (!localStorage.getItem(STORAGE_KEYS.DISCHARGE_MEDICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.DISCHARGE_MEDICATIONS, DEFAULT_DISCHARGE_MEDICATIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.POSTOP_CARE)) {
    localStorage.setItem(STORAGE_KEYS.POSTOP_CARE, DEFAULT_POSTOP_CARE);
  }
  if (!localStorage.getItem(STORAGE_KEYS.BILLS)) {
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(SEED_BILLS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.RECEIPTS)) {
    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(SEED_RECEIPTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ESTIMATES)) {
    localStorage.setItem(STORAGE_KEYS.ESTIMATES, JSON.stringify(SEED_ESTIMATES));
  }
}



// Generate unique ID
function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
}

export const ApiClient = {
  /**
   * Determine effective environment mode
   */
  isLiveServerMode(): boolean {
    if (typeof window === 'undefined') return false;
    const forced = localStorage.getItem(STORAGE_KEYS.SIMULATE_MODE);
    if (forced === 'live') return true;
    if (forced === 'preview') return false;
    return isLiveServer;
  },

  setSimulationMode(mode: 'auto' | 'preview' | 'live'): void {
    if (typeof window === 'undefined') return;
    if (mode === 'auto') {
      localStorage.removeItem(STORAGE_KEYS.SIMULATE_MODE);
    } else {
      localStorage.setItem(STORAGE_KEYS.SIMULATE_MODE, mode);
    }
  },

  /**
   * Authentication
   */
  async login(username: string, pin: string): Promise<{ success: boolean; user?: User; error?: string }> {
    ensureInitialized();
    const effectiveLive = this.isLiveServerMode();

    if (effectiveLive) {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim(), pin: pin.trim() }),
        });
        if (response.ok) {
          const data = await response.json();
          this.setSession(data.user);
          return { success: true, user: data.user };
        }
      } catch {
        // Fallback to local storage if live endpoint is unreachable
        console.warn('Live API unreachable, falling back to local storage adapter');
      }
    }

    // In Cloud Workstation: Persist and retrieve users & sessions using localStorage
    const users = await this.getUsers();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPin = pin.trim();

    const matchedUser = users.find(
      u => u.username.toLowerCase() === cleanUsername && u.pin === cleanPin
    );

    if (!matchedUser) {
      return { success: false, error: 'Incorrect username or 4-digit PIN' };
    }

    if (!matchedUser.isActive) {
      return { success: false, error: 'Staff account has been deactivated. Contact Admin.' };
    }

    // Record login timestamp
    matchedUser.lastLoginAt = new Date().toISOString();
    await this.updateUserInStorage(matchedUser);

    this.setSession(matchedUser);
    return { success: true, user: matchedUser };
  },

  async logout(): Promise<void> {
    if (typeof window === 'undefined') return;
    const effectiveLive = this.isLiveServerMode();
    if (effectiveLive) {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch {
        // Ignore network error on logout
      }
    }
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  getCurrentSession(): User | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setSession(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
  },

  /**
   * User Management
   */
  async getUsers(): Promise<User[]> {
    ensureInitialized();
    const effectiveLive = this.isLiveServerMode();

    if (effectiveLive) {
      try {
        const res = await fetch('/api/users');
        if (res.ok) return await res.json();
      } catch {
        // fallback
      }
    }

    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : SEED_USERS;
  },

  async createUser(data: { name: string; username: string; role: User['role']; pin: string }, actor: User): Promise<User> {
    ensureInitialized();
    const newUser: User = {
      id: generateId('usr'),
      username: data.username.trim(),
      name: data.name.trim(),
      role: data.role,
      pin: data.pin.trim(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const effectiveLive = this.isLiveServerMode();
    if (effectiveLive) {
      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUser),
        });
        if (res.ok) {
          const created = await res.json();
          await this.recordAuditEvent({
            id: generateId('audit'),
            timestamp: new Date().toISOString(),
            actorId: actor.id,
            actorName: actor.name,
            actorRole: actor.role,
            action: 'Created Staff Member',
            targetType: 'Staff',
            targetId: created.id,
            targetName: created.name,
            changes: [{ field: 'role', from: 'None', to: created.role }],
            details: `Created new staff account with username ${created.username}`,
          });
          return created;
        }
      } catch {
        // fallback
      }
    }

    const users = await this.getUsers();
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    await this.recordAuditEvent({
      id: generateId('audit'),
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'Created Staff Member',
      targetType: 'Staff',
      targetId: newUser.id,
      targetName: newUser.name,
      changes: [{ field: 'role', from: 'None', to: newUser.role }],
      details: `Created new staff account with username ${newUser.username}`,
    });

    return newUser;
  },

  async updateUserPin(userId: string, newPin: string, actor: User): Promise<boolean> {
    ensureInitialized();
    const effectiveLive = this.isLiveServerMode();

    if (effectiveLive) {
      try {
        const res = await fetch(`/api/users/${userId}/pin`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: newPin }),
        });
        if (res.ok) {
          await this.recordAuditEvent({
            id: generateId('audit'),
            timestamp: new Date().toISOString(),
            actorId: actor.id,
            actorName: actor.name,
            actorRole: actor.role,
            action: 'Reset Staff PIN',
            targetType: 'Staff',
            targetId: userId,
            targetName: `Staff #${userId}`,
            changes: [{ field: 'pin', from: '****', to: '**** (Updated)' }],
            details: '4-digit security PIN was updated.',
          });
          return true;
        }
      } catch {
        // fallback
      }
    }

    const users = await this.getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) return false;

    target.pin = newPin.trim();
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    await this.recordAuditEvent({
      id: generateId('audit'),
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'Reset Staff PIN',
      targetType: 'Staff',
      targetId: target.id,
      targetName: target.name,
      changes: [{ field: 'pin', from: '****', to: '**** (Updated)' }],
      details: `4-digit security PIN for ${target.username} was updated.`,
    });

    return true;
  },

  async toggleUserStatus(userId: string, actor: User): Promise<User | null> {
    ensureInitialized();
    const users = await this.getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) return null;

    const previous = target.isActive;
    target.isActive = !target.isActive;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    await this.recordAuditEvent({
      id: generateId('audit'),
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: target.isActive ? 'Activated Staff' : 'Deactivated Staff',
      targetType: 'Staff',
      targetId: target.id,
      targetName: target.name,
      changes: [{ field: 'isActive', from: String(previous), to: String(target.isActive) }],
      details: `Status toggled to ${target.isActive ? 'Active' : 'Deactivated'}`,
    });

    return target;
  },

  async deleteUser(userId: string, actor: User): Promise<boolean> {
    ensureInitialized();
    const users = await this.getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) return false;

    const filtered = users.filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));

    await this.recordAuditEvent({
      id: generateId('audit'),
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'Deleted Staff Member',
      targetType: 'Staff',
      targetId: target.id,
      targetName: target.name,
      changes: [{ field: 'account', from: 'Existing', to: 'Deleted' }],
      details: `Staff member ${target.username} was permanently removed.`,
    });

    return true;
  },

  async updateUserInStorage(user: User): Promise<void> {
    const users = await this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx] = user;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
  },

  /**
   * Patients & In-Patient Records
   */
  async getPatients(): Promise<Patient[]> {
    ensureInitialized();
    const effectiveLive = this.isLiveServerMode();

    if (effectiveLive) {
      try {
        const res = await fetch('/api/patients');
        if (res.ok) return await res.json();
      } catch {
        // fallback
      }
    }

    const raw = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    return raw ? JSON.parse(raw) : SEED_PATIENTS;
  },

  async createPatient(patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>, actor: User): Promise<Patient> {
    ensureInitialized();
    const newId = `IP-2026-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();
    const newPatient: Patient = {
      ...patientData,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };

    const effectiveLive = this.isLiveServerMode();
    if (effectiveLive) {
      try {
        const res = await fetch('/api/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPatient),
        });
        if (res.ok) {
          const created = await res.json();
          await this.recordAuditEvent({
            id: generateId('audit'),
            timestamp: now,
            actorId: actor.id,
            actorName: actor.name,
            actorRole: actor.role,
            action: 'Registered Patient',
            targetType: 'Patient',
            targetId: created.id,
            targetName: created.name,
            changes: [
              ...(created.patientStatus ? [{ field: 'patientStatus', from: 'None', to: created.patientStatus }] : []),
              ...(created.billingStatus ? [{ field: 'billingStatus', from: 'None', to: created.billingStatus }] : []),
            ],
            details: `Registered patient ${created.name}`,
          });
          return created;
        }
      } catch {
        // fallback
      }
    }

    const patients = await this.getPatients();
    patients.unshift(newPatient);
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));

    await this.recordAuditEvent({
      id: generateId('audit'),
      timestamp: now,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'Registered Patient',
      targetType: 'Patient',
      targetId: newPatient.id,
      targetName: newPatient.name,
      changes: [
        ...(newPatient.patientStatus ? [{ field: 'patientStatus', from: 'None', to: newPatient.patientStatus }] : []),
        ...(newPatient.billingStatus ? [{ field: 'billingStatus', from: 'None', to: newPatient.billingStatus }] : []),
      ],
      details: `Registered patient ${newPatient.name}`,
    });

    return newPatient;
  },

  async registerPatient(
    data: {
      name: string;
      dob?: string;
      age?: number;
      gender?: 'Male' | 'Female' | 'Other';
      uhid?: string;
      address?: string;
      mobileNo?: string;
      isInsured?: boolean;
      drugAllergies?: string;
      notes?: string;
    },
    actor: User
  ): Promise<Patient> {
    ensureInitialized();
    const newId = `PAT-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();
    const cleanUhid = data.uhid?.trim() || '';

    const newPatient: Patient = {
      id: newId,
      uhid: cleanUhid,
      name: data.name.trim(),
      dob: data.dob?.trim() || undefined,
      age: data.age !== undefined && !isNaN(data.age) ? Number(data.age) : 0,
      gender: data.gender || 'Other',
      eye: 'Both (OU)',
      procedure: 'Ophthalmic Consultation',
      attendingDoctor: 'Dr. Karthik Raman',
      patientStatus: 'Active',
      billingStatus: data.isInsured ? 'Insurance Approved' : 'Pending',
      estimatedCost: 0,
      address: data.address?.trim() || undefined,
      mobileNo: data.mobileNo?.trim() || undefined,
      isInsured: data.isInsured ?? false,
      drugAllergies: data.drugAllergies?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    const patients = await this.getPatients();
    patients.unshift(newPatient);
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));

    await this.recordAuditEvent({
      id: generateId('audit'),
      timestamp: now,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'Registered Patient',
      targetType: 'Patient',
      targetId: newPatient.id,
      targetName: newPatient.name,
      changes: [
        { field: 'name', from: 'None', to: newPatient.name },
        ...(cleanUhid ? [{ field: 'uhid', from: 'None', to: cleanUhid }] : []),
        ...(newPatient.mobileNo ? [{ field: 'mobileNo', from: 'None', to: newPatient.mobileNo }] : []),
        { field: 'isInsured', from: 'None', to: newPatient.isInsured ? 'Insured' : 'Non-Insured' },
      ],
      details: `Registered patient ${newPatient.name}${cleanUhid ? ` (UHID: ${cleanUhid})` : ''}`,
    });

    return newPatient;
  },

  async updatePatient(
    patientId: string,
    updates: Partial<Patient>,
    changedFields: FieldChange[],
    actionName: string,
    actor: User
  ): Promise<Patient | null> {
    ensureInitialized();
    const patients = await this.getPatients();
    const idx = patients.findIndex(p => p.id === patientId);
    if (idx === -1) return null;

    const current = patients[idx];
    const updated: Patient = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    patients[idx] = updated;

    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));

    // Determine targetType based on action
    let targetType: AuditEvent['targetType'] = 'Patient';
    if (actionName.toLowerCase().includes('billing')) targetType = 'Billing';

    await this.recordAuditEvent({
      id: generateId('audit'),
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: actionName,
      targetType,
      targetId: updated.id,
      targetName: updated.name,
      changes: changedFields,
      details: `Modified record for ${updated.name} (${updated.id})`,
    });

    return updated;
  },

  async deletePatient(patientId: string, actor: User): Promise<boolean> {
    ensureInitialized();
    const patients = await this.getPatients();
    const target = patients.find(p => p.id === patientId);
    if (!target) return false;

    const filtered = patients.filter(p => p.id !== patientId);
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(filtered));

    await this.recordAuditEvent({
      id: generateId('audit'),
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'Deleted Patient Record',
      targetType: 'Patient',
      targetId: target.id,
      targetName: target.name,
      changes: [{ field: 'record', from: 'Active', to: 'Deleted' }],
      details: `Removed patient file ${target.name} (${target.id})`,
    });

    return true;
  },

  /**
   * Audit Trail Feature
   */
  async getAuditLogs(): Promise<AuditEvent[]> {
    ensureInitialized();
    const effectiveLive = this.isLiveServerMode();

    if (effectiveLive) {
      try {
        const res = await fetch('/api/audit-logs');
        if (res.ok) return await res.json();
      } catch {
        // fallback
      }
    }

    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT);
    const logs: AuditEvent[] = raw ? JSON.parse(raw) : SEED_AUDIT_LOGS;
    // Sort descending by timestamp
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async getAuditLogsForPatient(patientId: string): Promise<AuditEvent[]> {
    const all = await this.getAuditLogs();
    return all.filter(log => log.targetId === patientId);
  },

  async recordAuditEvent(event: AuditEvent): Promise<void> {
    ensureInitialized();
    const effectiveLive = this.isLiveServerMode();

    if (effectiveLive) {
      try {
        await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });
      } catch {
        // fallback to storage
      }
    }

    const logs = await this.getAuditLogs();
    logs.unshift(event);
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(logs));
  },

  /**
   * Settings: Tentative Hospitals
   */
  async getHospitals(): Promise<HospitalSetting[]> {
    ensureInitialized();
    const raw = localStorage.getItem(STORAGE_KEYS.HOSPITALS);
    return raw ? JSON.parse(raw) : SEED_HOSPITALS;
  },

  async saveHospital(
    hospitalData: Omit<HospitalSetting, 'id'> & { id?: string },
    actor: User
  ): Promise<HospitalSetting> {
    ensureInitialized();
    const hospitals = await this.getHospitals();
    let saved: HospitalSetting;

    if (hospitalData.id) {
      const idx = hospitals.findIndex(h => h.id === hospitalData.id);
      if (idx !== -1) {
        saved = {
          ...hospitals[idx],
          ...hospitalData,
        };
        hospitals[idx] = saved;
      } else {
        saved = {
          id: hospitalData.id,
          name: hospitalData.name.trim(),
          addressLine1: hospitalData.addressLine1.trim(),
          addressLine2: hospitalData.addressLine2.trim(),
          phone: hospitalData.phone.trim(),
        };
        hospitals.push(saved);
      }
    } else {
      saved = {
        id: generateId('hosp'),
        name: hospitalData.name.trim(),
        addressLine1: hospitalData.addressLine1.trim(),
        addressLine2: hospitalData.addressLine2.trim(),
        phone: hospitalData.phone.trim(),
      };
      hospitals.push(saved);
    }

    localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(hospitals));

    await this.recordAuditEvent({
      id: generateId('audit'),
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: hospitalData.id ? 'Updated Hospital Facility' : 'Added Hospital Facility',
      targetType: 'Settings',
      targetId: saved.id,
      targetName: saved.name,
      changes: [{ field: 'hospitalName', from: '', to: saved.name }],
      details: `Saved facility: ${saved.name} (${saved.addressLine1}, ${saved.phone})`,
    });

    return saved;
  },

  async deleteHospital(hospitalId: string, actor: User): Promise<boolean> {
    ensureInitialized();
    const hospitals = await this.getHospitals();
    const target = hospitals.find(h => h.id === hospitalId);
    if (!target) return false;

    const filtered = hospitals.filter(h => h.id !== hospitalId);
    localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(filtered));

    await this.recordAuditEvent({
      id: generateId('audit'),
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'Deleted Hospital Facility',
      targetType: 'Settings',
      targetId: hospitalId,
      targetName: target.name,
      changes: [{ field: 'facility', from: target.name, to: 'Deleted' }],
      details: `Hospital ${target.name} was removed from settings`,
    });

    return true;
  },

  /**
   * Settings: Planned Consumables
   */
  async getConsumables(): Promise<ConsumableSetting[]> {
    ensureInitialized();
    const raw = localStorage.getItem(STORAGE_KEYS.CONSUMABLES);
    return raw ? JSON.parse(raw) : SEED_CONSUMABLES;
  },

  async saveConsumable(
    consumableData: Omit<ConsumableSetting, 'id'> & { id?: string },
    actor: User
  ): Promise<ConsumableSetting> {
    ensureInitialized();
    const consumables = await this.getConsumables();
    let saved: ConsumableSetting;

    if (consumableData.id) {
      const idx = consumables.findIndex(c => c.id === consumableData.id);
      if (idx !== -1) {
        saved = {
          ...consumables[idx],
          name: consumableData.name.trim(),
          unitPrice: consumableData.unitPrice !== undefined ? Number(consumableData.unitPrice) : consumables[idx].unitPrice,
          category: consumableData.category?.trim() || consumables[idx].category,
        };
        consumables[idx] = saved;
      } else {
        saved = {
          id: consumableData.id,
          name: consumableData.name.trim(),
          unitPrice: consumableData.unitPrice !== undefined ? Number(consumableData.unitPrice) : undefined,
          category: consumableData.category?.trim(),
        };
        consumables.push(saved);
      }
    } else {
      saved = {
        id: generateId('cons'),
        name: consumableData.name.trim(),
        unitPrice: consumableData.unitPrice !== undefined ? Number(consumableData.unitPrice) : undefined,
        category: consumableData.category?.trim(),
      };
      consumables.push(saved);
    }

    localStorage.setItem(STORAGE_KEYS.CONSUMABLES, JSON.stringify(consumables));

    await this.recordAuditEvent({
      id: generateId('audit'),
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: consumableData.id ? 'Updated Consumable Item' : 'Added Consumable Item',
      targetType: 'Settings',
      targetId: saved.id,
      targetName: saved.name,
      changes: [
        { field: 'consumable', from: '', to: saved.name },
        { field: 'unitPrice', from: '', to: saved.unitPrice ? `₹${saved.unitPrice}` : 'N/A' },
      ],
      details: `Saved consumable rate card item: ${saved.name} (Rate: ₹${saved.unitPrice || 0})`,
    });


    return saved;
  },

  async deleteConsumable(consumableId: string, actor: User): Promise<boolean> {
    ensureInitialized();
    const consumables = await this.getConsumables();
    const target = consumables.find(c => c.id === consumableId);
    if (!target) return false;

    const filtered = consumables.filter(c => c.id !== consumableId);
    localStorage.setItem(STORAGE_KEYS.CONSUMABLES, JSON.stringify(filtered));

    await this.recordAuditEvent({
      id: generateId('audit'),
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'Deleted Consumable Item',
      targetType: 'Settings',
      targetId: consumableId,
      targetName: target.name,
      changes: [{ field: 'consumable', from: target.name, to: 'Deleted' }],
      details: `Consumable ${target.name} removed from dropdown list`,
    });

    return true;
  },

  /**
   * Settings: Counsellors
   */
  async getCounsellors(): Promise<CounsellorSetting[]> {
    ensureInitialized();
    const raw = localStorage.getItem(STORAGE_KEYS.COUNSELLORS);
    return raw ? JSON.parse(raw) : SEED_COUNSELLORS;
  },

  async saveCounsellor(
    counsellorData: Omit<CounsellorSetting, 'id'> & { id?: string },
    actor: User
  ): Promise<CounsellorSetting> {
    ensureInitialized();
    const counsellors = await this.getCounsellors();
    let saved: CounsellorSetting;

    if (counsellorData.id) {
      const idx = counsellors.findIndex(c => c.id === counsellorData.id);
      if (idx !== -1) {
        saved = {
          ...counsellors[idx],
          name: counsellorData.name.trim(),
          role: counsellorData.role?.trim(),
        };
        counsellors[idx] = saved;
      } else {
        saved = {
          id: counsellorData.id,
          name: counsellorData.name.trim(),
          role: counsellorData.role?.trim(),
        };
        counsellors.push(saved);
      }
    } else {
      saved = {
        id: generateId('couns'),
        name: counsellorData.name.trim(),
        role: counsellorData.role?.trim(),
      };
      counsellors.push(saved);
    }

    localStorage.setItem(STORAGE_KEYS.COUNSELLORS, JSON.stringify(counsellors));

    await this.recordAuditEvent({
      id: generateId('audit'),
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: counsellorData.id ? 'Updated Counsellor Profile' : 'Added Counsellor Profile',
      targetType: 'Settings',
      targetId: saved.id,
      targetName: saved.name,
      changes: [{ field: 'counsellor', from: '', to: saved.name }],
      details: `Saved counsellor: ${saved.name}`,
    });

    return saved;
  },

  async deleteCounsellor(counsellorId: string, actor: User): Promise<boolean> {
    ensureInitialized();
    const counsellors = await this.getCounsellors();
    const target = counsellors.find(c => c.id === counsellorId);
    if (!target) return false;

    const filtered = counsellors.filter(c => c.id !== counsellorId);
    localStorage.setItem(STORAGE_KEYS.COUNSELLORS, JSON.stringify(filtered));

    await this.recordAuditEvent({
      id: generateId('audit'),
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'Deleted Counsellor Profile',
      targetType: 'Settings',
      targetId: counsellorId,
      targetName: target.name,
      changes: [{ field: 'counsellor', from: target.name, to: 'Deleted' }],
      details: `Counsellor ${target.name} removed from dropdown list`,
    });

    return true;
  },

  /**
   * Settings: Pre-Op Instructions Static Paragraph
   */
  async getPreOpInstructions(): Promise<string> {
    ensureInitialized();
    const raw = localStorage.getItem(STORAGE_KEYS.PREOP_INSTRUCTIONS);
    return raw || DEFAULT_PREOP_INSTRUCTIONS;
  },

  async savePreOpInstructions(instructions: string, actor: User): Promise<string> {
    ensureInitialized();
    localStorage.setItem(STORAGE_KEYS.PREOP_INSTRUCTIONS, instructions.trim());

    await this.recordAuditEvent({
      id: generateId('audit'),
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'Updated Pre-Op Instructions Template',
      targetType: 'Settings',
      targetId: 'preop_instructions_template',
      targetName: 'Preoperative Instructions',
      changes: [{ field: 'instructionsText', from: 'Previous', to: 'Updated Template' }],
      details: `Updated default pre-operative instructions text in settings`,
    });

    return instructions;
  },

  /**
   * Discharge Summary & Post-Operative Care Settings
   */
  async getDischargeMedications(): Promise<string> {
    ensureInitialized();
    const raw = localStorage.getItem(STORAGE_KEYS.DISCHARGE_MEDICATIONS);
    return raw || DEFAULT_DISCHARGE_MEDICATIONS;
  },

  async saveDischargeMedications(medications: string, actor: User): Promise<string> {
    ensureInitialized();
    localStorage.setItem(STORAGE_KEYS.DISCHARGE_MEDICATIONS, medications.trim());

    await this.recordAuditEvent({
      id: generateId('audit'),
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'Updated Discharge Medications Template',
      targetType: 'Settings',
      targetId: 'discharge_medications_template',
      targetName: 'Discharge Medications',
      changes: [{ field: 'medicationsText', from: 'Previous', to: 'Updated Template' }],
      details: 'Updated default discharge medications text in settings under Discharge tab',
    });

    return medications;
  },

  async getPostOpCare(): Promise<string> {
    ensureInitialized();
    const raw = localStorage.getItem(STORAGE_KEYS.POSTOP_CARE);
    return raw || DEFAULT_POSTOP_CARE;
  },

  async savePostOpCare(instructions: string, actor: User): Promise<string> {
    ensureInitialized();
    localStorage.setItem(STORAGE_KEYS.POSTOP_CARE, instructions.trim());

    await this.recordAuditEvent({
      id: generateId('audit'),
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'Updated Post-Operative Care Template',
      targetType: 'Settings',
      targetId: 'postop_care_template',
      targetName: 'Post-Operative Care',
      changes: [{ field: 'postOpCareText', from: 'Previous', to: 'Updated Template' }],
      details: 'Updated default post-operative care instructions text in settings under Discharge tab',
    });

    return instructions;
  },

  /**
   * Counselling Module Records
   */
  async getCounsellingRecords(): Promise<CounsellingRecord[]> {
    ensureInitialized();
    const raw = localStorage.getItem(STORAGE_KEYS.COUNSELLING);
    return raw ? JSON.parse(raw) : SEED_COUNSELLING;
  },

  async getCounsellingForPatient(patientId: string): Promise<CounsellingRecord | null> {
    const all = await this.getCounsellingRecords();
    return all.find(r => r.patientId === patientId) || null;
  },

  async saveCounsellingRecord(
    recordData: Omit<CounsellingRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
    actor: User
  ): Promise<CounsellingRecord> {
    ensureInitialized();
    const records = await this.getCounsellingRecords();
    const now = new Date().toISOString();
    let saved: CounsellingRecord;

    const existingIdx = recordData.id
      ? records.findIndex(r => r.id === recordData.id)
      : records.findIndex(r => r.patientId === recordData.patientId);

    if (existingIdx !== -1) {
      saved = {
        ...records[existingIdx],
        ...recordData,
        id: records[existingIdx].id,
        updatedAt: now,
      };
      records[existingIdx] = saved;
    } else {
      saved = {
        ...recordData,
        id: generateId('cnsl'),
        createdAt: now,
        updatedAt: now,
      };
      records.unshift(saved);
    }

    localStorage.setItem(STORAGE_KEYS.COUNSELLING, JSON.stringify(records));

    await this.recordAuditEvent({
      id: generateId('audit'),
      timestamp: now,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: existingIdx !== -1 ? 'Updated Counselling & Surgery Plan' : 'Created Counselling & Surgery Plan',
      targetType: 'Counselling',
      targetId: saved.id,
      targetName: saved.patientName,
      changes: [
        { field: 'eyeSelection', from: '', to: saved.eyeSelection },
        { field: 'tentativeDate', from: '', to: saved.tentativeSurgeryDate },
        { field: 'hospital', from: '', to: saved.hospitalName },
        { field: 'consumable', from: '', to: saved.plannedConsumable },
      ],
      details: `Counselling plan for ${saved.patientName} (${saved.uhid || saved.patientId}) scheduled for ${saved.tentativeSurgeryDate} at ${saved.hospitalName}`,
    });

    return saved;
  },

  async deleteCounsellingRecord(recordId: string, actor: User): Promise<boolean> {
    ensureInitialized();
    const records = await this.getCounsellingRecords();
    const target = records.find(r => r.id === recordId);
    if (!target) return false;

    const filtered = records.filter(r => r.id !== recordId);
    localStorage.setItem(STORAGE_KEYS.COUNSELLING, JSON.stringify(filtered));

    await this.recordAuditEvent({
      id: generateId('audit'),
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'Deleted Counselling Plan',
      targetType: 'Counselling',
      targetId: recordId,
      targetName: target.patientName,
      changes: [{ field: 'counsellingPlan', from: 'Active', to: 'Deleted' }],
      details: `Removed counselling record for ${target.patientName}`,
    });

    return true;
  },

  /**
   * Estimates (Pre-Billing Cost Estimates)
   */
  async getEstimates(): Promise<Estimate[]> {
    ensureInitialized();
    const raw = localStorage.getItem(STORAGE_KEYS.ESTIMATES);
    if (!raw) return SEED_ESTIMATES;
    try {
      return JSON.parse(raw);
    } catch {
      return SEED_ESTIMATES;
    }
  },

  async getEstimateById(estimateId: string): Promise<Estimate | undefined> {
    const estimates = await this.getEstimates();
    return estimates.find(e => e.id === estimateId || e.estimateNumber === estimateId);
  },

  async saveEstimate(
    estimateData: Omit<Estimate, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
    actor: User
  ): Promise<Estimate> {
    ensureInitialized();
    const estimates = await this.getEstimates();
    const isNew = !estimateData.id;
    const now = new Date().toISOString();

    const subtotal = estimateData.items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    const discount = Number(estimateData.discount) || 0;
    const tax = Number(estimateData.tax) || 0;
    const totalAmount = Math.max(0, subtotal - discount + tax);

    let patientEstimatedNetPayable = totalAmount;
    if (estimateData.isInsured) {
      const estimatedCoverage = Number(estimateData.estimatedInsuranceCoverage || estimateData.preAuthAmount) || 0;
      patientEstimatedNetPayable = Math.max(0, totalAmount - estimatedCoverage);
    }

    let estimateNumber = estimateData.estimateNumber;
    if (!estimateNumber || estimateNumber.trim() === '') {
      const year = new Date().getFullYear();
      const nextNum = estimates.length + 101;
      estimateNumber = `AEC/EST/${year}/${String(nextNum).padStart(4, '0')}`;
    }

    const estimateId = estimateData.id || generateId('est');
    const savedEstimate: Estimate = {
      ...estimateData,
      id: estimateId,
      estimateNumber,
      subtotal,
      discount,
      tax,
      totalAmount,
      patientEstimatedNetPayable,
      status: estimateData.status || 'Active',
      createdAt: isNew ? now : (estimates.find(e => e.id === estimateId)?.createdAt || now),
      updatedAt: now,
    };

    let updatedEstimates: Estimate[];
    if (isNew) {
      updatedEstimates = [savedEstimate, ...estimates];
    } else {
      updatedEstimates = estimates.map(e => (e.id === estimateId ? savedEstimate : e));
    }

    localStorage.setItem(STORAGE_KEYS.ESTIMATES, JSON.stringify(updatedEstimates));

    await this.recordAuditEvent({
      id: generateId('audit'),
      timestamp: now,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: isNew ? 'Generated Treatment Estimate' : 'Updated Treatment Estimate',
      targetType: 'Estimate',
      targetId: savedEstimate.id,
      targetName: savedEstimate.patientName,
      changes: [
        { field: 'estimateNumber', from: '', to: savedEstimate.estimateNumber },
        { field: 'totalAmount', from: '', to: `₹${savedEstimate.totalAmount}` },
        { field: 'estimatedPayable', from: '', to: `₹${savedEstimate.patientEstimatedNetPayable}` },
      ],
      details: `${isNew ? 'Generated' : 'Updated'} cost estimate ${savedEstimate.estimateNumber} for ${savedEstimate.patientName} (${savedEstimate.uhid || savedEstimate.patientId}) - Total: ₹${savedEstimate.totalAmount}`,
    });

    return savedEstimate;
  },

  async deleteEstimate(estimateId: string, actor: User): Promise<boolean> {
    ensureInitialized();
    const estimates = await this.getEstimates();
    const target = estimates.find(e => e.id === estimateId);
    if (!target) return false;

    const filtered = estimates.filter(e => e.id !== estimateId);
    localStorage.setItem(STORAGE_KEYS.ESTIMATES, JSON.stringify(filtered));

    await this.recordAuditEvent({
      id: generateId('audit'),
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'Deleted Treatment Estimate',
      targetType: 'Estimate',
      targetId: estimateId,
      targetName: target.patientName,
      changes: [{ field: 'estimate', from: target.estimateNumber, to: 'Deleted' }],
      details: `Removed estimate ${target.estimateNumber} for ${target.patientName}`,
    });

    return true;
  },

  async convertEstimateToBill(estimateId: string, actor: User): Promise<Bill> {
    ensureInitialized();
    const estimate = await this.getEstimateById(estimateId);
    if (!estimate) {
      throw new Error(`Estimate with ID ${estimateId} not found.`);
    }

    // Generate new Bill
    const bill = await this.saveBill(
      {
        billNumber: '',
        patientId: estimate.patientId,
        uhid: estimate.uhid,
        patientName: estimate.patientName,
        billDate: new Date().toISOString().split('T')[0],
        counsellingId: estimate.counsellingId,
        surgeryDate: estimate.surgeryDate,
        surgeryDetails: estimate.surgeryDetails,
        doctorName: estimate.doctorName,
        items: estimate.items.map(item => ({ ...item, id: generateId('item') })),
        subtotal: estimate.subtotal,
        discount: estimate.discount,
        tax: estimate.tax,
        totalAmount: estimate.totalAmount,
        isInsured: estimate.isInsured,
        insuranceCompany: estimate.insuranceCompany,
        tpaName: estimate.tpaName,
        policyNumber: estimate.policyNumber,
        preAuthAmount: estimate.preAuthAmount,
        finalApprovedAmount: estimate.estimatedInsuranceCoverage || estimate.preAuthAmount || 0,
        coPayPercent: estimate.coPayPercent,
        coPayAmount: estimate.coPayAmount,
        nonMedicalDeductions: estimate.nonMedicalDeductions,
        patientNetPayable: estimate.patientEstimatedNetPayable,
        paidAmount: 0,
        balanceDue: estimate.patientEstimatedNetPayable,
        status: 'Generated',
        notes: `Converted from Estimate ${estimate.estimateNumber}. ${estimate.notes || ''}`.trim(),
      },
      actor
    );

    // Update estimate state to 'Converted to Bill'
    const estimates = await this.getEstimates();
    const updatedEstimates = estimates.map(e => {
      if (e.id === estimateId) {
        return {
          ...e,
          status: 'Converted to Bill' as EstimateStatus,
          convertedBillId: bill.id,
          convertedBillNumber: bill.billNumber,
          updatedAt: new Date().toISOString(),
        };
      }
      return e;
    });
    localStorage.setItem(STORAGE_KEYS.ESTIMATES, JSON.stringify(updatedEstimates));

    await this.recordAuditEvent({
      id: generateId('audit'),
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'Converted Estimate to Bill',
      targetType: 'Estimate',
      targetId: estimate.id,
      targetName: estimate.patientName,
      changes: [
        { field: 'status', from: estimate.status, to: 'Converted to Bill' },
        { field: 'billNumber', from: '', to: bill.billNumber },
      ],
      details: `Converted Estimate ${estimate.estimateNumber} into Hospital Bill ${bill.billNumber} for ${bill.patientName}`,
    });

    return bill;
  },

  /**
   * Billing & Receipts Methods
   */
  async getBills(): Promise<Bill[]> {

    ensureInitialized();
    const raw = localStorage.getItem(STORAGE_KEYS.BILLS);
    if (!raw) return SEED_BILLS;
    try {
      return JSON.parse(raw);
    } catch {
      return SEED_BILLS;
    }
  },

  async getBillById(billId: string): Promise<Bill | undefined> {
    const bills = await this.getBills();
    return bills.find(b => b.id === billId || b.billNumber === billId);
  },

  async saveBill(
    billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
    actor: User
  ): Promise<Bill> {
    ensureInitialized();
    const bills = await this.getBills();
    const isNew = !billData.id;
    const now = new Date().toISOString();

    // Auto-calculate subtotal and total
    const subtotal = billData.items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    const discount = Number(billData.discount) || 0;
    const tax = Number(billData.tax) || 0;
    const totalAmount = Math.max(0, subtotal - discount + tax);

    // Insurance & Patient Net Payable Calculation
    let patientNetPayable = totalAmount;
    if (billData.isInsured) {
      const approved = Number(billData.finalApprovedAmount) || 0;
      patientNetPayable = Math.max(0, totalAmount - approved);
    }

    // Check receipts for this bill
    const allReceipts = await this.getReceipts();
    const billId = billData.id || generateId('bill');
    const receiptsForBill = allReceipts.filter(r => r.billId === billId);
    const paidAmount = receiptsForBill.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const balanceDue = patientNetPayable - paidAmount;

    // Determine status
    let status: BillPaymentStatus = billData.status || 'Generated';
    if (balanceDue < 0) {
      status = 'Refundable';
    } else if (balanceDue === 0 && (paidAmount > 0 || (billData.isInsured && (billData.finalApprovedAmount || 0) >= totalAmount))) {
      status = 'Settled';
    } else if (paidAmount > 0 && balanceDue > 0) {
      status = 'Partially Paid';
    } else if (status !== 'Draft') {
      status = 'Generated';
    }

    let billNumber = billData.billNumber;
    if (!billNumber || billNumber.trim() === '') {
      const year = new Date().getFullYear();
      const nextNum = bills.length + 101;
      billNumber = `AEC/BILL/${year}/${String(nextNum).padStart(4, '0')}`;
    }

    const savedBill: Bill = {
      ...billData,
      id: billId,
      billNumber,
      subtotal,
      discount,
      tax,
      totalAmount,
      patientNetPayable,
      paidAmount,
      balanceDue,
      status,
      createdAt: isNew ? now : (bills.find(b => b.id === billId)?.createdAt || now),
      updatedAt: now,
    };

    let updatedBills: Bill[];
    if (isNew) {
      updatedBills = [savedBill, ...bills];
    } else {
      updatedBills = bills.map(b => (b.id === billId ? savedBill : b));
    }

    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(updatedBills));

    await this.recordAuditEvent({
      id: generateId('audit'),
      timestamp: now,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: isNew ? 'Generated Hospital Bill' : 'Updated Hospital Bill',
      targetType: 'Billing',
      targetId: savedBill.id,
      targetName: savedBill.patientName,
      changes: [
        { field: 'billNumber', from: '', to: savedBill.billNumber },
        { field: 'totalAmount', from: '', to: `₹${savedBill.totalAmount}` },
        { field: 'patientNetPayable', from: '', to: `₹${savedBill.patientNetPayable}` },
        { field: 'status', from: '', to: savedBill.status },
      ],
      details: `${isNew ? 'Created' : 'Updated'} bill ${savedBill.billNumber} for ${savedBill.patientName} (${savedBill.uhid || savedBill.patientId}). Total: ₹${savedBill.totalAmount}, Net Payable: ₹${savedBill.patientNetPayable}`,
    });

    return savedBill;
  },

  async deleteBill(billId: string, actor: User): Promise<boolean> {
    ensureInitialized();
    const bills = await this.getBills();
    const target = bills.find(b => b.id === billId);
    if (!target) return false;

    // Also remove receipts tagged to this bill
    const receipts = await this.getReceipts();
    const remainingReceipts = receipts.filter(r => r.billId !== billId);
    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(remainingReceipts));

    const remainingBills = bills.filter(b => b.id !== billId);
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(remainingBills));

    await this.recordAuditEvent({
      id: generateId('audit'),
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'Deleted Bill',
      targetType: 'Billing',
      targetId: billId,
      targetName: target.patientName,
      changes: [{ field: 'bill', from: target.billNumber, to: 'Deleted' }],
      details: `Deleted bill ${target.billNumber} for ${target.patientName}`,
    });

    return true;
  },

  async getReceipts(): Promise<Receipt[]> {
    ensureInitialized();
    const raw = localStorage.getItem(STORAGE_KEYS.RECEIPTS);
    if (!raw) return SEED_RECEIPTS;
    try {
      return JSON.parse(raw);
    } catch {
      return SEED_RECEIPTS;
    }
  },

  async getReceiptsByBillId(billId: string): Promise<Receipt[]> {
    const receipts = await this.getReceipts();
    return receipts.filter(r => r.billId === billId);
  },

  async saveReceipt(
    receiptData: Omit<Receipt, 'id' | 'createdAt'> & { id?: string },
    actor: User
  ): Promise<Receipt> {
    ensureInitialized();
    const receipts = await this.getReceipts();
    const isNew = !receiptData.id;
    const now = new Date().toISOString();

    let receiptNumber = receiptData.receiptNumber;
    if (!receiptNumber || receiptNumber.trim() === '') {
      const year = new Date().getFullYear();
      const nextNum = receipts.length + 201;
      receiptNumber = `AEC/REC/${year}/${String(nextNum).padStart(4, '0')}`;
    }

    const savedReceipt: Receipt = {
      ...receiptData,
      id: receiptData.id || generateId('rcp'),
      receiptNumber,
      amount: Number(receiptData.amount) || 0,
      createdAt: isNew ? now : (receipts.find(r => r.id === receiptData.id)?.createdAt || now),
    };

    let updatedReceipts: Receipt[];
    if (isNew) {
      updatedReceipts = [savedReceipt, ...receipts];
    } else {
      updatedReceipts = receipts.map(r => (r.id === savedReceipt.id ? savedReceipt : r));
    }

    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(updatedReceipts));

    // Recalculate linked Bill payment state
    if (savedReceipt.billId) {
      await this.recalculateBillStatus(savedReceipt.billId);
    }

    await this.recordAuditEvent({
      id: generateId('audit'),
      timestamp: now,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: isNew ? 'Recorded Payment Receipt' : 'Updated Payment Receipt',
      targetType: 'Billing',
      targetId: savedReceipt.id,
      targetName: savedReceipt.patientName,
      changes: [
        { field: 'receiptNumber', from: '', to: savedReceipt.receiptNumber },
        { field: 'amount', from: '', to: `₹${savedReceipt.amount}` },
        { field: 'paymentMode', from: '', to: savedReceipt.paymentMode },
        { field: 'taggedBill', from: '', to: savedReceipt.billNumber },
      ],
      details: `Payment of ₹${savedReceipt.amount} received via ${savedReceipt.paymentMode} for Bill ${savedReceipt.billNumber} (${savedReceipt.patientName})`,
    });

    return savedReceipt;
  },

  async deleteReceipt(receiptId: string, actor: User): Promise<boolean> {
    ensureInitialized();
    const receipts = await this.getReceipts();
    const target = receipts.find(r => r.id === receiptId);
    if (!target) return false;

    const remainingReceipts = receipts.filter(r => r.id !== receiptId);
    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(remainingReceipts));

    if (target.billId) {
      await this.recalculateBillStatus(target.billId);
    }

    await this.recordAuditEvent({
      id: generateId('audit'),
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'Deleted Payment Receipt',
      targetType: 'Billing',
      targetId: receiptId,
      targetName: target.patientName,
      changes: [{ field: 'receipt', from: target.receiptNumber, to: 'Deleted' }],
      details: `Removed receipt ${target.receiptNumber} of ₹${target.amount} for Bill ${target.billNumber}`,
    });

    return true;
  },

  async recalculateBillStatus(billId: string): Promise<Bill | undefined> {
    ensureInitialized();
    const bills = await this.getBills();
    const bill = bills.find(b => b.id === billId);
    if (!bill) return undefined;

    const receipts = await this.getReceiptsByBillId(billId);
    const paidAmount = receipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const balanceDue = bill.patientNetPayable - paidAmount;

    let status: BillPaymentStatus = bill.status;
    if (balanceDue < 0) {
      status = 'Refundable';
    } else if (balanceDue === 0 && (paidAmount > 0 || (bill.isInsured && (bill.finalApprovedAmount || 0) >= bill.totalAmount))) {
      status = 'Settled';
    } else if (paidAmount > 0 && balanceDue > 0) {
      status = 'Partially Paid';
    } else if (status !== 'Draft') {
      status = 'Generated';
    }

    const updatedBill: Bill = {
      ...bill,
      paidAmount,
      balanceDue,
      status,
      updatedAt: new Date().toISOString(),
    };

    const updatedBills = bills.map(b => (b.id === billId ? updatedBill : b));
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(updatedBills));
    return updatedBill;
  },

  async getPatientBillingSummary(patientId: string): Promise<PatientBillingSummary | undefined> {
    ensureInitialized();
    const patients = await this.getPatients();
    const patient = patients.find(p => p.id === patientId || p.uhid === patientId);
    if (!patient) return undefined;

    const allBills = await this.getBills();
    const patientBills = allBills.filter(b => b.patientId === patient.id || (patient.uhid && b.uhid === patient.uhid));

    const allReceipts = await this.getReceipts();
    const patientReceipts = allReceipts.filter(
      r => r.patientId === patient.id || (patient.uhid && r.uhid === patient.uhid) || patientBills.some(b => b.id === r.billId)
    );

    const totalBilled = patientBills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
    const totalInsuranceApproved = patientBills.reduce(
      (acc, b) => acc + (b.isInsured ? (b.finalApprovedAmount || 0) : 0),
      0
    );
    const totalPatientNetPayable = patientBills.reduce((acc, b) => acc + (b.patientNetPayable || 0), 0);
    const totalPaid = patientReceipts.reduce((acc, r) => acc + (r.amount || 0), 0);
    const balanceDue = totalPatientNetPayable - totalPaid;

    let financialStatus: 'Cleared' | 'Outstanding' | 'Refundable' = 'Cleared';
    if (balanceDue > 0) {
      financialStatus = 'Outstanding';
    } else if (balanceDue < 0) {
      financialStatus = 'Refundable';
    } else {
      financialStatus = 'Cleared';
    }

    return {
      patientId: patient.id,
      uhid: patient.uhid,
      patientName: patient.name,
      isInsured: Boolean(patient.isInsured),
      bills: patientBills,
      receipts: patientReceipts,
      totalBilled,
      totalInsuranceApproved,
      totalPatientNetPayable,
      totalPaid,
      balanceDue,
      financialStatus,
    };
  },

  /**
   * System Utilities
   */
  resetToDefaults(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(SEED_PATIENTS));
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(SEED_AUDIT_LOGS));
    localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(SEED_HOSPITALS));
    localStorage.setItem(STORAGE_KEYS.CONSUMABLES, JSON.stringify(SEED_CONSUMABLES));
    localStorage.setItem(STORAGE_KEYS.COUNSELLORS, JSON.stringify(SEED_COUNSELLORS));
    localStorage.setItem(STORAGE_KEYS.PREOP_INSTRUCTIONS, DEFAULT_PREOP_INSTRUCTIONS);
    localStorage.setItem(STORAGE_KEYS.COUNSELLING, JSON.stringify(SEED_COUNSELLING));
    localStorage.setItem(STORAGE_KEYS.DISCHARGE_MEDICATIONS, DEFAULT_DISCHARGE_MEDICATIONS);
    localStorage.setItem(STORAGE_KEYS.POSTOP_CARE, DEFAULT_POSTOP_CARE);
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(SEED_BILLS));
    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(SEED_RECEIPTS));
    localStorage.setItem(STORAGE_KEYS.ESTIMATES, JSON.stringify(SEED_ESTIMATES));
  },

  getStorageStats(): { userCount: number; patientCount: number; auditCount: number; sizeKb: number } {
    if (typeof window === 'undefined') return { userCount: 0, patientCount: 0, auditCount: 0, sizeKb: 0 };
    ensureInitialized();
    const usersStr = localStorage.getItem(STORAGE_KEYS.USERS) || '[]';
    const patientsStr = localStorage.getItem(STORAGE_KEYS.PATIENTS) || '[]';
    const auditStr = localStorage.getItem(STORAGE_KEYS.AUDIT) || '[]';
    const hospitalsStr = localStorage.getItem(STORAGE_KEYS.HOSPITALS) || '[]';
    const consumablesStr = localStorage.getItem(STORAGE_KEYS.CONSUMABLES) || '[]';
    const counsellorsStr = localStorage.getItem(STORAGE_KEYS.COUNSELLORS) || '[]';
    const counsellingStr = localStorage.getItem(STORAGE_KEYS.COUNSELLING) || '[]';
    const billsStr = localStorage.getItem(STORAGE_KEYS.BILLS) || '[]';
    const receiptsStr = localStorage.getItem(STORAGE_KEYS.RECEIPTS) || '[]';
    const estimatesStr = localStorage.getItem(STORAGE_KEYS.ESTIMATES) || '[]';

    const totalBytes =
      (usersStr.length +
        patientsStr.length +
        auditStr.length +
        hospitalsStr.length +
        consumablesStr.length +
        counsellorsStr.length +
        counsellingStr.length +
        billsStr.length +
        receiptsStr.length +
        estimatesStr.length) *
      2;
    return {
      userCount: JSON.parse(usersStr).length,
      patientCount: JSON.parse(patientsStr).length,
      auditCount: JSON.parse(auditStr).length,
      sizeKb: parseFloat((totalBytes / 1024).toFixed(2)),
    };
  },
};



// Expose ApiClient and isLiveServer on window object for inspection/testing
if (typeof window !== 'undefined') {
  (window as unknown as { ApiClient: typeof ApiClient; isLiveServer: boolean }).ApiClient = ApiClient;
  (window as unknown as { isLiveServer: boolean }).isLiveServer = isLiveServer;
}
