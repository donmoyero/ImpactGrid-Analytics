let businesses = JSON.parse(localStorage.getItem("impactgrid")) || {};
let currentBusiness = null;

let revenueProfitChart;
let expenseChart;
let marginChart;
let customerChart;

const createBtn = document.getElementById("createBtn");
const addBtn = document.getElementById("addBtn");
const selector = document.getElementById("businessSelector");

init();

function init() {
populateSelector();

createBtn.addEventListener("click", createBusiness);
addBtn.addEventListener("click", addData);
selector.addEventListener("change", loadBusiness);
}

function createBusiness() {
const name = document.getElementById("businessName").value.trim();
if (!name) return alert("Enter business name");

if (!businesses[name]) businesses[name] = [];

save();
populateSelector();
document.getElementById("businessName").value = "";
}

function populateSelector() {
selector.innerHTML = "<option value=''>Select Business</option>";

Object.keys(businesses).forEach(name => {
const option = document.createElement("option");
option.value = name;
option.textContent = name;
selector.appendChild(option);
});
}

function loadBusiness() {
currentBusiness = selector.value;
renderDashboard();
}

function addData() {
if (!currentBusiness) return alert("Select business first");

const month = document.getElementById("month").value;
const revenue = Number(document.getElementById("revenue").value);
const expenses = Number(document.getElementById("expenses").value);
const fixedCosts = Number(document.getElementById("fixedCosts").value);
const customers = Number(document.getElementById("customers").value);

if (!month || revenue <= 0) return alert("Enter valid month and revenue");

const profit = revenue - expenses;
const margin = (profit / revenue) * 100;

businesses[currentBusiness].push({
month,
revenue,
expenses,
fixedCosts,
customers,
profit,
margin
});

save();
renderDashboard();
}

function renderDashboard() {
if (!currentBusiness) return;
const data = businesses[currentBusiness];
if (!data || data.length === 0) return;

renderKPIs(data);
renderCharts(data);
}

function renderKPIs(data) {
const container = document.getElementById("kpis");
container.innerHTML = "";

const totalRevenue = sum(data, "revenue");
const totalProfit = sum(data, "profit");
const avgMargin = average(data, "margin");

[
["Total Revenue", "£" + totalRevenue.toFixed(2)],
["Total Profit", "£" + totalProfit.toFixed(2)],
["Average Margin", avgMargin.toFixed(1) + "%"]
].forEach(item => {
const div = document.createElement("div");
div.className = "kpi";
div.innerHTML = `<div>${item[0]}</div><div>${item[1]}</div>`;
container.appendChild(div);
});
}

function renderCharts(data) {
destroyCharts();

const months = data.map(d => d.month);

revenueProfitChart = new Chart(
document.getElementById("revenueProfitChart"),
{
type: "line",
data: {
labels: months,
datasets: [
{
label: "Revenue",
data: data.map(d => d.revenue),
borderWidth: 3,
tension: 0.3
},
{
label: "Profit",
data: data.map(d => d.profit),
borderWidth: 3,
tension: 0.3
}
]
},
options: { responsive: true }
}
);

expenseChart = new Chart(
document.getElementById("expenseChart"),
{
type: "bar",
data: {
labels: months,
datasets: [
{
label: "Operational Expenses",
data: data.map(d => d.expenses)
},
{
label: "Fixed Costs",
data: data.map(d => d.fixedCosts)
}
]
},
options: {
responsive: true,
scales: {
x: { stacked: true },
y: { stacked: true }
}
}
}
);

marginChart = new Chart(
document.getElementById("marginChart"),
{
type: "line",
data: {
labels: months,
datasets: [
{
label: "Profit Margin (%)",
data: data.map(d => d.margin),
tension: 0.3
}
]
}
}
);

customerChart = new Chart(
document.getElementById("customerChart"),
{
type: "line",
data: {
labels: months,
datasets: [
{
label: "Customers",
data: data.map(d => d.customers),
tension: 0.3
}
]
}
}
);
}

function destroyCharts() {
if (revenueProfitChart) revenueProfitChart.destroy();
if (expenseChart) expenseChart.destroy();
if (marginChart) marginChart.destroy();
if (customerChart) customerChart.destroy();
}

function sum(data, key) {
return data.reduce((acc, item) => acc + item[key], 0);
}

function average(data, key) {
return sum(data, key) / data.length;
}

function save() {
localStorage.setItem("impactgrid", JSON.stringify(businesses));
}
