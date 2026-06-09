import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, ScanLine, ShieldCheck } from "lucide-react";
import { Button } from "../common/UI";

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
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-orange-600">Attendance scanner</p>
          <h2 className="mt-0.5 text-lg font-bold text-gray-950">{active ? "Point camera at shop QR" : "Ready to scan"}</h2>
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-orange-50 text-orange-700">
          {active ? <ScanLine className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
        </div>
      </div>

      <div className="relative min-h-56 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 sm:min-h-64">
        {active ? (
          <>
            <div id="staffpay-qr-reader" className="h-full min-h-56 overflow-hidden rounded-xl bg-gray-900 sm:min-h-64 [&_video]:min-h-56 [&_video]:object-cover sm:[&_video]:min-h-64" />
            <div className="pointer-events-none absolute inset-0">
              <span className="absolute left-7 top-7 h-12 w-12 rounded-tl-2xl border-l-4 border-t-4 border-orange-400" />
              <span className="absolute right-7 top-7 h-12 w-12 rounded-tr-2xl border-r-4 border-t-4 border-orange-400" />
              <span className="absolute bottom-7 left-7 h-12 w-12 rounded-bl-2xl border-b-4 border-l-4 border-orange-400" />
              <span className="absolute bottom-7 right-7 h-12 w-12 rounded-br-2xl border-b-4 border-r-4 border-orange-400" />
            </div>
          </>
        ) : (
          <div className="grid min-h-56 place-items-center px-5 text-center sm:min-h-64">
            <div>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-orange-50 text-orange-700 ring-1 ring-orange-100">
                <ScanLine className="h-7 w-7" />
              </div>
              <p className="mt-3 font-bold text-gray-950">Scan the live QR at your shop</p>
              <p className="mx-auto mt-1 max-w-xs text-sm font-medium leading-5 text-gray-600">Keep the QR inside the frame. Verification starts automatically.</p>
            </div>
          </div>
        )}
      </div>

      <Button className="mt-3 w-full" disabled={active} onClick={() => { setError(""); setActive(true); }}>
        <ScanLine className="h-5 w-5" />
        {active ? "Scanning QR..." : "Open Camera and Scan"}
      </Button>
      <div className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-gray-600">
        <ShieldCheck className="h-4 w-4 text-green-600" />
        Secure QR and location verification
      </div>
      {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
    </section>
  );
};
