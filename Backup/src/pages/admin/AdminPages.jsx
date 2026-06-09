import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import {
  Banknote,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Download,
  HandCoins,
  MapPin,
  Pencil,
  Plus,
  QrCode,
  ReceiptText,
  RefreshCw,
  Trash2,
  Users,
  WalletCards,
} from "lucide-react";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../Firebase/config";
import { AttendanceStatusBadge } from "../../components/attendance/AttendanceStatusBadge";
import { QRDisplay } from "../../components/attendance/QRDisplay";
import { DateFilter, MonthFilter } from "../../components/common/Filters";
import { Alert, Badge, Button, Card, EmptyState, Input, Modal, SearchBox, Select, StatCard, Table, Textarea } from "../../components/common/UI";
import { PaymentModal } from "../../components/salary/PaymentModal";
import { SalarySlipTemplate } from "../../components/salary/SalarySlipTemplate";
import { StaffForm } from "../../components/staff/StaffForm";
import { AboutWebReich } from "../../components/common/Brand";
import { useAuth } from "../../hooks/useAuth";
import { createStaffAccount } from "../../services/authService";
import {
  correctAttendance,
  createAttendanceToken,
  deleteAdvance,
  deletePayment,
  deleteSalaryReport,
  deleteStaff,
  fetchAttendanceForDate,
  finalizeAttendance,
  generateSalaryReport,
  getShop,
  listenAttendanceForDate,
  recordAdvance,
  recordPayment,
  saveBulkManualAttendance,
  saveShopSettings,
  updateAdvance,
  updateLeaveStatus,
  updatePayment,
  updateSalaryReport,
  updateStaff,
} from "../../services/firestoreService";
import { exportToCsv } from "../../utils/csvUtils";
import { formatDateKey, formatMonthKey, getMonthDateKeys, toTimeLabel } from "../../utils/dateUtils";
import { getBrowserLocation, normalizeLocation } from "../../utils/locationUtils";
import { money, pdfMoney } from "../../utils/salaryUtils";

const useShopId = () => {
  const { userProfile, currentUser } = useAuth();
  return userProfile?.shopId || currentUser?.uid;
};

const useAdminSnapshot = () => {
  const shopId = useShopId();
  const [staff, setStaff] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [reports, setReports] = useState([]);
  const [payments, setPayments] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [shop, setShop] = useState(null);

  useEffect(() => {
    if (!shopId) return undefined;
    getShop(shopId).then(setShop);
    const unsubs = [
      onSnapshot(query(collection(db, "staff"), where("shopId", "==", shopId)), (snapshot) => setStaff(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))),
      onSnapshot(query(collection(db, "leaves"), where("shopId", "==", shopId)), (snapshot) => setLeaves(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))),
      onSnapshot(query(collection(db, "salaryReports"), where("shopId", "==", shopId)), (snapshot) => setReports(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))),
      onSnapshot(query(collection(db, "payments"), where("shopId", "==", shopId)), (snapshot) => setPayments(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))),
      onSnapshot(query(collection(db, "advances"), where("shopId", "==", shopId)), (snapshot) => setAdvances(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))),
    ];
    return () => unsubs.forEach((unsubscribe) => unsubscribe());
  }, [shopId]);

  return { shopId, shop, staff, leaves, reports, payments, advances };
};

const PageHeader = ({ title, subtitle, action }) => (
  <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
    <div className="min-w-0">
      <h2 className="text-xl font-bold text-gray-950 sm:text-2xl">{title}</h2>
      {subtitle && <p className="mt-0.5 max-w-3xl text-sm font-medium leading-5 text-gray-600">{subtitle}</p>}
    </div>
    {action && <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">{action}</div>}
  </div>
);

const AdvanceModal = ({ staff, advance, onClose, onSubmit }) => {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
  const [values, setValues] = useState({
    amount: advance?.amount || "",
    advanceDate: advance?.advanceDate || formatDateKey(),
    deductionMonth: advance?.deductionMonth || formatMonthKey(nextMonth),
    notes: advance?.notes || "",
  });
  return (
    <Modal title={`${advance ? "Edit" : "Record"} advance: ${staff?.name}`} onClose={onClose}>
      <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); onSubmit(values); }}>
        <Input label="Advance amount" type="number" min="1" required value={values.amount} onChange={(event) => setValues({ ...values, amount: event.target.value })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Advance payment date" type="date" required value={values.advanceDate} onChange={(event) => setValues({ ...values, advanceDate: event.target.value })} />
          <Input label="Deduct from salary month" type="month" required value={values.deductionMonth} onChange={(event) => setValues({ ...values, deductionMonth: event.target.value })} />
        </div>
        <Textarea label="Reason / note (optional)" value={values.notes} onChange={(event) => setValues({ ...values, notes: event.target.value })} />
        <Button type="submit">{advance ? "Update Advance" : "Save Advance"}</Button>
      </form>
    </Modal>
  );
};

const SalaryReportEditModal = ({ report, onClose, onSubmit }) => {
  const [values, setValues] = useState({
    bonus: report.bonus || 0,
    overtimeAmount: report.overtimeAmount || 0,
    otherDeduction: report.otherDeduction || 0,
    note: report.note || "",
  });
  return (
    <Modal title={`Edit salary report: ${report.staffName}`} onClose={onClose}>
      <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); onSubmit(values); }}>
        <Alert>Attendance-earned salary and recorded advance deductions are calculated automatically and cannot be changed here.</Alert>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Bonus" type="number" value={values.bonus} onChange={(event) => setValues({ ...values, bonus: event.target.value })} />
          <Input label="Overtime amount" type="number" value={values.overtimeAmount} onChange={(event) => setValues({ ...values, overtimeAmount: event.target.value })} />
          <Input label="Other deduction" type="number" value={values.otherDeduction} onChange={(event) => setValues({ ...values, otherDeduction: event.target.value })} />
          <Input label="Recorded advance deduction" disabled value={money(report.advanceDeduction)} />
        </div>
        <Textarea label="Note (optional)" value={values.note} onChange={(event) => setValues({ ...values, note: event.target.value })} />
        <Button type="submit">Update Salary Report</Button>
      </form>
    </Modal>
  );
};

const fetchMonthAttendance = async (shopId, staffId, month) => {
  const all = await Promise.all(getMonthDateKeys(month).map((dateKey) => fetchAttendanceForDate(shopId, dateKey).catch(() => [])));
  return all.flat().filter((record) => !staffId || record.staffId === staffId);
};

const downloadSalaryPdf = ({ report, shop, staff }) => {
  const pdf = new jsPDF();
  pdf.setFillColor(17, 24, 39);
  pdf.rect(0, 0, 210, 38, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  pdf.text(shop?.shopName || "StaffPay Pro", 14, 16);
  pdf.setFontSize(10);
  pdf.text(`${shop?.address || ""} ${shop?.city || ""}`.trim(), 14, 24);
  pdf.text(`SALARY SLIP | ${report.month}`, 14, 32);
  pdf.setTextColor(17, 24, 39);
  pdf.setFontSize(11);
  const rows = [
    ["Staff", staff?.name || report.staffName],
    ["Designation", staff?.designation || report.designation || "-"],
    ["Monthly Salary", pdfMoney(report.monthlySalary)],
    ["Working Days", String(report.workingDays || 0)],
    ["Payable Days", String(report.payableDays || 0)],
    ["Paid Off Days Used", String(report.paidOffDaysUsed || 0)],
    ["Salary-Deducted Absence Days", String(report.salaryDeductedAbsentDays || 0)],
    ["Present / Absent / Half Days", `${report.presentDays || 0} / ${report.absentDays || 0} / ${report.halfDays || 0}`],
    ["Paid / Unpaid Leaves", `${report.paidLeaves || 0} / ${report.unpaidLeaves || 0}`],
    ["Attendance Salary", pdfMoney(report.attendanceSalary)],
    ["Attendance / Leave Deduction", pdfMoney(report.absentDeduction)],
    ["Bonus", pdfMoney(report.bonus)],
    ["Overtime", pdfMoney(report.overtimeAmount)],
    ["Advance Deduction", pdfMoney(report.advanceDeduction)],
    ["Other Deduction", pdfMoney(report.otherDeduction)],
    ["Net Payable", pdfMoney(report.netSalary)],
    ["Payment Status", String(report.paymentStatus || "pending").toUpperCase()],
  ];
  let y = 50;
  rows.forEach(([label, value], index) => {
    if (index % 2 === 0) {
      pdf.setFillColor(255, 247, 237);
      pdf.rect(12, y - 6, 186, 9, "F");
    }
    pdf.setFont(undefined, "bold");
    pdf.text(label, 14, y);
    pdf.setFont(undefined, "normal");
    pdf.text(String(value), 112, y);
    y += 9;
  });
  pdf.setFillColor(249, 115, 22);
  pdf.rect(12, y + 2, 186, 18, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont(undefined, "bold");
  pdf.setFontSize(15);
  pdf.text(`NET PAYABLE: ${pdfMoney(report.netSalary)}`, 18, y + 13);
  pdf.save(`${report.staffName || "staff"}-${report.month}-salary-slip.pdf`);
};

export const AdminDashboard = () => {
  const { shopId, staff, leaves, reports } = useAdminSnapshot();
  const [todayAttendance, setTodayAttendance] = useState([]);

  useEffect(() => {
    if (!shopId) return undefined;
    return listenAttendanceForDate(shopId, formatDateKey(), setTodayAttendance);
  }, [shopId]);

  const activeStaff = staff.filter((member) => member.isActive);
  const pendingLeaves = leaves.filter((leave) => leave.status === "pending");
  const present = todayAttendance.filter((record) => ["present", "late", "half-day"].includes(record.status));
  const late = todayAttendance.filter((record) => record.isLate || record.status === "late");
  const absent = Math.max(0, activeStaff.length - present.length);
  const salaryPending = reports.filter((report) => report.month === formatMonthKey() && report.paymentStatus !== "paid");

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard icon={Users} label="Total Staff" value={activeStaff.length} />
        <StatCard icon={CheckCircle2} label="Present Today" value={present.length} />
        <StatCard icon={CalendarCheck} label="Absent Today" value={absent} />
        <StatCard icon={Clock3} label="Late Today" value={late.length} />
        <StatCard icon={RefreshCw} label="Pending Leaves" value={pendingLeaves.length} />
        <StatCard icon={Banknote} label="Salary Pending" value={salaryPending.length} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-gray-950">Today Attendance Summary</h3>
            <Badge tone="present">{formatDateKey()}</Badge>
          </div>
          <Table
            columns={[
              { key: "staffId", label: "Staff", render: (row) => staff.find((item) => item.uid === row.staffId)?.name || row.staffId },
              { key: "status", label: "Status", render: (row) => <AttendanceStatusBadge status={row.status} /> },
              { key: "punchInTime", label: "Punch In", render: (row) => toTimeLabel(row.punchInTime) },
              { key: "punchOutTime", label: "Punch Out", render: (row) => toTimeLabel(row.punchOutTime) },
            ]}
            rows={todayAttendance.slice(0, 8)}
          />
        </Card>
        <Card>
          <h3 className="mb-4 font-bold text-gray-950">Quick Actions</h3>
          <div className="grid gap-3">
            <Link to="/admin/staff/new">
              <Button className="w-full" tone="dark"><Plus className="h-4 w-4" /> Add Staff</Button>
            </Link>
            <Link to="/admin/live-qr"><Button className="w-full"><QrCode className="h-4 w-4" /> Open Live QR</Button></Link>
            <Link to="/admin/salary"><Button className="w-full" tone="light"><Banknote className="h-4 w-4" /> Generate Salary Report</Button></Link>
            <Link to="/admin/leaves"><Button className="w-full" tone="light"><CalendarCheck className="h-4 w-4" /> View Leaves</Button></Link>
          </div>
          <div className="mt-5">
            <h4 className="mb-3 text-sm font-bold text-gray-700">Pending leave requests</h4>
            {pendingLeaves.length ? pendingLeaves.slice(0, 4).map((leave) => (
              <div key={leave.id} className="mb-2 rounded-xl bg-orange-50 p-3 text-sm">
                <p className="font-bold text-gray-950">{leave.staffName}</p>
                <p className="text-gray-500">{leave.leaveType} - {leave.fromDate}</p>
              </div>
            )) : <EmptyState title="No pending leaves" />}
          </div>
        </Card>
      </div>
    </div>
  );
};

export const AdminStaffManagement = () => {
  const { staff } = useAdminSnapshot();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = staff.filter((member) => {
    const matchesSearch = [member.name, member.email, member.phone].join(" ").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "all" || String(member.isActive) === status;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <PageHeader
        title="Staff Management"
        subtitle="Create staff accounts, manage profiles, salary rules, and active status."
        action={<Link to="/admin/staff/new"><Button><Plus className="h-4 w-4" /> Add Staff</Button></Link>}
      />
      <Card className="mb-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <SearchBox value={search} onChange={setSearch} placeholder="Search staff by name, phone, email" />
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All staff</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        </div>
      </Card>
      <div className="grid gap-4 md:hidden">
        {filtered.map((member) => (
          <Link key={member.id} to={`/admin/staff/${member.uid}`} className="rounded-2xl bg-white p-4 shadow-soft">
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-bold text-gray-950">{member.name}</p>
                <p className="text-sm text-gray-500">{member.designation || "Staff"} - {member.phone}</p>
              </div>
              <Badge tone={member.isActive ? "present" : "absent"}>{member.isActive ? "Active" : "Inactive"}</Badge>
            </div>
          </Link>
        ))}
      </div>
      <div className="hidden md:block">
        <Table
          columns={[
            { key: "name", label: "Name", render: (row) => <Link className="font-bold text-gray-950 hover:text-orange-700" to={`/admin/staff/${row.uid}`}>{row.name}</Link> },
            { key: "phone", label: "Phone" },
            { key: "email", label: "Email" },
            { key: "designation", label: "Role" },
            { key: "monthlySalary", label: "Salary", render: (row) => money(row.monthlySalary) },
            { key: "isActive", label: "Status", render: (row) => <Badge tone={row.isActive ? "present" : "absent"}>{row.isActive ? "Active" : "Inactive"}</Badge> },
            { key: "actions", label: "Actions", render: (row) => <div className="flex gap-2"><Link to={`/admin/staff/${row.uid}`}><Button tone="light">View</Button></Link><Button tone="danger" onClick={() => window.confirm(`Delete ${row.name}? Historical records will remain.`) && deleteStaff(row.uid)}>Delete</Button></div> },
          ]}
          rows={filtered}
        />
      </div>
    </div>
  );
};

export const AdminStaffForm = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ salaryType: "Monthly", isActive: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const staff = await createStaffAccount({ adminProfile: userProfile, form: values });
      navigate(`/admin/staff/${staff.uid}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Add Staff" subtitle="Creates a Firebase Auth account using a secondary app, then stores staff and user profiles." />
      {error && <div className="mb-4"><Alert tone="danger">{error}</Alert></div>}
      <StaffForm values={values} loading={loading} onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))} onSubmit={submit} />
    </div>
  );
};

export const AdminStaffDetail = () => {
  const { id } = useParams();
  const { advances, reports, payments } = useAdminSnapshot();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [advanceModal, setAdvanceModal] = useState(null);

  useEffect(() => {
    getDoc(doc(db, "staff", id)).then((snapshot) => snapshot.exists() && setStaff({ id: snapshot.id, ...snapshot.data() }));
  }, [id]);

  useEffect(() => {
    if (!staff?.shopId) return;
    fetchMonthAttendance(staff.shopId, staff.uid, formatMonthKey()).then(setAttendance);
  }, [staff?.shopId, staff?.uid]);

  if (!staff) return <EmptyState title="Loading staff profile" />;

  const values = {
    ...staff,
    bankName: staff.bankName ?? staff.bankDetails?.bankName ?? "",
    accountNumber: staff.accountNumber ?? staff.bankDetails?.accountNumber ?? "",
    ifsc: staff.ifsc ?? staff.bankDetails?.ifsc ?? "",
    upiId: staff.upiId ?? staff.bankDetails?.upiId ?? "",
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    await updateStaff(staff.uid, {
      ...values,
      bankDetails: {
        bankName: values.bankName,
        accountNumber: values.accountNumber,
        ifsc: values.ifsc,
        upiId: values.upiId,
      },
    });
    setLoading(false);
    setEditingProfile(false);
  };

  const staffAdvances = advances.filter((item) => item.staffId === staff.uid);
  const staffReports = reports.filter((item) => item.staffId === staff.uid).sort((a, b) => String(b.month).localeCompare(String(a.month)));
  const staffPayments = payments.filter((item) => item.staffId === staff.uid).sort((a, b) => String(b.paymentDate).localeCompare(String(a.paymentDate)));

  return (
    <div className="grid gap-4">
      <PageHeader
        title={staff.name}
        subtitle={`${staff.designation || "Staff"} - ${staff.email}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setAdvanceModal({})}><HandCoins className="h-4 w-4" /> Record Advance</Button>
            <Button tone="light" onClick={() => setEditingProfile((value) => !value)}><Pencil className="h-4 w-4" /> {editingProfile ? "Close Edit" : "Edit Profile"}</Button>
            <Button tone="danger" onClick={async () => {
              if (!window.confirm(`Delete ${staff.name}? Historical attendance and salary reports will remain.`)) return;
              await deleteStaff(staff.uid);
              navigate("/admin/staff");
            }}><Trash2 className="h-4 w-4" /> Delete Staff</Button>
          </div>
        }
      />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Present" value={attendance.filter((item) => item.status === "present").length} />
        <StatCard label="Late" value={attendance.filter((item) => item.status === "late").length} />
        <StatCard label="Half Days" value={attendance.filter((item) => item.dayStatus === "half-day").length} />
        <StatCard label="Salary" value={money(staff.monthlySalary)} />
      </div>
      <Card>
        <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {[["Phone", staff.phone], ["Address", staff.address], ["Joining Date", staff.joiningDate], ["Department", staff.department], ["Bank", staff.bankDetails?.bankName], ["Account", staff.bankDetails?.accountNumber], ["IFSC", staff.bankDetails?.ifsc], ["UPI", staff.bankDetails?.upiId]].map(([label, value]) => (
            <div key={label}><p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p><p className="mt-1 font-semibold text-gray-800">{value || "--"}</p></div>
          ))}
        </div>
      </Card>
      {editingProfile && <StaffForm editing values={values} loading={loading} onChange={(key, value) => setStaff((current) => ({ ...current, [key]: value }))} onSubmit={submit} />}
      <Card>
        <div className="mb-4 flex items-center justify-between"><h3 className="font-bold text-gray-950">Advance Payments</h3><Badge>{staffAdvances.length} records</Badge></div>
        <Table columns={[
          { key: "advanceDate", label: "Paid On" },
          { key: "amount", label: "Amount", render: (row) => money(row.amount) },
          { key: "deductionMonth", label: "Deduct Month" },
          { key: "deductionStatus", label: "Salary Deduction", render: (row) => reports.some((report) => report.staffId === staff.uid && report.month === row.deductionMonth && report.advanceIds?.includes(row.id)) ? <Badge tone="paid">Included in report</Badge> : <Badge tone="pending">Pending</Badge> },
          { key: "notes", label: "Note", render: (row) => row.notes || "--" },
          { key: "actions", label: "Actions", render: (row) => <div className="flex gap-2"><Button tone="light" onClick={() => setAdvanceModal(row)}>Edit</Button><Button tone="danger" onClick={() => window.confirm("Delete this advance record?") && deleteAdvance(row.id)}>Delete</Button></div> },
        ]} rows={staffAdvances} />
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card><h3 className="mb-4 font-bold text-gray-950">Salary History</h3><Table columns={[
          { key: "month", label: "Month" }, { key: "netSalary", label: "Net Salary", render: (row) => money(row.netSalary) }, { key: "paymentStatus", label: "Status", render: (row) => <Badge tone={row.paymentStatus}>{row.paymentStatus}</Badge> },
        ]} rows={staffReports} /></Card>
        <Card><h3 className="mb-4 font-bold text-gray-950">Payment History</h3><Table columns={[
          { key: "paymentDate", label: "Date" }, { key: "amountPaid", label: "Amount", render: (row) => money(row.amountPaid) }, { key: "paymentMode", label: "Mode" },
        ]} rows={staffPayments} /></Card>
      </div>
      {advanceModal && <AdvanceModal staff={staff} advance={advanceModal.id ? advanceModal : null} onClose={() => setAdvanceModal(null)} onSubmit={async (nextValues) => {
        if (advanceModal.id) await updateAdvance(advanceModal.id, nextValues);
        else await recordAdvance({ shopId: staff.shopId, staff, values: nextValues, createdBy: currentUser.uid });
        setAdvanceModal(null);
      }} />}
    </div>
  );
};

export const LiveQR = () => {
  const { shopId, shop, staff } = useAdminSnapshot();
  const [token, setToken] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    if (!shopId) return undefined;
    const create = async () => {
      setToken(await createAttendanceToken(shopId));
      setCountdown(60);
    };
    create();
    const tokenTimer = setInterval(create, 60000);
    const secondTimer = setInterval(() => setCountdown((value) => (value <= 1 ? 60 : value - 1)), 1000);
    return () => {
      clearInterval(tokenTimer);
      clearInterval(secondTimer);
    };
  }, [shopId]);

  useEffect(() => {
    if (!shopId) return undefined;
    return listenAttendanceForDate(shopId, formatDateKey(), setAttendance);
  }, [shopId]);

  const qrUrl = token ? `${window.location.origin}/staff/scan-attendance?shopId=${shopId}&token=${token}` : "";

  return (
    <div>
      <PageHeader
        title="Live QR Attendance"
        subtitle="Display this screen at the shop. Staff must scan the live rotating QR every 60 seconds."
        action={<a href={`/?shopId=${shopId}`} target="_blank" rel="noreferrer"><Button tone="dark"><QrCode className="h-4 w-4" /> Open Public Display</Button></a>}
      />
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <QRDisplay value={qrUrl} countdown={countdown} shopName={shop?.shopName} />
        <Card>
          <h3 className="mb-4 font-bold text-gray-950">Today live punch-ins</h3>
          <Table
            columns={[
              { key: "staffId", label: "Staff", render: (row) => staff.find((member) => member.uid === row.staffId)?.name || row.staffId },
              { key: "status", label: "Status", render: (row) => <AttendanceStatusBadge status={row.status} /> },
              { key: "punchInTime", label: "Punch In", render: (row) => toTimeLabel(row.punchInTime) },
              { key: "punchOutTime", label: "Punch Out", render: (row) => toTimeLabel(row.punchOutTime) },
            ]}
            rows={attendance}
          />
        </Card>
      </div>
    </div>
  );
};

export const AdminShopSettings = () => {
  const { shopId } = useAdminSnapshot();
  const [values, setValues] = useState({
    shopName: "",
    ownerName: "",
    phone: "",
    address: "",
    city: "",
    openingTime: "10:00",
    closingTime: "20:00",
    graceMinutes: 10,
    fullDayHours: 8,
    halfDayHours: 4,
    weeklyOffDay: "Sunday",
    monthlyPaidOffDays: 4,
    attendanceRadiusMeters: 100,
    location: { lat: 0, lng: 0 },
  });
  const [message, setMessage] = useState("");
  const [locationError, setLocationError] = useState("");
  const [capturingLocation, setCapturingLocation] = useState(false);
  const displayedLocation = normalizeLocation(values.location);

  useEffect(() => {
    if (!shopId) return;
    getShop(shopId).then((shop) => shop && setValues((current) => ({ ...current, ...shop })));
  }, [shopId]);

  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  return (
    <div>
      <PageHeader title="Shop Settings" subtitle="Control attendance radius, GPS location, working hours, grace time, and salary day rules." />
      {message && <div className="mb-4"><Alert>{message}</Alert></div>}
      {locationError && <div className="mb-4"><Alert tone="danger">{locationError}</Alert></div>}
      <Card>
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setMessage("");
            setLocationError("");
            try {
              await saveShopSettings(shopId, values);
              setMessage("Shop settings and attendance location updated.");
            } catch (error) {
              setLocationError(error.message);
            }
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["shopName", "Shop name", "text"],
              ["ownerName", "Owner name", "text"],
              ["phone", "Phone", "tel"],
              ["address", "Address", "text"],
              ["city", "City", "text"],
              ["openingTime", "Shop opening time", "time"],
              ["closingTime", "Shop closing time", "time"],
              ["graceMinutes", "Grace time in minutes", "number"],
              ["fullDayHours", "Minimum full-day working hours", "number"],
              ["halfDayHours", "Minimum half-day working hours", "number"],
              ["monthlyPaidOffDays", "Paid absence allowance per month", "number"],
              ["attendanceRadiusMeters", "Attendance radius in meters", "number"],
            ].map(([key, label, type]) => (
              <Input key={key} label={label} type={type} min={key === "monthlyPaidOffDays" ? 0 : undefined} step={key === "monthlyPaidOffDays" ? 1 : undefined} value={values[key] ?? ""} onChange={(event) => update(key, event.target.value)} />
            ))}
            <Select label="Weekly off day" value={values.weeklyOffDay || "Sunday"} onChange={(event) => update("weeklyOffDay", event.target.value)}>
              {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => <option key={day}>{day}</option>)}
            </Select>
            <Input label="Shop latitude" type="number" step="any" value={Number.isFinite(displayedLocation.lat) ? displayedLocation.lat : ""} onChange={(event) => update("location", { ...values.location, lat: event.target.value, accuracy: 0 })} />
            <Input label="Shop longitude" type="number" step="any" value={Number.isFinite(displayedLocation.lng) ? displayedLocation.lng : ""} onChange={(event) => update("location", { ...values.location, lng: event.target.value, accuracy: 0 })} />
          </div>
          <Alert>
            Weekly off-days are excluded from scheduled working days. The paid absence allowance lets each staff member miss up to {Number(values.monthlyPaidOffDays ?? 4)} additional working days per month before salary deduction begins.
          </Alert>
          {values.location?.accuracy > 0 && (
            <p className="text-sm font-medium text-gray-600">
              Captured shop-location accuracy: approximately {values.location.accuracy}m.
              {values.location.accuracy > 75 && " Capture again outdoors or near a window for better attendance checks."}
            </p>
          )}
          {Number.isFinite(displayedLocation.lat) && Number.isFinite(displayedLocation.lng) && !(displayedLocation.lat === 0 && displayedLocation.lng === 0) && (
            <a
              className="text-sm font-bold text-orange-700 underline"
              href={`https://www.google.com/maps?q=${displayedLocation.lat},${displayedLocation.lng}`}
              target="_blank"
              rel="noreferrer"
            >
              Verify saved shop location on Google Maps
            </a>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              tone="dark"
              loading={capturingLocation}
              onClick={async () => {
                setCapturingLocation(true);
                setMessage("");
                setLocationError("");
                try {
                  const location = await getBrowserLocation({ timeout: 15000, desiredAccuracy: 20 });
                  update("location", location);
                  setMessage(`Shop location captured with approximately ${location.accuracy}m accuracy. Verify the map pin, then save settings.`);
                } catch (error) {
                  setLocationError(error.message);
                } finally {
                  setCapturingLocation(false);
                }
              }}
            >
              <MapPin className="h-4 w-4" />
              Use Current Location as Shop Location
            </Button>
            <Button type="submit">Save Settings</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export const AdminAttendance = () => {
  const { shopId, staff } = useAdminSnapshot();
  const [date, setDate] = useState(formatDateKey());
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState("all");
  const [staffId, setStaffId] = useState("all");
  const [editing, setEditing] = useState(null);
  const [reason, setReason] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualError, setManualError] = useState("");
  const [manualSelections, setManualSelections] = useState({});
  const [manualReason, setManualReason] = useState("");
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!shopId) return undefined;
    return listenAttendanceForDate(shopId, date, setRecords);
  }, [date, shopId]);

  const filtered = records.filter((record) => (status === "all" || record.status === status) && (staffId === "all" || record.staffId === staffId));

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Review daily and monthly attendance, export CSV, finalize absentees, and correct records with audit logs."
        action={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => {
              setManualSelections(Object.fromEntries(records.map((record) => [record.staffId, record.status === "absent" ? "absent" : "present"])));
              setManualOpen(true);
            }}><Users className="h-4 w-4" /> Manual Attendance</Button>
            <Button tone="dark" onClick={() => finalizeAttendance({ shopId, dateKey: date })}>Finalize Attendance</Button>
          </div>
        }
      />
      <Alert>Finalize attendance only after working hours.</Alert>
      <div className="my-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <DateFilter value={date} onChange={setDate} />
        <Select label="Staff" value={staffId} onChange={(event) => setStaffId(event.target.value)}>
          <option value="all">All staff</option>
          {staff.map((member) => <option key={member.uid} value={member.uid}>{member.name}</option>)}
        </Select>
        <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All status</option>
          {["present", "late", "half-day", "absent", "leave", "paid-leave"].map((item) => <option key={item}>{item}</option>)}
        </Select>
        <StatCard label="Present" value={records.filter((item) => ["present", "late"].includes(item.status)).length} />
        <StatCard label="Absent" value={records.filter((item) => item.status === "absent").length} />
      </div>
      <div className="mb-4 flex justify-end">
        <Button tone="light" onClick={() => exportToCsv(`attendance-${date}.csv`, filtered.map((record) => ({ ...record, staffName: staff.find((member) => member.uid === record.staffId)?.name })))}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>
      <Table
        columns={[
          { key: "staffId", label: "Staff", render: (row) => staff.find((member) => member.uid === row.staffId)?.name || row.staffId },
          { key: "status", label: "Status", render: (row) => <AttendanceStatusBadge status={row.status} /> },
          { key: "punchInTime", label: "Punch In", render: (row) => toTimeLabel(row.punchInTime) },
          { key: "punchOutTime", label: "Punch Out", render: (row) => toTimeLabel(row.punchOutTime) },
          { key: "totalWorkingHours", label: "Hours", render: (row) => row.totalWorkingHours || "--" },
          { key: "markedBy", label: "Marked By", render: (row) => row.markedBy === "admin" ? "Admin (manual)" : row.markedBy || "Staff" },
          { key: "action", label: "Correction", render: (row) => <Button tone="light" onClick={() => setEditing(row)}>Edit</Button> },
        ]}
        rows={filtered}
      />
      {editing && (
        <Modal title="Manual attendance correction" onClose={() => setEditing(null)}>
          <form
            className="grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              await correctAttendance({ shopId, staffId: editing.staffId, date, changedBy: "admin", oldData: editing, newData: editing, reason });
              setEditing(null);
              setReason("");
            }}
          >
            <Select label="Status" value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value })}>
              {["present", "late", "half-day", "absent", "leave", "paid-leave"].map((item) => <option key={item}>{item}</option>)}
            </Select>
            <Select label="Day status" value={editing.dayStatus || "pending"} onChange={(event) => setEditing({ ...editing, dayStatus: event.target.value })}>
              {["full-day", "half-day", "absent", "pending"].map((item) => <option key={item}>{item}</option>)}
            </Select>
            <Textarea label="Reason for correction" required value={reason} onChange={(event) => setReason(event.target.value)} />
            <Button type="submit">Save Correction</Button>
          </form>
        </Modal>
      )}
      {manualOpen && (
        <Modal title={`Manual attendance - ${date}`} onClose={() => setManualOpen(false)}>
          <form
            className="grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setManualError("");
              try {
                await saveBulkManualAttendance({
                  shopId,
                  date,
                  staff,
                  selections: manualSelections,
                  reason: manualReason,
                  changedBy: currentUser?.uid || "admin",
                });
                setManualOpen(false);
                setManualReason("");
              } catch (error) {
                setManualError(error.message);
              }
            }}
          >
            <Alert>Select Present or Absent for each staff member. Any staff left unselected will automatically be marked Absent when you save.</Alert>
            {manualError && <Alert tone="danger">{manualError}</Alert>}
            <div className="flex flex-wrap gap-2">
              <Button type="button" tone="success" onClick={() => setManualSelections(Object.fromEntries(staff.filter((member) => member.isActive !== false).map((member) => [member.uid, "present"])))}>Mark All Present</Button>
              <Button type="button" tone="light" onClick={() => setManualSelections({})}>Clear All</Button>
            </div>
            <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
              {staff.filter((member) => member.isActive !== false).map((member) => (
                <div key={member.uid} className="flex flex-col justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3 sm:flex-row sm:items-center">
                  <div><p className="font-bold text-gray-950">{member.name}</p><p className="text-xs text-gray-500">{member.designation || "Staff"}</p></div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" tone={manualSelections[member.uid] === "present" ? "success" : "light"} onClick={() => setManualSelections({ ...manualSelections, [member.uid]: "present" })}>Present</Button>
                    <Button type="button" tone={manualSelections[member.uid] === "absent" ? "danger" : "light"} onClick={() => setManualSelections({ ...manualSelections, [member.uid]: "absent" })}>Absent</Button>
                  </div>
                </div>
              ))}
            </div>
            <Textarea label="Reason / note (optional)" value={manualReason} onChange={(event) => setManualReason(event.target.value)} />
            <Button type="submit">Save Daily Attendance</Button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export const AdminLeaves = () => {
  const { leaves } = useAdminSnapshot();
  const { currentUser } = useAuth();
  const [note, setNote] = useState("");

  return (
    <div>
      <PageHeader title="Leave Requests" subtitle="Approve, reject, and add admin notes. Approved paid leaves are considered during salary generation." />
      <Table
        columns={[
          { key: "staffName", label: "Staff" },
          { key: "leaveType", label: "Type" },
          { key: "fromDate", label: "From" },
          { key: "toDate", label: "To" },
          { key: "reason", label: "Reason" },
          { key: "status", label: "Status", render: (row) => <Badge tone={row.status}>{row.status}</Badge> },
          {
            key: "actions",
            label: "Actions",
            render: (row) => row.status === "pending" ? (
              <div className="flex gap-2">
                <Button tone="success" onClick={() => updateLeaveStatus({ leaveId: row.id, status: "approved", adminNote: note, approvedBy: currentUser.uid })}>Approve</Button>
                <Button tone="danger" onClick={() => updateLeaveStatus({ leaveId: row.id, status: "rejected", adminNote: note, approvedBy: currentUser.uid })}>Reject</Button>
              </div>
            ) : "--",
          },
        ]}
        rows={leaves}
      />
      <div className="mt-4 max-w-xl">
        <Textarea label="Admin note for next approval/rejection" value={note} onChange={(event) => setNote(event.target.value)} />
      </div>
    </div>
  );
};

export const AdminSalary = () => {
  const { shopId, shop, staff, leaves, reports, advances } = useAdminSnapshot();
  const { currentUser } = useAuth();
  const [month, setMonth] = useState(formatMonthKey());
  const [selectedStaff, setSelectedStaff] = useState("all");
  const [extras, setExtras] = useState({ bonus: 0, overtimeAmount: 0, otherDeduction: 0, note: "" });
  const [loading, setLoading] = useState(false);
  const [editingReport, setEditingReport] = useState(null);

  const generate = async () => {
    setLoading(true);
    const members = selectedStaff === "all" ? staff.filter((member) => member.isActive !== false) : staff.filter((member) => member.uid === selectedStaff);
    const monthAttendance = await fetchMonthAttendance(shopId, null, month);
    await Promise.all(members.map((member) => generateSalaryReport({
      shopId,
      staff: member,
      month,
      shop,
      attendanceRecords: monthAttendance.filter((record) => record.staffId === member.uid),
      leaves: leaves.filter((leave) => leave.staffId === member.uid && leave.status === "approved"),
      advances: advances.filter((advance) => advance.staffId === member.uid && advance.deductionMonth === month),
      generatedBy: currentUser.uid,
      extras,
    })));
    setLoading(false);
  };

  const visibleReports = reports.filter((report) => report.month === month && (selectedStaff === "all" || report.staffId === selectedStaff));
  const selectedAdvances = advances
    .filter((advance) => advance.deductionMonth === month && (selectedStaff === "all" || advance.staffId === selectedStaff))
    .map((advance) => ({
      ...advance,
      deductionStatus: reports.some((report) => report.month === month && report.staffId === advance.staffId && report.advanceIds?.includes(advance.id)) ? "included" : "pending",
    }));
  const selectedAdvanceTotal = selectedAdvances.reduce((sum, advance) => sum + Number(advance.amount || 0), 0);

  return (
    <div>
      <PageHeader title="Salary Reports" subtitle="Generate month-wise salary using attendance, leaves, half-days, absences, bonus, overtime, advance, and deductions." />
      <Card className="mb-5">
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          <MonthFilter value={month} onChange={setMonth} />
          <Select label="Staff" value={selectedStaff} onChange={(event) => setSelectedStaff(event.target.value)}>
            <option value="all">All staff</option>
            {staff.map((member) => <option key={member.uid} value={member.uid}>{member.name}</option>)}
          </Select>
          {["bonus", "overtimeAmount", "otherDeduction"].map((key) => (
            <Input key={key} label={key.replace(/([A-Z])/g, " $1")} type="number" value={extras[key]} onChange={(event) => setExtras({ ...extras, [key]: event.target.value })} />
          ))}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
          <Input label="Note" value={extras.note} onChange={(event) => setExtras({ ...extras, note: event.target.value })} />
          <Button className="self-end" loading={loading} onClick={generate}>Generate Report</Button>
        </div>
      </Card>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarCheck} label="Monthly Paid Off-Days" value={Number(shop?.monthlyPaidOffDays ?? 4)} helper="Deduction starts after these missed working days" />
        <StatCard icon={HandCoins} label="Advances To Deduct" value={money(selectedAdvanceTotal)} helper={`${selectedAdvances.length} advance record(s) in ${month}`} />
        <StatCard icon={Users} label="Reports Generated" value={visibleReports.length} />
        <StatCard icon={Banknote} label="Net Salary Total" value={money(visibleReports.reduce((sum, report) => sum + Number(report.netSalary || 0), 0))} />
      </div>
      <Table
        columns={[
          { key: "staffName", label: "Staff" },
          { key: "monthlySalary", label: "Monthly", render: (row) => money(row.monthlySalary) },
          { key: "presentDays", label: "Present" },
          { key: "paidOffDaysUsed", label: "Paid Off Used", render: (row) => row.paidOffDaysUsed || 0 },
          { key: "salaryDeductedAbsentDays", label: "Deducted Absence", render: (row) => row.salaryDeductedAbsentDays || 0 },
          { key: "halfDays", label: "Half" },
          { key: "advanceDeduction", label: "Advance", render: (row) => money(row.advanceDeduction) },
          { key: "totalDeductions", label: "Advance + Other", render: (row) => money(row.totalDeductions) },
          { key: "netSalary", label: "Net Payable", render: (row) => <b>{money(row.netSalary)}</b> },
          { key: "paymentStatus", label: "Status", render: (row) => <Badge tone={row.paymentStatus}>{row.paymentStatus}</Badge> },
          { key: "actions", label: "Actions", render: (row) => <div className="flex gap-2"><Button tone="light" onClick={() => setEditingReport(row)}>Edit</Button><Button tone="light" onClick={() => downloadSalaryPdf({ report: row, shop, staff: staff.find((member) => member.uid === row.staffId) })}>Download</Button><Button tone="danger" onClick={() => window.confirm("Delete this salary report?") && deleteSalaryReport(row.id)}>Delete</Button></div> },
        ]}
        rows={visibleReports}
      />
      <Card className="mt-5">
        <h3 className="mb-1 font-black text-gray-950">Advance deductions for {month}</h3>
        <p className="mb-4 text-sm font-medium text-gray-700">These recorded advances are automatically deducted when salary reports are generated.</p>
        <Table
          columns={[
            { key: "staffName", label: "Staff" },
            { key: "advanceDate", label: "Advance Paid On" },
            { key: "deductionMonth", label: "Deduction Month" },
            { key: "amount", label: "Amount", render: (row) => money(row.amount) },
            { key: "deductionStatus", label: "Status", render: (row) => <Badge tone={row.deductionStatus === "included" ? "paid" : "pending"}>{row.deductionStatus === "included" ? "Included in report" : "Pending deduction"}</Badge> },
            { key: "notes", label: "Note", render: (row) => row.notes || "--" },
          ]}
          rows={selectedAdvances}
          emptyText="No advances scheduled for this salary month"
        />
      </Card>
      {editingReport && <SalaryReportEditModal report={editingReport} onClose={() => setEditingReport(null)} onSubmit={async (values) => {
        await updateSalaryReport(editingReport.id, values, editingReport);
        setEditingReport(null);
      }} />}
    </div>
  );
};

export const AdminSalarySlips = () => {
  const { shop, staff, reports } = useAdminSnapshot();
  const [month, setMonth] = useState(formatMonthKey());
  const visible = reports.filter((report) => report.month === month);

  return (
    <div>
      <PageHeader title="Salary Slips" subtitle="Preview and download professional salary slips for staff." />
      <div className="mb-5 max-w-xs"><MonthFilter value={month} onChange={setMonth} /></div>
      <div className="grid gap-4 lg:grid-cols-2">
        {visible.map((report) => (
          <section key={report.id} className="grid gap-2">
            <SalarySlipTemplate report={report} shop={shop} staff={staff.find((member) => member.uid === report.staffId)} />
            <Button className="w-full sm:w-max" onClick={() => downloadSalaryPdf({ report, shop, staff: staff.find((member) => member.uid === report.staffId) })}>
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </section>
        ))}
      </div>
      {!visible.length && <EmptyState title="No salary slips generated" description="Generate salary reports first." />}
    </div>
  );
};

export const AdminPayments = () => {
  const { reports, payments } = useAdminSnapshot();
  const { currentUser } = useAuth();
  const [month, setMonth] = useState(formatMonthKey());
  const [modalReport, setModalReport] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const visibleReports = reports.filter((report) => report.month === month);
  const monthPayments = payments.filter((payment) => payment.month === month);
  const payable = visibleReports.reduce((sum, report) => sum + Number(report.netSalary || 0), 0);
  const paid = monthPayments.reduce((sum, payment) => sum + Number(payment.amountPaid || 0), 0);

  return (
    <div>
      <PageHeader title="Payments" subtitle="Track pending, paid, and partial salary payments with transaction history." />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MonthFilter value={month} onChange={setMonth} />
        <StatCard icon={Banknote} label="Total Payable" value={money(payable)} />
        <StatCard icon={WalletCards} label="Total Paid" value={money(paid)} />
        <StatCard icon={ReceiptText} label="Balance" value={money(payable - paid)} />
      </div>
      <Table
        columns={[
          { key: "staffName", label: "Staff" },
          { key: "netSalary", label: "Net Salary", render: (row) => money(row.netSalary) },
          { key: "paymentStatus", label: "Status", render: (row) => <Badge tone={row.paymentStatus}>{row.paymentStatus}</Badge> },
          { key: "action", label: "Payment", render: (row) => <Button onClick={() => setModalReport(row)}>Record Payment</Button> },
        ]}
        rows={visibleReports}
      />
      <Card className="mt-5">
        <h3 className="mb-4 font-bold text-gray-950">Payment Transactions</h3>
        <Table
          columns={[
            { key: "staffId", label: "Staff", render: (row) => reports.find((report) => report.id === row.salaryReportId)?.staffName || row.staffId },
            { key: "paymentDate", label: "Date" },
            { key: "amountPaid", label: "Amount", render: (row) => money(row.amountPaid) },
            { key: "paymentMode", label: "Mode" },
            { key: "actions", label: "Actions", render: (row) => <div className="flex gap-2"><Button tone="light" onClick={() => { setEditingPayment(row); setModalReport(reports.find((report) => report.id === row.salaryReportId)); }}>Edit</Button><Button tone="danger" onClick={() => window.confirm("Delete this payment record?") && deletePayment(row.id, row.salaryReportId)}>Delete</Button></div> },
          ]}
          rows={monthPayments}
        />
      </Card>
      {modalReport && (
        <PaymentModal
          report={modalReport}
          payment={editingPayment}
          onClose={() => { setModalReport(null); setEditingPayment(null); }}
          onSubmit={async (values) => {
            if (editingPayment) await updatePayment(editingPayment.id, values, editingPayment.salaryReportId);
            else await recordPayment({ report: modalReport, values, createdBy: currentUser.uid });
            setModalReport(null);
            setEditingPayment(null);
          }}
        />
      )}
    </div>
  );
};

export const AdminReports = () => {
  const { reports, payments, advances } = useAdminSnapshot();
  const [month, setMonth] = useState(formatMonthKey());
  const months = [...new Set([
    formatMonthKey(),
    ...reports.map((item) => item.month),
    ...payments.map((item) => item.month),
    ...advances.map((item) => item.deductionMonth),
  ].filter(Boolean))].sort((a, b) => String(b).localeCompare(String(a)));

  const rollups = months.map((itemMonth) => {
    const monthReports = reports.filter((item) => item.month === itemMonth);
    const monthPayments = payments.filter((item) => item.month === itemMonth);
    const monthAdvances = advances.filter((item) => item.deductionMonth === itemMonth);
    const payable = monthReports.reduce((sum, item) => sum + Number(item.netSalary || 0), 0);
    const paid = monthPayments.reduce((sum, item) => sum + Number(item.amountPaid || 0), 0);
    return {
      id: itemMonth,
      month: itemMonth,
      payable,
      paid,
      balance: Math.max(0, payable - paid),
      advances: monthAdvances.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      present: monthReports.reduce((sum, item) => sum + Number(item.presentDays || 0), 0),
      absent: monthReports.reduce((sum, item) => sum + Number(item.absentDays || 0), 0),
      staff: monthReports.length,
    };
  });
  const selected = rollups.find((item) => item.month === month) || { payable: 0, paid: 0, balance: 0, advances: 0, present: 0, absent: 0 };
  const selectedReports = reports.filter((item) => item.month === month);

  return (
    <div>
      <PageHeader title="Business Reports" subtitle="Month-wise attendance, salary payable, advances, payments, and outstanding business totals." />
      <div className="mb-5 max-w-xs"><MonthFilter value={month} onChange={setMonth} /></div>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard icon={Banknote} label="Salary Payable" value={money(selected.payable)} />
        <StatCard icon={WalletCards} label="Salary Paid" value={money(selected.paid)} />
        <StatCard icon={ReceiptText} label="Outstanding" value={money(selected.balance)} />
        <StatCard icon={HandCoins} label="Advances" value={money(selected.advances)} />
        <StatCard icon={CheckCircle2} label="Present Days" value={selected.present} />
        <StatCard icon={CalendarCheck} label="Absent Days" value={selected.absent} />
      </div>
      <Card className="mb-5">
        <h3 className="mb-4 font-bold text-gray-950">All Months Summary</h3>
        <Table columns={[
          { key: "month", label: "Month" },
          { key: "staff", label: "Staff Reports" },
          { key: "payable", label: "Payable", render: (row) => money(row.payable) },
          { key: "paid", label: "Paid", render: (row) => money(row.paid) },
          { key: "advances", label: "Advances", render: (row) => money(row.advances) },
          { key: "balance", label: "Outstanding", render: (row) => money(row.balance) },
          { key: "present", label: "Present Days" },
          { key: "absent", label: "Absent Days" },
        ]} rows={rollups} />
      </Card>
      <Card>
        <h3 className="mb-4 font-bold text-gray-950">Staff Salary Details - {month}</h3>
        <Table columns={[
          { key: "staffName", label: "Staff" },
          { key: "presentDays", label: "Present" },
          { key: "paidOffDaysUsed", label: "Paid Off Used", render: (row) => row.paidOffDaysUsed || 0 },
          { key: "salaryDeductedAbsentDays", label: "Deducted Absence", render: (row) => row.salaryDeductedAbsentDays || 0 },
          { key: "advanceDeduction", label: "Advance", render: (row) => money(row.advanceDeduction) },
          { key: "netSalary", label: "Net Salary", render: (row) => money(row.netSalary) },
          { key: "paymentStatus", label: "Status", render: (row) => <Badge tone={row.paymentStatus}>{row.paymentStatus}</Badge> },
        ]} rows={selectedReports} />
      </Card>
    </div>
  );
};

export const AdminProfile = () => {
  const { userProfile } = useAuth();
  return (
    <div>
      <PageHeader title="Profile" subtitle="Admin identity and Firestore role metadata." />
      <Card className="mb-5">
        <div className="grid gap-3 text-sm">
          <p><b>Name:</b> {userProfile?.name}</p>
          <p><b>Email:</b> {userProfile?.email}</p>
          <p><b>Role:</b> {userProfile?.role}</p>
          <p><b>Shop ID:</b> {userProfile?.shopId}</p>
        </div>
      </Card>
      <AboutWebReich />
    </div>
  );
};

export const AdminAbout = () => (
  <div>
    <PageHeader title="About WebReich" subtitle="Product support and development partner information." />
    <AboutWebReich />
  </div>
);
