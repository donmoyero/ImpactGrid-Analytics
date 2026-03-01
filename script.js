/* ================= GLOBAL STATE ================= */

let businessData = [];
let revenueChart = null;
let profitChart = null;
let expenseChart = null;
let forecastChart = null;
let comparisonChart = null;

let userPlan = localStorage.getItem("impactPlan") || "free";
let isAdmin = false;

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {

    checkStripeReturn();
    loadFromStorage();
    autoLogin();
    loadTheme();
    updatePlanUI();
    bindHeaderButtons();
});

/* ================= SHOW APP (CRITICAL FIX) ================= */

function showApp() {
    document.getElementById("authScreen")?.remove();
    document.getElementById("app")?.classList.remove("hidden");
}

/* ================= HEADER BUTTON BINDING ================= */

function bindHeaderButtons() {

    const themeBtn = document.getElementById("themeBtn");
    const pdfBtn = document.getElementById("pdfBtn");

    themeBtn?.addEventListener("click", toggleTheme);
    pdfBtn?.addEventListener("click", exportExecutivePDF);
}

/* ================= ADMIN LOGIN ================= */

function login() {

    const user = document.getElementById("username")?.value?.trim();
    const pass = document.getElementById("password")?.value?.trim();

    if (!user || !pass) {
        alert("Enter credentials");
        return;
    }

    // ===== ADMIN ACCESS =====
    if (user === "Impactgrid" && pass === "199419981304") {

        isAdmin = true;
        userPlan = "premium";

        localStorage.setItem("impactPlan", "premium");
        localStorage.setItem("impactUser", "admin");

        showApp();
        updatePlanUI();

        alert("ADMIN MODE ACTIVATED");
        return;
    }

    // ===== NORMAL USER =====
    isAdmin = false;
    localStorage.setItem("impactUser", user);

    showApp();
    updatePlanUI();
}

function autoLogin() {

    const savedUser = localStorage.getItem("impactUser");
    if (!savedUser) return;

    if (savedUser === "admin") {
        isAdmin = true;
        userPlan = "premium";
        localStorage.setItem("impactPlan", "premium");
    }

    showApp();
    updatePlanUI();
}

function logout() {
    localStorage.removeItem("impactUser");
    location.reload();
}

/* ================= STRIPE SUCCESS HANDLER ================= */

function checkStripeReturn() {

    const params = new URLSearchParams(window.location.search);
    const plan = params.get("plan");

    if (plan === "growth" || plan === "premium") {

        userPlan = plan;
        localStorage.setItem("impactPlan", plan);

        alert("Subscription activated: " + plan.toUpperCase());

        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

/* ================= PLAN SYSTEM ================= */

function setPlan(plan) {

    userPlan = plan;
    localStorage.setItem("impactPlan", plan);

    updatePlanUI();
    alert("Your plan is now: " + plan.toUpperCase());
}

function updatePlanUI() {

    const pricingCards = document.querySelectorAll(".pricing-card");
    pricingCards.forEach(card => card.classList.remove("current-plan"));

    if (userPlan === "free") pricingCards[0]?.classList.add("current-plan");
    if (userPlan === "growth") pricingCards[1]?.classList.add("current-plan");
    if (userPlan === "premium") pricingCards[2]?.classList.add("current-plan");
}

/* ================= SIDEBAR ================= */

function toggleSidebar() {
    document.getElementById("sidebar")?.classList.toggle("active");
    document.getElementById("sidebarOverlay")?.classList.toggle("active");
}

function closeSidebar() {
    document.getElementById("sidebar")?.classList.remove("active");
    document.getElementById("sidebarOverlay")?.classList.remove("active");
}

/* ================= SECTION NAV ================= */

function showSection(id, evt) {

    if (!isAdmin && (id === "forecast" || id === "comparison") && userPlan === "free") {
        alert("Upgrade required to access this feature.");
        activateSection("pricing");
        return;
    }

    activateSection(id, evt);

    if (id === "forecast") renderForecast();
    if (id === "comparison") renderComparison();
}

function activateSection(id, evt) {

    document.querySelectorAll(".page-section")
        .forEach(s => s.classList.remove("active-section"));

    document.getElementById(id)?.classList.add("active-section");

    document.querySelectorAll(".sidebar li")
        .forEach(li => li.classList.remove("active"));

    if (evt?.target) evt.target.classList.add("active");

    closeSidebar();
}

/* ================= DATA ================= */

function addData() {

    if (!isAdmin && userPlan === "free" && businessData.length >= 3) {
        alert("Free plan supports only 3 months of data.");
        return;
    }

    const month = document.getElementById("month")?.value;
    const revenue = parseFloat(document.getElementById("revenue")?.value);
    const expenses = parseFloat(document.getElementById("expenses")?.value);

    if (!month || isNaN(revenue) || isNaN(expenses)) {
        alert("Fill required fields.");
        return;
    }

    const profit = revenue - expenses;

    businessData.push({ month, revenue, expenses, profit });

    saveToStorage();
    updateAll();
}

/* ================= STORAGE ================= */

function saveToStorage() {
    localStorage.setItem("impactGridData", JSON.stringify(businessData));
}

function loadFromStorage() {
    const saved = localStorage.getItem("impactGridData");
    if (saved) {
        businessData = JSON.parse(saved);
        updateAll();
    }
}

function clearAllData() {
    if (confirm("Reset all data?")) {
        localStorage.removeItem("impactGridData");
        location.reload();
    }
}

/* ================= MASTER UPDATE ================= */

function updateAll() {
    if (!businessData.length) return;
    renderKPIs();
    renderCoreCharts();
    generateReport();
}

/* ================= KPI ================= */

function renderKPIs() {

    const container = document.getElementById("kpiContainer");
    if (!container) return;

    const totalRevenue = sum("revenue");
    const totalProfit = sum("profit");
    const margin = totalRevenue
        ? ((totalProfit / totalRevenue) * 100).toFixed(1)
        : 0;

    container.innerHTML = `
        <div class="kpi">
            <h3>Total Revenue</h3>
            <p>${formatCurrency(totalRevenue)}</p>
        </div>
        <div class="kpi">
            <h3>Total Profit</h3>
            <p>${formatCurrency(totalProfit)}</p>
        </div>
        <div class="kpi">
            <h3>Profit Margin</h3>
            <p>${margin}%</p>
        </div>
    `;
}

/* ================= CHARTS ================= */

function renderCoreCharts() {

    if (typeof Chart === "undefined") return;

    destroyCharts();

    const labels = businessData.map(d => d.month);

    revenueChart = createChart("revenueChart", "line", labels, map("revenue"), "#4CAF50", "Revenue");
    profitChart = createChart("profitChart", "line", labels, map("profit"), "#2196F3", "Profit");
    expenseChart = createChart("expenseChart", "bar", labels, map("expenses"), "#FF5252", "Expenses");
}

function createChart(id, type, labels, data, color, label) {

    const canvas = document.getElementById(id);
    if (!canvas) return null;

    return new Chart(canvas.getContext("2d"), {
        type,
        data: {
            labels,
            datasets: [{
                label,
                data,
                borderColor: color,
                backgroundColor: type === "bar" ? color : "transparent",
                fill: false,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function destroyCharts(){
    revenueChart?.destroy();
    profitChart?.destroy();
    expenseChart?.destroy();
}

/* ================= HELPERS ================= */

function sum(key){
    return businessData.reduce((a,b)=>a+b[key],0);
}

function map(key){
    return businessData.map(d=>d[key]);
}

function formatCurrency(val){
    return "£"+Number(val).toLocaleString(undefined,{
        minimumFractionDigits:2,
        maximumFractionDigits:2
    });
}
