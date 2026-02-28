let dataset = [];
let filteredData = [];
let chart;

// Parse CSV
document.getElementById("fileInput").addEventListener("change", function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const text = event.target.result;
        dataset = parseCSV(text);
        filteredData = [...dataset];
        populateSelectors();
        generateSummary(filteredData);
    };

    reader.readAsText(file);
});

// Convert CSV to JSON
function parseCSV(text) {
    const rows = text.split("\n");
    const headers = rows[0].split(",");

    return rows.slice(1).map(row => {
        const values = row.split(",");
        let obj = {};
        headers.forEach((header, i) => {
            obj[header.trim()] = values[i]?.trim();
        });
        return obj;
    });
}

// Populate dropdowns
function populateSelectors() {
    const columns = Object.keys(dataset[0]);

    const selects = ["filterColumn", "groupColumn", "aggColumn"];
    selects.forEach(id => {
        const select = document.getElementById(id);
        select.innerHTML = "";
        columns.forEach(col => {
            const option = document.createElement("option");
            option.value = col;
            option.textContent = col;
            select.appendChild(option);
        });
    });
}

// Generate Summary
function generateSummary(data) {
    const summaryDiv = document.getElementById("summary");
    summaryDiv.innerHTML = `Total Records: ${data.length}<br>`;

    const numericColumns = Object.keys(data[0]).filter(col =>
        data.every(row => !isNaN(parseFloat(row[col])))
    );

    numericColumns.forEach(col => {
        const values = data.map(row => parseFloat(row[col]));
        const sum = values.reduce((a,b)=>a+b,0);
        const avg = sum / values.length;
        summaryDiv.innerHTML += `
            ${col} → Min: ${Math.min(...values)} |
            Max: ${Math.max(...values)} |
            Avg: ${avg.toFixed(2)}<br>
        `;
    });
}

// Filtering
function applyFilter() {
    const col = document.getElementById("filterColumn").value;
    const val = document.getElementById("filterValue").value;

    filteredData = dataset.filter(row =>
        row[col].toLowerCase().includes(val.toLowerCase())
    );

    generateSummary(filteredData);
}

// Aggregation
function aggregateData() {
    const groupCol = document.getElementById("groupColumn").value;
    const aggCol = document.getElementById("aggColumn").value;
    const func = document.getElementById("aggFunction").value;

    const grouped = {};

    filteredData.forEach(row => {
        const key = row[groupCol];
        const value = parseFloat(row[aggCol]);

        if (!grouped[key]) grouped[key] = [];
        if (!isNaN(value)) grouped[key].push(value);
    });

    let labels = [];
    let values = [];

    for (let key in grouped) {
        labels.push(key);
        if (func === "sum")
            values.push(grouped[key].reduce((a,b)=>a+b,0));
        else if (func === "avg")
            values.push(grouped[key].reduce((a,b)=>a+b,0)/grouped[key].length);
        else if (func === "count")
            values.push(grouped[key].length);
    }

    renderChart(labels, values);
}

// Chart
function renderChart(labels, values) {
    const ctx = document.getElementById("chartCanvas").getContext("2d");

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Analysis Result",
                data: values
            }]
        }
    });
}
