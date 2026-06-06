import Common "common";

module {
  public type AgeCategory = {
    #Under12;
    #Under14;
    #Under16;
    #Under19;
    #Senior;
  };

  public type BatchTiming = {
    #Morning;
    #Evening;
  };

  public type PaymentMode = {
    #Cash;
    #OnlineUPI;
    #Cheque;
  };

  public type AttendanceStatus = {
    #Present;
    #Absent;
  };

  public type Student = {
    id : Common.StudentId;
    locationId : Text;
    name : Text;
    guardianName : Text;
    ageCategory : AgeCategory;
    batchTiming : BatchTiming;
    whatsappNumber : Text;
    paymentMode : PaymentMode;
    registrationFees : Nat;
    monthlyFees : Nat;
    totalPaid : Nat;
    photoUrl : ?Text;
    registrationDate : Common.Timestamp;
    receiptNumber : Common.ReceiptNumber;
  };

  public type StudentInput = {
    locationId : Text;
    name : Text;
    guardianName : Text;
    ageCategory : AgeCategory;
    batchTiming : BatchTiming;
    whatsappNumber : Text;
    paymentMode : PaymentMode;
    registrationFees : Nat;
    monthlyFees : Nat;
    photoUrl : ?Text;
  };

  public type Attendance = {
    id : Common.AttendanceId;
    studentId : Common.StudentId;
    date : Text; // YYYYMMDD
    status : AttendanceStatus;
  };

  public type MonthlyFeePayment = {
    id : Common.FeePaymentId;
    studentId : Common.StudentId;
    month : Text; // YYYYMM
    amount : Nat;
    paymentMode : PaymentMode;
    paymentDate : Text;
    receiptNumber : Common.ReceiptNumber;
  };

  public type DashboardStats = {
    totalStudents : Nat;
    receiptsIssued : Nat;
    totalFeesCollected : Nat;
    feeOverdueCount : Nat;
  };

  public type FeeStatusEntry = {
    student : Student;
    payment : ?MonthlyFeePayment;
  };

  public type AttendanceSummaryEntry = {
    studentId : Common.StudentId;
    studentName : Text;
    daysPresent : Nat;
    totalDays : Nat;
    percentage : Nat; // 0-100
  };

  public type MonthlyReport = {
    month : Text; // YYYYMM
    totalCollected : Nat;
    totalPending : Nat;
    studentAttendanceSummary : [AttendanceSummaryEntry];
  };
};
