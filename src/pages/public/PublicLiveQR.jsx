import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";
import { Clock3, LogIn, MapPin, ScanLine, ShieldCheck, Smartphone } from "lucide-react";
import { db } from "../../Firebase/config";
import { Alert, Button, Card, Loader } from "../../components/common/UI";
import { BrandMark } from "../../components/common/Brand";
import { QRDisplay } from "../../components/attendance/QRDisplay";
import { useAuth } from "../../hooks/useAuth";
import { useLiveQr } from "../../hooks/useLiveQr";
import { getShop } from "../../services/firestoreService";

const PUBLIC_SHOP_KEY = "staffpay-public-shop-id";

export const PublicLiveQR = () => {
  const { userProfile, loading: authLoading } = useAuth();
  const [shop, setShop] = useState(null);
  const [error, setError] = useState("");
  const { qrCode, countdown } = useLiveQr(shop?.id);

  useEffect(() => {
    if (authLoading) return;

    const loadShop = async () => {
      const requestedShopId = new URLSearchParams(window.location.search).get("shopId");
      const rememberedShopId = window.localStorage.getItem(PUBLIC_SHOP_KEY);
      const preferredShopId = requestedShopId || userProfile?.shopId || rememberedShopId;

      try {
        if (preferredShopId) {
          // The public display only needs the shop ID to create the same QR as
          // the admin screen. Shop details may be protected for logged-out users.
          setShop({ id: preferredShopId });
          window.localStorage.setItem(PUBLIC_SHOP_KEY, preferredShopId);
          const shopDetails = await getShop(preferredShopId);
          if (shopDetails) setShop(shopDetails);
          return;
        }

        const snapshot = await getDocs(collection(db, "shops"));
        const shops = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        if (shops.length !== 1) {
          throw new Error("Open Public Display from Admin Live QR once to connect this screen to the correct shop.");
        }
        setShop(shops[0]);
        window.localStorage.setItem(PUBLIC_SHOP_KEY, shops[0].id);
      } catch (err) {
        if (!preferredShopId) setError(err.message);
      }
    };
    void loadShop();
  }, [authLoading, userProfile?.shopId]);

  if ((!shop && !error) || authLoading) return <Loader label="Opening live attendance" />;

  const qrUrl = qrCode ? `${window.location.origin}/staff/scan-attendance?shopId=${shop.id}&qr=${qrCode}` : "";

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
                <div className="mx-auto max-w-sm">
                  <QRDisplay
                    value={qrUrl}
                    countdown={countdown}
                    shopName={shop.shopName || "Shop Attendance"}
                    className="!border-0 !shadow-none"
                  />
                </div>
                <div className="mt-3 text-center">
                  <p className="text-xs font-bold uppercase tracking-wide text-orange-600">Live attendance</p>
                  <h1 className="mt-1 text-xl font-bold text-gray-950">Scan to mark attendance</h1>
                  <p className="mt-1 text-sm font-medium text-gray-700">Scan the QR above to punch in or punch out</p>
                </div>
                <p className="mx-auto mt-3 max-w-lg text-center text-sm font-medium leading-5 text-gray-700">
                  Open StaffPay Pro on your phone, tap Scan QR, and point the camera at this screen.
                </p>
              </div>
            </Card>

            <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
              {[
                { icon: Smartphone, title: "Open StaffPay Pro", text: "Login with your active staff account." },
                { icon: ScanLine, title: "Scan this QR", text: "Use the Scan QR button from the staff app." },
                { icon: Clock3, title: "Complete punch", text: "Confirm punch in or punch out after location verification." },
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
