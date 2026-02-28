let businessData = [];

let revenueChart, profitChart, expenseChart;
let forecastChart, comparisonChart;

/* ========================= INIT ========================= */

document.addEventListener("DOMContentLoaded", () => {
    loadFromStorage();
    if (businessData.length > 0) updateDashboard();
});

/* ========================= DATA HANDLING ========================= */

function addData() {
    const month = document.getElementById("month").value;
    const revenue = parseFloat(document.getElementById("revenue").value);
    const expenses = parseFloat(document.getElementById("expenses").value);
    const customers = parseFloat(document.getElementById("customers").value) || 0;
    const marketing = parseFloat(document.getElementById("marketing").value) || 0;

    if (!month || isNaN(revenue) || isNaN(expenses)) {
        alert("Please fill required fields correctly.");
        return;
    }

    const profit = revenue - expenses;
    const profitMargin = revenue !== 0 ? (profit / revenue) * 100 : 0;
    const customerAcquisitionCost = customers !== 0 ? marketing / customers : 0;

    businessData.push({
        month,
        revenue,
        expenses,
        customers,
        marketing,
        profit,
        profitMargin,
        customerAcquisitionCost
    });

    saveToStorage();
    updateDashboard();
}

/* ========================= DASHBOARD UPDATE ========================= */

function updateDashboard() {
    if (businessData.length === 0) return;

    generateKPIs();
    generateInsights();
    renderCoreCharts();
    renderForecastChart();
    renderComparisonChart();
}

/* ========================= LOCAL STORAGE ========================= */

function saveToStorage() {
    localStorage.setItem("impactGridData", JSON.stringify(businessData));
}

function loadFromStorage() {
    const saved = localStorage.getItem("impactGridData");
    if (saved) {
        businessData = JSON.parse(saved);
    }
}

function clearAllData() {
    if (!confirm("Are you sure you want to reset all data?")) return;

    businessData = [];
    localStorage.removeItem("impactGridData");
    location.reload();
}

/* ========================= KPI ========================= */

function generateKPIs() {
    const container = document.getElementById("kpiContainer");
    container.innerHTML = "";

    const kpis = [
        { label: "Total Revenue", value: formatCurrency(sum("revenue")) },
        { label: "Total Profit", value: formatCurrency(sum("profit")) },
        { label: "Avg Margin", value: average("profitMargin").toFixed(1) + "%" },
        { label: "Avg CAC", value: formatCurrency(average("customerAcquisitionCost")) }
    ];

    kpis.forEach(kpi => {
        const div = document.createElement("div");
        div.className = "kpi";
        div.innerHTML = `<h3>${kpi.label}</h3><p>${kpi.value}</p>`;
        container.appendChild(div);
    });
}

/* ========================= INSIGHTS ========================= */

function generateInsights() {
    const insightsDiv = document.getElementById("insights");
    const latest = businessData[businessData.length - 1];

    let healthScore = 0;
    if (latest.profitMargin > 20) healthScore += 40;
    if (growthRate("revenue") > 5) healthScore += 30;
    if (latest.customerAcquisitionCost < 50) healthScore += 30;

    insightsDiv.innerHTML = `
        <div class="insight-box">
            <p><strong>Latest:</strong> ${latest.month}</p>
            <p><strong>Growth:</strong> ${growthRate("revenue").toFixed(1)}%</p>
            <p><strong>Health Score:</strong> ${healthScore}/100</p>
        </div>
    `;
}

/* ========================= CORE CHARTS ========================= */

function renderCoreCharts() {
    const months = businessData.map(d => d.month);
    const revenues = businessData.map(d => d.revenue);
    const profits = businessData.map(d => d.profit);
    const expenses = businessData.map(d => d.expenses);

    destroyCharts();

    revenueChart = new Chart(
        document.getElementById("revenueChart"),
        createLineConfig("Revenue", months, revenues, "#4CAF50")
    );

    profitChart = new Chart(
        document.getElementById("profitChart"),
        createLineConfig("Profit", months, profits, "#2196F3")
    );

    expenseChart = new Chart(
        document.getElementById("expenseChart"),
        createBarConfig("Expenses", months, expenses, "#FF5252")
    );
}

/* ========================= FORECAST (LINEAR REGRESSION) ========================= */

function renderForecastChart() {
    if (forecastChart) forecastChart.destroy();

    const months = businessData.map(d => d.month);
    const revenues = businessData.map(d => d.revenue);

    const forecast = linearRegressionForecast(revenues, 3);

    const extendedMonths = [...months, ...forecast.futureLabels];
    const extendedRevenue = [...revenues, ...forecast.predictions];

    forecastChart = new Chart(
        document.getElementById("forecastChart"),
        {
            type: "line",
            data: {
                labels: extendedMonths,
                datasets: [
                    {
                        label: "Revenue",
                        data: extendedRevenue,
                        borderColor: "#3b82f6",
                        tension: 0.4
                    }
                ]
            },
            options: commonOptions()
        }
    );
}

function linearRegressionForecast(data, periods) {
    const n = data.length;
    const x = [...Array(n).keys()];
    const y = data;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const predictions = [];
    const futureLabels = [];

    for (let i = 1; i <= periods; i++) {
        const nextIndex = n + i - 1;
        predictions.push(slope * nextIndex + intercept);
        futureLabels.push("Forecast " + i);
    }

    return { predictions, futureLabels };
}

/* ========================= MULTI METRIC ========================= */

function renderComparisonChart() {
    if (comparisonChart) comparisonChart.destroy();

    const months = businessData.map(d => d.month);

    comparisonChart = new Chart(
        document.getElementById("comparisonChart"),
        {
            type: "line",
            data: {
                labels: months,
                datasets: [
                    {
                        label: "Revenue",
                        data: businessData.map(d => d.revenue),
                        borderColor: "#4CAF50"
                    },
                    {
                        label: "Profit",
                        data: businessData.map(d => d.profit),
                        borderColor: "#2196F3"
                    },
                    {
                        label: "Expenses",
                        data: businessData.map(d => d.expenses),
                        borderColor: "#FF5252"
                    }
                ]
            },
            options: commonOptions()
        }
    );
}

/* ========================= NAVIGATION ========================= */

function showSection(id) {
    document.querySelectorAll(".page-section").forEach(sec => {
        sec.classList.remove("active-section");
    });

    document.getElementById(id).classList.add("active-section");

    document.querySelectorAll(".sidebar li").forEach(li => {
        li.classList.remove("active");
    });

    event.target.classList.add("active");
}

/* ========================= CHART CONFIG ========================= */

function createLineConfig(label, labels, data, color) {
    return {
        type: "line",
        data: {
            labels,
            datasets: [{
                label,
                data,
                borderColor: color,
                backgroundColor: color + "33",
                fill: true,
                tension: 0.4
            }]
        },
        options: commonOptions()
    };
}

function createBarConfig(label, labels, data, color) {
    return {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label,
                data,
                backgroundColor: color
            }]
        },
        options: commonOptions()
    };
}

function commonOptions() {
    return {
        responsive: true,
        plugins: {
            legend: { labels: { color: "#ccc" } },
            tooltip: {
                callbacks: {
                    label: context => formatCurrency(context.raw)
                }
            }
        },
        scales: {
            x: { ticks: { color: "#aaa" } },
            y: { ticks: { color: "#aaa" } }
        }
    };
}

function destroyCharts() {
    if (revenueChart) revenueChart.destroy();
    if (profitChart) profitChart.destroy();
    if (expenseChart) expenseChart.destroy();
}

/* ========================= UTILITIES ========================= */

function sum(key) {
    return businessData.reduce((acc, curr) => acc + curr[key], 0);
}

function average(key) {
    return businessData.length ? sum(key) / businessData.length : 0;
}

function growthRate(key) {
    if (businessData.length < 2) return 0;
    const last = businessData[businessData.length - 1][key];
    const prev = businessData[businessData.length - 2][key];
    return ((last - prev) / prev) * 100;
}

function formatCurrency(value) {
    return "$" + Number(value).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function exportData() {
    if (businessData.length === 0) return;

    const headers = Object.keys(businessData[0]).join(",");
    const rows = businessData.map(obj => Object.values(obj).join(",")).join("\n");

    const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "impactgrid_data.csv";
    link.click();
}

function toggleTheme() {
    document.body.classList.toggle("light-mode");
}
