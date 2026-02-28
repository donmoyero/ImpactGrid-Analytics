let data = [];
let revenueChart, profitChart, forecastChart;

function addData() {
    const month = document.getElementById("month").value;
    const revenue = +document.getElementById("revenue").value;
    const expenses = +document.getElementById("expenses").value;
    const fixedCosts = +document.getElementById("fixedCosts").value;
    const customers = +document.getElementById("customers").value;
    const marketing = +document.getElementById("marketing").value;

    if (!month || revenue <= 0) return alert("Enter valid data");

    const profit = revenue - expenses;
    const margin = (profit / revenue) * 100;
    const cac = marketing / customers;
    const cashFlow = profit - fixedCosts;

    data.push({
        month, revenue, expenses, fixedCosts,
        customers, marketing, profit,
        margin, cac, cashFlow
    });

    updateDashboard();
}

function updateDashboard() {
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
    const breakEven = calculateBreakEven();

    const metrics = [
        ["Total Revenue", `$${totalRevenue.toFixed(2)}`],
        ["Total Profit", `$${totalProfit.toFixed(2)}`],
        ["Avg Profit Margin", `${avgMargin.toFixed(1)}%`],
        ["Break-even Revenue", `$${breakEven.toFixed(2)}`]
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
    const cashHealth = avg("cashFlow");

    let recommendations = [];

    if (margin < 15)
        recommendations.push("Improve pricing strategy or reduce operational costs.");

    if (growth < 5)
        recommendations.push("Increase marketing efficiency or explore new customer channels.");

    if (cashHealth < 0)
        recommendations.push("Business is cash-flow negative. Reduce fixed costs immediately.");

    if (recommendations.length === 0)
        recommendations.push("Business performance is strong. Consider scaling operations.");

    insights.innerHTML = `
        <p><strong>Revenue Growth:</strong> ${growth.toFixed(2)}%</p>
        <p><strong>Cash Flow Health:</strong> $${cashHealth.toFixed(2)}</p>
        <ul>${recommendations.map(r => `<li>${r}</li>`).join("")}</ul>
    `;
}

function calculateBreakEven() {
    const avgFixed = avg("fixedCosts");
    const avgMargin = avg("margin") / 100;
    return avgFixed / avgMargin;
}

function forecastRevenue() {
    const growth = growthRate("revenue") / 100;
    let last = data[data.length - 1].revenue;
    let forecast = [];

    for (let i = 1; i <= 6; i++) {
        last = last * (1 + growth);
        forecast.push(last);
    }
    return forecast;
}

function renderCharts() {
    const months = data.map(d => d.month);
    const revenues = data.map(d => d.revenue);
    const profits = data.map(d => d.profit);

    if (revenueChart) revenueChart.destroy();
    if (profitChart) profitChart.destroy();
    if (forecastChart) forecastChart.destroy();

    revenueChart = new Chart(document.getElementById("revenueChart"), {
        type: "line",
        data: { labels: months, datasets: [{ label: "Revenue", data: revenues }] }
    });

    profitChart = new Chart(document.getElementById("profitChart"), {
        type: "line",
        data: { labels: months, datasets: [{ label: "Profit", data: profits }] }
    });

    const forecast = forecastRevenue();
    const futureMonths = Array.from({length:6}, (_,i)=>"Forecast "+(i+1));

    forecastChart = new Chart(document.getElementById("forecastChart"), {
        type: "line",
        data: {
            labels: futureMonths,
            datasets: [{ label: "6-Month Revenue Forecast", data: forecast }]
        }
    });
}

function sum(key) {
    return data.reduce((a,b)=>a+b[key],0);
}

function avg(key) {
    return sum(key)/data.length;
}

function growthRate(key) {
    if (data.length < 2) return 0;
    const last = data[data.length-1][key];
    const prev = data[data.length-2][key];
    return ((last-prev)/prev)*100;
}
