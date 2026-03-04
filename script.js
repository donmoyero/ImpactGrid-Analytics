/* ================= GLOBAL STATE ================= */

let businessData = [];
let currentCurrency = "GBP";

let revenueChart = null;
let profitChart = null;
let expenseChart = null;

let forecastCharts = {};
let performanceBarChart = null;
let distributionPieChart = null;

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", async () => {
    bindGlobalFunctions();
    await loadUserData(); // ✅ ADDED
});

/* ================= SUPABASE LOAD ================= */

async function loadUserData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
        .from("financial_records")
        .select("*")
        .order("date", { ascending: true });

    if (error) {
        console.error(error);
        return;
    }

    businessData = data.map(d => ({
        date: new Date(d.date),
        revenue: d.revenue,
        expenses: d.expenses,
        profit: d.profit
    }));

    updateAll();
}

/* ================= CURRENCY ================= */

function setCurrency(currency){
    currentCurrency = currency;
    updateAll();
}

function formatCurrency(val){
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currentCurrency
    }).format(val);
}

/* ================= ADD DATA ================= */

async function addData() { // ✅ made async

    const monthValue = document.getElementById("month").value;
    const revenue = parseFloat(document.getElementById("revenue").value);
    const expenses = parseFloat(document.getElementById("expenses").value);

    if (!monthValue || isNaN(revenue) || isNaN(expenses)) {
        alert("Enter valid revenue and expense data.");
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // ✅ SAVE TO SUPABASE
    const { error } = await supabase
        .from("financial_records")
        .insert([{
            user_id: user.id,
            date: monthValue + "-01",
            revenue,
            expenses,
            profit
        }]);

    if (error) {
        console.error(error);
        alert("Error saving data.");
        return;
    }

    businessData.push({ date, revenue, expenses, profit });
    businessData.sort((a,b)=>a.date-b.date);

    updateAll();
}

/* ================= MASTER UPDATE ================= */

function updateAll() {

    if (businessData.length === 0) return;

    renderExecutiveSummary();
    renderLifecycle();
    renderCoreCharts();

    if (businessData.length >= 3) {
        renderFinancialStabilityAssessment();
        renderInsights();
        renderForecasts();
        renderPerformanceMatrix();
        renderRiskAssessment();
    } else {
        resetAdvancedSections();
    }
}

/* ================= (ALL YOUR ENGINE CODE REMAINS UNCHANGED BELOW) ================= */

/* KEEP EVERYTHING FROM resetAdvancedSections() DOWN EXACTLY AS YOU WROTE IT */

/* ================= NAVIGATION ================= */

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

/* ❌ REMOVED logout() — Supabase logout handled in index.html */

/* ================= GLOBAL BINDING ================= */

function bindGlobalFunctions(){
    window.addData = addData;
    window.showSection = showSection;
    window.setCurrency = setCurrency;
}
