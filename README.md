# Pearl Dental

A bilingual (Arabic / English) website and online booking system for a dental clinic. Patients choose a treatment, a dentist and a free time slot; staff see the day's schedule and mark visits as attended or missed.

**Live demo:** _add your Vercel link here_

## What it does

**For patients**
- Landing page with a scroll-driven 3D tooth (three.js), a live "open now / closed" badge in the clinic's time zone, treatments with durations and starting prices, and a doctors carousel showing each dentist's working days and **next free appointment**
- Booking in four steps: treatment, dentist (or "any available dentist"), day and time, details
- Deep links: a doctor's card opens booking with that doctor chosen; a treatment row opens it with that treatment chosen
- Confirmation with a booking reference and an **add-to-calendar** (.ics) file
- Manage booking: look up with reference + mobile number, cancel up to 12 hours before

**For the clinic**
- Staff sign-in and a daily schedule, filterable by dentist, with the patient's note and phone
- Mark visits as attended, no-show or cancelled; cancelling frees the time for others

## Engineering highlights

- **No double bookings, enforced by the database.** Every 15-minute block a dentist is booked for is a row in `booking_slots` with primary key `(doctor, slot_start)`. If two patients submit the same time at the same instant, one insert succeeds and the other gets a unique-violation, returned as `409 taken` and shown as "someone just booked this time".
- **Server never trusts the browser.** The requested time must be in the server's own list of free slots for that dentist, treatment and day.
- **Time zones done right.** All slot maths runs in the clinic's time zone (`Asia/Gaza`, including daylight saving), whatever time zone the server or visitor is in.
- **Privacy.** Booking lookup needs both reference and phone number, sent by POST so the number never appears in URLs or logs; a wrong reference and a wrong phone get the same answer.
- **Spam.** Hidden honeypot field on the booking form.
- **Staff session** is an HMAC-signed, httpOnly cookie, compared in constant time.
- **Arabic first:** RTL layout with CSS logical properties; the 3D tooth's flight path mirrors too. Reduced-motion is respected.

## Tech

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS v4 · three.js · Drizzle ORM · PostgreSQL (Neon in production, embedded PGlite locally) · Zod · Vitest

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 (redirects to `/ar`, or `/en` for English browsers).
No database setup needed: an embedded Postgres is created in `.data/`.
Staff page: `/ar/clinic`, local password `clinic1234`.

```bash
npm test          # schedule and booking tests (in-memory Postgres)
npm run typecheck
npm run lint
```

## Photos

Put photos in `public/photos/`. Anything missing falls back to a neutral placeholder.

| File | Used for |
|------|----------|
| `hero.jpg` | Hero image |
| `dr-sara.jpg`, `dr-laith.jpg`, `dr-rana.jpg`, `dr-yousef.jpg` | Doctor portraits (4:5) |
| `gallery-1.jpg` … `gallery-8.jpg` | Moving photo band (square) |

## Deploy on Vercel

1. Create a free Postgres database on [Neon](https://neon.tech) and copy its connection string.
2. Import the repository on Vercel and add these environment variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Neon connection string |
| `CLINIC_PASSWORD` | Staff password (required in production) |
| `SESSION_SECRET` | Any long random string (optional, recommended) |

3. Deploy. Tables are created automatically on the first request.

## Project structure

```
src/
├── app/[lang]/            Pages: home, book, manage, clinic
├── app/api/               Availability, bookings, cancel, lookup, clinic schedule
├── components/landing/    Landing page and the 3D tooth scene
├── components/booking/    Booking flow, manage booking, clinic schedule
├── lib/clinic.ts          Treatments, dentists and working hours
├── lib/schedule.ts        Slot calculation in the clinic's time zone
├── server/                Database, booking logic, staff auth
└── i18n/                  Arabic and English copy
```

The clinic, dentists and contact details are fictional; this is a portfolio project.
