document.addEventListener("DOMContentLoaded", function () {

  console.log("Impactgrid Loaded");

  let data = [];
  let revenueChart = null;
  let profitChart = null;

  const addBtn = document.getElementById("addBtn");
  const analyzeBtn = document.getElementById("analyzeBtn");

  addBtn.addEventListener("click", function () {

    const month = document.getElementById("month").value.trim();
    const revenue = parseFloat(document.getElementById("revenue").value);
    const costs = parseFloat(document.getElementById("costs").value);
    const marketing = parseFloat(document.getElementById("marketing").value) || 0;
    const customers = parseFloat(document.getElementById("customers").value) || 0;

    if (!month || isNaN(revenue) || isNaN(costs)) {
      alert("Please enter Month, Revenue and Costs.");
      return;
    }

    data.push({
      month,
      revenue,
      costs,
      marketing,
      customers
    });

    alert("Data added.");
  });

  analyzeBtn.addEventListener("click", function () {

    if (data.length === 0) {
      alert("Add data first.");
      return;
    }

    let totalRevenue = 0;
    let totalCosts = 0;
    let totalMarketing = 0;
    let totalCustomers = 0;

    data.forEach(d => {
      totalRevenue += d.revenue;
      totalCosts += d.costs;
      totalMarketing += d.marketing;
      totalCustomers += d.customers;
    });

    const totalProfit = totalRevenue - totalCosts;

    let growth = 0;
    if (data.length > 1 && data[0].revenue !== 0) {
      growth = ((data[data.length - 1].revenue - data[0].revenue) / data[0].revenue) * 100;
    }

    const cac = totalCustomers > 0 ? totalMarketing / totalCustomers : 0;

    document.getElementById("totalRevenue").textContent = "$" + totalRevenue.toFixed(2);
    document.getElementById("totalProfit").textContent = "$" + totalProfit.toFixed(2);
    document.getElementById("growth").textContent = growth.toFixed(2) + "%";
    document.getElementById("cac").textContent = "$" + cac.toFixed(2);

    const months = data.map(d => d.month);
    const revenues = data.map(d => d.revenue);
    const profits = data.map(d => d.revenue - d.costs);

    if (revenueChart) revenueChart.destroy();
    if (profitChart) profitChart.destroy();

    revenueChart = new Chart(document.getElementById("revenueChart"), {
      type: "line",
      data: {
        labels: months,
        datasets: [{
          label: "Revenue",
          data: revenues,
          borderWidth: 2
        }]
      }
    });

    profitChart = new Chart(document.getElementById("profitChart"), {
      type: "bar",
      data: {
        labels: months,
        datasets: [{
          label: "Profit",
          data: profits
        }]
      }
    });

  });

});
