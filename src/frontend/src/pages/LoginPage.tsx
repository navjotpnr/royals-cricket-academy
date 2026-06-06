import { createActor } from "@/backend";
import { AcademyBranding } from "@/components/AcademyBranding";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getStudentByName, verifyAdminPin } from "@/services/backend-service";
import { useAuthStore } from "@/store/auth-store";
import type { Student } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Search, ShieldCheck, User } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const navigate = useNavigate();
  const loginAdmin = useAuthStore((s) => s.loginAdmin);
  const loginPlayer = useAuthStore((s) => s.loginPlayer);
  const { actor, isFetching } = useActor(createActor);

  // Shared location selection
  type LoginTab = "admin" | "player";
  const [activeTab, setActiveTab] = useState<LoginTab>("admin");

  // Admin flow steps: always start at "location" — reset when tab changes
  const [adminStep, setAdminStep] = useState<"location" | "pin">("location");
  const [adminLocationId, setAdminLocationId] = useState("");
  const [adminLocationName, setAdminLocationName] = useState("");

  // Player flow steps: always start at "location" — reset when tab changes
  const [playerStep, setPlayerStep] = useState<"location" | "search">(
    "location",
  );
  const [playerLocationId, setPlayerLocationId] = useState("");
  const [playerLocationName, setPlayerLocationName] = useState("");

  const switchTab = (tab: LoginTab) => {
    setActiveTab(tab);
    // Always reset both flows back to location selection when switching tabs
    setAdminStep("location");
    setAdminLocationId("");
    setAdminLocationName("");
    setPin(["", "", "", ""]);
    setPlayerStep("location");
    setPlayerLocationId("");
    setPlayerLocationName("");
    setSearchQuery("");
    setSearchResults([]);
    setSearched(false);
  };

  // Admin PIN
  const [pin, setPin] = useState(["", "", "", ""]);
  const [adminLoading, setAdminLoading] = useState(false);
  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Player search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const LOCATIONS = [
    {
      id: "location1",
      title: "RCA Lawrence International School",
      subtitle: "Surya Enclave, Jalandhar",
    },
    {
      id: "location2",
      title: "RCA Pyare Lal Stadium",
      subtitle: "Sain Dass School, Jalandhar",
    },
  ];

  const handleAdminLocationSelect = (locId: string, locName: string) => {
    setAdminLocationId(locId);
    setAdminLocationName(locName);
    setPin(["", "", "", ""]);
    setAdminStep("pin");
    setTimeout(() => pinRefs[0].current?.focus(), 100);
  };

  const handlePlayerLocationSelect = (locId: string, locName: string) => {
    setPlayerLocationId(locId);
    setPlayerLocationName(locName);
    setSearchQuery("");
    setSearchResults([]);
    setSearched(false);
    setPlayerStep("search");
  };

  const handlePinDigit = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...pin];
    next[idx] = val.slice(-1);
    setPin(next);
    if (val && idx < 3) {
      pinRefs[idx + 1].current?.focus();
    }
  };

  const handlePinKeyDown = (
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !pin[idx] && idx > 0) {
      pinRefs[idx - 1].current?.focus();
    }
  };

  const handleAdminLogin = async () => {
    if (!actor || isFetching) return;
    const fullPin = pin.join("");
    if (fullPin.length !== 4) {
      toast.error("Please enter all 4 digits");
      return;
    }
    setAdminLoading(true);
    try {
      const ok = await verifyAdminPin(actor, adminLocationId, fullPin);
      if (ok) {
        loginAdmin(adminLocationId, adminLocationName);
        navigate({ to: "/admin" });
      } else {
        toast.error("Incorrect PIN. Please try again.");
        setPin(["", "", "", ""]);
        pinRefs[0].current?.focus();
      }
    } finally {
      setAdminLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!actor || !searchQuery.trim()) return;
    setSearchLoading(true);
    setSearched(true);
    try {
      const results = await getStudentByName(
        actor,
        playerLocationId,
        searchQuery.trim(),
      );
      setSearchResults(results);
    } finally {
      setSearchLoading(false);
    }
  };

  const handlePlayerSelect = (student: Student) => {
    loginPlayer(student);
    navigate({ to: "/player/$id", params: { id: String(student.id) } });
  };

  const ageCategoryLabel: Record<string, string> = {
    Under12: "Under-12",
    Under14: "Under-14",
    Under16: "Under-16",
    Under19: "Under-19",
    Senior: "Senior",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <AcademyBranding size="md" showTagline />
        </div>
      </header>

      {/* Hero banner */}
      <div className="bg-primary text-primary-foreground py-5 px-4 text-center">
        <p className="text-sm font-medium opacity-90 font-body">
          Player Registration &amp; Fee Management System
        </p>
      </div>

      {/* Login tabs */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {/* Tab switcher */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => switchTab("admin")}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeTab === "admin"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
            data-ocid="login.admin_tab"
          >
            <ShieldCheck className="inline h-4 w-4 mr-1.5" />
            Admin Login
          </button>
          <button
            type="button"
            onClick={() => switchTab("player")}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeTab === "player"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
            data-ocid="login.player_tab"
          >
            <User className="inline h-4 w-4 mr-1.5" />
            Player Login
          </button>
        </div>

        {/* ── ADMIN PANEL ── */}
        {activeTab === "admin" && (
          <div className="max-w-lg mx-auto">
            {adminStep === "location" ? (
              <Card className="border-2" data-ocid="login.admin.location_step">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-primary font-display">
                    <ShieldCheck className="h-5 w-5" />
                    Select Academy Location
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Choose your branch to continue as admin.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {LOCATIONS.map((loc) => (
                    <button
                      type="button"
                      key={loc.id}
                      onClick={() =>
                        handleAdminLocationSelect(
                          loc.id,
                          `${loc.title}, ${loc.subtitle}`,
                        )
                      }
                      className="w-full text-left p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-smooth group"
                      data-ocid={`login.admin.location_card.${loc.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                            {loc.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {loc.subtitle}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card
                className="border-2 border-primary/40"
                data-ocid="login.admin.pin_step"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-primary font-display">
                      <ShieldCheck className="h-5 w-5" />
                      Admin PIN
                    </CardTitle>
                    <button
                      type="button"
                      onClick={() => setAdminStep("location")}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      data-ocid="login.admin.back_button"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <p className="text-xs text-muted-foreground truncate">
                      {adminLocationName}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center gap-3">
                    {pin.map((digit, idx) => (
                      <input
                        // biome-ignore lint/suspicious/noArrayIndexKey: PIN inputs are positionally fixed
                        key={`pin-${idx}`}
                        ref={pinRefs[idx]}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handlePinDigit(idx, e.target.value)}
                        onKeyDown={(e) => handlePinKeyDown(idx, e)}
                        className="w-12 h-12 text-center text-xl font-mono border-2 border-input rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-background transition-smooth"
                        data-ocid={`login.admin.pin_input_${idx + 1}`}
                      />
                    ))}
                  </div>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={handleAdminLogin}
                    disabled={adminLoading || isFetching}
                    data-ocid="login.admin.submit_button"
                  >
                    {adminLoading ? "Verifying..." : "Login as Admin"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── PLAYER PANEL ── */}
        {activeTab === "player" && (
          <div className="max-w-lg mx-auto">
            {playerStep === "location" ? (
              <Card className="border-2" data-ocid="login.player.location_step">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-primary font-display">
                    <User className="h-5 w-5" />
                    Select Academy Location
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Choose your branch to search for your profile.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {LOCATIONS.map((loc) => (
                    <button
                      type="button"
                      key={loc.id}
                      onClick={() =>
                        handlePlayerLocationSelect(
                          loc.id,
                          `${loc.title}, ${loc.subtitle}`,
                        )
                      }
                      className="w-full text-left p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-smooth group"
                      data-ocid={`login.player.location_card.${loc.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                            {loc.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {loc.subtitle}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card
                className="border-2 border-primary/40"
                data-ocid="login.player.search_step"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-primary font-display">
                      <User className="h-5 w-5" />
                      Player Login
                    </CardTitle>
                    <button
                      type="button"
                      onClick={() => setPlayerStep("location")}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      data-ocid="login.player.back_button"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <p className="text-xs text-muted-foreground truncate">
                      {playerLocationName}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Search by your name to view your profile and receipts.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search player name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      data-ocid="login.player.search_input"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSearch}
                      disabled={searchLoading || isFetching}
                      data-ocid="login.player.search_button"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>

                  {searchLoading && (
                    <div className="space-y-2">
                      <Skeleton className="h-14 w-full rounded-lg" />
                      <Skeleton className="h-14 w-full rounded-lg" />
                    </div>
                  )}

                  {!searchLoading && searched && searchResults.length === 0 && (
                    <div
                      className="text-center py-4 text-muted-foreground text-sm"
                      data-ocid="login.player.empty_state"
                    >
                      No players found. Check the spelling.
                    </div>
                  )}

                  {!searchLoading && searchResults.length > 0 && (
                    <div
                      className="space-y-2 max-h-56 overflow-y-auto"
                      data-ocid="login.player.results_list"
                    >
                      {searchResults.map((student, i) => (
                        <button
                          type="button"
                          key={student.id}
                          onClick={() => handlePlayerSelect(student)}
                          className="w-full text-left p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-smooth"
                          data-ocid={`login.player.result_item.${i + 1}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-sm">
                                {student.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {student.receiptNumber}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {ageCategoryLabel[student.ageCategory] ??
                                student.ageCategory}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
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
    </div>
  );
}
