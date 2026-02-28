let businesses = JSON.parse(localStorage.getItem("impactgrid")) || {};
let currentBusiness = null;

let chartRevenueProfit, chartForecast;

initSelector();

function createBusiness() {
    const name = document.getElementById("businessName").value.trim();
    if (!name) return alert("Enter business name");
    if (!businesses[name]) businesses[name] = [];
    save();
    initSelector();
    document.getElementById("businessName").value = "";
}

function initSelector() {
    const selector = document.getElementById("businessSelector");
    selector.innerHTML = "<option value=''>Select Business</option>";
    Object.keys(businesses).forEach(name => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        selector.appendChild(opt);
    });
}

function loadBusiness() {
    currentBusiness = document.getElementById("businessSelector").value;
    updateDashboard();
}

function addData() {
    if (!currentBusiness) return alert("Select business first");

    const month = document.getElementById("month").value;
    const revenue = +document.getElementById("revenue").value || 0;
    const expenses = +document.getElementById("expenses").value || 0;
    const fixedCosts = +document.getElementById("fixedCosts").value || 0;
    const customers = +document.getElementById("customers").value || 1;
    const marketing = +document.getElementById("marketing").value || 0;

    if (!month || revenue <= 0) return alert("Enter valid data");

    const profit = revenue - expenses;
    const margin = revenue ? (profit / revenue) * 100 : 0;
    const burn = profit - fixedCosts;

    businesses[currentBusiness].push({
        month, revenue, expenses, fixedCosts,
        customers, marketing, profit, margin, burn
    });

    save();
    updateDashboard();
}

function updateDashboard() {
    if (!currentBusiness) return;
    const data = businesses[currentBusiness];
    if (!data.length) return;

    renderStrategicPanel(data);
    renderCharts(data);
}

function renderStrategicPanel(data) {
    const panel = document.getElementById("strategyPanel");
    const rec = document.getElementById("recommendations");
    panel.innerHTML="";
    rec.innerHTML="";

    const growth = growthRate(data,"revenue");
    const burnRate = avg(data,"burn");
    const runway = burnRate<0 ? (10000/Math.abs(burnRate)).toFixed(1) : "Stable";

    const scalingIndex = growth>15?85:50;

    [["Revenue Growth",growth.toFixed(1)+"%"],
     ["Burn Rate",burnRate.toFixed(2)],
     ["Runway (months est.)",runway],
     ["Scaling Index",scalingIndex+"/100"]]
     .forEach(m=>{
        const div=document.createElement("div");
        div.className="kpi";
        div.innerHTML=`<h3>${m[0]}</h3><p>${m[1]}</p>`;
        panel.appendChild(div);
     });

    if(growth>10)
        rec.innerHTML="🚀 High growth trajectory detected.";
    else
        rec.innerHTML="⚠ Growth acceleration required.";
}

function renderCharts(data) {
    destroyCharts();

    const months=data.map(d=>d.month);
    const revenues=data.map(d=>d.revenue);

    chartRevenueProfit=new Chart(document.getElementById("chartRevenueProfit"),{
        type:"line",
        data:{
            labels:months,
            datasets:[
                {label:"Revenue",data:revenues,tension:0.3},
                {label:"Profit",data:data.map(d=>d.profit),tension:0.3}
            ]
        }
    });

    const forecast = forecastRevenue(data);
    const futureLabels = forecast.labels;
    const forecastData = forecast.values;

    chartForecast=new Chart(document.getElementById("chartForecast"),{
        type:"line",
        data:{
            labels:[...months,...futureLabels],
            datasets:[
                {
                    label:"Revenue (Historical)",
                    data:[...revenues,...Array(futureLabels.length).fill(null)],
                    tension:0.3
                },
                {
                    label:"Revenue Forecast (6 Months)",
                    data:[...Array(months.length).fill(null),...forecastData],
                    borderDash:[5,5],
                    tension:0.3
                }
            ]
        }
    });
}

function forecastRevenue(data){
    const growth=growthRate(data,"revenue")/100;
    let last=data[data.length-1].revenue;
    let values=[];
    let labels=[];
    for(let i=1;i<=6;i++){
        last=last*(1+growth);
        values.push(last);
        labels.push("Forecast "+i);
    }
    return {values,labels};
}

function destroyCharts(){
    if(chartRevenueProfit) chartRevenueProfit.destroy();
    if(chartForecast) chartForecast.destroy();
}

function avg(data,key){return data.reduce((a,b)=>a+b[key],0)/data.length;}
function growthRate(data,key){
    if(data.length<2)return 0;
    const last=data[data.length-1][key];
    const prev=data[data.length-2][key];
    if(prev===0)return 0;
    return ((last-prev)/prev)*100;
}
function save(){localStorage.setItem("impactgrid",JSON.stringify(businesses));}
