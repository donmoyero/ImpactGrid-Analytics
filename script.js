/* ================= GLOBAL STATE ================= */

let businessData = [];

let revenueChart = null;
let profitChart = null;
let expenseChart = null;

let forecastCharts = {};
let performanceBarChart = null;
let distributionPieChart = null;

/* ================= SAFE INIT ================= */

document.addEventListener("DOMContentLoaded", function () {
    bindGlobalFunctions();
});

/* ================= ADD DATA ================= */

function addData() {

    const monthInput = document.getElementById("month");
    const revenueInput = document.getElementById("revenue");
    const expensesInput = document.getElementById("expenses");

    if (!monthInput || !revenueInput || !expensesInput) return;

    const monthValue = monthInput.value;
    const revenue = parseFloat(revenueInput.value);
    const expenses = parseFloat(expensesInput.value);

    if (!monthValue || isNaN(revenue) || isNaN(expenses)) {
        alert("Enter valid financial data.");
        return;
    }

    const date = new Date(monthValue + "-01");
    const profit = revenue - expenses;

    const exists = businessData.find(d =>
        d.date.toISOString().slice(0, 7) === date.toISOString().slice(0, 7)
    );

    if (exists) {
        alert("Data for this month already exists.");
        return;
    }

    businessData.push({ date, revenue, expenses, profit });
    businessData.sort((a, b) => a.date - b.date);

    updateAll();
}

/* ================= MASTER UPDATE ================= */

function updateAll() {
    if (!businessData.length) return;

    renderExecutiveSummary();
    renderLifecycle();
    renderInsights();
    renderCoreCharts();
    renderForecasts();
    renderPerformanceMatrix();
    renderRiskAssessment();
}

/* ================= SAFE CHART CREATION ================= */

function createChart(id, type, labels, data, color, label) {

    if (typeof Chart === "undefined") {
        console.error("Chart.js not loaded.");
        return null;
    }

    const canvas = document.getElementById(id);
    if (!canvas) return null;

    return new Chart(canvas.getContext("2d"), {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: color,
                backgroundColor: type === "bar" ? color : "transparent",
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

/* ================= CORE CHARTS ================= */

function renderCoreCharts() {

    if (!businessData.length) return;

    revenueChart?.destroy();
    profitChart?.destroy();
    expenseChart?.destroy();

    const labels = businessData.map(d => d.date.toISOString().slice(0, 7));

    revenueChart = createChart(
        "revenueChart",
        "line",
        labels,
        businessData.map(d => d.revenue),
        "#22c55e",
        "Revenue"
    );

    profitChart = createChart(
        "profitChart",
        "line",
        labels,
        businessData.map(d => d.profit),
        "#3b82f6",
        "Profit"
    );

    expenseChart = createChart(
        "expenseChart",
        "bar",
        labels,
        businessData.map(d => d.expenses),
        "#ef4444",
        "Expenses"
    );
}

/* ================= FORECASTS ================= */

function renderForecasts() {

    if (businessData.length < 3) return;

    const first = businessData[0];
    const last = businessData[businessData.length - 1];

    const monthsDiff =
        (last.date.getFullYear() - first.date.getFullYear()) * 12 +
        (last.date.getMonth() - first.date.getMonth());

    if (monthsDiff <= 0 || first.revenue <= 0) return;

    const cagr = Math.pow(last.revenue / first.revenue, 1 / monthsDiff) - 1;

    generateProjection("forecast6m", 6, cagr);
    generateProjection("forecast1y", 12, cagr);
    generateProjection("forecast3y", 36, cagr);
    generateProjection("forecast5y", 60, cagr);
}

function generateProjection(id, months, cagr) {

    forecastCharts[id]?.destroy();

    const canvas = document.getElementById(id);
    if (!canvas) return;

    const last = businessData[businessData.length - 1];
    let revenue = last.revenue;
    let date = new Date(last.date);

    const labels = [];
    const data = [];

    for (let i = 1; i <= months; i++) {
        revenue *= (1 + cagr);
        date.setMonth(date.getMonth() + 1);
        labels.push(date.toISOString().slice(0, 7));
        data.push(Math.round(revenue));
    }

    forecastCharts[id] = new Chart(canvas.getContext("2d"), {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Projected Revenue",
                data,
                borderColor: "#f59e0b",
                tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

/* ================= PERFORMANCE ================= */

function renderPerformanceMatrix() {

    const volatility = calculateVolatility();
    const growth = calculateMonthlyGrowth();
    const margin = getMargin();

    const stabilityScore = Math.max(0, 100 - volatility);
    const growthScore = Math.min(Math.abs(growth) * 5, 100);
    const profitabilityScore = Math.min(margin * 3, 100);

    const composite = ((stabilityScore + growthScore + profitabilityScore) / 3).toFixed(0);

    performanceBarChart?.destroy();

    const barCanvas = document.getElementById("performanceBarChart");
    if (barCanvas) {
        performanceBarChart = new Chart(barCanvas.getContext("2d"), {
            type: "bar",
            data: {
                labels: ["Stability", "Growth Strength", "Profitability"],
                datasets: [{
                    data: [stabilityScore, growthScore, profitabilityScore],
                    backgroundColor: ["#22c55e", "#f59e0b", "#8b5cf6"]
                }]
            },
            options: {
                scales: { y: { beginAtZero: true, max: 100 } }
            }
        });
    }

    const totalExpenses = sum("expenses");
    const totalProfit = sum("profit");

    distributionPieChart?.destroy();

    const pieCanvas = document.getElementById("distributionPieChart");
    if (pieCanvas) {
        distributionPieChart = new Chart(pieCanvas.getContext("2d"), {
            type: "pie",
            data: {
                labels: ["Expenses", "Net Profit"],
                datasets: [{
                    data: [totalExpenses, totalProfit],
                    backgroundColor: ["#ef4444", "#22c55e"]
                }]
            }
        });
    }

    const health = document.getElementById("businessHealthIndex");
    if (health) health.innerHTML = `Composite Business Health Index: ${composite} / 100`;

    const interp = document.getElementById("matrixInterpretation");
    if (interp) interp.innerHTML =
        "Composite score reflects aggregated performance across stability, growth strength and profitability resilience.";
}

/* ================= RISK ================= */

function renderRiskAssessment() {

    const volatility = calculateVolatility();
    const margin = getMargin();

    const stability = document.getElementById("stabilityRisk");
    const marginEl = document.getElementById("marginRisk");
    const liquidity = document.getElementById("liquidityRisk");

    if (stability) stability.innerHTML = volatility > 35 ? "Elevated" : "Low";
    if (marginEl) marginEl.innerHTML = margin < 4 ? "Elevated" : margin < 8 ? "Moderate" : "Low";
    if (liquidity) liquidity.innerHTML = margin > 5 ? "Stable" : "Constrained";
}

/* ================= HELPERS ================= */

function calculateMonthlyGrowth() {
    let rates = [];
    for (let i = 1; i < businessData.length; i++) {
        const prev = businessData[i - 1].revenue;
        const curr = businessData[i].revenue;
        if (prev > 0) rates.push((curr - prev) / prev);
    }
    if (!rates.length) return 0;
    return (rates.reduce((a, b) => a + b, 0) / rates.length) * 100;
}

function calculateVolatility() {
    const revenues = businessData.map(d => d.revenue);
    const mean = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    if (mean === 0) return 0;
    const variance = revenues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / revenues.length;
    return (Math.sqrt(variance) / mean) * 100;
}

function getMargin() {
    const totalRevenue = sum("revenue");
    const totalProfit = sum("profit");
    return totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
}

function sum(key) {
    return businessData.reduce((a, b) => a + (b[key] || 0), 0);
}

/* ================= NAVIGATION ================= */

function showSection(sectionId, event) {
    document.querySelectorAll(".page-section").forEach(sec =>
        sec.classList.remove("active-section")
    );
    document.getElementById(sectionId)?.classList.add("active-section");

    document.querySelectorAll(".sidebar li").forEach(li =>
        li.classList.remove("active")
    );

    if (event) event.target.classList.add("active");
}

function logout() {
    location.reload();
}

/* ================= GLOBAL BIND ================= */

function bindGlobalFunctions() {
    window.addData = addData;
    window.showSection = showSection;
    window.logout = logout;
}
