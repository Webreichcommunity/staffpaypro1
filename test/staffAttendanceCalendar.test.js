import test from "node:test";
import assert from "node:assert/strict";
import { getCalendarAttendanceStatus, getNextCalendarAttendanceStatus } from "../src/utils/attendanceCalendarUtils.js";

test("calendar attendance follows normal, present, absent, half-day, normal cycle", () => {
  let status = null;
  status = getNextCalendarAttendanceStatus(status);
  assert.equal(status, "present");
  status = getNextCalendarAttendanceStatus(status);
  assert.equal(status, "absent");
  status = getNextCalendarAttendanceStatus(status);
  assert.equal(status, "half-day");
  status = getNextCalendarAttendanceStatus(status);
  assert.equal(status, null);
});

test("calendar normalizes staff punch and admin day statuses", () => {
  assert.equal(getCalendarAttendanceStatus({ status: "late", dayStatus: "full-day" }), "present");
  assert.equal(getCalendarAttendanceStatus({ status: "present", dayStatus: "half-day" }), "half-day");
  assert.equal(getCalendarAttendanceStatus({ status: "absent" }), "absent");
  assert.equal(getCalendarAttendanceStatus(null), null);
});
