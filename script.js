let businesses = JSON.parse(localStorage.getItem("impactgrid")) || {};
let currentBusiness = null;

let revenueProfitChart, expenseChart, marginChart, customerChart, cacChart;

initializeSelector();

function createBusiness() {
    const name = document.getElementById("businessName").value.trim();
    if (!name) return alert("Enter business name");

    if (!businesses[name]) {
        businesses[name] = [];
        saveData();
    }

    document.getElementById("businessName").value = "";
    initializeSelector();
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
    currentBusiness = document.getElementById("businessSelector").value;
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

    if (!month || revenue <= 0) {
        alert("Enter valid month and revenue");
        return;
    }

    const profit = revenue - expenses;
    const margin = revenue ? (profit / revenue) * 100 : 0;

    businesses[currentBusiness].push({
        month,
        revenue,
        expenses,
        fixedCosts,
        customers,
        marketing,
        profit,
        margin
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
        ["Average Margin", `${avgMargin.toFixed(1)}%`]
    ];

    metrics.forEach(m => {
        const div = document.createElement("div");
        div.className = "kpi";
        div.innerHTML = `<h3>${m[0]}</h3><p>${m[1]}</p>`;
        container.appendChild(div);
    });
}

function renderCharts(data) {
    const months = data.map(d => d.month);
    const revenues = data.map(d => d.revenue);
    const profits = data.map(d => d.profit);
    const expenses = data.map(d => d.expenses);
    const fixedCosts = data.map(d => d.fixedCosts);
    const margins = data.map(d => d.margin);
    const customers = data.map(d => d.customers);
    const cacs = data.map(d => d.customers ? d.marketing / d.customers : 0);

    [revenueProfitChart, expenseChart, marginChart, customerChart, cacChart]
        .forEach(chart => chart && chart.destroy());

    revenueProfitChart = new Chart(document.getElementById("revenueProfitChart"), {
        type: "line",
        data: {
            labels: months,
            datasets: [
                { label: "Revenue", data: revenues, borderWidth: 3, tension: 0.3 },
                { label: "Profit", data: profits, borderWidth: 3, tension: 0.3 }
            ]
        }
    });

    expenseChart = new Chart(document.getElementById("expenseChart"), {
        type: "bar",
        data: {
            labels: months,
            datasets: [
                { label: "Operational Expenses", data: expenses },
                { label: "Fixed Costs", data: fixedCosts }
            ]
        },
        options: {
            scales: {
                x: { stacked: true },
                y: { stacked: true }
            }
        }
    });

    marginChart = new Chart(document.getElementById("marginChart"), {
        type: "line",
        data: {
            labels: months,
            datasets: [{ label: "Profit Margin (%)", data: margins, tension: 0.3 }]
        }
    });

    customerChart = new Chart(document.getElementById("customerChart"), {
        type: "line",
        data: {
            labels: months,
            datasets: [{ label: "Customers", data: customers, tension: 0.3 }]
        }
    });

    cacChart = new Chart(document.getElementById("cacChart"), {
        type: "line",
        data: {
            labels: months,
            datasets: [{ label: "Customer Acquisition Cost", data: cacs, tension: 0.3 }]
        }
    });
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
