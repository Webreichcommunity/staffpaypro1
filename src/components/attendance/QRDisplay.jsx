import { QRCodeCanvas } from "qrcode.react";
import { Card } from "../common/UI";

export const QRDisplay = ({ value, countdown, shopName }) => (
  <Card className="text-center ring-2 ring-orange-200/80">
    <div className="mx-auto grid aspect-square max-w-sm place-items-center rounded-3xl border border-orange-200 bg-white p-5 shadow-orange-glow">
      {value ? <QRCodeCanvas value={value} size={280} includeMargin level="H" /> : <div className="h-64 w-64 animate-pulse rounded-2xl bg-orange-50" />}
    </div>
    <p className="mt-5 text-lg font-bold text-gray-950">{shopName || "Live QR Attendance"}</p>
    <p className="mt-1 text-sm text-gray-500">QR refreshes in {countdown}s</p>
  </Card>
);
