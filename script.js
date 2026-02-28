let rawData = [];
let chart;

document.getElementById("fileInput").addEventListener("change", handleFile);
document.getElementById("analyzeBtn").addEventListener("click", analyzeData);

function handleFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const text = e.target.result;
        parseCSV(text);
    };

    reader.readAsText(file);
}

function parseCSV(text) {
    const rows = text.split("\n").map(row => row.split(","));
    const headers = rows[0];
    rawData = rows.slice(1);

    const select = document.getElementById("columnSelect");
    select.innerHTML = '<option value="">Select Column</option>';

    headers.forEach((header, index) => {
        select.innerHTML += `<option value="${index}">${header}</option>`;
    });

    renderTable(headers, rawData);
}

function analyzeData() {
    const columnIndex = document.getElementById("columnSelect").value;
    if (!columnIndex) return;

    const values = rawData
        .map(row => parseFloat(row[columnIndex]))
        .filter(num => !isNaN(num));

    const count = values.length;
    const mean = values.reduce((a,b) => a+b, 0) / count;
    const sorted = [...values].sort((a,b) => a-b);
    const median = sorted[Math.floor(count/2)];

    document.getElementById("count").textContent = count;
    document.getElementById("mean").textContent = mean.toFixed(2);
    document.getElementById("median").textContent = median.toFixed(2);

    renderChart(values);
}

function renderChart(values) {
    const ctx = document.getElementById("chartCanvas");

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: values.map((_, i) => i + 1),
            datasets: [{
                label: "Values",
                data: values
            }]
        }
    });
}

function renderTable(headers, rows) {
    const table = document.getElementById("dataTable");
    table.innerHTML = "";

    let headerRow = "<tr>";
    headers.forEach(h => headerRow += `<th>${h}</th>`);
    headerRow += "</tr>";

    table.innerHTML += headerRow;

    rows.forEach(row => {
        let rowHTML = "<tr>";
        row.forEach(cell => rowHTML += `<td>${cell}</td>`);
        rowHTML += "</tr>";
        table.innerHTML += rowHTML;
    });
}
