# CampusConnect

A modern **campus scheduling portal** where students browse classes, book office-hour slots, and teachers manage subjects and availability. Built with **React**, **Vite**, **Tailwind CSS**, and **Supabase** (Postgres + Auth + Row Level Security).

![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase&logoColor=white)

## Features

- **Authentication** — Email/password sign-up and sign-in; optional email confirmation flow.
- **Roles** — Separate experiences for **students** and **teachers** (stored on user profiles).
- **Students** — View all classes (subjects), open a class to see open vs booked slots, book a session, view and cancel bookings on the profile page.
- **Teachers** — Create classes, add datetime slots per class, delete slots/classes (bookings cascade as defined in the database).
- **UI** — Responsive layout with sidebar navigation, glass-style cards, and accessible booking states (open / taken).

## Tech stack

| Layer    | Choice                          |
| -------- | ------------------------------- |
| Frontend | React 18, React Router 6        |
| Styling  | Tailwind CSS 3                  |
| Build    | Vite 6                          |
| Backend  | Supabase (Auth, Postgres, RLS)  |

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (20 LTS recommended)
- A [Supabase](https://supabase.com/) project

## Quick start

1. **Clone the repository**

   ```bash
   git clone https://github.com/l224947-dev/CampusConnect.git
   cd CampusConnect
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment variables**

   Copy the example file and fill in your project values:

   ```bash
   # Windows (PowerShell or CMD)
   copy .env.example .env

   # macOS / Linux
   cp .env.example .env
   ```

   | Variable                 | Description                    |
   | ------------------------ | ------------------------------ |
   | `VITE_SUPABASE_URL`      | Project URL (Settings → API) |
   | `VITE_SUPABASE_ANON_KEY` | Public anon key                |

4. **Database**

   In the Supabase SQL editor, run the scripts in order:

   - `supabase/schema.sql` — tables, RLS, triggers, RPCs used by the app
   - `supabase/patch_booking_visibility_and_deletes.sql` — if your project was created from an older schema, apply any additional patches documented there

5. **Run locally**

   ```bash
   npm run dev
   ```

   Open the URL Vite prints (usually `http://localhost:5173`).

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Start dev server         |
| `npm run build`| Production build → `dist`|
| `npm run preview` | Preview production build |

## Project layout

```
├── components/     # Layout, protected routes
├── contexts/       # Auth context (Supabase session + profile)
├── lib/            # Supabase client, booking helpers, UI accents
├── pages/          # Login, signup, dashboards, booking flows, profile
├── supabase/       # SQL schema and patches
├── assets/         # Static images
└── index.html      # App shell, fonts, icons
```

## Security notes

- Never commit `.env` — it is listed in `.gitignore`.
- RLS policies in `supabase/schema.sql` enforce who can read/write bookings, slots, and subjects.
- For production, configure Supabase Auth (site URL, redirect URLs) and email provider settings to match your deployed app.

## License

This project is maintained for **CampusConnect** / educational use. Add a `LICENSE` file if you need a specific open-source terms.

---

**Repository:** [github.com/l224947-dev/CampusConnect](https://github.com/l224947-dev/CampusConnect)
