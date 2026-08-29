// ─────────────────────────────────────────────────────────────
// js/seed.js — สคริปต์ใส่ข้อมูลตัวอย่างลง Firestore (ใช้ครั้งเดียว)
//
// คัดลอกข้อมูลชุดเดียวกับ js/data.js ลง Firestore ตามโครงสร้างในหัวข้อ 5.2
// และข้อมูลตัวอย่างในหัวข้อ 7 ของ leaveeasy-spec.md
//
// ⚠️ เป็นเครื่องมือของสัปดาห์ที่ 6 เท่านั้น ไม่ใช่หนึ่งใน 5 หน้าจอของระบบ
//    เปิดใช้ครั้งเดียวตอนตั้งค่าโปรเจกต์ แล้วจะลบไฟล์นี้ทิ้งทีหลังก็ได้
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

var logEl = document.getElementById("log");
var สถานะEl = document.getElementById("สถานะ");
var ปุ่ม = document.getElementById("ปุ่มใส่ข้อมูล");

function log(ข้อความ) {
  logEl.textContent += ข้อความ + "\n";
}

ปุ่ม.addEventListener("click", async function () {
  ปุ่ม.disabled = true;
  สถานะEl.textContent = "กำลังใส่ข้อมูล…";
  logEl.textContent = "";

  try {
    var ข้อมูล = window.LEAVE_DATA;

    for (var u of ข้อมูล.users) {
      await setDoc(doc(db, "users", u.id), { name: u.name, email: u.email, role: u.role });
      log("✅ users/" + u.id);
    }

    for (var t of ข้อมูล.leaveTypes) {
      await setDoc(doc(db, "leaveTypes", t.id), { name: t.name });
      log("✅ leaveTypes/" + t.id);
    }

    for (var r of ข้อมูล.leaveRequests) {
      var ข้อมูลใบลา = Object.assign({}, r);
      delete ข้อมูลใบลา.id;
      await setDoc(doc(db, "leaveRequests", r.id), ข้อมูลใบลา);
      log("✅ leaveRequests/" + r.id);
    }

    for (var a of ข้อมูล.approvals) {
      var ข้อมูลความเห็น = Object.assign({}, a);
      delete ข้อมูลความเห็น.id;
      delete ข้อมูลความเห็น.requestId;
      await setDoc(doc(db, "leaveRequests", a.requestId, "approvals", a.id), ข้อมูลความเห็น);
      log("✅ leaveRequests/" + a.requestId + "/approvals/" + a.id);
    }

    สถานะEl.textContent = "🎉 ใส่ข้อมูลตัวอย่างเสร็จแล้ว — เปิด Firebase Console ไปตรวจสอบได้เลย";
  } catch (err) {
    สถานะEl.textContent = "⚠️ เกิดข้อผิดพลาด";
    log("❌ " + err.message);
  } finally {
    ปุ่ม.disabled = false;
  }
});
