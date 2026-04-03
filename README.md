# 🌿 CropDoctor AI – Plant Disease Detection System

CropDoctor AI is a web application that helps farmers and agricultural students identify crop diseases instantly using Google Gemini AI Vision.

India loses ₹50,000+ crores worth of crops every year due to plant diseases. Most farmers don't have access to agricultural experts. CropDoctor AI solves this by putting an AI-powered plant doctor in every farmer's pocket — completely free.

Just upload a photo of your plant and get:

* ✅ Instant disease diagnosis
* ✅ Severity level assessment
* ✅ Step-by-step treatment plan
* ✅ Prevention tips for the future

---

## 🚀 Live Demo

🔗 https://singular-pithivier-a38195.netlify.app/

---

## 🧠 Features

* 🌱 Upload plant leaf images
* 🤖 AI-powered disease detection (500+ diseases)
* 📊 Severity analysis (Healthy to Critical)
* 💯 Confidence score for predictions
* 💊 Treatment suggestions (organic & chemical)
* ⚡ Immediate action recommendations
* 🛡️ Prevention tips for future safety
* 🔐 Google Sign-In (Firebase Authentication)
* ☁️ Cloud-based scan history
* 💾 Downloadable diagnosis reports
* 📤 Easy sharing of results
* 📱 Fully responsive design

---

## 🛠️ Tech Stack

* 💻 Frontend → HTML5, CSS3, Vanilla JavaScript
* 🤖 AI Engine → Google Gemini 2.5 Flash API (Vision)
* 🔐 Authentication → Firebase Authentication (Google Sign-In)
* ☁️ Database → Cloud Firestore (NoSQL)
* 🌐 Hosting → GitHub Pages (Free)

---

## 🚀 Setup & Run Locally

### 📌 Prerequisites

* Google account
* VS Code + Live Server extension

---

### 🔹 Step 1 — Clone

```bash
git clone https://github.com/YOURUSERNAME/crop-doctor-ai.git
cd crop-doctor-ai
```

---

### 🔹 Step 2 — Get FREE Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Click **"Create API Key"** → Copy it

---

### 🔹 Step 3 — Create Firebase Project

1. Go to https://console.firebase.google.com
2. Create new project → Enable Google Authentication
3. Create Firestore Database (test mode)
4. Register Web App → copy `firebaseConfig`

---

### 🔹 Step 4 — Add your keys in `app.js`

```js
const GEMINI_KEY = "YOUR_GEMINI_API_KEY";

const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

---

### 🔹 Step 5 — Run

Right click `index.html` → **Open with Live Server** 🎉

---

## 🌱 Future Improvements

* 🌐 Tamil & Hindi language support
* 🗺️ Disease outbreak heatmap by location
* 📊 Admin dashboard for monitoring
* 🔔 Push notifications for disease alerts
* 📷 Direct camera capture in app
* 📱 PWA — installable on mobile

---

## 👩‍💻 Author

**Devadharshini**
GitHub: https://github.com/devadharshini-21

---

## ⭐ Support

If you found this project helpful, give it a ⭐ on GitHub!

Made with ❤️ and 🌿 by **Deva Dharshini**
