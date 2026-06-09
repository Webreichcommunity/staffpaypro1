import { useCallback, useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { Link } from "react-router-dom";
import { ArrowRight, Banknote, Building2, CalendarCheck, CheckCircle2, Clock3, Download, Loader2, MapPin, QrCode, RotateCcw, ScanLine, ShieldCheck, UserCircle } from "lucide-react";
import { db } from "../../Firebase/config";
import { AttendanceStatusBadge } from "../../components/attendance/AttendanceStatusBadge";
import { LocationPermissionBox } from "../../components/attendance/LocationPermissionBox";
import { PunchCard } from "../../components/attendance/PunchCard";
import { QRScanner } from "../../components/attendance/QRScanner";
import { MonthFilter } from "../../components/common/Filters";
import { Alert, Badge, Button, Card, EmptyState, StatCard, Table } from "../../components/common/UI";
import { LeaveForm } from "../../components/leaves/LeaveForm";
import { SalarySlipTemplate } from "../../components/salary/SalarySlipTemplate";
import { useAuth } from "../../hooks/useAuth";
import {
  applyLeave,
  getAttendanceRef,
  getShop,
  getTodayAttendance,
  punchIn,
  punchOut,
} from "../../services/firestoreService";
import { formatDateKey, formatMonthKey, getMonthDateKeys, toTimeLabel } from "../../utils/dateUtils";
import { evaluateLocationAccess, getBrowserLocation, isValidLocation } from "../../utils/locationUtils";
import { money } from "../../utils/salaryUtils";
import { AboutWebReich } from "../../components/common/Brand";

const useStaffData = () => {
  const { userProfile } = useAuth();
  const [staff, setStaff] = useState(null);
  const [shop, setShop] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    if (!userProfile?.uid || !userProfile?.shopId) return undefined;
    getDoc(doc(db, "staff", userProfile.uid)).then((snapshot) => snapshot.exists() && setStaff({ id: snapshot.id, ...snapshot.data() }));
    getShop(userProfile.shopId).then(setShop);
    const unsubs = [
      onSnapshot(query(collection(db, "leaves"), where("shopId", "==", userProfile.shopId), where("staffId", "==", userProfile.uid)), (snapshot) =>
        setLeaves(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
      ),
      onSnapshot(query(collection(db, "salaryReports"), where("shopId", "==", userProfile.shopId), where("staffId", "==", userProfile.uid)), (snapshot) =>
        setReports(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
      ),
    ];
    return () => unsubs.forEach((unsubscribe) => unsubscribe());
  }, [userProfile?.shopId, userProfile?.uid]);

  return { staff, shop, leaves, reports };
};

const ShopIdentity = ({ shop, label = "Your workplace", dark = false }) => (
  <div className="flex min-w-0 items-center gap-3">
    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${dark ? "bg-white/10 text-orange-300 ring-white/10" : "bg-orange-100 text-orange-700 ring-orange-200"} ring-1`}>
      <Building2 className="h-5 w-5" />
    </div>
    <div className="min-w-0">
      <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${dark ? "text-orange-300" : "text-orange-700"}`}>{label}</p>
      <p className={`truncate text-base font-black ${dark ? "text-white" : "text-gray-950"}`}>{shop?.shopName || "Loading shop..."}</p>
      {shop?.city && <p className={`truncate text-xs font-semibold ${dark ? "text-gray-300" : "text-gray-700"}`}>{shop.city}</p>}
    </div>
  </div>
);

const downloadSalaryPdf = ({ report, shop, staff }) => {
  const pdf = new jsPDF();
  pdf.setFillColor(249, 115, 22);
  pdf.rect(0, 0, 210, 32, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.text(shop?.shopName || "StaffPay Pro", 14, 14);
  pdf.setFontSize(10);
  pdf.text(`Salary Slip - ${report.month}`, 14, 23);
  pdf.setTextColor(17, 24, 39);
  const rows = [
    ["Staff", staff?.name || report.staffName],
    ["Role", staff?.designation || report.designation || "-"],
    ["Basic Salary", money(report.monthlySalary)],
    ["Working Days", String(report.workingDays || 0)],
    ["Paid Off Days Used", String(report.paidOffDaysUsed || 0)],
    ["Salary-Deducted Absence Days", String(report.salaryDeductedAbsentDays || 0)],
    ["Attendance / Leave Deduction", money(report.absentDeduction)],
    ["Present / Absent / Half", `${report.presentDays || 0} / ${report.absentDays || 0} / ${report.halfDays || 0}`],
    ["Paid / Unpaid Leaves", `${report.paidLeaves || 0} / ${report.unpaidLeaves || 0}`],
    ["Deductions", money(report.totalDeductions)],
    ["Payment Status", report.paymentStatus || "pending"],
    ["Net Payable", money(report.netSalary)],
  ];
  let y = 46;
  rows.forEach(([label, value]) => {
    pdf.setFont(undefined, "bold");
    pdf.text(label, 14, y);
    pdf.setFont(undefined, "normal");
    pdf.text(String(value), 90, y);
    y += 10;
  });
  pdf.save(`${report.month}-salary-slip.pdf`);
};

const useMonthlyAttendance = (shopId, staffId, month) => {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    if (!shopId || !staffId || !month) return undefined;
    const unsubs = getMonthDateKeys(month).map((dateKey) =>
      onSnapshot(collection(db, "attendance", shopId, "dates", dateKey, "records"), (snapshot) => {
        setRecords((current) => {
          const withoutDate = current.filter((record) => record.date !== dateKey);
          return [...withoutDate, ...snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).filter((record) => record.staffId === staffId)];
        });
      }),
    );
    return () => unsubs.forEach((unsubscribe) => unsubscribe());
  }, [month, shopId, staffId]);

  return records;
};

export const StaffDashboard = () => {
  const { userProfile } = useAuth();
  const { shop, leaves, reports } = useStaffData();
  const records = useMonthlyAttendance(userProfile?.shopId, userProfile?.uid, formatMonthKey());
  const [today, setToday] = useState(null);

  useEffect(() => {
    if (!userProfile?.shopId || !userProfile?.uid) return undefined;
    return onSnapshot(getAttendanceRef(userProfile.shopId, formatDateKey(), userProfile.uid), (snapshot) => {
      setToday(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
    });
  }, [userProfile?.shopId, userProfile?.uid]);

  const latestSlip = [...reports].sort((a, b) => String(b.month).localeCompare(String(a.month)))[0];

  return (
    <div className="grid gap-4">
      <Card className="overflow-hidden !p-0">
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <ShopIdentity shop={shop} />
            <span className="rounded-full bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
              {new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" }).format(new Date())}
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-orange-600">Today&apos;s attendance</p>
              <h2 className="mt-1 text-xl font-bold text-gray-950 sm:text-2xl">{today?.punchOutTime ? "Attendance complete" : today?.punchInTime ? "You are punched in" : "Ready to start your day"}</h2>
              <p className="mt-1 text-sm font-medium text-gray-700">
                {today?.punchInTime ? `Punch in time: ${toTimeLabel(today.punchInTime)}` : "Scan shop QR to mark today's attendance"}
              </p>
              {today?.punchOutTime && <p className="mt-1 text-sm font-semibold text-green-700">Punch out time: {toTimeLabel(today.punchOutTime)}</p>}
            </div>
            <div className="hidden h-14 w-14 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-700 sm:grid">
              <QrCode className="h-7 w-7" />
            </div>
          </div>
          {today?.punchOutTime ? (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm font-semibold text-green-700 ring-1 ring-green-200">
              <CheckCircle2 className="h-4 w-4" /> Attendance completed for today
            </div>
          ) : (
            <Link to="/staff/scan-attendance" className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 sm:w-auto">
              <ScanLine className="h-4 w-4" /> {today?.punchInTime ? "Scan QR to Punch Out" : "Scan QR to Punch In"} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={CheckCircle2} label="Present" value={records.filter((record) => record.status === "present" || record.status === "late").length} />
        <StatCard icon={Clock3} label="Half Days" value={records.filter((record) => record.dayStatus === "half-day").length} />
        <StatCard icon={CalendarCheck} label="Absent" value={records.filter((record) => record.status === "absent").length} />
        <StatCard icon={Banknote} label="Leaves Pending" value={leaves.filter((leave) => leave.status === "pending").length} />
      </div>
      <Card>
        <h3 className="font-bold text-gray-950">Latest salary slip</h3>
        {latestSlip ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-orange-50 p-4">
            <div>
              <p className="font-bold text-gray-950">{latestSlip.month}</p>
              <p className="text-sm font-semibold text-gray-700">{money(latestSlip.netSalary)} - {latestSlip.paymentStatus}</p>
            </div>
            <Badge tone={latestSlip.paymentStatus}>{latestSlip.paymentStatus}</Badge>
          </div>
        ) : <EmptyState title="No salary slips yet" />}
      </Card>
    </div>
  );
};

export const StaffPunch = () => {
  const { shop } = useStaffData();

  return (
    <div className="mx-auto grid max-w-3xl gap-4">
      <Card>
        <ShopIdentity shop={shop} label="Attendance at" />
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-orange-600">Quick attendance</p>
            <h1 className="mt-1 text-xl font-bold text-gray-950 sm:text-2xl">Scan, verify and punch</h1>
            <p className="mt-1 max-w-lg text-sm font-medium leading-5 text-gray-700">Scan the live shop QR, verify your location, then confirm the correct punch action.</p>
          </div>
          <div className="hidden h-14 w-14 place-items-center rounded-xl bg-orange-50 text-orange-700 sm:grid">
            <ScanLine className="h-7 w-7" />
          </div>
        </div>
        <Link to="/staff/scan-attendance" className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 sm:w-auto">
          Open QR Scanner <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>
      <LocationPermissionBox />
      <div className="grid grid-cols-3 gap-2">
        {[
          [QrCode, "1. Scan QR", "Scan the live code shown at the shop."],
          [MapPin, "2. Verify location", "Confirm you are inside the allowed radius."],
          [ShieldCheck, "3. Confirm punch", "Review and submit punch in or punch out."],
        ].map(([Icon, title, description]) => (
          <Card key={title} className="text-center">
            <Icon className="mx-auto h-5 w-5 text-orange-600" />
            <p className="mt-2 text-xs font-bold text-gray-950 sm:text-sm">{title}</p>
            <p className="mt-1 hidden text-xs font-medium leading-4 text-gray-600 sm:block">{description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const StaffScanAttendance = () => {
  const { userProfile } = useAuth();
  const { shop } = useStaffData();
  const [qrCode, setQrCode] = useState(new URLSearchParams(window.location.search).get("qr") || "");
  const [shopId, setShopId] = useState(new URLSearchParams(window.location.search).get("shopId") || userProfile?.shopId || "");
  const [attendance, setAttendance] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationCheck, setLocationCheck] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const preparePunch = useCallback(async (nextQrCode = qrCode, nextShopId = shopId) => {
    setError("");
    setMessage("");
    setVerifying(true);
    setLocation(null);
    setLocationCheck(null);
    try {
      if (!nextQrCode || !nextShopId) return;
      if (!userProfile?.shopId || !userProfile?.uid) throw new Error("Your staff profile is still loading. Please try again.");
      if (nextShopId !== userProfile.shopId) throw new Error("QR belongs to a different shop.");
      if (!isValidLocation(shop?.location)) throw new Error("No valid shop location is set. Please ask admin to capture and save the shop location.");
      if (userProfile.isActive === false) throw new Error("Your staff account is inactive.");
      const currentLocation = await getBrowserLocation();
      const check = evaluateLocationAccess(currentLocation, shop.location, shop.attendanceRadiusMeters);
      setLocationCheck(check);
      if (!check.allowed) {
        throw new Error(
          `You appear to be outside the shop radius. Measured distance: ${check.distance}m, allowed radius: ${check.radius}m, GPS accuracy: ${check.accuracy}m. Turn ON precise location and retry.`,
        );
      }
      setLocation(currentLocation);
      setAttendance(await getTodayAttendance(userProfile.shopId, userProfile.uid));
      setMessage("QR and location verified. You can mark attendance now.");
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  }, [qrCode, shop, shopId, userProfile]);

  useEffect(() => {
    if (!shop || !qrCode || !shopId) return undefined;
    const timer = window.setTimeout(() => preparePunch(qrCode, shopId), 0);
    return () => window.clearTimeout(timer);
  }, [preparePunch, qrCode, shop, shopId]);

  const state = useMemo(() => {
    if (!attendance?.punchInTime) return { action: "in", title: "Ready to Punch In", description: "Your QR and shop location are verified." };
    if (!attendance?.punchOutTime) return { action: "out", title: "Ready to Punch Out", description: `Punch in: ${toTimeLabel(attendance.punchInTime)}` };
    return { action: "done", title: "Attendance completed", description: "Punch In successful and Punch Out successful for today." };
  }, [attendance]);

  const handleScanResult = useCallback((decodedText) => {
    try {
      const url = new URL(decodedText);
      const nextShopId = url.searchParams.get("shopId");
      const nextQrCode = url.searchParams.get("qr");
      if (!nextShopId || !nextQrCode) throw new Error("Missing QR attendance details.");
      setError("");
      setMessage("");
      setShopId(nextShopId);
      setQrCode(nextQrCode);
    } catch {
      setError("QR invalid. Please scan the live shop QR again.");
    }
  }, []);

  const submitPunch = async (type) => {
    setLoading(true);
    setError("");
    try {
      if (type === "in") {
        await punchIn({ userProfile, shop, location });
        setMessage("Punch In successful");
      } else {
        await punchOut({ userProfile, shop, location });
        setMessage("Punch Out successful");
      }
      setAttendance(await getTodayAttendance(userProfile.shopId, userProfile.uid));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-3xl gap-4">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
        <ShopIdentity shop={shop} label="Scanning attendance for" />
        <div className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-800 ring-1 ring-green-200">
          <ShieldCheck className="h-4 w-4" /> Secure verification
        </div>
      </section>
      {!qrCode && <QRScanner onResult={handleScanResult} />}
      {!qrCode && <LocationPermissionBox compact />}
      {qrCode && !shop && (
        <Card className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-orange-600" />
          <p className="mt-3 font-bold text-gray-950">Loading shop attendance...</p>
        </Card>
      )}
      {verifying && (
        <Card className="text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-orange-50 text-orange-700">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <p className="mt-3 font-bold text-gray-950">Verifying QR and shop location...</p>
          <p className="mt-1 text-sm font-medium text-gray-700">Please allow precise location permission when asked.</p>
        </Card>
      )}
      {message && <Alert>{message}</Alert>}
      {error && (
        <div className="grid gap-3">
          <Alert tone="danger">{error}</Alert>
          {qrCode && (
            <Button onClick={() => preparePunch(qrCode, shopId)}>
              <RotateCcw className="h-4 w-4" /> Retry Location Check
            </Button>
          )}
          <Button tone="light" onClick={() => { setQrCode(""); setShopId(userProfile?.shopId || ""); setError(""); setMessage(""); }}>
            <RotateCcw className="h-4 w-4" /> Scan Another QR
          </Button>
        </div>
      )}
      {!verifying && location && (
        <PunchCard
          state={state}
          shopName={shop?.shopName}
          distance={locationCheck?.distance}
          accuracy={locationCheck?.accuracy}
          radius={locationCheck?.radius}
          loading={loading}
          onPunchIn={() => submitPunch("in")}
          onPunchOut={() => submitPunch("out")}
        />
      )}
    </div>
  );
};

export const StaffAttendance = () => {
  const { userProfile } = useAuth();
  const [month, setMonth] = useState(formatMonthKey());
  const records = useMonthlyAttendance(userProfile?.shopId, userProfile?.uid, month);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-950">My Attendance</h2>
        <p className="text-sm font-medium text-gray-700">Month-wise punch history and statuses.</p>
      </div>
      <div className="mb-4 max-w-xs"><MonthFilter value={month} onChange={setMonth} /></div>
      <Table
        columns={[
          { key: "date", label: "Date" },
          { key: "status", label: "Status", render: (row) => <AttendanceStatusBadge status={row.status} /> },
          { key: "punchInTime", label: "In", render: (row) => toTimeLabel(row.punchInTime) },
          { key: "punchOutTime", label: "Out", render: (row) => toTimeLabel(row.punchOutTime) },
          { key: "totalWorkingHours", label: "Hours", render: (row) => row.totalWorkingHours || "--" },
        ]}
        rows={records.sort((a, b) => String(b.date).localeCompare(String(a.date)))}
      />
    </div>
  );
};

export const StaffLeaves = () => {
  const { userProfile } = useAuth();
  const { staff, leaves } = useStaffData();
  const [values, setValues] = useState({ leaveType: "Full Day", fromDate: formatDateKey(), toDate: formatDateKey(), reason: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    await applyLeave({ userProfile, staffName: staff?.name || userProfile.name, values });
    setValues({ leaveType: "Full Day", fromDate: formatDateKey(), toDate: formatDateKey(), reason: "" });
    setMessage("Leave request submitted.");
    setLoading(false);
  };

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="text-xl font-bold text-gray-950">My Leaves</h2>
        <p className="text-sm font-medium text-gray-700">Apply leave and track pending, approved, and rejected requests.</p>
      </div>
      {message && <Alert>{message}</Alert>}
      <LeaveForm values={values} loading={loading} onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))} onSubmit={submit} />
      <Table
        columns={[
          { key: "leaveType", label: "Type" },
          { key: "fromDate", label: "From" },
          { key: "toDate", label: "To" },
          { key: "reason", label: "Reason" },
          { key: "status", label: "Status", render: (row) => <Badge tone={row.status}>{row.status}</Badge> },
        ]}
        rows={leaves}
      />
    </div>
  );
};

export const StaffSalarySlips = () => {
  const { staff, shop, reports } = useStaffData();
  const [month, setMonth] = useState(formatMonthKey());
  const visible = reports.filter((report) => report.month === month);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-950">Salary Slips</h2>
        <p className="text-sm font-medium text-gray-700">View payment status and download your monthly salary slip.</p>
      </div>
      <div className="mb-4 max-w-xs"><MonthFilter value={month} onChange={setMonth} /></div>
      <div className="grid gap-4">
        {visible.map((report) => (
          <section key={report.id} className="grid gap-2">
            <SalarySlipTemplate report={report} shop={shop} staff={staff} />
            <Button className="w-full sm:w-max" onClick={() => downloadSalaryPdf({ report, shop, staff })}>
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </section>
        ))}
      </div>
      {!visible.length && <EmptyState title="No salary slip for this month" />}
    </div>
  );
};

export const StaffProfile = () => {
  const { userProfile } = useAuth();
  const { staff } = useStaffData();

  return (
    <div className="grid gap-4">
      <Card className="text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-orange-50 text-orange-700">
          <UserCircle className="h-7 w-7" />
        </div>
        <h2 className="mt-3 text-xl font-bold text-gray-950">{staff?.name || userProfile?.name}</h2>
        <p className="text-sm font-medium text-gray-700">{staff?.designation || "Staff"} - {staff?.department || "Shop"}</p>
      </Card>
      <Card>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <p><b>Email:</b> {userProfile?.email}</p>
          <p><b>Phone:</b> {staff?.phone || userProfile?.phone}</p>
          <p><b>Joining date:</b> {staff?.joiningDate || "--"}</p>
          <p><b>Salary:</b> {money(staff?.monthlySalary)}</p>
          <p><b>Bank:</b> {staff?.bankDetails?.bankName || "--"}</p>
          <p><b>UPI:</b> {staff?.bankDetails?.upiId || "--"}</p>
        </div>
      </Card>
      <AboutWebReich />
    </div>
  );
};
