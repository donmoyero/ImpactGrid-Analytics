let businesses = JSON.parse(localStorage.getItem("impactgrid")) || {};
let currentBusiness = null;

let chartRevenueProfit, chartMargin, chartCustomers;

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
    const cac = customers ? marketing / customers : 0;

    businesses[currentBusiness].push({
        month, revenue, expenses, fixedCosts,
        customers, marketing, profit, margin, cac
    });

    save();
    updateDashboard();
}

function updateDashboard() {
    if (!currentBusiness) return;
    const data = businesses[currentBusiness];
    if (!data.length) return;

    renderKPIs(data);
    renderStrategicPanel(data);
    renderCharts(data);
}

function renderKPIs(data) {
    const container = document.getElementById("kpis");
    container.innerHTML = "";

    const totalRevenue = sum(data, "revenue");
    const totalProfit = sum(data, "profit");
    const avgMargin = avg(data, "margin");

    [["Total Revenue","£"+totalRevenue.toFixed(2)],
     ["Total Profit","£"+totalProfit.toFixed(2)],
     ["Avg Margin",avgMargin.toFixed(1)+"%"]]
     .forEach(m=>{
        const div=document.createElement("div");
        div.className="kpi";
        div.innerHTML=`<h3>${m[0]}</h3><p>${m[1]}</p>`;
        container.appendChild(div);
     });
}

function renderStrategicPanel(data) {
    const panel = document.getElementById("strategyPanel");
    const rec = document.getElementById("recommendations");
    panel.innerHTML="";
    rec.innerHTML="";

    const margin = avg(data,"margin");
    const growth = growthRate(data,"revenue");
    const cac = avg(data,"cac");
    const profit = sum(data,"profit");

    let health = (margin*0.4)+(growth*0.3)+(profit>0?30:0);
    health = Math.max(0,Math.min(100,health));

    let failureRisk = 100 - health;
    let fundingReadiness = (margin>20?40:20)+(growth>10?40:20);
    let growthScore = growth>10?80:40;

    [["Business Health Score",health.toFixed(0)+"/100"],
     ["Failure Risk",failureRisk.toFixed(0)+"%"],
     ["Funding Readiness",fundingReadiness+"/100"],
     ["Growth Score",growthScore+"/100"]]
     .forEach(m=>{
        const div=document.createElement("div");
        div.className="kpi";
        div.innerHTML=`<h3>${m[0]}</h3><p>${m[1]}</p>`;
        panel.appendChild(div);
     });

    if (health < 50)
        rec.innerHTML="⚠ Strategic Warning: Improve profitability and growth immediately.";
    else
        rec.innerHTML="✅ Business strategically positioned for scale.";
}

function renderCharts(data) {
    destroyCharts();

    const months=data.map(d=>d.month);

    chartRevenueProfit=new Chart(document.getElementById("chartRevenueProfit"),{
        type:"line",
        data:{
            labels:months,
            datasets:[
                {label:"Revenue",data:data.map(d=>d.revenue),tension:0.3},
                {label:"Profit",data:data.map(d=>d.profit),tension:0.3}
            ]
        }
    });

    chartMargin=new Chart(document.getElementById("chartMargin"),{
        type:"line",
        data:{
            labels:months,
            datasets:[{label:"Profit Margin %",data:data.map(d=>d.margin),tension:0.3}]
        }
    });

    chartCustomers=new Chart(document.getElementById("chartCustomers"),{
        type:"line",
        data:{
            labels:months,
            datasets:[{label:"Customers",data:data.map(d=>d.customers),tension:0.3}]
        }
    });
}

function destroyCharts(){
    if(chartRevenueProfit) chartRevenueProfit.destroy();
    if(chartMargin) chartMargin.destroy();
    if(chartCustomers) chartCustomers.destroy();
}

function sum(data,key){return data.reduce((a,b)=>a+b[key],0);}
function avg(data,key){return sum(data,key)/data.length;}
function growthRate(data,key){
    if(data.length<2)return 0;
    const last=data[data.length-1][key];
    const prev=data[data.length-2][key];
    if(prev===0)return 0;
    return ((last-prev)/prev)*100;
}
function save(){localStorage.setItem("impactgrid",JSON.stringify(businesses));}
