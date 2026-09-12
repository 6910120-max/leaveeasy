// ─────────────────────────────────────────────────────────────
// js/leave-request-detail.js — หน้าที่ 3 รายละเอียดใบลา
// สัปดาห์ที่ 6 (ต่อ): อ่าน/แก้ข้อมูลจริงบน Firestore
// - อ่านใบลา 1 ใบ + ความเห็นทั้งหมดของใบนั้น (โฟลเดอร์ย่อย approvals)
// - ปุ่มอนุมัติ/ไม่อนุมัติ แก้เฉพาะช่อง status เท่านั้น (ใช้ updateDoc)
// - ส่งความเห็นใหม่ บันทึกลงโฟลเดอร์ย่อย approvals จริง
// สัปดาห์ที่ 7: รอสถานะล็อกอินพร้อมก่อน แล้วค่อยอ่านข้อมูล · authorId/authorName
// ของความเห็นใหม่มาจากคนที่ล็อกอินอยู่จริง · ปุ่มอนุมัติ/ไม่อนุมัติ/ลบ จำกัดตาม ACL.md
// (ยังเป็นแค่ระดับปุ่มบนหน้าจอ ยังไม่ใช่กฎที่คลังข้อมูล — กฎจริงมาสัปดาห์ที่ 8)
// สัปดาห์ที่ 8: ปุ่ม "ให้ AI ช่วยสรุปใบลา" — ให้ manager/hr กดอ่านสรุปสั้น ๆ ก่อนตัดสินใจ
// ผลสรุปเขียนกลับลงช่อง aiSuggestion ด้วย updateDoc แยกก้อนจากการเปลี่ยนสถานะเสมอ
// ดูรูปแบบการเรียก AI เดียวกันได้ใน js/new-leave-request.js (จัดประเภทด้วยAI)
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import { รอผู้ใช้ล็อกอิน } from "./auth-guard.js";
import {
  doc, getDoc, updateDoc, deleteDoc,
  collection, getDocs, addDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

(async function () {
  var ผู้ใช้ = await รอผู้ใช้ล็อกอิน;

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

    // ตาม ACL.md:
    // - อนุมัติ/ไม่อนุมัติ: เฉพาะ manager/hr และห้ามอนุมัติใบที่ตัวเองเป็นผู้ยื่น
    // - ลบใบลา: เฉพาะเจ้าของใบเท่านั้น (ไม่ว่า role อะไร เพราะ manager/hr ก็ยื่นใบของตัวเองได้)
    var เป็นเจ้าของใบ = ใบ.requesterId === ผู้ใช้.uid;
    var เป็นผู้มีสิทธิ์อนุมัติ = (ผู้ใช้.role === "manager" || ผู้ใช้.role === "hr") && !เป็นเจ้าของใบ;

    if (ใบ.status === "รอพิจารณา") {
      if (เป็นผู้มีสิทธิ์อนุมัติ) {
        html +=
          '<div id="กล่องสรุปAI" class="alert alert-ai' + (ใบ.aiSuggestion ? "" : " hidden") + '">' +
          (ใบ.aiSuggestion ? "🤖 สรุปโดย AI: " + esc(ใบ.aiSuggestion) : "") +
          "</div>" +
          '<div class="btn-row"><button type="button" class="btn-ghost" id="ปุ่มสรุปAI">🤖 ให้ AI ช่วยสรุปใบลา</button></div>' +
          '<p class="hint">AI จะอ่านหัวข้อ เหตุผล ประเภท และวันที่ลาของใบนี้ แล้วเขียนสรุปสั้น ๆ ให้อ่านก่อนตัดสินใจ — ' +
          'ผลจะถูกบันทึกไว้ในใบลานี้ (อย่าใช้ข้อมูลส่วนบุคคลจริงตอนทดสอบ)</p>' +
          '<div class="btn-row">' +
          '<button type="button" class="btn-ok" id="ปุ่มอนุมัติ">อนุมัติ</button>' +
          '<button type="button" class="btn-danger" id="ปุ่มไม่อนุมัติ">ไม่อนุมัติ</button>' +
          "</div>";
      } else if (เป็นเจ้าของใบ && (ผู้ใช้.role === "manager" || ผู้ใช้.role === "hr")) {
        html += '<p class="hint">นี่คือใบลาของคุณเอง จึงอนุมัติ/ไม่อนุมัติเองไม่ได้ ต้องให้ผู้อื่นพิจารณา</p>';
      }
      if (เป็นเจ้าของใบ) {
        html +=
          '<div class="btn-row">' +
          '<button type="button" class="btn-danger" id="ปุ่มลบ">ลบใบลา</button>' +
          "</div>";
      }
    } else {
      html += '<p class="hint">ใบนี้พิจารณาแล้ว จึงเปลี่ยนสถานะต่อไม่ได้</p>';
    }

    กล่องใบลา.innerHTML = html;

    if (เป็นผู้มีสิทธิ์อนุมัติ && ใบ.status === "รอพิจารณา") {
      document.getElementById("ปุ่มอนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("อนุมัติ"); });
      document.getElementById("ปุ่มไม่อนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("ไม่อนุมัติ"); });
      document.getElementById("ปุ่มสรุปAI").addEventListener("click", สรุปด้วยAI);
    }
    if (เป็นเจ้าของใบ && ใบ.status === "รอพิจารณา") {
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

  // ── ปุ่ม "ให้ AI ช่วยสรุปใบลา" (สัปดาห์ที่ 8) ──
  var ชื่อคีย์ใน_localStorage = "leaveeasy_openrouter_key";

  function ดึงคีย์AI() {
    return window.OPENROUTER_API_KEY || localStorage.getItem(ชื่อคีย์ใน_localStorage) || "";
  }

  function แสดงกล่องสรุปAI(ข้อความ, ประเภทกล่อง) {
    var กล่อง = document.getElementById("กล่องสรุปAI");
    กล่อง.textContent = ข้อความ;
    กล่อง.classList.remove("alert-ai", "alert-error");
    กล่อง.classList.add(ประเภทกล่อง);
    กล่อง.classList.remove("hidden");
  }

  // เก็บประวัติทุกครั้งที่เรียก AI ไว้ในโฟลเดอร์ย่อย aiLog ของใบลานี้ (ไม่บล็อกผู้ใช้ถ้าบันทึกไม่สำเร็จ)
  function บันทึกAiLog(อินพุต, เอาต์พุต) {
    addDoc(collection(db, "leaveRequests", รหัสใบลา, "aiLog"), {
      input: อินพุต,
      output: เอาต์พุต,
      createdAt: เวลาตอนนี้()
    }).catch(function (err) {
      console.error("บันทึก aiLog ไม่สำเร็จ: " + err.message);
    });
  }

  async function สรุปด้วยAI() {
    var คีย์ = ดึงคีย์AI();
    if (!คีย์) {
      คีย์ = window.prompt("ใส่ OpenRouter API key (เก็บไว้ใน localStorage ของเบราว์เซอร์นี้เท่านั้น ไม่ถูกส่งขึ้น GitHub):") || "";
      if (!คีย์) return;
      localStorage.setItem(ชื่อคีย์ใน_localStorage, คีย์);
    }

    var โมเดล = window.OPENROUTER_MODEL || "google/gemini-2.5-flash-lite";
    var ปุ่ม = document.getElementById("ปุ่มสรุปAI");
    var ข้อความปุ่มเดิม = ปุ่ม.textContent;
    var พร้อมท์ =
      "สรุปใบลานี้สั้น ๆ 1-2 ประโยคภาษาไทย ให้หัวหน้าอ่านก่อนตัดสินใจอนุมัติ:\n" +
      "หัวข้อ: " + ใบ.title + "\n" +
      "ประเภทการลา: " + ใบ.leaveTypeName + "\n" +
      "วันที่ลา: " + ใบ.startDate + " ถึง " + ใบ.endDate + "\n" +
      "เหตุผล: " + ใบ.reason + "\n\n" +
      "ตอบเป็นข้อความสรุปล้วน ๆ ไม่ต้องมีคำนำหรือ markdown";

    ปุ่ม.disabled = true;
    ปุ่ม.textContent = "🤖 กำลังสรุป...";

    var ตัวยกเลิก = new AbortController();
    var หมดเวลา = setTimeout(function () { ตัวยกเลิก.abort(); }, 15000);

    try {
      var res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": "Bearer " + คีย์, "Content-Type": "application/json" },
        body: JSON.stringify({ model: โมเดล, messages: [{ role: "user", content: พร้อมท์ }] }),
        signal: ตัวยกเลิก.signal
      });
      var ข้อมูล = await res.json();

      if (!res.ok) {
        var ข้อความผิดพลาด = (ข้อมูล && ข้อมูล.error && ข้อมูล.error.message) || JSON.stringify(ข้อมูล);
        แสดงกล่องสรุปAI("เรียก AI ไม่สำเร็จ (HTTP " + res.status + "): " + ข้อความผิดพลาด, "alert-error");
        บันทึกAiLog(พร้อมท์, "⚠️ เรียกไม่สำเร็จ (HTTP " + res.status + "): " + ข้อความผิดพลาด);
        return;
      }

      var เนื้อหา = ข้อมูล.choices && ข้อมูล.choices[0] && ข้อมูล.choices[0].message && ข้อมูล.choices[0].message.content;
      เนื้อหา = เนื้อหา && เนื้อหา.trim();

      if (!เนื้อหา) {
        แสดงกล่องสรุปAI("AI สรุปไม่ได้ ลองใหม่อีกครั้ง", "alert-error");
        บันทึกAiLog(พร้อมท์, "⚠️ ไม่มีข้อความตอบกลับ");
        return;
      }

      แสดงกล่องสรุปAI("🤖 สรุปโดย AI — โปรดตรวจสอบก่อนตัดสินใจ: " + เนื้อหา, "alert-ai");
      บันทึกAiLog(พร้อมท์, เนื้อหา);

      // ขั้นที่ 3: เขียนสรุปกลับลง Firestore (คนละ updateDoc กับตอนเปลี่ยนสถานะเสมอ — แก้เฉพาะช่อง aiSuggestion)
      updateDoc(doc(db, "leaveRequests", รหัสใบลา), { aiSuggestion: เนื้อหา })
        .then(function () { ใบ.aiSuggestion = เนื้อหา; })
        .catch(function (err) {
          แสดงกล่องสรุปAI(
            "🤖 สรุปโดย AI — โปรดตรวจสอบก่อนตัดสินใจ: " + เนื้อหา +
            " ⚠️ (บันทึกลง Firestore ไม่สำเร็จ: " + err.message + ")",
            "alert-ai"
          );
        });
    } catch (err) {
      if (err.name === "AbortError") {
        แสดงกล่องสรุปAI("หมดเวลารอคำตอบจาก AI (เกิน 15 วินาที) กรุณาลองใหม่", "alert-error");
        บันทึกAiLog(พร้อมท์, "⚠️ หมดเวลารอ (เกิน 15 วินาที)");
      } else {
        แสดงกล่องสรุปAI("เรียก AI ไม่สำเร็จ: " + err.message, "alert-error");
        บันทึกAiLog(พร้อมท์, "⚠️ เรียกไม่สำเร็จ: " + err.message);
      }
    } finally {
      clearTimeout(หมดเวลา);
      ปุ่ม.disabled = false;
      ปุ่ม.textContent = ข้อความปุ่มเดิม;
    }
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

    var ความเห็นใหม่ = {
      authorId: ผู้ใช้.uid, authorName: ผู้ใช้.displayName || ผู้ใช้.email,
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
