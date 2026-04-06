document.addEventListener("DOMContentLoaded", () => {
  // =====================================================================
  //      การตั้งค่า SUPABASE
  // =====================================================================
  // SUPABASE configuration is loaded from Vite environment variables.
  // Create a `.env` (or `.env.local`) with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set.
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // =====================================================================
  //      องค์ประกอบหลักของหน้า (DOM Elements)
  // =====================================================================
  const appContent = document.getElementById("app-content");
  const welcomeMessage = document.getElementById("therapist-welcome-message");

  // =====================================================================
  //      Utility & Helper Functions
  // =====================================================================
  function showLoading(message = "กำลังโหลดข้อมูล... กรุณารอสักครู่...") {
    appContent.innerHTML = `<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>${message}</p></div>`;
  }

  function handleError(error, context = "การดำเนินการ") {
    console.error(`Supabase Error in ${context}:`, error);
    let message =
      error.message || "เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองอีกครั้ง";

    if (error.message === "Invalid login credentials") {
      message = "รหัสผ่านไม่ถูกต้อง";
    } else if (
      error.message.includes("session is not found") ||
      error.code === "401"
    ) {
      message = "เซสชันหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่ค่ะ";
      sessionStorage.clear();
      renderLogin();
    }

    Swal.fire(`${context}ล้มเหลว`, message, "error");
  }

  function getTherapistName() {
    return sessionStorage.getItem("therapistName");
  }
  function getUserRole() {
    return sessionStorage.getItem("userRole");
  }
  function getTodayString() {
    return new Date().toISOString().split("T")[0];
  }
  function getFutureDate(days) {
    return new Date(Date.now() + days * 86400000).toISOString().split("T")[0];
  }
  function formatThaiDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // =====================================================================
  //      RENDER FUNCTIONS (สร้างหน้า UI ต่างๆ)
  // =====================================================================

  function renderLogin() {
    welcomeMessage.textContent = "กรุณาเข้าสู่ระบบเพื่อจัดการข้อมูล";
    appContent.innerHTML = `
            <div class="login-form-container">
                <h2 class="page-title"><i class="fa-solid fa-right-to-bracket"></i> เข้าสู่ระบบ</h2>
                <form id="login-form">
                    <div class="form-group"><label for="username">ชื่อผู้ใช้ (Username)</label><input type="text" id="username" required></div>
                    <div class="form-group"><label for="password">รหัสผ่าน</label><input type="password" id="password" required></div>
                    <div class="btn-action-group"><button type="submit" class="btn">เข้าสู่ระบบ</button></div>
                </form>
            </div>`;
    document
      .getElementById("login-form")
      .addEventListener("submit", handleLogin);
  }

  function renderAppointmentListTable(appointmentList) {
    if (!appointmentList || appointmentList.length === 0) {
      return '<table class="appointments-table"><tbody><tr><td class="no-data" colspan="2">ไม่มีตารางเวรในวันที่เลือก</td></tr></tbody></table>';
    }
    let table = `<table class="appointments-table"><thead><tr><th>เวลา</th><th>รายละเอียด</th></tr></thead><tbody>`;
    appointmentList.forEach((item) => {
      const rowClass = `row-${item.status.toLowerCase()}`;
      table += `<tr class="${rowClass}">
                        <td data-label="เวลา">${item.time}</td>
                        <td data-label="รายละเอียด">${item.description.replace(/\*\*(.*?)\*\*/g, "<strong>$1")}</td>
                    </tr>`;
    });
    return table + "</tbody></table>";
  }

  function renderRecordsTable(records, role) {
    if (!records || records.length === 0) {
      return '<table class="appointments-table"><tbody><tr><td class="no-data" colspan="6">ไม่พบข้อมูลการรักษาในวันที่เลือก</td></tr></tbody></table>';
    }
    const isAdminView = role === "Manager";
    const headers = [
      "ชื่อ-สกุล",
      "อายุ",
      "สิทธิการรักษา",
      "อาการ/โรค",
      "หัตถการ",
    ];
    if (isAdminView) headers.push("ผู้รักษา");

    let table = "<thead><tr>";
    headers.forEach((h) => (table += `<th>${h}</th>`));
    table += "</tr></thead><tbody>";

    records.forEach((rec) => {
      table += `<tr>
                <td data-label="${headers[0]}">${rec.first_name || ""} ${rec.last_name || ""}</td>
                <td data-label="${headers[1]}">${rec.age || "-"}</td>
                <td data-label="${headers[2]}">${rec.rights || "-"}</td>
                <td data-label="${headers[3]}">${rec.symptoms || "-"}</td>
                <td data-label="${headers[4]}">${rec.procedure || "-"}</td>
                ${isAdminView ? `<td data-label="${headers[5]}">${rec.therapist || "-"}</td>` : ""}
            </tr>`;
    });
    table += "</tbody>";
    return `<table class="appointments-table">${table}</table>`;
  }

  function renderManagementGrid(slots, therapistName) {
    if (!slots || slots.length === 0)
      return "<p>ไม่มีตารางเวรในวันที่เลือก</p>";
    const isManager = getUserRole() === "Manager";
    let grid = '<div class="management-grid">';

    slots.forEach((slot) => {
      let statusClass = "",
        detailsHtml = "";
      const actionButtonData = `data-time="${slot.time}" data-therapist="${therapistName}"`;

      switch (slot.status) {
        case "BOOKED":
          statusClass = "status-booked";
          detailsHtml = `<p><strong>จองโดย:</strong><br>${slot.details}</p>`;
          break;
        case "BLOCKED":
          statusClass = "status-blocked";
          detailsHtml = `<p><strong>เหตุผล:</strong><br>${slot.details}</p>`;
          if (isManager || slot.blockedBy === getTherapistName()) {
            detailsHtml += `<button class="btn btn-unblock" ${actionButtonData}>ปลดล็อก</button>`;
          }
          break;
        default:
          statusClass = "status-available";
          detailsHtml = `<p><strong>สถานะ:</strong><br>ว่าง</p><button class="btn btn-block" ${actionButtonData}><i class="fas fa-lock"></i> ล็อกคิว</button>`;
          break;
      }
      grid += `<div class="slot-card">
                        <div class="slot-card-time">${slot.time}</div>
                        <div class="slot-card-details ${statusClass}">${detailsHtml}</div>
                     </div>`;
    });
    return grid + "</div>";
  }

  function renderTherapistMainMenu() {
    welcomeMessage.innerHTML = `ยินดีต้อนรับ, <strong>${getTherapistName()}</strong>`;
    appContent.innerHTML = `
            <h2 class="page-title"><i class="fa-solid fa-th-large"></i> เมนูหลัก</h2>
            <div class="main-menu-grid">
                <div class="menu-card" data-action="manage-queue">
                    <i class="fa-solid fa-calendar-alt"></i>
                    <h3>จัดการคิวนัดหมาย</h3>
                    <p>ตรวจสอบตารางนัดหมายและล็อกคิวของตนเอง</p>
                </div>
                <div class="menu-card menu-card-secondary" data-action="check-records"> <i class="fa-solid fa-file-medical"></i>
                    <h3>ตรวจสอบค่าตอบแทน</h3>
                    <p>ดูรายการผู้รับบริการที่คุณได้ทำการรักษาในแต่ละวัน</p>
                </div>
            </div>
            <div class="btn-action-group">
                <button id="btn-logout" class="btn"><i class="fa-solid fa-sign-out-alt"></i> ออกจากระบบ</button>
            </div>`;

    appContent
      .querySelector(".main-menu-grid")
      .addEventListener("click", (e) => {
        const card = e.target.closest(".menu-card");
        if (!card) return;
        const action = card.dataset.action;
        if (action === "manage-queue")
          renderTherapistDashboard(getTodayString());
        else if (action === "check-records")
          renderTherapistRecordsPage(getTodayString());
      });
    document
      .getElementById("btn-logout")
      .addEventListener("click", handleLogout);
  }

  function renderTherapistDashboard(selectedDate) {
    const therapistName = getTherapistName();
    const containerId = "therapist-dashboard-content";

    if (!document.getElementById(containerId)) {
      appContent.innerHTML = `
                <div class="dashboard-section">
                    <div class="dashboard-header">
                        <h3 id="dashboard-title"><i class="fa-solid fa-calendar-alt"></i> จัดการตารางเวลา (${formatThaiDate(selectedDate)})</h3>
                        <div class="controls">
                            <input type="date" id="date-selector" value="${selectedDate}" min="${getTodayString()}" max="${getFutureDate(29)}">
                            <button class="btn btn-back"><i class="fa-solid fa-arrow-left"></i> กลับเมนู</button>
                        </div>
                    </div>
                    <div id="${containerId}"></div>
                </div>`;
      document
        .getElementById("date-selector")
        .addEventListener("change", (e) =>
          renderTherapistDashboard(e.target.value),
        );
      document
        .querySelector(".btn-back")
        .addEventListener("click", renderTherapistMainMenu);
    } else {
      document.getElementById("dashboard-title").innerHTML =
        `<i class="fa-solid fa-calendar-alt"></i> จัดการตารางเวลา (${formatThaiDate(selectedDate)})`;
      document.getElementById("date-selector").value = selectedDate;
    }

    const contentContainer = document.getElementById(containerId);
    contentContainer.innerHTML = `<div class="loading-spinner"><p>กำลังโหลดข้อมูล...</p></div>`;
    loadDashboardData(therapistName, selectedDate, (data) => {
      const dashboardContent = `
                <div id="management-container">${renderManagementGrid(data.scheduleSlots, therapistName)}</div>
                <hr style="margin: 2rem 0; border: 1px solid var(--border-color-light);">
                <h3><i class="fa-solid fa-list-check"></i> รายการนัดหมาย (${formatThaiDate(selectedDate)})</h3>
                ${renderAppointmentListTable(data.appointmentList)}`;
      contentContainer.innerHTML = dashboardContent;
      attachSlotActionListeners("#management-container", selectedDate, () =>
        renderTherapistDashboard(selectedDate),
      );
    });
  }

  // ========== โค้ดส่วนที่แก้ไขล่าสุดอยู่ตรงนี้ ==========
  function renderTherapistRecordsPage(selectedDate) {
    if (!document.getElementById("date-selector-records")) {
      appContent.innerHTML = `
                <div class="dashboard-section">
                    <div class="dashboard-header">
                        <h3 id="therapist-records-title"><i class="fa-solid fa-file-medical"></i> ตรวจสอบค่าตอบแทน (${formatThaiDate(selectedDate)})</h3>
                        <div class="controls">
                            <input type="date" id="date-selector-records" value="${selectedDate}">
                            <button class="btn btn-back"><i class="fa-solid fa-arrow-left"></i> กลับเมนู</button>
                        </div>
                    </div>
                    <div id="records-container"></div>
                </div>`;
            document.getElementById('date-selector-records').addEventListener('change', e => renderTherapistRecordsPage(e.target.value));
            document.querySelector('.btn-back').addEventListener('click', renderTherapistMainMenu);
        } else {
            document.getElementById('therapist-records-title').innerHTML = `<i class="fa-solid fa-file-medical"></i> ตรวจสอบค่าตอบแทน (${formatThaiDate(selectedDate)})`;
            document.getElementById('date-selector-records').value = selectedDate;
        }

        const recordsContainer = document.getElementById('records-container');
        recordsContainer.innerHTML = `<div class="loading-spinner"><p>กำลังโหลดข้อมูล...</p></div>`;

        // ---- ส่วนที่แก้ไข ----
        const fullName = getTherapistName(); // ดึงชื่อเต็มออกมาจาก session (เช่น "อชิรญาณ์ ร่มไมตรีไทย")
        const firstName = fullName.split(' ')[0]; // ใช้ .split(' ') เพื่อแยกคำด้วยช่องว่าง และเอาคำแรก [0]

        // ส่งเฉพาะชื่อ (firstName) ไปเป็น therapistFilter
        loadPatientRecords(selectedDate, firstName, (records) => {
             recordsContainer.innerHTML = renderRecordsTable(records, getUserRole());
        });
        // ---- สิ้นสุดส่วนที่แก้ไข ----
    }

    const recordsContainer = document.getElementById("records-container");
    recordsContainer.innerHTML = `<div class="loading-spinner"><p>กำลังโหลดข้อมูล...</p></div>`;

    // ---- ส่วนที่แก้ไข ----
    const fullName = getTherapistName(); // ดึงชื่อเต็มออกมาจาก session (เช่น "อชิรญาณ์ ร่มไมตรีไทย")
    const firstName = fullName.split(" ")[0]; // ใช้ .split(' ') เพื่อแยกคำด้วยช่องว่าง และเอาคำแรก [0]

    // ส่งเฉพาะชื่อ (firstName) ไปเป็น therapistFilter
    loadPatientRecords(selectedDate, firstName, (records) => {
      recordsContainer.innerHTML = renderRecordsTable(records, getUserRole());
    });
    // ---- สิ้นสุดส่วนที่แก้ไข ----
  }
  // =======================================================

  function renderAdminMainMenu() {
    welcomeMessage.innerHTML = `ยินดีต้อนรับ, <strong>${getTherapistName()}</strong> <span class="admin-role-badge">ผู้ดูแลระบบ</span>`;
    appContent.innerHTML = `
            <h2 class="page-title"><i class="fa-solid fa-cogs"></i> เมนูผู้ดูแลระบบ</h2>
            <div class="main-menu-grid">
                <div class="menu-card" data-action="manage-all-queues">
                    <i class="fa-solid fa-users-gear"></i>
                    <h3>จัดการคิวพนักงานทั้งหมด</h3>
                    <p>ดูและจัดการตารางเวลาของพนักงานทุกคน</p>
                </div>
                <div class="menu-card menu-card-secondary" data-action="check-all-records"> <i class="fa-solid fa-book-medical"></i>
                    <h3>ดูประวัติการรักษาทั้งหมด</h3>
                    <p>ตรวจสอบข้อมูลการรักษาของผู้รับบริการทั้งหมด ตามวันและพนักงาน</p>
                </div>
            </div>
            <div class="btn-action-group">
                <button id="btn-logout" class="btn"><i class="fa-solid fa-sign-out-alt"></i> ออกจากระบบ</button>
            </div>`;

    appContent
      .querySelector(".main-menu-grid")
      .addEventListener("click", (e) => {
        const card = e.target.closest(".menu-card");
        if (!card) return;
        const action = card.dataset.action;
        if (action === "manage-all-queues") renderAdminQueuePage();
        else if (action === "check-all-records") renderAdminRecordsPage();
      });
    document
      .getElementById("btn-logout")
      .addEventListener("click", handleLogout);
  }

  async function renderAdminQueuePage() {
    showLoading("กำลังโหลดรายชื่อพนักงาน...");
    try {
      const therapists = await getAllTherapists();
      let options = therapists
        .map((t) => `<option value="${t}">${t}</option>`)
        .join("");

      appContent.innerHTML = `
                <div class="dashboard-section">
                    <div class="dashboard-header">
                        <h3 id="admin-queue-title"><i class="fa-solid fa-users-gear"></i> จัดการคิวพนักงานทั้งหมด</h3>
                        <div class="controls"><button class="btn btn-back"><i class="fa-solid fa-arrow-left"></i> กลับเมนู</button></div>
                    </div>
                    <div class="dashboard-header">
                        <div class="controls">
                            <label for="date-selector">เลือกวันที่:</label><input type="date" id="date-selector" value="${getTodayString()}">
                            <label for="therapist-selector">เลือกพนักงาน:</label><select id="therapist-selector">${options}</select>
                        </div>
                    </div>
                    <div id="admin-dashboard-content"></div>
                </div>`;

      const dateSelector = document.getElementById("date-selector");
      const therapistSelector = document.getElementById("therapist-selector");
      const loadDataForView = () =>
        loadDashboardForAdmin(therapistSelector.value, dateSelector.value);

      dateSelector.addEventListener("change", loadDataForView);
      therapistSelector.addEventListener("change", loadDataForView);
      document
        .querySelector(".btn-back")
        .addEventListener("click", renderAdminMainMenu);

      if (therapists.length > 0) {
        loadDataForView();
      } else {
        document.getElementById("admin-dashboard-content").innerHTML =
          "<p>ไม่พบข้อมูลพนักงานในระบบ</p>";
      }
    } catch (error) {
      handleError(error, "การโหลดรายชื่อพนักงาน");
    }
  }

  function loadDashboardForAdmin(therapistName, date) {
    const container = document.getElementById("admin-dashboard-content");
    document.getElementById("admin-queue-title").innerHTML =
      `<i class="fa-solid fa-users-gear"></i> จัดการคิวของ: ${therapistName} (${formatThaiDate(date)})`;
    container.innerHTML = `<div class="loading-spinner"><p>กำลังโหลดข้อมูลของ ${therapistName}...</p></div>`;

    loadDashboardData(therapistName, date, (data) => {
      const contentHtml = `
                <div id="management-container">${renderManagementGrid(data.scheduleSlots, therapistName)}</div>
                <hr style="margin: 2rem 0; border: 1px solid var(--border-color-light);">
                <h3><i class="fa-solid fa-list-check"></i> รายการนัดหมาย (${formatThaiDate(date)})</h3>
                ${renderAppointmentListTable(data.appointmentList)}`;
      container.innerHTML = contentHtml;
      attachSlotActionListeners("#management-container", date, () =>
        loadDashboardForAdmin(therapistName, date),
      );
    });
  }

  async function renderAdminRecordsPage() {
    showLoading("กำลังโหลดรายชื่อพนักงาน...");
    try {
      // ในหน้าของ Admin เราจะใช้ชื่อเต็มในการ filter จึงไม่ต้องแก้ getAllTherapists
      const therapists = await getAllTherapists();
      let options = therapists
        .map((t) => `<option value="${t}">${t}</option>`)
        .join("");
      const initialDate = getTodayString();

      appContent.innerHTML = `
                <div class="dashboard-section">
                    <div class="dashboard-header">
                        <h3 id="admin-records-title"><i class="fa-solid fa-book-medical"></i> ตรวจสอบประวัติการรักษา (${formatThaiDate(initialDate)})</h3>
                        <div class="controls"><button class="btn btn-back"><i class="fa-solid fa-arrow-left"></i> กลับเมนู</button></div>
                    </div>
                    <div class="dashboard-header">
                        <div class="controls">
                            <label for="date-selector-records">เลือกวันที่:</label><input type="date" id="date-selector-records" value="${initialDate}">
                            <label for="therapist-filter">เลือกพนักงาน:</label><select id="therapist-filter"><option value="ALL">-- ดูทั้งหมด --</option>${options}</select>
                        </div>
                    </div>
                    <div id="records-container"></div>
                </div>`;

      const dateSelector = document.getElementById("date-selector-records");
      const therapistFilter = document.getElementById("therapist-filter");
      const loadData = () => {
        document.getElementById("admin-records-title").innerHTML =
          `<i class="fa-solid fa-book-medical"></i> ตรวจสอบประวัติการรักษา (${formatThaiDate(dateSelector.value)})`;
        document.getElementById("records-container").innerHTML =
          `<div class="loading-spinner"><p>กำลังโหลดข้อมูล...</p></div>`;
        const selectedTherapistFullName = therapistFilter.value;
        let therapistNameToFilter = selectedTherapistFullName;

        // ถ้ามีการเลือกพนักงาน (ไม่ใช่ "ดูทั้งหมด") ให้ตัดเอาเฉพาะชื่อจริงไปใช้กรอง
        if (selectedTherapistFullName && selectedTherapistFullName !== "ALL") {
          therapistNameToFilter = selectedTherapistFullName.split(" ")[0];
        }
        loadPatientRecords(
          dateSelector.value,
          therapistFilter.value,
          (records) => {
            document.getElementById("records-container").innerHTML =
              renderRecordsTable(records, getUserRole());
          },
        );
      };
      dateSelector.addEventListener("change", loadData);
      therapistFilter.addEventListener("change", loadData);
      document
        .querySelector(".btn-back")
        .addEventListener("click", renderAdminMainMenu);
      loadData();
    } catch (error) {
      handleError(error, "การโหลดรายชื่อพนักงาน");
    }
  }

  // =====================================================================
  //      DATA & LOGIC FUNCTIONS (เชื่อมต่อ Supabase)
  // =====================================================================

  async function handleLogin(e) {
    e.preventDefault();
    Swal.fire({
      title: "กำลังตรวจสอบ...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const usernameInput = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    try {
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("email, full_name, role")
        .eq("username", usernameInput);

      if (profileError) {
        throw profileError;
      }

      if (!profiles || profiles.length === 0) {
        Swal.close();
        return Swal.fire("ล็อกอินล้มเหลว", "ไม่พบชื่อผู้ใช้นี้ในระบบ", "error");
      }

      const profile = profiles[0];

      const { data: loginData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: profile.email,
          password: password,
        });

      if (loginError) {
        Swal.close();
        return handleError(loginError, "การล็อกอิน");
      }

      if (loginData.user) {
        Swal.close();
        sessionStorage.setItem("therapistName", profile.full_name);
        sessionStorage.setItem("userRole", profile.role);
        initializeApp();
      }
    } catch (error) {
      Swal.close();
      handleError(error, "การล็อกอิน");
    }
  }

  async function handleLogout() {
    showLoading("กำลังออกจากระบบ...");
    const { error } = await supabase.auth.signOut();
    sessionStorage.clear();
    if (error) handleError(error, "การออกจากระบบ");
    renderLogin();
  }

  async function loadDashboardData(therapistName, date, callback) {
    try {
      const selectedDate = new Date(date + "T00:00:00");
      const dayOfWeek = selectedDate.getDay();

      const schedulePromise = supabase
        .from("schedules")
        .select("time_slots")
        .eq("therapist_name", therapistName)
        .eq("day_of_week", dayOfWeek)
        .single();
      const bookingsPromise = supabase
        .from("bookings")
        .select(
          "booking_time, patient_first_name, patient_last_name, patient_phone",
        )
        .eq("therapist_name", therapistName)
        .eq("booking_date", date);
      const blockagesPromise = supabase
        .from("blockages")
        .select("block_time, reason, created_by")
        .eq("therapist_name", therapistName)
        .eq("block_date", date);

      const [
        { data: scheduleData },
        { data: bookingsData },
        { data: blockagesData },
      ] = await Promise.all([
        schedulePromise,
        bookingsPromise,
        blockagesPromise,
      ]);

      if (!scheduleData || !scheduleData.time_slots) {
        return callback({
          therapistName,
          scheduleSlots: [],
          appointmentList: [],
        });
      }

      const availableSlots = scheduleData.time_slots.sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
      );
      const bookingsMap = new Map(
        bookingsData.map((b) => [b.booking_time.substring(0, 5), b]),
      );
      const blockagesMap = new Map(
        blockagesData.map((b) => [b.block_time.substring(0, 5), b]),
      );

      const scheduleSlots = availableSlots.map((time) => {
        const booking = bookingsMap.get(time);
        const blockage = blockagesMap.get(time);
        let status = "AVAILABLE",
          details = null,
          blockedBy = null;
        if (booking) {
          status = "BOOKED";
          details = `คุณ ${booking.patient_first_name} ${booking.patient_last_name} (${booking.patient_phone})`;
        } else if (blockage) {
          status = "BLOCKED";
          details = blockage.reason || "ปิดโดยแพทย์/ผู้ดูแลระบบ";
          blockedBy = blockage.created_by;
        }
        return { time, status, details, blockedBy };
      });

      const appointmentList = availableSlots.map((time) => {
        const slotInfo = scheduleSlots.find((s) => s.time === time);
        let description = "ว่าง";
        if (slotInfo) {
          if (slotInfo.status === "BOOKED") description = slotInfo.details;
          else if (slotInfo.status === "BLOCKED")
            description = `**ล็อคคิว** - ${slotInfo.details}`;
        }
        return { time, status: slotInfo?.status || "AVAILABLE", description };
      });

      callback({ therapistName, scheduleSlots, appointmentList });
    } catch (error) {
      handleError(error, "การโหลดข้อมูลคิว");
      callback({ therapistName, scheduleSlots: [], appointmentList: [] });
    }
  }

  async function loadPatientRecords(date, therapistFilter, callback) {
    try {
      let query = supabase
        .from("patient_visits")
        .select("*")
        .eq("visit_date", date);
      if (therapistFilter && therapistFilter !== "ALL") {
        query = query.eq("therapist", therapistFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      callback(data || []);
    } catch (error) {
      handleError(error, "การโหลดประวัติการรักษา");
      callback([]);
    }
  }

  async function getAllTherapists() {
    // 1. ดึงรายชื่อ therapist_name ทั้งหมดจากตาราง bookings
    const { data, error } = await supabase
      .from("bookings")
      .select("therapist_name");

    if (error) throw error;

    // 2. ใช้ Set เพื่อกรองให้เหลือแต่รายชื่อที่ไม่ซ้ำกัน
    const uniqueNames = [...new Set(data.map((item) => item.therapist_name))];

    // 3. เรียงลำดับตามตัวอักษร แล้วส่งค่ากลับไป
    return uniqueNames.sort((a, b) => a.localeCompare(b));
  }

  function attachSlotActionListeners(containerSelector, date, refreshCallback) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    container.addEventListener("click", (e) => {
      const button = e.target.closest(".btn-block, .btn-unblock");
      if (!button || button.disabled) return;
      const action = button.classList.contains("btn-block")
        ? "block"
        : "unblock";
      const { time, therapist } = button.dataset;
      handleSlotAction(action, time, date, therapist, refreshCallback);
    });
  }

  async function handleSlotAction(
    action,
    time,
    date,
    therapistName,
    refreshCallback,
  ) {
    const actionText = action === "block" ? "ล็อกคิว" : "ปลดล็อกคิว";
    const isManager = getUserRole() === "Manager";

    let swalConfig = {
      title: `ยืนยันการ${actionText}?`,
      html: `ชื่อพนักงาน: <strong>${therapistName}</strong><br>เวลา ${time} น. วันที่ ${formatThaiDate(date)}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      reverseButtons: true,
    };

    if (action === "block") {
      swalConfig.input = "text";
      swalConfig.inputPlaceholder = "ระบุเหตุผล (เช่น ประชุม, ลากิจ)";
      if (isManager) {
        swalConfig.inputValidator = (value) =>
          !value && "ผู้ดูแลระบบต้องระบุเหตุผลที่ล็อกคิว";
      }
    }

    const result = await Swal.fire(swalConfig);

    if (result.isConfirmed) {
      Swal.fire({
        title: "กำลังดำเนินการ...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        if (action === "block") {
          const { data: existingBooking, error: checkError } = await supabase
            .from("bookings")
            .select("booking_id")
            .eq("booking_date", date)
            .eq("booking_time", `${time}:00`)
            .eq("therapist_name", therapistName)
            .maybeSingle();

          if (checkError) throw checkError;
          if (existingBooking) {
            return Swal.fire(
              "เกิดข้อผิดพลาด",
              "ไม่สามารถบล็อกได้ เนื่องจากมีคนไข้จองคิวนี้แล้ว",
              "error",
            );
          }

          const { error } = await supabase.from("blockages").insert({
            block_date: date,
            block_time: `${time}:00`,
            therapist_name: therapistName,
            reason: result.value || "ปิดโดยเจ้าของคิว",
            created_by: getTherapistName(),
          });
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("blockages")
            .delete()
            .match({
              block_date: date,
              block_time: `${time}:00`,
              therapist_name: therapistName,
            });
          if (error) throw error;
        }

        Swal.fire("สำเร็จ!", `ดำเนินการ${actionText}เรียบร้อยแล้ว`, "success");
        refreshCallback();
      } catch (error) {
        handleError(error, `การ${actionText}`);
      }
    }
  }

  // =====================================================================
  //      INITIALIZER
  // =====================================================================
  async function initializeApp() {
    showLoading("กำลังตรวจสอบสิทธิ์...");
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      if (!getTherapistName() || !getUserRole()) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", session.user.id)
          .single();

        if (error || !profile) {
          await handleLogout();
          return handleError(
            error || new Error("ไม่พบข้อมูลโปรไฟล์"),
            "การยืนยันตัวตน",
          );
        }
        sessionStorage.setItem("therapistName", profile.full_name);
        sessionStorage.setItem("userRole", profile.role);
      }

      if (getUserRole() === "Manager") {
        renderAdminMainMenu();
      } else {
        renderTherapistMainMenu();
      }
    } else {
      renderLogin();
    }
  }

  initializeApp();
});
