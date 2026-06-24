import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Banknote, CalendarCheck, Clock3, FileText, Globe2, Mail, MapPin, QrCode, ScanLine, ShieldCheck, Smartphone, Users } from "lucide-react";
import { BrandMark } from "../../components/common/Brand";
import { Button, Input, Textarea } from "../../components/common/UI";
import { WEBREICH } from "../../utils/brandInfo";
import { PublicLiveQR } from "./PublicLiveQR";

const features = [
  { icon: QrCode, title: "Live QR attendance", text: "Rotating QR codes connect staff punch in and punch out with secure shop verification." },
  { icon: MapPin, title: "GPS radius check", text: "Attendance is recorded only after the staff location is checked against the saved shop radius." },
  { icon: Banknote, title: "Payroll reports", text: "Monthly salary reports include present days, half days, leaves, advances, payments, and deductions." },
  { icon: FileText, title: "Salary slips", text: "Owners can generate salary slips and staff can view or download their own records." },
  { icon: CalendarCheck, title: "Leave tracking", text: "Staff submit leave requests while admins approve, reject, and keep the monthly salary calculation clean." },
  { icon: Users, title: "Staff management", text: "Manage staff profiles, salary details, departments, active status, and secure login access." },
];

const steps = [
  ["Set up shop", "Add shop timing, attendance radius, GPS location, weekly off, and salary rules."],
  ["Add staff", "Create staff accounts with salaries, departments, contact details, and login access."],
  ["Display QR", "Open the live QR screen at the shop counter or attendance device."],
  ["Run payroll", "Review attendance, approve leaves, generate salary reports, and track payments."],
];

const defaultInquiry = {
  name: "",
  business: "",
  phone: "",
  email: "",
  message: "I want to know more about StaffPay Pro for my business.",
};

const setMeta = (name, content) => {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

const setPropertyMeta = (property, content) => {
  let tag = document.querySelector(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", property);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

export const HomePage = () => {
  const [inquiry, setInquiry] = useState(defaultInquiry);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    document.title = "StaffPay Pro by WebReich | Staff Attendance and Payroll Software";
    setMeta("description", "StaffPay Pro by WebReich is staff attendance, QR punch in, payroll, leave, salary slip, and payment management software for shops and growing businesses.");
    setMeta("keywords", "StaffPay Pro, StaffPayPro WebReich, staffpaypro webreich, WebReich attendance software, staff attendance software, payroll software for shops");
    setPropertyMeta("og:title", "StaffPay Pro by WebReich");
    setPropertyMeta("og:description", "QR attendance, payroll, leave, salary slips, and staff payment management for shops.");
    setPropertyMeta("og:type", "website");
    setPropertyMeta("og:image", `${window.location.origin}/icon-512.png`);
  }, []);

  if (new URLSearchParams(window.location.search).has("shopId")) return <PublicLiveQR />;

  const updateInquiry = (key, value) => setInquiry((current) => ({ ...current, [key]: value }));

  const submitInquiry = (event) => {
    event.preventDefault();
    const body = [
      `Name: ${inquiry.name}`,
      `Business: ${inquiry.business}`,
      `Phone: ${inquiry.phone}`,
      `Email: ${inquiry.email}`,
      "",
      inquiry.message,
    ].join("\n");
    window.location.href = `mailto:${WEBREICH.email}?subject=${encodeURIComponent("StaffPay Pro product inquiry")}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <BrandMark compact />
          <nav className="flex items-center gap-2">
            <a className="hidden text-sm font-semibold text-gray-700 hover:text-orange-700 sm:inline" href="#features">Features</a>
            <a className="hidden text-sm font-semibold text-gray-700 hover:text-orange-700 sm:inline" href="#inquiry">Inquiry</a>
            <Link to="/login"><Button tone="light">Login</Button></Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gray-950 text-white">
        <div className="absolute inset-0 opacity-25">
          <video autoPlay muted loop className="h-full w-full object-cover">
            <source src="https://www.pexels.com/download/video/6773551/" type="video/mp4" />
          </video>
        </div>
        <div className="relative mx-auto grid min-h-[560px] max-w-6xl content-center gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-orange-300">StaffPay Pro by WebReich</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">Staff attendance and payroll software for modern shops.</h1>
            <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-gray-200">
              Run QR punch in, GPS-verified attendance, leave approvals, salary reports, salary slips, advances, and payment tracking from one clean dashboard.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href="#inquiry"><Button className="w-full sm:w-auto">Send Inquiry <ArrowRight className="h-4 w-4" /></Button></a>
              <Link to="/live-qr"><Button tone="light" className="w-full sm:w-auto"><QrCode className="h-4 w-4" /> Live QR Display</Button></Link>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white p-4 text-gray-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <BrandMark compact />
              <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 ring-1 ring-green-200">Live</span>
            </div>
            <div className="mt-4 grid gap-3">
              {[
                [ScanLine, "QR punch verified", "Staff scan the shop code and confirm the right action."],
                [ShieldCheck, "Location protected", "GPS radius checks help prevent remote attendance."],
                [Clock3, "Clean day status", "Punch records stay locked after completion until the next day."],
              ].map(([Icon, title, text]) => (
                <div key={title} className="flex gap-3 rounded-lg bg-gray-50 p-3 ring-1 ring-gray-100">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-orange-100 text-orange-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-gray-950">{title}</h2>
                    <p className="mt-1 text-xs font-semibold leading-5 text-gray-600">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-gray-50 py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-widest text-orange-600">Product features</p>
            <h2 className="mt-2 text-3xl font-black text-gray-950">Everything needed for daily staff operations.</h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-orange-50 text-orange-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-black text-gray-950">{title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-gray-700">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-orange-600">How it works</p>
            <h2 className="mt-2 text-3xl font-black text-gray-950">From shop setup to salary slip.</h2>
            <p className="mt-3 text-sm font-medium leading-6 text-gray-700">
              StaffPay Pro keeps the daily flow simple for owners and staff, while still preserving the attendance details needed for monthly payroll.
            </p>
          </div>
          <div className="grid gap-3">
            {steps.map(([title, text], index) => (
              <article key={title} className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-[auto_1fr]">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-gray-950 text-sm font-black text-white">{index + 1}</div>
                <div>
                  <h3 className="font-black text-gray-950">{title}</h3>
                  <p className="mt-1 text-sm font-medium leading-6 text-gray-700">{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="inquiry" className="border-t border-gray-200 bg-gray-50 py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-orange-600">Product inquiry</p>
            <h2 className="mt-2 text-3xl font-black text-gray-950">Talk to WebReich about StaffPay Pro.</h2>
            <p className="mt-3 text-sm font-medium leading-6 text-gray-700">
              Share your shop or business details and the inquiry will open in your email app for WebReich.
            </p>
            <div className="mt-5 grid gap-3 text-sm font-semibold text-gray-700">
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-orange-600" /> {WEBREICH.email}</p>
              <p className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-orange-600" /> www.webreich.in</p>
              <p className="flex items-center gap-2"><Smartphone className="h-4 w-4 text-orange-600" /> Attendance, payroll, leaves, and salary slips in one app</p>
            </div>
          </div>
          <form className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm" onSubmit={submitInquiry}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Name" required value={inquiry.name} onChange={(event) => updateInquiry("name", event.target.value)} />
              <Input label="Business name" value={inquiry.business} onChange={(event) => updateInquiry("business", event.target.value)} />
              <Input label="Phone" required value={inquiry.phone} onChange={(event) => updateInquiry("phone", event.target.value)} />
              <Input label="Email" type="email" value={inquiry.email} onChange={(event) => updateInquiry("email", event.target.value)} />
            </div>
            <div className="mt-4">
              <Textarea label="Message" required value={inquiry.message} onChange={(event) => updateInquiry("message", event.target.value)} />
            </div>
            {sent && <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 ring-1 ring-green-200">Your email app has been opened with the inquiry details.</p>}
            <Button type="submit" className="mt-4 w-full sm:w-auto">Create Inquiry Email <ArrowRight className="h-4 w-4" /></Button>
          </form>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 text-sm font-semibold text-gray-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <BrandMark compact />
          <p>StaffPay Pro by WebReich. StaffPayPro WebReich attendance and payroll software.</p>
        </div>
      </footer>
    </main>
  );
};
