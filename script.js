let businessData = [];

let revenueChart, profitChart, expenseChart;

function addData() {
    const month = document.getElementById("month").value;
    const revenue = parseFloat(document.getElementById("revenue").value);
    const expenses = parseFloat(document.getElementById("expenses").value);
    const customers = parseFloat(document.getElementById("customers").value);
    const marketing = parseFloat(document.getElementById("marketing").value);

    if (!month || !revenue || !expenses) {
        alert("Please fill required fields.");
        return;
    }

    const profit = revenue - expenses;
    const profitMargin = (profit / revenue) * 100;
    const customerAcquisitionCost = marketing / customers;

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

function updateDashboard() {
    generateKPIs();
    generateInsights();
    renderCharts();
}

function generateKPIs() {
    const container = document.getElementById("kpiContainer");
    container.innerHTML = "";

    const totalRevenue = sum("revenue");
    const totalProfit = sum("profit");
    const avgMargin = average("profitMargin");
    const avgCAC = average("customerAcquisitionCost");

    const kpis = [
        { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}` },
        { label: "Total Profit", value: `$${totalProfit.toFixed(2)}` },
        { label: "Avg Profit Margin", value: `${avgMargin.toFixed(1)}%` },
        { label: "Avg Customer Acquisition Cost", value: `$${avgCAC.toFixed(2)}` }
    ];

    kpis.forEach(kpi => {
        const div = document.createElement("div");
        div.className = "kpi";
        div.innerHTML = `<h3>${kpi.label}</h3><p>${kpi.value}</p>`;
        container.appendChild(div);
    });
}

function generateInsights() {
    const insightsDiv = document.getElementById("insights");
    insightsDiv.innerHTML = "";

    const latest = businessData[businessData.length - 1];

    let healthScore = 0;

    if (latest.profitMargin > 20) healthScore += 40;
    if (latest.customerAcquisitionCost < latest.revenue / latest.customers * 0.5) healthScore += 30;
    if (growthRate("revenue") > 5) healthScore += 30;

    insightsDiv.innerHTML = `
        <p><strong>Latest Month:</strong> ${latest.month}</p>
        <p>Revenue Growth Rate: ${growthRate("revenue").toFixed(1)}%</p>
        <p>Business Health Score: ${healthScore}/100</p>
        <p>${healthScore > 70 ? "Business performance is strong." :
            healthScore > 40 ? "Business is stable but needs optimization." :
            "Business requires strategic improvement."}</p>
    `;
}

function renderCharts() {
    const months = businessData.map(d => d.month);
    const revenues = businessData.map(d => d.revenue);
    const profits = businessData.map(d => d.profit);
    const expenses = businessData.map(d => d.expenses);

    if (revenueChart) revenueChart.destroy();
    if (profitChart) profitChart.destroy();
    if (expenseChart) expenseChart.destroy();

    revenueChart = new Chart(document.getElementById("revenueChart"), {
        type: "line",
        data: {
            labels: months,
            datasets: [{ label: "Revenue", data: revenues }]
        }
    });

    profitChart = new Chart(document.getElementById("profitChart"), {
        type: "line",
        data: {
            labels: months,
            datasets: [{ label: "Profit", data: profits }]
        }
    });

    expenseChart = new Chart(document.getElementById("expenseChart"), {
        type: "bar",
        data: {
            labels: months,
            datasets: [{ label: "Expenses", data: expenses }]
        }
    });
}

function sum(key) {
    return businessData.reduce((acc, curr) => acc + curr[key], 0);
}

function average(key) {
    return sum(key) / businessData.length;
}

function growthRate(key) {
    if (businessData.length < 2) return 0;
    const last = businessData[businessData.length - 1][key];
    const prev = businessData[businessData.length - 2][key];
    return ((last - prev) / prev) * 100;
}
