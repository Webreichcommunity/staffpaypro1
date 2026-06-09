import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../Firebase/config";
import { formatDateKey, minutesBetweenTimestamps, minutesFromTime } from "../utils/dateUtils";
import { calculateSalary } from "../utils/salaryUtils";

export const getUserProfile = async (uid) => {
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

export const ensureAdminShop = async (user, profile) => {
  if (!profile || profile.role !== "admin") return null;
  const shopId = profile.shopId || user.uid;
  const shopRef = doc(db, "shops", shopId);
  const shopSnap = await getDoc(shopRef);
  if (!shopSnap.exists()) {
    await setDoc(shopRef, {
      shopName: "StaffPay Pro Shop",
      ownerName: profile.name || user.email,
      phone: profile.phone || "",
      address: "",
      city: "",
      openingTime: "10:00",
      closingTime: "20:00",
      graceMinutes: 10,
      fullDayHours: 8,
      halfDayHours: 4,
      weeklyOffDay: "Sunday",
      attendanceRadiusMeters: 100,
      location: { lat: 0, lng: 0 },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, "users", user.uid), { ...profile, shopId, updatedAt: serverTimestamp() }, { merge: true });
  }
  return shopId;
};

export const saveShopSettings = async (shopId, values) =>
  setDoc(
    doc(db, "shops", shopId),
    {
      ...values,
      graceMinutes: Number(values.graceMinutes || 0),
      fullDayHours: Number(values.fullDayHours || 8),
      halfDayHours: Number(values.halfDayHours || 4),
      attendanceRadiusMeters: Number(values.attendanceRadiusMeters || 100),
      location: {
        lat: Number(values.location?.lat || values.lat || 0),
        lng: Number(values.location?.lng || values.lng || 0),
      },
      updatedAt: serverTimestamp(),
      createdAt: values.createdAt || serverTimestamp(),
    },
    { merge: true },
  );

export const listenCollection = (collectionName, constraints, callback) => {
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(q, (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))));
};

export const fetchShopStaff = async (shopId) => {
  const snapshot = await getDocs(query(collection(db, "staff"), where("shopId", "==", shopId)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const updateStaff = async (staffId, values) =>
  Promise.all([
    updateDoc(doc(db, "staff", staffId), { ...values, updatedAt: serverTimestamp() }),
    updateDoc(doc(db, "users", staffId), {
      name: values.name,
      phone: values.phone,
      isActive: values.isActive,
      updatedAt: serverTimestamp(),
    }),
  ]);

export const deleteStaff = async (staffId) =>
  Promise.all([
    deleteDoc(doc(db, "staff", staffId)),
    deleteDoc(doc(db, "users", staffId)),
  ]);

export const createAttendanceToken = async (shopId) => {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 60000);
  await addDoc(collection(db, "attendanceTokens"), {
    shopId,
    token,
    date: formatDateKey(),
    createdAt: serverTimestamp(),
    expiresAt,
    isActive: true,
  });
  return token;
};

export const validateAttendanceToken = async ({ token, shopId }) => {
  const snapshot = await getDocs(
    query(collection(db, "attendanceTokens"), where("token", "==", token), where("shopId", "==", shopId)),
  );
  const tokenDoc = snapshot.docs[0];
  if (!tokenDoc) throw new Error("QR invalid. Please scan the live shop QR again.");
  const data = tokenDoc.data();
  const expiry = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
  if (!data.isActive || expiry.getTime() < Date.now()) throw new Error("QR expired. Please scan the refreshed code.");
  return { id: tokenDoc.id, ...data };
};

export const getShop = async (shopId) => {
  const snapshot = await getDoc(doc(db, "shops", shopId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

export const getAttendanceRef = (shopId, dateKey, staffId) =>
  doc(db, "attendance", shopId, "dates", dateKey, "records", staffId);

export const getTodayAttendance = async (shopId, staffId, dateKey = formatDateKey()) => {
  const snapshot = await getDoc(getAttendanceRef(shopId, dateKey, staffId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

export const punchIn = async ({ userProfile, shop, token, location }) => {
  const date = formatDateKey();
  const existing = await getTodayAttendance(userProfile.shopId, userProfile.uid, date);
  if (existing?.punchInTime) throw new Error("Already punched in for today.");
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const lateAfter = minutesFromTime(shop.openingTime || "10:00") + Number(shop.graceMinutes || 0);
  const isLate = nowMinutes > lateAfter;

  await setDoc(getAttendanceRef(userProfile.shopId, date, userProfile.uid), {
    staffId: userProfile.uid,
    shopId: userProfile.shopId,
    date,
    punchInTime: serverTimestamp(),
    punchInLocation: location,
    punchInToken: token,
    status: isLate ? "late" : "present",
    dayStatus: "pending",
    isLate,
    lateMinutes: isLate ? nowMinutes - lateAfter : 0,
    markedBy: "self",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const punchOut = async ({ userProfile, shop, token, location }) => {
  const date = formatDateKey();
  const existing = await getTodayAttendance(userProfile.shopId, userProfile.uid, date);
  if (!existing?.punchInTime) throw new Error("Punch in before punching out.");
  if (existing?.punchOutTime) throw new Error("Attendance already completed for today.");
  const totalMinutes = minutesBetweenTimestamps(existing.punchInTime, new Date());
  const totalWorkingHours = Number((totalMinutes / 60).toFixed(2));
  const dayStatus = totalWorkingHours >= Number(shop.fullDayHours || 8) ? "full-day" : "half-day";

  await updateDoc(getAttendanceRef(userProfile.shopId, date, userProfile.uid), {
    punchOutTime: serverTimestamp(),
    punchOutLocation: location,
    punchOutToken: token,
    totalWorkingHours,
    dayStatus,
    status: dayStatus === "half-day" ? "half-day" : existing.isLate ? "late" : "present",
    updatedAt: serverTimestamp(),
  });
};

export const fetchAttendanceForDate = async (shopId, dateKey = formatDateKey()) => {
  const snapshot = await getDocs(collection(db, "attendance", shopId, "dates", dateKey, "records"));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const listenAttendanceForDate = (shopId, dateKey, callback) =>
  onSnapshot(collection(db, "attendance", shopId, "dates", dateKey, "records"), (snapshot) =>
    callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
  );

export const correctAttendance = async ({ shopId, staffId, date, changedBy, oldData, newData, reason }) => {
  await Promise.all([
    setDoc(getAttendanceRef(shopId, date, staffId), { ...newData, updatedAt: serverTimestamp(), markedBy: "admin" }, { merge: true }),
    addDoc(collection(db, "attendanceCorrections"), {
      shopId,
      staffId,
      date,
      changedBy,
      oldData,
      newData,
      reason,
      createdAt: serverTimestamp(),
    }),
  ]);
};

export const markManualAttendance = async ({ shopId, staffId, date, punchIn, punchOut, status, reason, changedBy }) => {
  const punchInDate = status !== "absent" && punchIn ? new Date(`${date}T${punchIn}:00`) : null;
  const punchOutDate = status !== "absent" && punchOut ? new Date(`${date}T${punchOut}:00`) : null;
  if (punchInDate && punchOutDate && punchOutDate <= punchInDate) throw new Error("Punch out time must be after punch in time.");

  const existing = await getTodayAttendance(shopId, staffId, date);
  const totalMinutes = punchInDate && punchOutDate ? Math.round((punchOutDate - punchInDate) / 60000) : 0;
  const payload = {
    staffId,
    shopId,
    date,
    punchInTime: punchInDate ? Timestamp.fromDate(punchInDate) : null,
    punchOutTime: punchOutDate ? Timestamp.fromDate(punchOutDate) : null,
    totalWorkingHours: Number((totalMinutes / 60).toFixed(2)),
    status,
    dayStatus: status === "absent" ? "absent" : status === "half-day" ? "half-day" : punchOutDate ? "full-day" : "pending",
    isLate: status === "late",
    markedBy: "admin",
    manualReason: reason,
    updatedAt: serverTimestamp(),
    createdAt: existing?.createdAt || serverTimestamp(),
  };

  await Promise.all([
    setDoc(getAttendanceRef(shopId, date, staffId), payload, { merge: true }),
    addDoc(collection(db, "attendanceCorrections"), {
      shopId,
      staffId,
      date,
      changedBy,
      oldData: existing || {},
      newData: payload,
      reason,
      type: existing ? "manual-update" : "manual-attendance",
      createdAt: serverTimestamp(),
    }),
  ]);
};

export const finalizeAttendance = async ({ shopId, dateKey = formatDateKey() }) => {
  const staff = await fetchShopStaff(shopId);
  const attendance = await fetchAttendanceForDate(shopId, dateKey);
  const presentIds = new Set(attendance.map((record) => record.staffId));
  const batch = writeBatch(db);
  staff.filter((member) => member.isActive && !presentIds.has(member.uid)).forEach((member) => {
    batch.set(getAttendanceRef(shopId, dateKey, member.uid), {
      staffId: member.uid,
      shopId,
      date: dateKey,
      status: "absent",
      dayStatus: "absent",
      markedBy: "system",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
};

export const saveBulkManualAttendance = async ({ shopId, date, staff, selections, reason, changedBy }) => {
  const batch = writeBatch(db);
  staff.filter((member) => member.isActive !== false).forEach((member) => {
    const status = selections[member.uid] || "absent";
    batch.set(getAttendanceRef(shopId, date, member.uid), {
      staffId: member.uid,
      shopId,
      date,
      status,
      dayStatus: status === "present" ? "full-day" : "absent",
      punchInTime: null,
      punchOutTime: null,
      totalWorkingHours: status === "present" ? null : 0,
      isLate: false,
      markedBy: "admin",
      manualReason: reason || "",
      changedBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
  await batch.commit();
};

export const applyLeave = async ({ userProfile, staffName, values }) =>
  addDoc(collection(db, "leaves"), {
    shopId: userProfile.shopId,
    staffId: userProfile.uid,
    staffName,
    leaveType: values.leaveType,
    fromDate: values.fromDate,
    toDate: values.toDate,
    reason: values.reason,
    attachmentUrl: values.attachmentUrl || "",
    status: "pending",
    adminNote: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

export const updateLeaveStatus = async ({ leaveId, status, adminNote, approvedBy }) =>
  updateDoc(doc(db, "leaves", leaveId), {
    status,
    adminNote,
    approvedBy,
    updatedAt: serverTimestamp(),
  });

export const generateSalaryReport = async ({ shopId, staff, month, shop, attendanceRecords, leaves, advances = [], generatedBy, extras }) => {
  const advanceDeduction = advances.reduce((sum, advance) => sum + Number(advance.amount || 0), 0);
  const result = calculateSalary({ staff, month, shop, attendanceRecords, approvedLeaves: leaves, ...extras, advanceDeduction });
  const reportId = `${shopId}_${month}_${staff.uid}`;
  const existingSnap = await getDoc(doc(db, "salaryReports", reportId));
  const amountPaid = Number(existingSnap.data()?.amountPaid || 0);
  const paymentStatus = amountPaid >= result.netSalary && result.netSalary > 0 ? "paid" : amountPaid > 0 ? "partial" : "pending";
  const payload = {
    shopId,
    staffId: staff.uid,
    staffName: staff.name,
    designation: staff.designation || "",
    month,
    ...result,
    generatedAt: serverTimestamp(),
    generatedBy,
    advanceIds: advances.map((advance) => advance.id),
    amountPaid,
    paymentStatus,
  };
  await setDoc(doc(db, "salaryReports", reportId), payload, { merge: true });
  return { id: reportId, ...payload };
};

export const deleteSalaryReport = (reportId) => deleteDoc(doc(db, "salaryReports", reportId));

export const updateSalaryReport = (reportId, values, report) => {
  const bonus = Number(values.bonus || 0);
  const overtimeAmount = Number(values.overtimeAmount || 0);
  const otherDeduction = Number(values.otherDeduction || 0);
  const advanceDeduction = Number(report.advanceDeduction || 0);
  const attendanceSalary = Number(report.attendanceSalary ?? Math.max(0, Number(report.monthlySalary || 0) - Number(report.absentDeduction || 0) - Number(report.halfDayDeduction || 0) - Number(report.leaveDeduction || 0)));
  const grossSalary = attendanceSalary + bonus + overtimeAmount;
  const totalDeductions = advanceDeduction + otherDeduction;
  const netSalary = Math.max(0, grossSalary - totalDeductions);
  const amountPaid = Number(report.amountPaid || 0);
  const paymentStatus = amountPaid >= netSalary && netSalary > 0 ? "paid" : amountPaid > 0 ? "partial" : "pending";
  return updateDoc(doc(db, "salaryReports", reportId), {
    bonus,
    overtimeAmount,
    otherDeduction,
    note: values.note || "",
    grossSalary,
    totalDeductions,
    netSalary,
    paymentStatus,
    updatedAt: serverTimestamp(),
  });
};

export const recordAdvance = ({ shopId, staff, values, createdBy }) =>
  addDoc(collection(db, "advances"), {
    shopId,
    staffId: staff.uid,
    staffName: staff.name,
    amount: Number(values.amount || 0),
    advanceDate: values.advanceDate,
    deductionMonth: values.deductionMonth,
    notes: values.notes || "",
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

export const updateAdvance = (advanceId, values) =>
  updateDoc(doc(db, "advances", advanceId), {
    amount: Number(values.amount || 0),
    advanceDate: values.advanceDate,
    deductionMonth: values.deductionMonth,
    notes: values.notes || "",
    updatedAt: serverTimestamp(),
  });

export const deleteAdvance = (advanceId) => deleteDoc(doc(db, "advances", advanceId));

const refreshReportPaymentStatus = async (reportId) => {
  const reportSnap = await getDoc(doc(db, "salaryReports", reportId));
  if (!reportSnap.exists()) return;
  const paymentsSnap = await getDocs(query(collection(db, "payments"), where("salaryReportId", "==", reportId)));
  const paid = paymentsSnap.docs.reduce((sum, item) => sum + Number(item.data().amountPaid || 0), 0);
  const netSalary = Number(reportSnap.data().netSalary || 0);
  const paymentStatus = paid >= netSalary && netSalary > 0 ? "paid" : paid > 0 ? "partial" : "pending";
  await updateDoc(doc(db, "salaryReports", reportId), { paymentStatus, amountPaid: paid, updatedAt: serverTimestamp() });
};

export const recordPayment = async ({ report, values, createdBy }) => {
  await addDoc(collection(db, "payments"), {
    shopId: report.shopId,
    staffId: report.staffId,
    salaryReportId: report.id,
    month: report.month,
    amountPaid: Number(values.amountPaid || 0),
    paymentMode: values.paymentMode,
    paymentDate: values.paymentDate,
    transactionId: values.transactionId || "",
    notes: values.notes || "",
    createdAt: serverTimestamp(),
    createdBy,
  });
  await refreshReportPaymentStatus(report.id);
};

export const updatePayment = async (paymentId, values, reportId) => {
  await updateDoc(doc(db, "payments", paymentId), {
    amountPaid: Number(values.amountPaid || 0),
    paymentMode: values.paymentMode,
    paymentDate: values.paymentDate,
    transactionId: values.transactionId || "",
    notes: values.notes || "",
    updatedAt: serverTimestamp(),
  });
  await refreshReportPaymentStatus(reportId);
};

export const deletePayment = async (paymentId, reportId) => {
  await deleteDoc(doc(db, "payments", paymentId));
  await refreshReportPaymentStatus(reportId);
};

export const deleteAttendanceToken = (id) => deleteDoc(doc(db, "attendanceTokens", id));
