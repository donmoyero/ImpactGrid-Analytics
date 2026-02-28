let businessData = [];

let revenueChart, profitChart, expenseChart;

// ===================== ADD DATA =====================
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

    updateDashboard();
}

// ===================== UPDATE DASHBOARD =====================
function updateDashboard() {
    if (businessData.length === 0) return;

    generateKPIs();
    generateInsights();
    renderCharts();
}

// ===================== KPI GENERATION =====================
function generateKPIs() {
    const container = document.getElementById("kpiContainer");
    container.innerHTML = "";

    const totalRevenue = sum("revenue");
    const totalProfit = sum("profit");
    const avgMargin = average("profitMargin");
    const avgCAC = average("customerAcquisitionCost");

    const kpis = [
        { label: "Total Revenue", value: formatCurrency(totalRevenue) },
        { label: "Total Profit", value: formatCurrency(totalProfit) },
        { label: "Avg Profit Margin", value: avgMargin.toFixed(1) + "%" },
        { label: "Avg Customer Acquisition Cost", value: formatCurrency(avgCAC) }
    ];

    kpis.forEach(kpi => {
        const div = document.createElement("div");
        div.className = "kpi";
        div.innerHTML = `
            <h3>${kpi.label}</h3>
            <p>${kpi.value}</p>
        `;
        container.appendChild(div);
    });
}

// ===================== INSIGHTS =====================
function generateInsights() {
    const insightsDiv = document.getElementById("insights");
    insightsDiv.innerHTML = "";

    if (businessData.length === 0) return;

    const latest = businessData[businessData.length - 1];
    let healthScore = 0;

    if (latest.profitMargin > 20) healthScore += 40;
    if (latest.customerAcquisitionCost < latest.revenue / (latest.customers || 1) * 0.5) healthScore += 30;
    if (growthRate("revenue") > 5) healthScore += 30;

    const status =
        healthScore > 70 ? "Business performance is strong." :
        healthScore > 40 ? "Business is stable but needs optimization." :
        "Business requires strategic improvement.";

    insightsDiv.innerHTML = `
        <div class="insight-box">
            <p><strong>Latest Month:</strong> ${latest.month}</p>
            <p><strong>Revenue Growth:</strong> ${growthRate("revenue").toFixed(1)}%</p>
            <p><strong>Health Score:</strong> ${healthScore}/100</p>
            <p>${status}</p>
        </div>
    `;
}

// ===================== CHART RENDERING =====================
function renderCharts() {
    const months = businessData.map(d => d.month);
    const revenues = businessData.map(d => d.revenue);
    const profits = businessData.map(d => d.profit);
    const expenses = businessData.map(d => d.expenses);

    destroyCharts();

    const ctx1 = document.getElementById("revenueChart").getContext("2d");
    const ctx2 = document.getElementById("profitChart").getContext("2d");
    const ctx3 = document.getElementById("expenseChart").getContext("2d");

    revenueChart = new Chart(ctx1, createLineChartConfig("Revenue", months, revenues, "#4CAF50"));
    profitChart = new Chart(ctx2, createLineChartConfig("Profit", months, profits, "#2196F3"));
    expenseChart = new Chart(ctx3, createBarChartConfig("Expenses", months, expenses, "#FF5252"));
}

// ===================== CHART CONFIGS =====================
function createLineChartConfig(label, labels, data, color) {
    return {
        type: "line",
        data: {
            labels,
            datasets: [{
                label,
                data,
                borderColor: color,
                backgroundColor: color + "33",
                tension: 0.4,
                fill: true,
                pointRadius: 4
            }]
        },
        options: commonChartOptions()
    };
}

function createBarChartConfig(label, labels, data, color) {
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
        options: commonChartOptions()
    };
}

function commonChartOptions() {
    return {
        responsive: true,
        animation: {
            duration: 900,
            easing: "easeOutQuart"
        },
        plugins: {
            legend: {
                labels: { color: "#ccc" }
            },
            tooltip: {
                callbacks: {
                    label: context => formatCurrency(context.raw)
                }
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

function destroyCharts() {
    if (revenueChart) revenueChart.destroy();
    if (profitChart) profitChart.destroy();
    if (expenseChart) expenseChart.destroy();
}

// ===================== UTILITIES =====================
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
    return "$" + value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ===================== EXPORT CSV =====================
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

// ===================== THEME TOGGLE =====================
function toggleTheme() {
    document.body.classList.toggle("light-mode");
}
