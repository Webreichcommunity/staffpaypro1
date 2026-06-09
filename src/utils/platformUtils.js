export const isIOSDevice = (navigatorObject = globalThis.navigator) => {
  if (!navigatorObject) return false;

  const userAgent = navigatorObject.userAgent || "";
  const isClassicIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isIPadOS = navigatorObject.platform === "MacIntel" && navigatorObject.maxTouchPoints > 1;

  return isClassicIOS || isIPadOS;
};
