import { createActor } from "@/backend";
import { AdminLayout } from "@/components/AdminLayout";
import { printPlayerIdCard } from "@/components/PlayerIdCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  deleteStudent,
  getAllMonthlyFeePayments,
  getAllStudents,
} from "@/services/backend-service";
import { useAuthStore } from "@/store/auth-store";
import type { MonthlyFeePayment, Student } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Printer, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

// ── Print helpers ──────────────────────────────────────────────────────────────
function printRegistrationReceipt(student: Student) {
  const date = new Date(student.registrationDate / 1_000_000);
  const dateStr = date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const ageCategoryLabel: Record<string, string> = {
    Under12: "Under-12",
    Under14: "Under-14",
    Under16: "Under-16",
    Under19: "Under-19",
    Senior: "Senior",
  };
  const html = `
    <html><head><title>Registration Receipt - ${student.receiptNumber}</title>
    <style>
      body { font-family: sans-serif; padding: 32px; color: #1a1a1a; max-width: 600px; margin: 0 auto; }
      .header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #7b1c1c; padding-bottom: 16px; margin-bottom: 16px; }
      .academy-name { font-size: 20px; font-weight: 800; color: #7b1c1c; }
      .academy-sub { font-size: 13px; color: #666; }
      .receipt-id { text-align: center; font-size: 14px; margin-bottom: 16px; }
      .receipt-id strong { font-size: 17px; }
      .section-title { font-weight: 700; font-size: 16px; margin: 0 0 10px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; font-size: 14px; }
      .label { color: #555; }
      .value { font-weight: 600; }
      .divider { border: none; border-top: 1px solid #e0d6d6; margin: 14px 0; }
      .fee-row { display: flex; justify-content: space-between; font-size: 14px; padding: 4px 0; }
      .total-row { display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; color: #7b1c1c; padding: 8px 0 0; }
      .footer { background: #7b1c1c; color: white; text-align: center; padding: 10px; font-size: 12px; margin-top: 24px; border-radius: 6px; }
      @media print { body { padding: 16px; } }
    </style></head><body>
    <div class="header">
      <svg width="56" height="56" viewBox="0 0 88 88" fill="none">
        <path d="M44 4L8 18V48C8 66 24 80 44 84C64 80 80 66 80 48V18L44 4Z" fill="#7b1c1c"/>
        <path d="M44 12L16 24V48C16 62 28 73 44 76C60 73 72 62 72 48V24L44 12Z" fill="#5c1414"/>
        <path d="M44 28L46.2 34.4H53L47.4 38.4L49.6 44.8L44 40.8L38.4 44.8L40.6 38.4L35 34.4H41.8L44 28Z" fill="#f0d9a0"/>
        <text x="44" y="70" text-anchor="middle" fill="white" font-size="7" font-weight="800" font-family="sans-serif" letter-spacing="1">RCA</text>
      </svg>
      <div>
        <div class="academy-name">Royals Cricket Academy, Jalandhar</div>
        <div class="academy-sub">Phone: 76963-72777</div>
      </div>
    </div>
    <div class="receipt-id">
      Registration Receipt<br/>
      <strong>Receipt ID: ${student.receiptNumber}</strong><br/>
      <span style="font-size:13px;color:#555;">Date: ${dateStr}</span>
    </div>
    <hr class="divider">
    <p class="section-title">Student Details</p>
    <div class="grid">
      <span class="label">Student Name:</span><span class="value">${student.name}</span>
      <span class="label">Parent/Guardian:</span><span class="value">${student.guardianName}</span>
      <span class="label">WhatsApp:</span><span class="value">${student.whatsappNumber}</span>
      <span class="label">Age Group:</span><span class="value">${ageCategoryLabel[student.ageCategory] ?? student.ageCategory} Elite</span>
      <span class="label">Batch:</span><span class="value">${student.batchTiming}</span>
      <span class="label">Payment Mode:</span><span class="value">${student.paymentMode === "OnlineUPI" ? "Online (UPI)" : student.paymentMode}</span>
    </div>
    <hr class="divider">
    <p class="section-title">Fee Details</p>
    <div class="fee-row"><span>Registration Fees</span><span>&#8377;${student.registrationFees.toLocaleString("en-IN")}</span></div>
    <div class="fee-row"><span>Monthly Fees</span><span>&#8377;${student.monthlyFees.toLocaleString("en-IN")}/month</span></div>
    <hr class="divider">
    <div class="total-row"><span>TOTAL PAID AT REGISTRATION</span><span>&#8377;${student.totalPaid.toLocaleString("en-IN")}</span></div>
    <div class="footer">Thank you for choosing Royals Cricket Academy! | royals.academy/jalandhar</div>
    </body></html>
  `;
  const win = window.open("", "_blank", "width=700,height=900");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

function printFeeReceipt(
  payment: MonthlyFeePayment,
  student: Student | undefined,
) {
  const html = `
    <html><head><title>Fee Receipt - ${payment.receiptNumber}</title>
    <style>
      body { font-family: sans-serif; padding: 32px; color: #1a1a1a; max-width: 600px; margin: 0 auto; }
      .header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #7b1c1c; padding-bottom: 16px; margin-bottom: 16px; }
      .academy-name { font-size: 20px; font-weight: 800; color: #7b1c1c; }
      .academy-sub { font-size: 13px; color: #666; }
      .receipt-id { text-align: center; font-size: 14px; margin-bottom: 16px; }
      .receipt-id strong { font-size: 17px; }
      .section-title { font-weight: 700; font-size: 16px; margin: 0 0 10px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; font-size: 14px; }
      .label { color: #555; }
      .value { font-weight: 600; }
      .divider { border: none; border-top: 1px solid #e0d6d6; margin: 14px 0; }
      .fee-row { display: flex; justify-content: space-between; font-size: 14px; padding: 4px 0; }
      .total-row { display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; color: #7b1c1c; padding: 8px 0 0; }
      .paid-badge { display: inline-block; background: #166534; color: white; padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: 700; margin-top: 4px; }
      .footer { background: #7b1c1c; color: white; text-align: center; padding: 10px; font-size: 12px; margin-top: 24px; border-radius: 6px; }
      @media print { body { padding: 16px; } }
    </style></head><body>
    <div class="header">
      <svg width="56" height="56" viewBox="0 0 88 88" fill="none">
        <path d="M44 4L8 18V48C8 66 24 80 44 84C64 80 80 66 80 48V18L44 4Z" fill="#7b1c1c"/>
        <path d="M44 12L16 24V48C16 62 28 73 44 76C60 73 72 62 72 48V24L44 12Z" fill="#5c1414"/>
        <path d="M44 28L46.2 34.4H53L47.4 38.4L49.6 44.8L44 40.8L38.4 44.8L40.6 38.4L35 34.4H41.8L44 28Z" fill="#f0d9a0"/>
        <text x="44" y="70" text-anchor="middle" fill="white" font-size="7" font-weight="800" font-family="sans-serif" letter-spacing="1">RCA</text>
      </svg>
      <div>
        <div class="academy-name">Royals Cricket Academy, Jalandhar</div>
        <div class="academy-sub">Phone: 76963-72777</div>
      </div>
    </div>
    <div class="receipt-id">
      Monthly Fee Receipt<br/>
      <strong>Receipt ID: ${payment.receiptNumber}</strong><br/>
      <span style="font-size:13px;color:#555;">Month: ${payment.month} | Date: ${payment.paymentDate}</span>
    </div>
    <hr class="divider">
    <p class="section-title">Student Details</p>
    <div class="grid">
      <span class="label">Student Name:</span><span class="value">${student?.name ?? "\u2014"}</span>
      <span class="label">Parent/Guardian:</span><span class="value">${student?.guardianName ?? "\u2014"}</span>
      <span class="label">Batch:</span><span class="value">${student?.batchTiming ?? "\u2014"}</span>
      <span class="label">Academy ID:</span><span class="value">${student?.receiptNumber ?? "\u2014"}</span>
    </div>
    <hr class="divider">
    <p class="section-title">Payment Details (${payment.month})</p>
    <div class="fee-row"><span>Monthly Coaching Fee</span><span>&#8377;${payment.amount.toLocaleString("en-IN")}</span></div>
    <hr class="divider">
    <div class="total-row"><span>TOTAL PAID</span><span>&#8377;${payment.amount.toLocaleString("en-IN")}</span></div>
    <div style="text-align:right;margin-top:6px;"><span class="paid-badge">PAID</span></div>
    <div style="text-align:right;font-size:12px;color:#555;margin-top:4px;">${payment.paymentMode === "OnlineUPI" ? "Online via UPI" : payment.paymentMode} &middot; ${payment.paymentDate}</div>
    <div class="footer">Thank you for choosing Royals Cricket Academy! | royals.academy/jalandhar</div>
    </body></html>
  `;
  const win = window.open("", "_blank", "width=700,height=900");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

// ── Skeleton loader ────────────────────────────────────────────────────────────
function RowSkeletons() {
  return (
    <div className="space-y-2 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

// ── Short age category labels ─────────────────────────────────────────────────
const ageCategoryShort: Record<string, string> = {
  Under12: "U-12",
  Under14: "U-14",
  Under16: "U-16",
  Under19: "U-19",
  Senior: "Senior",
};

// ── Registration row ──────────────────────────────────────────────────────────
interface RegRowProps {
  student: Student;
  index: number;
  onDeleted: () => void;
  locationId: string;
}
function RegistrationRow({
  student,
  index,
  onDeleted,
  locationId,
}: RegRowProps) {
  const { actor } = useActor(createActor);
  const [deletePin, setDeletePin] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const date = new Date(student.registrationDate / 1_000_000);
  const dateStr = date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const handleDelete = async () => {
    if (!actor) return;
    if (deletePin.length < 4) {
      toast.error("Please enter your 4-digit admin PIN");
      return;
    }
    setDeleting(true);
    try {
      const result = await deleteStudent(
        actor,
        locationId,
        deletePin,
        student.id,
      );
      if (result.ok) {
        toast.success(`${student.name} has been deleted.`);
        setOpen(false);
        onDeleted();
      } else {
        toast.error(result.err ?? "Delete failed. Check your PIN.");
      }
    } finally {
      setDeleting(false);
      setDeletePin("");
    }
  };

  return (
    <div
      className="flex items-center justify-between gap-3 py-3 px-4 border-b last:border-0 hover:bg-muted/30 transition-colors"
      data-ocid={`history.reg.item.${index}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm truncate">{student.name}</span>
          <Badge variant="outline" className="text-xs shrink-0">
            {ageCategoryShort[student.ageCategory] ?? student.ageCategory}
          </Badge>
          <Badge variant="secondary" className="text-xs shrink-0">
            {student.batchTiming}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-x-3 mt-0.5">
          <span className="text-xs text-muted-foreground font-mono">
            {student.receiptNumber}
          </span>
          <span className="text-xs text-muted-foreground">{dateStr}</span>
          <span className="text-xs text-muted-foreground">
            {student.guardianName}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <div className="text-right hidden lg:block mr-1">
          <p className="font-semibold text-sm">
            &#8377;{student.totalPaid.toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-muted-foreground">
            {student.paymentMode === "OnlineUPI" ? "UPI" : student.paymentMode}
          </p>
        </div>

        {/* ID Card */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2.5 border-blue-300/50 text-blue-600 hover:bg-blue-50 hover:border-blue-500 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950/40"
          onClick={() => printPlayerIdCard(student)}
          data-ocid={`history.reg.idcard_button.${index}`}
          title="Print ID Card"
        >
          <CreditCard className="h-3.5 w-3.5" />
          <span className="hidden sm:inline ml-1">ID Card</span>
        </Button>

        {/* Print receipt */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2.5 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary"
          onClick={() => printRegistrationReceipt(student)}
          data-ocid={`history.reg.print_button.${index}`}
          title="Print Receipt"
        >
          <Printer className="h-3.5 w-3.5" />
          <span className="hidden sm:inline ml-1">Print</span>
        </Button>

        {/* Delete */}
        <AlertDialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setDeletePin("");
          }}
        >
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive"
              data-ocid={`history.reg.delete_button.${index}`}
              title="Delete Player"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent data-ocid={`history.reg.delete_dialog.${index}`}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {student.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <strong>{student.name}</strong> and
                all their attendance and fee records. This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2 space-y-2">
              <Label
                htmlFor={`del-pin-${student.id}`}
                className="text-sm font-medium"
              >
                Enter Admin PIN to confirm
              </Label>
              <Input
                id={`del-pin-${student.id}`}
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="4-digit PIN"
                value={deletePin}
                onChange={(e) =>
                  setDeletePin(e.target.value.replace(/\D/g, ""))
                }
                onKeyDown={(e) => e.key === "Enter" && handleDelete()}
                className="font-mono w-36"
                data-ocid={`history.reg.delete_pin_input.${index}`}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel
                data-ocid={`history.reg.delete_cancel_button.${index}`}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                disabled={deleting || deletePin.length < 4}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-ocid={`history.reg.delete_confirm_button.${index}`}
              >
                {deleting ? "Deleting..." : "Delete Player"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ── Fee receipt row ──────────────────────────────────────────────────────────
interface FeeRowProps {
  payment: MonthlyFeePayment;
  student: Student | undefined;
  index: number;
}
function FeeReceiptRow({ payment, student, index }: FeeRowProps) {
  return (
    <div
      className="flex items-center justify-between gap-3 py-3 px-4 border-b last:border-0 hover:bg-muted/30 transition-colors"
      data-ocid={`history.fee.item.${index}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm truncate">
            {student?.name ?? "Unknown"}
          </span>
          <Badge variant="outline" className="text-xs shrink-0">
            {payment.month}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-x-3 mt-0.5">
          <span className="text-xs text-muted-foreground font-mono">
            {payment.receiptNumber}
          </span>
          <span className="text-xs text-muted-foreground">
            {payment.paymentDate}
          </span>
          <span className="text-xs text-muted-foreground">
            {payment.paymentMode === "OnlineUPI" ? "UPI" : payment.paymentMode}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-semibold text-sm hidden sm:block">
          &#8377;{payment.amount.toLocaleString("en-IN")}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-3 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary"
          onClick={() => printFeeReceipt(payment, student)}
          data-ocid={`history.fee.print_button.${index}`}
        >
          <Printer className="h-3.5 w-3.5 mr-1" />
          Print
        </Button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  const locationId = useAuthStore((s) => s.locationId) ?? "";
  const [regSearch, setRegSearch] = useState("");
  const [feeSearch, setFeeSearch] = useState("");
  const regSearchRef = useRef<HTMLInputElement>(null);
  const feeSearchRef = useRef<HTMLInputElement>(null);

  const handleStudentDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ["all-students", locationId] });
    queryClient.invalidateQueries({
      queryKey: ["dashboard-stats", locationId],
    });
    queryClient.invalidateQueries({ queryKey: ["fee-status", locationId] });
  };

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["all-students", locationId],
    queryFn: async () => {
      if (!actor) return [];
      return getAllStudents(actor, locationId);
    },
    enabled: !!actor && !isFetching,
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["all-payments", locationId],
    queryFn: async () => {
      if (!actor) return [];
      return getAllMonthlyFeePayments(actor, locationId);
    },
    enabled: !!actor && !isFetching,
  });

  const studentMap = Object.fromEntries((students ?? []).map((s) => [s.id, s]));

  const filteredRegs = (students ?? [])
    .filter(
      (s) =>
        !regSearch ||
        s.name.toLowerCase().includes(regSearch.toLowerCase()) ||
        s.receiptNumber.toLowerCase().includes(regSearch.toLowerCase()),
    )
    .sort((a, b) => b.registrationDate - a.registrationDate);

  const filteredFees = (payments ?? [])
    .filter((p) => {
      const student = studentMap[p.studentId];
      return (
        !feeSearch ||
        student?.name.toLowerCase().includes(feeSearch.toLowerCase()) ||
        p.receiptNumber.toLowerCase().includes(feeSearch.toLowerCase())
      );
    })
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold font-display">History</h1>
          <p className="text-muted-foreground text-sm">
            Complete records of registrations and fee payments
          </p>
        </div>

        <Tabs defaultValue="registrations" data-ocid="history.tabs">
          <TabsList className="mb-4 w-full sm:w-auto">
            <TabsTrigger
              value="registrations"
              className="flex-1 sm:flex-none"
              data-ocid="history.registrations_tab"
            >
              Registrations
              {students && (
                <span className="ml-2 text-xs bg-primary/15 text-primary rounded-full px-1.5 py-0.5 font-mono">
                  {filteredRegs.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="fees"
              className="flex-1 sm:flex-none"
              data-ocid="history.fee_receipts_tab"
            >
              Fee Receipts
              {payments && (
                <span className="ml-2 text-xs bg-primary/15 text-primary rounded-full px-1.5 py-0.5 font-mono">
                  {filteredFees.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Registrations Tab */}
          <TabsContent value="registrations" className="mt-0">
            <Card>
              <div className="px-4 pt-4 pb-3 border-b bg-muted/30 flex items-center justify-between gap-3 flex-wrap rounded-t-xl">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    Student Registrations
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Sorted by latest first
                  </span>
                </div>
                <Input
                  ref={regSearchRef}
                  placeholder="Search by name or receipt..."
                  value={regSearch}
                  onChange={(e) => setRegSearch(e.target.value)}
                  className="w-full sm:w-64 h-8 text-sm"
                  data-ocid="history.reg.search_input"
                />
              </div>
              <CardContent className="p-0">
                {studentsLoading ? (
                  <RowSkeletons />
                ) : filteredRegs.length === 0 ? (
                  <p
                    className="text-center text-muted-foreground py-12 text-sm"
                    data-ocid="history.reg.empty_state"
                  >
                    {regSearch
                      ? "No students match your search."
                      : "No registrations found."}
                  </p>
                ) : (
                  <div data-ocid="history.reg.list">
                    <div className="hidden sm:grid grid-cols-[1fr_auto] gap-3 px-4 py-2 bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b">
                      <span>
                        Student &middot; Receipt &middot; Date &middot; Guardian
                      </span>
                      <span className="text-right pr-2">Actions</span>
                    </div>
                    {filteredRegs.map((student, i) => (
                      <RegistrationRow
                        key={student.id}
                        student={student}
                        index={i + 1}
                        onDeleted={handleStudentDeleted}
                        locationId={locationId}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fee Receipts Tab */}
          <TabsContent value="fees" className="mt-0">
            <Card>
              <div className="px-4 pt-4 pb-3 border-b bg-muted/30 flex items-center justify-between gap-3 flex-wrap rounded-t-xl">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    Monthly Fee Receipts
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Sorted by latest first
                  </span>
                </div>
                <Input
                  ref={feeSearchRef}
                  placeholder="Search by name or receipt..."
                  value={feeSearch}
                  onChange={(e) => setFeeSearch(e.target.value)}
                  className="w-full sm:w-64 h-8 text-sm"
                  data-ocid="history.fee.search_input"
                />
              </div>
              <CardContent className="p-0">
                {paymentsLoading ? (
                  <RowSkeletons />
                ) : filteredFees.length === 0 ? (
                  <p
                    className="text-center text-muted-foreground py-12 text-sm"
                    data-ocid="history.fee.empty_state"
                  >
                    {feeSearch
                      ? "No receipts match your search."
                      : "No fee receipts found."}
                  </p>
                ) : (
                  <div data-ocid="history.fee.list">
                    <div className="hidden sm:grid grid-cols-[1fr_auto] gap-3 px-4 py-2 bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b">
                      <span>
                        Student &middot; Receipt &middot; Date &middot; Mode
                      </span>
                      <span className="text-right pr-24">Amount</span>
                    </div>
                    {filteredFees.map((payment, i) => (
                      <FeeReceiptRow
                        key={payment.id}
                        payment={payment}
                        student={studentMap[payment.studentId]}
                        index={i + 1}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
