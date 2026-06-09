import { money } from "../../utils/salaryUtils";

export const SalarySlipTemplate = ({ report, shop, staff }) => (
  <div className="salary-slip rounded-2xl bg-[#fffaf3] p-6 text-gray-900">
    <div className="rounded-2xl bg-orange-600 p-5 text-white">
      <p className="text-2xl font-bold">{shop?.shopName || "StaffPay Pro"}</p>
      <p className="text-sm text-orange-100">{shop?.address || "Salary Slip"}</p>
    </div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <div>
        <p className="text-xs uppercase text-gray-500">Staff</p>
        <p className="font-bold">{staff?.name || report?.staffName}</p>
        <p className="text-sm text-gray-500">{staff?.designation || report?.designation}</p>
      </div>
      <div className="sm:text-right">
        <p className="text-xs uppercase text-gray-500">Month</p>
        <p className="font-bold">{report?.month}</p>
        <p className="text-sm text-gray-500">Payment: {report?.paymentStatus}</p>
      </div>
    </div>
    <div className="mt-5 overflow-hidden rounded-2xl border border-orange-100">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-orange-100">
          {[
            ["Basic salary", money(report?.monthlySalary)],
            ["Working days", report?.workingDays],
            ["Payable days", report?.payableDays || 0],
            ["Present / Absent / Half days", `${report?.presentDays || 0} / ${report?.absentDays || 0} / ${report?.halfDays || 0}`],
            ["Paid / Unpaid leaves", `${report?.paidLeaves || 0} / ${report?.unpaidLeaves || 0}`],
            ["Attendance earned salary", money(report?.attendanceSalary)],
            ["Bonus + Overtime", money(Number(report?.bonus || 0) + Number(report?.overtimeAmount || 0))],
            ["Advance deduction", money(report?.advanceDeduction)],
            ["Other deduction", money(report?.otherDeduction)],
          ].map(([label, value]) => (
            <tr key={label}>
              <td className="bg-white/60 px-4 py-3 font-medium text-gray-600">{label}</td>
              <td className="px-4 py-3 text-right font-bold text-gray-950">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="mt-5 rounded-2xl bg-gray-950 p-5 text-white">
      <p className="text-sm text-gray-300">Net payable salary</p>
      <p className="text-3xl font-bold text-orange-300">{money(report?.netSalary)}</p>
      {report?.note && <p className="mt-2 text-sm text-gray-300">{report.note}</p>}
    </div>
  </div>
);
