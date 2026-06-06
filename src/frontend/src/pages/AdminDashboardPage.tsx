import { createActor } from "@/backend";
import { AcademyBranding } from "@/components/AcademyBranding";
import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllStudents, getDashboardStats } from "@/services/backend-service";
import { useAuthStore } from "@/store/auth-store";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  CalendarCheck,
  ChevronRight,
  CreditCard,
  FileText,
  IndianRupee,
  UserPlus,
  Users,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { actor, isFetching } = useActor(createActor);
  const locationId = useAuthStore((s) => s.locationId) ?? "";

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats", locationId],
    queryFn: async () => {
      if (!actor) return null;
      return getDashboardStats(actor, locationId);
    },
    enabled: !!actor && !isFetching,
  });

  const { data: students } = useQuery({
    queryKey: ["all-students", locationId],
    queryFn: async () => {
      if (!actor) return [];
      return getAllStudents(actor, locationId);
    },
    enabled: !!actor && !isFetching,
  });

  const statCards = [
    {
      label: "Total Students",
      value: stats?.totalStudents,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/8",
    },
    {
      label: "Fees Collected",
      value: stats
        ? `₹${stats.totalFeesCollected.toLocaleString("en-IN")}`
        : undefined,
      icon: IndianRupee,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
    },
    {
      label: "Fee Overdue",
      value: stats?.feeOverdueCount,
      icon: AlertCircle,
      color: "text-destructive",
      bg: "bg-destructive/8",
    },
    {
      label: "Receipts Issued",
      value: stats?.receiptsIssued,
      icon: FileText,
      color: "text-accent",
      bg: "bg-accent/8",
    },
  ];

  const quickActions = [
    {
      label: "Register Student",
      path: "/admin/register",
      icon: UserPlus,
      desc: "Add new academy member",
    },
    {
      label: "Mark Attendance",
      path: "/admin/attendance",
      icon: CalendarCheck,
      desc: "Record today's attendance",
    },
    {
      label: "Collect Fees",
      path: "/admin/monthly-fees",
      icon: CreditCard,
      desc: "Monthly fee collection",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Welcome header */}
        <div className="rounded-xl border bg-card px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <AcademyBranding size="md" showTagline />
          <div className="sm:ml-auto text-right hidden sm:block">
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="text-sm font-semibold text-foreground">
              Management Console
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Card
              key={card.label}
              data-ocid={`dashboard.stat.${card.label.toLowerCase().replace(/ /g, "_")}`}
              className="overflow-hidden"
            >
              <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {card.label}
                </CardTitle>
                <div className={`p-1.5 rounded-lg ${card.bg}`}>
                  <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {statsLoading || !stats ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <p
                    className={`text-2xl font-bold font-display ${card.color}`}
                  >
                    {card.value}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.path}
                to={action.path}
                className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3.5 hover:border-primary/40 hover:bg-primary/5 transition-smooth group"
                data-ocid={`dashboard.quick_action.${action.label.toLowerCase().replace(/ /g, "_")}_button`}
              >
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                  <action.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {action.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent students */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="font-display text-base">
              Recent Registrations
            </CardTitle>
            <Link
              to="/admin/history"
              className="text-xs text-primary hover:underline"
              data-ocid="dashboard.view_all_link"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {!students || students.length === 0 ? (
              <div
                className="text-center py-8 text-muted-foreground"
                data-ocid="dashboard.students.empty_state"
              >
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No students registered yet.</p>
                <Link to="/admin/register">
                  <Button
                    size="sm"
                    className="mt-3"
                    data-ocid="dashboard.empty.register_button"
                  >
                    Register First Student
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-0 divide-y">
                {students.slice(0, 6).map((student, i) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                    // biome-ignore lint/suspicious/noArrayIndexKey: positional display
                    data-ocid={`dashboard.student.item.${i + 1}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {student.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {student.receiptNumber} · {student.ageCategory}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="ml-2 flex-shrink-0 text-xs"
                    >
                      ₹{student.monthlyFees.toLocaleString("en-IN")}/mo
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
