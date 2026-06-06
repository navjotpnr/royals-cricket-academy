import Common "../types/common";
import Types "../types/cricket-academy";
import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";

module {
  public type State = {
    students : Map.Map<Common.StudentId, Types.Student>;
    attendances : Map.Map<Common.AttendanceId, Types.Attendance>;
    feePayments : Map.Map<Common.FeePaymentId, Types.MonthlyFeePayment>;
    locationPins : Map.Map<Text, Text>;
    locationNames : Map.Map<Text, Text>;
    counters : {
      var nextStudentId : Nat;
      var nextAttendanceId : Nat;
      var nextFeePaymentId : Nat;
      var nextRegReceiptSeq : Nat;
      var nextFeeReceiptSeq : Nat;
    };
  };

  // ── Helpers ──────────────────────────────────────────────────────────────

  // Derive a 4-digit year string from nanosecond timestamp
  func yearFromNs(ns : Int) : Text {
    let secs = Int.abs(ns) / 1_000_000_000;
    let days = secs / 86400;
    // Approximate year from epoch days (good enough for receipt numbers)
    let year = 1970 + days / 365;
    year.toText()
  };

  // YYYYMM from nanosecond timestamp
  func yearMonthFromNs(ns : Int) : Text {
    let secs = Int.abs(ns) / 1_000_000_000;
    let days = secs / 86400;
    let year = 1970 + days / 365;
    let dayOfYear = days % 365;
    let month = dayOfYear / 30 + 1;
    let m = if (month > 12) 12 else month;
    let mText = if (m < 10) "0" # m.toText() else m.toText();
    year.toText() # mText
  };

  func padLeft4(n : Nat) : Text {
    let s = n.toText();
    if (s.size() >= 4) s
    else if (s.size() == 3) "0" # s
    else if (s.size() == 2) "00" # s
    else "000" # s
  };

  // ── State ────────────────────────────────────────────────────────────────

  public func newState() : State {
    let locationPins = Map.empty<Text, Text>();
    locationPins.add("location1", "1234");
    locationPins.add("location2", "5678");
    let locationNames = Map.empty<Text, Text>();
    locationNames.add("location1", "RCA Lawrence International School, Surya Enclave, Jalandhar");
    locationNames.add("location2", "RCA Pyare Lal Stadium, Sain Dass School, Jalandhar");
    {
      students = Map.empty<Common.StudentId, Types.Student>();
      attendances = Map.empty<Common.AttendanceId, Types.Attendance>();
      feePayments = Map.empty<Common.FeePaymentId, Types.MonthlyFeePayment>();
      locationPins;
      locationNames;
      counters = {
        var nextStudentId = 1;
        var nextAttendanceId = 1;
        var nextFeePaymentId = 1;
        var nextRegReceiptSeq = 1;
        var nextFeeReceiptSeq = 1;
      };
    }
  };

  // ── Ensure Locations (postupgrade backfill) ───────────────────────────────

  public func ensureLocations(state : State) {
    switch (state.locationPins.get("location2")) {
      case null {
        state.locationPins.add("location2", "5678");
      };
      case (?_) {};
    };
    switch (state.locationNames.get("location2")) {
      case null {
        state.locationNames.add("location2", "RCA Pyare Lal Stadium, Sain Dass School, Jalandhar");
      };
      case (?_) {};
    };
  };

  // ── Students ─────────────────────────────────────────────────────────────

  public func registerStudent(state : State, data : Types.StudentInput) : (Common.StudentId, Common.ReceiptNumber) {
    let id = state.counters.nextStudentId;
    state.counters.nextStudentId += 1;
    let now = Time.now();
    let receiptNum = "RCA-" # yearFromNs(now) # "-" # padLeft4(state.counters.nextRegReceiptSeq);
    state.counters.nextRegReceiptSeq += 1;
    let student : Types.Student = {
      id;
      locationId = data.locationId;
      name = data.name;
      guardianName = data.guardianName;
      ageCategory = data.ageCategory;
      batchTiming = data.batchTiming;
      whatsappNumber = data.whatsappNumber;
      paymentMode = data.paymentMode;
      registrationFees = data.registrationFees;
      monthlyFees = data.monthlyFees;
      totalPaid = data.registrationFees;
      photoUrl = data.photoUrl;
      registrationDate = now;
      receiptNumber = receiptNum;
    };
    state.students.add(id, student);
    (id, receiptNum)
  };

  public func getStudent(state : State, id : Common.StudentId) : ?Types.Student {
    state.students.get(id)
  };

  public func getAllStudents(state : State, locationId : Text) : [Types.Student] {
    let results = List.empty<Types.Student>();
    for ((_, s) in state.students.entries()) {
      let loc = s.locationId;
      if (loc == locationId or (loc == "" and locationId == "location1")) {
        results.add(s);
      };
    };
    results.toArray()
  };

  public func getStudentByName(state : State, locationId : Text, name : Text) : [Types.Student] {
    let needle = name.toLower();
    let results = List.empty<Types.Student>();
    for ((_, s) in state.students.entries()) {
      let loc = s.locationId;
      let inLocation = loc == locationId or (loc == "" and locationId == "location1");
      if (inLocation and s.name.toLower().contains(#text needle)) {
        results.add(s);
      };
    };
    results.toArray()
  };

  // ── Attendance ────────────────────────────────────────────────────────────

  public func markAttendance(state : State, studentId : Common.StudentId, date : Text, status : Types.AttendanceStatus) : Bool {
    // Check student exists
    switch (state.students.get(studentId)) {
      case null { return false };
      case (?_) {};
    };
    // Find existing record for this (studentId, date) and update, or create new
    var found = false;
    state.attendances.forEach(func(k, a) {
      if (a.studentId == studentId and a.date == date) {
        state.attendances.add(k, { a with status });
        found := true;
      };
    });
    if (not found) {
      let attId = state.counters.nextAttendanceId;
      state.counters.nextAttendanceId += 1;
      state.attendances.add(attId, { id = attId; studentId; date; status });
    };
    true
  };

  public func getStudentAttendance(state : State, studentId : Common.StudentId) : [Types.Attendance] {
    let results = List.empty<Types.Attendance>();
    for ((_, a) in state.attendances.entries()) {
      if (a.studentId == studentId) results.add(a);
    };
    results.toArray()
  };

  public func getAttendanceByDate(state : State, locationId : Text, date : Text) : [Types.Attendance] {
    let results = List.empty<Types.Attendance>();
    for ((_, a) in state.attendances.entries()) {
      if (a.date == date) {
        switch (state.students.get(a.studentId)) {
          case (?s) {
            let loc = s.locationId;
            if (loc == locationId or (loc == "" and locationId == "location1")) {
              results.add(a);
            };
          };
          case null {};
        };
      };
    };
    results.toArray()
  };

  // ── Fee Payments ──────────────────────────────────────────────────────────

  public func collectMonthlyFee(state : State, studentId : Common.StudentId, month : Text, amount : Nat, paymentMode : Types.PaymentMode, paymentDate : Text) : Common.ReceiptNumber {
    let feeId = state.counters.nextFeePaymentId;
    state.counters.nextFeePaymentId += 1;
    let receiptNum = "MF-" # month # "-" # padLeft4(state.counters.nextFeeReceiptSeq);
    state.counters.nextFeeReceiptSeq += 1;
    let payment : Types.MonthlyFeePayment = {
      id = feeId;
      studentId;
      month;
      amount;
      paymentMode;
      paymentDate;
      receiptNumber = receiptNum;
    };
    state.feePayments.add(feeId, payment);
    // Update student totalPaid
    switch (state.students.get(studentId)) {
      case (?s) {
        state.students.add(studentId, { s with totalPaid = s.totalPaid + amount });
      };
      case null {};
    };
    receiptNum
  };

  public func getMonthlyFeePayments(state : State, studentId : Common.StudentId) : [Types.MonthlyFeePayment] {
    let results = List.empty<Types.MonthlyFeePayment>();
    for ((_, p) in state.feePayments.entries()) {
      if (p.studentId == studentId) results.add(p);
    };
    results.toArray()
  };

  public func getAllMonthlyFeePayments(state : State, locationId : Text) : [Types.MonthlyFeePayment] {
    let results = List.empty<Types.MonthlyFeePayment>();
    for ((_, p) in state.feePayments.entries()) {
      switch (state.students.get(p.studentId)) {
        case (?s) {
          let loc = s.locationId;
          if (loc == locationId or (loc == "" and locationId == "location1")) {
            results.add(p);
          };
        };
        case null {};
      };
    };
    results.toArray()
  };

  public func getFeeStatusForMonth(state : State, locationId : Text, month : Text) : [Types.FeeStatusEntry] {
    let results = List.empty<Types.FeeStatusEntry>();
    for ((_, student) in state.students.entries()) {
      let loc = student.locationId;
      let inLocation = loc == locationId or (loc == "" and locationId == "location1");
      if (inLocation) {
        var payment : ?Types.MonthlyFeePayment = null;
        for ((_, p) in state.feePayments.entries()) {
          if (p.studentId == student.id and p.month == month) {
            payment := ?p;
          };
        };
        results.add({ student; payment });
      };
    };
    results.toArray()
  };

  // ── Dashboard ─────────────────────────────────────────────────────────────

  public func getDashboardStats(state : State, locationId : Text) : Types.DashboardStats {
    var totalStudents : Nat = 0;
    var totalFeesCollected : Nat = 0;
    var overdueCount : Nat = 0;
    var registrationsCount : Nat = 0;
    var feeReceiptsCount : Nat = 0;
    let currentMonth = yearMonthFromNs(Time.now());
    for ((_, student) in state.students.entries()) {
      let loc = student.locationId;
      let inLocation = loc == locationId or (loc == "" and locationId == "location1");
      if (inLocation) {
        totalStudents += 1;
        registrationsCount += 1;
        var paid = false;
        for ((_, p) in state.feePayments.entries()) {
          if (p.studentId == student.id) {
            totalFeesCollected += p.amount;
            if (p.month == currentMonth) paid := true;
          };
        };
        if (not paid) overdueCount += 1;
      };
    };
    for ((_, p) in state.feePayments.entries()) {
      switch (state.students.get(p.studentId)) {
        case (?s) {
          let loc = s.locationId;
          if (loc == locationId or (loc == "" and locationId == "location1")) {
            feeReceiptsCount += 1;
          };
        };
        case null {};
      };
    };
    let receiptsIssued = registrationsCount + feeReceiptsCount;
    {
      totalStudents;
      receiptsIssued;
      totalFeesCollected;
      feeOverdueCount = overdueCount;
    }
  };

  // ── Delete Student ──────────────────────────────────────────────────────

  public func deleteStudent(state : State, locationId : Text, adminPin : Text, studentId : Common.StudentId) : { #ok; #err : Text } {
    switch (state.locationPins.get(locationId)) {
      case (?correctPin) {
        if (correctPin != adminPin) return #err("Unauthorized: invalid admin PIN");
      };
      case null { return #err("Unknown location") };
    };
    switch (state.students.get(studentId)) {
      case null { return #err("Student not found") };
      case (?s) {
        let loc = s.locationId;
        let inLocation = loc == locationId or (loc == "" and locationId == "location1");
        if (not inLocation) return #err("Unauthorized");
      };
    };
    state.students.remove(studentId);
    let attKeysToDelete = List.empty<Common.AttendanceId>();
    for ((k, a) in state.attendances.entries()) {
      if (a.studentId == studentId) attKeysToDelete.add(k);
    };
    for (k in attKeysToDelete.values()) {
      state.attendances.remove(k);
    };
    let feeKeysToDelete = List.empty<Common.FeePaymentId>();
    for ((k, p) in state.feePayments.entries()) {
      if (p.studentId == studentId) feeKeysToDelete.add(k);
    };
    for (k in feeKeysToDelete.values()) {
      state.feePayments.remove(k);
    };
    #ok
  };

  // ── Locations ────────────────────────────────────────────────────────────

  public func getLocations(state : State) : [(Text, Text)] {
    let results = List.empty<(Text, Text)>();
    for ((id, name) in state.locationNames.entries()) {
      results.add((id, name));
    };
    results.toArray()
  };

  // ── Admin ─────────────────────────────────────────────────────────────────

  public func verifyAdminPin(state : State, locationId : Text, pin : Text) : Bool {
    switch (state.locationPins.get(locationId)) {
      case (?correctPin) { correctPin == pin };
      case null { false };
    }
  };

  public func changeAdminPin(state : State, locationId : Text, oldPin : Text, newPin : Text) : Bool {
    switch (state.locationPins.get(locationId)) {
      case (?correctPin) {
        if (correctPin != oldPin) return false;
        state.locationPins.add(locationId, newPin);
        true
      };
      case null { false };
    }
  };

  // ── Monthly Report ────────────────────────────────────────────────────────

  public func getMonthlyReport(state : State, locationId : Text, month : Text) : Types.MonthlyReport {
    var totalCollected : Nat = 0;
    var totalPending : Nat = 0;
    let summaryList = List.empty<Types.AttendanceSummaryEntry>();
    for ((_, student) in state.students.entries()) {
      let loc = student.locationId;
      let inLocation = loc == locationId or (loc == "" and locationId == "location1");
      if (inLocation) {
        var paid = false;
        for ((_, p) in state.feePayments.entries()) {
          if (p.studentId == student.id and p.month == month) {
            totalCollected += p.amount;
            paid := true;
          };
        };
        if (not paid) totalPending += student.monthlyFees;
        var daysPresent : Nat = 0;
        var totalDays : Nat = 0;
        for ((_, a) in state.attendances.entries()) {
          if (a.studentId == student.id and a.date.startsWith(#text month)) {
            totalDays += 1;
            switch (a.status) {
              case (#Present) { daysPresent += 1 };
              case (#Absent) {};
            };
          };
        };
        let pct : Nat = if (totalDays == 0) 0 else (daysPresent * 100) / totalDays;
        summaryList.add({
          studentId = student.id;
          studentName = student.name;
          daysPresent;
          totalDays;
          percentage = pct;
        });
      };
    };
    { month; totalCollected; totalPending; studentAttendanceSummary = summaryList.toArray() }
  };
};
