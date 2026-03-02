/* ================= GLOBAL STATE ================= */

let businessData = [];
let revenueChart = null;
let profitChart = null;
let expenseChart = null;
let forecastChart = null;
let comparisonChart = null;

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
    bindGlobalFunctions();
});

/* ================= LOGIN ================= */

function login() {
    const email = document.getElementById("username")?.value.trim();
    const password = document.getElementById("password")?.value.trim();

    if (!email || !password) {
        alert("Enter email and password.");
        return;
    }

    showApp();
}

function logout() {
    location.reload();
}

function showApp() {
    document.getElementById("authScreen").style.display = "none";
    document.getElementById("app").classList.remove("hidden");
}

/* ================= ADD DATA ================= */

function addData() {

    const monthValue = document.getElementById("month")?.value;
    const revenue = parseFloat(document.getElementById("revenue")?.value);
    const expenses = parseFloat(document.getElementById("expenses")?.value);

    if (!monthValue || isNaN(revenue) || isNaN(expenses)) {
        alert("Enter valid data.");
        return;
    }

    const date = new Date(monthValue + "-01");
    const profit = revenue - expenses;

    businessData.push({ date, revenue, expenses, profit });

    businessData.sort((a,b)=>a.date-b.date);

    updateAll();
}

/* ================= UPDATE ALL ================= */

function updateAll() {
    if (!businessData.length) return;

    renderKPIs();
    renderExecutiveSummary();
    renderCoreCharts();
    renderForecast();
    renderComparison();
}

/* ================= KPI ================= */

function renderKPIs() {
    const container = document.getElementById("kpiContainer");

    const totalRevenue = sum("revenue");
    const totalProfit = sum("profit");

    const margin = totalRevenue > 0
        ? ((totalProfit / totalRevenue) * 100).toFixed(2)
        : 0;

    container.innerHTML = `
        <div class="kpi">
            <h3>Total Revenue</h3>
            <p>${formatCurrency(totalRevenue)}</p>
        </div>
        <div class="kpi">
            <h3>Total Profit</h3>
            <p>${formatCurrency(totalProfit)}</p>
        </div>
        <div class="kpi">
            <h3>Profit Margin</h3>
            <p>${margin}%</p>
        </div>
    `;
}

/* ================= EXECUTIVE SUMMARY ================= */

function renderExecutiveSummary() {

    const container = document.getElementById("executiveSummary");
    if (!container || businessData.length < 2) return;

    const monthlyGrowth = calculateMonthlyGrowth();
    const rollingAvg = calculateRollingAverage(3);
    const volatility = calculateVolatility();
    const burnRate = calculateBurnRate();
    const runway = calculateRunway();

    container.innerHTML = `
        <div class="kpi">
            <h3>Avg Monthly Growth</h3>
            <p>${monthlyGrowth.toFixed(2)}%</p>
        </div>
        <div class="kpi">
            <h3>3M Rolling Avg Revenue</h3>
            <p>${formatCurrency(rollingAvg)}</p>
        </div>
        <div class="kpi">
            <h3>Revenue Volatility</h3>
            <p>${volatility.toFixed(2)}%</p>
        </div>
        <div class="kpi">
            <h3>Burn Rate</h3>
            <p>${formatCurrency(burnRate)}</p>
        </div>
        <div class="kpi">
            <h3>Runway (Months)</h3>
            <p>${runway.toFixed(1)}</p>
        </div>
    `;
}

/* ================= ANALYTICS ================= */

function calculateMonthlyGrowth() {
    let growthRates = [];

    for (let i=1; i<businessData.length; i++) {
        const prev = businessData[i-1].revenue;
        const current = businessData[i].revenue;

        if (prev > 0) {
            growthRates.push((current - prev)/prev);
        }
    }

    const avg = growthRates.reduce((a,b)=>a+b,0)/growthRates.length;
    return avg*100;
}

function calculateRollingAverage(period) {
    if (businessData.length < period) return 0;

    const recent = businessData.slice(-period);
    const total = recent.reduce((a,b)=>a+b.revenue,0);
    return total/period;
}

function calculateVolatility() {
    const revenues = businessData.map(d=>d.revenue);
    const mean = revenues.reduce((a,b)=>a+b,0)/revenues.length;

    const variance = revenues.reduce((a,b)=>a+Math.pow(b-mean,2),0)/revenues.length;
    const stdDev = Math.sqrt(variance);

    return (stdDev/mean)*100;
}

function calculateBurnRate() {
    const losses = businessData
        .filter(d=>d.profit < 0)
        .map(d=>Math.abs(d.profit));

    if (!losses.length) return 0;

    return losses.reduce((a,b)=>a+b,0)/losses.length;
}

function calculateRunway() {
    const burn = calculateBurnRate();
    if (burn === 0) return Infinity;

    const lastRevenue = businessData[businessData.length-1].revenue;
    return lastRevenue/burn;
}

/* ================= CORE CHARTS ================= */

function renderCoreCharts() {

    revenueChart?.destroy();
    profitChart?.destroy();
    expenseChart?.destroy();

    const labels = businessData.map(d =>
        d.date.toISOString().slice(0,7)
    );

    revenueChart = createChart("revenueChart","line",labels,businessData.map(d=>d.revenue),"#4CAF50","Revenue");
    profitChart = createChart("profitChart","line",labels,businessData.map(d=>d.profit),"#2196F3","Profit");
    expenseChart = createChart("expenseChart","bar",labels,businessData.map(d=>d.expenses),"#FF5252","Expenses");
}

/* ================= FORECAST ================= */

function renderForecast() {

    if (businessData.length < 3) return;

    forecastChart?.destroy();

    const first = businessData[0];
    const last = businessData[businessData.length-1];

    const monthsDiff =
        (last.date.getFullYear()-first.date.getFullYear())*12+
        (last.date.getMonth()-first.date.getMonth());

    if (monthsDiff<=0 || first.revenue<=0) return;

    const cagr = Math.pow(last.revenue/first.revenue,1/monthsDiff)-1;

    let projections=[];
    let labels=[];
    let projectedRevenue=last.revenue;
    let projectedDate=new Date(last.date);

    for(let i=1;i<=6;i++){
        projectedRevenue*=1+cagr;
        projectedDate.setMonth(projectedDate.getMonth()+1);

        projections.push(Math.round(projectedRevenue));
        labels.push(projectedDate.toISOString().slice(0,7));
    }

    forecastChart = new Chart(
        document.getElementById("forecastChart").getContext("2d"),
        {
            type:"line",
            data:{
                labels,
                datasets:[{
                    label:"Projected Revenue (CAGR)",
                    data:projections,
                    borderColor:"#f59e0b",
                    tension:0.4
                }]
            },
            options:{ responsive:true, maintainAspectRatio:false }
        }
    );
}

/* ================= COMPARISON ================= */

function renderComparison() {

    comparisonChart?.destroy();

    comparisonChart = new Chart(
        document.getElementById("comparisonChart").getContext("2d"),
        {
            type:"bar",
            data:{
                labels:["Revenue","Expenses","Profit"],
                datasets:[{
                    label:"Cumulative Performance",
                    data:[
                        sum("revenue"),
                        sum("expenses"),
                        sum("profit")
                    ],
                    backgroundColor:["#4CAF50","#FF5252","#2196F3"]
                }]
            },
            options:{ responsive:true, maintainAspectRatio:false }
        }
    );
}

/* ================= CHART FACTORY ================= */

function createChart(id,type,labels,data,color,label){
    const canvas=document.getElementById(id);
    if(!canvas) return null;

    return new Chart(canvas.getContext("2d"),{
        type,
        data:{
            labels,
            datasets:[{
                label,
                data,
                borderColor:color,
                backgroundColor:type==="bar"?color:"transparent",
                tension:0.4,
                fill:false
            }]
        },
        options:{
            responsive:true,
            maintainAspectRatio:false,
            scales:{ y:{ beginAtZero:true } }
        }
    });
}

/* ================= HELPERS ================= */

function sum(key){
    return businessData.reduce((a,b)=>a+(b[key]||0),0);
}

function formatCurrency(val){
    return "£"+Number(val).toLocaleString(undefined,{
        minimumFractionDigits:2,
        maximumFractionDigits:2
    });
}

/* ================= GLOBAL BIND ================= */

function bindGlobalFunctions(){
    window.login=login;
    window.logout=logout;
    window.addData=addData;
}
