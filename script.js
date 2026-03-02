/* ================= GLOBAL STATE ================= */

let businessData = [];
let revenueChart = null;
let profitChart = null;
let expenseChart = null;

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
    bindGlobalFunctions();
});

/* ================= SIMPLE LOGIN ================= */

function login() {
    const email = document.getElementById("username")?.value;
    const password = document.getElementById("password")?.value;

    if (!email || !password) {
        alert("Enter email and password");
        return;
    }

    showApp();
}

function logout() {
    location.reload();
}

/* ================= SHOW APP ================= */

function showApp() {
    document.getElementById("authScreen").style.display = "none";
    document.getElementById("app").classList.remove("hidden");
}

/* ================= DATA ================= */

function addData() {
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

/* ================= UPDATE ================= */

function updateAll() {
    if (!businessData.length) return;
    renderKPIs();
    renderCoreCharts();
}

/* ================= KPI ================= */

function renderKPIs() {
    const container = document.getElementById("kpiContainer");

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
    revenueChart?.destroy();
    profitChart?.destroy();
    expenseChart?.destroy();

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
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
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

/* ================= GLOBAL BIND ================= */

function bindGlobalFunctions() {
    window.login = login;
    window.logout = logout;
    window.addData = addData;
}
