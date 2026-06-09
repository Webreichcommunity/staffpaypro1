import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyCI1SBnnK6OstpdpXVgGkStT7mf059SmnI",
  authDomain: "attandancesysbhamare.firebaseapp.com",
  projectId: "attandancesysbhamare",
  storageBucket: "attandancesysbhamare.firebasestorage.app",
  messagingSenderId: "236948912016",
  appId: "1:236948912016:web:bac95945005b95a249e515",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
