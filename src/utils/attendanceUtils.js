const positiveHours = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
};

export const calculatePunchOutOutcome = ({ totalMinutes = 0, shop = {}, isLate = false } = {}) => {
  const workedMinutes = Math.max(0, Number(totalMinutes) || 0);
  const fullDayMinutes = Math.round(positiveHours(shop.fullDayHours, 8) * 60);
  const halfDayMinutes = Math.round(positiveHours(shop.halfDayHours, 4) * 60);
  const totalWorkingHours = Number((workedMinutes / 60).toFixed(2));
  const isHalfDay = halfDayMinutes > 0 && workedMinutes <= halfDayMinutes;
  const dayStatus = isHalfDay ? "half-day" : "full-day";

  return {
    totalWorkingHours,
    dayStatus,
    status: isHalfDay ? "half-day" : isLate ? "late" : "present",
    metConfiguredFullDayHours: fullDayMinutes > 0 ? workedMinutes >= fullDayMinutes : true,
  };
};
