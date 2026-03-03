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
    renderCoreCharts();        // FIXED
    renderForecasts();
    renderPerformanceMatrix();
    renderRiskAssessment();
}

/* ================= CORE CHARTS (RESTORED) ================= */

function renderCoreCharts() {

    if (businessData.length === 0) return;

    revenueChart?.destroy();
    profitChart?.destroy();
    expenseChart?.destroy();

    const labels = businessData.map(d =>
        d.date.toISOString().slice(0,7)
    );

    revenueChart = createChart(
        "revenueChart",
        "line",
        labels,
        businessData.map(d=>d.revenue),
        "#22c55e",
        "Revenue"
    );

    profitChart = createChart(
        "profitChart",
        "line",
        labels,
        businessData.map(d=>d.profit),
        "#3b82f6",
        "Profit"
    );

    expenseChart = createChart(
        "expenseChart",
        "bar",
        labels,
        businessData.map(d=>d.expenses),
        "#ef4444",
        "Expenses"
    );
}

/* ================= CHART FACTORY ================= */

function createChart(id,type,labels,data,color,label){

    const canvas = document.getElementById(id);
    if (!canvas) return null;

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
            scales:{ y:{ beginAtZero:true } }
        }
    });
}

/* ================= BUSINESS AGE ================= */

function getBusinessAgeMonths() {

    const startDateInput = document.getElementById("businessStartDate")?.value;
    const reportingDateInput = document.getElementById("reportingDate")?.value;

    if (!startDateInput || !reportingDateInput) return 0;

    const start = new Date(startDateInput);
    const end = new Date(reportingDateInput);

    return (end.getFullYear() - start.getFullYear()) * 12 +
           (end.getMonth() - start.getMonth());
}

/* ================= LIFECYCLE ================= */

function renderLifecycle() {

    const container = document.getElementById("lifecycleClassification");
    if (!container) return;

    const age = getBusinessAgeMonths();
    const volatility = calculateVolatility();
    const growth = calculateMonthlyGrowth();

    let classification = "Early Operational Stage";

    if (age > 60 && volatility < 20) classification = "Mature Operational Phase";
    else if (growth > 5 && volatility < 25) classification = "Expansion Phase";
    else if (volatility > 40) classification = "At-Risk Phase";
    else if (age > 24) classification = "Stabilisation Phase";

    container.innerHTML = `<strong>Lifecycle Classification:</strong> ${classification}`;
}

/* ================= EXECUTIVE SUMMARY ================= */

function renderExecutiveSummary() {

    const container = document.getElementById("financialPositionSummary");
    const classificationContainer = document.getElementById("financialClassification");
    const commentaryContainer = document.getElementById("executiveCommentary");

    if (!container) return;

    const totalRevenue = sum("revenue");
    const totalProfit = sum("profit");
    const margin = getMargin();
    const growth = calculateMonthlyGrowth();
    const volatility = calculateVolatility();
    const age = getBusinessAgeMonths();

    container.innerHTML = `
        <p>Total Revenue (Period-to-Date): ${formatCurrency(totalRevenue)}</p>
        <p>Net Profit (Period-to-Date): ${formatCurrency(totalProfit)}</p>
        <p>Profit Margin: ${margin.toFixed(2)}%</p>
        <p>Average Monthly Growth: ${growth.toFixed(2)}%</p>
        <p>Revenue Volatility: ${volatility.toFixed(2)}%</p>
        <p>Business Age: ${age} months</p>
    `;

    let status = "Stable Growth Phase";

    if (volatility > 40) status = "Volatile Early Stage";
    if (margin < 5) status = "Margin Compression Risk";
    if (growth > 8) status = "Expansion Phase";

    classificationContainer.innerHTML = status;

    commentaryContainer.innerHTML =
        "Financial position reflects structural performance across revenue growth, margin efficiency and revenue variability. Continued monitoring of volatility and margin resilience is recommended.";
}

/* ================= INSIGHTS ================= */

function renderInsights() {

    const container = document.getElementById("insightEngine");
    if (!container) return;

    const volatility = calculateVolatility();

    let condition = "Revenue volatility remains within acceptable range.";
    let implication = "Cash flow predictability is stable.";
    let recommendation = "Maintain cost discipline and monitor growth sustainability.";

    if (volatility > 35) {
        condition = "Revenue volatility is elevated.";
        implication = "Income variability exceeds typical SME stability thresholds.";
        recommendation = "Strengthen recurring revenue streams and stabilise cost structure.";
    }

    container.innerHTML = `
        <p><strong>Condition:</strong> ${condition}</p>
        <p><strong>Meaning:</strong> ${implication}</p>
        <p><strong>Recommendation:</strong> ${recommendation}</p>
    `;
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

    const cagr = Math.pow(last.revenue / first.revenue, 1 / monthsDiff) - 1;

    generateProjection("forecast6m", 6, cagr);
    generateProjection("forecast1y", 12, cagr);
    generateProjection("forecast3y", 36, cagr);
    generateProjection("forecast5y", 60, cagr);
}

function generateProjection(id, months, cagr) {

    forecastCharts[id]?.destroy();

    const last = businessData[businessData.length - 1];
    let revenue = last.revenue;
    let date = new Date(last.date);

    let labels = [];
    let data = [];

    for (let i = 1; i <= months; i++) {
        revenue *= (1 + cagr);
        date.setMonth(date.getMonth() + 1);
        labels.push(date.toISOString().slice(0,7));
        data.push(Math.round(revenue));
    }

    const canvas = document.getElementById(id);
    if (!canvas) return;

    forecastCharts[id] = new Chart(canvas.getContext("2d"), {
        type: "line",
        data: { labels, datasets: [{ label: "Projected Revenue", data, borderColor:"#f59e0b", tension:0.4 }]},
        options: { responsive:true, maintainAspectRatio:false }
    });
}

/* ================= PERFORMANCE MATRIX ================= */

function renderPerformanceMatrix() {

    const volatility = calculateVolatility();
    const growth = calculateMonthlyGrowth();
    const margin = getMargin();

    const stabilityScore = Math.max(0, 100 - volatility);
    const growthScore = Math.min(Math.abs(growth)*5,100);
    const profitabilityScore = Math.min(margin*3,100);

    const composite = ((stabilityScore + growthScore + profitabilityScore)/3).toFixed(0);

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
            options:{ scales:{ y:{ beginAtZero:true,max:100 } } }
        });
    }

    const totalExpenses = sum("expenses");
    const totalProfit = sum("profit");

    distributionPieChart?.destroy();

    const pieCanvas = document.getElementById("distributionPieChart");
    if (pieCanvas) {
        distributionPieChart = new Chart(pieCanvas.getContext("2d"),{
            type:"pie",
            data:{
                labels:["Expenses","Net Profit"],
                datasets:[{
                    data:[totalExpenses,totalProfit],
                    backgroundColor:["#ef4444","#22c55e"]
                }]
            }
        });
    }

    const health = document.getElementById("businessHealthIndex");
    if (health) health.innerHTML = `Composite Business Health Index: ${composite} / 100`;

    const interp = document.getElementById("matrixInterpretation");
    if (interp) interp.innerHTML =
        "Composite score reflects aggregated performance across stability, growth strength and profitability resilience.";
}

/* ================= RISK ================= */

function renderRiskAssessment() {

    const volatility = calculateVolatility();
    const margin = getMargin();

    const stability = document.getElementById("stabilityRisk");
    const marginEl = document.getElementById("marginRisk");
    const liquidity = document.getElementById("liquidityRisk");

    if (stability) stability.innerHTML = volatility > 35 ? "Elevated" : "Low";
    if (marginEl) marginEl.innerHTML = margin < 4 ? "Elevated" : margin < 8 ? "Moderate" : "Low";
    if (liquidity) liquidity.innerHTML = margin > 5 ? "Stable" : "Constrained";
}

/* ================= HELPERS ================= */

function calculateMonthlyGrowth() {
    let rates = [];
    for (let i=1;i<businessData.length;i++){
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

/* ================= NAVIGATION FIX ================= */

function showSection(sectionId, event) {
    document.querySelectorAll(".page-section").forEach(sec =>
        sec.classList.remove("active-section")
    );
    document.getElementById(sectionId)?.classList.add("active-section");

    document.querySelectorAll(".sidebar li").forEach(li =>
        li.classList.remove("active")
    );

    if (event) event.target.classList.add("active");
}

function logout() {
    location.reload();
}

/* ================= GLOBAL BIND ================= */

function bindGlobalFunctions(){
    window.addData = addData;
    window.showSection = showSection;
    window.logout = logout;
}
