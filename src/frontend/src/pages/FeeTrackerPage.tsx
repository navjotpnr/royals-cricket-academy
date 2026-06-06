import { createActor } from "@/backend";
import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getFeeStatusForMonth } from "@/services/backend-service";
import { useAuthStore } from "@/store/auth-store";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function FeeTrackerPage() {
  const { actor, isFetching } = useActor(createActor);
  const locationId = useAuthStore((s) => s.locationId) ?? "";
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(defaultMonth);

  const { data: feeStatus, isLoading } = useQuery({
    queryKey: ["fee-status", locationId, month],
    queryFn: async () => {
      if (!actor) return [];
      return getFeeStatusForMonth(actor, locationId, month.replace("-", ""));
    },
    enabled: !!actor && !isFetching,
  });

  const paid = (feeStatus ?? []).filter((e) => e.payment);
  const unpaid = (feeStatus ?? []).filter((e) => !e.payment);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display">Fee Tracker</h1>
            <p className="text-muted-foreground text-sm">
              Monthly fee payment status
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Month:</Label>
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-40"
              data-ocid="fee_tracker.month_input"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-primary">
                Paid — {paid.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-destructive/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-destructive">
                Unpaid — {unpaid.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">
              All Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2" data-ocid="fee_tracker.list">
                {(feeStatus ?? []).map((entry, i) => (
                  <div
                    key={entry.student.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                    data-ocid={`fee_tracker.item.${i + 1}`}
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {entry.student.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.student.receiptNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.payment && (
                        <span className="text-xs text-muted-foreground">
                          ₹{entry.payment.amount.toLocaleString("en-IN")}
                        </span>
                      )}
                      <Badge
                        variant={entry.payment ? "default" : "destructive"}
                        className={
                          entry.payment
                            ? "bg-primary text-primary-foreground"
                            : ""
                        }
                      >
                        {entry.payment ? "Paid" : "Unpaid"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {(feeStatus ?? []).length === 0 && (
                  <p
                    className="text-center text-muted-foreground py-6 text-sm"
                    data-ocid="fee_tracker.empty_state"
                  >
                    No data for this month.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
