// ─────────────────────────────────────────────────────────────
// js/auth-guard.js — ด่านตรวจล็อกอิน + สิทธิ์ตามบทบาท ใช้ร่วมกันทุกหน้า
// ยกเว้น login.html และ signup.html (สองหน้านั้นไม่ต้อง import ไฟล์นี้)
//
// ไฟล์นี้ทำทันทีที่ถูก import:
//   1. ถ้ายังไม่ล็อกอิน → เด้งไปหน้า login.html ทันที
//   2. ถ้าล็อกอินอยู่ → อ่าน role จาก users/{uid} เพิ่มอีกที (ไม่มีเอกสาร/ไม่มีช่อง role
//      ถือว่าเป็น employee ไว้ก่อน กันไว้ก่อนปลอดภัยสุด) แล้วเติมชื่อ+ปุ่มออกจากระบบ
//      ลงในแถบเมนู (ช่อง #navUser ที่ js/nav.js สร้างไว้ — nav.js ต้องรันมาก่อนไฟล์นี้เสมอ)
//   3. ซ่อนเมนู "ประเภทการลา" ถ้า role ไม่ใช่ hr (ดู ACL.md — จัดการประเภทการลาเป็นสิทธิ์ hr เท่านั้น)
//   4. ส่งออกตัวแปร รอผู้ใช้ล็อกอิน — พรอมิสที่ resolve เป็น { uid, email, displayName, role }
//
// วิธีใช้ในหน้าที่แค่ต้องกันคนไม่ล็อกอิน (ไม่อ่าน Firestore เอง):
//   <script type="module" src="js/auth-guard.js"></script>
//
// วิธีใช้ในหน้าที่อ่าน Firestore เอง หรือต้องรู้ role ก่อนวาดปุ่ม:
//   import { รอผู้ใช้ล็อกอิน } from "./auth-guard.js";
//   var ผู้ใช้ = await รอผู้ใช้ล็อกอิน;   // ผู้ใช้.role ใช้เช็คสิทธิ์ได้เลย
// ─────────────────────────────────────────────────────────────

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

export var รอผู้ใช้ล็อกอิน = new Promise(function (resolve) {
  onAuthStateChanged(auth, function (บัญชี) {
    if (!บัญชี) {
      location.href = "login.html";
      return;
    }

    หาroleของ(บัญชี.uid).then(function (role) {
      var ผู้ใช้ = {
        uid: บัญชี.uid,
        email: บัญชี.email,
        displayName: บัญชี.displayName,
        role: role
      };
      แสดงผู้ใช้ในเมนู(ผู้ใช้);
      จำกัดเมนูตามสิทธิ์(ผู้ใช้);
      resolve(ผู้ใช้);
    });
  });
});

// อ่าน role จาก users/{uid} — ไม่มีเอกสารหรือไม่มีช่อง role ให้ถือว่าเป็น employee ไว้ก่อน
function หาroleของ(uid) {
  return getDoc(doc(db, "users", uid))
    .then(function (เอกสาร) {
      return (เอกสาร.exists() && เอกสาร.data().role) || "employee";
    })
    .catch(function () {
      return "employee";
    });
}

function แสดงผู้ใช้ในเมนู(ผู้ใช้) {
  var ที่วาง = document.getElementById("navUser");
  if (!ที่วาง) return;   // หน้านี้ไม่มีแถบเมนู

  ที่วาง.innerHTML =
    "<span>" + esc(ผู้ใช้.displayName || ผู้ใช้.email) + "</span>" +
    '<button type="button" class="btn-ghost" id="ปุ่มออกจากระบบ">ออกจากระบบ</button>';

  document.getElementById("ปุ่มออกจากระบบ").addEventListener("click", function () {
    signOut(auth).then(function () {
      location.href = "login.html";
    });
  });
}

// ซ่อนเมนู "ประเภทการลา" ถ้าไม่ใช่ hr (ตาม ACL.md — แก้ประเภทการลาเป็นสิทธิ์ hr เท่านั้น)
function จำกัดเมนูตามสิทธิ์(ผู้ใช้) {
  var ลิงก์ประเภทการลา = document.querySelector('a[href="leave-types.html"]');
  if (ลิงก์ประเภทการลา && ผู้ใช้.role !== "hr") {
    ลิงก์ประเภทการลา.classList.add("hidden");
  }
}
