// ─────────────────────────────────────────────────────────────
// js/data.js — ข้อมูลปลอมสำหรับสัปดาห์ที่ 6
//
// ไฟล์นี้มีไว้ให้หน้าจอ "มีอะไรให้แสดง" ก่อนที่จะต่อฐานข้อมูลจริง
// ชื่อช่องข้อมูลทุกตัวสะกดตรงกับที่จะใช้บน Firestore เป๊ะ
// เพราะสัปดาห์นี้จะเอาข้อมูลชุดเดียวกันนี้ใส่ลง Firestore ต่อ
//
// ⚠️ ชื่อคนทุกชื่อเป็นชื่อสมมติ · อีเมลทุกตัวเป็นอีเมลตัวอย่าง
// ─────────────────────────────────────────────────────────────

window.LEAVE_DATA = {

  // 📁 users — ผู้ใช้ 3 คน 3 บทบาท
  users: [
    { id: "u001", name: "สมชาย ใจดี",   email: "somchai@example.com", role: "employee" },
    { id: "u002", name: "สมหญิง รักงาน", email: "somying@example.com", role: "manager" },
    { id: "u003", name: "สมศรี ตั้งใจ",  email: "somsri@example.com",  role: "hr" }
  ],

  // 📁 leaveTypes — ประเภทการลา 3 แบบ
  leaveTypes: [
    { id: "lt001", name: "ลาพักร้อน" },
    { id: "lt002", name: "ลาป่วย" },
    { id: "lt003", name: "ลากิจ" }
  ],

  // 📁 leaveRequests — ใบขอลา 5 ใบ · สถานะกระจายครบทั้ง 3 ค่า
  // 🔁 สังเกตว่าทุกใบจด "ชื่อ" ซ้ำไว้คู่กับ "รหัส" เสมอ
  //    เพราะ Firestore ไม่มี JOIN ถ้าเก็บแต่รหัส หน้าจอจะขึ้นว่า u001 แทนชื่อคน
  leaveRequests: [
    {
      id: "lr001",
      title: "ลาพักร้อนไปเที่ยวกับครอบครัว",
      reason: "วางแผนเดินทางไปต่างจังหวัดกับครอบครัว จองที่พักไว้ล่วงหน้าแล้ว",
      status: "รอพิจารณา",
      requesterId: "u001", requesterName: "สมชาย ใจดี",
      approverId: "u002",  approverName: "สมหญิง รักงาน",
      leaveTypeId: "lt001", leaveTypeName: "ลาพักร้อน",
      startDate: "2026-09-07", endDate: "2026-09-09",
      createdAt: "2026-09-01 09:15"
    },
    {
      id: "lr002",
      title: "ลาป่วยไข้หวัดใหญ่",
      reason: "มีไข้สูงและไอมาก แพทย์แนะนำให้พักอยู่บ้าน 2 วัน",
      status: "อนุมัติ",
      requesterId: "u001", requesterName: "สมชาย ใจดี",
      approverId: "u002",  approverName: "สมหญิง รักงาน",
      leaveTypeId: "lt002", leaveTypeName: "ลาป่วย",
      startDate: "2026-08-24", endDate: "2026-08-25",
      createdAt: "2026-08-24 08:05"
    },
    {
      id: "lr003",
      title: "ลากิจไปทำบัตรประชาชน",
      reason: "บัตรประชาชนหมดอายุ ต้องไปทำที่สำนักงานเขตในวันทำการ",
      status: "รอพิจารณา",
      requesterId: "u003", requesterName: "สมศรี ตั้งใจ",
      approverId: "",      approverName: "",
      leaveTypeId: "lt003", leaveTypeName: "ลากิจ",
      startDate: "2026-09-15", endDate: "2026-09-15",
      createdAt: "2026-09-10 16:30"
    },
    {
      id: "lr004",
      title: "ลาพักร้อนช่วงวันหยุดยาว",
      reason: "อยากต่อวันหยุดยาวไปพักผ่อนกับครอบครัวอีก 3 วัน",
      status: "ไม่อนุมัติ",
      requesterId: "u003", requesterName: "สมศรี ตั้งใจ",
      approverId: "u002",  approverName: "สมหญิง รักงาน",
      leaveTypeId: "lt001", leaveTypeName: "ลาพักร้อน",
      startDate: "2026-10-12", endDate: "2026-10-16",
      createdAt: "2026-09-20 11:00"
    },
    {
      id: "lr005",
      title: "ลาป่วยไปพบแพทย์ตามนัด",
      reason: "มีนัดตรวจติดตามอาการกับแพทย์ในช่วงเช้า",
      status: "รอพิจารณา",
      requesterId: "u001", requesterName: "สมชาย ใจดี",
      approverId: "u002",  approverName: "สมหญิง รักงาน",
      leaveTypeId: "lt002", leaveTypeName: "ลาป่วย",
      startDate: "2026-09-22", endDate: "2026-09-22",
      createdAt: "2026-09-18 14:45"
    }
  ],

  // 📁 approvals — ความเห็นการอนุมัติ
  // ตอนใส่ลง Firestore ความเห็นเหล่านี้จะกลายเป็น "โฟลเดอร์ย่อย" ของใบลาแต่ละใบ
  // ตรงนี้จึงต้องมีช่อง requestId ไว้บอกว่าเป็นความเห็นของใบไหน
  approvals: [
    {
      id: "ap001", requestId: "lr001",
      authorId: "u002", authorName: "สมหญิง รักงาน",
      message: "รับเรื่องแล้ว ขอดูตารางงานของทีมช่วงนั้นก่อนนะครับ",
      createdAt: "2026-09-01 13:40"
    },
    {
      id: "ap002", requestId: "lr001",
      authorId: "u003", authorName: "สมศรี ตั้งใจ",
      message: "ตรวจแล้ว วันลาพักร้อนคงเหลือครอบคลุมช่วงที่ขอ ไม่ติดขัดฝั่งฝ่ายบุคคล",
      createdAt: "2026-09-02 10:05"
    },
    {
      id: "ap003", requestId: "lr002",
      authorId: "u002", authorName: "สมหญิง รักงาน",
      message: "อนุมัติแล้ว พักผ่อนให้เต็มที่ งานที่ค้างไว้เดี๋ยวทีมช่วยดูให้",
      createdAt: "2026-08-24 09:20"
    },
    {
      id: "ap004", requestId: "lr004",
      authorId: "u002", authorName: "สมหญิง รักงาน",
      message: "ช่วงนั้นทีมมีงานส่งมอบพอดี ขอเลื่อนเป็นสัปดาห์ถัดไปได้ไหมครับ",
      createdAt: "2026-09-20 15:10"
    }
  ]
};
