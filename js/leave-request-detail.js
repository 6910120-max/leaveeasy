// ─────────────────────────────────────────────────────────────
// js/leave-request-detail.js — หน้าที่ 3 รายละเอียดใบลา
// สัปดาห์ที่ 6 (ต่อ): อ่าน/แก้ข้อมูลจริงบน Firestore
// - อ่านใบลา 1 ใบ + ความเห็นทั้งหมดของใบนั้น (โฟลเดอร์ย่อย approvals)
// - ปุ่มอนุมัติ/ไม่อนุมัติ แก้เฉพาะช่อง status เท่านั้น (ใช้ updateDoc)
// - ส่งความเห็นใหม่ บันทึกลงโฟลเดอร์ย่อย approvals จริง
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import {
  doc, getDoc, updateDoc, deleteDoc,
  collection, getDocs, addDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

(async function () {
  var รหัสใบลา = ค่าจากURL("id");
  var กล่องใบลา = document.getElementById("กล่องใบลา");
  var กล่องความเห็น = document.getElementById("กล่องความเห็น");

  var ใบ = null;
  var ความเห็น = [];

  try {
    var เอกสารใบลา = await getDoc(doc(db, "leaveRequests", รหัสใบลา));
    if (เอกสารใบลา.exists()) {
      ใบ = Object.assign({ id: เอกสารใบลา.id }, เอกสารใบลา.data());
    }
  } catch (err) {
    กล่องใบลา.innerHTML = "<p>⚠️ อ่านข้อมูลจาก Firestore ไม่สำเร็จ: " + esc(err.message) + "</p>";
    return;
  }

  if (!ใบ) {
    กล่องใบลา.innerHTML = "<p>ไม่พบใบขอลาที่ต้องการ — อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>";
    return;
  }

  try {
    var ชุดความเห็น = await getDocs(collection(db, "leaveRequests", รหัสใบลา, "approvals"));
    ชุดความเห็น.forEach(function (เอกสาร) {
      ความเห็น.push(Object.assign({ id: เอกสาร.id }, เอกสาร.data()));
    });
  } catch (err) {
    // อ่านความเห็นไม่สำเร็จ ไม่ต้องบล็อกทั้งหน้า แค่โชว์ว่าไม่มีความเห็น
    ความเห็น = [];
  }

  วาดใบลา();
  วาดความเห็น();
  กล่องความเห็น.classList.remove("hidden");

  document.getElementById("ปุ่มส่งความเห็น").addEventListener("click", ส่งความเห็น);

  // ── วาดข้อมูลใบลาลงหน้าจอ ──
  function วาดใบลา() {
    var แถว = [
      ["หัวข้อ", esc(ใบ.title)],
      ["เหตุผลการลา", esc(ใบ.reason)],
      ["ประเภทการลา", esc(ใบ.leaveTypeName)],
      ["วันที่ลา", esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate)],
      ["ผู้ขอลา", esc(ใบ.requesterName)],
      ["ผู้อนุมัติ", ใบ.approverName ? esc(ใบ.approverName) : "ยังไม่ได้กำหนดผู้อนุมัติ"],
      ["สถานะ", ป้ายสถานะ(ใบ.status)],
      ["วันที่ยื่น", esc(ใบ.createdAt)]
    ];

    var html = แถว.map(function (r) {
      return '<div class="field-row"><span class="k">' + r[0] + "</span><span>" + r[1] + "</span></div>";
    }).join("");

    // ปุ่มอนุมัติ / ไม่อนุมัติ / ลบ ขึ้นเฉพาะใบที่ยังรอพิจารณา
    if (ใบ.status === "รอพิจารณา") {
      html +=
        '<div class="btn-row">' +
        '<button type="button" class="btn-ok" id="ปุ่มอนุมัติ">อนุมัติ</button>' +
        '<button type="button" class="btn-danger" id="ปุ่มไม่อนุมัติ">ไม่อนุมัติ</button>' +
        "</div>" +
        '<div class="btn-row">' +
        '<button type="button" class="btn-danger" id="ปุ่มลบ">ลบใบลา</button>' +
        "</div>";
    } else {
      html += '<p class="hint">ใบนี้พิจารณาแล้ว จึงเปลี่ยนสถานะต่อไม่ได้</p>';
    }

    กล่องใบลา.innerHTML = html;

    if (ใบ.status === "รอพิจารณา") {
      document.getElementById("ปุ่มอนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("อนุมัติ"); });
      document.getElementById("ปุ่มไม่อนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("ไม่อนุมัติ"); });
      document.getElementById("ปุ่มลบ").addEventListener("click", ลบใบลา);
    }
  }

  // ── ลบใบลา (ต้องยืนยันก่อนเสมอ) ──
  function ลบใบลา() {
    if (!confirm("ยืนยันการลบใบลานี้หรือไม่")) return;

    deleteDoc(doc(db, "leaveRequests", รหัสใบลา))
      .then(function () {
        location.href = "leave-requests.html";
      })
      .catch(function (err) {
        alert("ลบใบลาไม่สำเร็จ: " + err.message);
      });
  }

  // ── เปลี่ยนสถานะ (เขียนลง Firestore จริง แก้เฉพาะช่อง status) ──
  function เปลี่ยนสถานะ(สถานะใหม่) {
    // กฎ: จะไม่อนุมัติได้ ต้องมีความเห็นอย่างน้อย 1 รายการก่อน
    if (สถานะใหม่ === "ไม่อนุมัติ" && ความเห็น.length === 0) {
      alert("ต้องเขียนความเห็นอย่างน้อย 1 รายการก่อน จึงจะกดไม่อนุมัติได้");
      return;
    }

    updateDoc(doc(db, "leaveRequests", รหัสใบลา), { status: สถานะใหม่ })
      .then(function () {
        ใบ.status = สถานะใหม่;   // แก้เฉพาะช่อง status ในตัวแปรหน้าจอเช่นกัน
        วาดใบลา();
      })
      .catch(function (err) {
        alert("บันทึกสถานะลง Firestore ไม่สำเร็จ: " + err.message);
      });
  }

  // ── รายการความเห็น เรียงจากเก่าไปใหม่ ──
  function วาดความเห็น() {
    var ที่วาง = document.getElementById("รายการความเห็น");
    if (ความเห็น.length === 0) {
      ที่วาง.innerHTML = "<p>ยังไม่มีความเห็นในใบนี้</p>";
      return;
    }
    ที่วาง.innerHTML = ความเห็น
      .slice()
      .sort(function (a, b) { return a.createdAt < b.createdAt ? -1 : 1; })
      .map(function (c) {
        return '<div class="comment"><div class="meta">' + esc(c.authorName) + " · " + esc(c.createdAt) +
               "</div><div>" + esc(c.message) + "</div></div>";
      }).join("");
  }

  // ── ส่งความเห็นใหม่ (บันทึกลงโฟลเดอร์ย่อย approvals จริง) ──
  function ส่งความเห็น() {
    var ช่อง = document.getElementById("ข้อความความเห็น");
    var เตือน = document.getElementById("เตือนความเห็น");
    var ข้อความ = ช่อง.value.trim();

    if (!ข้อความ) {
      เตือน.textContent = "⚠️ พิมพ์ข้อความก่อน จึงจะส่งความเห็นได้";
      เตือน.classList.remove("hidden");
      return;
    }
    เตือน.classList.add("hidden");

    // สัปดาห์นี้ยังไม่มีล็อกอิน จึงสมมติว่าผู้เขียนคือ สมหญิง รักงาน
    var ความเห็นใหม่ = {
      authorId: "u002", authorName: "สมหญิง รักงาน",
      message: ข้อความ,
      createdAt: เวลาตอนนี้()
    };

    addDoc(collection(db, "leaveRequests", รหัสใบลา, "approvals"), ความเห็นใหม่)
      .then(function (เอกสารใหม่) {
        ความเห็น.push(Object.assign({ id: เอกสารใหม่.id }, ความเห็นใหม่));
        ช่อง.value = "";
        วาดความเห็น();
      })
      .catch(function (err) {
        เตือน.textContent = "⚠️ บันทึกความเห็นลง Firestore ไม่สำเร็จ: " + err.message;
        เตือน.classList.remove("hidden");
      });
  }
})();
