/* ================= GLOBAL STATE ================= */

let businessData = [];
let revenueChart, profitChart, expenseChart;
let forecastChart, comparisonChart, realtimeChart;
let simulationInterval = null;

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
    initDragAndDrop();
    loadFromStorage();
    autoLogin();
});

/* ================= AUTH ================= */

function login() {
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;

    if (user && pass) {
        localStorage.setItem("impactUser", user);
        showApp();
    } else {
        alert("Enter credentials");
    }
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

function showSection(id) {
    document.querySelectorAll(".page-section").forEach(s => s.classList.remove("active-section"));
    document.getElementById(id).classList.add("active-section");

    document.querySelectorAll(".sidebar li").forEach(li => li.classList.remove("active"));
    event.target.classList.add("active");
}

/* ================= DATA ================= */

function addData() {
    const month = document.getElementById("month").value;
    const revenue = parseFloat(document.getElementById("revenue").value);
    const expenses = parseFloat(document.getElementById("expenses").value);
    const customers = parseFloat(document.getElementById("customers").value) || 0;
    const marketing = parseFloat(document.getElementById("marketing").value) || 0;

    if (!month || isNaN(revenue) || isNaN(expenses)) {
        alert("Fill required fields.");
        return;
    }

    const profit = revenue - expenses;

    businessData.push({ month, revenue, expenses, customers, marketing, profit });

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

    renderCoreCharts();
    renderForecast();
    renderComparison();
    renderKPIs();
}

/* ================= KPI WITH ANIMATION ================= */

function renderKPIs() {
    const container = document.getElementById("kpiContainer");
    container.innerHTML = "";

    const totalRevenue = sum("revenue");
    const totalProfit = sum("profit");

    createAnimatedKPI(container, "Total Revenue", totalRevenue);
    createAnimatedKPI(container, "Total Profit", totalProfit);
}

function createAnimatedKPI(container, label, value) {
    const div = document.createElement("div");
    div.className = "kpi";

    div.innerHTML = `<h3>${label}</h3><p>0</p>`;
    container.appendChild(div);

    animateValue(div.querySelector("p"), value);
}

function animateValue(element, target) {
    let current = 0;
    const increment = target / 60;

    const interval = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(interval);
        }
        element.textContent = formatCurrency(current);
    }, 16);
}

/* ================= CORE CHARTS ================= */

function renderCoreCharts() {
    destroyCharts();

    const labels = businessData.map(d => d.month);

    revenueChart = createChart("revenueChart", "Revenue", labels, map("revenue"), "#4CAF50");
    profitChart = createChart("profitChart", "Profit", labels, map("profit"), "#2196F3");
    expenseChart = createBarChart("expenseChart", "Expenses", labels, map("expenses"), "#FF5252");
}

/* ================= FORECAST WITH CONFIDENCE ================= */

function renderForecast() {
    if (forecastChart) forecastChart.destroy();

    const labels = businessData.map(d => d.month);
    const values = map("revenue");

    const { predictions, upper, lower } = forecastWithConfidence(values, 3);

    forecastChart = new Chart(document.getElementById("forecastChart"), {
        type: "line",
        data: {
            labels: [...labels, "F1", "F2", "F3"],
            datasets: [
                { label: "Revenue", data: [...values, ...predictions], borderColor: "#3b82f6" },
                { label: "Upper Band", data: [...values, ...upper], borderColor: "rgba(0,255,0,0.3)" },
                { label: "Lower Band", data: [...values, ...lower], borderColor: "rgba(255,0,0,0.3)" }
            ]
        },
        options: zoomOptions()
    });
}

function forecastWithConfidence(data, periods) {
    const avg = data.reduce((a,b)=>a+b)/data.length;
    const predictions = [];
    const upper = [];
    const lower = [];

    for (let i=0;i<periods;i++) {
        const forecast = avg * (1 + 0.02*i);
        predictions.push(forecast);
        upper.push(forecast * 1.1);
        lower.push(forecast * 0.9);
    }

    return { predictions, upper, lower };
}

/* ================= MULTI METRIC ================= */

function renderComparison() {
    if (comparisonChart) comparisonChart.destroy();

    comparisonChart = new Chart(document.getElementById("comparisonChart"), {
        type: "line",
        data: {
            labels: businessData.map(d=>d.month),
            datasets: [
                { label:"Revenue", data: map("revenue"), borderColor:"#4CAF50" },
                { label:"Profit", data: map("profit"), borderColor:"#2196F3" },
                { label:"Expenses", data: map("expenses"), borderColor:"#FF5252" }
            ]
        },
        options: zoomOptions()
    });
}

/* ================= REALTIME ================= */

function startSimulation() {
    if (simulationInterval) return;

    realtimeChart = new Chart(document.getElementById("realtimeChart"), {
        type: "line",
        data: { labels: [], datasets: [{ label:"Live Revenue", data: [] }] },
        options: zoomOptions()
    });

    simulationInterval = setInterval(() => {
        const newValue = Math.random() * 10000;
        realtimeChart.data.labels.push(new Date().toLocaleTimeString());
        realtimeChart.data.datasets[0].data.push(newValue);
        realtimeChart.update();
    }, 1000);
}

function stopSimulation() {
    clearInterval(simulationInterval);
    simulationInterval = null;
}

/* ================= PDF REPORT ================= */

function generateExecutivePDF() {
    window.print();
}

/* ================= API ================= */

function connectAPI() {
    document.getElementById("apiStatus").textContent = "Connected";
}

/* ================= DRAG & DROP ================= */

function initDragAndDrop() {
    document.querySelectorAll(".draggable-container").forEach(container => {
        new Sortable(container, { animation: 150 });
    });
}

/* ================= HELPERS ================= */

function createChart(id,label,labels,data,color){
    return new Chart(document.getElementById(id),{
        type:"line",
        data:{labels,datasets:[{label,data,borderColor:color,tension:0.4}]},
        options:zoomOptions()
    });
}

function createBarChart(id,label,labels,data,color){
    return new Chart(document.getElementById(id),{
        type:"bar",
        data:{labels,datasets:[{label,data,backgroundColor:color}]},
        options:zoomOptions()
    });
}

function zoomOptions(){
    return {
        responsive:true,
        plugins:{
            zoom:{
                zoom:{wheel:{enabled:true},pinch:{enabled:true},mode:'x'},
                pan:{enabled:true,mode:'x'}
            }
        }
    };
}

function sum(key){ return businessData.reduce((a,b)=>a+b[key],0); }
function map(key){ return businessData.map(d=>d[key]); }
function formatCurrency(val){
    return "$"+Number(val).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
}
