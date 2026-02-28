let businesses = JSON.parse(localStorage.getItem("impactgrid")) || {};
let currentBusiness = null;
let chartMain;

initSelector();

function createBusiness(){
const name=document.getElementById("businessName").value.trim();
if(!name) return alert("Enter business name");
if(!businesses[name]) businesses[name]=[];
save();
initSelector();
}

function initSelector(){
const sel=document.getElementById("businessSelector");
sel.innerHTML="<option value=''>Select Business</option>";
Object.keys(businesses).forEach(name=>{
let o=document.createElement("option");
o.value=name;o.textContent=name;sel.appendChild(o);
});
}

function loadBusiness(){
currentBusiness=document.getElementById("businessSelector").value;
updateDashboard();
}

function addData(){
if(!currentBusiness) return alert("Select business first");

const month=document.getElementById("month").value;
const revenue=+document.getElementById("revenue").value||0;
const expenses=+document.getElementById("expenses").value||0;
const fixedCosts=+document.getElementById("fixedCosts").value||0;
const customers=+document.getElementById("customers").value||1;
const marketing=+document.getElementById("marketing").value||0;

if(!month||revenue<=0) return alert("Enter valid data");

const profit=revenue-expenses;
const margin=(profit/revenue)*100;
const burn=profit-fixedCosts;

businesses[currentBusiness].push({
month,revenue,expenses,fixedCosts,
customers,marketing,profit,margin,burn
});

save();
updateDashboard();
}

function updateDashboard(){
if(!currentBusiness) return;
const data=businesses[currentBusiness];
if(!data||data.length===0) return;

renderStrategicPanel(data);
renderChart(data);
generateInnovationStatement();
}

function renderStrategicPanel(data){
const panel=document.getElementById("strategicPanel");
const insights=document.getElementById("aiInsights");
panel.innerHTML="";insights.innerHTML="";

const growth=growthRate(data);
const avgMargin=avg(data,"margin");
const burnRate=avg(data,"burn");
const riskProbability=calculateRisk(data);
const anomaly=detectAnomaly(data);

[
["Growth Rate",growth.toFixed(1)+"%"],
["Average Margin",avgMargin.toFixed(1)+"%"],
["Risk Probability",riskProbability+"%"],
["Anomaly Detected",anomaly?"YES":"NO"]
].forEach(m=>{
let div=document.createElement("div");
div.className="kpi";
div.innerHTML=`<h3>${m[0]}</h3><p>${m[1]}</p>`;
panel.appendChild(div);
});

let benchmarkText = avgMargin>20 ?
"Above SME benchmark performance." :
"Below industry benchmark. Optimisation required.";

insights.innerHTML=`<p>${benchmarkText}</p>`;
}

function renderChart(data){
if(chartMain) chartMain.destroy();

const months=data.map(d=>d.month);
const revenues=data.map(d=>d.revenue);

let forecastData=[];
if(data.length>=2){
let growth=growthRate(data)/100;
let last=revenues[revenues.length-1];
for(let i=0;i<6;i++){
last=last*(1+growth);
forecastData.push(last);
}
}

chartMain=new Chart(document.getElementById("chartMain"),{
type:"line",
data:{
labels:[...months,...Array(6).fill("Forecast")],
datasets:[
{
label:"Revenue",
data:[...revenues,...Array(6).fill(null)]
},
{
label:"Forecast",
data:[...Array(months.length).fill(null),...forecastData],
borderDash:[5,5]
}
]
}
});
}

function detectAnomaly(data){
if(data.length<2) return false;
const last=data[data.length-1].revenue;
const prev=data[data.length-2].revenue;
return Math.abs(last-prev)/prev>0.5;
}

function calculateRisk(data){
const growth=growthRate(data);
const margin=avg(data,"margin");
let risk=50;
if(growth<0) risk+=20;
if(margin<10) risk+=20;
return Math.min(100,risk);
}

function exportPDF(){
const { jsPDF } = window.jspdf;
const doc=new jsPDF();
doc.text("ImpactGrid Investor Intelligence Report",20,20);
doc.text("Business: "+currentBusiness,20,30);
doc.save("ImpactGrid_Report.pdf");
}

function generateInnovationStatement(){
document.getElementById("innovationStatement").innerHTML=
"ImpactGrid leverages AI-driven predictive financial modelling, anomaly detection, and SME benchmarking to provide automated strategic intelligence for small and medium enterprises in the UK market.";
}

function growthRate(data){
if(data.length<2) return 0;
const last=data[data.length-1].revenue;
const prev=data[data.length-2].revenue;
if(prev===0) return 0;
return ((last-prev)/prev)*100;
}

function avg(data,key){
return data.reduce((a,b)=>a+b[key],0)/data.length;
}

function save(){
localStorage.setItem("impactgrid",JSON.stringify(businesses));
}
