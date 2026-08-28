# 🗺️ Mapeta

> **A self-hosted, private Google Maps & Waze alternative that runs on your computer and works on your phone anywhere you go.**

Mapeta gives you fast vector maps, turn-by-turn voice navigation, a real-time GPS speedometer, and live road incident alerts (police, hazards, traffic jams, road closures) without trackers, ads, or proprietary subscriptions.

---

## ✨ What Mapeta Can Do

- **🧭 3D & 2D Vector Maps**: Smooth WebGL maps powered by OpenStreetMap with instant **Day Mode** and OLED **Night Mode**.
- **🗣️ Turn-by-Turn Voice Navigation**: Speaks upcoming maneuvers (*"In 200 meters, turn right onto Main St"*) and shows big, clear lane guidance cards.
- **⚡ Live GPS Speedometer**: Real-time speed gauge in **KM/H** or **MPH** with circular speed limit signs and overspeed alerts.
- **🚨 Waze-Style Incident Reporting**: Report speed traps, road closures, accidents, and traffic jams with 1 tap. Reports sync instantly across all connected phones and desktops via WebSockets.
- **🔍 Fast Address & Place Search**: Type any location, street, or city to get instant autocomplete suggestions and directions.
- **📱 Android Phone Ready (PWA)**: Add Mapeta to your Android home screen as a full-screen app. Includes **Screen Wake-Lock** so your phone never turns off while mounted on your car dashboard.
- **🔒 Safe & Enterprise-Friendly**: 100% built on permissive open-source software (MIT / BSD-3 / Apache 2.0 / ODbL). Zero commercial restrictions, zero data tracking.

---

## 🚀 How to Run Mapeta

### 1. Install Dependencies
Make sure you have [Node.js](https://nodejs.org/) installed, then run:
```bash
npm install
```

### 2. Start Mapeta
To start both the backend server and frontend web app together:
```bash
npm run dev
```

- **Frontend App**: Open [http://localhost:5173](http://localhost:5173) in your browser.
- **Backend API & WebSockets**: Running on `http://localhost:3000`.

---

## 🚀 1-Click Master Start (Recommended)

Simply double-click **`start-mapeta.cmd`** (or `start-mapeta.bat`) in the project folder!

It will automatically:
1. Verify the production build.
2. Display your **Local WiFi IP** (e.g. `http://10.1.39.107:3000`) for zero-lag driving on phone hotspot.
3. Generate a secure **HTTPS Cloudflare Tunnel** (`https://*.trycloudflare.com`) for remote 4G/5G mobile access anywhere on the road.

---

## 📱 How to Use on Your Phone Anywhere on the Road

1. Double-click `start-mapeta.cmd` on your PC.
2. Open the displayed URL in **Google Chrome** on your Android phone:
   - On same WiFi / Hotspot: Open `http://<YOUR-PC-IP>:3000`
   - On 4G/5G Mobile Data: Open the secure `https://*.trycloudflare.com` link
3. Tap the **three dots menu (⋮)** in Chrome and select **"Add to Home screen"** or **"Install App"**.
4. Mount your phone on your car dashboard, choose your destination, tap **Navigate**, and enjoy voice-guided navigation!

---

## 🛠️ Tech Stack Under the Hood

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, MapLibre GL JS, Lucide Icons, Web Speech API.
- **Backend**: Node.js, Express, SQLite (`better-sqlite3`), WebSockets (`ws`).
- **Routing & Maps**: OpenFreeMap / OpenStreetMap Vector Tiles, OSRM Routing Engine, Nominatim Geocoding.

---

## 📄 License

Mapeta is open-source software licensed under the **MIT License**.