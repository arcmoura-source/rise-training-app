# RISE — Next-Gen Progressive Gym Tracker & AI Coach ✨

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini API](https://img.shields.io/badge/Gemini_API-2.5_Flash-4285F4?logo=google&logoColor=white)](https://aistudio.google.com/)
[![Google Drive API](https://img.shields.io/badge/Google_Drive_API-v3_(GIS_OAuth)-34A853?logo=googledrive&logoColor=white)](https://developers.google.com/drive)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Live Demo:** [https://rise-grow-glow.vercel.app](https://rise-grow-glow.vercel.app)

---

## 📌 Executive Summary

**RISE** is a mobile-first, privacy-centric fitness and hypertrophy companion designed to eliminate friction in workout tracking and progress overload. By pairing an intuitive local-first offline architecture with automated cloud backup via the Google Drive REST API and a multi-tiered AI fitness coach powered by Google Gemini, RISE delivers personal trainer intelligence and real-time session tracking without subscription paywalls or vendor lock-in.

---

## 🌟 Key Features

- **⚡ Local-First, High-Performance Session Tracking:**
  - Real-time elapsed workout timer, set-by-set weight & rep logging, and automatic rest intervals with audio bells.
  - Quick adjustment controls (`+ / -`) for weights and reps, automatic PR detection, and confetti celebrations upon completion.
  - Interactive calendar & history logs with session volume, duration, and exercise drilldowns.

- **🤖 Multi-Tiered AI Personal Trainer (Google Gemini):**
  - Context-aware chatbot with multi-turn conversation memory analyzing the user's specific split, experience level, and training environment (gym or home).
  - Cascading model architecture (`gemini-2.5-flash` → `gemini-1.5-flash` → `gemini-1.5-pro` → local heuristics) ensuring 100% reliable advice even under API quota constraints.
  - Posture correction, warm-up guidance, progressive overload calculations, and recovery suggestions.

- **☁️ Zero-Knowledge Cloud Sync (Google Drive REST API):**
  - Seamless authentication powered by official **Google Identity Services (GIS) OAuth 2.0**.
  - Non-intrusive automatic cloud sync using the strictly scoped `https://www.googleapis.com/auth/drive.file` permission (the app can only access files it creates, guaranteeing zero access to the user's private Drive documents).
  - Instant cross-device restoration during onboarding or from the profile settings.

- **🎥 Home Workout Hub & Video Logger:**
  - Integrated workout streams from top fitness creators (*growingannanas*, *Caroline Girvan*, *Olivia Lawson*, *Heather Robertson*).
  - Quick-log completed follow-along YouTube sessions with automated volume and duration calculation.

- **📊 Comprehensive Biometrics & Analytics:**
  - Bodyweight tracking, skeletal muscle mass metrics, BMI calculations, and muscle percentage ratios.
  - Interactive profile management with personalized target settings.

- **📱 True Mobile-First & Cross-Platform Experience:**
  - Progressive Web App (PWA) with install-to-homescreen capabilities.
  - Mobile emulator frame on desktop viewports for previewing mobile experiences.
  - Native Android packaging support via **Capacitor**.

---

## 🏗️ Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────┐
│                   RISE React 18 SPA                   │
│   (TailwindCSS • Lucide Icons • Canvas Confetti)       │
└──────────────────────────┬─────────────────────────────┘
                           │
         ┌─────────────────┼──────────────────┐
         ▼                 ▼                  ▼
┌──────────────────┐ ┌───────────────┐ ┌───────────────┐
│   Local-First    │ │ Google Gemini │ │ Google Drive  │
│     Storage      │ │   AI Engine   │ │  Cloud Sync   │
│ (localStorage /  │ │ (Cascade API: │ │ (GIS OAuth2 + │
│  IndexedDB)      │ │ 2.5 / 1.5)    │ │ REST v3)      │
└──────────────────┘ └───────────────┘ └───────────────┘
```

### Technology Highlights
- **Frontend Framework:** [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) for blazing-fast HMR and bundle optimization.
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with a custom luxury fitness palette (soft cream, rose-gold, warm slate).
- **Icons & UI Feedback:** [lucide-react](https://lucide.dev/), [canvas-confetti](https://www.npmjs.com/package/canvas-confetti).
- **Mobile Container:** [@capacitor/core](https://capacitorjs.com/) and [@capacitor/android](https://capacitorjs.com/docs/android).
- **AI Services:** Google Gemini Generative Language API (`v1beta`).
- **Cloud Infrastructure:** Google Identity Services (GIS), Google Drive API v3, and [Vercel](https://vercel.com/) Edge Hosting.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- `npm` or `yarn` / `pnpm`
- *(Optional)* Google Gemini API Key for AI features ([Get one for free at Google AI Studio](https://aistudio.google.com/))
- *(Optional)* Google Cloud OAuth 2.0 Web Client ID for Drive auto-sync ([Google Cloud Console](https://console.cloud.google.com/))

### 1. Clone the Repository
```bash
git clone https://github.com/arcmoura-source/rise-training-app.git
cd rise-training-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to create your local `.env` file:
```bash
cp .env.example .env
```
Open `.env` and fill in your credentials:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here.apps.googleusercontent.com
```

> **Note:** If API keys are omitted, the application runs fully in offline mode with built-in heuristic fitness advice!

### 4. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 5. Build for Production
```bash
npm run build
```
The optimized production bundle will be generated in the `dist/` directory.

---

## 🔒 Security & Privacy

1. **Least-Privilege Scopes:** The app requests only `https://www.googleapis.com/auth/drive.file`. It cannot view, edit, or delete any files outside of the `fit_tracker_backup_*.json` files it creates itself.
2. **Client-Side Secret Isolation:** No private API keys or refresh tokens are exposed. All communication with Gemini and Google Drive occurs either directly via secure client-side tokens or authorized environment variables.
3. **Local-First Resilience:** In accordance with privacy-first standards, all training logs remain strictly on the user's local device until explicit Google authentication is initiated.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
