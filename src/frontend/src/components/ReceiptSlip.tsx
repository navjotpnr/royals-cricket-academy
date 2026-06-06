import { AcademyBranding } from "@/components/AcademyBranding";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Student } from "@/types";
import { Printer, X } from "lucide-react";

interface ReceiptSlipProps {
  open: boolean;
  onClose: () => void;
  student: Student;
  receiptNumber: string;
}

export function ReceiptSlip({
  open,
  onClose,
  student,
  receiptNumber,
}: ReceiptSlipProps) {
  const handlePrint = () => {
    window.print();
  };

  const regDate = new Date(student.registrationDate / 1_000_000);
  const formattedDate = regDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const formattedTime = regDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const totalReceived = student.registrationFees + student.monthlyFees;

  const paymentLabel =
    student.paymentMode === "OnlineUPI"
      ? "Online (UPI)"
      : student.paymentMode === "Cash"
        ? "Cash"
        : "Cheque";

  const batchLabelMap: Record<string, string> = {
    morning6to8: "Morning (6:00 AM - 8:00 AM)",
    morning8to10: "Morning (8:00 AM - 10:00 AM)",
    evening4to6: "Evening (4:00 PM - 6:00 PM)",
    evening6to8: "Evening (6:00 PM - 8:00 PM)",
  };
  const batchLabel = batchLabelMap[student.batchTiming] ?? student.batchTiming;

  return (
    <>
      {/* Print-only styles injected inline */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #receipt-print-root { display: block !important; position: fixed; inset: 0; z-index: 99999; background: white; }
          #receipt-print-root * { display: revert; }
          .no-print { display: none !important; }
        }
        #receipt-print-root { display: none; }
      `}</style>

      {/* Hidden print target mirroring the visible slip */}
      <div id="receipt-print-root" aria-hidden="true">
        <PrintableSlip
          student={student}
          receiptNumber={receiptNumber}
          formattedDate={formattedDate}
          formattedTime={formattedTime}
          totalReceived={totalReceived}
          paymentLabel={paymentLabel}
          batchLabel={batchLabel}
        />
      </div>

      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className="max-w-md p-0 overflow-hidden"
          data-ocid="register.receipt.dialog"
        >
          <DialogHeader className="px-6 pt-5 pb-0 no-print">
            <div className="flex items-center justify-between">
              <DialogTitle className="font-display text-base">
                Registration Receipt
              </DialogTitle>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1 hover:bg-muted transition-colors"
                aria-label="Close"
                data-ocid="register.receipt.close_button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </DialogHeader>

          <div className="px-4 pb-2 overflow-y-auto max-h-[75vh]">
            <PrintableSlip
              student={student}
              receiptNumber={receiptNumber}
              formattedDate={formattedDate}
              formattedTime={formattedTime}
              totalReceived={totalReceived}
              paymentLabel={paymentLabel}
              batchLabel={batchLabel}
            />
          </div>

          <div className="no-print px-6 pb-5 pt-3 flex gap-3 border-t">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              data-ocid="register.receipt.cancel_button"
            >
              Close
            </Button>
            <Button
              type="button"
              className="flex-1 gap-2"
              onClick={handlePrint}
              data-ocid="register.receipt.print_button"
            >
              <Printer className="h-4 w-4" />
              Print Receipt
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface PrintableSlipProps {
  student: Student;
  receiptNumber: string;
  formattedDate: string;
  formattedTime: string;
  totalReceived: number;
  paymentLabel: string;
  batchLabel: string;
}

function PrintableSlip({
  student,
  receiptNumber,
  formattedDate,
  formattedTime,
  totalReceived,
  paymentLabel,
  batchLabel,
}: PrintableSlipProps) {
  return (
    <div
      className="bg-card rounded-lg border border-border overflow-hidden my-2"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Header band */}
      <div className="px-5 py-4 text-center bg-primary">
        <div className="flex justify-center mb-2">
          <AcademyBranding size="sm" showTagline={false} />
        </div>
        <div
          className="font-display font-bold text-base tracking-wide"
          style={{ color: "white" }}
        >
          Royals Cricket Academy
        </div>
        <div
          className="text-xs mt-0.5"
          style={{ color: "rgba(255,255,255,0.8)" }}
        >
          Jalandhar &nbsp;|&nbsp; +91 76963-72777
        </div>
        <div
          className="mt-3 text-xs font-semibold uppercase tracking-widest py-1 px-4 rounded-full inline-block"
          style={{
            background: "rgba(255,255,255,0.15)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.3)",
          }}
        >
          Registration Receipt
        </div>
      </div>

      {/* Receipt meta */}
      <div
        className="flex justify-between items-center px-5 py-2 text-xs"
        style={{ background: "oklch(0.96 0.01 22)" }}
      >
        <span className="font-semibold text-foreground">
          Receipt No:{" "}
          <span style={{ color: "oklch(0.4 0.18 22)" }}>{receiptNumber}</span>
        </span>
        <span className="text-muted-foreground">
          {formattedDate}, {formattedTime}
        </span>
      </div>

      {/* Student details */}
      <div className="px-5 py-4">
        <div
          className="text-xs font-bold uppercase tracking-wider mb-2"
          style={{ color: "oklch(0.4 0.18 22)" }}
        >
          Student Details
        </div>
        {/* Photo + name header */}
        {student.photoUrl && (
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border">
            <img
              src={student.photoUrl}
              alt={student.name}
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid oklch(0.7 0.12 22)",
                flexShrink: 0,
              }}
            />
            <div>
              <div className="font-bold text-foreground text-sm">
                {student.name}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {student.guardianName}
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {[
            ["Student Name", student.name],
            ["Guardian Name", student.guardianName],
            ["Age Category", student.ageCategory],
            ["Batch Timing", batchLabel],
            ["WhatsApp", student.whatsappNumber],
            ["Academy ID", `RCA-${student.id.toString().padStart(3, "0")}`],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="font-semibold text-foreground text-xs mt-0.5 break-words">
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-5 border-t border-border" />

      {/* Fee breakdown */}
      <div className="px-5 py-4">
        <div
          className="text-xs font-bold uppercase tracking-wider mb-3"
          style={{ color: "oklch(0.4 0.18 22)" }}
        >
          Fee Details
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Registration Fee</span>
            <span className="font-medium">
              ₹{student.registrationFees.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Monthly Coaching Fee</span>
            <span className="font-medium">
              ₹{student.monthlyFees.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment Mode</span>
            <span className="font-medium">{paymentLabel}</span>
          </div>
        </div>

        {/* Total */}
        <div
          className="mt-3 rounded-lg px-4 py-3 flex justify-between items-center"
          style={{ background: "oklch(0.96 0.02 22)" }}
        >
          <span
            className="text-sm font-bold"
            style={{ color: "oklch(0.4 0.18 22)" }}
          >
            TOTAL RECEIVED
          </span>
          <span
            className="text-lg font-bold font-display"
            style={{ color: "oklch(0.4 0.18 22)" }}
          >
            ₹{totalReceived.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Footer band */}
      <div className="px-5 py-3 text-center text-xs bg-primary text-primary-foreground">
        🏏 Thank you for joining Royals Cricket Academy!
        <div className="mt-0.5 opacity-70">Jalandhar · +91 76963-72777</div>
      </div>
    </div>
  );
}
