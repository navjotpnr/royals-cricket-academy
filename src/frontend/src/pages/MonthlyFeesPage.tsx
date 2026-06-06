import { createActor } from "@/backend";
import { AdminLayout } from "@/components/AdminLayout";
import { FeeReceiptSlip } from "@/components/FeeReceiptSlip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PaymentMode,
  collectMonthlyFee,
  getFeeStatusForMonth,
} from "@/services/backend-service";
import { useAuthStore } from "@/store/auth-store";
import type { FeeStatusEntry, MonthlyFeePayment, Student } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, IndianRupee, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function currentMonthYYYYMM(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function currentMonthInput(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function MonthlyFeesPage() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  const locationId = useAuthStore((s) => s.locationId) ?? "";

  const [search, setSearch] = useState("");
  const [collectFor, setCollectFor] = useState<Student | null>(null);
  const [collectAmount, setCollectAmount] = useState("");
  const [collectMode, setCollectMode] = useState<PaymentMode>(PaymentMode.Cash);
  const [collectDate, setCollectDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [loading, setLoading] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    student: Student;
    payment: MonthlyFeePayment;
  } | null>(null);

  const monthKey = currentMonthYYYYMM();

  const { data: feeStatus, isLoading } = useQuery<FeeStatusEntry[]>({
    queryKey: ["fee-status", locationId, monthKey],
    queryFn: async () => {
      if (!actor) return [];
      return getFeeStatusForMonth(actor, locationId, monthKey);
    },
    enabled: !!actor && !isFetching,
  });

  const filtered = useMemo(() => {
    const entries = feeStatus ?? [];
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter((e) => e.student.name.toLowerCase().includes(q));
  }, [feeStatus, search]);

  const paidCount = useMemo(
    () => (feeStatus ?? []).filter((e) => !!e.payment).length,
    [feeStatus],
  );
  const unpaidCount = useMemo(
    () => (feeStatus ?? []).filter((e) => !e.payment).length,
    [feeStatus],
  );

  const openCollect = (student: Student) => {
    setCollectFor(student);
    setCollectAmount(String(student.monthlyFees));
    setCollectMode(PaymentMode.Cash);
    setCollectDate(new Date().toISOString().split("T")[0]);
  };

  const handleCollect = async () => {
    if (!actor || !collectFor) return;
    setLoading(true);
    try {
      const receiptNumber = await collectMonthlyFee(
        actor,
        collectFor.id,
        monthKey,
        Number(collectAmount),
        collectMode,
        collectDate,
      );
      toast.success(`Fee collected! Receipt: ${receiptNumber}`);
      // Invalidate all fee and dashboard queries then force immediate refetch
      await queryClient.invalidateQueries({
        queryKey: ["fee-status", locationId],
        refetchType: "all",
      });
      await queryClient.invalidateQueries({
        queryKey: ["dashboard-stats", locationId],
        refetchType: "all",
      });
      await queryClient.invalidateQueries({
        queryKey: ["all-payments", locationId],
        refetchType: "all",
      });
      await queryClient.refetchQueries({
        queryKey: ["fee-status", locationId, monthKey],
      });
      const payment: MonthlyFeePayment = {
        id: 0,
        studentId: collectFor.id,
        month: monthKey,
        amount: Number(collectAmount),
        paymentMode: collectMode,
        paymentDate: collectDate,
        receiptNumber,
      };
      setReceiptData({ student: collectFor, payment });
      setCollectFor(null);
    } catch {
      toast.error("Failed to collect fee.");
    } finally {
      setLoading(false);
    }
  };

  const displayMonth = new Date().toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <AdminLayout>
      <div className="space-y-5" data-ocid="monthly_fees.page">
        <div>
          <h1 className="text-xl font-bold text-foreground font-display">
            Monthly Fees
          </h1>
          <p className="text-sm text-muted-foreground">
            Collect fees for {displayMonth}
          </p>
        </div>

        {/* Summary bar */}
        {!isLoading && (
          <div className="bg-card border border-border rounded-xl p-4 flex gap-4 items-center">
            <div className="flex items-center gap-2 text-sm">
              <IndianRupee className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">
                {displayMonth}
              </span>
            </div>
            <div className="ml-auto flex gap-3">
              <div
                className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-semibold"
                data-ocid="monthly_fees.paid_count"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {paidCount} Paid
              </div>
              <div
                className="flex items-center gap-1.5 bg-destructive/10 text-destructive rounded-full px-3 py-1 text-sm font-semibold"
                data-ocid="monthly_fees.unpaid_count"
              >
                <IndianRupee className="h-3.5 w-3.5" />
                {unpaidCount} Pending
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search student by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-ocid="monthly_fees.search_input"
          />
        </div>

        {/* Student fee list */}
        {isLoading ? (
          <div className="space-y-3" data-ocid="monthly_fees.loading_state">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 text-center"
            data-ocid="monthly_fees.empty_state"
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
            {filtered.map((entry, idx) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: stable ordered list
                key={idx}
                className="bg-card border border-border rounded-xl p-3 flex items-center gap-3"
                data-ocid={`monthly_fees.item.${idx + 1}`}
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {entry.student.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">
                    {entry.student.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.student.receiptNumber}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold text-foreground">
                    ₹{entry.student.monthlyFees.toLocaleString("en-IN")}
                  </span>
                  {entry.payment ? (
                    <Badge
                      variant="default"
                      className="bg-primary/10 text-primary border-0"
                      data-ocid={`monthly_fees.paid_badge.${idx + 1}`}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Paid
                    </Badge>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => openCollect(entry.student)}
                      className="h-8 text-xs"
                      data-ocid={`monthly_fees.collect_button.${idx + 1}`}
                    >
                      Collect Fee
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collect fee dialog */}
      <Dialog
        open={!!collectFor}
        onOpenChange={(open) => {
          if (!open) setCollectFor(null);
        }}
      >
        <DialogContent
          className="max-w-sm"
          data-ocid="monthly_fees.collect_dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-base">
              Collect Fee — {collectFor?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <Label>Month</Label>
                <Input
                  type="text"
                  value={currentMonthInput()}
                  readOnly
                  className="bg-muted/40"
                  data-ocid="monthly_fees.month_input"
                />
              </div>
              <div className="space-y-1">
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  data-ocid="monthly_fees.amount_input"
                />
              </div>
              <div className="space-y-1">
                <Label>Payment Date</Label>
                <Input
                  type="date"
                  value={collectDate}
                  onChange={(e) => setCollectDate(e.target.value)}
                  data-ocid="monthly_fees.payment_date_input"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Payment Mode</Label>
                <Select
                  value={collectMode}
                  onValueChange={(v) => setCollectMode(v as PaymentMode)}
                >
                  <SelectTrigger data-ocid="monthly_fees.payment_mode_select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(PaymentMode).map((p) => (
                      <SelectItem key={p} value={p}>
                        {p === "OnlineUPI" ? "Online (UPI)" : p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setCollectFor(null)}
                data-ocid="monthly_fees.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={handleCollect}
                disabled={loading}
                data-ocid="monthly_fees.submit_button"
              >
                {loading ? "Processing..." : "Collect Fee"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fee receipt dialog */}
      {receiptData && (
        <Dialog
          open={!!receiptData}
          onOpenChange={(open) => {
            if (!open) setReceiptData(null);
          }}
        >
          <DialogContent
            className="max-w-sm"
            data-ocid="monthly_fees.receipt_dialog"
          >
            <DialogHeader>
              <DialogTitle className="font-display text-base">
                Fee Receipt
              </DialogTitle>
            </DialogHeader>
            <FeeReceiptSlip
              student={receiptData.student}
              payment={receiptData.payment}
              onClose={() => setReceiptData(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
}
