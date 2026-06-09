import { useCallback, useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { Link } from "react-router-dom";
import { Banknote, CalendarCheck, CheckCircle2, Clock3, Download, Loader2, QrCode, RotateCcw, UserCircle } from "lucide-react";
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
  validateAttendanceToken,
} from "../../services/firestoreService";
import { formatDateKey, formatMonthKey, getMonthDateKeys, toTimeLabel } from "../../utils/dateUtils";
import { calculateDistanceMeters, getBrowserLocation, isWithinRadius } from "../../utils/locationUtils";
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
  const { leaves, reports } = useStaffData();
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
    <div className="grid gap-5">
      <Card className="bg-gray-950 text-white">
        <p className="text-sm text-orange-200">Today status</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">{today?.punchInTime ? "You are punched in" : today?.status || "Not punched in"}</h2>
            <p className="mt-1 text-sm text-gray-300">
              {today?.punchInTime ? `Punch in time: ${toTimeLabel(today.punchInTime)}` : "Scan shop QR to mark today's attendance"}
            </p>
            {today?.punchOutTime && <p className="mt-1 text-sm text-gray-300">Punch out time: {toTimeLabel(today.punchOutTime)}</p>}
          </div>
          <QrCode className="h-10 w-10 text-orange-300" />
        </div>
        {today?.punchOutTime ? (
          <div className="mt-5 rounded-xl bg-green-500/15 px-4 py-3 text-center text-sm font-bold text-green-200">Attendance completed for today</div>
        ) : (
          <Link to="/staff/scan-attendance" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-4 text-base font-bold text-white shadow-orange-glow">
            <QrCode className="h-5 w-5" /> {today?.punchInTime ? "Scan QR to Punch Out" : "Scan QR to Punch In"}
          </Link>
        )}
      </Card>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
              <p className="text-sm text-gray-500">{money(latestSlip.netSalary)} - {latestSlip.paymentStatus}</p>
            </div>
            <Badge tone={latestSlip.paymentStatus}>{latestSlip.paymentStatus}</Badge>
          </div>
        ) : <EmptyState title="No salary slips yet" />}
      </Card>
    </div>
  );
};

export const StaffPunch = () => (
  <div className="grid gap-5">
    <LocationPermissionBox />
    <Card className="text-center">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-orange-600 text-white shadow-orange-glow">
        <QrCode className="h-10 w-10" />
      </div>
      <h2 className="mt-4 text-2xl font-black text-gray-950">Scan shop QR</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">Scan shop QR to mark today's attendance. Expired QR codes will not work.</p>
      <Link to="/staff/scan-attendance" className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-orange-600 px-4 py-4 text-base font-bold text-white shadow-orange-glow">
        Scan QR
      </Link>
    </Card>
  </div>
);

export const StaffScanAttendance = () => {
  const { userProfile } = useAuth();
  const { shop } = useStaffData();
  const [token, setToken] = useState(new URLSearchParams(window.location.search).get("token") || "");
  const [shopId, setShopId] = useState(new URLSearchParams(window.location.search).get("shopId") || userProfile?.shopId || "");
  const [attendance, setAttendance] = useState(null);
  const [location, setLocation] = useState(null);
  const [distance, setDistance] = useState(Number.POSITIVE_INFINITY);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const preparePunch = useCallback(async (nextToken = token, nextShopId = shopId) => {
    setError("");
    setMessage("");
    setVerifying(true);
    setLocation(null);
    try {
      if (!nextToken || !nextShopId) return;
      if (!userProfile?.shopId || !userProfile?.uid) throw new Error("Your staff profile is still loading. Please try again.");
      if (nextShopId !== userProfile.shopId) throw new Error("QR belongs to a different shop.");
      if (!shop?.location?.lat || !shop?.location?.lng) throw new Error("No shop location set. Please contact admin.");
      if (userProfile.isActive === false) throw new Error("Your staff account is inactive.");
      await validateAttendanceToken({ token: nextToken, shopId: nextShopId });
      const currentLocation = await getBrowserLocation();
      const currentDistance = calculateDistanceMeters(currentLocation, shop.location);
      if (!isWithinRadius(currentLocation, shop.location, shop.attendanceRadiusMeters)) {
        throw new Error("You are outside the allowed attendance area.");
      }
      setLocation(currentLocation);
      setDistance(currentDistance);
      setAttendance(await getTodayAttendance(userProfile.shopId, userProfile.uid));
      setMessage("QR and location verified. You can mark attendance now.");
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  }, [shop, shopId, token, userProfile]);

  useEffect(() => {
    if (!shop || !token || !shopId) return undefined;
    const timer = window.setTimeout(() => preparePunch(token, shopId), 0);
    return () => window.clearTimeout(timer);
  }, [preparePunch, shop, shopId, token]);

  const state = useMemo(() => {
    if (!attendance?.punchInTime) return { action: "in", title: "Ready to Punch In", description: "Your QR and shop location are verified." };
    if (!attendance?.punchOutTime) return { action: "out", title: "Ready to Punch Out", description: `Punch in: ${toTimeLabel(attendance.punchInTime)}` };
    return { action: "done", title: "Attendance completed", description: "Punch In successful and Punch Out successful for today." };
  }, [attendance]);

  const handleScanResult = useCallback((decodedText) => {
    try {
      const url = new URL(decodedText);
      const nextShopId = url.searchParams.get("shopId");
      const nextToken = url.searchParams.get("token");
      if (!nextShopId || !nextToken) throw new Error("Missing QR attendance details.");
      setError("");
      setMessage("");
      setShopId(nextShopId);
      setToken(nextToken);
    } catch {
      setError("QR invalid. Please scan the live shop QR again.");
    }
  }, []);

  const submitPunch = async (type) => {
    setLoading(true);
    setError("");
    try {
      if (type === "in") {
        await punchIn({ userProfile, shop, token, location });
        setMessage("Punch In successful");
      } else {
        await punchOut({ userProfile, shop, token, location });
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
    <div className="grid gap-5">
      <LocationPermissionBox />
      {!token && <QRScanner onResult={handleScanResult} />}
      {token && !shop && (
        <Card className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-orange-600" />
          <p className="mt-3 font-bold text-gray-950">Loading shop attendance...</p>
        </Card>
      )}
      {verifying && (
        <Card className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-orange-600" />
          <p className="mt-3 font-bold text-gray-950">Verifying QR and shop location...</p>
          <p className="mt-1 text-sm text-gray-500">Please allow location permission when asked.</p>
        </Card>
      )}
      {message && <Alert>{message}</Alert>}
      {error && (
        <div className="grid gap-3">
          <Alert tone="danger">{error}</Alert>
          <Button tone="light" onClick={() => { setToken(""); setShopId(userProfile?.shopId || ""); setError(""); setMessage(""); }}>
            <RotateCcw className="h-4 w-4" /> Scan Another QR
          </Button>
        </div>
      )}
      {!verifying && location && (
        <PunchCard
          state={state}
          distance={distance}
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
      <div className="mb-5">
        <h2 className="text-2xl font-black text-gray-950">My Attendance</h2>
        <p className="text-sm text-gray-500">Month-wise punch history and statuses.</p>
      </div>
      <div className="mb-5 max-w-xs"><MonthFilter value={month} onChange={setMonth} /></div>
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
    <div className="grid gap-5">
      <div>
        <h2 className="text-2xl font-black text-gray-950">My Leaves</h2>
        <p className="text-sm text-gray-500">Apply leave and track pending, approved, and rejected requests.</p>
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
      <div className="mb-5">
        <h2 className="text-2xl font-black text-gray-950">Salary Slips</h2>
        <p className="text-sm text-gray-500">View payment status and download your monthly salary slip.</p>
      </div>
      <div className="mb-5 max-w-xs"><MonthFilter value={month} onChange={setMonth} /></div>
      <div className="grid gap-5">
        {visible.map((report) => (
          <Card key={report.id}>
            <SalarySlipTemplate report={report} shop={shop} staff={staff} />
            <Button className="mt-4 w-full" onClick={() => downloadSalaryPdf({ report, shop, staff })}>
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </Card>
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
    <div className="grid gap-5">
      <Card className="text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gray-950 text-white">
          <UserCircle className="h-10 w-10" />
        </div>
        <h2 className="mt-4 text-2xl font-black text-gray-950">{staff?.name || userProfile?.name}</h2>
        <p className="text-sm text-gray-500">{staff?.designation || "Staff"} - {staff?.department || "Shop"}</p>
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
