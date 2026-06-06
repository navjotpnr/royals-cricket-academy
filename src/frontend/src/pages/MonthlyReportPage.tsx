import { createActor } from "@/backend";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMonthlyReport } from "@/services/backend-service";
import { useAuthStore } from "@/store/auth-store";
import type { MonthlyReport } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getPaddedMonth(m: number) {
  return String(m + 1).padStart(2, "0");
}

export default function MonthlyReportPage() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-indexed
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);

  const { actor, isFetching } = useActor(createActor);
  const locationId = useAuthStore((s) => s.locationId) ?? "";

  const monthKey = `${selectedYear}${getPaddedMonth(selectedMonth)}`;
  const monthLabel = `${MONTHS[selectedMonth]} ${selectedYear}`;

  const fetchReport = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const data = await getMonthlyReport(actor, locationId, monthKey);
      setReport(data);
    } catch {
      toast.error("Failed to load monthly report");
    } finally {
      setLoading(false);
    }
  }, [actor, locationId, monthKey]);

  useEffect(() => {
    if (!isFetching && actor) {
      fetchReport();
    }
  }, [fetchReport, isFetching, actor]);

  const handlePrint = () => window.print();

  const yearOptions = Array.from(
    { length: 5 },
    (_, i) => now.getFullYear() - 2 + i,
  );

  return (
    <AdminLayout>
      {/* Print styles injected via a style tag */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #monthly-report-printable { display: block !important; }
          #monthly-report-printable { position: fixed; inset: 0; padding: 32px; background: white; color: black; font-family: sans-serif; }
          .no-print { display: none !important; }
        }
        @media screen {
          #monthly-report-printable { display: block; }
        }
      `}</style>

      <div data-ocid="monthly_report.page">
        {/* Controls */}
        <div className="no-print flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Monthly Report
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Fees summary & attendance for {monthLabel}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Month selector */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              data-ocid="monthly_report.month_select"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>

            {/* Year selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              data-ocid="monthly_report.year_select"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <Button
              type="button"
              onClick={handlePrint}
              disabled={loading || !report}
              data-ocid="monthly_report.print_button"
              className="gap-2"
            >
              🖨️ Print Report
            </Button>
          </div>
        </div>

        {/* Printable content */}
        <div id="monthly-report-printable">
          {/* Print header (only visible when printing) */}
          <div className="hidden print:block mb-6">
            <h2 className="text-xl font-bold text-center">
              Royals Cricket Academy
            </h2>
            <p className="text-center text-sm mt-1">
              Monthly Report — {monthLabel}
            </p>
            <hr className="my-3" />
          </div>

          {/* Summary cards */}
          {loading || isFetching ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
              data-ocid="monthly_report.loading_state"
            >
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
          ) : report ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <Card className="border-l-4 border-l-primary bg-card">
                  <CardContent className="p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                      Fees Collected
                    </p>
                    <p
                      className="text-3xl font-display font-bold text-primary"
                      data-ocid="monthly_report.fees_collected"
                    >
                      ₹{report.totalCollected.toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {monthLabel}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-destructive bg-card">
                  <CardContent className="p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                      Fees Pending
                    </p>
                    <p
                      className="text-3xl font-display font-bold text-destructive"
                      data-ocid="monthly_report.fees_pending"
                    >
                      ₹{report.totalPending.toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {monthLabel}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Attendance table */}
              <div className="bg-card border rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b bg-muted/30">
                  <h2 className="font-semibold text-sm text-foreground">
                    Student Attendance — {monthLabel}
                  </h2>
                </div>

                {report.studentAttendanceSummary.length === 0 ? (
                  <div
                    className="py-12 text-center"
                    data-ocid="monthly_report.empty_state"
                  >
                    <p className="text-muted-foreground text-sm">
                      No attendance data for this month
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/20">
                        <TableHead className="w-12 text-center">#</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead className="text-center">
                          Days Present
                        </TableHead>
                        <TableHead className="text-center">
                          Total Days
                        </TableHead>
                        <TableHead className="text-center">
                          Attendance %
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.studentAttendanceSummary.map((entry, idx) => (
                        <TableRow
                          key={entry.studentId}
                          data-ocid={`monthly_report.attendance.item.${idx + 1}`}
                        >
                          <TableCell className="text-center text-muted-foreground text-xs">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {entry.studentName}
                          </TableCell>
                          <TableCell className="text-center">
                            {entry.presentDays}
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">
                            {entry.totalDays}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                                entry.percentage >= 75
                                  ? "bg-green-100 text-green-700"
                                  : entry.percentage >= 50
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {entry.percentage}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Print footer */}
              <div className="hidden print:block mt-6 pt-4 border-t text-xs text-center text-muted-foreground">
                Printed on {new Date().toLocaleDateString("en-IN")} · Royals
                Cricket Academy
              </div>
            </>
          ) : (
            <div
              className="py-16 text-center"
              data-ocid="monthly_report.error_state"
            >
              <p className="text-muted-foreground">
                Could not load report. Please try again.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
