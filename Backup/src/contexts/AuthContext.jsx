import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../Firebase/config";
import { ensureAdminShop, getUserProfile } from "../services/firestoreService";
import { AuthContext } from "./authContextValue";
import { loginWithIdentifier } from "../services/authService";

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setAuthError("");
      try {
        setCurrentUser(user);
        if (!user) {
          setUserProfile(null);
          return;
        }
        const profile = await getUserProfile(user.uid);
        if (!profile) {
          setUserProfile(null);
          setAuthError("User profile not found. Create users/{uid} in Firestore with an admin or staff role.");
          return;
        }
        const shopId = await ensureAdminShop(user, profile);
        setUserProfile(shopId ? { ...profile, shopId } : profile);
      } catch (error) {
        setAuthError(error.message);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      userProfile,
      userRole: userProfile?.role || null,
      loading,
      authError,
      login: (identifier, password) => loginWithIdentifier(identifier, password),
      logout: () => signOut(auth),
    }),
    [authError, currentUser, loading, userProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
