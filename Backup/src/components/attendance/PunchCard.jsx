import { CheckCircle2, Clock3, LocateFixed, MapPin, ShieldCheck } from "lucide-react";
import { Alert, Button, Card } from "../common/UI";

export const PunchCard = ({ state, shopName, distance, accuracy, radius, onPunchIn, onPunchOut, loading }) => (
  <Card className="overflow-hidden !p-0">
    <div className="border-b border-gray-100 bg-orange-50 p-4">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-green-100 text-green-700">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-green-700">Verification complete</p>
          <h2 className="mt-0.5 text-xl font-bold text-gray-950">{state.title}</h2>
          <p className="text-sm font-medium text-gray-700">{shopName || "Your shop"}</p>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-gray-700">{state.description}</p>
    </div>
    <div className="p-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          [MapPin, `${distance}m`, "From shop"],
          [LocateFixed, `${accuracy}m`, "GPS accuracy"],
          [ShieldCheck, `${radius}m`, "Allowed radius"],
        ].map(([Icon, value, label]) => (
          <div key={label} className="rounded-lg bg-gray-50 p-2 text-center ring-1 ring-gray-100">
            <Icon className="mx-auto h-4 w-4 text-orange-600" />
            <p className="mt-1 text-sm font-black text-gray-950">{value}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">{label}</p>
          </div>
        ))}
      </div>
      {state.action === "in" && <Button className="mt-4 w-full" loading={loading} onClick={onPunchIn}><Clock3 className="h-4 w-4" /> Confirm Punch In</Button>}
      {state.action === "out" && <Button className="mt-4 w-full" loading={loading} onClick={onPunchOut}><Clock3 className="h-4 w-4" /> Confirm Punch Out</Button>}
      {state.action === "done" && <div className="mt-4"><Alert>Attendance already completed for today.</Alert></div>}
    </div>
  </Card>
);
