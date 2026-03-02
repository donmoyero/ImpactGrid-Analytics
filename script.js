/* ================= GLOBAL STATE ================= */

let businessData = [];
let revenueChart = null;
let profitChart = null;
let expenseChart = null;

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
    bindGlobalFunctions();
});

/* ================= SIMPLE LOGIN (FRONTEND MODE) ================= */

function login() {
    const emailInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");

    if (!emailInput || !passwordInput) {
        console.error("Login inputs not found in HTML.");
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    showApp();
}

function logout() {
    location.reload();
}

/* ================= SHOW APP ================= */

function showApp() {
    const authScreen = document.getElementById("authScreen");
    const app = document.getElementById("app");

    if (!authScreen || !app) {
        console.error("App containers not found.");
        return;
    }

    authScreen.style.display = "none";
    app.classList.remove("hidden");
}

/* ================= ADD BUSINESS DATA ================= */

function addData() {
    const monthInput = document.getElementById("month");
    const revenueInput = document.getElementById("revenue");
    const expensesInput = document.getElementById("expenses");

    if (!monthInput || !revenueInput || !expensesInput) {
        console.error("Data input fields missing.");
        return;
    }

    const month = monthInput.value;
    const revenue = parseFloat(revenueInput.value);
    const expenses = parseFloat(expensesInput.value);

    if (!month || isNaN(revenue) || isNaN(expenses)) {
        alert("Please complete all required fields correctly.");
        return;
    }

    const profit = revenue - expenses;

    businessData.push({ month, revenue, expenses, profit });

    clearInputs();
    updateAll();
}

/* ================= CLEAR INPUTS ================= */

function clearInputs() {
    document.getElementById("month").value = "";
    document.getElementById("revenue").value = "";
    document.getElementById("expenses").value = "";
}

/* ================= UPDATE DASHBOARD ================= */

function updateAll() {
    if (!businessData.length) return;

    renderKPIs();
    renderCoreCharts();
}

/* ================= KPI RENDER ================= */

function renderKPIs() {
    const container = document.getElementById("kpiContainer");
    if (!container) return;

    const totalRevenue = sum("revenue");
    const totalProfit = sum("profit");
    const margin = totalRevenue
        ? ((totalProfit / totalRevenue) * 100).toFixed(1)
        : "0.0";

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

/* ================= CORE CHARTS ================= */

function renderCoreCharts() {

    if (typeof Chart === "undefined") {
        console.error("Chart.js is not loaded.");
        return;
    }

    revenueChart?.destroy();
    profitChart?.destroy();
    expenseChart?.destroy();

    const labels = businessData.map(d => d.month);

    revenueChart = createChart(
        "revenueChart",
        "line",
        labels,
        map("revenue"),
        "#4CAF50",
        "Revenue"
    );

    profitChart = createChart(
        "profitChart",
        "line",
        labels,
        map("profit"),
        "#2196F3",
        "Profit"
    );

    expenseChart = createChart(
        "expenseChart",
        "bar",
        labels,
        map("expenses"),
        "#FF5252",
        "Expenses"
    );
}

/* ================= CHART FACTORY ================= */

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
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

/* ================= HELPERS ================= */

function sum(key) {
    return businessData.reduce((acc, item) => acc + (item[key] || 0), 0);
}

function map(key) {
    return businessData.map(d => d[key] || 0);
}

function formatCurrency(val) {
    return "£" + Number(val).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/* ================= GLOBAL BIND ================= */

function bindGlobalFunctions() {
    window.login = login;
    window.logout = logout;
    window.addData = addData;
}
