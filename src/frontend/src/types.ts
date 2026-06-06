import type {
  AgeCategory,
  AttendanceStatus,
  BatchTiming,
  PaymentMode,
} from "@/backend";

export type { AgeCategory, AttendanceStatus, BatchTiming, PaymentMode };

export interface Student {
  id: number;
  name: string;
  guardianName: string;
  whatsappNumber: string;
  ageCategory: AgeCategory;
  batchTiming: BatchTiming;
  paymentMode: PaymentMode;
  monthlyFees: number;
  registrationFees: number;
  totalPaid: number;
  registrationDate: number;
  receiptNumber: string;
  photoUrl?: string;
  locationId: string;
}

export interface Attendance {
  id: number;
  studentId: number;
  date: string;
  status: AttendanceStatus;
}

export interface MonthlyFeePayment {
  id: number;
  studentId: number;
  month: string;
  amount: number;
  paymentMode: PaymentMode;
  paymentDate: string;
  receiptNumber: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalFeesCollected: number;
  feeOverdueCount: number;
  receiptsIssued: number;
}

export interface FeeStatusEntry {
  student: Student;
  payment?: MonthlyFeePayment;
}

export interface StudentInput {
  name: string;
  guardianName: string;
  whatsappNumber: string;
  ageCategory: AgeCategory;
  batchTiming: BatchTiming;
  paymentMode: PaymentMode;
  monthlyFees: number;
  registrationFees: number;
  photoUrl?: string;
  locationId: string;
}

export interface AttendanceSummaryEntry {
  studentId: number;
  studentName: string;
  presentDays: number;
  absentDays: number;
  totalDays: number;
  percentage: number;
}

export interface MonthlyReport {
  month: string;
  totalCollected: number;
  totalPending: number;
  studentAttendanceSummary: AttendanceSummaryEntry[];
}
