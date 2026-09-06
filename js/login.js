// ─────────────────────────────────────────────────────────────
// js/login.js — หน้าเข้าสู่ระบบ
// สัปดาห์ที่ 7: เข้าสู่ระบบด้วยอีเมล/รหัสผ่านผ่าน Firebase Authentication
// ─────────────────────────────────────────────────────────────

import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

(function () {
  var ฟอร์ม = document.getElementById("ฟอร์มเข้าสู่ระบบ");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ปุ่มเข้าสู่ระบบ = document.getElementById("ปุ่มเข้าสู่ระบบ");

  ฟอร์ม.addEventListener("submit", function (e) {
    e.preventDefault();

    var อีเมล = document.getElementById("email").value.trim();
    var รหัสผ่าน = document.getElementById("password").value;

    if (!อีเมล || !รหัสผ่าน) {
      เตือน("กรอกไม่ครบ — ต้องกรอกทั้งอีเมลและรหัสผ่าน");
      return;
    }

    ปุ่มเข้าสู่ระบบ.disabled = true;

    signInWithEmailAndPassword(auth, อีเมล, รหัสผ่าน)
      .then(function () {
        location.href = "leave-requests.html";
      })
      .catch(function (err) {
        ปุ่มเข้าสู่ระบบ.disabled = false;
        เตือน(แปลข้อผิดพลาด(err));
      });
  });

  function เตือน(ข้อความ) {
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }

  // แปลรหัสข้อผิดพลาดที่พบบ่อยของ Firebase Auth ให้อ่านง่ายขึ้น
  function แปลข้อผิดพลาด(err) {
    if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
      return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    }
    if (err.code === "auth/invalid-email") return "รูปแบบอีเมลไม่ถูกต้อง";
    return "เข้าสู่ระบบไม่สำเร็จ: " + err.message;
  }
})();
