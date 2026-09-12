// ─────────────────────────────────────────────────────────────
// js/new-leave-request.js — หน้าที่ 2 ยื่นใบลาใหม่
// สัปดาห์ที่ 6 (ต่อ): บันทึกใบลาใหม่ลง Firestore จริง (โฟลเดอร์ leaveRequests)
// รายการเลื่อนลงประเภทการลาก็อ่านจาก Firestore จริงเช่นกัน (โฟลเดอร์ leaveTypes)
// สัปดาห์ที่ 7: requesterId/requesterName มาจากคนที่ล็อกอินอยู่จริง ไม่ใช่ค่าคงที่แล้ว
// สัปดาห์ที่ 8: ปุ่ม "ให้ AI ช่วยจัดประเภทการลา" — อ่านช่องเหตุผล ส่งไปพร้อมรายชื่อประเภทการลาจริง
// ผ่าน OpenRouter แล้วเลือกประเภทให้ (ผู้ใช้ยังแก้ไขเองได้เสมอ) ดูรูปแบบการเรียกเดียวกันได้ใน js/ai-test.js
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import { รอผู้ใช้ล็อกอิน } from "./auth-guard.js";
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

(async function () {
  // รอสถานะล็อกอินพร้อมก่อน แล้วค่อยอ่าน/เขียนข้อมูล
  var ผู้ใช้ = await รอผู้ใช้ล็อกอิน;

  var ฟอร์ม = document.getElementById("ฟอร์มใบลา");
  var ช่องประเภท = document.getElementById("leaveTypeId");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ปุ่มบันทึก = document.getElementById("ปุ่มบันทึก");
  var ปุ่มAI = document.getElementById("ปุ่มAI");
  var กล่องAI = document.getElementById("ข้อความAI");

  var ประเภททั้งหมด = [];

  // เติมรายการเลื่อนลงด้วยประเภทการลาที่มีอยู่จริงใน Firestore
  try {
    var ชุดเอกสาร = await getDocs(collection(db, "leaveTypes"));
    ชุดเอกสาร.forEach(function (เอกสาร) {
      ประเภททั้งหมด.push(Object.assign({ id: เอกสาร.id }, เอกสาร.data()));
    });
  } catch (err) {
    เตือน("อ่านประเภทการลาจาก Firestore ไม่สำเร็จ: " + err.message);
  }

  ประเภททั้งหมด.forEach(function (ประเภท) {
    var ตัวเลือก = document.createElement("option");
    ตัวเลือก.value = ประเภท.id;
    ตัวเลือก.textContent = ประเภท.name;
    ช่องประเภท.appendChild(ตัวเลือก);
  });

  // ── ปุ่ม "ให้ AI ช่วยจัดประเภทการลา" (สัปดาห์ที่ 8) ──
  var ชื่อคีย์ใน_localStorage = "leaveeasy_openrouter_key";
  var ข้อความปุ่มAIเดิม = ปุ่มAI.textContent;

  ปุ่มAI.addEventListener("click", จัดประเภทด้วยAI);

  // ผู้ใช้เปลี่ยนประเภทเองหลัง AI เลือกให้แล้ว ให้ซ่อนป้าย AI ทิ้งไป (ตั้งค่าด้วยโค้ดไม่ทำให้ event นี้ยิง)
  ช่องประเภท.addEventListener("change", function () {
    กล่องAI.classList.add("hidden");
  });

  function ดึงคีย์AI() {
    return window.OPENROUTER_API_KEY || localStorage.getItem(ชื่อคีย์ใน_localStorage) || "";
  }

  function แสดงAI(ข้อความ, ประเภทกล่อง) {
    กล่องAI.textContent = ข้อความ;
    กล่องAI.classList.remove("alert-ai", "alert-error");
    กล่องAI.classList.add(ประเภทกล่อง);
    กล่องAI.classList.remove("hidden");
  }

  async function จัดประเภทด้วยAI() {
    var เหตุผล = document.getElementById("reason").value.trim();
    if (!เหตุผล) {
      แสดงAI("กรอกเหตุผลการลาก่อน ถึงจะให้ AI ช่วยจัดประเภทได้", "alert-error");
      return;
    }

    var คีย์ = ดึงคีย์AI();
    if (!คีย์) {
      คีย์ = window.prompt("ใส่ OpenRouter API key (เก็บไว้ใน localStorage ของเบราว์เซอร์นี้เท่านั้น ไม่ถูกส่งขึ้น GitHub):") || "";
      if (!คีย์) return;
      localStorage.setItem(ชื่อคีย์ใน_localStorage, คีย์);
    }

    var โมเดล = window.OPENROUTER_MODEL || "google/gemini-2.5-flash-lite";
    var รายชื่อประเภท = ประเภททั้งหมด.map(function (ป) { return { id: ป.id, name: ป.name }; });
    var พร้อมท์ =
      "คุณคือผู้ช่วยจัดประเภทการลา ต่อไปนี้คือรายชื่อประเภทการลาที่มีอยู่จริงในระบบเท่านั้น ห้ามเลือกนอกเหนือจากนี้:\n" +
      JSON.stringify(รายชื่อประเภท) +
      "\n\nเหตุผลการลาของพนักงาน: \"" + เหตุผล + "\"\n\n" +
      "จงเลือก id ของประเภทการลาที่ตรงกับเหตุผลนี้ที่สุด แล้วตอบกลับเป็น JSON เดียวเท่านั้น รูปแบบ {\"leaveTypeId\": \"รหัสที่เลือก\"} " +
      "ห้ามมีข้อความอื่นนอกจาก JSON ถ้าไม่มีประเภทใดเหมาะสมเลย ให้ตอบ {\"leaveTypeId\": null}";

    ปุ่มAI.disabled = true;
    ปุ่มAI.textContent = "🤖 กำลังคิด...";

    var ตัวยกเลิก = new AbortController();
    var หมดเวลา = setTimeout(function () { ตัวยกเลิก.abort(); }, 15000);

    try {
      var res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + คีย์,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: โมเดล,
          messages: [{ role: "user", content: พร้อมท์ }],
          response_format: { type: "json_object" }
        }),
        signal: ตัวยกเลิก.signal
      });

      var ข้อมูล = await res.json();
      if (!res.ok) {
        var ข้อความผิดพลาด = (ข้อมูล && ข้อมูล.error && ข้อมูล.error.message) || JSON.stringify(ข้อมูล);
        แสดงAI("เรียก AI ไม่สำเร็จ (HTTP " + res.status + "): " + ข้อความผิดพลาด, "alert-error");
        return;
      }

      var เนื้อหา = ข้อมูล.choices && ข้อมูล.choices[0] && ข้อมูล.choices[0].message && ข้อมูล.choices[0].message.content;
      var ผล = แยกJSON(เนื้อหา);
      var พบ = ผล && ประเภททั้งหมด.find(function (ป) { return ป.id === ผล.leaveTypeId; });

      if (พบ) {
        ช่องประเภท.value = พบ.id;
        แสดงAI("🤖 ข้อเสนอจาก AI — โปรดตรวจสอบก่อนยืนยัน: เลือกเป็น \"" + esc(พบ.name) + "\" ให้แล้ว คุณแก้ไขได้ก่อนกดบันทึก", "alert-ai");
      } else {
        แสดงAI("AI จัดประเภทให้ไม่ได้ กรุณาเลือกประเภทการลาด้วยตนเอง", "alert-error");
      }
    } catch (err) {
      if (err.name === "AbortError") {
        แสดงAI("หมดเวลารอคำตอบจาก AI (เกิน 15 วินาที) กรุณาลองใหม่หรือเลือกประเภทด้วยตนเอง", "alert-error");
      } else {
        แสดงAI("เรียก AI ไม่สำเร็จ: " + err.message, "alert-error");
      }
    } finally {
      clearTimeout(หมดเวลา);
      ปุ่มAI.disabled = false;
      ปุ่มAI.textContent = ข้อความปุ่มAIเดิม;
    }
  }

  // ตัด ```json ... ``` ที่บางโมเดลชอบห่อมาให้ออกก่อน parse แล้วถ้ายัง parse ไม่ผ่าน
  // ลองดึงเฉพาะส่วนที่เป็น { ... } ตัวแรกในข้อความมา parse อีกที
  function แยกJSON(ข้อความ) {
    if (!ข้อความ) return null;
    var ข้อความสะอาด = ข้อความ.replace(/```json/gi, "").replace(/```/g, "").trim();
    try {
      return JSON.parse(ข้อความสะอาด);
    } catch (err) {
      var จับได้ = ข้อความสะอาด.match(/\{[\s\S]*\}/);
      if (!จับได้) return null;
      try {
        return JSON.parse(จับได้[0]);
      } catch (err2) {
        return null;
      }
    }
  }

  ฟอร์ม.addEventListener("submit", function (e) {
    e.preventDefault();

    var ค่า = {
      title: document.getElementById("title").value.trim(),
      reason: document.getElementById("reason").value.trim(),
      leaveTypeId: ช่องประเภท.value,
      startDate: document.getElementById("startDate").value,
      endDate: document.getElementById("endDate").value
    };

    // ตรวจว่ากรอกครบก่อนบันทึก
    if (!ค่า.title || !ค่า.reason || !ค่า.leaveTypeId || !ค่า.startDate || !ค่า.endDate) {
      เตือน("กรอกไม่ครบ — ต้องกรอกทุกช่องก่อนกดบันทึก");
      return;
    }
    if (ค่า.endDate < ค่า.startDate) {
      เตือน("วันที่สิ้นสุดต้องไม่มาก่อนวันที่เริ่มลา");
      return;
    }

    var ประเภท = ประเภททั้งหมด.find(function (t) { return t.id === ค่า.leaveTypeId; });

    var ใบใหม่ = {
      title: ค่า.title,
      reason: ค่า.reason,
      status: "รอพิจารณา",                       // ใบใหม่เริ่มที่ รอพิจารณา เสมอ
      requesterId: ผู้ใช้.uid, requesterName: ผู้ใช้.displayName || ผู้ใช้.email,
      approverId: "",      approverName: "",
      leaveTypeId: ประเภท.id, leaveTypeName: ประเภท.name,
      startDate: ค่า.startDate,
      endDate: ค่า.endDate,
      createdAt: เวลาตอนนี้()
    };

    ปุ่มบันทึก.disabled = true;

    addDoc(collection(db, "leaveRequests"), ใบใหม่)
      .then(function () {
        location.href = "leave-requests.html";
      })
      .catch(function (err) {
        ปุ่มบันทึก.disabled = false;
        เตือน("บันทึกลง Firestore ไม่สำเร็จ: " + err.message);
      });
  });

  function เตือน(ข้อความ) {
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }
})();
