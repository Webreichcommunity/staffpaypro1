import { countWorkingDays } from "./dateUtils.js";

const countLeaveDays = (leaves, month, weeklyOffDay) =>
  leaves.reduce((total, leave) => {
    const start = new Date(`${leave.fromDate}T00:00:00`);
    const end = new Date(`${leave.toDate || leave.fromDate}T00:00:00`);
    let count = 0;
    for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const isWeeklyOff = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase() === String(weeklyOffDay || "").toLowerCase();
      if (dateMonth === month && !isWeeklyOff) count += 1;
    }
    return total + count;
  }, 0);

export const calculateSalary = ({
  staff,
  month,
  shop,
  attendanceRecords = [],
  approvedLeaves = [],
  bonus = 0,
  overtimeAmount = 0,
  advanceDeduction = 0,
  otherDeduction = 0,
  note = "",
}) => {
  const monthlySalary = Number(staff?.monthlySalary || 0);
  const workingDays = countWorkingDays(month, shop?.weeklyOffDay || "Sunday") || 1;
  const configuredPaidOffDays = Number(shop?.monthlyPaidOffDays ?? 4);
  const monthlyPaidOffDays = Number.isFinite(configuredPaidOffDays) ? Math.max(0, configuredPaidOffDays) : 4;
  const presentDays = attendanceRecords.filter((record) => record.status === "present" || record.dayStatus === "full-day").length;
  const lateDays = attendanceRecords.filter((record) => record.isLate || record.status === "late").length;
  const halfDays = attendanceRecords.filter((record) => record.dayStatus === "half-day" || record.status === "half-day").length;
  const absentDays = attendanceRecords.filter((record) => record.status === "absent" || record.dayStatus === "absent").length;
  const paidLeaves = countLeaveDays(approvedLeaves.filter((leave) => leave.leaveType?.toLowerCase().includes("paid") && !leave.leaveType?.toLowerCase().includes("unpaid")), month, shop?.weeklyOffDay);
  const unpaidLeaves = countLeaveDays(approvedLeaves.filter((leave) => leave.leaveType?.toLowerCase().includes("unpaid")), month, shop?.weeklyOffDay);
  const perDaySalary = monthlySalary / workingDays;
  const unpaidAbsenceDaysBeforeAllowance = Math.max(0, workingDays - presentDays - paidLeaves - unpaidLeaves - halfDays);
  const paidOffDaysUsed = Math.min(monthlyPaidOffDays, unpaidAbsenceDaysBeforeAllowance);
  const salaryDeductedAbsentDays = Math.max(0, unpaidAbsenceDaysBeforeAllowance - paidOffDaysUsed);
  const payableDays = Math.min(workingDays, presentDays + paidLeaves + paidOffDaysUsed + halfDays * 0.5);
  const attendanceSalary = payableDays * perDaySalary;
  const absentDeduction = Math.max(0, monthlySalary - attendanceSalary);
  const halfDayDeduction = halfDays * perDaySalary * 0.5;
  const leaveDeduction = unpaidLeaves * perDaySalary;
  const grossSalary = attendanceSalary + Number(bonus) + Number(overtimeAmount);
  const totalDeductions = Number(advanceDeduction) + Number(otherDeduction);
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  return {
    monthlySalary,
    workingDays,
    monthlyPaidOffDays,
    paidOffDaysUsed,
    salaryDeductedAbsentDays,
    presentDays,
    absentDays,
    halfDays,
    paidLeaves,
    unpaidLeaves,
    lateDays,
    perDaySalary,
    payableDays,
    attendanceSalary,
    absentDeduction,
    halfDayDeduction,
    leaveDeduction,
    bonus: Number(bonus),
    overtimeAmount: Number(overtimeAmount),
    advanceDeduction: Number(advanceDeduction),
    otherDeduction: Number(otherDeduction),
    grossSalary,
    totalDeductions,
    netSalary,
    paymentStatus: "pending",
    note,
  };
};

export const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const pdfMoney = (value) =>
  `Rs. ${new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0))}`;
