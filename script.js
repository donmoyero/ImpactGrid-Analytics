let businesses = JSON.parse(localStorage.getItem("impactgrid")) || {};
let currentBusiness = null;

// Chart instances
let chartRevenueProfit = null;
let chartExpenses = null;
let chartMargin = null;
let chartCustomers = null;
let chartCAC = null;

initSelector();

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

function addData() {
    if (!currentBusiness) return alert("Select business first");

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

    save();
    updateDashboard();
}

function updateDashboard() {
    if (!currentBusiness) return;

    const data = businesses[currentBusiness];
    if (!data.length) return;

    renderKPIs(data);
    renderCharts(data);
}

function renderKPIs(data) {
    const container = document.getElementById("kpis");
    container.innerHTML = "";

    const totalRevenue = data.reduce((a,b)=>a+b.revenue,0);
    const totalProfit = data.reduce((a,b)=>a+b.profit,0);
    const avgMargin = data.reduce((a,b)=>a+b.margin,0)/data.length;

    const metrics = [
        ["Total Revenue", "£"+totalRevenue.toFixed(2)],
        ["Total Profit", "£"+totalProfit.toFixed(2)],
        ["Average Margin", avgMargin.toFixed(1)+"%"]
    ];

    metrics.forEach(m=>{
        const div = document.createElement("div");
        div.className="kpi";
        div.innerHTML = `<h3>${m[0]}</h3><p>${m[1]}</p>`;
        container.appendChild(div);
    });
}

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
        }
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
        options:{scales:{x:{stacked:true}, y:{stacked:true}}}
    });

    chartMargin = new Chart(document.getElementById("chartMargin"),{
        type:"line",
        data:{
            labels:months,
            datasets:[{label:"Profit Margin %", data:data.map(d=>d.margin), tension:0.3}]
        }
    });

    chartCustomers = new Chart(document.getElementById("chartCustomers"),{
        type:"line",
        data:{
            labels:months,
            datasets:[{label:"Customers", data:data.map(d=>d.customers), tension:0.3}]
        }
    });

    chartCAC = new Chart(document.getElementById("chartCAC"),{
        type:"line",
        data:{
            labels:months,
            datasets:[{label:"Customer Acquisition Cost", data:data.map(d=>d.cac), tension:0.3}]
        }
    });
}

function destroyCharts(){
    if(chartRevenueProfit) chartRevenueProfit.destroy();
    if(chartExpenses) chartExpenses.destroy();
    if(chartMargin) chartMargin.destroy();
    if(chartCustomers) chartCustomers.destroy();
    if(chartCAC) chartCAC.destroy();
}

function save(){
    localStorage.setItem("impactgrid", JSON.stringify(businesses));
}
