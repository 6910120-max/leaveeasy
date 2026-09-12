// ─────────────────────────────────────────────────────────────
// js/ai-test.js — หน้าทดสอบผู้ช่วย AI ผ่าน OpenRouter (สัปดาห์ที่ 8)
// กดปุ่มแล้วส่งข้อความ "สวัสดี" ไปยังโมเดลที่ตั้งไว้ แล้วแสดงคำตอบบนหน้าจอ
//
// คีย์ API อ่านจาก window.OPENROUTER_API_KEY (ตั้งไว้ใน js/ai-config.local.js
// ซึ่งอยู่ใน .gitignore ไม่ถูก push ขึ้น GitHub) ถ้าไม่มีไฟล์นั้น จะถามคีย์จากผู้ใช้
// แล้วเก็บไว้ใน localStorage ของเบราว์เซอร์นี้เท่านั้น — ไม่เขียนคีย์ลงไฟล์ใด ๆ
// ─────────────────────────────────────────────────────────────

(function () {
  "use strict";

  var ชื่อคีย์ใน_localStorage = "leaveeasy_openrouter_key";

  var ปุ่มส่ง = document.getElementById("ปุ่มส่ง");
  var กล่องLog = document.getElementById("log");
  var สถานะคีย์ = document.getElementById("สถานะคีย์");

  function ดึงคีย์() {
    return window.OPENROUTER_API_KEY || localStorage.getItem(ชื่อคีย์ใน_localStorage) || "";
  }

  function แสดงสถานะคีย์() {
    var คีย์ = ดึงคีย์();
    สถานะคีย์.textContent = คีย์
      ? "พร้อมใช้งาน — อ่านคีย์ OpenRouter ได้แล้ว"
      : "ยังไม่มีคีย์ — กดปุ่มด้านล่างแล้วระบบจะถามคีย์ให้กรอก (เก็บไว้ใน localStorage ของเบราว์เซอร์นี้เท่านั้น)";
  }

  function เขียนlog(ข้อความ) {
    กล่องLog.textContent += (กล่องLog.textContent ? "\n" : "") + ข้อความ;
  }

  async function ส่งข้อความ() {
    var คีย์ = ดึงคีย์();
    if (!คีย์) {
      คีย์ = window.prompt("ใส่ OpenRouter API key (เก็บไว้ใน localStorage ของเบราว์เซอร์นี้เท่านั้น ไม่ถูกส่งขึ้น GitHub):") || "";
      if (!คีย์) return;
      localStorage.setItem(ชื่อคีย์ใน_localStorage, คีย์);
      แสดงสถานะคีย์();
    }

    var โมเดล = window.OPENROUTER_MODEL || "google/gemini-2.5-flash-lite";

    ปุ่มส่ง.disabled = true;
    กล่องLog.textContent = "";
    เขียนlog("กำลังส่งข้อความ \"สวัสดี\" ไปยังโมเดล " + โมเดล + " ...");

    try {
      var res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + คีย์,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: โมเดล,
          messages: [{ role: "user", content: "สวัสดี" }]
        })
      });

      var ข้อมูล = await res.json();

      if (!res.ok) {
        var ข้อความผิดพลาด = (ข้อมูล && ข้อมูล.error && ข้อมูล.error.message) || JSON.stringify(ข้อมูล);
        เขียนlog("เรียกไม่สำเร็จ (HTTP " + res.status + "): " + ข้อความผิดพลาด);
        return;
      }

      var คำตอบ =
        ข้อมูล.choices &&
        ข้อมูล.choices[0] &&
        ข้อมูล.choices[0].message &&
        ข้อมูล.choices[0].message.content;

      เขียนlog("คำตอบจาก AI:\n" + (คำตอบ || "(ไม่มีข้อความตอบกลับ)"));
    } catch (err) {
      เขียนlog("เรียกไม่สำเร็จ: " + err.message);
    } finally {
      ปุ่มส่ง.disabled = false;
    }
  }

  ปุ่มส่ง.addEventListener("click", ส่งข้อความ);
  แสดงสถานะคีย์();
})();
