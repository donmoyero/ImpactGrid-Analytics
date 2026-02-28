/* ================= GLOBAL STATE ================= */

let businessData = [];
let revenueChart, profitChart, expenseChart;
let forecastChart, comparisonChart;

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
    loadFromStorage();
    autoLogin();
});

/* ================= AUTH ================= */

function login() {
    const user = username.value;
    const pass = password.value;

    if (user && pass) {
        localStorage.setItem("impactUser", user);
        showApp();
    } else {
        alert("Enter credentials");
    }
}

function autoLogin() {
    if (localStorage.getItem("impactUser")) showApp();
}

function logout() {
    localStorage.removeItem("impactUser");
    location.reload();
}

function showApp() {
    authScreen.style.display = "none";
    app.classList.remove("hidden");
}

/* ================= SIDEBAR ================= */

function toggleSidebar() {
    sidebar.classList.toggle("collapsed");
}

function showSection(id, evt) {
    document.querySelectorAll(".page-section")
        .forEach(s => s.classList.remove("active-section"));

    document.getElementById(id).classList.add("active-section");

    document.querySelectorAll(".sidebar li")
        .forEach(li => li.classList.remove("active"));

    if (evt) evt.target.classList.add("active");
}

/* ================= DATA ================= */

function addData() {
    const month = monthInput.value;
    const revenue = parseFloat(revenueInput.value);
    const expenses = parseFloat(expensesInput.value);

    if (!month || isNaN(revenue) || isNaN(expenses)) {
        alert("Fill required fields.");
        return;
    }

    const profit = revenue - expenses;

    businessData.push({ month, revenue, expenses, profit });
    businessData.sort((a,b)=> new Date(a.month)-new Date(b.month));

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

/* ================= KPI (UPGRADED) ================= */

function renderKPIs() {
    const container = document.getElementById("kpiContainer");
    container.innerHTML = "";

    const latest = businessData.at(-1);
    const previous = businessData.at(-2);

    const profitMargin = (latest.profit / latest.revenue) * 100;

    let growth = 0;
    let arrow = "→";

    if (previous) {
        growth = ((latest.revenue - previous.revenue) / previous.revenue) * 100;
        arrow = growth > 0 ? "↑" : growth < 0 ? "↓" : "→";
    }

    container.innerHTML = `
        <div class="kpi">
            <h3>Revenue</h3>
            <p>${formatCurrency(latest.revenue)} ${arrow}</p>
            <span>${growth.toFixed(2)}% MoM</span>
        </div>
        <div class="kpi">
            <h3>Profit Margin</h3>
            <p>${profitMargin.toFixed(2)}%</p>
        </div>
        <div class="kpi">
            <h3>Total Profit</h3>
            <p>${formatCurrency(sum("profit"))}</p>
        </div>
    `;
}

/* ================= CORE CHARTS (MA + ANOMALY) ================= */

function renderCoreCharts() {
    destroyCharts();

    const labels = map("month");
    const revenues = map("revenue");
    const movingAvg = movingAverage(revenues, 3);
    const anomalies = detectAnomalies(revenues);

    revenueChart = new Chart(revenueChartCanvas(), {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Revenue",
                    data: revenues,
                    borderColor: "#4CAF50",
                    tension: 0.4,
                    pointBackgroundColor: revenues.map((_,i)=>
                        anomalies[i] ? "red" : "#4CAF50")
                },
                {
                    label: "3M Moving Avg",
                    data: movingAvg,
                    borderColor: "#3b82f6",
                    borderDash: [5,5],
                    tension: 0.4
                }
            ]
        }
    });

    profitChart = new Chart(profitChartCanvas(), {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Profit",
                data: map("profit"),
                borderColor: "#2196F3",
                tension: 0.4
            }]
        }
    });

    expenseChart = new Chart(expenseChartCanvas(), {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Expenses",
                data: map("expenses"),
                backgroundColor: "#FF5252"
            }]
        }
    });
}

/* ================= FORECAST (REAL REGRESSION + CI + R²) ================= */

function renderForecast() {
    if (forecastChart) forecastChart.destroy();

    const labels = map("month");
    const values = map("revenue");

    if (values.length < 3) return;

    const {forecast, upper, lower, r2} = regressionWithCI(values, 6);

    forecastChart = new Chart(forecastChartCanvas(), {
        type: "line",
        data: {
            labels: [...labels, ...forecast.labels],
            datasets: [
                {
                    label: "Revenue",
                    data: [...values, ...Array(6).fill(null)],
                    borderColor: "#4CAF50"
                },
                {
                    label: "Forecast",
                    data: [...Array(values.length).fill(null), ...forecast.data],
                    borderColor: "#3b82f6"
                },
                {
                    label: "Upper 95%",
                    data: [...Array(values.length).fill(null), ...upper],
                    borderDash:[5,5],
                    borderColor:"#aaa"
                },
                {
                    label: "Lower 95%",
                    data: [...Array(values.length).fill(null), ...lower],
                    borderDash:[5,5],
                    borderColor:"#aaa"
                }
            ]
        }
    });

    console.log("R²:", r2.toFixed(3));
}

/* ================= MULTI METRIC ================= */

function renderComparison() {
    if (comparisonChart) comparisonChart.destroy();

    comparisonChart = new Chart(comparisonChartCanvas(), {
        type: "line",
        data: {
            labels: map("month"),
            datasets: [
                { label:"Revenue", data:map("revenue"), borderColor:"#4CAF50" },
                { label:"Profit", data:map("profit"), borderColor:"#2196F3" },
                { label:"Expenses", data:map("expenses"), borderColor:"#FF5252" }
            ]
        }
    });
}

/* ================= INTELLIGENCE HELPERS ================= */

function movingAverage(data, period){
    return data.map((_,i,arr)=>{
        if(i<period-1) return null;
        const slice = arr.slice(i-period+1,i+1);
        return slice.reduce((a,b)=>a+b)/period;
    });
}

function detectAnomalies(data){
    const mean = data.reduce((a,b)=>a+b)/data.length;
    const std = Math.sqrt(data.reduce((a,b)=>a+(b-mean)**2,0)/data.length);
    return data.map(v => Math.abs((v-mean)/std) > 2);
}

function regressionWithCI(data, periods){
    const n = data.length;
    const x = [...Array(n).keys()];

    const sumX = x.reduce((a,b)=>a+b);
    const sumY = data.reduce((a,b)=>a+b);
    const sumXY = x.reduce((s,xi,i)=>s+xi*data[i],0);
    const sumXX = x.reduce((s,xi)=>s+xi*xi,0);

    const slope = (n*sumXY - sumX*sumY)/(n*sumXX - sumX*sumX);
    const intercept = (sumY - slope*sumX)/n;

    const predictions = x.map(i=>slope*i+intercept);

    const meanY = sumY/n;
    const ssTot = data.reduce((a,v)=>a+(v-meanY)**2,0);
    const ssRes = data.reduce((a,v,i)=>a+(v-predictions[i])**2,0);
    const r2 = 1 - ssRes/ssTot;

    const variance = ssRes/(n-2);
    const stdError = Math.sqrt(variance);

    const forecastData=[], upper=[], lower=[], labels=[];

    for(let i=1;i<=periods;i++){
        const xVal=n+i-1;
        const y=slope*xVal+intercept;
        const margin=1.96*stdError;

        forecastData.push(y);
        upper.push(y+margin);
        lower.push(y-margin);
        labels.push("F"+i);
    }

    return {
        forecast:{data:forecastData,labels},
        upper,
        lower,
        r2
    };
}

/* ================= HELPERS ================= */

function destroyCharts() {
    if (revenueChart) revenueChart.destroy();
    if (profitChart) profitChart.destroy();
    if (expenseChart) expenseChart.destroy();
}

function revenueChartCanvas(){ return document.getElementById("revenueChart"); }
function profitChartCanvas(){ return document.getElementById("profitChart"); }
function expenseChartCanvas(){ return document.getElementById("expenseChart"); }
function forecastChartCanvas(){ return document.getElementById("forecastChart"); }

function sum(key){ return businessData.reduce((a,b)=>a+b[key],0); }
function map(key){ return businessData.map(d=>d[key]); }

function formatCurrency(val){
    return "$"+Number(val).toLocaleString(undefined,{
        minimumFractionDigits:2,
        maximumFractionDigits:2
    });
}
