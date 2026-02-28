let businessData = [];

let revenueChart;
let profitChart;

document.getElementById("addData").addEventListener("click", addData);
document.getElementById("analyze").addEventListener("click", analyze);

function addData() {
  const month = document.getElementById("month").value;
  const revenue = parseFloat(document.getElementById("revenue").value);
  const costs = parseFloat(document.getElementById("costs").value);
  const marketing = parseFloat(document.getElementById("marketing").value);
  const customers = parseFloat(document.getElementById("customers").value);

  if (!month || isNaN(revenue) || isNaN(costs)) return;

  businessData.push({
    month,
    revenue,
    costs,
    marketing,
    customers
  });

  alert("Data Added Successfully");
}

function analyze() {
  if (businessData.length === 0) return;

  const totalRevenue = businessData.reduce((a,b)=>a+b.revenue,0);
  const totalCosts = businessData.reduce((a,b)=>a+b.costs,0);
  const totalMarketing = businessData.reduce((a,b)=>a+b.marketing,0);
  const totalCustomers = businessData.reduce((a,b)=>a+b.customers,0);

  const totalProfit = totalRevenue - totalCosts;
  const growthRate = calculateGrowth();
  const cac = totalMarketing / totalCustomers;

  document.getElementById("totalRevenue").textContent = "$" + totalRevenue.toFixed(2);
  document.getElementById("totalProfit").textContent = "$" + totalProfit.toFixed(2);
  document.getElementById("growthRate").textContent = growthRate.toFixed(2) + "%";
  document.getElementById("cac").textContent = "$" + cac.toFixed(2);

  renderCharts();
}

function calculateGrowth() {
  if (businessData.length < 2) return 0;

  const first = businessData[0].revenue;
  const last = businessData[businessData.length - 1].revenue;

  return ((last - first) / first) * 100;
}

function renderCharts() {
  const months = businessData.map(d=>d.month);
  const revenues = businessData.map(d=>d.revenue);
  const profits = businessData.map(d=>d.revenue - d.costs);

  const ctx1 = document.getElementById("revenueChart");
  const ctx2 = document.getElementById("profitChart");

  if (revenueChart) revenueChart.destroy();
  if (profitChart) profitChart.destroy();

  revenueChart = new Chart(ctx1, {
    type: "line",
    data: {
      labels: months,
      datasets: [{
        label: "Revenue Trend",
        data: revenues
      }]
    }
  });

  profitChart = new Chart(ctx2, {
    type: "bar",
    data: {
      labels: months,
      datasets: [{
        label: "Profit by Month",
        data: profits
      }]
    }
  });
}
