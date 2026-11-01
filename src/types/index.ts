export type UserRole = 'admin' | 'doctor' | 'nurse' | 'billing';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  pin: string; // 4-digit numeric string
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export type BillingStatus = 
  | 'Pending'
  | 'Pre-Auth Submitted'
  | 'Insurance Approved'
  | 'Self-Pay Cleared'
  | 'Billed'
  | 'Settled';

export type PatientStatus = 
  | 'Registered'
  | 'Active'
  | 'Under Treatment'
  | 'Completed'
  | 'Discharged';

export interface Patient {
  id: string; // e.g., IP-2026-101
  uhid: string; // alphanumeric ID filled in by user (e.g., AEC-8821 or empty)
  name: string; // Mandatory (only mandatory field)
  dob?: string; // Date of birth (YYYY-MM-DD)
  age: number; // Age in years
  gender: 'Male' | 'Female' | 'Other';
  address?: string; // Postal/residential address
  mobileNo?: string; // Contact phone number
  isInsured?: boolean; // Insurance or Non-Insurance tick mark
  drugAllergies?: string; // Drug allergies / adverse reactions
  eye?: 'Left (OS)' | 'Right (OD)' | 'Both (OU)';
  procedure?: string;
  attendingDoctor?: string;
  patientStatus?: PatientStatus;
  billingStatus?: BillingStatus;
  estimatedCost?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FieldChange {
  field: string;
  from: string;
  to: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string; // e.g. "Registered Patient", "Updated Patient", "Changed Billing Status", "Reset Staff PIN"
  targetType: 'Patient' | 'Billing' | 'Staff' | 'System' | 'Counselling' | 'Settings' | 'Estimate' | 'Report';
  targetId: string; // patient id or username
  targetName: string; // patient name or staff name
  changes: FieldChange[];
  details?: string;
}

export interface HospitalSetting {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
}

export interface ConsumableSetting {
  id: string;
  name: string;
  unitPrice?: number; // Rate card price in ₹
  category?: string; // Rate card category e.g. IOL, Viscoelastic, Pack, Blade
}


export interface CounsellorSetting {
  id: string;
  name: string;
  role?: string;
}

export type EyeSelection = 'OD' | 'OS' | 'Both';

export interface CounsellingRecord {
  id: string;
  patientId: string;
  uhid: string;
  patientName: string;
  eyeSelection: EyeSelection; // OD (left eye) or OS (right eye) or both eyes
  tentativeSurgeryDate: string; // YYYY-MM-DD
  hospitalId: string;
  hospitalName: string;
  hospitalAddressLine1?: string;
  hospitalAddressLine2?: string;
  hospitalPhone?: string;
  counsellorName: string;
  plannedConsumable: string;
  lensType?: string;
  lensPower?: string;
  surgeryPlan: string;
  preOpInstructions: string;
  dischargeMedications?: string;
  dischargePostOpCare?: string;
  reviewDate1?: string;
  reviewDate2?: string;
  reviewDate3?: string;
  createdAt: string;
  updatedAt: string;
}

export type BillItemCategory = 
  | 'surgeon_fee' 
  | 'consumable' 
  | 'ot_charges' 
  | 'investigation' 
  | 'room' 
  | 'pharmacy' 
  | 'other';

export interface BillItem {
  id: string;
  description: string;
  category: BillItemCategory;
  consumableId?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export type EstimateStatus = 
  | 'Active' 
  | 'Converted to Bill' 
  | 'Expired';

export interface Estimate {
  id: string; // e.g. est_001
  estimateNumber: string; // e.g. AEC/EST/2026/0101
  patientId: string;
  uhid: string;
  patientName: string;
  estimateDate: string; // YYYY-MM-DD
  validUntil?: string; // YYYY-MM-DD
  counsellingId?: string;
  surgeryDate?: string; // YYYY-MM-DD
  surgeryDetails?: string;
  doctorName?: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  // Insurance details
  isInsured: boolean;
  insuranceCompany?: string;
  tpaName?: string;
  policyNumber?: string;
  preAuthAmount?: number;
  estimatedInsuranceCoverage?: number;
  coPayPercent?: number;
  coPayAmount?: number;
  nonMedicalDeductions?: number;
  patientEstimatedNetPayable: number;
  status: EstimateStatus;
  convertedBillId?: string;
  convertedBillNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type BillPaymentStatus = 
  | 'Draft' 
  | 'Generated' 
  | 'Partially Paid' 
  | 'Settled' 
  | 'Refundable' 
  | 'Cancelled';


export interface Bill {
  id: string; // e.g. BILL-2026-001
  billNumber: string; // e.g. AEC/BILL/2026/0101
  patientId: string;
  uhid: string;
  patientName: string;
  billDate: string; // YYYY-MM-DD
  counsellingId?: string;
  surgeryDate?: string; // YYYY-MM-DD
  surgeryDetails?: string; // e.g. "Left eye Phaco with Foldable Hydrophobic Monofocal IOL"
  doctorName?: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  // Insurance details
  isInsured: boolean;
  insuranceCompany?: string;
  tpaName?: string;
  policyNumber?: string;
  claimNumber?: string;
  preAuthAmount?: number;
  finalApprovedAmount?: number;
  coPayPercent?: number; // e.g. 10 for 10%
  coPayAmount?: number;
  nonMedicalDeductions?: number;
  patientNetPayable: number;
  // Payment tracking
  paidAmount: number;
  balanceDue: number; // can be negative if refundable
  status: BillPaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMode = 
  | 'Cash' 
  | 'GPay / UPI' 
  | 'Online Transfer' 
  | 'Cheque' 
  | 'Card' 
  | 'Insurance Direct';

export interface Receipt {
  id: string; // e.g. RCP-2026-001
  receiptNumber: string; // e.g. AEC/REC/2026/0201
  billId: string;
  billNumber: string;
  patientId: string;
  uhid: string;
  patientName: string;
  paymentDate: string; // YYYY-MM-DD
  amount: number;
  paymentMode: PaymentMode;
  referenceNumber?: string; // UPI Ref / UTR / Cheque No / Card Auth
  bankName?: string;
  chequeDate?: string;
  receivedBy: string;
  remarks?: string;
  createdAt: string;
}

export interface PatientBillingSummary {
  patientId: string;
  uhid: string;
  patientName: string;
  isInsured: boolean;
  bills: Bill[];
  receipts: Receipt[];
  totalBilled: number;
  totalInsuranceApproved: number;
  totalPatientNetPayable: number;
  totalPaid: number;
  balanceDue: number;
  financialStatus: 'Cleared' | 'Outstanding' | 'Refundable';
}

export interface DevComment {
  id: string;
  content: string;
  authorName: string;
  authorRole?: string;
  tab: string;
  targetDescription?: string;
  xPercent: number;
  yPercent: number;
  createdAt: string;
  updatedAt?: string;
}


