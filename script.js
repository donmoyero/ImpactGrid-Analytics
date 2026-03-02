/* ================= GLOBAL STATE ================= */

let businessData = [];

let revenueChart = null;
let profitChart = null;
let expenseChart = null;

let forecastCharts = {};
let performanceBarChart = null;
let distributionPieChart = null;

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
    bindGlobalFunctions();
});

/* ================= ADD DATA ================= */

function addData() {

    const monthValue = document.getElementById("month")?.value;
    const revenue = parseFloat(document.getElementById("revenue")?.value);
    const expenses = parseFloat(document.getElementById("expenses")?.value);

    if (!monthValue || isNaN(revenue) || isNaN(expenses)) {
        alert("Enter valid financial data.");
        return;
    }

    const date = new Date(monthValue + "-01");
    const profit = revenue - expenses;

    const exists = businessData.find(d =>
        d.date.toISOString().slice(0,7) === date.toISOString().slice(0,7)
    );

    if (exists) {
        alert("Data for this month already exists.");
        return;
    }

    businessData.push({ date, revenue, expenses, profit });
    businessData.sort((a,b)=>a.date-b.date);

    updateAll();
}

/* ================= MASTER UPDATE ================= */

function updateAll() {
    if (!businessData.length) return;

    renderExecutiveSummary();
    renderLifecycle();
    renderInsights();
    renderCoreCharts();
    renderForecasts();
    renderPerformanceMatrix();
    renderRiskAssessment();
}

/* ================= DISPLAY MODE ================= */

function getDisplayMode() {
    return document.getElementById("displayMode")?.value || "absolute";
}

function normaliseSeries(key) {
    if (!businessData.length) return [];

    const base = businessData[0][key];
    if (base === 0) return businessData.map(()=>0);

    return businessData.map(d =>
        ((d[key] - base) / base) * 100
    );
}

/* ================= CORE CHARTS ================= */

function renderCoreCharts() {

    revenueChart?.destroy();
    profitChart?.destroy();
    expenseChart?.destroy();

    const labels = businessData.map(d =>
        d.date.toISOString().slice(0,7)
    );

    const mode = getDisplayMode();

    const revenueData = mode === "relative"
        ? normaliseSeries("revenue")
        : businessData.map(d=>d.revenue);

    const profitData = mode === "relative"
        ? normaliseSeries("profit")
        : businessData.map(d=>d.profit);

    const expenseData = mode === "relative"
        ? normaliseSeries("expenses")
        : businessData.map(d=>d.expenses);

    revenueChart = createChart("revenueChart","line",labels,revenueData,"#22c55e","Revenue");
    profitChart = createChart("profitChart","line",labels,profitData,"#3b82f6","Profit");
    expenseChart = createChart("expenseChart","bar",labels,expenseData,"#ef4444","Expenses");
}

/* ================= CHART FACTORY ================= */

function createChart(id,type,labels,data,color,label){

    const canvas = document.getElementById(id);
    if (!canvas) return null;

    const mode = getDisplayMode();

    return new Chart(canvas.getContext("2d"),{
        type,
        data:{
            labels,
            datasets:[{
                label,
                data,
                borderColor:color,
                backgroundColor:type==="bar"?color:"transparent",
                tension:0.4
            }]
        },
        options:{
            responsive:true,
            maintainAspectRatio:false,
            scales:{
                y:{
                    beginAtZero:true,
                    ticks:{
                        callback: function(value){
                            return mode === "relative"
                                ? value + "%"
                                : "£" + value;
                        }
                    }
                }
            }
        }
    });
}

/* ================= FORECASTS ================= */

function renderForecasts() {

    if (businessData.length < 3) return;

    const first = businessData[0];
    const last = businessData[businessData.length - 1];

    const monthsDiff =
        (last.date.getFullYear() - first.date.getFullYear()) * 12 +
        (last.date.getMonth() - first.date.getMonth());

    if (monthsDiff <= 0 || first.revenue <= 0) return;

    let cagr = Math.pow(last.revenue / first.revenue, 1 / monthsDiff) - 1;

    // Revenue range sensitivity
    const range = document.getElementById("revenueRange")?.value;

    if (range === "micro") cagr *= 1.2;
    if (range === "small") cagr *= 1;
    if (range === "growing") cagr *= 0.9;
    if (range === "established") cagr *= 0.8;

    generateProjection("forecast6m",6,cagr);
    generateProjection("forecast1y",12,cagr);
    generateProjection("forecast3y",36,cagr);
    generateProjection("forecast5y",60,cagr);
}

function generateProjection(id, months, cagr) {

    forecastCharts[id]?.destroy();

    const last = businessData[businessData.length - 1];
    let revenue = last.revenue;
    let date = new Date(last.date);

    let labels = [];
    let data = [];

    for (let i=1;i<=months;i++){
        revenue *= (1 + cagr);
        date.setMonth(date.getMonth()+1);
        labels.push(date.toISOString().slice(0,7));
        data.push(Math.round(revenue));
    }

    const canvas = document.getElementById(id);
    if (!canvas) return;

    forecastCharts[id] = new Chart(canvas.getContext("2d"),{
        type:"line",
        data:{labels,datasets:[{label:"Projected Revenue",data,borderColor:"#f59e0b",tension:0.4}]},
        options:{responsive:true,maintainAspectRatio:false}
    });
}

/* ================= PERFORMANCE MATRIX ================= */

function renderPerformanceMatrix() {

    const volatility = calculateVolatility();
    const growth = calculateMonthlyGrowth();
    const margin = getMargin();

    const stabilityScore = Math.max(0,100-volatility);
    const growthScore = Math.min(Math.abs(growth)*5,100);
    const profitabilityScore = Math.min(margin*3,100);

    const composite = ((stabilityScore+growthScore+profitabilityScore)/3).toFixed(0);

    performanceBarChart?.destroy();

    const barCanvas = document.getElementById("performanceBarChart");
    if (barCanvas) {
        performanceBarChart = new Chart(barCanvas.getContext("2d"),{
            type:"bar",
            data:{
                labels:["Stability","Growth Strength","Profitability"],
                datasets:[{
                    data:[stabilityScore,growthScore,profitabilityScore],
                    backgroundColor:["#22c55e","#f59e0b","#8b5cf6"]
                }]
            },
            options:{scales:{y:{beginAtZero:true,max:100}}}
        });
    }

    const totalRevenue = sum("revenue");
    const totalExpenses = sum("expenses");
    const totalProfit = sum("profit");

    distributionPieChart?.destroy();

    const pieCanvas = document.getElementById("distributionPieChart");
    if (pieCanvas && totalRevenue > 0) {

        const expensePct = (totalExpenses/totalRevenue)*100;
        const profitPct = (totalProfit/totalRevenue)*100;

        distributionPieChart = new Chart(pieCanvas.getContext("2d"),{
            type:"pie",
            data:{
                labels:["Expenses (%)","Net Profit (%)"],
                datasets:[{
                    data:[expensePct,profitPct],
                    backgroundColor:["#ef4444","#22c55e"]
                }]
            }
        });
    }

    document.getElementById("businessHealthIndex").innerHTML =
        `Composite Business Health Index: ${composite} / 100`;

    document.getElementById("matrixInterpretation").innerHTML =
        "Composite score reflects aggregated performance across stability, growth strength and profitability resilience.";
}

/* ================= RISK ================= */

function renderRiskAssessment() {

    const volatility = calculateVolatility();
    const margin = getMargin();

    document.getElementById("stabilityRisk").innerHTML =
        volatility > 35 ? "Elevated" : "Low";

    document.getElementById("marginRisk").innerHTML =
        margin < 4 ? "Elevated" : margin < 8 ? "Moderate" : "Low";

    document.getElementById("liquidityRisk").innerHTML =
        margin > 5 ? "Stable" : "Constrained";
}

/* ================= HELPERS ================= */

function calculateMonthlyGrowth(){
    let rates=[];
    for(let i=1;i<businessData.length;i++){
        const prev=businessData[i-1].revenue;
        const curr=businessData[i].revenue;
        if(prev>0) rates.push((curr-prev)/prev);
    }
    if(!rates.length) return 0;
    return (rates.reduce((a,b)=>a+b,0)/rates.length)*100;
}

function calculateVolatility(){
    const revenues=businessData.map(d=>d.revenue);
    const mean=revenues.reduce((a,b)=>a+b,0)/revenues.length;
    if(mean===0) return 0;
    const variance=revenues.reduce((a,b)=>a+Math.pow(b-mean,2),0)/revenues.length;
    return (Math.sqrt(variance)/mean)*100;
}

function getMargin(){
    const totalRevenue=sum("revenue");
    const totalProfit=sum("profit");
    return totalRevenue>0?(totalProfit/totalRevenue)*100:0;
}

function sum(key){
    return businessData.reduce((a,b)=>a+(b[key]||0),0);
}

function formatCurrency(val){
    return "£"+Number(val).toLocaleString(undefined,{
        minimumFractionDigits:2,
        maximumFractionDigits:2
    });
}

/* ================= NAVIGATION ================= */

function showSection(sectionId,event){
    document.querySelectorAll(".page-section").forEach(sec=>sec.classList.remove("active-section"));
    document.getElementById(sectionId)?.classList.add("active-section");
    document.querySelectorAll(".sidebar li").forEach(li=>li.classList.remove("active"));
    if(event) event.target.classList.add("active");
}

function logout(){ location.reload(); }

function bindGlobalFunctions(){
    window.addData=addData;
    window.showSection=showSection;
    window.logout=logout;
}
