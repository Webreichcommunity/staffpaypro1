export const getCalendarAttendanceStatus = (record) => {
  if (!record) return null;
  if (record.status === "absent" || record.dayStatus === "absent") return "absent";
  if (record.status === "half-day" || record.dayStatus === "half-day") return "half-day";
  if (["present", "late"].includes(record.status) || record.dayStatus === "full-day") return "present";
  return null;
};

export const getNextCalendarAttendanceStatus = (status) => {
  if (!status) return "present";
  if (status === "present") return "absent";
  if (status === "absent") return "half-day";
  return null;
};
