let businessData = [];
let revenueChart = null;
let profitChart = null;
let forecastChart = null;

document.getElementById("addBtn").addEventListener("click", addData);

function addData() {
    const month = document.getElementById("month").value;
    const revenue = parseFloat(document.getElementById("revenue").value) || 0;
    const expenses = parseFloat(document.getElementById("expenses").value) || 0;
    const fixedCosts = parseFloat(document.getElementById("fixedCosts").value) || 0;
    const customers = parseFloat(document.getElementById("customers").value) || 1;
    const marketing = parseFloat(document.getElementById("marketing").value) || 0;

    if (!month || revenue <= 0) {
        alert("Please enter at least Month and Revenue.");
        return;
    }

    const profit = revenue - expenses;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const cac = customers > 0 ? marketing / customers : 0;
    const cashFlow = profit - fixedCosts;

    businessData.push({
        month,
        revenue,
        expenses,
        fixedCosts,
        customers,
        marketing,
        profit,
        margin,
        cac,
        cashFlow
    });

    updateDashboard();
}

function updateDashboard() {
    if (businessData.length === 0) return;

    generateKPIs();
    generateInsights();
    renderCharts();
}

function generateKPIs() {
    const container = document.getElementById("kpis");
    container.innerHTML = "";

    const totalRevenue = sum("revenue");
    const totalProfit = sum("profit");
    const avgMargin = avg("margin");
    const avgCashFlow = avg("cashFlow");

    const metrics = [
        ["Total Revenue", `$${totalRevenue.toFixed(2)}`],
        ["Total Profit", `$${totalProfit.toFixed(2)}`],
        ["Avg Profit Margin", `${avgMargin.toFixed(1)}%`],
        ["Avg Cash Flow", `$${avgCashFlow.toFixed(2)}`]
    ];

    metrics.forEach(m => {
        const div = document.createElement("div");
        div.className = "kpi";
        div.innerHTML = `<h3>${m[0]}</h3><p>${m[1]}</p>`;
        container.appendChild(div);
    });
}

function generateInsights() {
    const insights = document.getElementById("insights");

    const growth = growthRate("revenue");
    const margin = avg("margin");

    let text = "";

    if (margin < 15)
        text += "<p>⚠ Profit margin is low. Consider reducing costs or adjusting pricing.</p>";

    if (growth < 5)
        text += "<p>⚠ Revenue growth is slow. Improve marketing or expand market reach.</p>";

    if (text === "")
        text = "<p>✅ Business performance looks strong. Consider scaling operations.</p>";

    insights.innerHTML = `
        <p><strong>Revenue Growth:</strong> ${growth.toFixed(2)}%</p>
        ${text}
    `;
}

function renderCharts() {
    const months = businessData.map(d => d.month);
    const revenues = businessData.map(d => d.revenue);
    const profits = businessData.map(d => d.profit);

    if (revenueChart) revenueChart.destroy();
    if (profitChart) profitChart.destroy();
    if (forecastChart) forecastChart.destroy();

    revenueChart = new Chart(
        document.getElementById("revenueChart"),
        {
            type: "line",
            data: {
                labels: months,
                datasets: [{
                    label: "Revenue",
                    data: revenues
                }]
            }
        }
    );

    profitChart = new Chart(
        document.getElementById("profitChart"),
        {
            type: "line",
            data: {
                labels: months,
                datasets: [{
                    label: "Profit",
                    data: profits
                }]
            }
        }
    );

    if (businessData.length >= 2) {
        const forecast = forecastRevenue();
        const futureLabels = forecast.map((_, i) => `Forecast ${i+1}`);

        forecastChart = new Chart(
            document.getElementById("forecastChart"),
            {
                type: "line",
                data: {
                    labels: futureLabels,
                    datasets: [{
                        label: "6-Month Revenue Forecast",
                        data: forecast
                    }]
                }
            }
        );
    }
}

function forecastRevenue() {
    const growth = growthRate("revenue") / 100;
    let last = businessData[businessData.length - 1].revenue;
    let forecast = [];

    for (let i = 0; i < 6; i++) {
        last = last * (1 + growth);
        forecast.push(last);
    }

    return forecast;
}

function sum(key) {
    return businessData.reduce((acc, curr) => acc + curr[key], 0);
}

function avg(key) {
    return businessData.length > 0 ? sum(key) / businessData.length : 0;
}

function growthRate(key) {
    if (businessData.length < 2) return 0;

    const last = businessData[businessData.length - 1][key];
    const prev = businessData[businessData.length - 2][key];

    if (prev === 0) return 0;

    return ((last - prev) / prev) * 100;
}
