import type { createActor } from "@/backend";
import type {
  Attendance as BackendAttendance,
  DashboardStats as BackendDashboardStats,
  FeeStatusEntry as BackendFeeStatusEntry,
  MonthlyFeePayment as BackendMonthlyFeePayment,
  Student as BackendStudent,
  StudentInput as BackendStudentInput,
} from "@/backend";
import {
  AgeCategory,
  AttendanceStatus,
  BatchTiming,
  PaymentMode,
} from "@/backend";
import type {
  Attendance,
  AttendanceSummaryEntry,
  DashboardStats,
  FeeStatusEntry,
  MonthlyFeePayment,
  MonthlyReport,
  Student,
  StudentInput,
} from "@/types";

export { AttendanceStatus, BatchTiming, PaymentMode, AgeCategory };

function toStudent(s: BackendStudent): Student {
  return {
    id: Number(s.id),
    name: s.name,
    guardianName: s.guardianName,
    whatsappNumber: s.whatsappNumber,
    ageCategory: s.ageCategory,
    batchTiming: s.batchTiming,
    paymentMode: s.paymentMode,
    monthlyFees: Number(s.monthlyFees),
    registrationFees: Number(s.registrationFees),
    totalPaid: Number(s.totalPaid),
    registrationDate: Number(s.registrationDate),
    receiptNumber: s.receiptNumber,
    photoUrl: s.photoUrl,
    locationId: s.locationId,
  };
}

function toAttendance(a: BackendAttendance): Attendance {
  return {
    id: Number(a.id),
    studentId: Number(a.studentId),
    date: a.date,
    status: a.status,
  };
}

function toPayment(p: BackendMonthlyFeePayment): MonthlyFeePayment {
  return {
    id: Number(p.id),
    studentId: Number(p.studentId),
    month: p.month,
    amount: Number(p.amount),
    paymentMode: p.paymentMode,
    paymentDate: p.paymentDate,
    receiptNumber: p.receiptNumber,
  };
}

function toStats(d: BackendDashboardStats): DashboardStats {
  return {
    totalStudents: Number(d.totalStudents),
    totalFeesCollected: Number(d.totalFeesCollected),
    feeOverdueCount: Number(d.feeOverdueCount),
    receiptsIssued: Number(d.receiptsIssued),
  };
}

function toFeeStatusEntry(e: BackendFeeStatusEntry): FeeStatusEntry {
  return {
    student: toStudent(e.student),
    payment: e.payment ? toPayment(e.payment) : undefined,
  };
}

export async function getAllStudents(
  actor: ReturnType<typeof createActor>,
  locationId: string,
): Promise<Student[]> {
  const result = await actor.getAllStudents(locationId);
  return result.map(toStudent);
}

export async function getStudent(
  actor: ReturnType<typeof createActor>,
  id: number,
): Promise<Student | null> {
  const result = await actor.getStudent(BigInt(id));
  return result ? toStudent(result) : null;
}

export async function getStudentByName(
  actor: ReturnType<typeof createActor>,
  locationId: string,
  name: string,
): Promise<Student[]> {
  const result = await actor.getStudentByName(locationId, name);
  return result.map(toStudent);
}

export async function registerStudent(
  actor: ReturnType<typeof createActor>,
  data: StudentInput,
): Promise<[number, string]> {
  const input: BackendStudentInput = {
    name: data.name,
    guardianName: data.guardianName,
    whatsappNumber: data.whatsappNumber,
    ageCategory: data.ageCategory,
    batchTiming: data.batchTiming,
    paymentMode: data.paymentMode,
    monthlyFees: BigInt(data.monthlyFees),
    registrationFees: BigInt(data.registrationFees),
    photoUrl: data.photoUrl,
    locationId: data.locationId,
  };
  const [id, receipt] = await actor.registerStudent(input);
  return [Number(id), receipt];
}

export async function getDashboardStats(
  actor: ReturnType<typeof createActor>,
  locationId: string,
): Promise<DashboardStats> {
  const result = await actor.getDashboardStats(locationId);
  return toStats(result);
}

export async function getAttendanceByDate(
  actor: ReturnType<typeof createActor>,
  locationId: string,
  date: string,
): Promise<Attendance[]> {
  const result = await actor.getAttendanceByDate(locationId, date);
  return result.map(toAttendance);
}

export async function getStudentAttendance(
  actor: ReturnType<typeof createActor>,
  studentId: number,
): Promise<Attendance[]> {
  const result = await actor.getStudentAttendance(BigInt(studentId));
  return result.map(toAttendance);
}

export async function markAttendance(
  actor: ReturnType<typeof createActor>,
  studentId: number,
  date: string,
  status: AttendanceStatus,
): Promise<boolean> {
  return actor.markAttendance(BigInt(studentId), date, status);
}

export async function getFeeStatusForMonth(
  actor: ReturnType<typeof createActor>,
  locationId: string,
  month: string,
): Promise<FeeStatusEntry[]> {
  const result = await actor.getFeeStatusForMonth(locationId, month);
  return result.map(toFeeStatusEntry);
}

export async function getMonthlyFeePayments(
  actor: ReturnType<typeof createActor>,
  studentId: number,
): Promise<MonthlyFeePayment[]> {
  const result = await actor.getMonthlyFeePayments(BigInt(studentId));
  return result.map(toPayment);
}

export async function getAllMonthlyFeePayments(
  actor: ReturnType<typeof createActor>,
  locationId: string,
): Promise<MonthlyFeePayment[]> {
  const result = await actor.getAllMonthlyFeePayments(locationId);
  return result.map(toPayment);
}

export async function collectMonthlyFee(
  actor: ReturnType<typeof createActor>,
  studentId: number,
  month: string,
  amount: number,
  paymentMode: PaymentMode,
  paymentDate: string,
): Promise<string> {
  return actor.collectMonthlyFee(
    BigInt(studentId),
    month,
    BigInt(amount),
    paymentMode,
    paymentDate,
  );
}

export async function deleteStudent(
  actor: ReturnType<typeof createActor>,
  locationId: string,
  adminPin: string,
  studentId: number,
): Promise<{ ok: true } | { ok: false; err: string }> {
  const result = await actor.deleteStudent(
    locationId,
    adminPin,
    BigInt(studentId),
  );
  if (result.__kind__ === "ok") return { ok: true };
  return { ok: false, err: result.err };
}

export async function verifyAdminPin(
  actor: ReturnType<typeof createActor>,
  locationId: string,
  pin: string,
): Promise<boolean> {
  return actor.verifyAdminPin(locationId, pin);
}

export async function changeAdminPin(
  actor: ReturnType<typeof createActor>,
  locationId: string,
  oldPin: string,
  newPin: string,
): Promise<boolean> {
  return actor.changeAdminPin(locationId, oldPin, newPin);
}

export async function getMonthlyReport(
  actor: ReturnType<typeof createActor>,
  locationId: string,
  month: string,
): Promise<MonthlyReport> {
  const [feeStatuses, allStudents] = await Promise.all([
    actor.getFeeStatusForMonth(locationId, month),
    actor.getAllStudents(locationId),
  ]);

  let totalCollected = 0;
  let totalPending = 0;

  for (const entry of feeStatuses) {
    if (entry.payment) {
      totalCollected += Number(entry.payment.amount);
    } else {
      totalPending += Number(entry.student.monthlyFees);
    }
  }

  const year = month.slice(0, 4);
  const mon = month.slice(4, 6);
  const prefix = `${year}-${mon}`;

  const attendanceResults = await Promise.all(
    allStudents.map(async (s) => {
      const records = await actor.getStudentAttendance(s.id);
      const monthRecords = records.filter((r) => r.date.startsWith(prefix));
      const presentDays = monthRecords.filter(
        (r) => r.status === AttendanceStatus.Present,
      ).length;
      const absentDays = monthRecords.filter(
        (r) => r.status === AttendanceStatus.Absent,
      ).length;
      const totalDays = monthRecords.length;
      const percentage =
        totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
      const summary: AttendanceSummaryEntry = {
        studentId: Number(s.id),
        studentName: s.name,
        presentDays,
        absentDays,
        totalDays,
        percentage,
      };
      return summary;
    }),
  );

  return {
    month,
    totalCollected,
    totalPending,
    studentAttendanceSummary: attendanceResults.filter((e) => e.totalDays > 0),
  };
}
