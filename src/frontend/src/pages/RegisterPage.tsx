import { createActor } from "@/backend";
import { AdminLayout } from "@/components/AdminLayout";
import { ReceiptSlip } from "@/components/ReceiptSlip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AgeCategory,
  BatchTiming,
  PaymentMode,
  getStudent,
  registerStudent,
} from "@/services/backend-service";
import { useAuthStore } from "@/store/auth-store";
import type { StudentInput } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const defaultForm = (locationId: string): StudentInput => ({
  name: "",
  guardianName: "",
  whatsappNumber: "",
  ageCategory: AgeCategory.Under14,
  batchTiming: BatchTiming.Morning,
  paymentMode: PaymentMode.Cash,
  monthlyFees: 0,
  registrationFees: 0,
  locationId,
});

export default function RegisterPage() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  const locationId = useAuthStore((s) => s.locationId) ?? "";
  const [form, setForm] = useState<StudentInput>(() => defaultForm(locationId));
  const [loading, setLoading] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptStudent, setReceiptStudent] = useState<
    import("@/types").Student | null
  >(null);

  const set = (key: keyof StudentInput, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || isFetching) return;
    if (
      !form.name.trim() ||
      !form.guardianName.trim() ||
      !form.whatsappNumber.trim()
    ) {
      toast.error("Please fill all required fields.");
      return;
    }
    if (!/^\d{10}$/.test(form.whatsappNumber)) {
      toast.error("WhatsApp number must be exactly 10 digits.");
      return;
    }
    setLoading(true);
    try {
      const submitForm = photoPreview
        ? { ...form, photoUrl: photoPreview, locationId }
        : { ...form, locationId };
      const [studentId, receipt] = await registerStudent(actor, submitForm);
      setLastReceipt(receipt);
      toast.success(`Student registered! Receipt: ${receipt}`);
      queryClient.invalidateQueries({ queryKey: ["all-students", locationId] });
      queryClient.invalidateQueries({
        queryKey: ["dashboard-stats", locationId],
      });
      const student = await getStudent(actor, studentId);
      if (student) {
        setReceiptStudent(student);
        setShowReceipt(true);
      }
      setForm(defaultForm(locationId));
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch {
      toast.error("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display">
            Player Registration
          </h1>
          <p className="text-muted-foreground text-sm">
            Add a new student to the academy
          </p>
        </div>

        {lastReceipt && (
          <div
            className="bg-primary/10 border border-primary/20 rounded-lg p-4"
            data-ocid="register.success_state"
          >
            <p className="font-semibold text-primary">
              ✓ Registered successfully
            </p>
            <p className="text-sm text-muted-foreground">
              Receipt Number:{" "}
              <span className="font-mono font-bold">{lastReceipt}</span>
            </p>
            <button
              type="button"
              className="mt-2 text-xs text-primary underline"
              onClick={() => setShowReceipt(true)}
              data-ocid="register.view_receipt_button"
            >
              View / Print Receipt
            </button>
          </div>
        )}

        {showReceipt && receiptStudent && lastReceipt && (
          <ReceiptSlip
            open={showReceipt}
            onClose={() => setShowReceipt(false)}
            student={receiptStudent}
            receiptNumber={lastReceipt}
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">
              Player Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo Upload */}
              <div className="flex flex-col items-center gap-2">
                <Label className="text-sm text-muted-foreground">
                  Player Photo (Optional)
                </Label>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="relative w-32 h-32 rounded-full border-2 border-dashed border-border hover:border-primary transition-colors bg-muted/40 flex items-center justify-center overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Upload player photo"
                  data-ocid="register.photo_upload_button"
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Player preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Camera className="h-8 w-8" />
                      <span className="text-xs">Tap to upload</span>
                    </div>
                  )}
                  {photoPreview && (
                    <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  )}
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                  data-ocid="register.photo_input"
                />
                {photoFile && (
                  <button
                    type="button"
                    className="text-xs text-destructive hover:underline"
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview(null);
                    }}
                    data-ocid="register.photo_remove_button"
                  >
                    Remove photo
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Aarav Sharma"
                    data-ocid="register.name_input"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="guardian">Guardian Name *</Label>
                  <Input
                    id="guardian"
                    value={form.guardianName}
                    onChange={(e) => set("guardianName", e.target.value)}
                    placeholder="Suresh Sharma"
                    data-ocid="register.guardian_input"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone">WhatsApp Number *</Label>
                  <Input
                    id="phone"
                    value={form.whatsappNumber}
                    onChange={(e) => set("whatsappNumber", e.target.value)}
                    placeholder="+91 98765 43210"
                    data-ocid="register.phone_input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Age Category</Label>
                    <Select
                      value={form.ageCategory}
                      onValueChange={(v) =>
                        set("ageCategory", v as AgeCategory)
                      }
                    >
                      <SelectTrigger data-ocid="register.age_category_select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(AgeCategory).map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Batch Timing</Label>
                    <Select
                      value={form.batchTiming}
                      onValueChange={(v) =>
                        set("batchTiming", v as BatchTiming)
                      }
                    >
                      <SelectTrigger data-ocid="register.batch_timing_select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(BatchTiming).map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="monthly">Monthly Fees (Rs.)</Label>
                    <Input
                      id="monthly"
                      type="number"
                      min={0}
                      placeholder="e.g. 1500"
                      value={form.monthlyFees === 0 ? "" : form.monthlyFees}
                      onChange={(e) =>
                        set(
                          "monthlyFees",
                          e.target.value === "" ? 0 : Number(e.target.value),
                        )
                      }
                      data-ocid="register.monthly_fees_input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="reg">Admission Fees (Rs.)</Label>
                    <Input
                      id="reg"
                      type="number"
                      min={0}
                      placeholder="0 for old students"
                      value={
                        form.registrationFees === 0 ? "" : form.registrationFees
                      }
                      onChange={(e) =>
                        set(
                          "registrationFees",
                          e.target.value === "" ? 0 : Number(e.target.value),
                        )
                      }
                      data-ocid="register.reg_fees_input"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Payment Mode</Label>
                  <Select
                    value={form.paymentMode}
                    onValueChange={(v) => set("paymentMode", v as PaymentMode)}
                  >
                    <SelectTrigger data-ocid="register.payment_mode_select">
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
              <Button
                type="submit"
                className="w-full"
                disabled={loading || isFetching}
                data-ocid="register.submit_button"
              >
                {loading ? "Registering..." : "Register & Generate Slip"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
