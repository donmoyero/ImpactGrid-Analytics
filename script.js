/* ================= SUPABASE SETUP ================= */

// 🔁 Replace with your real anon public key
const SUPABASE_URL = "https://bikpmjstyikjyrtsdtew.supabase.co";
const SUPABASE_ANON_KEY = "your_real_publishable_key_here";

const supabase = window.supabase.createClient(https://bikpmjstyikjyrtsdtew.supabase.co, sb_publishable_DWHc6BmV1pR8envWo8ql3g_Qc5dhKhH);

/* ================= GLOBAL STATE ================= */

let businessData = [];
let revenueChart = null;
let profitChart = null;
let expenseChart = null;
let forecastChart = null;
let comparisonChart = null;

let userPlan = "free";
let currentUser = null;


/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", async () => {

    loadTheme();
    bindHeaderButtons();

    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        currentUser = session.user;
        await loadUserProfile();
        showApp();
    }
});


/* ================= AUTH ================= */

async function login() {

    const email = document.getElementById("username")?.value?.trim();
    const password = document.getElementById("password")?.value?.trim();

    if (!email || !password) {
        alert("Enter email and password");
        return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        alert(error.message);
        return;
    }

    currentUser = data.user;

    await loadUserProfile();
    showApp();
}

async function logout() {
    await supabase.auth.signOut();
    location.reload();
}


/* ================= PROFILE ================= */

async function loadUserProfile() {

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

    if (error) {
        console.error(error);
        return;
    }

    userPlan = data.plan || "free";
    updatePlanUI();
}


/* ================= SHOW APP ================= */

function showApp() {
    const auth = document.getElementById("authScreen");
    const app = document.getElementById("app");

    if (auth) auth.style.display = "none";
    if (app) app.classList.remove("hidden");
}


/* ================= PLAN UI ================= */

function updatePlanUI() {

    const pricingCards = document.querySelectorAll(".pricing-card");
    pricingCards.forEach(card => card.classList.remove("current-plan"));

    if (userPlan === "free") pricingCards[0]?.classList.add("current-plan");
    if (userPlan === "growth") pricingCards[1]?.classList.add("current-plan");
    if (userPlan === "premium") pricingCards[2]?.classList.add("current-plan");

    const badge = document.getElementById("planBadge");
    if (badge) badge.textContent = userPlan.toUpperCase();
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

    if ((id === "forecast" || id === "comparison") && userPlan === "free") {
        alert("Upgrade required to access this feature.");
        activateSection("pricing");
        return;
    }

    activateSection(id, evt);
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


/* ================= DATA (Still Local For Now) ================= */

function addData() {

    if (userPlan === "free" && businessData.length >= 3) {
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

    updateAll();
}


/* ================= MASTER UPDATE ================= */

function updateAll() {
    if (!businessData.length) return;
    renderKPIs();
    renderCoreCharts();
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
