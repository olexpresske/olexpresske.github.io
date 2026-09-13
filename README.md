# OlexPress — Your Ride Everywhere 🚖🌌

> **Nyandarua County's Premier Ride-Hailing Platform**  
> Launch Base: **Ol Kalou, Nyandarua County, Kenya**  
> Built with React 19, TypeScript, Vite, Tailwind CSS, Leaflet, and Three.js.

---

## 🌟 Highlights

- **🌌 World-Class 3D Galaxy Globe**: Real-time Three.js cosmos with 3,000+ drifting stars, spiral galaxy dust, shooting meteor streaks, and an interactive 3D Earth with a pulsing pinpoint beacon on **Ol Kalou, Kenya** (Lat `-0.2721°`, Lon `36.3792°`).
- **🗺️ Live Dark Road Map**: OpenStreetMap Leaflet integration rendered in a high-contrast dark theme with route calculations, town snapping, distance/ETA estimation, and live GPS car simulation.
- **📍 Nyandarua Origin Rule**: Strict county origin validation covering Ol Kalou, Nyahururu, Engineer, Ndunyu Njeru, Mairo Inya, Miharati, Wanjohi, and destinations across all 47 counties of Kenya.
- **🎫 Reactive Ticket & Dispatch Engine**: Custom Pub/Sub store managing ride requests, driver assignments, QR boarding passes, trip progression, and 5-minute passenger review locks.
- **🚗 Driver Portal**: Instant ride acceptance, stage updates (*En Route to Pickup* → *Arrived* → *Boarded* → *In Transit* → *Completed*), and fare settlement.
- **🛡️ Admin Dispatch Dashboard**: Real-time fleet overview, active rides monitoring, driver-to-admin two-way dispatch messages, and revenue analytics.

---

## 🚀 Quick Start Guide (Run Locally from GitHub)

### 1. Prerequisites

Ensure you have **Node.js 18.0+** or **Node.js 20.0+** and `npm` installed on your machine:

```bash
node -v   # Should be v18.0.0 or higher (v20+ recommended)
npm -v
```

### 2. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/olexpress.git
cd olexpress
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Local Development Server

```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 📜 Available NPM Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the local Vite development server on `http://localhost:3000` |
| `npm run build` | Compiles the TypeScript codebase and builds optimized static assets to `/dist` |
| `npm run preview` | Previews the production build locally on `http://localhost:3000` |
| `npm start` | Alias for `npm run preview` |
| `npm run lint` | Runs `tsc --noEmit` to validate all TypeScript types and exports |
| `npm run clean` | Removes `/dist` and temporary build artifacts |

---

## 📂 Project Architecture

```
olexpress/
├── .github/
│   └── workflows/
│       └── ci.yml              # Automated GitHub Actions test & build workflow
├── public/
│   ├── logo.svg                # Vector brand logo (Green road pin)
│   └── assets/
├── src/
│   ├── components/
│   │   ├── GalaxyGlobe3D.tsx   # Three.js 3D Earth, cosmos stars, & galaxy engine
│   │   ├── OlexLogo.tsx        # High-precision SVG brand logo component
│   │   ├── Header.tsx          # Top navigation, orbits, portal switcher & logo
│   │   ├── BookingCard.tsx     # Pickup/Drop-off inputs, county validation
│   │   ├── DarkMap.tsx         # Leaflet road map with live driver marker
│   │   ├── TicketCard.tsx      # Fare breakdown, phone input, booking submit
│   │   ├── TrackingView.tsx    # Live tracking view with cancel & QR code
│   │   ├── DriverDashboard.tsx # Driver job acceptance & lifecycle controls
│   │   ├── AdminDashboard.tsx  # Dispatch management & fleet analytics
│   │   └── Modals.tsx          # My Tickets, About, Support, Terms, & 3D Globe
│   ├── data/
│   │   └── towns.ts            # Nyandarua towns, Kenya coordinates, route calculations
│   ├── services/
│   │   └── ticketStore.ts      # Reactive state management with local persistence
│   ├── types.ts                # TypeScript interfaces (Ticket, RideStatus, Review)
│   ├── App.tsx                 # Root orchestrator & portal router
│   ├── main.tsx                # React DOM root entry point
│   └── index.css               # Global Tailwind CSS styles
├── .env.example                # Example environment variables
├── .gitignore                  # GitHub-ready ignore patterns
├── index.html                  # HTML entry point with metadata & favicon
├── package.json                # Project dependencies & scripts
├── tsconfig.json               # TypeScript compiler options
└── vite.config.ts              # Vite bundler configuration
```

---

## 🧭 Direct Portal Navigation

You can test each portal directly in your browser:

- **Passenger Booking & Tracking**: `http://localhost:3000`
- **Driver Portal**: `http://localhost:3000/?view=driver` (or click *Driver* in the top bar)
- **Admin Dispatch Console**: `http://localhost:3000/?view=admin` (or click *Admin* in the top bar)

---

## 🚢 Easy One-Click Deployments

### Option A: Vercel

1. Push your repository to your GitHub account.
2. Visit [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your `olexpress` repository.
4. Framework Preset: **Vite**
5. Root Directory: `./`
6. Click **Deploy**. Vercel will build and assign you a public URL.

### Option B: Netlify

1. Push your repository to GitHub.
2. Visit [netlify.com](https://netlify.com) and select **"Add new site"** > **"Import an existing project"**.
3. Choose your repository.
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Click **Deploy Site**.

### Option C: GitHub Pages

Add `@vitejs/plugin-react` base path in `vite.config.ts` if deploying to a subpath (e.g. `base: '/olexpress/'`), then run:

```bash
npm run build
npx gh-pages -d dist
```

---

## 🛠️ Environment Variables

Copy the example environment file if integrating custom backend services:

```bash
cp .env.example .env
```

| Variable | Description |
| :--- | :--- |
| `VITE_APP_URL` | Public production URL of the deployed application |
| `GEMINI_API_KEY` | Optional server-side API key for AI-assisted features |

---

## 📄 License

MIT License. Free to use, adapt, and deploy for your transportation and mobility services.
