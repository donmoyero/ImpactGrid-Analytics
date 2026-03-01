/* ================= GLOBAL STATE ================= */

let businessData = [];
let revenueChart = null;
let profitChart = null;
let expenseChart = null;
let forecastChart = null;
let comparisonChart = null;

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
    loadFromStorage();
    autoLogin();
});

/* ================= AUTH ================= */

function login() {
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();

    if (!user || !pass) {
        alert("Enter credentials");
        return;
    }

    localStorage.setItem("impactUser", user);
    showApp();
}

function autoLogin() {
    const user = localStorage.getItem("impactUser");
    if (user) showApp();
}

function logout() {
    localStorage.removeItem("impactUser");
    location.reload();
}

function showApp() {
    document.getElementById("authScreen").style.display = "none";
    document.getElementById("app").classList.remove("hidden");
}

/* ================= SIDEBAR ================= */

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("collapsed");
}

/* ================= SECTION NAV ================= */

function showSection(id, evt) {
    document.querySelectorAll(".page-section")
        .forEach(s => s.classList.remove("active-section"));

    const section = document.getElementById(id);
    if (section) section.classList.add("active-section");

    document.querySelectorAll(".sidebar li")
        .forEach(li => li.classList.remove("active"));

    if (evt && evt.target) evt.target.classList.add("active");
}

/* ================= DATA ================= */

function addData() {
    const month = document.getElementById("month").value;
    const revenue = parseFloat(document.getElementById("revenue").value);
    const expenses = parseFloat(document.getElementById("expenses").value);

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

/* ================= UPDATE ================= */

function updateAll() {
    if (businessData.length === 0) return;

    renderKPIs();
    renderCoreCharts();
    renderForecast();
    renderComparison();
}

/* ================= KPI ================= */

function renderKPIs() {
    const container = document.getElementById("kpiContainer");
    if (!container) return;

    const totalRevenue = sum("revenue");
    const totalProfit = sum("profit");

    container.innerHTML = `
        <div class="kpi">
            <h3>Total Revenue</h3>
            <p>${formatCurrency(totalRevenue)}</p>
        </div>
        <div class="kpi">
            <h3>Total Profit</h3>
            <p>${formatCurrency(totalProfit)}</p>
        </div>
    `;
}

/* ================= CORE CHARTS ================= */

function renderCoreCharts() {
    destroyCharts();

    const labels = businessData.map(d => d.month);

    revenueChart = new Chart(
        document.getElementById("revenueChart"),
        createLineConfig("Revenue", labels, map("revenue"), "#4CAF50")
    );

    profitChart = new Chart(
        document.getElementById("profitChart"),
        createLineConfig("Profit", labels, map("profit"), "#2196F3")
    );

    expenseChart = new Chart(
        document.getElementById("expenseChart"),
        {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    label: "Expenses",
                    data: map("expenses"),
                    backgroundColor: "#FF5252"
                }]
            },
            options: baseChartOptions()
        }
    );
}

/* ================= FORECAST ================= */

function renderForecast() {
    if (forecastChart) forecastChart.destroy();

    const values = map("revenue");
    if (values.length < 2) return;

    const labels = businessData.map(d => d.month);
    const predictions = simpleRegression(values, 3);

    forecastChart = new Chart(
        document.getElementById("forecastChart"),
        createLineConfig(
            "Revenue Forecast",
            [...labels, "F1", "F2", "F3"],
            [...values, ...predictions],
            "#3b82f6"
        )
    );
}

function simpleRegression(data, periods) {
    const n = data.length;
    const x = [...Array(n).keys()];
    const sumX = x.reduce((a,b)=>a+b);
    const sumY = data.reduce((a,b)=>a+b);
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

/* ================= MULTI METRIC ================= */

function renderComparison() {
    if (comparisonChart) comparisonChart.destroy();

    comparisonChart = new Chart(
        document.getElementById("comparisonChart"),
        {
            type: "line",
            data: {
                labels: businessData.map(d=>d.month),
                datasets: [
                    { label:"Revenue", data: map("revenue"), borderColor:"#4CAF50" },
                    { label:"Profit", data: map("profit"), borderColor:"#2196F3" },
                    { label:"Expenses", data: map("expenses"), borderColor:"#FF5252" }
                ]
            },
            options: baseChartOptions()
        }
    );
}

/* ================= CHART CONFIG HELPERS ================= */

function createLineConfig(label, labels, data, color) {
    return {
        type: "line",
        data: {
            labels,
            datasets: [{
                label,
                data,
                borderColor: color,
                backgroundColor: color + "22",
                fill: true,
                tension: 0.4
            }]
        },
        options: baseChartOptions()
    };
}

function baseChartOptions() {
    return {
        responsive: true,
        plugins: {
            legend: {
                labels: { color: "#ccc" }
            }
        },
        scales: {
            x: {
                ticks: { color: "#aaa" },
                grid: { color: "rgba(255,255,255,0.05)" }
            },
            y: {
                ticks: { color: "#aaa" },
                grid: { color: "rgba(255,255,255,0.05)" }
            }
        }
    };
}

/* ================= UTILITIES ================= */

function destroyCharts() {
    if (revenueChart) revenueChart.destroy();
    if (profitChart) profitChart.destroy();
    if (expenseChart) expenseChart.destroy();
}

function sum(key){ return businessData.reduce((a,b)=>a+b[key],0); }
function map(key){ return businessData.map(d=>d[key]); }

function formatCurrency(val){
    return "$"+Number(val).toLocaleString(undefined,{
        minimumFractionDigits:2,
        maximumFractionDigits:2
    });
}

/* ================= EXTRA (REQUIRED BY INDEX) ================= */

function toggleTheme() {
    document.body.classList.toggle("light-mode");
}

function exportData() {
    if (businessData.length === 0) return;

    const headers = Object.keys(businessData[0]).join(",");
    const rows = businessData.map(obj => Object.values(obj).join(",")).join("\n");

    const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "business_data.csv";
    link.click();
}
