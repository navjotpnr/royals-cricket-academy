import { createActor } from "@/backend";
import { AcademyBranding } from "@/components/AcademyBranding";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AttendanceStatus,
  getMonthlyFeePayments,
  getStudent,
  getStudentAttendance,
} from "@/services/backend-service";
import { useAuthStore } from "@/store/auth-store";
import type { Attendance, MonthlyFeePayment, Student } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Calendar, CreditCard, LogOut, User } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const AGE_LABEL: Record<string, string> = {
  Under12: "Under-12",
  Under14: "Under-14",
  Under16: "Under-16",
  Under19: "Under-19",
  Senior: "Senior",
};

function formatDate(ts: number) {
  return new Date(ts / 1_000_000).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Attendance Calendar ───────────────────────────────────────────────────────
interface AttendanceCalendarProps {
  year: number;
  month: number; // 0-indexed
  records: Attendance[];
}
function AttendanceCalendar({ year, month, records }: AttendanceCalendarProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

  const statusMap: Record<number, AttendanceStatus> = {};
  for (const r of records) {
    if (r.date.startsWith(monthPrefix)) {
      const day = new Date(r.date).getDate();
      statusMap[day] = r.status;
    }
  }

  const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const firstDow = new Date(year, month, 1).getDay();

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-semibold text-muted-foreground py-1"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for offset */}
        {Array.from({ length: firstDow }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static grid offset cells
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const status = statusMap[day];
          const isPresent = status === AttendanceStatus.Present;
          const isAbsent = status === AttendanceStatus.Absent;
          return (
            <div
              key={day}
              className={`aspect-square flex items-center justify-center rounded-full text-xs font-medium transition-colors
                ${
                  isPresent
                    ? "bg-primary text-primary-foreground font-bold"
                    : isAbsent
                      ? "bg-destructive/20 text-destructive font-medium border border-destructive/40"
                      : "bg-muted text-muted-foreground"
                }`}
              data-ocid={`player.calendar_day.${day}`}
              title={isPresent ? "Present" : isAbsent ? "Absent" : "No record"}
            >
              {day}
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>Present</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-destructive/20 border border-destructive/40" />
          <span>Absent</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-muted" />
          <span>No record</span>
        </div>
      </div>
    </div>
  );
}

// ── Fee payment row ───────────────────────────────────────────────────────────
function FeePaymentRow({
  payment,
  index,
}: { payment: MonthlyFeePayment; index: number }) {
  return (
    <div
      className="flex items-center justify-between py-2.5 border-b last:border-0"
      data-ocid={`player.fee_payment.${index}`}
    >
      <div>
        <p className="text-sm font-semibold">{payment.month}</p>
        <p className="text-xs text-muted-foreground font-mono">
          {payment.receiptNumber}
        </p>
        <p className="text-xs text-muted-foreground">
          {payment.paymentDate} ·{" "}
          {payment.paymentMode === "OnlineUPI" ? "UPI" : payment.paymentMode}
        </p>
      </div>
      <Badge className="bg-primary text-primary-foreground text-xs">
        ₹{payment.amount.toLocaleString("en-IN")}
      </Badge>
    </div>
  );
}

// ── Profile Card ─────────────────────────────────────────────────────────────
function StudentProfileCard({ student }: { student: Student }) {
  return (
    <Card data-ocid="player.student_details_card">
      <CardHeader className="pb-2 bg-primary/5 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30 shrink-0">
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={student.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-7 h-7 text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <CardTitle className="font-display text-lg leading-tight truncate">
              {student.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {student.guardianName}
            </p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {AGE_LABEL[student.ageCategory] ?? student.ageCategory} Elite
              </Badge>
              <Badge variant="outline" className="text-xs">
                {student.batchTiming}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-3 grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Academy ID</p>
          <p className="font-mono font-semibold text-xs">
            {student.receiptNumber}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">WhatsApp</p>
          <p className="font-medium text-xs">{student.whatsappNumber}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Registration Date</p>
          <p className="font-medium text-xs">
            {formatDate(student.registrationDate)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Monthly Fees</p>
          <p className="font-semibold text-xs">
            ₹{student.monthlyFees.toLocaleString("en-IN")}/mo
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Attendance Section ────────────────────────────────────────────────────────
function AttendanceSection({ records }: { records: Attendance[] }) {
  const today = new Date();
  const presentDays = records.filter(
    (a) => a.status === AttendanceStatus.Present,
  ).length;
  const absentDays = records.filter(
    (a) => a.status === AttendanceStatus.Absent,
  ).length;
  const totalRecorded = records.length;
  const pct =
    totalRecorded > 0 ? Math.round((presentDays / totalRecorded) * 100) : 0;

  const pctColor =
    pct >= 75
      ? "bg-primary"
      : pct >= 50
        ? "bg-destructive/70"
        : "bg-destructive";

  return (
    <Card data-ocid="player.attendance_card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Attendance
          </CardTitle>
          <Badge
            variant="outline"
            className="text-sm font-bold border-primary/40 text-primary"
          >
            {pct}%
          </Badge>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-3 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-primary/10 rounded-lg py-2 px-1">
            <p className="text-lg font-bold text-primary">{presentDays}</p>
            <p className="text-xs text-muted-foreground">Present</p>
          </div>
          <div className="bg-destructive/10 rounded-lg py-2 px-1">
            <p className="text-lg font-bold text-destructive">{absentDays}</p>
            <p className="text-xs text-muted-foreground">Absent</p>
          </div>
          <div className="bg-muted rounded-lg py-2 px-1">
            <p className="text-lg font-bold">{totalRecorded}</p>
            <p className="text-xs text-muted-foreground">Total Days</p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Attendance Rate</span>
            <span>
              {presentDays}/{totalRecorded} days
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pctColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Calendar for current month */}
        <div>
          <p className="text-sm font-semibold mb-2">
            {today.toLocaleString("en-IN", { month: "long", year: "numeric" })}
          </p>
          <AttendanceCalendar
            year={today.getFullYear()}
            month={today.getMonth()}
            records={records}
          />
        </div>

        {/* Full attendance history */}
        {records.length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-2">Full Attendance Log</p>
            <div
              className="max-h-48 overflow-y-auto space-y-1"
              data-ocid="player.attendance_log"
            >
              {[...records]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((r, i) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: positional index for display list
                    key={i}
                    className="flex items-center justify-between text-xs py-1 border-b last:border-0"
                    data-ocid={`player.attendance_log.item.${i + 1}`}
                  >
                    <span className="text-muted-foreground">{r.date}</span>
                    <Badge
                      variant={
                        r.status === AttendanceStatus.Present
                          ? "default"
                          : "destructive"
                      }
                      className="text-xs px-2 py-0"
                    >
                      {r.status === AttendanceStatus.Present
                        ? "Present"
                        : "Absent"}
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Fee History Section ───────────────────────────────────────────────────────
function FeeHistorySection({ payments }: { payments: MonthlyFeePayment[] }) {
  const sorted = [...payments].sort((a, b) =>
    b.paymentDate.localeCompare(a.paymentDate),
  );
  const totalPaid = sorted.reduce((sum, p) => sum + p.amount, 0);

  return (
    <Card data-ocid="player.fee_history_card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            Fee History
          </CardTitle>
          <span className="text-sm font-bold text-primary">
            ₹{totalPaid.toLocaleString("en-IN")} total
          </span>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-3">
        {sorted.length === 0 ? (
          <p
            className="text-sm text-muted-foreground text-center py-4"
            data-ocid="player.fee_history.empty_state"
          >
            No fee payments recorded yet.
          </p>
        ) : (
          <div data-ocid="player.fee_history_list">
            {sorted.map((p, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: positional index for display list
              <FeePaymentRow key={i} payment={p} index={i + 1} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PlayerProfilePage() {
  const { id } = useParams({ from: "/player/$id" });
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const { actor, isFetching } = useActor(createActor);

  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      if (!actor) return null;
      return getStudent(actor, Number(id));
    },
    enabled: !!actor && !isFetching,
  });

  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ["student-attendance", id],
    queryFn: async () => {
      if (!actor) return [];
      return getStudentAttendance(actor, Number(id));
    },
    enabled: !!actor && !isFetching,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["student-payments", id],
    queryFn: async () => {
      if (!actor) return [];
      return getMonthlyFeePayments(actor, Number(id));
    },
    enabled: !!actor && !isFetching,
  });

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (studentLoading || isFetching) {
    return (
      <div
        className="min-h-screen bg-background"
        data-ocid="player.loading_state"
      >
        <header className="bg-card border-b shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <Skeleton className="h-10 w-48" />
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!student) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center"
        data-ocid="player.error_state"
      >
        <div className="text-center space-y-4">
          <AcademyBranding size="md" />
          <p className="text-muted-foreground">Player profile not found.</p>
          <Button
            type="button"
            onClick={handleLogout}
            data-ocid="player.back_button"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b shadow-sm sticky top-0 z-40 print:hidden">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="p-1.5 rounded-lg hover:bg-muted transition-smooth"
            aria-label="Back"
            data-ocid="player.back_button"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <AcademyBranding size="sm" showTagline={false} />
          <div className="ml-auto">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
              data-ocid="player.logout_button"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 space-y-4">
        {/* Academy branding hero */}
        <div className="text-center pt-2 pb-1">
          <AcademyBranding size="md" className="justify-center" />
          <p className="text-xs text-muted-foreground mt-1">Player Profile</p>
        </div>

        {/* Student profile card */}
        <StudentProfileCard student={student} />

        {/* Attendance */}
        <AttendanceSection records={attendanceRecords} />

        {/* Fee history */}
        <FeeHistorySection payments={payments} />

        {/* Academy footer banner */}
        <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-center text-xs">
          Thank you for choosing Royals Cricket Academy! |
          royals.academy/jalandhar
        </div>

        {/* Logout button at bottom */}
        <Button
          type="button"
          variant="outline"
          className="w-full border-primary/30 text-primary hover:bg-primary/5 print:hidden"
          onClick={handleLogout}
          data-ocid="player.logout_bottom_button"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </main>

      {/* Footer */}
      <footer className="bg-muted/40 border-t py-3 text-center text-xs text-muted-foreground print:hidden">
        &copy; {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
