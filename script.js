let businesses = JSON.parse(localStorage.getItem("impactgrid")) || {};
let currentBusiness = null;
let revenueChart = null;
let profitChart = null;

initializeSelector();

function createBusiness() {
    const name = document.getElementById("businessName").value.trim();
    if (!name) return alert("Enter business name");

    if (!businesses[name]) {
        businesses[name] = [];
        saveData();
        initializeSelector();
    }

    document.getElementById("businessName").value = "";
}

function initializeSelector() {
    const selector = document.getElementById("businessSelector");
    selector.innerHTML = "<option>Select Business</option>";

    Object.keys(businesses).forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        selector.appendChild(option);
    });
}

function loadBusiness() {
    const name = document.getElementById("businessSelector").value;
    currentBusiness = name;
    updateDashboard();
}

function addData() {
    if (!currentBusiness) return alert("Select a business first");

    const month = document.getElementById("month").value;
    const revenue = +document.getElementById("revenue").value || 0;
    const expenses = +document.getElementById("expenses").value || 0;
    const fixedCosts = +document.getElementById("fixedCosts").value || 0;
    const customers = +document.getElementById("customers").value || 1;
    const marketing = +document.getElementById("marketing").value || 0;

    const profit = revenue - expenses;
    const margin = revenue ? (profit / revenue) * 100 : 0;

    businesses[currentBusiness].push({
        month, revenue, expenses, fixedCosts,
        customers, marketing, profit, margin
    });

    saveData();
    updateDashboard();
}

function updateDashboard() {
    if (!currentBusiness) return;

    const data = businesses[currentBusiness];
    if (!data.length) return;

    generateKPIs(data);
    renderCharts(data);
    generateInsights(data);
}

function generateKPIs(data) {
    const container = document.getElementById("kpis");
    container.innerHTML = "";

    const totalRevenue = sum(data, "revenue");
    const totalProfit = sum(data, "profit");
    const avgMargin = avg(data, "margin");

    const metrics = [
        ["Total Revenue", `$${totalRevenue.toFixed(2)}`],
        ["Total Profit", `$${totalProfit.toFixed(2)}`],
        ["Avg Margin", `${avgMargin.toFixed(1)}%`]
    ];

    metrics.forEach(m => {
        const div = document.createElement("div");
        div.className = "kpi";
        div.innerHTML = `<h3>${m[0]}</h3><p>${m[1]}</p>`;
        container.appendChild(div);
    });
}

function generateInsights(data) {
    const insights = document.getElementById("insights");

    const margin = avg(data, "margin");
    let message = margin > 20 ?
        "Strong profitability performance." :
        "Profitability needs improvement.";

    insights.innerHTML = `<p>${message}</p>`;
}

function renderCharts(data) {
    const months = data.map(d => d.month);
    const revenues = data.map(d => d.revenue);
    const profits = data.map(d => d.profit);

    if (revenueChart) revenueChart.destroy();
    if (profitChart) profitChart.destroy();

    revenueChart = new Chart(
        document.getElementById("revenueChart"),
        {
            type: "line",
            data: { labels: months, datasets: [{ label: "Revenue", data: revenues }] }
        }
    );

    profitChart = new Chart(
        document.getElementById("profitChart"),
        {
            type: "line",
            data: { labels: months, datasets: [{ label: "Profit", data: profits }] }
        }
    );
}

function exportPDF() {
    if (!currentBusiness) return alert("Select business first");

    const doc = new jsPDF();
    const data = businesses[currentBusiness];

    doc.text("ImpactGrid Executive Report", 20, 20);
    doc.text(`Business: ${currentBusiness}`, 20, 30);
    doc.text(`Total Revenue: $${sum(data, "revenue").toFixed(2)}`, 20, 40);
    doc.text(`Total Profit: $${sum(data, "profit").toFixed(2)}`, 20, 50);
    doc.text(`Avg Margin: ${avg(data, "margin").toFixed(1)}%`, 20, 60);

    doc.save(`${currentBusiness}_ImpactGrid_Report.pdf`);
}

function sum(data, key) {
    return data.reduce((a, b) => a + b[key], 0);
}

function avg(data, key) {
    return sum(data, key) / data.length;
}

function saveData() {
    localStorage.setItem("impactgrid", JSON.stringify(businesses));
}
