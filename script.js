/* ================= GLOBAL STATE ================= */

let businessData = [];
let revenueChart = null;
let profitChart = null;
let expenseChart = null;
let forecastChart = null;
let comparisonChart = null;

let userPlan = localStorage.getItem("impactPlan") || "free";

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {

    try {
        loadFromStorage();
        autoLogin();
        loadTheme();
    } catch (err) {
        console.error("Initialization error:", err);
    }

});

/* ================= MOBILE SIDEBAR ================= */

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;
    sidebar.classList.toggle("active");
}

/* ================= PLAN SYSTEM ================= */

function setPlan(plan) {
    userPlan = plan;
    localStorage.setItem("impactPlan", plan);
    alert("Plan updated to: " + plan.toUpperCase());
}

/* ================= AUTH ================= */

function login() {
    const user = document.getElementById("username")?.value;
    const pass = document.getElementById("password")?.value;

    if (user && pass) {
        localStorage.setItem("impactUser", user);
        showApp();
    } else {
        alert("Enter credentials");
    }
}

function autoLogin() {
    if (localStorage.getItem("impactUser")) {
        showApp();
    }
}

function logout() {
    localStorage.removeItem("impactUser");
    location.reload();
}

function showApp() {
    document.getElementById("authScreen")?.remove();
    document.getElementById("app")?.classList.remove("hidden");
}

/* ================= THEME ================= */

function toggleTheme() {
    document.body.classList.toggle("light-mode");
    localStorage.setItem(
        "impactTheme",
        document.body.classList.contains("light-mode") ? "light" : "dark"
    );
}

function loadTheme() {
    if (localStorage.getItem("impactTheme") === "light") {
        document.body.classList.add("light-mode");
    }
}

/* ================= SECTION NAV ================= */

function showSection(id, evt) {

    if ((id === "forecast" || id === "comparison") && userPlan === "free") {
        alert("Upgrade to Growth or Premium to access this feature.");
        return;
    }

    document.querySelectorAll(".page-section")
        .forEach(s => s.classList.remove("active-section"));

    document.getElementById(id)?.classList.add("active-section");

    document.querySelectorAll(".sidebar li")
        .forEach(li => li.classList.remove("active"));

    if (evt) evt.target.classList.add("active");

    document.getElementById("sidebar")?.classList.remove("active");

    if (id === "forecast") renderForecast();
    if (id === "comparison") renderComparison();
}

/* ================= DATA ================= */

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
    localStorage.removeItem("impactGridData");
    location.reload();
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

/* ================= CORE CHARTS ================= */

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
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });
}

/* ================= FORECAST ================= */

function renderForecast() {

    if (!businessData.length) return;
    if (forecastChart) forecastChart.destroy();

    const values = map("revenue");
    if (values.length < 2) return;

    const predictions = simpleRegression(values, 3);

    forecastChart = createChart(
        "forecastChart",
        "line",
        [...businessData.map(d => d.month), "F1", "F2", "F3"],
        [...values, ...predictions],
        "#3b82f6",
        "Revenue Forecast"
    );
}

/* ================= MULTI METRIC ================= */

function renderComparison() {

    if (!businessData.length) return;
    if (comparisonChart) comparisonChart.destroy();

    const canvas = document.getElementById("comparisonChart");
    if (!canvas) return;

    comparisonChart = new Chart(canvas.getContext("2d"), {
        type: "line",
        data: {
            labels: businessData.map(d => d.month),
            datasets: [
                dataset("Revenue","revenue","#4CAF50"),
                dataset("Profit","profit","#2196F3"),
                dataset("Expenses","expenses","#FF5252")
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function dataset(label,key,color){
    return {
        label,
        data: map(key),
        borderColor: color,
        fill:false,
        tension:0.4
    };
}

/* ================= SMART REPORT ================= */

function generateReport() {

    const reportBox = document.getElementById("performanceReport");
    if (!reportBox) return;

    const totalRevenue = sum("revenue");
    const totalProfit = sum("profit");

    if (!totalRevenue) return;

    const latest = businessData[businessData.length - 1];

    let health = "Stable";
    if (totalProfit <= 0) health = "Critical";
    else if (totalProfit < totalRevenue * 0.15) health = "Warning";
    else if (totalProfit > totalRevenue * 0.25) health = "Strong";

    reportBox.innerHTML = `
        <p><strong>Business Health:</strong> ${health}</p>
        <p>Total Revenue: ${formatCurrency(totalRevenue)}</p>
        <p>Total Profit: ${formatCurrency(totalProfit)}</p>
        <p>Profit Margin: ${((totalProfit/totalRevenue)*100).toFixed(1)}%</p>
        <p>Latest Month Revenue: ${formatCurrency(latest.revenue)}</p>
    `;
}

/* ================= HELPERS ================= */

function destroyCharts(){
    revenueChart?.destroy();
    profitChart?.destroy();
    expenseChart?.destroy();
}

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

function simpleRegression(data, periods){

    const n = data.length;
    const x = [...Array(n).keys()];
    const sumX = x.reduce((a,b)=>a+b,0);
    const sumY = data.reduce((a,b)=>a+b,0);
    const sumXY = x.reduce((s,xi,i)=>s+xi*data[i],0);
    const sumXX = x.reduce((s,xi)=>s+xi*xi,0);

    const slope = (n*sumXY - sumX*sumY) / (n*sumXX - sumX*sumX);
    const intercept = (sumY - slope*sumX)/n;

    const result = [];
    for(let i=1;i<=periods;i++){
        result.push(slope*(n+i-1)+intercept);
    }

    return result;
}
