// ─────────────────────────────────────────────────────────────
// js/firebase-config.example.js — ไฟล์ตัวอย่างการตั้งค่า Firebase
//
// ไฟล์จริง js/firebase-config.js ถูกกันไม่ให้ push ขึ้น GitHub แล้ว (ดู .gitignore)
// เพื่อน/ผู้ที่ fork repo นี้ไป ต้องตั้งค่าของตัวเอง ทำตามนี้:
//
//   1. คัดลอกไฟล์นี้ → ตั้งชื่อใหม่เป็น js/firebase-config.js (ไฟล์เดิมจะไม่ถูก push)
//   2. เปิด Firebase Console ของโปรเจกต์ตัวเอง
//      ⚙️ Project settings → General → Your apps → SDK setup and configuration
//   3. คัดลอกค่าจริงมาแทนที่ค่า "..." ด้านล่างทุกช่อง
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
