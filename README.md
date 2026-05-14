# UrbanSync 🏛️

<p align="center">
  <img src="./mobile-app/assets/images/smartlogo.png" alt="UrbanSync Logo" width="200"/>
</p>

<p align="center">
  <b>A Centralized Urban Management System for Sri lanka</b><br>
  <i>Bridging the gap between citizens and local authorities through transparent, location-aware reporting.</i>
</p>


---

## 🎯 Overview

**UrbanSync** is a smart-governance solution designed to transform how urban complaints and municipal service requests are managed in Sri Lanka. The platform replaces traditionally fragmented, manual administrative processes with a structured, data-driven, and transparent digital workflow — connecting citizens directly with the right government authority through automated routing and real-time tracking.

### 🔥 Core Mission

| | |
|---|---|
| **🔍 TRANSPARENCY** | Real-time status tracking and automated citizen notifications at every stage of the resolution lifecycle |
| **⚡ EFFICIENCY** | Intelligent auto-assignment of complaints based on precise geolocation and departmental jurisdictions |
| **📊 ACCOUNTABILITY** | Data-driven performance monitoring via a centralized Super Admin command center |

---

## ✨ Key Features

| 📍 Pinpoint Geotagged Reporting | 🤖 AI-Powered Chatbot | 🛡️ Secure 2FA Onboarding |
| :---: | :---: | :---: |
| Precise GPS coordinates for accurate field-team dispatch | NLP-driven assistance for clear and actionable complaint descriptions | Integrated Firebase OTP verification for verified citizen identity |

| 📊 Workload Heatmaps | 🔄 Status Lifecycle | 🌐 Multi-language Support |
| :---: | :---: | :---: |
| Real-time case distribution analytics for Super Admins | One-click transitions (Pending → In Progress → Resolved) with instant alerts | Full support for Sinhala, Tamil, and English (i18n) |

---

## 🛠️ Technology Stack

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)

---

## 🏗️ Architecture & Security

- **Three-Tier Architecture:** Clean separation between the React Native citizen app (Presentation), Node.js/Express API (Business Logic), and MySQL database (Data Layer) for modularity and maintainability.
- **Database Excellence (3NF):** Highly normalized MySQL schema ensuring data integrity across users, citizens, officers, and complaints.
- **Spatial Routing Engine:** Uses `ST_Distance_Sphere` to perform division × category lookups, and detects redundant reports within a **50-metre radius** before submission.
- **Role-Based Access Control (RBAC):** Strict JWT-guarded middleware ensures officers only access departmental data while citizens are restricted to their own profiles.
- **Hybrid 2FA Authentication:** BCrypt password validation combined with Firebase SMS OTP as a secondary verification layer.
- **Identity Validation:** Regex-validated NIC (National Identity Card) verification to eliminate duplicate citizen profiles.

---

## 📁 Project Structure

UrbanSync/
├── backend/                  # Node.js + Express RESTful API
│   ├── __tests__/            # Automated test suites
│   ├── controllers/          # Route handler logic
│   ├── src/                  # Main source code
│   │   ├── middleware/       # JWT auth and RBAC (authMiddleware, roleMiddleware)
│   │   ├── routes/           # API endpoint definitions (authRoutes, chatroutes, etc.)
│   │   ├── db.js             # Database connection setup
│   │   └── server.js         # Main application entry point
│   ├── uploads/              # Local storage directory for Multer image uploads
│   └── .env, package.json    # Environment variables and dependencies
│
├── web-app/                  # React.js Admin Dashboard (Vite)
│   ├── __tests__/            # Frontend test suites
│   ├── public/               # Static public assets
│   ├── src/                  # Main source code
│   │   ├── assets/           # Dashboard images and global styles
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Main application views
│   │   ├── utils/            # Frontend helper functions
│   │   ├── App.jsx           # Root React component
│   │   └── main.jsx          # React DOM rendering entry point
│   └── vite.config.js, tailwind.config.js  # Build and styling configurations
│
├── mobile-app/               # React Native Citizen App (Expo)
│   ├── __tests__/            # Mobile test suites
│   ├── app/                  # Expo Router navigation structure
│   ├── assets/               # Local app images and fonts
│   ├── src/                  # Main source code
│   │   ├── components/       # Shared UI (ChatbotModal, MainLayout, NationalBadge)
│   │   ├── screens/          # Specific mobile screen views
│   │   └── utils/            # Helpers 
│   └── app.config.js, .env , apiClient, config, firebaseConfig, translations   # Expo configuration and environment variables
```

---

## 🚀 Installation & Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [MySQL](https://www.mysql.com/) (via XAMPP, WAMP, or MySQL Workbench)
- [Expo Go](https://expo.dev/client) app on your iOS or Android device
- A Google Maps API key, Firebase project, and OpenAI API key

---

### 1. Clone the Repository

```bash
git clone https://github.com/DNPevinya/UrbanSync.git
cd UrbanSync
```

---

### 2. Database Setup

1. Open MySQL using XAMPP, WAMP, or MySQL Workbench
2. Create a new database:
```sql
CREATE DATABASE urbansync_db;
```
3. Import the provided schema and seed data:
```bash
mysql -u root -p urbansync_db < urbansync_db.sql
```
This will generate the full 3NF schema including all tables, relationships, and sample authority data.

---

### 3. Environment Configuration

#### Backend (`backend/.env`)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_database_password
DB_NAME=urbansync_db
JWT_SECRET=your_super_secret_key
OPENAI_API_KEY=your_openai_api_key
```

#### Mobile App (`mobile-app/.env`)
```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

> ⚠️ Never commit `.env` files to version control. These are listed in `.gitignore`.

---

### 4. Launch the Ecosystem

Run these commands in **three separate terminal windows**:

#### 🖥️ Backend 
```bash
cd backend
npm install
npm run dev
```
API will be available at `http://localhost:5000`

#### 🌐 Web Portal (Admin & Officer Dashboard)
```bash
cd web-app
npm install
npm run dev
```
Dashboard will be available at `http://localhost:5173`

#### 📱 Mobile App (Citizen Interface)
```bash
cd mobile-app
npm install
npx expo start 
```
Scan the generated QR code with the **Expo Go** app on your iOS or Android device.

---

## 🧪 Running Tests

#### Backend Tests (Jest + Supertest)
```bash
cd backend
npm test
```

#### Web Dashboard Tests (Vitest + React Testing Library)
```bash
cd web-app
npm test
```

#### Mobile App Tests (Jest + React Native Testing Library)
```bash
cd mobile-app
npm test
```

---

## 👥 System Roles

| Role | Access |
|---|---|
| **Citizen** | Submit complaints, upload images, track status, use AI chatbot |
| **Authority Officer** | View and manage complaints assigned to their jurisdiction |
| **Super Administrator** | Full system access, cross-authority monitoring, complaint reassignment |

---


## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 👩‍💻 Author

**Dulyana Nilasi Pevinya**  
BSc (Hons) Software Engineering  
University of Plymouth | NSBM Green University  
Supervisor: Mr. Gayan Perera

---

<p align="center">
  <i>UrbanSync — Making cities work better, one complaint at a time.</i>
</p>
