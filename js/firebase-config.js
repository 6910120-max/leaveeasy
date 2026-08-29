// ─────────────────────────────────────────────────────────────
// js/firebase-config.js — ตั้งค่าการเชื่อมต่อ Firebase ของโปรเจกต์ LeaveEasy
//
// ใช้ Firebase SDK แบบ Modular ผ่าน CDN ตรง ๆ (ไม่มีขั้นตอน build / npm install
// ตามข้อกำหนดในหัวข้อ 0.2 ของ leaveeasy-spec.md)
//
// ⚠️ ไฟล์นี้ต้องถูกโหลดด้วย <script type="module"> เท่านั้น
//    ไฟล์อื่นที่ต้องใช้ Firestore ให้ import { db } from "./firebase-config.js"
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// ค่าตั้งค่าโปรเจกต์ Firebase — คัดลอกมาจาก Firebase Console
// (⚙️ Project settings → General → Your apps → SDK setup and configuration)
const firebaseConfig = {
  apiKey: "AIzaSyBoNpppG6QBPFGjJCm2-3RveQ8XlNrfMAk",
  authDomain: "leaveeasy-7ec68.firebaseapp.com",
  projectId: "leaveeasy-7ec68",
  storageBucket: "leaveeasy-7ec68.firebasestorage.app",
  messagingSenderId: "966078964195",
  appId: "1:966078964195:web:1ba28eb1842606dc3f00d6"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
