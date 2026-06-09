import { money } from "../../utils/salaryUtils";

export const SalarySlipTemplate = ({ report, shop, staff }) => (
  <div className="salary-slip w-full overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-900">
    <div className="border-b border-orange-100 bg-orange-50 p-3.5 sm:p-4">
      <p className="text-lg font-bold text-gray-950">{shop?.shopName || "StaffPay Pro"}</p>
      <p className="text-xs font-medium text-gray-600">{shop?.address || "Salary Slip"}</p>
    </div>
    <div className="grid grid-cols-2 gap-3 border-b border-gray-100 p-3.5 sm:p-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Staff</p>
        <p className="break-words text-sm font-bold">{staff?.name || report?.staffName}</p>
        <p className="break-words text-xs text-gray-600">{staff?.designation || report?.designation}</p>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Month</p>
        <p className="text-sm font-bold">{report?.month}</p>
        <p className="text-xs capitalize text-gray-600">Payment: {report?.paymentStatus}</p>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-3.5 text-xs sm:p-4">
      {[
            ["Basic salary", money(report?.monthlySalary)],
            ["Working days", report?.workingDays],
            ["Payable days", report?.payableDays || 0],
            ["Paid off-days used", `${report?.paidOffDaysUsed || 0} of ${report?.monthlyPaidOffDays || 0}`],
            ["Salary-deducted absence days", report?.salaryDeductedAbsentDays || 0],
            ["Present / Absent / Half days", `${report?.presentDays || 0} / ${report?.absentDays || 0} / ${report?.halfDays || 0}`],
            ["Paid / Unpaid leaves", `${report?.paidLeaves || 0} / ${report?.unpaidLeaves || 0}`],
            ["Attendance earned salary", money(report?.attendanceSalary)],
            ["Attendance / leave deduction", money(report?.absentDeduction)],
            ["Bonus + Overtime", money(Number(report?.bonus || 0) + Number(report?.overtimeAmount || 0))],
            ["Advance deduction", money(report?.advanceDeduction)],
            ["Other deduction", money(report?.otherDeduction)],
      ].map(([label, value]) => (
        <div key={label} className="min-w-0 border-b border-gray-100 pb-2">
          <p className="font-medium leading-4 text-gray-600">{label}</p>
          <p className="mt-0.5 break-words font-bold leading-4 text-gray-950">{value}</p>
        </div>
      ))}
    </div>
    <div className="flex items-center justify-between gap-3 border-t border-orange-100 bg-orange-50 p-3.5 sm:p-4">
      <div>
        <p className="text-xs font-semibold text-gray-600">Net payable salary</p>
        {report?.note && <p className="mt-0.5 max-w-48 break-words text-xs text-gray-600">{report.note}</p>}
      </div>
      <p className="text-xl font-bold text-orange-700">{money(report?.netSalary)}</p>
    </div>
  </div>
);
