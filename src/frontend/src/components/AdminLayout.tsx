import { createActor } from "@/backend";
import { AcademyBranding } from "@/components/AcademyBranding";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeAdminPin } from "@/services/backend-service";
import { useAuthStore } from "@/store/auth-store";
import { useActor } from "@caffeineai/core-infrastructure";
import { Link, useRouterState } from "@tanstack/react-router";
import { KeyRound, LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/admin" },
  { label: "Player Registration", path: "/admin/register" },
  { label: "Monthly Fees", path: "/admin/monthly-fees" },
  { label: "Fee Tracker", path: "/admin/fee-tracker" },
  { label: "Attendance", path: "/admin/attendance" },
  { label: "History", path: "/admin/history" },
  { label: "Monthly Report", path: "/admin/monthly-report" },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const logout = useAuthStore((s) => s.logout);
  const locationId = useAuthStore((s) => s.locationId) ?? "";
  const locationName = useAuthStore((s) => s.locationName);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  const { actor } = useActor(createActor);

  const handleChangePIN = async () => {
    if (!actor) return;
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      toast.error("PIN must be 4 digits");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("PINs do not match");
      return;
    }
    setPinLoading(true);
    try {
      const ok = await changeAdminPin(actor, locationId, oldPin, newPin);
      if (ok) {
        toast.success("PIN changed successfully");
        setPinDialogOpen(false);
        setOldPin("");
        setNewPin("");
        setConfirmPin("");
      } else {
        toast.error("Old PIN is incorrect");
      }
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex flex-col">
              <AcademyBranding size="sm" showTagline={false} />
              {locationName && (
                <span className="text-xs text-muted-foreground leading-tight mt-0.5 truncate max-w-[200px]">
                  {locationName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPinDialogOpen(true)}
                className="text-muted-foreground hover:text-foreground"
                data-ocid="admin.change_pin_button"
              >
                <KeyRound className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Change PIN</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-muted-foreground hover:text-foreground"
                data-ocid="admin.logout_button"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Logout</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="max-w-7xl mx-auto px-4 pb-0 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.path === "/admin"
                  ? currentPath === "/admin"
                  : currentPath.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                  data-ocid={`admin.nav.${item.label.toLowerCase().replace(/ /g, "_")}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-muted/40 border-t py-3 text-center text-xs text-muted-foreground">
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

      {/* Change PIN Dialog */}
      <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
        <DialogContent data-ocid="admin.change_pin.dialog">
          <DialogHeader>
            <DialogTitle>Change Admin PIN</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="old-pin">Current PIN</Label>
              <Input
                id="old-pin"
                type="password"
                maxLength={4}
                placeholder="Enter current PIN"
                value={oldPin}
                onChange={(e) =>
                  setOldPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                data-ocid="admin.change_pin.old_pin_input"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-pin">New PIN</Label>
              <Input
                id="new-pin"
                type="password"
                maxLength={4}
                placeholder="Enter new 4-digit PIN"
                value={newPin}
                onChange={(e) =>
                  setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                data-ocid="admin.change_pin.new_pin_input"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm-pin">Confirm New PIN</Label>
              <Input
                id="confirm-pin"
                type="password"
                maxLength={4}
                placeholder="Confirm new PIN"
                value={confirmPin}
                onChange={(e) =>
                  setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                data-ocid="admin.change_pin.confirm_pin_input"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPinDialogOpen(false)}
                data-ocid="admin.change_pin.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleChangePIN}
                disabled={pinLoading}
                data-ocid="admin.change_pin.submit_button"
              >
                {pinLoading ? "Saving..." : "Save PIN"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
