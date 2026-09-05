// ─────────────────────────────────────────────────────────────
// js/new-leave-request.js — หน้าที่ 2 ยื่นใบลาใหม่
// สัปดาห์ที่ 6 (ต่อ): บันทึกใบลาใหม่ลง Firestore จริง (โฟลเดอร์ leaveRequests)
// รายการเลื่อนลงประเภทการลาก็อ่านจาก Firestore จริงเช่นกัน (โฟลเดอร์ leaveTypes)
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

(async function () {
  var ฟอร์ม = document.getElementById("ฟอร์มใบลา");
  var ช่องประเภท = document.getElementById("leaveTypeId");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ปุ่มบันทึก = document.getElementById("ปุ่มบันทึก");

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

    // สัปดาห์นี้ยังไม่มีล็อกอิน จึงสมมติว่าผู้ขอลาคือ สมชาย ใจดี
    var ใบใหม่ = {
      title: ค่า.title,
      reason: ค่า.reason,
      status: "รอพิจารณา",                       // ใบใหม่เริ่มที่ รอพิจารณา เสมอ
      requesterId: "u001", requesterName: "สมชาย ใจดี",
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
