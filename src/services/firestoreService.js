import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../Firebase/config";
import { calculatePunchOutOutcome } from "../utils/attendanceUtils";
import { formatDateKey, getAttendanceDateKey, minutesBetweenTimestamps, minutesFromTime } from "../utils/dateUtils";
import { isValidLocation, normalizeLocation } from "../utils/locationUtils";
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
      monthlyExtraPaidDays: 4,
      attendanceRadiusMeters: 100,
      location: { lat: 0, lng: 0 },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, "users", user.uid), { ...profile, shopId, updatedAt: serverTimestamp() }, { merge: true });
  }
  return shopId;
};

export const saveShopSettings = async (shopId, values) => {
  const location = normalizeLocation(values.location);
  const attendanceRadiusMeters = Number(values.attendanceRadiusMeters);
  const monthlyExtraPaidDays = Number(values.monthlyExtraPaidDays ?? values.monthlyPaidOffDays ?? 4);
  if (!isValidLocation(location)) throw new Error("Set a valid shop latitude and longitude before saving.");
  if (!Number.isFinite(attendanceRadiusMeters) || attendanceRadiusMeters <= 0) {
    throw new Error("Attendance radius must be greater than 0 meters.");
  }
  if (!Number.isInteger(monthlyExtraPaidDays) || monthlyExtraPaidDays < 0) {
    throw new Error("Monthly extra salary days must be a whole number of 0 or more days.");
  }

  return setDoc(
    doc(db, "shops", shopId),
    {
      ...values,
      graceMinutes: Number(values.graceMinutes || 0),
      fullDayHours: Number(values.fullDayHours || 8),
      halfDayHours: Number(values.halfDayHours || 4),
      monthlyExtraPaidDays,
      attendanceRadiusMeters,
      location,
      updatedAt: serverTimestamp(),
      createdAt: values.createdAt || serverTimestamp(),
    },
    { merge: true },
  );
};

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

export const getCurrentAttendance = async (shopId, staffId, shop, date = new Date()) => {
  const dateKey = getAttendanceDateKey(shop, date);
  return getTodayAttendance(shopId, staffId, dateKey);
};

export const punchIn = async ({ userProfile, shop, location }) => {
  const now = new Date();
  const date = getAttendanceDateKey(shop, now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const lateAfter = minutesFromTime(shop.openingTime || "10:00") + Number(shop.graceMinutes || 0);
  const isLate = nowMinutes > lateAfter;
  const attendanceRef = getAttendanceRef(userProfile.shopId, date, userProfile.uid);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(attendanceRef);
    const existing = snapshot.exists() ? snapshot.data() : null;
    if (existing?.punchInTime) throw new Error(`You already punched in today at ${existing.punchInTime?.toDate?.().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "the recorded time"}.`);
    transaction.set(attendanceRef, {
      staffId: userProfile.uid,
      shopId: userProfile.shopId,
      date,
      punchInTime: serverTimestamp(),
      punchInLocation: location,
      status: isLate ? "late" : "present",
      dayStatus: "pending",
      isLate,
      lateMinutes: isLate ? nowMinutes - lateAfter : 0,
      markedBy: "self",
      calendarOverride: deleteField(),
      calendarOriginal: deleteField(),
      createdAt: existing?.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
};

export const punchOut = async ({ userProfile, shop, location, attendanceDate }) => {
  const date = attendanceDate || getAttendanceDateKey(shop);
  const attendanceRef = getAttendanceRef(userProfile.shopId, date, userProfile.uid);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(attendanceRef);
    const existing = snapshot.exists() ? snapshot.data() : null;
    if (!existing?.punchInTime) throw new Error("Punch in before punching out.");
    if (existing?.punchOutTime) throw new Error("Attendance already completed for today.");
    const totalMinutes = minutesBetweenTimestamps(existing.punchInTime, new Date());
    const outcome = calculatePunchOutOutcome({ totalMinutes, shop, isLate: existing.isLate });
    transaction.update(attendanceRef, {
      punchOutTime: serverTimestamp(),
      punchOutLocation: location,
      totalWorkingHours: outcome.totalWorkingHours,
      dayStatus: outcome.dayStatus,
      status: outcome.status,
      metConfiguredFullDayHours: outcome.metConfiguredFullDayHours,
      updatedAt: serverTimestamp(),
    });
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

const calendarDayStatus = (status) => status === "present" ? "full-day" : status;

const withoutCalendarOverride = (data = {}) => {
  const restored = { ...data };
  delete restored.calendarOverride;
  delete restored.calendarOriginal;
  return restored;
};

export const setStaffCalendarAttendance = async ({ shopId, staffId, date, status, changedBy }) => {
  const attendanceRef = getAttendanceRef(shopId, date, staffId);
  const correctionRef = doc(collection(db, "attendanceCorrections"));

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(attendanceRef);
    const existing = snapshot.exists() ? snapshot.data() : null;
    const original = existing?.calendarOverride ? existing.calendarOriginal || null : existing;

    if (!status) {
      if (!existing?.calendarOverride) return;
      if (original) transaction.set(attendanceRef, { ...original, updatedAt: serverTimestamp() });
      else transaction.delete(attendanceRef);
    } else {
      transaction.set(attendanceRef, {
        staffId,
        shopId,
        date,
        status,
        dayStatus: calendarDayStatus(status),
        punchInTime: null,
        punchOutTime: null,
        totalWorkingHours: status === "absent" ? 0 : null,
        isLate: false,
        markedBy: "admin",
        changedBy,
        manualReason: "Staff profile calendar update",
        calendarOverride: true,
        calendarOriginal: original ? withoutCalendarOverride(original) : null,
        createdAt: existing?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    transaction.set(correctionRef, {
      shopId,
      staffId,
      date,
      changedBy,
      oldData: existing || {},
      newData: status ? { status, dayStatus: calendarDayStatus(status) } : original || {},
      reason: status ? `Calendar status changed to ${status}` : "Calendar override restored",
      type: "staff-calendar-update",
      createdAt: serverTimestamp(),
    });
  });
};

export const setStaffMonthAttendance = async ({ shopId, staffId, dates, status, changedBy }) => {
  await runTransaction(db, async (transaction) => {
    const entries = await Promise.all(dates.map(async (date) => {
      const attendanceRef = getAttendanceRef(shopId, date, staffId);
      const snapshot = await transaction.get(attendanceRef);
      return { date, attendanceRef, existing: snapshot.exists() ? snapshot.data() : null };
    }));

    entries.forEach(({ date, attendanceRef, existing }) => {
      const original = existing?.calendarOverride ? existing.calendarOriginal || null : existing;
      if (!status) {
        if (!existing?.calendarOverride) return;
        if (original) transaction.set(attendanceRef, { ...original, updatedAt: serverTimestamp() });
        else transaction.delete(attendanceRef);
      } else {
        transaction.set(attendanceRef, {
          staffId,
          shopId,
          date,
          status,
          dayStatus: calendarDayStatus(status),
          punchInTime: null,
          punchOutTime: null,
          totalWorkingHours: status === "absent" ? 0 : null,
          isLate: false,
          markedBy: "admin",
          changedBy,
          manualReason: "Bulk staff profile calendar update",
          calendarOverride: true,
          calendarOriginal: original ? withoutCalendarOverride(original) : null,
          createdAt: existing?.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      transaction.set(doc(collection(db, "attendanceCorrections")), {
        shopId,
        staffId,
        date,
        changedBy,
        oldData: existing || {},
        newData: status ? { status, dayStatus: calendarDayStatus(status) } : original || {},
        reason: status ? `Bulk calendar status changed to ${status}` : "Bulk calendar override restored",
        type: "staff-calendar-bulk-update",
        createdAt: serverTimestamp(),
      });
    });
  });
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
    advanceDetails: advances.map((advance) => ({
      id: advance.id,
      amount: Number(advance.amount || 0),
      advanceDate: advance.advanceDate || "",
      deductionMonth: advance.deductionMonth || month,
      notes: advance.notes || "",
    })),
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
