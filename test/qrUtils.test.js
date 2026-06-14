import test from "node:test";
import assert from "node:assert/strict";
import { createRotatingQrCode, getQrCountdown } from "../src/utils/qrUtils.js";

test("creates the same live QR for the same shop during one minute", () => {
  const now = Date.UTC(2026, 5, 14, 10, 30, 5);
  assert.equal(createRotatingQrCode("shop-123", now), createRotatingQrCode("shop-123", now + 50000));
  assert.notEqual(createRotatingQrCode("shop-123", now), createRotatingQrCode("another-shop", now));
});

test("rotates the live QR and resets countdown at the next minute", () => {
  const beforeBoundary = Date.UTC(2026, 5, 14, 10, 30, 59);
  const afterBoundary = beforeBoundary + 1000;

  assert.notEqual(createRotatingQrCode("shop-123", beforeBoundary), createRotatingQrCode("shop-123", afterBoundary));
  assert.equal(getQrCountdown(beforeBoundary), 1);
  assert.equal(getQrCountdown(afterBoundary), 60);
});
