import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { Clock3, LogIn, MapPin, ScanLine, ShieldCheck, Smartphone } from "lucide-react";
import { db } from "../../Firebase/config";
import { Alert, Button, Card, Loader } from "../../components/common/UI";
import { BrandMark } from "../../components/common/Brand";
import { createAttendanceToken } from "../../services/firestoreService";

export const PublicLiveQR = () => {
  const [shop, setShop] = useState(null);
  const [token, setToken] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadShop = async () => {
      try {
        const requestedShopId = new URLSearchParams(window.location.search).get("shopId");
        const snapshot = await getDocs(collection(db, "shops"));
        const shops = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        setShop(shops.find((item) => item.id === requestedShopId) || shops[0] || null);
      } catch (err) {
        setError(err.message);
      }
    };
    loadShop();
  }, []);

  useEffect(() => {
    if (!shop?.id) return undefined;
    const create = async () => {
      try {
        setToken(await createAttendanceToken(shop.id));
        setCountdown(60);
      } catch {
        setError("Unable to create the live QR. Please ask the admin to check Firebase permissions.");
      }
    };
    create();
    const tokenTimer = window.setInterval(create, 60000);
    const secondTimer = window.setInterval(() => setCountdown((value) => (value <= 1 ? 60 : value - 1)), 1000);
    return () => {
      window.clearInterval(tokenTimer);
      window.clearInterval(secondTimer);
    };
  }, [shop?.id]);

  if (!shop && !error) return <Loader label="Opening live attendance" />;

  const qrUrl = token ? `${window.location.origin}/staff/scan-attendance?shopId=${shop.id}&token=${token}` : "";

  return (
    <main className="min-h-screen bg-gray-50 px-3 py-3 text-gray-900 sm:px-5 sm:py-5">
      <div className="mx-auto max-w-4xl">
        <header className="mb-4 flex items-center justify-between gap-3">
          <BrandMark compact />
          <Link to="/login"><Button tone="light"><LogIn className="h-4 w-4" /> Login</Button></Link>
        </header>
        {error && <div className="mb-5"><Alert tone="danger">{error}</Alert></div>}
        {shop && (
          <div className="grid gap-4">
            <Card className="overflow-hidden !p-0">
              <div className="px-3 py-4 sm:px-5 sm:py-5">
                <div className="mx-auto grid aspect-square w-full max-w-[320px] place-items-center rounded-xl bg-orange-50 p-2">
                  {qrUrl ? (
                    <div className="rounded-lg bg-white">
                      <QRCodeCanvas value={qrUrl} size={280} includeMargin level="H" className="h-auto max-w-full" />
                    </div>
                  ) : (
                    <div className="aspect-square w-full animate-pulse rounded-2xl bg-white" />
                  )}
                </div>
                <div className="mt-3 text-center">
                  <p className="text-xs font-bold uppercase tracking-wide text-orange-600">Live attendance</p>
                  <h1 className="mt-1 text-xl font-bold text-gray-950">{shop.shopName || "Shop Attendance"}</h1>
                  <p className="mt-1 text-sm font-medium text-gray-700">Scan the QR above to punch in or punch out</p>
                </div>
                <div className="mx-auto mt-3 flex max-w-sm items-center justify-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" />
                  Live QR refreshes in {countdown} seconds
                </div>
                <p className="mx-auto mt-3 max-w-lg text-center text-sm font-medium leading-5 text-gray-700">
                  Open StaffPay Pro on your phone, tap Scan QR, and point the camera at this screen.
                </p>
              </div>
            </Card>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { icon: Smartphone, title: "Open StaffPay Pro", text: "Login with your active staff account." },
                { icon: ScanLine, title: "Scan this QR", text: "Use the Scan QR button from the staff app." },
                { icon: Clock3, title: "Complete punch", text: "Confirm punch in or punch out before the QR refreshes." },
              ].map(({ icon: Icon, title, text }, index) => (
                <Card key={title} className="text-center sm:flex sm:gap-3 sm:text-left">
                  <div className="text-orange-600"><Icon className="mx-auto h-5 w-5 sm:mx-0" /></div>
                  <div>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-orange-600 sm:mt-0">Step {index + 1}</p>
                    <h2 className="mt-0.5 text-xs font-bold text-gray-950 sm:text-sm">{title}</h2>
                    <p className="mt-1 hidden text-xs font-medium leading-4 text-gray-700 sm:block">{text}</p>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="grid gap-4 sm:grid-cols-2">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <div>
                  <h2 className="font-bold text-gray-950">Secure staff-only attendance</h2>
                  <p className="mt-1 text-sm font-medium leading-6 text-gray-700">Only active staff for this shop can continue. Public visitors cannot view attendance details.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                <div>
                  <h2 className="font-bold text-gray-950">Shop location verification</h2>
                  <p className="mt-1 text-sm font-medium leading-6 text-gray-700">Staff location is verified before attendance is recorded.</p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
};
