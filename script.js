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

    if (revenue < 0 || expenses < 0) {
        alert("Values must be positive.");
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
    const efficiency = calculateExpenseEfficiency();
    const healthScore = calculateHealthScore(volatility, monthlyGrowth, getMargin());

    container.innerHTML = `
        <div class="kpi">
            <h3>Avg Monthly Growth</h3>
            <p>${monthlyGrowth.toFixed(2)}%</p>
        </div>
        <div class="kpi">
            <h3>3M Rolling Avg</h3>
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
            <p>${runway === Infinity ? "Stable" : runway.toFixed(1)}</p>
        </div>
        <div class="kpi">
            <h3>Business Health Score</h3>
            <p>${healthScore.toFixed(0)}/100</p>
        </div>
    `;
}

/* ================= ANALYTICS ================= */

function calculateMonthlyGrowth() {
    let growthRates = [];
    for (let i=1; i<businessData.length; i++) {
        const prev = businessData[i-1].revenue;
        const current = businessData[i].revenue;
        if (prev > 0) growthRates.push((current-prev)/prev);
    }
    if (!growthRates.length) return 0;
    return (growthRates.reduce((a,b)=>a+b,0)/growthRates.length)*100;
}

function calculateExpenseGrowth() {
    let growthRates = [];
    for (let i=1; i<businessData.length; i++) {
        const prev = businessData[i-1].expenses;
        const current = businessData[i].expenses;
        if (prev > 0) growthRates.push((current-prev)/prev);
    }
    if (!growthRates.length) return 0;
    return (growthRates.reduce((a,b)=>a+b,0)/growthRates.length)*100;
}

function calculateRollingAverage(period) {
    if (businessData.length < period) return 0;
    const recent = businessData.slice(-period);
    return recent.reduce((a,b)=>a+b.revenue,0)/period;
}

function calculateVolatility() {
    const revenues = businessData.map(d=>d.revenue);
    const mean = revenues.reduce((a,b)=>a+b,0)/revenues.length;
    if (mean === 0) return 0;
    const variance = revenues.reduce((a,b)=>a+Math.pow(b-mean,2),0)/revenues.length;
    return (Math.sqrt(variance)/mean)*100;
}

function calculateBurnRate() {
    const losses = businessData.filter(d=>d.profit<0).map(d=>Math.abs(d.profit));
    if (!losses.length) return 0;
    return losses.reduce((a,b)=>a+b,0)/losses.length;
}

function calculateRunway() {
    const burn = calculateBurnRate();
    if (burn === 0) return Infinity;
    const lastRevenue = businessData[businessData.length-1].revenue;
    return lastRevenue/burn;
}

function calculateExpenseEfficiency() {
    const revGrowth = calculateMonthlyGrowth();
    const expGrowth = calculateExpenseGrowth();
    if (expGrowth === 0) return 100;
    const ratio = revGrowth/expGrowth;
    return Math.max(0, Math.min(ratio*100,100));
}

function calculateHealthScore(volatility,growth,margin) {
    const stability = 100-volatility;
    const growthScore = Math.min(growth*5,100);
    const marginScore = Math.min(margin*3,100);
    return (stability+growthScore+marginScore)/3;
}

function getMargin() {
    const totalRevenue=sum("revenue");
    const totalProfit=sum("profit");
    return totalRevenue>0 ? (totalProfit/totalRevenue)*100 : 0;
}

/* ================= CORE CHARTS ================= */

function renderCoreCharts() {

    revenueChart?.destroy();
    profitChart?.destroy();
    expenseChart?.destroy();

    const labels = businessData.map(d=>d.date.toISOString().slice(0,7));

    revenueChart = createChart("revenueChart","line",labels,businessData.map(d=>d.revenue),"#4CAF50","Revenue");
    profitChart = createChart("profitChart","line",labels,businessData.map(d=>d.profit),"#2196F3","Profit");
    expenseChart = createChart("expenseChart","bar",labels,businessData.map(d=>d.expenses),"#FF5252","Expenses");
}

/* ================= FORECAST WITH SCENARIOS ================= */

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

    let base=[], optimistic=[], stress=[], labels=[];
    let baseVal=last.revenue;
    let optVal=last.revenue;
    let stressVal=last.revenue;
    let futureDate=new Date(last.date);

    for(let i=1;i<=6;i++){
        futureDate.setMonth(futureDate.getMonth()+1);
        labels.push(futureDate.toISOString().slice(0,7));

        baseVal*=1+cagr;
        optVal*=1+(cagr+0.05);
        stressVal*=1+(cagr-0.15);

        base.push(Math.round(baseVal));
        optimistic.push(Math.round(optVal));
        stress.push(Math.round(stressVal));
    }

    forecastChart=new Chart(
        document.getElementById("forecastChart").getContext("2d"),
        {
            type:"line",
            data:{
                labels,
                datasets:[
                    {label:"Base",data:base,borderColor:"#f59e0b",tension:0.4},
                    {label:"Optimistic",data:optimistic,borderColor:"#22c55e",tension:0.4},
                    {label:"Stress",data:stress,borderColor:"#ef4444",tension:0.4}
                ]
            },
            options:{responsive:true,maintainAspectRatio:false}
        }
    );
}

/* ================= ADVANCED PERFORMANCE MATRIX ================= */

function renderComparison() {

    comparisonChart?.destroy();

    if (businessData.length < 3) return;

    const volatility=calculateVolatility();
    const growth=calculateMonthlyGrowth();
    const efficiency=calculateExpenseEfficiency();
    const health=calculateHealthScore(volatility,growth,getMargin());

    comparisonChart=new Chart(
        document.getElementById("comparisonChart").getContext("2d"),
        {
            type:"bar",
            data:{
                labels:["Stability","Efficiency","Growth","Health Score"],
                datasets:[{
                    label:"Performance Index (0-100)",
                    data:[
                        100-volatility,
                        efficiency,
                        Math.min(growth*5,100),
                        health
                    ],
                    backgroundColor:["#22c55e","#3b82f6","#f59e0b","#8b5cf6"]
                }]
            },
            options:{
                responsive:true,
                maintainAspectRatio:false,
                scales:{y:{beginAtZero:true,max:100}}
            }
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
            scales:{y:{beginAtZero:true}}
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
