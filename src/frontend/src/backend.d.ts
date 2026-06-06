import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface MonthlyReport {
    month: string;
    totalCollected: bigint;
    studentAttendanceSummary: Array<AttendanceSummaryEntry>;
    totalPending: bigint;
}
export type Timestamp = bigint;
export type ReceiptNumber = string;
export interface AttendanceSummaryEntry {
    studentId: StudentId;
    studentName: string;
    totalDays: bigint;
    daysPresent: bigint;
    percentage: bigint;
}
export type FeePaymentId = bigint;
export interface Attendance {
    id: AttendanceId;
    status: AttendanceStatus;
    studentId: StudentId;
    date: string;
}
export interface StudentInput {
    batchTiming: BatchTiming;
    name: string;
    photoUrl?: string;
    whatsappNumber: string;
    locationId: string;
    paymentMode: PaymentMode;
    monthlyFees: bigint;
    registrationFees: bigint;
    guardianName: string;
    ageCategory: AgeCategory;
}
export type AttendanceId = bigint;
export interface DashboardStats {
    totalFeesCollected: bigint;
    totalStudents: bigint;
    feeOverdueCount: bigint;
    receiptsIssued: bigint;
}
export type StudentId = bigint;
export interface FeeStatusEntry {
    student: Student;
    payment?: MonthlyFeePayment;
}
export interface MonthlyFeePayment {
    id: FeePaymentId;
    month: string;
    studentId: StudentId;
    paymentDate: string;
    paymentMode: PaymentMode;
    amount: bigint;
    receiptNumber: ReceiptNumber;
}
export interface Student {
    id: StudentId;
    batchTiming: BatchTiming;
    name: string;
    photoUrl?: string;
    totalPaid: bigint;
    whatsappNumber: string;
    locationId: string;
    paymentMode: PaymentMode;
    monthlyFees: bigint;
    registrationDate: Timestamp;
    registrationFees: bigint;
    guardianName: string;
    receiptNumber: ReceiptNumber;
    ageCategory: AgeCategory;
}
export enum AgeCategory {
    Senior = "Senior",
    Under12 = "Under12",
    Under14 = "Under14",
    Under16 = "Under16",
    Under19 = "Under19"
}
export enum AttendanceStatus {
    Present = "Present",
    Absent = "Absent"
}
export enum BatchTiming {
    Morning = "Morning",
    Evening = "Evening"
}
export enum PaymentMode {
    Cash = "Cash",
    OnlineUPI = "OnlineUPI",
    Cheque = "Cheque"
}
export interface backendInterface {
    changeAdminPin(locationId: string, oldPin: string, newPin: string): Promise<boolean>;
    collectMonthlyFee(studentId: StudentId, month: string, amount: bigint, paymentMode: PaymentMode, paymentDate: string): Promise<ReceiptNumber>;
    deleteStudent(locationId: string, adminPin: string, studentId: StudentId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getAllMonthlyFeePayments(locationId: string): Promise<Array<MonthlyFeePayment>>;
    getAllStudents(locationId: string): Promise<Array<Student>>;
    getAttendanceByDate(locationId: string, date: string): Promise<Array<Attendance>>;
    getDashboardStats(locationId: string): Promise<DashboardStats>;
    getFeeStatusForMonth(locationId: string, month: string): Promise<Array<FeeStatusEntry>>;
    getLocations(): Promise<Array<[string, string]>>;
    getMonthlyFeePayments(studentId: StudentId): Promise<Array<MonthlyFeePayment>>;
    getMonthlyReport(locationId: string, month: string): Promise<MonthlyReport>;
    getStudent(id: StudentId): Promise<Student | null>;
    getStudentAttendance(studentId: StudentId): Promise<Array<Attendance>>;
    getStudentByName(locationId: string, name: string): Promise<Array<Student>>;
    markAttendance(studentId: StudentId, date: string, status: AttendanceStatus): Promise<boolean>;
    registerStudent(data: StudentInput): Promise<[StudentId, ReceiptNumber]>;
    verifyAdminPin(locationId: string, pin: string): Promise<boolean>;
}
