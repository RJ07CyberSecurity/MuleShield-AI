import { create } from "zustand";

interface NewCaseState {
  // Section 1: Case Info
  caseNumber: string;
  caseTitle: string;
  caseDescription: string;
  crimeCategory: string;
  priority: string;
  status: string;
  policeStation: string;
  investigationUnit: string;
  assignedOfficer: string;

  // Section 2: Customer Info
  customerName: string;
  fatherName: string;
  dob: string;
  gender: string;
  nationality: string;
  occupation: string;
  customerId: string;
  panNumber: string;
  aadhaarNumber: string;
  passportNumber: string;
  phoneNumber: string;
  altPhone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
  customerPhoto: File | null;

  // Section 3: Suspicious Bank Account
  suspiciousAccountNumber: string;
  confirmAccountNumber: string;
  accountHolderName: string;
  bankName: string;
  branch: string;
  ifscCode: string;
  accountType: string;
  dateAccountOpened: string;
  accountStatus: string;
  currentBalance: string;
  riskLevel: string;
  kycStatus: string;

  // Section 4: Transaction Summary
  totalTransactions: string;
  totalCreditAmount: string;
  totalDebitAmount: string;
  highestTransaction: string;
  averageTransaction: string;
  firstSuspiciousTxnDate: string;
  lastSuspiciousTxnDate: string;
  noOfSuspiciousTxns: string;
  suspiciousAmount: string;

  // Section 5: Evidence
  evidenceFiles: File[];

  // Section 6: Notes
  investigationNotes: string;

  // Global Flags
  isSubmitting: boolean;

  // Actions
  updateField: (field: keyof Omit<NewCaseState, "updateField" | "resetForm" | "addEvidenceFile" | "removeEvidenceFile">, value: any) => void;
  addEvidenceFile: (file: File) => void;
  removeEvidenceFile: (index: number) => void;
  resetForm: () => void;
}

const initialState = {
  caseNumber: `MC-2026-${Math.floor(Math.random() * 9000) + 1000}`,
  caseTitle: "",
  caseDescription: "",
  crimeCategory: "Mule Account",
  priority: "Medium",
  status: "Open",
  policeStation: "",
  investigationUnit: "",
  assignedOfficer: "",

  customerName: "",
  fatherName: "",
  dob: "",
  gender: "",
  nationality: "Indian",
  occupation: "",
  customerId: "",
  panNumber: "",
  aadhaarNumber: "",
  passportNumber: "",
  phoneNumber: "",
  altPhone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  pinCode: "",
  customerPhoto: null,

  suspiciousAccountNumber: "",
  confirmAccountNumber: "",
  accountHolderName: "",
  bankName: "",
  branch: "",
  ifscCode: "",
  accountType: "Savings",
  dateAccountOpened: "",
  accountStatus: "Active",
  currentBalance: "",
  riskLevel: "High",
  kycStatus: "Verified",

  totalTransactions: "",
  totalCreditAmount: "",
  totalDebitAmount: "",
  highestTransaction: "",
  averageTransaction: "",
  firstSuspiciousTxnDate: "",
  lastSuspiciousTxnDate: "",
  noOfSuspiciousTxns: "",
  suspiciousAmount: "",

  evidenceFiles: [],
  investigationNotes: "",

  isSubmitting: false,
};

export const useNewCaseStore = create<NewCaseState>((set) => ({
  ...initialState,
  
  updateField: (field, value) => set({ [field]: value }),
  
  addEvidenceFile: (file) => set((state) => ({ evidenceFiles: [...state.evidenceFiles, file] })),
  
  removeEvidenceFile: (index) => set((state) => {
    const newFiles = [...state.evidenceFiles];
    newFiles.splice(index, 1);
    return { evidenceFiles: newFiles };
  }),

  resetForm: () => set({ ...initialState, caseNumber: `MC-2026-${Math.floor(Math.random() * 9000) + 1000}` })
}));
