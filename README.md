# StaffPay Pro

Professional staff attendance, payroll, leave, salary slip, and payment management system built with Vite, React, Tailwind CSS, Firebase Authentication, Firestore, and PWA support.

## Run locally

```bash
npm install
npm run dev
npm run build
npm run lint
```

The current Firebase project config lives in `src/Firebase/config.js`.

## First admin setup

Open the setup page:

```txt
/create-admin
```

The setup form creates:

- Firebase Auth owner account
- `users/{uid}` with role `admin`
- `shops/{uid}` default shop settings
- `loginNames/{adminId}` and `loginNames/{username}` aliases

Admin login accepts email, admin ID, or username plus password. Staff login uses email/password followed by matching Google account verification on supported platforms. On iPhone and iPad, staff use the verified email/password session because iOS Safari and installed PWAs can lose the Firebase popup's cross-origin session state. Admin-created staff accounts use a secondary Firebase app instance so the admin session is not logged out.

Enable the Google provider in Firebase Authentication before using staff login.

For production, keep this setup route protected by Firestore rules or remove it after the first admin is created.

## Main Firestore collections

- `users`
- `shops`
- `staff`
- `attendance/{shopId}/dates/{yyyy-mm-dd}/records/{staffId}`
- `leaves`
- `salaryReports`
- `payments`
- `advances`
- `attendanceCorrections`

Attendance punch timestamps are written with Firebase `serverTimestamp()`. Staff can only create self punch records through the app flow; admin corrections are logged in `attendanceCorrections`.

## Features

- Role protected admin and staff routes
- Admin dashboard, staff management, shop settings, locally rotating QR, attendance, leaves, salary reports, slips, and payments
- Staff mobile PWA dashboard, password plus matching-Google-account verification where supported, iOS-compatible login, QR scan, GPS radius validation, punch in/out, leave requests, attendance history, profile, and salary slips
- Salary PDF download with monthly calculations
- PWA manifest, app icon, service worker, and installable mobile layout
