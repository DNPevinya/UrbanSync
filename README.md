# UrbanSync 🏛️

<p align="center">
  <img src="./mobile-app/assets/images/smartlogo.png" alt="UrbanSync Logo" width="200"/>
</p>

<p align="center">
  <b>🌍 Centralized Smart-Governance Platform</b><br>
  <i>Bridging the gap between citizens and local authorities through transparent, location-aware reporting.</i>
</p>

---

## 🎯 Overview

**UrbanSync** is a cutting-edge smart-governance solution designed to revolutionize how urban complaints and municipal service requests are managed in Sri Lanka. Our platform transforms traditionally fragmented administrative processes into a structured, data-driven, and transparent digital workflow.

### 🔥 Core Mission

*   **TRANSPARENCY:** Real-time status tracking and automated citizen notifications for every step of the resolution lifecycle.
*   **EFFICIENCY:** Intelligent auto-assignment of complaints based on precise geolocation and departmental jurisdictions.
*   **ACCOUNTABILITY:** Data-driven performance monitoring via a centralized Super Admin command center.

---

## ✨ Key Features

| 📍 Pinpoint Geotagged Reporting | 🤖 AI-Powered Chatbot | 🛡️ Secure 2FA Onboarding |
| :---: | :---: | :---: |
| precise GPS coordinates for accurate field-team dispatch | NLP-driven assistance for clear and actionable complaint descriptions | Integrated Firebase OTP verification for verified citizen identity |

| 📊 Workload Heatmaps | 🔄 Status Lifecycle | 🌐 Multi-language Support |
| :---: | :---: | :---: |
| Real-time case distribution analytics for Super Admins | One-click transitions (Pending → Resolved) with instant alerts | Full support for Sinhala, Tamil, and English (i18n) |

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

---

## 🏗️ Architecture & Security

*   **Database Excellence (3NF):** Highly normalized MySQL schema ensuring data integrity across users, citizens, officers, and complaints.
*   **Spatial Logic Engine:** Uses `ST_Distance_Sphere` to identify and prevent redundant reports within a 50-meter radius.
*   **Role-Based Access Control (RBAC):** Strict JWT-guarded middleware ensures officers only access departmental data while citizens are restricted to their own profiles.
*   **Identity Validation:** Regex-validated NIC (National Identity Card) verification to eliminate duplicate profiles.

---

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone [https://github.com/yourusername/UrbanSync.git](https://github.com/yourusername/UrbanSync.git)
cd UrbanSync
2. Environment Configuration
Create a .env file in the root directory of your backend to store sensitive credentials. These variables ensure the system can connect to your database, handle security, and interact with the OpenAI API for the AI Chatbot.

Code snippet
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=urbansync_db

# Security
JWT_SECRET=your_super_secret_key

# Third-Party Integrations
OPENAI_API_KEY=your_openai_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
5. Database Setup
Initialize MySQL: Ensure your MySQL server (like XAMPP or MySQL Workbench) is running.

Create Schema: Create a database named urbansync_db.

Normalization: Ensure your tables follow the 3NF Architecture (Third Normal Form) discussed in your implementation, separating users, citizens, officers, and complaints to maintain data integrity.

6. Launch Commands
Run these commands in separate terminals to start the entire ecosystem:

Backend (API)

Bash
cd backend
npm install
npm run dev
The server typically runs on port 5000.

Mobile App (Citizen Tier)

Bash
cd mobile-app
npm install
npx expo start
Open the Expo Go app on your phone and scan the QR code to test features like GPS location capture and image uploads.

Web Portal (Admin Tier)

Bash
cd web-app
npm install
npm run dev
Access the Administrative Dashboard to manage complaints and view the Super Admin analytics.
