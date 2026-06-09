export const pad = (value) => String(value).padStart(2, "0");

export const formatDateKey = (date = new Date()) => {
  const value = date instanceof Date ? date : new Date(date);
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
};

export const formatMonthKey = (date = new Date()) => {
  const value = date instanceof Date ? date : new Date(date);
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}`;
};

export const monthDays = (monthKey) => {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month, 0).getDate();
};

export const getMonthDateKeys = (monthKey) =>
  Array.from({ length: monthDays(monthKey) }, (_, index) => `${monthKey}-${pad(index + 1)}`);

export const countWorkingDays = (monthKey, weeklyOffDay = "") => {
  const off = weeklyOffDay?.toLowerCase();
  return getMonthDateKeys(monthKey).filter((dateKey) => {
    if (!off) return true;
    const day = new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    return day !== off;
  }).length;
};

export const toTimeLabel = (value) => {
  if (!value) return "--";
  const date = value?.toDate ? value.toDate() : new Date(value);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const toDateLabel = (value) => {
  if (!value) return "--";
  const date = value?.toDate ? value.toDate() : new Date(value);
  return date.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
};

export const minutesFromTime = (time = "10:00") => {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const minutesBetweenTimestamps = (start, end) => {
  const first = start?.toDate ? start.toDate() : new Date(start);
  const second = end?.toDate ? end.toDate() : new Date(end);
  if (Number.isNaN(first.getTime()) || Number.isNaN(second.getTime())) return 0;
  return Math.max(0, Math.round((second.getTime() - first.getTime()) / 60000));
};
