let businesses = {};
let currentBusiness = null;

let revenueChart = null;
let profitChart = null;
let customerChart = null;

function createBusiness() {
const name = document.getElementById("businessName").value.trim();
if (!name) {
alert("Enter business name");
return;
}

if (!businesses[name]) {
businesses[name] = [];
}

updateSelector();
document.getElementById("businessName").value = "";
}

function updateSelector() {
const selector = document.getElementById("businessSelector");
selector.innerHTML = "<option value=''>Select Business</option>";

Object.keys(businesses).forEach(name => {
const option = document.createElement("option");
option.value = name;
option.textContent = name;
selector.appendChild(option);
});
}

function loadBusiness() {
currentBusiness = document.getElementById("businessSelector").value;
renderDashboard();
}

function addData() {
if (!currentBusiness) {
alert("Select business first");
return;
}

const month = document.getElementById("month").value;
const revenue = Number(document.getElementById("revenue").value);
const expenses = Number(document.getElementById("expenses").value);
const customers = Number(document.getElementById("customers").value);

if (!month || revenue <= 0) {
alert("Enter valid month and revenue");
return;
}

const profit = revenue - expenses;

businesses[currentBusiness].push({
month,
revenue,
profit,
customers
});

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
const kpiDiv = document.getElementById("kpis");

const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
const totalProfit = data.reduce((sum, d) => sum + d.profit, 0);

kpiDiv.innerHTML =
"<p><strong>Total Revenue:</strong> £" + totalRevenue.toFixed(2) + "</p>" +
"<p><strong>Total Profit:</strong> £" + totalProfit.toFixed(2) + "</p>";
}

function renderCharts(data) {

if (revenueChart) revenueChart.destroy();
if (profitChart) profitChart.destroy();
if (customerChart) customerChart.destroy();

const months = data.map(d => d.month);

revenueChart = new Chart(
document.getElementById("revenueChart"),
{
type: "line",
data: {
labels: months,
datasets: [{
label: "Revenue",
data: data.map(d => d.revenue),
borderWidth: 2
}]
}
}
);

profitChart = new Chart(
document.getElementById("profitChart"),
{
type: "line",
data: {
labels: months,
datasets: [{
label: "Profit",
data: data.map(d => d.profit),
borderWidth: 2
}]
}
}
);

customerChart = new Chart(
document.getElementById("customerChart"),
{
type: "line",
data: {
labels: months,
datasets: [{
label: "Customers",
data: data.map(d => d.customers),
borderWidth: 2
}]
}
}
);
}
