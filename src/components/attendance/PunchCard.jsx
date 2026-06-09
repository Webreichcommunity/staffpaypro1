import { QrCode, TimerReset } from "lucide-react";
import { Alert, Button, Card } from "../common/UI";

export const PunchCard = ({ state, distance, onPunchIn, onPunchOut, loading }) => (
  <Card className="overflow-hidden">
    <div className="flex items-start gap-4">
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-orange-600 text-white shadow-orange-glow">
        <QrCode className="h-7 w-7" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold text-gray-950">{state.title}</p>
        <p className="mt-1 text-sm text-gray-500">{state.description}</p>
        {Number.isFinite(distance) && (
          <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
            <TimerReset className="h-3.5 w-3.5" />
            {distance}m from shop
          </p>
        )}
      </div>
    </div>
    <div className="mt-5">
      {state.action === "in" && <Button className="w-full !min-h-14 text-base" loading={loading} onClick={onPunchIn}>Punch In</Button>}
      {state.action === "out" && <Button className="w-full !min-h-14 text-base" loading={loading} onClick={onPunchOut}>Punch Out</Button>}
      {state.action === "done" && <Alert>Attendance already completed for today.</Alert>}
    </div>
  </Card>
);
