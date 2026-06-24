import test from "node:test";
import assert from "node:assert/strict";
import { calculatePunchOutOutcome } from "../src/utils/attendanceUtils.js";

const shop = { fullDayHours: 10, halfDayHours: 4 };

test("worked time above half-day window is completed as a full present day", () => {
  const outcome = calculatePunchOutOutcome({ totalMinutes: 554, shop });

  assert.equal(outcome.totalWorkingHours, 9.23);
  assert.equal(outcome.dayStatus, "full-day");
  assert.equal(outcome.status, "present");
  assert.equal(outcome.metConfiguredFullDayHours, false);
});

test("very short work up to the half-day window is marked half-day", () => {
  const outcome = calculatePunchOutOutcome({ totalMinutes: 240, shop });

  assert.equal(outcome.totalWorkingHours, 4);
  assert.equal(outcome.dayStatus, "half-day");
  assert.equal(outcome.status, "half-day");
});

test("late staff keeps late status when the completed day is not half-day", () => {
  const outcome = calculatePunchOutOutcome({ totalMinutes: 601, shop, isLate: true });

  assert.equal(outcome.dayStatus, "full-day");
  assert.equal(outcome.status, "late");
  assert.equal(outcome.metConfiguredFullDayHours, true);
});
