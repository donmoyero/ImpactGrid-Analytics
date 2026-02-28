document.addEventListener("DOMContentLoaded", function () {

let businesses = JSON.parse(localStorage.getItem("impactgrid")) || {};
let currentBusiness = null;

let charts = {};

init();

/* ========= INIT ========= */

function init() {
    initSelector();
    document.getElementById("createBtn").addEventListener("click", createBusiness);
    document.getElementById("businessSelector").addEventListener("change", selectBusiness);
    document.getElementById("addBtn").addEventListener("click", addData);
}

/* ========= BUSINESS ========= */

function createBusiness() {
    const name = document.getElementById("businessName").value.trim();
    if (!name) return alert("Enter business name");

    if (!businesses[name]) {
        businesses[name] = [];
        save();
    }

    initSelector();
    document.getElementById("businessSelector").value = name;
    currentBusiness = name;

    document.getElementById("businessName").value = "";
    updateDashboard();
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

function selectBusiness() {
    currentBusiness = document.getElementById("businessSelector").value;
    updateDashboard();
}

/* ========= ADD DATA ========= */

function addData() {
    if (!currentBusiness) return alert("Select business first");

    const month = document.getElementById("month").value;
    const revenue = +document.getElementById("revenue").value;
    const expenses = +document.getElementById("expenses").value || 0;
    const fixedCosts = +document.getElementById("fixedCosts").value || 0;
    const customers = +document.getElementById("customers").value || 0;
    const marketing = +document.getElementById("marketing").value || 0;

    if (!month || !revenue) return alert("Enter valid month and revenue");

    const profit = revenue - expenses - fixedCosts;
    const margin = revenue ? (profit / revenue) * 100 : 0;
    const cac = customers ? marketing / customers : 0;

    businesses[currentBusiness].push({
        month, revenue, expenses, fixedCosts,
        customers, marketing, profit, margin, cac
    });

    businesses[currentBusiness].sort((a,b)=>a.month.localeCompare(b.month));

    save();
    clearInputs();
    updateDashboard();
}

function clearInputs() {
    document.querySelectorAll(".grid input").forEach(i => i.value = "");
}

/* ========= DASHBOARD ========= */

function updateDashboard() {
    if (!currentBusiness) return;

    const data = businesses[currentBusiness];
    if (!data || data.length === 0) {
        document.getElementById("kpis").innerHTML = "<p>No data yet.</p>";
        destroyCharts();
        return;
    }

    renderKPIs(data);
    renderCharts(data);
}

/* ========= KPIs ========= */

function renderKPIs(data) {
    const container = document.getElementById("kpis");
    container.innerHTML = "";

    const totalRevenue = data.reduce((a,b)=>a+b.revenue,0);
    const totalProfit = data.reduce((a,b)=>a+b.profit,0);
    const avgMargin = data.reduce((a,b)=>a+b.margin,0)/data.length;
    const avgCAC = data.reduce((a,b)=>a+b.cac,0)/data.length;

    const metrics = [
        ["Total Revenue","£"+totalRevenue.toFixed(2)],
        ["Total Profit","£"+totalProfit.toFixed(2)],
        ["Avg Margin",avgMargin.toFixed(1)+"%"],
        ["Avg CAC","£"+avgCAC.toFixed(2)]
    ];

    metrics.forEach(m=>{
        const div = document.createElement("div");
        div.className="kpi";
        div.innerHTML=`<h3>${m[0]}</h3><p>${m[1]}</p>`;
        container.appendChild(div);
    });
}

/* ========= CHARTS ========= */

function renderCharts(data) {

    destroyCharts();

    const months = data.map(d=>d.month);

    charts.rev = new Chart(document.getElementById("chartRevenueProfit"),{
        type:"line",
        data:{
            labels:months,
            datasets:[
                {label:"Revenue", data:data.map(d=>d.revenue), tension:0.3},
                {label:"Profit", data:data.map(d=>d.profit), tension:0.3}
            ]
        }
    });

    charts.exp = new Chart(document.getElementById("chartExpenses"),{
        type:"bar",
        data:{
            labels:months,
            datasets:[
                {label:"Expenses", data:data.map(d=>d.expenses)},
                {label:"Fixed Costs", data:data.map(d=>d.fixedCosts)}
            ]
        }
    });

    charts.margin = new Chart(document.getElementById("chartMargin"),{
        type:"line",
        data:{
            labels:months,
            datasets:[{label:"Profit Margin %", data:data.map(d=>d.margin), tension:0.3}]
        }
    });

    charts.customers = new Chart(document.getElementById("chartCustomers"),{
        type:"line",
        data:{
            labels:months,
            datasets:[{label:"Customers", data:data.map(d=>d.customers), tension:0.3}]
        }
    });

    charts.cac = new Chart(document.getElementById("chartCAC"),{
        type:"line",
        data:{
            labels:months,
            datasets:[{label:"CAC", data:data.map(d=>d.cac), tension:0.3}]
        }
    });
}

function destroyCharts(){
    Object.values(charts).forEach(c=>c.destroy());
    charts = {};
}

function save(){
    localStorage.setItem("impactgrid", JSON.stringify(businesses));
}

});
