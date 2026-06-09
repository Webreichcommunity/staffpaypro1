import { QRCodeCanvas } from "qrcode.react";
import { Card } from "../common/UI";

export const QRDisplay = ({ value, countdown, shopName }) => (
  <Card className="text-center">
    <div className="mx-auto grid aspect-square w-full max-w-xs place-items-center rounded-xl border border-orange-200 bg-orange-50 p-3">
      {value ? <QRCodeCanvas value={value} size={260} includeMargin level="H" className="h-auto w-full max-w-[260px]" /> : <div className="aspect-square w-full max-w-56 animate-pulse rounded-lg bg-white" />}
    </div>
    <p className="mt-3 font-bold text-gray-950">{shopName || "Live QR Attendance"}</p>
    <p className="mt-0.5 text-xs font-semibold text-gray-600">QR refreshes in {countdown}s</p>
  </Card>
);
