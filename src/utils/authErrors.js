const AUTH_ERROR_MESSAGES = {
  "auth/invalid-credential": "Incorrect email, login ID, username, or password.",
  "auth/invalid-login-credentials": "Incorrect email, login ID, username, or password.",
  "auth/user-not-found": "Incorrect email, login ID, username, or password.",
  "auth/wrong-password": "Incorrect email, login ID, username, or password.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/user-disabled": "This account has been disabled. Contact the administrator.",
  "auth/too-many-requests": "Too many unsuccessful attempts. Wait a few minutes and try again.",
  "auth/network-request-failed": "Unable to reach Firebase. Check your internet connection and try again.",
  "auth/operation-not-allowed": "Email and password login is not enabled for this Firebase project.",
  "auth/unauthorized-domain": "This website domain is not authorized in Firebase Authentication.",
  "auth/popup-blocked": "The Google verification popup was blocked. Allow popups and try again.",
  "auth/popup-closed-by-user": "Google verification was cancelled. Please try again.",
  "auth/cancelled-popup-request": "Google verification was cancelled. Please try again.",
  "auth/account-exists-with-different-credential": "This email already uses another sign-in method.",
  "auth/credential-already-in-use": "This Google account is already linked to another user.",
  unavailable: "The service is temporarily unavailable. Check your connection and try again.",
};

export const isTransientAuthError = (error) =>
  error?.code === "auth/network-request-failed" || error?.code === "unavailable";

export const getAuthErrorMessage = (error) => {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "You appear to be offline. Reconnect to the internet and try again.";
  }

  if (AUTH_ERROR_MESSAGES[error?.code]) return AUTH_ERROR_MESSAGES[error.code];
  if (error instanceof Error && error.message && !error.code) return error.message;
  return "Login failed. Please try again.";
};

export const createFriendlyAuthError = (error) => {
  const friendlyError = new Error(getAuthErrorMessage(error));
  friendlyError.code = error?.code || "auth/unknown";
  friendlyError.cause = error;
  return friendlyError;
};
