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
    renderInsights();
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

function getMargin() {
    const totalRevenue=sum("revenue");
    const totalProfit=sum("profit");
    return totalRevenue>0 ? (totalProfit/totalRevenue)*100 : 0;
}

/* ================= SMART INSIGHT ENGINE ================= */

function renderInsights() {

    const container = document.getElementById("insightEngine");
    if (!container || businessData.length < 2) return;

    const growth = calculateMonthlyGrowth();
    const volatility = calculateVolatility();
    const margin = getMargin();
    const burn = calculateBurnRate();
    const runway = calculateRunway();

    let insights = [];

    if (growth > 10) {
        insights.push("📈 Strong revenue growth detected. Consider reinvesting profits to accelerate scaling.");
    } else if (growth < 0) {
        insights.push("⚠ Revenue decline detected. Immediate review of sales channels is recommended.");
    } else {
        insights.push("📊 Revenue growth is moderate. Focus on improving customer retention.");
    }

    if (volatility > 35) {
        insights.push("⚠ Revenue volatility is high. Consider recurring revenue models for stability.");
    }

    if (margin < 10) {
        insights.push("⚠ Low profit margin. Review expense structure and pricing strategy.");
    }

    if (burn > 0 && runway < 6) {
        insights.push("🚨 Cash runway below 6 months. Cost control or capital injection required.");
    }

    if (margin > 20 && volatility < 20) {
        insights.push("✅ Business appears financially stable with strong operational efficiency.");
    }

    container.innerHTML = insights.map(text =>
        `<p style="margin-bottom:12px;">${text}</p>`
    ).join("");
}

/* ================= CHARTS ================= */

function renderCoreCharts() {

    revenueChart?.destroy();
    profitChart?.destroy();
    expenseChart?.destroy();

    const labels = businessData.map(d=>d.date.toISOString().slice(0,7));

    revenueChart = createChart("revenueChart","line",labels,businessData.map(d=>d.revenue),"#4CAF50","Revenue");
    profitChart = createChart("profitChart","line",labels,businessData.map(d=>d.profit),"#2196F3","Profit");
    expenseChart = createChart("expenseChart","bar",labels,businessData.map(d=>d.expenses),"#FF5252","Expenses");
}

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

    let base=[],labels=[];
    let val=last.revenue;
    let futureDate=new Date(last.date);

    for(let i=1;i<=6;i++){
        futureDate.setMonth(futureDate.getMonth()+1);
        labels.push(futureDate.toISOString().slice(0,7));
        val*=1+cagr;
        base.push(Math.round(val));
    }

    forecastChart=new Chart(
        document.getElementById("forecastChart").getContext("2d"),
        {
            type:"line",
            data:{ labels, datasets:[{label:"Projected Revenue",data:base,borderColor:"#f59e0b"}]},
            options:{responsive:true,maintainAspectRatio:false}
        }
    );
}

function renderComparison() {

    comparisonChart?.destroy();

    const stability = 100 - calculateVolatility();
    const growth = Math.min(calculateMonthlyGrowth()*5,100);
    const marginScore = Math.min(getMargin()*3,100);

    comparisonChart=new Chart(
        document.getElementById("comparisonChart").getContext("2d"),
        {
            type:"bar",
            data:{
                labels:["Stability","Growth","Profitability"],
                datasets:[{
                    label:"Performance Index (0-100)",
                    data:[stability,growth,marginScore],
                    backgroundColor:["#22c55e","#f59e0b","#8b5cf6"]
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

/* ================= UTIL ================= */

function createChart(id,type,labels,data,color,label){
    const canvas=document.getElementById(id);
    if(!canvas) return null;
    return new Chart(canvas.getContext("2d"),{
        type,
        data:{labels,datasets:[{label,data,borderColor:color,backgroundColor:type==="bar"?color:"transparent",tension:0.4}]},
        options:{responsive:true,maintainAspectRatio:false}
    });
}

function sum(key){
    return businessData.reduce((a,b)=>a+(b[key]||0),0);
}

function formatCurrency(val){
    return "£"+Number(val).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
}

function bindGlobalFunctions(){
    window.login=login;
    window.logout=logout;
    window.addData=addData;
}
