import test from "node:test";
import assert from "node:assert/strict";
import { getAttendanceDateKey } from "../src/utils/dateUtils.js";

test("normal shop hours keep attendance on the same calendar date", () => {
  const shop = { openingTime: "10:00", closingTime: "20:00" };

  assert.equal(getAttendanceDateKey(shop, new Date(2026, 5, 16, 11, 0)), "2026-06-16");
  assert.equal(getAttendanceDateKey(shop, new Date(2026, 5, 16, 19, 30)), "2026-06-16");
});

test("overnight shop hours keep after-midnight punch out on the previous attendance date", () => {
  const shop = { openingTime: "18:00", closingTime: "02:00" };

  assert.equal(getAttendanceDateKey(shop, new Date(2026, 5, 17, 1, 30)), "2026-06-16");
  assert.equal(getAttendanceDateKey(shop, new Date(2026, 5, 17, 10, 0)), "2026-06-17");
});
