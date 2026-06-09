import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { auth, db, firebaseConfig } from "../Firebase/config";

const normalizeLoginAlias = (value = "") => value.trim().toLowerCase();

export const resolveLoginEmail = async (identifier) => {
  const value = identifier.trim();
  if (value.includes("@")) return value;

  const aliasSnapshot = await getDoc(doc(db, "loginNames", normalizeLoginAlias(value)));
  if (!aliasSnapshot.exists()) {
    throw new Error("Login ID or username not found. Use your email if aliases are not enabled in Firestore rules.");
  }

  return aliasSnapshot.data().email;
};

export const loginWithIdentifier = async (identifier, password) => {
  const email = await resolveLoginEmail(identifier);
  return signInWithEmailAndPassword(auth, email, password);
};

export const hasExistingAdmin = async () => {
  const snapshot = await getDocs(query(collection(db, "users"), where("role", "==", "admin"), limit(1)));
  return !snapshot.empty;
};

export const createMainAdminAccount = async (form) => {
  const credential = await createUserWithEmailAndPassword(auth, form.email, form.password);
  const uid = credential.user.uid;
  const shopId = uid;
  const adminId = form.adminId.trim();
  const username = form.username.trim();

  await Promise.all([
    setDoc(doc(db, "users", uid), {
      uid,
      role: "admin",
      shopId,
      adminId,
      username,
      name: form.name,
      email: form.email,
      phone: form.phone || "",
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
    setDoc(doc(db, "shops", shopId), {
      shopName: form.shopName || "StaffPay Pro Shop",
      ownerName: form.name,
      phone: form.phone || "",
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
    setDoc(doc(db, "loginNames", normalizeLoginAlias(adminId)), {
      uid,
      role: "admin",
      email: form.email,
      type: "adminId",
      createdAt: serverTimestamp(),
    }),
    setDoc(doc(db, "loginNames", normalizeLoginAlias(username)), {
      uid,
      role: "admin",
      email: form.email,
      type: "username",
      createdAt: serverTimestamp(),
    }),
  ]);

  return { uid, shopId, adminId, username };
};

export const createStaffAccount = async ({ adminProfile, form }) => {
  const secondaryApp = initializeApp(firebaseConfig, `staff-creator-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, form.email, form.password);
    const uid = credential.user.uid;
    const shopId = adminProfile.shopId || adminProfile.uid;
    const userPayload = {
      uid,
      role: "staff",
      shopId,
      name: form.name,
      email: form.email,
      phone: form.phone || "",
      isActive: form.isActive ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const staffPayload = {
      uid,
      shopId,
      name: form.name,
      email: form.email,
      phone: form.phone || "",
      address: form.address || "",
      gender: form.gender || "",
      dob: form.dob || "",
      joiningDate: form.joiningDate || "",
      designation: form.designation || "",
      department: form.department || "",
      monthlySalary: Number(form.monthlySalary || 0),
      salaryType: form.salaryType || "Monthly",
      bankDetails: {
        bankName: form.bankName || "",
        accountNumber: form.accountNumber || "",
        ifsc: form.ifsc || "",
        upiId: form.upiId || "",
      },
      emergencyContact: form.emergencyContact || "",
      photoUrl: form.photoUrl || "",
      isActive: form.isActive ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await Promise.all([
      setDoc(doc(db, "users", uid), userPayload),
      setDoc(doc(db, "staff", uid), staffPayload),
    ]);
    return { uid, ...staffPayload };
  } finally {
    await signOut(secondaryAuth).catch(() => {});
  }
};
