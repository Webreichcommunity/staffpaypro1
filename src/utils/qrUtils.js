const stableShopCode = (shopId = "") => {
  let hash = 0;
  for (const character of String(shopId)) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  return (hash >>> 0).toString(36);
};

export const createRotatingQrCode = (shopId, now = Date.now()) =>
  `${Math.floor(now / 60000)}-${stableShopCode(shopId)}`;

export const getQrCountdown = (now = Date.now()) =>
  60 - (Math.floor(now / 1000) % 60);
