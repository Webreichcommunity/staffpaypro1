import { MapPin } from "lucide-react";
import { Card } from "../common/UI";

export const LocationPermissionBox = () => (
  <Card className="bg-orange-50/80">
    <div className="flex gap-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-600 text-white">
        <MapPin className="h-5 w-5" />
      </div>
      <div>
        <p className="font-bold text-gray-950">Location permission is required for attendance verification</p>
        <p className="mt-1 text-sm text-gray-600">
          Please turn ON location to mark attendance. Your location is used only for attendance verification.
        </p>
      </div>
    </div>
  </Card>
);
