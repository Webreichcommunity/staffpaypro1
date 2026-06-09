import { Globe2, Mail, MapPin, Phone, Sparkles } from "lucide-react";
import { Card } from "./UI";

const WEBREICH = {
  name: "StaffPay Pro by WebReich",
  email: "webreichcommunity@gmail.com",
  phone: "Contact via website",
  address: "Akola, Maharashtra 444401",
  website: "https://www.webreich.in/",
};

export const BrandMark = ({ compact = false, dark = false }) => (
  <div className="flex items-center gap-3">
    <img src="/logo.png" alt="StaffPay Pro" className={`${compact ? "h-10 w-10" : "h-12 w-12"} shrink-0 object-contain`} />
    <div className="min-w-0">
      <p className={`${compact ? "text-base" : "text-lg"} truncate font-black ${dark ? "text-white" : "text-gray-950"}`}>StaffPay Pro</p>
      <p className={`truncate text-xs font-semibold ${dark ? "text-orange-300" : "text-orange-600"}`}>by WebReich</p>
    </div>
  </div>
);

const ContactItem = ({ icon: Icon, label, children }) => (
  <div className="flex gap-3 rounded-2xl bg-gray-50 p-4">
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-orange-600 shadow-sm">
      <Icon className="h-5 w-5" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <div className="mt-1 break-words text-sm font-semibold text-gray-800">{children}</div>
    </div>
  </div>
);

export const AboutWebReich = () => (
  <Card className="overflow-hidden !p-0">
    <div className="p-6 sm:p-8">
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <img src="/webreich.png" alt="WebReich Technologies" className="h-20 w-20 shrink-0 object-contain sm:h-24 sm:w-24" />
        <div>
          <div className="flex items-center gap-2 text-orange-600">
            <Sparkles className="h-4 w-4" />
            <p className="text-xs font-bold uppercase tracking-widest">Software partner</p>
          </div>
          <h2 className="mt-2 text-2xl font-black text-gray-950">{WEBREICH.name}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            StaffPay Pro is designed and developed by WebReich to make attendance, payroll, leave, and staff management simple for growing businesses.
          </p>
        </div>
      </div>
    </div>
    <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
      <ContactItem icon={Mail} label="Email">
        <a className="text-orange-700 hover:underline" href={`mailto:${WEBREICH.email}`}>{WEBREICH.email}</a>
      </ContactItem>
      <ContactItem icon={Phone} label="Contact">{WEBREICH.phone}</ContactItem>
      <ContactItem icon={MapPin} label="Address">{WEBREICH.address}</ContactItem>
      <ContactItem icon={Globe2} label="Website">
        <a className="text-orange-700 hover:underline" href={WEBREICH.website} target="_blank" rel="noreferrer">www.webreich.in</a>
      </ContactItem>
    </div>
  </Card>
);
