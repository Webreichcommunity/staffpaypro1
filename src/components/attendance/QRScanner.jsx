import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button, Card } from "../common/UI";

const stopScanner = async (scanner) => {
  if (!scanner?.isScanning) return;

  try {
    await scanner.stop();
  } catch {
    // The scanner may already be stopping because the component was unmounted.
  }
};

export const QRScanner = ({ onResult }) => {
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");
  const resultRef = useRef(onResult);

  useEffect(() => {
    resultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (!active) return undefined;

    let cancelled = false;
    let resultHandled = false;
    const scanner = new Html5Qrcode("staffpay-qr-reader");

    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            if (cancelled || resultHandled) return;
            resultHandled = true;
            await stopScanner(scanner);
            if (cancelled) return;
            setActive(false);
            resultRef.current(decodedText);
          },
        );

        if (cancelled) await stopScanner(scanner);
      } catch {
        if (cancelled) return;
        setActive(false);
        setError("Camera permission denied or camera could not start. Please allow camera access and try again.");
      }
    };

    // Deferring startup avoids React Strict Mode's setup/cleanup check racing two camera requests.
    const startTimer = window.setTimeout(() => {
      void startScanner();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
      void stopScanner(scanner);
    };
  }, [active]);

  return (
    <Card>
      <div className="grid gap-4">
        <Button className="w-full !min-h-14 text-base" disabled={active} onClick={() => { setError(""); setActive(true); }}>
          {active ? "Scanning..." : "Scan QR"}
        </Button>
        {active && <div id="staffpay-qr-reader" className="overflow-hidden rounded-2xl bg-gray-950" />}
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      </div>
    </Card>
  );
};
