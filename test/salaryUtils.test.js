import test from "node:test";
import assert from "node:assert/strict";
import { calculateSalary } from "../src/utils/salaryUtils.js";

const staff = { monthlySalary: 10000 };
const shop = { monthlyExtraPaidDays: 4 };
const records = (count, status = "present") => Array.from({ length: count }, (_, index) => ({
  id: String(index),
  status,
  dayStatus: status === "present" ? "full-day" : status,
}));

test("June 2026 pays the monthly salary plus four extra calendar-day rates", () => {
  const report = calculateSalary({ staff, shop, month: "2026-06", attendanceRecords: records(30) });

  assert.equal(report.calendarDays, 30);
  assert.equal(report.monthlyExtraPaidDays, 4);
  assert.equal(Number(report.perDaySalary.toFixed(2)), 333.33);
  assert.equal(Number(report.extraSalaryAmount.toFixed(2)), 1333.33);
  assert.equal(Number(report.netSalary.toFixed(2)), 11333.33);
});

test("an absent day deducts one daily rate while extra salary days remain payable", () => {
  const report = calculateSalary({ staff, shop, month: "2026-06", attendanceRecords: [...records(29), ...records(1, "absent")] });

  assert.equal(report.salaryDeductedAbsentDays, 1);
  assert.equal(report.payableDays, 33);
  assert.equal(Number(report.netSalary.toFixed(2)), 11000);
});

test("a half-day earns exactly half of the calendar-day salary", () => {
  const report = calculateSalary({ staff, shop, month: "2026-06", attendanceRecords: [...records(29), ...records(1, "half-day")] });

  assert.equal(report.halfDays, 1);
  assert.equal(report.payableDays, 33.5);
  assert.equal(Number(report.halfDayDeduction.toFixed(2)), 166.67);
  assert.equal(Number(report.netSalary.toFixed(2)), 11166.67);
});

test("recorded advance is deducted from the salary including extra paid days", () => {
  const report = calculateSalary({
    staff,
    shop,
    month: "2026-06",
    attendanceRecords: records(30),
    advanceDeduction: 2000,
  });

  assert.equal(report.advanceDeduction, 2000);
  assert.equal(report.totalDeductions, 2000);
  assert.equal(Number(report.netSalary.toFixed(2)), 9333.33);
});

test("shop settings control the number of extra salary days", () => {
  const report = calculateSalary({
    staff,
    shop: { monthlyExtraPaidDays: 2 },
    month: "2026-06",
    attendanceRecords: records(30),
  });

  assert.equal(report.monthlyExtraPaidDays, 2);
  assert.equal(report.payableDays, 32);
  assert.equal(Number(report.netSalary.toFixed(2)), 10666.67);
});

test("daily salary automatically follows the selected month's calendar length", () => {
  const report = calculateSalary({ staff, shop, month: "2026-07", attendanceRecords: records(31) });

  assert.equal(report.calendarDays, 31);
  assert.equal(Number(report.perDaySalary.toFixed(2)), 322.58);
  assert.equal(Number(report.netSalary.toFixed(2)), 11290.32);
});

test("legacy shop settings retain their configured extra-day value", () => {
  const report = calculateSalary({
    staff,
    shop: { monthlyPaidOffDays: 3 },
    month: "2026-06",
    attendanceRecords: records(30),
  });

  assert.equal(report.monthlyExtraPaidDays, 3);
  assert.equal(Number(report.netSalary.toFixed(2)), 11000);
});
