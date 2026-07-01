import { monthDays } from "./dateUtils.js";

const countLeaveDays = (leaves, month) =>
  leaves.reduce((total, leave) => {
    const start = new Date(`${leave.fromDate}T00:00:00`);
    const end = new Date(`${leave.toDate || leave.fromDate}T00:00:00`);
    let count = 0;
    for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (dateMonth === month) count += 1;
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
  const calendarDays = monthDays(month) || 1;
  const configuredExtraDays = Number(shop?.monthlyExtraPaidDays ?? shop?.monthlyPaidOffDays ?? 4);
  const monthlyExtraPaidDays = Number.isFinite(configuredExtraDays) ? Math.max(0, configuredExtraDays) : 4;
  const isHalfDay = (record) => record.dayStatus === "half-day" || record.status === "half-day";
  const isAbsent = (record) => record.status === "absent" || record.dayStatus === "absent";
  const presentDays = attendanceRecords.filter((record) => !isHalfDay(record) && !isAbsent(record) && (["present", "late"].includes(record.status) || record.dayStatus === "full-day")).length;
  const lateDays = attendanceRecords.filter((record) => record.isLate || record.status === "late").length;
  const halfDays = attendanceRecords.filter(isHalfDay).length;
  const absentDays = attendanceRecords.filter((record) => !isHalfDay(record) && isAbsent(record)).length;
  const paidLeaves = countLeaveDays(approvedLeaves.filter((leave) => leave.leaveType?.toLowerCase().includes("paid") && !leave.leaveType?.toLowerCase().includes("unpaid")), month);
  const unpaidLeaves = countLeaveDays(approvedLeaves.filter((leave) => leave.leaveType?.toLowerCase().includes("unpaid")), month);
  const perDaySalary = monthlySalary / calendarDays;
  const paidBaseDays = Math.min(calendarDays, presentDays + paidLeaves + halfDays * 0.5);
  const salaryDeductedAbsentDays = Math.max(0, calendarDays - paidBaseDays);
  const payableDays = paidBaseDays + monthlyExtraPaidDays;
  const baseEarnedSalary = paidBaseDays * perDaySalary;
  const extraSalaryAmount = monthlyExtraPaidDays * perDaySalary;
  const attendanceSalary = baseEarnedSalary + extraSalaryAmount;
  const absentDeduction = Math.max(0, monthlySalary - baseEarnedSalary);
  const halfDayDeduction = halfDays * perDaySalary * 0.5;
  const leaveDeduction = unpaidLeaves * perDaySalary;
  const grossSalary = attendanceSalary + Number(bonus) + Number(overtimeAmount);
  const totalDeductions = Number(advanceDeduction) + Number(otherDeduction);
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  return {
    monthlySalary,
    calendarDays,
    workingDays: calendarDays,
    monthlyExtraPaidDays,
    extraSalaryAmount,
    baseEarnedSalary,
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
