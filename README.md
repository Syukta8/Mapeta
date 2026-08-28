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

## 📱 How to Use on Your Phone Anywhere on the Road

You can access your Mapeta server from your phone outside your house or office on 4G/5G cellular data using a free private mesh network like **[Tailscale](https://tailscale.com/)**:

1. Install **Tailscale** on this desktop and log in.
2. Install **Tailscale** on your Android phone and log in with the same account.
3. On your phone's browser (Chrome), open:
   ```
   http://<YOUR-DESKTOP-TAILSCALE-IP>:5173
   ```
4. Tap the **three dots menu** in Chrome and select **"Add to Home screen"** or **"Install App"**.
5. Mount your phone on your car dashboard, choose your destination, tap **Go**, and enjoy voice-guided navigation!

---

## 🛠️ Tech Stack Under the Hood

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, MapLibre GL JS, Lucide Icons, Web Speech API.
- **Backend**: Node.js, Express, SQLite (`better-sqlite3`), WebSockets (`ws`).
- **Routing & Maps**: OpenFreeMap / OpenStreetMap Vector Tiles, OSRM Routing Engine, Nominatim Geocoding.

---

## 📄 License

Mapeta is open-source software licensed under the **MIT License**.