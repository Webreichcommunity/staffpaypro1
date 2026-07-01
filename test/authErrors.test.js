import test from "node:test";
import assert from "node:assert/strict";
import { createFriendlyAuthError, getAuthErrorMessage, isTransientAuthError } from "../src/utils/authErrors.js";

test("turns invalid Firebase credentials into a safe, useful login message", () => {
  assert.equal(
    getAuthErrorMessage({ code: "auth/invalid-credential", message: "Firebase: Error (auth/invalid-credential)." }),
    "Incorrect email, login ID, username, or password.",
  );
});

test("identifies only retryable authentication service failures", () => {
  assert.equal(isTransientAuthError({ code: "auth/network-request-failed" }), true);
  assert.equal(isTransientAuthError({ code: "unavailable" }), true);
  assert.equal(isTransientAuthError({ code: "auth/invalid-credential" }), false);
});

test("preserves intentional application errors", () => {
  const original = new Error("This account is inactive. Contact the administrator.");
  const friendly = createFriendlyAuthError(original);

  assert.equal(friendly.message, original.message);
  assert.equal(friendly.cause, original);
});
