import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button, Card } from "../common/UI";

export const QRScanner = ({ onResult }) => {
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!active) return undefined;
    const scanner = new Html5Qrcode("staffpay-qr-reader");
    scannerRef.current = scanner;
    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await scanner.stop().catch(() => {});
          setActive(false);
          onResult(decodedText);
        },
      )
      .catch(() => setError("Camera permission denied. Please allow camera access to scan the shop QR."));

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [active, onResult]);

  return (
    <Card>
      <div className="grid gap-4">
        <Button className="w-full !min-h-14 text-base" onClick={() => setActive(true)}>
          Scan QR
        </Button>
        {active && <div id="staffpay-qr-reader" className="overflow-hidden rounded-2xl bg-gray-950" />}
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      </div>
    </Card>
  );
};
