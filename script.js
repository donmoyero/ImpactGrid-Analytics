let businessData = [];
let revenueChart = null;
let profitChart = null;

document.getElementById("addData").addEventListener("click", addData);
document.getElementById("runAnalysis").addEventListener("click", runAnalysis);

function addData() {
  const month = document.getElementById("month").value.trim();
  const revenue = parseFloat(document.getElementById("revenue").value);
  const costs = parseFloat(document.getElementById("costs").value);
  const marketing = parseFloat(document.getElementById("marketing").value);
  const customers = parseFloat(document.getElementById("customers").value);

  if (!month || isNaN(revenue) || isNaN(costs)) {
    alert("Please enter valid Month, Revenue and Costs.");
    return;
  }

  businessData.push({
    month,
    revenue,
    costs,
    marketing: marketing || 0,
    customers: customers || 0
  });

  alert("Data added successfully.");
  clearInputs();
}

function clearInputs() {
  document.getElementById("month").value = "";
  document.getElementById("revenue").value = "";
  document.getElementById("costs").value = "";
  document.getElementById("marketing").value = "";
  document.getElementById("customers").value = "";
}

function runAnalysis() {
  if (businessData.length === 0) {
    alert("Please add data first.");
    return;
  }

  const totalRevenue = businessData.reduce((sum, d) => sum + d.revenue, 0);
  const totalCosts = businessData.reduce((sum, d) => sum + d.costs, 0);
  const totalMarketing = businessData.reduce((sum, d) => sum + d.marketing, 0);
  const totalCustomers = businessData.reduce((sum, d) => sum + d.customers, 0);

  const totalProfit = totalRevenue - totalCosts;

  const growthRate = calculateGrowthRate();
  const cac = totalCustomers > 0 ? totalMarketing / totalCustomers : 0;

  document.getElementById("totalRevenue").textContent = "$" + totalRevenue.toFixed(2);
  document.getElementById("totalProfit").textContent = "$" + totalProfit.toFixed(2);
  document.getElementById("growthRate").textContent = growthRate.toFixed(2) + "%";
  document.getElementById("cac").textContent = "$" + cac.toFixed(2);

  renderCharts();
}

function calculateGrowthRate() {
  if (businessData.length < 2) return 0;

  const first = businessData[0].revenue;
  const last = businessData[businessData.length - 1].revenue;

  if (first === 0) return 0;

  return ((last - first) / first) * 100;
}

function renderCharts() {
  const months = businessData.map(d => d.month);
  const revenues = businessData.map(d => d.revenue);
  const profits = businessData.map(d => d.revenue - d.costs);

  if (revenueChart) revenueChart.destroy();
  if (profitChart) profitChart.destroy();

  const revenueCtx = document.getElementById("revenueChart").getContext("2d");
  const profitCtx = document.getElementById("profitChart").getContext("2d");

  revenueChart = new Chart(revenueCtx, {
    type: "line",
    data: {
      labels: months,
      datasets: [{
        label: "Revenue Trend",
        data: revenues,
        borderWidth: 2,
        tension: 0.3
      }]
    }
  });

  profitChart = new Chart(profitCtx, {
    type: "bar",
    data: {
      labels: months,
      datasets: [{
        label: "Monthly Profit",
        data: profits
      }]
    }
  });
}
