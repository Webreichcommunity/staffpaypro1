import { MonthFilter } from "../common/Filters";
import { Alert, Button } from "../common/UI";
import { getMonthDateKeys } from "../../utils/dateUtils";
import { getCalendarAttendanceStatus, getNextCalendarAttendanceStatus } from "../../utils/attendanceCalendarUtils";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const statusDetails = {
  present: { label: "Present", className: "border-green-300 bg-green-50 text-green-800" },
  absent: { label: "Absent", className: "border-red-300 bg-red-50 text-red-800" },
  "half-day": { label: "Half-day", className: "border-orange-300 bg-orange-50 text-orange-800" },
  normal: { label: "Normal", className: "border-gray-200 bg-white text-gray-700 hover:border-orange-300" },
};

export const StaffAttendanceCalendar = ({ month, records, onMonthChange, onStatusChange, onBulkChange, busy, error }) => {
  const dates = getMonthDateKeys(month);
  const recordsByDate = new Map(records.map((record) => [record.date, record]));
  const leadingBlankDays = new Date(`${dates[0]}T00:00:00`).getDay();

  return (
    <div>
      <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div className="w-full max-w-xs"><MonthFilter value={month} onChange={onMonthChange} /></div>
        <div className="flex flex-wrap gap-2">
          <Button loading={busy} tone="success" onClick={() => onBulkChange("present")}>Present All</Button>
          <Button disabled={busy} tone="danger" onClick={() => onBulkChange("absent")}>Absent All</Button>
          <Button disabled={busy} onClick={() => onBulkChange("half-day")}>Half-day All</Button>
          <Button disabled={busy} tone="light" onClick={() => onBulkChange(null)}>Restore All</Button>
        </div>
      </div>
      <Alert>Click a date repeatedly to cycle Normal → Present → Absent → Half-day → Normal. “Restore” keeps staff-recorded punch attendance intact.</Alert>
      {error && <div className="mt-3"><Alert tone="danger">{error}</Alert></div>}
      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wide text-gray-500 sm:gap-2 sm:text-xs">
        {WEEKDAYS.map((day) => <div key={day} className="truncate py-1" title={day}>{day.slice(0, 3)}</div>)}
        {Array.from({ length: leadingBlankDays }, (_, index) => <div key={`blank-${index}`} />)}
        {dates.map((dateKey) => {
          const record = recordsByDate.get(dateKey);
          const status = getCalendarAttendanceStatus(record);
          const details = statusDetails[status || "normal"];
          const date = new Date(`${dateKey}T00:00:00`);
          const dayName = WEEKDAYS[date.getDay()];
          return (
            <button
              key={dateKey}
              type="button"
              disabled={busy}
              aria-label={`${dateKey}, ${dayName}, ${details.label}`}
              title={`${dayName}, ${dateKey}: ${details.label}${record?.calendarOverride ? " (admin override)" : ""}`}
              onClick={() => onStatusChange(dateKey, getNextCalendarAttendanceStatus(status))}
              className={`min-h-20 rounded-lg border p-1.5 text-left transition disabled:cursor-wait disabled:opacity-60 sm:min-h-24 sm:p-2 ${details.className}`}
            >
              <span className="block text-base font-black sm:text-lg">{date.getDate()}</span>
              <span className="block truncate text-[9px] font-semibold sm:text-[11px]">{dayName}</span>
              <span className="mt-1 block truncate text-[9px] font-bold sm:text-xs">{details.label}</span>
              {record && <span className="mt-0.5 block truncate text-[8px] font-medium opacity-70 sm:text-[10px]">{record.calendarOverride ? "Admin" : record.markedBy || "Staff"}</span>}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-gray-600">
        {Object.entries(statusDetails).map(([key, details]) => <span key={key} className={`rounded-full border px-2.5 py-1 ${details.className}`}>{details.label}</span>)}
      </div>
    </div>
  );
};
