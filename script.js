/* =========================================================
   SUPABASE CONFIG
========================================================= */

// 🔐 INSERT YOUR REAL PUBLISHABLE KEY
const SUPABASE_URL = "https://bikpmjstyikjyrtsdtew.supabase.co";
const SUPABASE_ANON_KEY = "PASTE_YOUR_REAL_PUBLISHABLE_KEY_HERE";

if (!window.supabase) {
    console.error("Supabase library not loaded. Make sure CDN is added before this script.");
}

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


/* =========================================================
   GLOBAL STATE
========================================================= */

let businessData = [];
let revenueChart = null;
let profitChart = null;
let expenseChart = null;

let userPlan = "free";
let currentUser = null;


/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
    console.log("App Initialising...");

    await restoreSession();

    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth event:", event);

        if (session?.user) {
            currentUser = session.user;
            await loadUserProfile();
            showApp();
        } else {
            currentUser = null;
            showAuth();
        }
    });
});


/* =========================================================
   SESSION RESTORE
========================================================= */

async function restoreSession() {
    try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            console.error("Session restore failed:", error.message);
            return;
        }

        if (data?.session?.user) {
            currentUser = data.session.user;
            await loadUserProfile();
            showApp();
        }

    } catch (err) {
        console.error("Session restore error:", err);
    }
}


/* =========================================================
   AUTH
========================================================= */

async function login() {

    const email = document.getElementById("username")?.value?.trim();
    const password = document.getElementById("password")?.value?.trim();

    if (!email || !password) {
        alert("Please enter email and password.");
        return;
    }

    try {
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

    } catch (err) {
        console.error("Login failed:", err);
        alert("Login failed. Check console.");
    }
}

async function logout() {
    await supabase.auth.signOut();
    location.reload();
}


/* =========================================================
   PROFILE LOADING
========================================================= */

async function loadUserProfile() {

    if (!currentUser) return;

    try {
        const { data, error } = await supabase
            .from("profiles")
            .select("plan")
            .eq("id", currentUser.id)
            .maybeSingle();

        if (error) {
            console.error("Profile error:", error.message);
            userPlan = "free";
        } else {
            userPlan = data?.plan || "free";
        }

        updatePlanUI();

    } catch (err) {
        console.error("Profile load failed:", err);
    }
}


/* =========================================================
   UI CONTROL
========================================================= */

function showApp() {
    document.getElementById("authScreen")?.style.setProperty("display", "none");
    document.getElementById("app")?.classList.remove("hidden");
}

function showAuth() {
    document.getElementById("authScreen")?.style.setProperty("display", "flex");
    document.getElementById("app")?.classList.add("hidden");
}


/* =========================================================
   PLAN UI
========================================================= */

function updatePlanUI() {

    const cards = document.querySelectorAll(".pricing-card");
    cards.forEach(card => card.classList.remove("current-plan"));

    if (userPlan === "free") cards[0]?.classList.add("current-plan");
    if (userPlan === "growth") cards[1]?.classList.add("current-plan");
    if (userPlan === "premium") cards[2]?.classList.add("current-plan");

    const badge = document.getElementById("planBadge");
    if (badge) badge.textContent = userPlan.toUpperCase();
}


/* =========================================================
   DATA ENTRY
========================================================= */

function addData() {

    if (userPlan === "free" && businessData.length >= 3) {
        alert("Free plan supports only 3 months of data.");
        return;
    }

    const month = document.getElementById("month")?.value;
    const revenue = parseFloat(document.getElementById("revenue")?.value);
    const expenses = parseFloat(document.getElementById("expenses")?.value);

    if (!month || isNaN(revenue) || isNaN(expenses)) {
        alert("Please fill all required fields.");
        return;
    }

    const profit = revenue - expenses;

    businessData.push({ month, revenue, expenses, profit });

    updateAll();
}


/* =========================================================
   MASTER UPDATE
========================================================= */

function updateAll() {
    if (!businessData.length) return;
    renderKPIs();
    renderCharts();
}


/* =========================================================
   KPI RENDER
========================================================= */

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


/* =========================================================
   CHARTS
========================================================= */

function renderCharts() {

    if (typeof Chart === "undefined") {
        console.error("Chart.js not loaded.");
        return;
    }

    revenueChart?.destroy();
    profitChart?.destroy();
    expenseChart?.destroy();

    const labels = businessData.map(d => d.month);

    revenueChart = buildChart("revenueChart", "line", labels, map("revenue"), "#4CAF50", "Revenue");
    profitChart = buildChart("profitChart", "line", labels, map("profit"), "#2196F3", "Profit");
    expenseChart = buildChart("expenseChart", "bar", labels, map("expenses"), "#FF5252", "Expenses");
}

function buildChart(id, type, labels, data, color, label) {

    const canvas = document.getElementById(id);
    if (!canvas) return null;

    return new Chart(canvas, {
        type,
        data: {
            labels,
            datasets: [{
                label,
                data,
                borderColor: color,
                backgroundColor: type === "bar" ? color : "transparent",
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}


/* =========================================================
   HELPERS
========================================================= */

function sum(key) {
    return businessData.reduce((acc, cur) => acc + cur[key], 0);
}

function map(key) {
    return businessData.map(d => d[key]);
}

function formatCurrency(val) {
    return "£" + Number(val).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


/* =========================================================
   GLOBAL EXPORT
========================================================= */

window.login = login;
window.logout = logout;
window.addData = addData;
