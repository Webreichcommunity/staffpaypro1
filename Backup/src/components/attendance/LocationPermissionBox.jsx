import { LocateFixed, MapPin, ShieldCheck } from "lucide-react";

export const LocationPermissionBox = ({ compact = false }) => (
  <section className={`rounded-xl border border-orange-200 bg-orange-50 ${compact ? "p-3" : "p-3.5"}`}>
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-orange-700 ring-1 ring-orange-200">
        <LocateFixed className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-black text-gray-950">Turn on precise location</p>
        <p className="mt-0.5 text-sm font-medium leading-5 text-gray-700">
          Your GPS confirms that you are inside the shop attendance radius before punch in or punch out.
        </p>
        {!compact && (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-800 ring-1 ring-orange-200">
              <MapPin className="h-3.5 w-3.5 text-orange-600" /> Shop radius checked
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-800 ring-1 ring-orange-200">
              <ShieldCheck className="h-3.5 w-3.5 text-green-600" /> Used only for attendance
            </span>
          </div>
        )}
      </div>
    </div>
  </section>
);
