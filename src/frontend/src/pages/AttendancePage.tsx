import { createActor } from "@/backend";
import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AttendanceStatus,
  getAllStudents,
  getAttendanceByDate,
  getStudentAttendance,
  markAttendance,
} from "@/services/backend-service";
import { useAuthStore } from "@/store/auth-store";
import type { Attendance, Student } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  Users,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function todayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toBackendDate(isoDate: string): string {
  return isoDate.replace(/-/g, "");
}

function formatDisplayDate(backendDate: string): string {
  const y = backendDate.slice(0, 4);
  const m = backendDate.slice(4, 6);
  const d = backendDate.slice(6, 8);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${d} ${months[Number.parseInt(m, 10) - 1]} ${y}`;
}

function batchLabel(batch: string): string {
  const map: Record<string, string> = {
    morning6to8: "6–8 AM",
    morning8to10: "8–10 AM",
    evening4to6: "4–6 PM",
    evening6to8: "6–8 PM",
  };
  return map[batch] ?? batch;
}

interface StudentRowProps {
  student: Student;
  status: AttendanceStatus | null;
  onMark: (studentId: number, status: AttendanceStatus) => void;
  isMarking: boolean;
  index: number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function StudentRow({
  student,
  status,
  onMark,
  isMarking,
  index,
}: StudentRowProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const { actor, isFetching } = useActor(createActor);

  const historyQuery = useQuery<Attendance[]>({
    queryKey: ["studentAttendance", student.id],
    queryFn: async () => {
      if (!actor) return [];
      return getStudentAttendance(actor, student.id);
    },
    enabled: historyOpen && !!actor && !isFetching,
  });

  const statusLabel =
    status === null
      ? "Not Marked"
      : status === AttendanceStatus.Present
        ? "Present"
        : "Absent";

  const statusColor: "default" | "secondary" | "destructive" =
    status === null
      ? "secondary"
      : status === AttendanceStatus.Present
        ? "default"
        : "destructive";

  const isPresentActive =
    status !== null && status === AttendanceStatus.Present;
  const isAbsentActive = status !== null && status === AttendanceStatus.Absent;

  return (
    <div
      className="bg-card border border-border rounded-xl overflow-hidden"
      data-ocid={`attendance.item.${index}`}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-primary">
            {student.name.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="flex-1 min-w-0" style={{ minWidth: 0 }}>
          <p
            className="font-semibold text-foreground text-sm truncate"
            title={student.name}
          >
            {getInitials(student.name)}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {batchLabel(String(student.batchTiming))}
          </p>
        </div>

        <Badge variant={statusColor} className="text-xs shrink-0">
          {statusLabel}
        </Badge>

        <div className="flex gap-1 shrink-0">
          <Button
            type="button"
            size="sm"
            variant={isPresentActive ? "default" : "outline"}
            className={`h-8 px-2 text-xs ${
              isPresentActive
                ? "bg-primary text-primary-foreground"
                : "border-primary/40 text-primary hover:bg-primary/10"
            }`}
            onClick={() => onMark(student.id, AttendanceStatus.Present)}
            disabled={isMarking}
            data-ocid={`attendance.present_button.${index}`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />P
          </Button>
          <Button
            type="button"
            size="sm"
            variant={isAbsentActive ? "destructive" : "outline"}
            className={`h-8 px-2 text-xs ${
              isAbsentActive
                ? ""
                : "border-destructive/40 text-destructive hover:bg-destructive/10"
            }`}
            onClick={() => onMark(student.id, AttendanceStatus.Absent)}
            disabled={isMarking}
            data-ocid={`attendance.absent_button.${index}`}
          >
            <XCircle className="h-3.5 w-3.5 mr-1" />A
          </Button>
        </div>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-muted-foreground"
          onClick={() => setHistoryOpen((v) => !v)}
          aria-label={historyOpen ? "Hide history" : "Show history"}
          data-ocid={`attendance.history_toggle.${index}`}
        >
          {historyOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {historyOpen && (
        <div className="border-t border-border bg-muted/30 px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Attendance History
          </p>
          {historyQuery.isLoading ? (
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-full rounded" />
              <Skeleton className="h-6 w-full rounded" />
              <Skeleton className="h-6 w-3/4 rounded" />
            </div>
          ) : historyQuery.data && historyQuery.data.length > 0 ? (
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
              {[...historyQuery.data]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((record) => (
                  <div
                    key={record.id}
                    className={`flex items-center justify-between rounded-lg px-2 py-1 text-xs ${
                      record.status === AttendanceStatus.Present
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    <span>{formatDisplayDate(record.date)}</span>
                    <span className="font-bold">
                      {record.status === AttendanceStatus.Present ? "P" : "A"}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No attendance records yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(todayDateString);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { actor, isFetching } = useActor(createActor);
  const locationId = useAuthStore((s) => s.locationId) ?? "";

  const backendDate = toBackendDate(selectedDate);

  const studentsQuery = useQuery<Student[]>({
    queryKey: ["students", locationId],
    queryFn: async () => {
      if (!actor) return [];
      return getAllStudents(actor, locationId);
    },
    enabled: !!actor && !isFetching,
  });

  const attendanceQuery = useQuery<Attendance[]>({
    queryKey: ["attendanceByDate", locationId, backendDate],
    queryFn: async () => {
      if (!actor) return [];
      return getAttendanceByDate(actor, locationId, backendDate);
    },
    enabled: !!actor && !isFetching,
  });

  const markMutation = useMutation({
    mutationFn: async ({
      studentId,
      status,
    }: {
      studentId: number;
      status: AttendanceStatus;
    }) => {
      if (!actor) throw new Error("Not connected");
      return markAttendance(actor, studentId, backendDate, status);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["attendanceByDate", locationId, backendDate],
      });
      queryClient.invalidateQueries({
        queryKey: ["studentAttendance", variables.studentId],
      });
      toast.success("Attendance marked");
    },
    onError: () => toast.error("Failed to mark attendance"),
  });

  const attendanceMap = useMemo(() => {
    const map = new Map<number, AttendanceStatus>();
    for (const rec of attendanceQuery.data ?? []) {
      map.set(rec.studentId, rec.status);
    }
    return map;
  }, [attendanceQuery.data]);

  const filteredStudents = useMemo(() => {
    const all = studentsQuery.data ?? [];
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter((s) => s.name.toLowerCase().includes(q));
  }, [studentsQuery.data, search]);

  const presentCount = useMemo(() => {
    let count = 0;
    for (const rec of attendanceQuery.data ?? []) {
      if (rec.status === AttendanceStatus.Present) count++;
    }
    return count;
  }, [attendanceQuery.data]);

  const absentCount = useMemo(() => {
    let count = 0;
    for (const rec of attendanceQuery.data ?? []) {
      if (rec.status === AttendanceStatus.Absent) count++;
    }
    return count;
  }, [attendanceQuery.data]);

  const isLoading = studentsQuery.isLoading || attendanceQuery.isLoading;

  return (
    <AdminLayout>
      <div className="space-y-5" data-ocid="attendance.page">
        <div>
          <h1 className="text-xl font-bold text-foreground font-display">
            Attendance
          </h1>
          <p className="text-sm text-muted-foreground">
            Mark and track daily attendance
          </p>
        </div>

        {/* Date picker + summary */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex items-center gap-2 flex-1">
            <Calendar className="h-4 w-4 text-primary shrink-0" />
            <label
              htmlFor="attendance-date"
              className="text-sm font-medium text-foreground whitespace-nowrap"
            >
              Date
            </label>
            <input
              id="attendance-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 border border-input bg-background text-foreground text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
              data-ocid="attendance.date_input"
            />
          </div>
          {!isLoading && (
            <div className="flex gap-2">
              <div
                className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-semibold"
                data-ocid="attendance.present_count"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {presentCount} Present
              </div>
              <div
                className="flex items-center gap-1.5 bg-destructive/10 text-destructive rounded-full px-3 py-1 text-sm font-semibold"
                data-ocid="attendance.absent_count"
              >
                <XCircle className="h-3.5 w-3.5" />
                {absentCount} Absent
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search student by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-ocid="attendance.search_input"
          />
        </div>

        {/* Student list */}
        {isLoading ? (
          <div className="space-y-3" data-ocid="attendance.loading_state">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 text-center"
            data-ocid="attendance.empty_state"
          >
            <Users className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="font-semibold text-foreground">No students found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search
                ? "Try a different search term"
                : "No students registered yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredStudents.map((student, idx) => (
              <StudentRow
                key={student.id}
                student={student}
                status={attendanceMap.get(student.id) ?? null}
                onMark={(studentId, status) =>
                  markMutation.mutate({ studentId, status })
                }
                isMarking={markMutation.isPending}
                index={idx + 1}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
