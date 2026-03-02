/* ================= GLOBAL STATE ================= */

let businessData = [];
let revenueChart = null;
let profitChart = null;
let expenseChart = null;
let forecastChart = null;
let comparisonChart = null;

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
    bindGlobalFunctions();
});

/* ================= LOGIN ================= */

function login() {
    const email = document.getElementById("username")?.value.trim();
    const password = document.getElementById("password")?.value.trim();

    if (!email || !password) {
        alert("Enter email and password.");
        return;
    }

    showApp();
}

function logout() {
    location.reload();
}

function showApp() {
    document.getElementById("authScreen").style.display = "none";
    document.getElementById("app").classList.remove("hidden");
}

/* ================= ADD DATA ================= */

function addData() {

    const monthValue = document.getElementById("month")?.value;
    const revenue = parseFloat(document.getElementById("revenue")?.value);
    const expenses = parseFloat(document.getElementById("expenses")?.value);

    if (!monthValue || isNaN(revenue) || isNaN(expenses)) {
        alert("Please enter valid data.");
        return;
    }

    const date = new Date(monthValue + "-01");
    const profit = revenue - expenses;

    // Prevent duplicate months
    const exists = businessData.find(d =>
        d.date.toISOString().slice(0,7) === date.toISOString().slice(0,7)
    );

    if (exists) {
        alert("Data for this month already exists.");
        return;
    }

    businessData.push({ date, revenue, expenses, profit });
    businessData.sort((a,b)=>a.date-b.date);

    updateAll();
}

/* ================= UPDATE ALL ================= */

function updateAll() {
    if (!businessData.length) return;

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

    const margin = totalRevenue > 0
        ? ((totalProfit / totalRevenue) * 100).toFixed(2)
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

    if (businessData.length === 0) return;

    revenueChart?.destroy();
    profitChart?.destroy();
    expenseChart?.destroy();

    const labels = businessData.map(d =>
        d.date.toISOString().slice(0,7)
    );

    revenueChart = createChart(
        "revenueChart",
        "line",
        labels,
        businessData.map(d=>d.revenue),
        "#22c55e",
        "Revenue"
    );

    profitChart = createChart(
        "profitChart",
        "line",
        labels,
        businessData.map(d=>d.profit),
        "#3b82f6",
        "Profit"
    );

    expenseChart = createChart(
        "expenseChart",
        "bar",
        labels,
        businessData.map(d=>d.expenses),
        "#ef4444",
        "Expenses"
    );
}

/* ================= FORECAST ================= */

function renderForecast() {

    if (businessData.length < 3) return;

    forecastChart?.destroy();

    const first = businessData[0];
    const last = businessData[businessData.length - 1];

    const monthsDiff =
        (last.date.getFullYear() - first.date.getFullYear()) * 12 +
        (last.date.getMonth() - first.date.getMonth());

    if (monthsDiff <= 0 || first.revenue <= 0) return;

    const cagr = Math.pow(last.revenue / first.revenue, 1 / monthsDiff) - 1;

    let projections = [];
    let labels = [];
    let currentRevenue = last.revenue;
    let currentDate = new Date(last.date);

    for (let i = 1; i <= 6; i++) {
        currentRevenue *= (1 + cagr);
        currentDate.setMonth(currentDate.getMonth() + 1);

        projections.push(Math.round(currentRevenue));
        labels.push(currentDate.toISOString().slice(0,7));
    }

    forecastChart = new Chart(
        document.getElementById("forecastChart")?.getContext("2d"),
        {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: "Projected Revenue (CAGR)",
                    data: projections,
                    borderColor: "#f59e0b",
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        }
    );
}

/* ================= PERFORMANCE MATRIX ================= */

function renderComparison() {

    if (businessData.length < 2) return;

    comparisonChart?.destroy();

    const volatility = calculateVolatility();
    const growth = calculateMonthlyGrowth();
    const margin = getMargin();

    comparisonChart = new Chart(
        document.getElementById("comparisonChart")?.getContext("2d"),
        {
            type: "bar",
            data: {
                labels: ["Stability", "Growth Strength", "Profitability"],
                datasets: [{
                    label: "Performance Index (0-100)",
                    data: [
                        100 - volatility,
                        Math.min(growth * 5, 100),
                        Math.min(margin * 3, 100)
                    ],
                    backgroundColor: ["#22c55e","#f59e0b","#8b5cf6"]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: 100 }
                }
            }
        }
    );
}

/* ================= ANALYTICS HELPERS ================= */

function calculateMonthlyGrowth() {
    let growthRates = [];

    for (let i=1; i<businessData.length; i++) {
        const prev = businessData[i-1].revenue;
        const current = businessData[i].revenue;
        if (prev > 0) growthRates.push((current-prev)/prev);
    }

    if (!growthRates.length) return 0;
    return (growthRates.reduce((a,b)=>a+b,0)/growthRates.length)*100;
}

function calculateVolatility() {
    const revenues = businessData.map(d=>d.revenue);
    const mean = revenues.reduce((a,b)=>a+b,0)/revenues.length;

    if (mean === 0) return 0;

    const variance =
        revenues.reduce((a,b)=>a+Math.pow(b-mean,2),0)/revenues.length;

    return (Math.sqrt(variance)/mean)*100;
}

function getMargin() {
    const totalRevenue = sum("revenue");
    const totalProfit = sum("profit");
    return totalRevenue > 0
        ? (totalProfit/totalRevenue)*100
        : 0;
}

/* ================= CHART FACTORY ================= */

function createChart(id,type,labels,data,color,label){

    const canvas = document.getElementById(id);
    if (!canvas) return null;

    return new Chart(canvas.getContext("2d"),{
        type,
        data:{
            labels,
            datasets:[{
                label,
                data,
                borderColor:color,
                backgroundColor:type==="bar"?color:"transparent",
                tension:0.4
            }]
        },
        options:{
            responsive:true,
            maintainAspectRatio:false,
            scales:{ y:{ beginAtZero:true } }
        }
    });
}

/* ================= UTIL ================= */

function sum(key){
    return businessData.reduce((a,b)=>a+(b[key]||0),0);
}

function formatCurrency(val){
    return "£"+Number(val).toLocaleString(undefined,{
        minimumFractionDigits:2,
        maximumFractionDigits:2
    });
}

/* ================= GLOBAL BIND ================= */

function bindGlobalFunctions(){
    window.login=login;
    window.logout=logout;
    window.addData=addData;
}
