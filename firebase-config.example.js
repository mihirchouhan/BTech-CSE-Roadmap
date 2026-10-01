// ============================================================
// FIREBASE CONFIG TEMPLATE
// ============================================================
// This file is a TEMPLATE only. Do NOT put real values here.
//
// For LOCAL development:
//   1. Copy this file → firebase-config.js
//   2. Fill in your real Firebase values
//   3. firebase-config.js is gitignored so it won't be committed
//
// For NETLIFY deployment:
//   Set these environment variables in Netlify dashboard:
//   Site settings → Environment variables → Add variable
//
//   FIREBASE_API_KEY
//   FIREBASE_AUTH_DOMAIN
//   FIREBASE_PROJECT_ID
//   FIREBASE_STORAGE_BUCKET
//   FIREBASE_MESSAGING_SENDER_ID
//   FIREBASE_APP_ID
//   FIREBASE_MEASUREMENT_ID
//
// The build step (build-config.js) auto-generates firebase-config.js
// from those env vars on every Netlify deploy.
// ============================================================

window.FIREBASE_CONFIG = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};
