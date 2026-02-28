let businesses = JSON.parse(localStorage.getItem("impactgrid")) || {};
let currentBusiness = null;

// Chart instances
let chartRevenueProfit = null;
let chartExpenses = null;
let chartMargin = null;
let chartCustomers = null;
let chartCAC = null;

initSelector();

/* =========================
   BUSINESS MANAGEMENT
========================= */

function createBusiness() {
    const name = document.getElementById("businessName").value.trim();
    if (!name) return alert("Enter business name");

    if (!businesses[name]) {
        businesses[name] = [];
        save();
    }

    document.getElementById("businessName").value = "";
    initSelector();
}

function initSelector() {
    const selector = document.getElementById("businessSelector");
    selector.innerHTML = "<option value=''>Select Business</option>";

    Object.keys(businesses).forEach(name => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        selector.appendChild(opt);
    });
}

function loadBusiness() {
    currentBusiness = document.getElementById("businessSelector").value;
    updateDashboard();
}

/* =========================
   DATA ENTRY
========================= */

function addData() {
    if (!currentBusiness) return alert("Select business first");

    const month = document.getElementById("month").value;
    const revenue = +document.getElementById("revenue").value || 0;
    const expenses = +document.getElementById("expenses").value || 0;
    const fixedCosts = +document.getElementById("fixedCosts").value || 0;
    const customers = +document.getElementById("customers").value || 0;
    const marketing = +document.getElementById("marketing").value || 0;

    if (!month || revenue <= 0) {
        alert("Enter valid month and revenue");
        return;
    }

    // Prevent duplicate month
    const exists = businesses[currentBusiness].some(d => d.month === month);
    if (exists) {
        alert("Data for this month already exists");
        return;
    }

    const profit = revenue - expenses - fixedCosts;
    const margin = revenue ? (profit / revenue) * 100 : 0;
    const cac = customers ? marketing / customers : 0;

    businesses[currentBusiness].push({
        month,
        revenue,
        expenses,
        fixedCosts,
        customers,
        marketing,
        profit,
        margin,
        cac
    });

    // Sort months chronologically
    businesses[currentBusiness].sort((a, b) => a.month.localeCompare(b.month));

    save();
    clearInputs();
    updateDashboard();
}

function clearInputs() {
    document.querySelectorAll(".grid input").forEach(input => input.value = "");
}

/* =========================
   DASHBOARD UPDATE
========================= */

function updateDashboard() {
    if (!currentBusiness) return;

    const data = businesses[currentBusiness];
    if (!data || data.length === 0) {
        destroyCharts();
        document.getElementById("kpis").innerHTML = "<p>No data yet.</p>";
        return;
    }

    renderKPIs(data);
    renderCharts(data);
}

/* =========================
   KPI RENDERING
========================= */

function renderKPIs(data) {
    const container = document.getElementById("kpis");
    container.innerHTML = "";

    const totalRevenue = data.reduce((a,b)=>a+b.revenue,0);
    const totalProfit = data.reduce((a,b)=>a+b.profit,0);
    const avgMargin = data.reduce((a,b)=>a+b.margin,0)/data.length;
    const avgCAC = data.reduce((a,b)=>a+b.cac,0)/data.length;

    const metrics = [
        ["Total Revenue", "£"+totalRevenue.toFixed(2)],
        ["Total Profit", "£"+totalProfit.toFixed(2)],
        ["Average Margin", avgMargin.toFixed(1)+"%"],
        ["Average CAC", "£"+avgCAC.toFixed(2)]
    ];

    metrics.forEach(m=>{
        const div = document.createElement("div");
        div.className="kpi";
        div.innerHTML = `<h3>${m[0]}</h3><p>${m[1]}</p>`;
        container.appendChild(div);
    });
}

/* =========================
   CHARTS
========================= */

function renderCharts(data) {

    const months = data.map(d=>d.month);

    destroyCharts();

    chartRevenueProfit = new Chart(document.getElementById("chartRevenueProfit"),{
        type:"line",
        data:{
            labels:months,
            datasets:[
                {label:"Revenue", data:data.map(d=>d.revenue), tension:0.3},
                {label:"Profit", data:data.map(d=>d.profit), tension:0.3}
            ]
        },
        options:{responsive:true, maintainAspectRatio:false}
    });

    chartExpenses = new Chart(document.getElementById("chartExpenses"),{
        type:"bar",
        data:{
            labels:months,
            datasets:[
                {label:"Operational Expenses", data:data.map(d=>d.expenses)},
                {label:"Fixed Costs", data:data.map(d=>d.fixedCosts)}
            ]
        },
        options:{
            responsive:true,
            maintainAspectRatio:false,
            scales:{x:{stacked:true}, y:{stacked:true}}
        }
    });

    chartMargin = new Chart(document.getElementById("chartMargin"),{
        type:"line",
        data:{
            labels:months,
            datasets:[{label:"Profit Margin %", data:data.map(d=>d.margin), tension:0.3}]
        },
        options:{responsive:true, maintainAspectRatio:false}
    });

    chartCustomers = new Chart(document.getElementById("chartCustomers"),{
        type:"line",
        data:{
            labels:months,
            datasets:[{label:"Customers", data:data.map(d=>d.customers), tension:0.3}]
        },
        options:{responsive:true, maintainAspectRatio:false}
    });

    chartCAC = new Chart(document.getElementById("chartCAC"),{
        type:"line",
        data:{
            labels:months,
            datasets:[{label:"Customer Acquisition Cost", data:data.map(d=>d.cac), tension:0.3}]
        },
        options:{responsive:true, maintainAspectRatio:false}
    });
}

function destroyCharts(){
    if(chartRevenueProfit){ chartRevenueProfit.destroy(); chartRevenueProfit=null; }
    if(chartExpenses){ chartExpenses.destroy(); chartExpenses=null; }
    if(chartMargin){ chartMargin.destroy(); chartMargin=null; }
    if(chartCustomers){ chartCustomers.destroy(); chartCustomers=null; }
    if(chartCAC){ chartCAC.destroy(); chartCAC=null; }
}

/* =========================
   STORAGE
========================= */

function save(){
    localStorage.setItem("impactgrid", JSON.stringify(businesses));
}
