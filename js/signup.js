// ─────────────────────────────────────────────────────────────
// js/signup.js — หน้าสมัครสมาชิก
// สัปดาห์ที่ 7: สมัครด้วยอีเมล/รหัสผ่านผ่าน Firebase Authentication
// สมัครสำเร็จแล้วสร้างไฟล์ใน users/{uid} ทันที role เริ่มต้นเป็น employee
// (ชื่อ-นามสกุลที่กรอกตรงนี้ครั้งเดียว จะถูกใช้เป็น requesterName/authorName
//  ทุกที่ที่ระบบต้องโชว์ชื่อคนที่ล็อกอินอยู่ ไม่ต้องพิมพ์ซ้ำอีก)
// ─────────────────────────────────────────────────────────────

import { db, auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword, updateProfile
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

(function () {
  var ฟอร์ม = document.getElementById("ฟอร์มสมัคร");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ปุ่มสมัคร = document.getElementById("ปุ่มสมัคร");

  ฟอร์ม.addEventListener("submit", function (e) {
    e.preventDefault();

    var ชื่อ = document.getElementById("name").value.trim();
    var อีเมล = document.getElementById("email").value.trim();
    var รหัสผ่าน = document.getElementById("password").value;
    var รหัสผ่านยืนยัน = document.getElementById("passwordConfirm").value;

    if (!ชื่อ || !อีเมล || !รหัสผ่าน || !รหัสผ่านยืนยัน) {
      เตือน("กรอกไม่ครบ — ต้องกรอกทุกช่องก่อนสมัคร");
      return;
    }
    if (รหัสผ่าน !== รหัสผ่านยืนยัน) {
      เตือน("รหัสผ่านทั้งสองช่องไม่ตรงกัน กรุณาพิมพ์ให้เหมือนกัน");
      return;
    }

    ปุ่มสมัคร.disabled = true;

    createUserWithEmailAndPassword(auth, อีเมล, รหัสผ่าน)
      .then(function (ผลลัพธ์) {
        var ผู้ใช้ = ผลลัพธ์.user;
        return updateProfile(ผู้ใช้, { displayName: ชื่อ })
          .then(function () {
            // ไฟล์ใน users/{uid} — role เริ่มต้นเป็น employee เสมอ (สเปก US-08)
            return setDoc(doc(db, "users", ผู้ใช้.uid), {
              name: ชื่อ,
              email: อีเมล,
              role: "employee"
            });
          });
      })
      .then(function () {
        location.href = "leave-requests.html";
      })
      .catch(function (err) {
        ปุ่มสมัคร.disabled = false;
        เตือน(แปลข้อผิดพลาด(err));
      });
  });

  function เตือน(ข้อความ) {
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }

  // แปลรหัสข้อผิดพลาดที่พบบ่อยของ Firebase Auth ให้อ่านง่ายขึ้น
  function แปลข้อผิดพลาด(err) {
    if (err.code === "auth/email-already-in-use") return "อีเมลนี้สมัครไว้แล้ว ลองเข้าสู่ระบบแทน";
    if (err.code === "auth/weak-password") return "รหัสผ่านสั้นเกินไป ต้องมีอย่างน้อย 6 ตัวอักษร";
    if (err.code === "auth/invalid-email") return "รูปแบบอีเมลไม่ถูกต้อง";
    return "สมัครสมาชิกไม่สำเร็จ: " + err.message;
  }
})();
