import { useEffect, useState } from "react";
import { createRotatingQrCode, getQrCountdown } from "../utils/qrUtils";

export const useLiveQr = (shopId) => {
  const [qrCode, setQrCode] = useState(() => (shopId ? createRotatingQrCode(shopId) : ""));
  const [countdown, setCountdown] = useState(() => getQrCountdown());

  useEffect(() => {
    if (!shopId) return undefined;

    const update = () => {
      const now = Date.now();
      setQrCode(createRotatingQrCode(shopId, now));
      setCountdown(getQrCountdown(now));
    };

    const startTimer = window.setTimeout(update, 0);
    const timer = window.setInterval(update, 1000);
    return () => {
      window.clearTimeout(startTimer);
      window.clearInterval(timer);
    };
  }, [shopId]);

  return { qrCode: shopId ? qrCode : "", countdown };
};
