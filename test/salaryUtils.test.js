import test from "node:test";
import assert from "node:assert/strict";
import { calculateSalary } from "../src/utils/salaryUtils.js";

const staff = { monthlySalary: 10000 };
const shop = { weeklyOffDay: "Sunday", monthlyPaidOffDays: 4 };
const presentRecords = (count) => Array.from({ length: count }, (_, index) => ({ id: String(index), status: "present" }));

test("June 2026 salary pays present days plus four configured paid off-days", () => {
  const report = calculateSalary({ staff, shop, month: "2026-06", attendanceRecords: presentRecords(10) });

  assert.equal(report.workingDays, 26);
  assert.equal(report.paidOffDaysUsed, 4);
  assert.equal(report.salaryDeductedAbsentDays, 12);
  assert.equal(report.payableDays, 14);
  assert.equal(Math.round(report.netSalary), 5385);
});

test("salary deduction begins only after the configured four paid off-days", () => {
  const noDeduction = calculateSalary({ staff, shop, month: "2026-06", attendanceRecords: presentRecords(22) });
  const oneDayDeduction = calculateSalary({ staff, shop, month: "2026-06", attendanceRecords: presentRecords(21) });

  assert.equal(noDeduction.payableDays, 26);
  assert.equal(noDeduction.netSalary, 10000);
  assert.equal(oneDayDeduction.salaryDeductedAbsentDays, 1);
  assert.equal(Math.round(oneDayDeduction.netSalary), 9615);
});

test("recorded advance is deducted from final salary", () => {
  const report = calculateSalary({
    staff,
    shop,
    month: "2026-06",
    attendanceRecords: presentRecords(26),
    advanceDeduction: 2000,
  });

  assert.equal(report.advanceDeduction, 2000);
  assert.equal(report.totalDeductions, 2000);
  assert.equal(report.netSalary, 8000);
});

test("half-day and unpaid leave reduce payable salary", () => {
  const report = calculateSalary({
    staff,
    shop: { ...shop, monthlyPaidOffDays: 0 },
    month: "2026-06",
    attendanceRecords: [...presentRecords(24), { status: "half-day", dayStatus: "half-day" }],
    approvedLeaves: [{ fromDate: "2026-06-30", toDate: "2026-06-30", leaveType: "Unpaid Leave" }],
  });

  assert.equal(report.halfDays, 1);
  assert.equal(report.unpaidLeaves, 1);
  assert.equal(report.payableDays, 24.5);
  assert.equal(Math.round(report.netSalary), 9423);
});

test("editable paid off-day allowance changes the deduction boundary", () => {
  const report = calculateSalary({
    staff,
    shop: { weeklyOffDay: "Sunday", monthlyPaidOffDays: 2 },
    month: "2026-06",
    attendanceRecords: presentRecords(23),
  });

  assert.equal(report.paidOffDaysUsed, 2);
  assert.equal(report.salaryDeductedAbsentDays, 1);
  assert.equal(report.payableDays, 25);
});
