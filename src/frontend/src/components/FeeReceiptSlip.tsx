import { AcademyBranding } from "@/components/AcademyBranding";
import { Button } from "@/components/ui/button";
import type { MonthlyFeePayment, Student } from "@/types";
import { Printer } from "lucide-react";

interface FeeReceiptSlipProps {
  student: Student;
  payment: MonthlyFeePayment;
  onClose?: () => void;
}

function formatMonth(yyyymm: string): string {
  // yyyymm = "202605" or "2026-05"
  const clean = yyyymm.replace("-", "");
  const year = clean.slice(0, 4);
  const mon = Number(clean.slice(4, 6)) - 1;
  return new Date(Number(year), mon).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function formatPaymentMode(mode: string): string {
  if (mode === "OnlineUPI") return "Online (UPI / GPay)";
  return mode;
}

export function FeeReceiptSlip({
  student,
  payment,
  onClose,
}: FeeReceiptSlipProps) {
  const handlePrint = () => window.print();

  return (
    <>
      {/* Print styles injected into document */}
      <style>{`
        @media print {
          body > *:not(.print-receipt-root) { display: none !important; }
          .print-receipt-root { display: block !important; position: fixed; inset: 0; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="print-receipt-root">
        {/* Receipt card */}
        <div
          id="fee-receipt-content"
          className="bg-card border border-border rounded-xl overflow-hidden shadow-md"
          data-ocid="fee_receipt.card"
        >
          {/* Header band */}
          <div className="bg-primary px-5 py-4 text-primary-foreground">
            <AcademyBranding
              size="sm"
              showTagline={true}
              className="[&_*]:!text-primary-foreground [&_text]:!fill-white"
            />
          </div>

          {/* Receipt title */}
          <div className="bg-primary/10 border-b border-primary/20 px-5 py-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Monthly Fee Receipt
            </p>
            <p className="text-sm font-bold font-mono text-primary mt-0.5">
              {payment.receiptNumber}
            </p>
          </div>

          {/* Details grid */}
          <div className="px-5 py-4 space-y-3">
            {/* Student photo + name row */}
            <div className="flex items-center gap-3">
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary/30 flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border-2 border-primary/20">
                  <span className="text-xl font-bold text-primary">
                    {student.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-base leading-tight">
                  {student.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {student.receiptNumber}
                </p>
              </div>
            </div>
            <div className="border-t border-dashed border-border" />
            <Row label="Academy ID" value={student.receiptNumber} />
            <Row label="Parent / Guardian" value={student.guardianName} />
            <Row label="WhatsApp" value={student.whatsappNumber} />
            <Row label="Batch" value={String(student.batchTiming)} />
            <div className="border-t border-dashed border-border my-2" />
            <Row label="Month" value={formatMonth(payment.month)} bold />
            <Row
              label="Amount Paid"
              value={`₹${payment.amount.toLocaleString("en-IN")}`}
              bold
              highlight
            />
            <Row
              label="Payment Mode"
              value={formatPaymentMode(String(payment.paymentMode))}
            />
            <Row label="Payment Date" value={payment.paymentDate} />
          </div>

          {/* Footer band */}
          <div className="bg-primary px-5 py-3 text-center">
            <p className="text-xs text-primary-foreground/80">
              Thank you for choosing Royals Cricket Academy! &nbsp;|&nbsp;
              76963-72777
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="no-print flex gap-3 mt-4">
          <Button
            type="button"
            className="flex-1"
            onClick={handlePrint}
            data-ocid="fee_receipt.print_button"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
          {onClose && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              data-ocid="fee_receipt.close_button"
            >
              Close
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

function Row({
  label,
  value,
  bold,
  highlight,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span
        className={`text-sm text-right break-words ${
          highlight
            ? "text-primary font-bold text-base"
            : bold
              ? "font-semibold"
              : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
