import Common "../types/common";
import Types "../types/cricket-academy";
import Lib "../lib/cricket-academy";

mixin (state : Lib.State) {
  public func registerStudent(data : Types.StudentInput) : async (Common.StudentId, Common.ReceiptNumber) {
    Lib.registerStudent(state, data)
  };

  public query func getStudent(id : Common.StudentId) : async ?Types.Student {
    Lib.getStudent(state, id)
  };

  public query func getAllStudents(locationId : Text) : async [Types.Student] {
    Lib.getAllStudents(state, locationId)
  };

  public query func getStudentByName(locationId : Text, name : Text) : async [Types.Student] {
    Lib.getStudentByName(state, locationId, name)
  };

  public func markAttendance(studentId : Common.StudentId, date : Text, status : Types.AttendanceStatus) : async Bool {
    Lib.markAttendance(state, studentId, date, status)
  };

  public query func getStudentAttendance(studentId : Common.StudentId) : async [Types.Attendance] {
    Lib.getStudentAttendance(state, studentId)
  };

  public query func getAttendanceByDate(locationId : Text, date : Text) : async [Types.Attendance] {
    Lib.getAttendanceByDate(state, locationId, date)
  };

  public func collectMonthlyFee(studentId : Common.StudentId, month : Text, amount : Nat, paymentMode : Types.PaymentMode, paymentDate : Text) : async Common.ReceiptNumber {
    Lib.collectMonthlyFee(state, studentId, month, amount, paymentMode, paymentDate)
  };

  public query func getMonthlyFeePayments(studentId : Common.StudentId) : async [Types.MonthlyFeePayment] {
    Lib.getMonthlyFeePayments(state, studentId)
  };

  public query func getAllMonthlyFeePayments(locationId : Text) : async [Types.MonthlyFeePayment] {
    Lib.getAllMonthlyFeePayments(state, locationId)
  };

  public query func getFeeStatusForMonth(locationId : Text, month : Text) : async [Types.FeeStatusEntry] {
    Lib.getFeeStatusForMonth(state, locationId, month)
  };

  public query func getDashboardStats(locationId : Text) : async Types.DashboardStats {
    Lib.getDashboardStats(state, locationId)
  };

  public func deleteStudent(locationId : Text, adminPin : Text, studentId : Common.StudentId) : async { #ok; #err : Text } {
    Lib.deleteStudent(state, locationId, adminPin, studentId)
  };

  public query func verifyAdminPin(locationId : Text, pin : Text) : async Bool {
    Lib.verifyAdminPin(state, locationId, pin)
  };

  public query func getLocations() : async [(Text, Text)] {
    Lib.getLocations(state)
  };

  public func changeAdminPin(locationId : Text, oldPin : Text, newPin : Text) : async Bool {
    Lib.changeAdminPin(state, locationId, oldPin, newPin)
  };

  public query func getMonthlyReport(locationId : Text, month : Text) : async Types.MonthlyReport {
    Lib.getMonthlyReport(state, locationId, month)
  };
};
