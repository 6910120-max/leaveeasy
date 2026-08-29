// ─────────────────────────────────────────────────────────────
// js/leave-requests.js — หน้าที่ 1 รายการใบลา
// สัปดาห์ที่ 6: อ่านข้อมูลจริงจาก Firestore (โฟลเดอร์ leaveRequests)
// ใบที่เพิ่งยื่นในหน้าถัดไปยังอยู่ใน sessionStorage เท่านั้น
// (บันทึกลง Firestore จริงเป็นงานของสัปดาห์ที่ 7)
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

(async function () {
  var กล่อง = document.getElementById("ผลลัพธ์");

  var ใบลาจากFirestore = [];
  try {
    // เรียงจากใหม่ไปเก่า ตามวันที่ยื่น (createdAt)
    var ชุดเอกสาร = await getDocs(query(collection(db, "leaveRequests"), orderBy("createdAt", "desc")));
    ชุดเอกสาร.forEach(function (เอกสาร) {
      ใบลาจากFirestore.push(Object.assign({ id: เอกสาร.id }, เอกสาร.data()));
    });
  } catch (err) {
    กล่อง.innerHTML =
      "<p>⚠️ อ่านข้อมูลจาก Firestore ไม่สำเร็จ: " + esc(err.message) +
      "</p><p class=\"hint\">ตรวจว่าสร้างฐานข้อมูล Firestore แล้ว และ Security Rules อนุญาตให้อ่านได้</p>";
    return;
  }

  // ใบลาที่เพิ่งยื่นในหน้า "ยื่นใบลาใหม่" (สัปดาห์นี้ยังไม่บันทึกลง Firestore จริง)
  var ใบลาที่ยื่นใหม่ = JSON.parse(sessionStorage.getItem("ใบลาที่ยื่นใหม่") || "[]");
  var ใบลาทั้งหมด = ใบลาจากFirestore.concat(ใบลาที่ยื่นใหม่);

  // ถ้ามีสถานะติดมาท้าย URL ให้กรองเฉพาะสถานะนั้น
  var สถานะที่กรอง = ค่าจากURL("status");
  if (สถานะที่กรอง) {
    ใบลาทั้งหมด = ใบลาทั้งหมด.filter(function (ใบ) { return ใบ.status === สถานะที่กรอง; });
    document.querySelector(".subtitle").textContent =
      "กำลังแสดงเฉพาะใบลาที่สถานะ " + สถานะที่กรอง + " · กดเมนู รายการใบลา เพื่อดูทั้งหมด";
  }

  แสดงตาราง(ใบลาทั้งหมด);

  function แสดงตาราง(รายการ) {
    if (รายการ.length === 0) {
      กล่อง.innerHTML = "<p>ยังไม่มีใบขอลาในระบบ</p>";
      return;
    }

    var html =
      "<table><thead><tr>" +
      "<th>หัวข้อ</th>" +
      "<th>ประเภทการลา</th>" +
      "<th>สถานะ</th>" +
      '<th class="hide-mobile">ผู้ขอลา</th>' +
      '<th class="hide-mobile">วันที่ลา</th>' +
      "</tr></thead><tbody>";

    รายการ.forEach(function (ใบ) {
      html +=
        '<tr class="clickable" data-id="' + esc(ใบ.id) + '">' +
        "<td>" + esc(ใบ.title) + "</td>" +
        "<td>" + esc(ใบ.leaveTypeName) + "</td>" +
        "<td>" + ป้ายสถานะ(ใบ.status) + "</td>" +
        '<td class="hide-mobile">' + esc(ใบ.requesterName) + "</td>" +
        '<td class="hide-mobile">' + esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate) + "</td>" +
        "</tr>";
    });

    html += "</tbody></table>";
    กล่อง.innerHTML = html;

    // กดที่แถวไหน ไปหน้ารายละเอียดของใบนั้น
    กล่อง.querySelectorAll("tr.clickable").forEach(function (แถว) {
      แถว.addEventListener("click", function () {
        location.href = "leave-request-detail.html?id=" + แถว.dataset.id;
      });
    });
  }
})();
