export const createRotatingQrCode = () =>
  `${Math.floor(Date.now() / 60000)}-${crypto.randomUUID().slice(0, 8)}`;
