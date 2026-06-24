import { AlertTriangle, CheckCircle2, Loader2, Search, X } from "lucide-react";

const toneMap = {
  orange: "bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-200",
  dark: "bg-gray-800 text-white hover:bg-gray-900 focus:ring-gray-300",
  light: "bg-white text-gray-800 ring-1 ring-gray-200 hover:bg-gray-50",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-300",
  success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-300",
};

const badgeMap = {
  present: "bg-green-100 text-green-700 ring-green-200",
  late: "bg-amber-100 text-amber-700 ring-amber-200",
  absent: "bg-red-100 text-red-700 ring-red-200",
  "half-day": "bg-orange-100 text-orange-700 ring-orange-200",
  pending: "bg-amber-100 text-amber-700 ring-amber-200",
  approved: "bg-green-100 text-green-700 ring-green-200",
  rejected: "bg-red-100 text-red-700 ring-red-200",
  paid: "bg-green-100 text-green-700 ring-green-200",
  partial: "bg-blue-100 text-blue-700 ring-blue-200",
};

export const Button = ({ children, tone = "orange", className = "", loading, type = "button", ...props }) => (
  <button
    type={type}
    className={`inline-flex min-h-9 max-w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-center text-sm font-semibold leading-5 shadow-sm outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 [&>svg]:shrink-0 ${toneMap[tone]} ${className}`}
    disabled={loading || props.disabled}
    {...props}
  >
    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
    {children}
  </button>
);

export const IconButton = ({ children, label, className = "", ...props }) => (
  <button
    aria-label={label}
    title={label}
    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-50 hover:text-orange-700 ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const Input = ({ label, className = "", ...props }) => (
  <label className="grid min-w-0 gap-1.5 text-sm font-medium text-gray-700">
    {label && <span>{label}</span>}
    <input
      className={`min-h-10 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 ${className}`}
      {...props}
    />
  </label>
);

export const Select = ({ label, children, className = "", ...props }) => (
  <label className="grid min-w-0 gap-1.5 text-sm font-medium text-gray-700">
    {label && <span>{label}</span>}
    <select
      className={`min-h-10 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 ${className}`}
      {...props}
    >
      {children}
    </select>
  </label>
);

export const Textarea = ({ label, className = "", ...props }) => (
  <label className="grid min-w-0 gap-1.5 text-sm font-medium text-gray-700">
    {label && <span>{label}</span>}
    <textarea
      className={`min-h-20 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 ${className}`}
      {...props}
    />
  </label>
);

export const Card = ({ children, className = "" }) => (
  <section className={`min-w-0 rounded-lg border border-gray-200 bg-white p-3.5 shadow-sm sm:p-4 ${className}`}>{children}</section>
);

export const StatCard = ({ icon: Icon, label, value, helper, tone = "orange" }) => (
  <Card className="overflow-hidden">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-bold text-gray-700">{label}</p>
        <p className="mt-1 break-words text-xl font-bold text-gray-950 sm:text-2xl">{value}</p>
        {helper && <p className="mt-1 text-xs font-medium leading-4 text-gray-600">{helper}</p>}
      </div>
      {Icon && (
        <div className={`rounded-lg p-2 ${tone === "dark" ? "bg-gray-800 text-white" : "bg-orange-50 text-orange-700"}`}>
          <Icon className="h-4 w-4" />
        </div>
      )}
    </div>
  </Card>
);

export const Badge = ({ children, tone }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${badgeMap[tone] || "bg-gray-100 text-gray-700 ring-gray-200"}`}>
    {children}
  </span>
);

export const Loader = ({ label = "Loading StaffPay Pro" }) => (
  <div className="grid min-h-screen place-items-center bg-stone-50">
    <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-gray-700 shadow-soft">
      <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
      {label}
    </div>
  </div>
);

export const EmptyState = ({ title = "No records found", description = "New records will appear here." }) => (
  <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60 p-6 text-center sm:p-8">
    <p className="font-semibold text-gray-950">{title}</p>
    <p className="mt-1 text-sm font-medium text-gray-700">{description}</p>
  </div>
);

export const Alert = ({ children, tone = "warning" }) => {
  const isError = tone === "danger";
  return (
    <div className={`flex gap-2.5 rounded-xl p-3 text-sm ${isError ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-800"}`}>
      {isError ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
      <div>{children}</div>
    </div>
  );
};

export const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 grid items-end bg-gray-950/50 sm:place-items-center sm:p-4">
    <div className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-950">{title}</h2>
        <IconButton label="Close" onClick={onClose}>
          <X className="h-4 w-4" />
        </IconButton>
      </div>
      {children}
    </div>
  </div>
);

const rowKey = (row) => row.id || row.uid || row.staffId || JSON.stringify(row);
const renderCell = (row, column) => {
  if (column.render) return column.render(row);
  return row[column.key] ?? "--";
};

export const Table = ({ columns, rows, emptyText = "No records found" }) => (
  <div className="min-w-0">
    <div className="grid gap-3 md:hidden">
      {rows.length ? rows.map((row) => (
        <article key={rowKey(row)} className="min-w-0 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <div className="grid gap-3">
            {columns.map((column) => (
              <div key={column.key} className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{column.label}</p>
                <div className="mt-1 break-words text-sm font-semibold text-gray-800 [&_.flex]:flex-wrap [&_button]:min-w-0">
                  {renderCell(row, column)}
                </div>
              </div>
            ))}
          </div>
        </article>
      )) : (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white p-6 text-center text-sm font-semibold text-gray-600">{emptyText}</div>
      )}
    </div>
    <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white md:block">
      <div className="overflow-x-auto">
      <table className="min-w-full whitespace-nowrap text-sm">
        <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase tracking-wide text-gray-600">
          <tr>{columns.map((column) => <th key={column.key} className="px-3 py-2.5">{column.label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length ? rows.map((row) => (
            <tr key={rowKey(row)} className="align-top hover:bg-orange-50/40">
              {columns.map((column) => <td key={column.key} className="max-w-72 px-3 py-2.5 text-gray-700 [&_.flex]:flex-nowrap">{renderCell(row, column)}</td>)}
            </tr>
          )) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center font-medium text-gray-600">{emptyText}</td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  </div>
);

export const SearchBox = ({ value, onChange, placeholder = "Search" }) => (
  <div className="relative min-w-0">
    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
    <input
      className="min-h-10 w-full min-w-0 rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
  </div>
);
