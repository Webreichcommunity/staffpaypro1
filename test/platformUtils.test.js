import test from "node:test";
import assert from "node:assert/strict";
import { isIOSDevice } from "../src/utils/platformUtils.js";

test("detects iPhone and iPad user agents", () => {
  assert.equal(isIOSDevice({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)" }), true);
  assert.equal(isIOSDevice({ userAgent: "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)" }), true);
});

test("detects iPadOS when it reports a desktop user agent", () => {
  assert.equal(isIOSDevice({ userAgent: "Mozilla/5.0 (Macintosh)", platform: "MacIntel", maxTouchPoints: 5 }), true);
});

test("does not classify Android or desktop browsers as iOS", () => {
  assert.equal(isIOSDevice({ userAgent: "Mozilla/5.0 (Linux; Android 15)", platform: "Linux armv8l", maxTouchPoints: 5 }), false);
  assert.equal(isIOSDevice({ userAgent: "Mozilla/5.0 (Windows NT 10.0)", platform: "Win32", maxTouchPoints: 0 }), false);
});
