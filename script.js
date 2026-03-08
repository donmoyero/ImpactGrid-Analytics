/* ================= GLOBAL STATE ================= */

let businessData      = [];
let currentCurrency   = "GBP";

let revenueChart      = null;
let profitChart       = null;
let expenseChart      = null;
let performanceBarChart   = null;
let distributionPieChart  = null;
let aiForecastChart       = null;

let aiChatHistory     = [];
let lastAIInsightText = "";


/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", function() {
  bindGlobalFunctions();

  /* Restore theme preference */
  try {
    if (localStorage.getItem("ig-theme") === "light") toggleTheme(true);
  } catch(e) {}

  renderAIInsights();

  /* Init plan system after DOM ready */
  if (typeof initPlanSystem === "function") {
    initPlanSystem().then(function() {
      if (typeof buildAIMemoryContext === 'function') buildAIMemoryContext();
    });
  }

  // Close edit modal on Escape key
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") closeEditModal();
  });

  // Close modal on backdrop click
  var modal = document.getElementById("editModal");
  if (modal) {
    modal.addEventListener("click", function(e) {
      if (e.target === modal) closeEditModal();
    });
  }
});


/* ================= CURRENCY ================= */

function setCurrency(currency) {
  currentCurrency = currency;
  updateAll();
}

function formatCurrency(val) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currentCurrency
  }).format(val);
}


/* ================= ADD DATA ================= */

async function addData() {
  /* Data entry is always free and unlimited */

  var monthValue = document.getElementById("month").value;
  var revenue    = parseFloat(document.getElementById("revenue").value);
  var expenses   = parseFloat(document.getElementById("expenses").value);

  if (!monthValue || isNaN(revenue) || isNaN(expenses)) {
    alert("Please fill in the month, revenue, and expenses fields.");
    return;
  }

  // Duplicate month guard
  var exists = businessData.some(function(d) {
    return d.date.toISOString().slice(0, 7) === monthValue;
  });
  if (exists) {
    var warn = document.getElementById("duplicateWarning");
    if (warn) { warn.style.display = "block"; }
    alert("You have already entered data for " + monthValue + ". Use the Edit button in the table to update it.");
    return;
  }

  var date   = new Date(monthValue + "-01");
  var profit = revenue - expenses;

  businessData.push({ date: date, revenue: revenue, expenses: expenses, profit: profit });
  businessData.sort(function(a, b) { return a.date - b.date; });


  // Clear form
  document.getElementById("month").value    = "";
  document.getElementById("revenue").value  = "";
  document.getElementById("expenses").value = "";
  var warn = document.getElementById("duplicateWarning");
  if (warn) warn.style.display = "none";

  updateAll();
  if (typeof saveUserData === "function") saveUserData();
}


/* ================= DUPLICATE CHECK (live on month change) ================= */

function checkDuplicate() {
  var monthValue = document.getElementById("month").value;
  var warn = document.getElementById("duplicateWarning");
  if (!warn || !monthValue) return;

  var exists = businessData.some(function(d) {
    return d.date.toISOString().slice(0, 7) === monthValue;
  });
  warn.style.display = exists ? "block" : "none";
}


/* ================= MONTH STRING PARSER ================= */

function parseMonthString(str) {
  if (!str) return null;
  str = String(str).trim();

  // ISO format: 2024-01
  var iso = str.match(/^(20\d{2})[-\/](0?[1-9]|1[0-2])$/);
  if (iso) return iso[1] + "-" + iso[2].padStart(2,"0");

  // "January 2024" or "Jan 2024"
  var months = {jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12"};
  var named = str.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b[\s\-\/]*(20\d{2})\b/i);
  if (named) { return named[2] + "-" + months[named[1].toLowerCase().slice(0,3)]; }

  // "2024 January"
  var yearFirst = str.match(/\b(20\d{2})\b[\s\-\/]*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i);
  if (yearFirst) { return yearFirst[1] + "-" + months[yearFirst[2].toLowerCase().slice(0,3)]; }

  return null;
}


/* ================= FILE IMPORT ================= */

function handleFileImport(event) {
  var file   = event.target.files[0];
  var status = document.getElementById("importStatus");
  if (!file) return;

  var name = file.name.toLowerCase();
  if (status) {
    status.textContent = "Reading file…";
    status.style.color = "var(--text-secondary)";
  }

  if (name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".xls")) {
    importSpreadsheet(file, status);
  } else if (name.endsWith(".docx") || name.endsWith(".doc")) {
    importWordMammoth(file, status);
  } else if (name.endsWith(".pdf")) {
    importPDF(file, status);
  } else {
    if (status) {
      status.textContent = "Unsupported file type. Use .xlsx, .csv, .docx, or .pdf";
      status.style.color = "var(--danger)";
    }
  }
  /* Reset input so same file can be re-imported */
  event.target.value = "";
}

/* ── Shared: parse a row of data into businessData ── */
function tryImportRow(month, rev, exp) {
  var parsed = parseMonthString(String(month).trim());
  if (!parsed) return false;
  var r = parseFloat(String(rev).replace(/[£$€₦,\s]/g,""));
  var e = parseFloat(String(exp).replace(/[£$€₦,\s]/g,""));
  if (isNaN(r) || isNaN(e) || r < 0 || e < 0) return false;
  var exists = businessData.some(function(d) {
    return d.date.toISOString().slice(0,7) === parsed;
  });
  if (exists) return "duplicate";
  businessData.push({ date: new Date(parsed+"-01"), revenue: r, expenses: e, profit: r-e });
  return true;
}

/* ── Spreadsheet import (CSV / XLSX) ── */
function importSpreadsheet(file, statusEl) {
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var wb    = XLSX.read(e.target.result, { type: "binary" });
      var sheet = wb.Sheets[wb.SheetNames[0]];
      var rows  = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      var imported = 0, skipped = 0;

      rows.forEach(function(row) {
        var month = findCol(row, ["month","date","period","mo"]);
        var rev   = findCol(row, ["revenue","income","sales","turnover","gross income","total revenue"]);
        var exp   = findCol(row, ["expenses","costs","expenditure","outgoings","total expenses","spend"]);
        if (!month || rev === undefined || exp === undefined) return;
        var result = tryImportRow(month, rev, exp);
        if (result === true)          imported++;
        else if (result === "duplicate") skipped++;
      });

      businessData.sort(function(a,b){ return a.date - b.date; });
      updateAll();
      setImportStatus(statusEl, imported, skipped, "spreadsheet");
    } catch(err) {
      if (statusEl) { statusEl.textContent = "Error reading file: " + err.message; statusEl.style.color = "var(--danger)"; }
    }
  };
  reader.readAsBinaryString(file);
}

/* ── Word import using mammoth.js ── */
function importWordMammoth(file, statusEl) {
  if (typeof mammoth === "undefined") {
    if (statusEl) { statusEl.textContent = "Word import library not loaded. Please refresh."; statusEl.style.color = "var(--danger)"; }
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    mammoth.extractRawText({ arrayBuffer: e.target.result })
      .then(function(result) {
        var text = result.value;
        var imported = 0, skipped = 0;

        /* Strategy 1: line-by-line structured table rows */
        var lines = text.split(/\n/);
        lines.forEach(function(line) {
          line = line.trim();
          if (!line) return;
          /* Match: "January 2024   12,500   8,200" or tab-separated */
          var monthRx = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*[\s\-\/]?\s*(20\d{2})\b/i;
          var isoRx   = /\b(20\d{2})[-\/](0?[1-9]|1[0-2])\b/;
          var mMatch  = line.match(monthRx) || line.match(isoRx);
          if (!mMatch) return;
          var nums = line.replace(mMatch[0],"").match(/[\d,]+(?:\.\d+)?/g);
          if (!nums || nums.length < 2) return;
          var result = tryImportRow(mMatch[0], nums[0], nums[1]);
          if (result === true)          imported++;
          else if (result === "duplicate") skipped++;
        });

        /* Strategy 2: if nothing found, try consecutive number pairs near month names */
        if (imported === 0) {
          var fullRx = /\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+20\d{2}|20\d{2}[-\/]\d{1,2})\b[^\d]*([\d,]+(?:\.\d+)?)[^\d]+([\d,]+(?:\.\d+)?)/gi;
          var m;
          while ((m = fullRx.exec(text)) !== null) {
            var result = tryImportRow(m[1], m[2], m[3]);
            if (result === true)          imported++;
            else if (result === "duplicate") skipped++;
          }
        }

        businessData.sort(function(a,b){ return a.date - b.date; });
        updateAll();
        setImportStatus(statusEl, imported, skipped, "Word document");
      })
      .catch(function(err) {
        if (statusEl) { statusEl.textContent = "Error reading Word file: " + err.message; statusEl.style.color = "var(--danger)"; }
      });
  };
  reader.readAsArrayBuffer(file);
}

/* ── PDF import using PDF.js ── */
function importPDF(file, statusEl) {
  if (typeof pdfjsLib === "undefined") {
    if (statusEl) { statusEl.textContent = "PDF import library not loaded. Please refresh."; statusEl.style.color = "var(--danger)"; }
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    var loadingTask = pdfjsLib.getDocument({ data: e.target.result });
    loadingTask.promise.then(function(pdf) {
      var allText = "";
      var pagePromises = [];
      for (var p = 1; p <= pdf.numPages; p++) {
        pagePromises.push(
          pdf.getPage(p).then(function(page) {
            return page.getTextContent().then(function(tc) {
              return tc.items.map(function(i){ return i.str; }).join(" ");
            });
          })
        );
      }
      Promise.all(pagePromises).then(function(pages) {
        allText = pages.join("\n");
        var imported = 0, skipped = 0;

        /* Try same two strategies as Word */
        var lines = allText.split(/\n/);
        lines.forEach(function(line) {
          line = line.trim();
          if (!line) return;
          var monthRx = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*[\s\-\/]?\s*(20\d{2})\b/i;
          var isoRx   = /\b(20\d{2})[-\/](0?[1-9]|1[0-2])\b/;
          var mMatch  = line.match(monthRx) || line.match(isoRx);
          if (!mMatch) return;
          var nums = line.replace(mMatch[0],"").match(/[\d,]+(?:\.\d+)?/g);
          if (!nums || nums.length < 2) return;
          var result = tryImportRow(mMatch[0], nums[0], nums[1]);
          if (result === true)          imported++;
          else if (result === "duplicate") skipped++;
        });

        if (imported === 0) {
          var fullRx = /\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+20\d{2}|20\d{2}[-\/]\d{1,2})\b[^\d]*([\d,]+(?:\.\d+)?)[^\d]+([\d,]+(?:\.\d+)?)/gi;
          var m;
          while ((m = fullRx.exec(allText)) !== null) {
            var result = tryImportRow(m[1], m[2], m[3]);
            if (result === true)          imported++;
            else if (result === "duplicate") skipped++;
          }
        }

        businessData.sort(function(a,b){ return a.date - b.date; });
        updateAll();
        setImportStatus(statusEl, imported, skipped, "PDF");
      });
    }).catch(function(err) {
      if (statusEl) { statusEl.textContent = "Error reading PDF: " + err.message; statusEl.style.color = "var(--danger)"; }
    });
  };
  reader.readAsArrayBuffer(file);
}

/* ── Status message helper ── */
function setImportStatus(statusEl, imported, skipped, source) {
  if (!statusEl) return;
  if (imported > 0) {
    var msg = "✓ Imported " + imported + " month" + (imported !== 1 ? "s" : "") + " from " + source;
    if (skipped > 0) msg += "  ·  " + skipped + " skipped (duplicate)";
    statusEl.textContent = msg;
    statusEl.style.color = "var(--success)";
  } else {
    statusEl.textContent = "⚠ No financial data found. Make sure your file has Month, Revenue, and Expenses columns.";
    statusEl.style.color = "var(--warning)";
  }
}

/* ── Column finder helper ── */
function findCol(row, keys) {
  var rowKeys = Object.keys(row);
  for (var k = 0; k < keys.length; k++) {
    for (var r = 0; r < rowKeys.length; r++) {
      if (rowKeys[r].toLowerCase().replace(/[^a-z]/g,"").indexOf(keys[k].replace(/[^a-z]/g,"")) !== -1) {
        return row[rowKeys[r]];
      }
    }
  }
  return undefined;
}


/* ================= EDIT MODAL ================= */

function openEditModal(index) {
  var record = businessData[index];
  if (!record) return;

  document.getElementById("editIndex").value   = index;
  document.getElementById("editModalTitle").textContent = record.date.toISOString().slice(0, 7);
  document.getElementById("editRevenue").value  = record.revenue;
  document.getElementById("editExpenses").value = record.expenses;

  var modal = document.getElementById("editModal");
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";

  // Focus first input
  setTimeout(function() { document.getElementById("editRevenue").focus(); }, 50);
}

function closeEditModal() {
  var modal = document.getElementById("editModal");
  modal.style.display = "none";
  document.body.style.overflow = "";
}

function saveEdit() {
  var index    = parseInt(document.getElementById("editIndex").value);
  var revenue  = parseFloat(document.getElementById("editRevenue").value);
  var expenses = parseFloat(document.getElementById("editExpenses").value);

  if (isNaN(revenue) || isNaN(expenses)) {
    alert("Please enter valid numbers for revenue and expenses.");
    return;
  }

  businessData[index].revenue  = revenue;
  businessData[index].expenses = expenses;
  businessData[index].profit   = revenue - expenses;

  closeEditModal();
  updateAll();
}

function deleteRecord() {
  var index = parseInt(document.getElementById("editIndex").value);
  var record = businessData[index];
  if (!record) return;

  if (confirm("Delete record for " + record.date.toISOString().slice(0,7) + "? This cannot be undone.")) {
    businessData.splice(index, 1);
    closeEditModal();
    updateAll();
  }
}


/* ================= MASTER UPDATE ================= */

function updateAll() {
  renderRecordsTable();
  updateProgressIndicator();
  renderCoreCharts();
  renderAIInsights();

  if (businessData.length >= 3) {
    renderPerformanceMatrix();
    renderRiskAssessment();
  }
}


/* ================= RECORDS TABLE ================= */

function renderRecordsTable() {
  var tbody = document.getElementById("recordsTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (businessData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:28px;font-family:monospace;font-size:12px;">No records yet — add your first month above</td></tr>';
    return;
  }

  businessData.forEach(function(record, index) {
    var profitColor = record.profit >= 0 ? "var(--success)" : "var(--danger)";
    var row = document.createElement("tr");
    row.innerHTML =
      "<td>" + record.date.toISOString().slice(0, 7) + "</td>" +
      "<td>" + formatCurrency(record.revenue) + "</td>" +
      "<td>" + formatCurrency(record.expenses) + "</td>" +
      '<td style="color:' + profitColor + ';font-weight:600;">' + formatCurrency(record.profit) + "</td>" +
      '<td style="text-align:center;">' +
        '<button onclick="openEditModal(' + index + ')" style="' +
          'background:var(--bg-mid);border:1px solid var(--border-mid);border-radius:6px;' +
          'color:var(--gold);font-size:11px;font-family:monospace;padding:4px 10px;cursor:pointer;' +
          'transition:background 0.15s;" ' +
          'onmouseenter="this.style.background=\'var(--gold-glow)\'" ' +
          'onmouseleave="this.style.background=\'var(--bg-mid)\'">&#9998; Edit</button>' +
      "</td>";
    tbody.appendChild(row);
  });
}


/* ================= PROGRESS INDICATOR ================= */

function updateProgressIndicator() {
  var progress = document.getElementById("dataProgress");
  if (!progress) return;

  var count = businessData.length;

  if (count < 3) {
    progress.innerHTML = count + " / 3 months entered &nbsp;&middot;&nbsp; Add " + (3 - count) + " more month" + (3 - count !== 1 ? "s" : "") + " to activate ImpactGrid Insights";
  } else {
    progress.innerHTML = '<span style="color:var(--success);">&#9679;</span> &nbsp;' + count + ' months recorded &nbsp;&middot;&nbsp; <strong style="color:var(--gold-light);">ImpactGrid Insights Active</strong>';
  }
}


/* ================= CORE CHARTS ================= */

function renderCoreCharts() {
  var labels = businessData.map(function(d) { return d.date.toISOString().slice(0, 7); });

  if (revenueChart)  { revenueChart.destroy();  revenueChart  = null; }
  if (profitChart)   { profitChart.destroy();   profitChart   = null; }
  if (expenseChart)  { expenseChart.destroy();  expenseChart  = null; }

  revenueChart = createStyledChart("revenueChart", "line", labels,
    businessData.map(function(d) { return d.revenue; }),
    "Revenue", "rgba(200,169,110,0.9)", "rgba(200,169,110,0.08)");

  profitChart = createStyledChart("profitChart", "line", labels,
    businessData.map(function(d) { return d.profit; }),
    "Profit / Loss", "rgba(45,212,160,0.9)", "rgba(45,212,160,0.08)");

  expenseChart = createStyledChart("expenseChart", "bar", labels,
    businessData.map(function(d) { return d.expenses; }),
    "Expenses", "rgba(255,77,109,0.85)", "rgba(255,77,109,0.08)");
}

function createStyledChart(id, type, labels, data, label, color, fillColor) {
  var canvas = document.getElementById(id);
  if (!canvas) return null;

  var isBar = (type === "bar");

  return new Chart(canvas, {
    type: type,
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: data,
        borderColor: color,
        backgroundColor: isBar ? color : fillColor,
        borderWidth: isBar ? 0 : 2,
        pointBackgroundColor: color,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: !isBar,
        borderRadius: isBar ? 6 : 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          labels: {
            color: "rgba(122,139,168,0.9)",
            font: { family: "monospace", size: 11 }
          }
        },
        tooltip: {
          backgroundColor: "#121729",
          borderColor: "#222b42",
          borderWidth: 1,
          titleColor: "#edf0f7",
          bodyColor: "#7a8ba8",
          padding: 12,
          callbacks: {
            label: function(ctx) { return " " + formatCurrency(ctx.raw); }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#3d4e68", font: { family: "monospace", size: 10 } },
          grid:  { color: "rgba(26,32,53,0.8)" }
        },
        y: {
          ticks: {
            color: "#3d4e68",
            font: { family: "monospace", size: 10 },
            callback: function(val) { return formatCurrency(val); }
          },
          grid: { color: "rgba(26,32,53,0.8)" }
        }
      }
    }
  });
}


/* ================= AI FORECAST ================= */

async function generateAIProjection(years) {
  if (businessData.length < 3) return;

  /* Check forecast plan limit */
  if (typeof canUse === "function") {
    var ok = await canUse("forecasts");
    if (!ok) { if (typeof showLimitModal === "function") showLimitModal("forecasts"); return; }
  }

  var canvas      = document.getElementById("aiForecastChart");
  var explanation = document.getElementById("aiForecastExplanation");
  if (!canvas) return;

  if (aiForecastChart) { aiForecastChart.destroy(); aiForecastChart = null; }

  var growthRates = [];
  for (var i = 1; i < businessData.length; i++) {
    if (businessData[i - 1].revenue > 0) {
      growthRates.push((businessData[i].revenue - businessData[i - 1].revenue) / businessData[i - 1].revenue);
    }
  }

  var avgGrowth = growthRates.length > 0
    ? growthRates.reduce(function(a, b) { return a + b; }, 0) / growthRates.length
    : 0;

  var revenue = businessData[businessData.length - 1].revenue;
  var labels = [], base = [], optimistic = [], conservative = [];

  for (var y = 1; y <= years; y++) {
    revenue = revenue * Math.pow(1 + avgGrowth, 12);
    var b = Math.max(0, Math.round(revenue));
    labels.push("Year " + y);
    base.push(b);
    optimistic.push(Math.round(b * 1.15));
    conservative.push(Math.round(b * 0.85));
  }

  aiForecastChart = new Chart(canvas, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Optimistic (+15%)",
          data: optimistic,
          borderColor: "rgba(45,212,160,0.55)",
          backgroundColor: "transparent",
          borderDash: [5, 5],
          tension: 0.4,
          pointRadius: 3,
          borderWidth: 1.5
        },
        {
          label: "Base Projection",
          data: base,
          borderColor: "rgba(200,169,110,1)",
          backgroundColor: "rgba(200,169,110,0.06)",
          tension: 0.4,
          fill: true,
          pointBackgroundColor: "rgba(200,169,110,1)",
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 2.5
        },
        {
          label: "Conservative (-15%)",
          data: conservative,
          borderColor: "rgba(255,77,109,0.55)",
          backgroundColor: "transparent",
          borderDash: [5, 5],
          tension: 0.4,
          pointRadius: 3,
          borderWidth: 1.5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          labels: {
            color: "rgba(122,139,168,0.9)",
            font: { family: "monospace", size: 11 },
            boxWidth: 14,
            padding: 16
          }
        },
        tooltip: {
          backgroundColor: "#121729",
          borderColor: "#222b42",
          borderWidth: 1,
          titleColor: "#edf0f7",
          bodyColor: "#7a8ba8",
          padding: 12,
          callbacks: {
            label: function(ctx) { return " " + ctx.dataset.label + ": " + formatCurrency(ctx.raw); }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#3d4e68", font: { family: "monospace", size: 10 } },
          grid:  { color: "rgba(26,32,53,0.8)" }
        },
        y: {
          ticks: {
            color: "#3d4e68",
            font: { family: "monospace", size: 10 },
            callback: function(val) { return formatCurrency(val); }
          },
          grid: { color: "rgba(26,32,53,0.8)" }
        }
      }
    }
  });

  if (typeof incrementUsage === "function") incrementUsage("forecasts");

  if (explanation) {
    explanation.innerHTML =
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:16px;">' +
        tile("Optimistic", formatCurrency(optimistic[optimistic.length - 1]), "rgba(45,212,160,0.2)", "#2dd4a0") +
        tile("Base Projection", formatCurrency(base[base.length - 1]), "rgba(200,169,110,0.12)", "#c8a96e") +
        tile("Conservative", formatCurrency(conservative[conservative.length - 1]), "rgba(255,77,109,0.12)", "#ff4d6d") +
      "</div>";
  }
}

function tile(label, value, bg, color) {
  return '<div style="padding:14px 16px;background:' + bg + ';border:1px solid ' + color + '30;border-radius:8px;">' +
    '<div style="font-size:10px;font-family:monospace;color:' + color + ';letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">' + label + '</div>' +
    '<div style="font-size:15px;font-weight:700;color:' + color + ';">' + value + '</div>' +
  '</div>';
}


/* ================= AI INSIGHTS ================= */

function renderAIInsights() {
  var section = document.getElementById("aiInsights");
  if (!section) return;

  if (businessData.length < 1) {
    section.innerHTML = '<span style="color:var(--text-muted);font-size:12px;">Awaiting financial data — insights appear once records are entered.</span>';
    return;
  }

  var totalRevenue = sum("revenue");
  var totalProfit  = sum("profit");
  var margin       = getMargin();
  var growth       = calculateMonthlyGrowth();
  var volatility   = calculateVolatility();

  var anomalies    = ImpactGridAI.detectAnomalies(businessData);
  var anomalyHTML  = anomalies.length > 0
    ? '<p style="color:var(--warning);margin-top:12px;"><strong>&#9888; Anomalies:</strong> ' + anomalies.map(function(a) { return a.date.toISOString().slice(0,7); }).join(", ") + " showed unusual revenue patterns.</p>"
    : "";

  lastAIInsightText = "Total Revenue: " + formatCurrency(totalRevenue) +
    " | Total Profit: " + formatCurrency(totalProfit) +
    " | Profit Margin: " + margin.toFixed(2) + "%" +
    " | Growth: " + growth.toFixed(2) + "%" +
    " | Volatility: " + volatility.toFixed(2) + "%";

  var marginColor     = margin > 20    ? "var(--success)" : margin > 10 ? "var(--gold-light)" : "var(--danger)";
  var growthColor     = growth >= 0    ? "var(--success)" : "var(--danger)";
  var volatilityColor = volatility < 15 ? "var(--success)" : volatility < 30 ? "var(--warning)" : "var(--danger)";

  section.innerHTML =
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;">' +
      metricTile("Total Revenue",  formatCurrency(totalRevenue), "var(--gold-light)") +
      metricTile("Total Profit",   formatCurrency(totalProfit),  totalProfit >= 0 ? "var(--success)" : "var(--danger)") +
      metricTile("Profit Margin",  margin.toFixed(2) + "%",      marginColor) +
      metricTile("Revenue Growth", growth.toFixed(2) + "%",      growthColor) +
      metricTile("Volatility",     volatility.toFixed(2) + "%",  volatilityColor) +
    "</div>" +
    (anomalyHTML ? '<div style="margin-top:14px;">' + anomalyHTML + "</div>" : "");
}

function metricTile(label, value, color) {
  return '<div style="padding:14px 16px;background:var(--bg-mid);border:1px solid var(--border);border-radius:8px;">' +
    '<div style="font-size:10px;font-family:monospace;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">' + label + "</div>" +
    '<div style="font-size:16px;font-weight:700;color:' + color + ';">' + value + "</div>" +
  "</div>";
}


/* ================= PERFORMANCE MATRIX ================= */

function renderPerformanceMatrix() {
  var volatility = calculateVolatility();
  var growth     = calculateMonthlyGrowth();
  var margin     = getMargin();

  // Clean 0–100 scores
  var stabilityScore = Math.min(100, Math.max(0, parseFloat((100 - volatility).toFixed(1))));
  var growthScore    = Math.min(100, Math.max(0, parseFloat(Math.min(growth, 100).toFixed(1))));
  var profitScore    = Math.min(100, Math.max(0, parseFloat(Math.min(margin * 2, 100).toFixed(1))));

  // Destroy old charts safely
  if (performanceBarChart)  { performanceBarChart.destroy();  performanceBarChart  = null; }
  if (distributionPieChart) { distributionPieChart.destroy(); distributionPieChart = null; }

  // ── HORIZONTAL BAR CHART ──
  var barCanvas = document.getElementById("performanceBarChart");
  if (barCanvas) {
    performanceBarChart = new Chart(barCanvas, {
      type: "bar",
      data: {
        labels: ["Stability Index", "Growth Score", "Profit Score"],
        datasets: [
          {
            label: "Score",
            data: [stabilityScore, growthScore, profitScore],
            backgroundColor: ["rgba(45,212,160,0.85)", "rgba(200,169,110,0.85)", "rgba(61,127,255,0.85)"],
            borderWidth: 0,
            borderRadius: 6,
            barThickness: 28
          },
          {
            label: "Remaining",
            data: [100 - stabilityScore, 100 - growthScore, 100 - profitScore],
            backgroundColor: "rgba(26,32,53,0.6)",
            borderWidth: 0,
            borderRadius: 6,
            barThickness: 28
          }
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#121729",
            borderColor: "#222b42",
            borderWidth: 1,
            titleColor: "#edf0f7",
            bodyColor: "#7a8ba8",
            padding: 12,
            filter: function(item) { return item.datasetIndex === 0; },
            callbacks: {
              label: function(ctx) { return " Score: " + ctx.raw.toFixed(1) + " / 100"; }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            max: 100,
            ticks: {
              color: "#3d4e68",
              font: { family: "monospace", size: 10 },
              callback: function(val) { return val + "%"; }
            },
            grid: { color: "rgba(26,32,53,0.8)" }
          },
          y: {
            stacked: true,
            ticks: { color: "#7a8ba8", font: { size: 12 } },
            grid: { display: false }
          }
        }
      }
    });
  }

  // ── GAUGE CANVASES (replace pie) ──
  var pieCanvas = document.getElementById("distributionPieChart");
  if (pieCanvas) {
    var container = pieCanvas.parentElement;
    pieCanvas.style.display = "none";

    var existing = container.querySelector(".gauge-grid");
    if (existing) existing.remove();

    container.insertAdjacentHTML("beforeend",
      '<div class="gauge-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:8px 0;">' +
        gaugeCard("stability", "Stability", stabilityScore, "#2dd4a0") +
        gaugeCard("growth",    "Growth",    growthScore,    "#c8a96e") +
        gaugeCard("profit",    "Profit",    profitScore,    "#3d7fff") +
      "</div>"
    );

    // Small delay to ensure DOM is painted before drawing on canvas
    setTimeout(function() {
      drawGauge("gauge-stability", stabilityScore, "#2dd4a0");
      drawGauge("gauge-growth",    growthScore,    "#c8a96e");
      drawGauge("gauge-profit",    profitScore,    "#3d7fff");
    }, 50);
  }

  // ── HEALTH SCORE ──
  var health = Math.min(100, Math.max(0, Math.round((stabilityScore + growthScore + profitScore) / 3)));
  var healthColor  = health >= 70 ? "#2dd4a0" : health >= 40 ? "#c8a96e" : "#ff4d6d";
  var healthBorder = health >= 70 ? "rgba(45,212,160,0.3)" : health >= 40 ? "rgba(200,169,110,0.3)" : "rgba(255,77,109,0.3)";
  var healthLabel  = health >= 70 ? "Healthy" : health >= 40 ? "Moderate" : "At Risk";

  setText("businessHealthIndex",
    '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">' +
      '<div style="padding:14px 22px;background:var(--bg-mid);border:1px solid ' + healthBorder + ';border-radius:8px;">' +
        '<div style="font-size:10px;font-family:monospace;color:var(--text-muted);letter-spacing:0.12em;text-transform:uppercase;margin-bottom:4px;">Business Health Score</div>' +
        '<div style="font-size:28px;font-weight:800;color:' + healthColor + ';line-height:1;">' + health + '<span style="font-size:14px;opacity:0.55;margin-left:2px;">/100</span></div>' +
        '<div style="font-size:11px;font-family:monospace;color:' + healthColor + ';margin-top:4px;letter-spacing:0.06em;">' + healthLabel + '</div>' +
      "</div>" +
      '<div style="font-size:12px;color:var(--text-secondary);max-width:360px;line-height:1.7;">Composite score based on revenue stability, growth trajectory, and profit margin. Updates in real time.</div>' +
    "</div>"
  );
}

function gaugeCard(id, label, score, color) {
  return '<div style="text-align:center;padding:12px 8px;background:var(--bg-mid);border:1px solid var(--border);border-radius:12px;">' +
    '<canvas id="gauge-' + id + '" width="120" height="80" style="display:block;margin:0 auto;"></canvas>' +
    '<div style="font-size:18px;font-weight:800;color:' + color + ';margin-top:4px;">' + score.toFixed(0) + '<span style="font-size:11px;opacity:0.45;margin-left:1px;">/100</span></div>' +
    '<div style="font-size:10px;font-family:monospace;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;margin-top:3px;">' + label + "</div>" +
  "</div>";
}

function drawGauge(canvasId, value, color) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  var w   = canvas.width;
  var h   = canvas.height;
  var cx  = w / 2;
  var cy  = h * 0.9;
  var r   = w * 0.38;

  ctx.clearRect(0, 0, w, h);

  // Track
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI);
  ctx.strokeStyle = "rgba(26,32,53,0.9)";
  ctx.lineWidth   = 10;
  ctx.lineCap     = "round";
  ctx.stroke();

  // Value arc
  var endAngle = Math.PI + (value / 100) * Math.PI;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, endAngle);
  ctx.strokeStyle = color;
  ctx.lineWidth   = 10;
  ctx.lineCap     = "round";
  ctx.shadowColor = color;
  ctx.shadowBlur  = 10;
  ctx.stroke();
  ctx.shadowBlur  = 0;
}


/* ================= RISK ASSESSMENT ================= */

function renderRiskAssessment() {
  var volatility = calculateVolatility();
  var margin     = getMargin();

  var stabilityLevel = volatility > 30 ? "Elevated" : volatility > 15 ? "Moderate" : "Low";
  var marginLevel    = margin < 10     ? "Elevated" : margin < 20     ? "Moderate" : "Low";
  var liquidityLevel = margin > 5      ? "Stable"   : "Weak";

  function riskColor(level) {
    return level === "Low" || level === "Stable" ? "#2dd4a0" : level === "Moderate" ? "#f5a623" : "#ff4d6d";
  }

  setText("stabilityRisk",
    '<span style="color:' + riskColor(stabilityLevel) + ';font-weight:700;">' + stabilityLevel + '</span>' +
    '<span style="color:var(--text-muted);font-size:12px;margin-left:10px;">Volatility: ' + volatility.toFixed(1) + '%</span>'
  );
  setText("marginRisk",
    '<span style="color:' + riskColor(marginLevel) + ';font-weight:700;">' + marginLevel + '</span>' +
    '<span style="color:var(--text-muted);font-size:12px;margin-left:10px;">Margin: ' + margin.toFixed(1) + '%</span>'
  );
  setText("liquidityRisk",
    '<span style="color:' + riskColor(liquidityLevel) + ';font-weight:700;">' + liquidityLevel + '</span>'
  );

  var insight = "Operational risk is currently within manageable bounds.";
  if (volatility > 30) insight = "High revenue volatility detected — consider diversifying income streams to improve stability.";
  if (margin < 10)     insight += " Profit margin is under pressure; a cost structure review is recommended.";
  if (volatility <= 15 && margin >= 20) insight = "Strong financial health — revenue is stable and margins are healthy.";

  setText("riskInsight", insight);
}


/* ================= AI CHAT ================= */

async function askImpactGridAI() {
  /* Check analyses limit */
  if (typeof canUse === "function") {
    var ok = await canUse("analyses");
    if (!ok) { showLimitModal("analyses"); return; }
  }
  var input  = document.getElementById("aiChatInput");
  var output = document.getElementById("aiChatOutput");
  if (!input || !output) return;

  var question = input.value.trim();
  if (question === "") return;

  output.innerHTML += '<div class="ai-user">' + question + "</div>";
  input.value = "";
  output.scrollTop = output.scrollHeight;

  aiChatHistory.push({ role: "user", content: question });

  var typingId = "typing-" + Date.now();
  output.innerHTML += '<div class="ai-response" id="' + typingId + '"><span class="ai-typing">ImpactGrid AI is thinking<span class="dots">...</span></span></div>';
  output.scrollTop = output.scrollHeight;

  /* Build AI memory from past reports */
  var memoryPrefix = window.aiMemoryContext ? window.aiMemoryContext + "\n\nCURRENT SESSION:\n" : "";
  var questionWithMemory = memoryPrefix ? memoryPrefix + question : question;
  var response = await ImpactGridAI.analyze(questionWithMemory, businessData, currentCurrency, aiChatHistory);

  var typingEl = document.getElementById(typingId);
  if (typingEl) typingEl.remove();

  output.innerHTML += '<div class="ai-response">' + response + "</div>";
  output.scrollTop = output.scrollHeight;

  var tmp = document.createElement("div");
  tmp.innerHTML = response;
  lastAIInsightText = tmp.innerText || tmp.textContent || lastAIInsightText;

  aiChatHistory.push({ role: "ai", content: response });
  if (typeof incrementUsage === "function") incrementUsage("analyses");
}

function fillAIChat(text) {
  var input = document.getElementById("aiChatInput");
  if (input) {
    input.value = text;
    input.focus();
    askImpactGridAI();
  }
}


/* ================= PDF ENGINE ================= */

function generatePDF() {
  /* Collect metadata */
  var _totalRev = businessData.reduce(function(s,d){return s+d.revenue;},0);
  var _totalExp = businessData.reduce(function(s,d){return s+d.expenses;},0);
  var _totalPro = businessData.reduce(function(s,d){return s+d.profit;},0);
  var _insightEl = document.getElementById("aiInsights");
  var _insightText = _insightEl ? (_insightEl.innerText || _insightEl.textContent || "") : "";
  var _healthScore = Math.round(Math.min(100, Math.max(0, _totalRev > 0 ? (_totalPro/_totalRev)*100 + 50 : 50)));
  var _pdfMeta = {
    healthScore:   _healthScore,
    monthsCount:   businessData.length,
    totalRevenue:  Math.round(_totalRev),
    totalExpenses: Math.round(_totalExp),
    totalProfit:   Math.round(_totalPro),
    aiInsights:    _insightText.substring(0, 500)
  };

  if (businessData.length === 0) {
    alert("Add at least one month of data before generating a report.");
    return;
  }

  var jsPDF = window.jspdf.jsPDF;
  var doc   = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  var W = 210, H = 297, mg = 16;
  var cur = currentCurrency || "£";

  /* ── Helpers ── */
  function rgb(hex) {
    var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return [r,g,b];
  }
  var C = {
    bg:       [6,8,15],
    bgMid:    [10,13,24],
    bgCard:   [14,18,32],
    bgCard2:  [18,23,42],
    gold:     [200,169,110],
    goldLt:   [226,201,138],
    green:    [45,212,160],
    red:      [255,77,109],
    blue:     [68,136,255],
    textPri:  [237,240,247],
    textSec:  [160,176,204],
    textMut:  [61,78,104],
    border:   [26,32,53]
  };

  function setF(col) { doc.setFillColor(col[0],col[1],col[2]); }
  function setD(col) { doc.setDrawColor(col[0],col[1],col[2]); }
  function setT(col) { doc.setTextColor(col[0],col[1],col[2]); }

  function rect(x,y,w,h,col,mode) {
    setF(col); doc.rect(x,y,w,h,mode||"F");
  }
  function rrect(x,y,w,h,col,r,stroke) {
    setF(col);
    if(stroke){ setD(stroke); doc.setLineWidth(0.2); doc.roundedRect(x,y,w,h,r||2,r||2,"FD"); }
    else doc.roundedRect(x,y,w,h,r||2,r||2,"F");
  }
  function rule(y,col,lw) {
    setD(col||C.border); doc.setLineWidth(lw||0.2); doc.line(mg,y,W-mg,y);
  }
  function label(txt,x,y,sz,col,style) {
    doc.setFontSize(sz||8); doc.setFont("helvetica",style||"normal"); setT(col||C.textSec);
    doc.text(txt,x,y);
  }
  function fmt(n) {
    if(Math.abs(n)>=1000000) return cur+(n/1000000).toFixed(1)+"M";
    if(Math.abs(n)>=1000) return cur+(n/1000).toFixed(1)+"K";
    return cur+Math.round(n).toLocaleString();
  }
  function wrap(txt,maxW) {
    return doc.splitTextToSize(txt, maxW);
  }

  /* ── PAGE 1: Cover ── */
  rect(0,0,W,H,C.bg);
  // Gold top bar
  rect(0,0,W,1.5,C.gold);
  // Left accent stripe
  rect(0,0,4,H,C.bgCard);
  rect(0,0,4,60,C.gold);

  // Big background text watermark
  doc.setFontSize(95); doc.setFont("helvetica","bold");
  setT([10,14,26]); doc.text("IG",W-60,H-20);

  // Logo area
  rrect(mg+6,18,52,14,C.bgCard2,2,C.border);
  label("IMPACTGRID",mg+10,27,11,C.gold,"bold");
  label("ANALYTICS",mg+10,32,6,C.textMut,"normal");

  // Divider
  setD(C.gold); doc.setLineWidth(0.4); doc.line(mg+6,38,90,38);

  // Main title
  doc.setFontSize(26); doc.setFont("helvetica","bold"); setT(C.textPri);
  doc.text("Financial",mg+6,54);
  doc.setFontSize(26); setT(C.gold);
  doc.text("Intelligence",mg+6,63);
  doc.setFontSize(26); setT(C.textPri);
  doc.text("Report",mg+6,72);

  label("IFSRM v3.0  ·  Regime-Dependent Stability Modelling for SMEs",mg+6,80,7,C.textMut);

  // Cover metrics cards
  var cards = [
    { label:"HEALTH SCORE", value:_healthScore+"/100", col:_healthScore>=70?C.green:_healthScore>=40?C.gold:C.red },
    { label:"TOTAL REVENUE", value:fmt(_totalRev), col:C.blue },
    { label:"NET PROFIT",    value:fmt(_totalPro),  col:_totalPro>=0?C.green:C.red },
    { label:"MONTHS",        value:businessData.length, col:C.goldLt }
  ];
  var cardY = 96, cardW = (W-mg*2-12)/4, cardH = 22;
  cards.forEach(function(c,i){
    var cx = mg + i*(cardW+4);
    rrect(cx,cardY,cardW,cardH,C.bgCard2,3,C.border);
    // top accent line
    setF(c.col); doc.roundedRect(cx,cardY,cardW,1,0.5,0.5,"F");
    label(c.label,cx+4,cardY+7,6,C.textMut,"bold");
    doc.setFontSize(11); doc.setFont("helvetica","bold"); setT(c.col);
    doc.text(String(c.value),cx+4,cardY+16);
  });

  // Report meta
  var metaY = 128;
  rrect(mg,metaY,W-mg*2,32,C.bgCard,3,C.border);
  label("REPORT DETAILS",mg+6,metaY+8,7,C.gold,"bold");
  rule(metaY+11,C.border,0.15);
  var metaItems = [
    ["Generated",   new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})],
    ["Currency",    cur],
    ["Data Period", businessData.length > 0 ? businessData[0].month+" – "+businessData[businessData.length-1].month : "—"],
    ["Plan",        (window.currentPlan||"analyst").charAt(0).toUpperCase()+(window.currentPlan||"analyst").slice(1)],
    ["Platform",    "impactgridanalytics.com"]
  ];
  metaItems.forEach(function(m,i){
    var col = i < 3 ? mg+6 : mg+90;
    var row = i < 3 ? metaY+17+(i*6) : metaY+17+((i-3)*6);
    label(m[0]+":",col,row,7,C.textMut);
    label(m[1],col+30,row,7,C.textPri,"bold");
  });

  // AI Insight teaser on cover
  if (_insightText.length > 10) {
    var insY = 170;
    rrect(mg,insY,W-mg*2,38,C.bgCard2,3,C.border);
    setF(C.gold); doc.roundedRect(mg,insY,3,38,1.5,1.5,"F");
    label("AI ANALYSIS SUMMARY",mg+8,insY+8,7,C.gold,"bold");
    rule(insY+11,[26,32,53],0.15);
    var teaser = _insightText.substring(0,280)+"...";
    var tLines = wrap(teaser, W-mg*2-14);
    doc.setFontSize(7.5); doc.setFont("helvetica","normal"); setT(C.textSec);
    tLines.slice(0,4).forEach(function(l,i){ doc.text(l,mg+8,insY+18+(i*5.5)); });
  }

  // Footer
  rect(0,H-12,W,12,C.bgCard);
  rule(H-12,C.border,0.15);
  label("ImpactGrid Analytics  ·  IFSRM v3.0  ·  Confidential Financial Report",mg,H-5,7,C.textMut);
  label("Page 1",W-mg-8,H-5,7,C.textMut);

  /* ── PAGE 2: Executive Summary + Monthly Table ── */
  doc.addPage();
  rect(0,0,W,H,C.bg);
  rect(0,0,W,1.5,C.gold);
  rect(0,0,4,H,C.bgCard);

  // Page header
  rrect(mg,8,W-mg*2,14,C.bgCard,2,C.border);
  label("IMPACTGRID",mg+5,17,8,C.gold,"bold");
  label("  ·  FINANCIAL INTELLIGENCE REPORT  ·  IFSRM v3.0",mg+30,17,7,C.textMut);
  label(new Date().toLocaleDateString("en-GB"),W-mg-28,17,7,C.textMut);

  // Section: Executive Summary
  var y2 = 30;
  label("01  EXECUTIVE SUMMARY",mg,y2,9,C.goldLt,"bold");
  rule(y2+2,C.gold,0.3);
  y2 += 8;

  // KPI row
  var kpis = [
    {label:"Total Revenue",   val:fmt(_totalRev),  sub:"Gross inflow",  col:C.blue},
    {label:"Total Expenses",  val:fmt(_totalExp),  sub:"Gross outflow", col:C.red},
    {label:"Net Profit",      val:fmt(_totalPro),  sub:_totalPro>=0?"Surplus":"Deficit", col:_totalPro>=0?C.green:C.red},
    {label:"Profit Margin",   val:(_totalRev>0?((_totalPro/_totalRev)*100).toFixed(1):0)+"%", sub:"Net margin", col:C.goldLt},
    {label:"Avg Monthly Rev", val:fmt(_totalRev/Math.max(1,businessData.length)), sub:"Per month", col:C.blue},
    {label:"Health Score",    val:_healthScore+"/100", sub:_healthScore>=70?"Stable":_healthScore>=40?"Moderate":"At Risk", col:_healthScore>=70?C.green:_healthScore>=40?C.gold:C.red}
  ];
  var kw=(W-mg*2-10)/3, kh=18, kpadsY=y2;
  kpis.forEach(function(k,i){
    var kx=mg+(i%3)*(kw+5), ky=kpadsY+Math.floor(i/3)*(kh+3);
    rrect(kx,ky,kw,kh,C.bgCard2,2,C.border);
    setF(k.col); doc.roundedRect(kx,ky,kw,0.8,0.4,0.4,"F");
    label(k.label,kx+4,ky+6,6,C.textMut,"bold");
    doc.setFontSize(10); doc.setFont("helvetica","bold"); setT(k.col);
    doc.text(String(k.val),kx+4,ky+13);
    label(k.sub,kx+kw-doc.getTextWidth(k.sub)-3,ky+13,6,C.textMut);
  });
  y2 += kh*2 + 10;

  // Monthly data table
  label("02  MONTHLY BREAKDOWN",mg,y2,9,C.goldLt,"bold");
  rule(y2+2,C.gold,0.3);
  y2 += 8;

  // Table header
  var cols = [
    {label:"MONTH",    x:mg+2,   w:36},
    {label:"REVENUE",  x:mg+40,  w:32},
    {label:"EXPENSES", x:mg+74,  w:32},
    {label:"PROFIT",   x:mg+108, w:30},
    {label:"MARGIN",   x:mg+140, w:22},
    {label:"TREND",    x:mg+164, w:18}
  ];
  rect(mg,y2,W-mg*2,8,C.bgCard2);
  setD(C.border); doc.setLineWidth(0.2);
  doc.rect(mg,y2,W-mg*2,8,"S");
  cols.forEach(function(c){ label(c.label,c.x,y2+5.5,6.5,C.gold,"bold"); });
  y2 += 8;

  businessData.forEach(function(d,i){
    var rowH = 7;
    if(y2 + rowH > H-15){ 
      // new page
      doc.addPage(); rect(0,0,W,H,C.bg); rect(0,0,W,1.5,C.gold); rect(0,0,4,H,C.bgCard);
      y2 = 20;
    }
    var rowBg = i%2===0 ? C.bgCard : C.bg;
    rect(mg,y2,W-mg*2,rowH,rowBg);
    var margin = d.revenue > 0 ? ((d.profit/d.revenue)*100).toFixed(1) : "0.0";
    var profCol = d.profit>=0 ? C.green : C.red;
    var trend = i===0 ? "—" : (d.revenue > businessData[i-1].revenue ? "▲" : d.revenue < businessData[i-1].revenue ? "▼" : "–");
    var trendCol = i===0 ? C.textMut : (d.revenue > businessData[i-1].revenue ? C.green : d.revenue < businessData[i-1].revenue ? C.red : C.textMut);

    label(d.month,          cols[0].x, y2+5, 7.5, C.textPri, "bold");
    label(fmt(d.revenue),   cols[1].x, y2+5, 7.5, C.blue);
    label(fmt(d.expenses),  cols[2].x, y2+5, 7.5, C.red);
    label(fmt(d.profit),    cols[3].x, y2+5, 7.5, profCol, "bold");
    label(margin+"%",       cols[4].x, y2+5, 7.5, C.textSec);
    label(trend,            cols[5].x, y2+5, 8,   trendCol, "bold");
    y2 += rowH;
  });

  // Totals row
  rect(mg,y2,W-mg*2,8,C.bgCard2);
  setF(C.gold); doc.roundedRect(mg,y2,W-mg*2,0.5,0,0,"F");
  var totMargin = _totalRev>0 ? ((_totalPro/_totalRev)*100).toFixed(1) : "0.0";
  label("TOTAL / AVERAGE", cols[0].x, y2+5.5, 7, C.gold, "bold");
  label(fmt(_totalRev),   cols[1].x, y2+5.5, 7, C.blue,  "bold");
  label(fmt(_totalExp),   cols[2].x, y2+5.5, 7, C.red,   "bold");
  label(fmt(_totalPro),   cols[3].x, y2+5.5, 7, _totalPro>=0?C.green:C.red, "bold");
  label(totMargin+"%",    cols[4].x, y2+5.5, 7, C.goldLt,"bold");
  y2 += 14;

  // Footer pg2
  rect(0,H-12,W,12,C.bgCard); rule(H-12,C.border,0.15);
  label("ImpactGrid Analytics  ·  IFSRM v3.0  ·  Confidential Financial Report",mg,H-5,7,C.textMut);
  label("Page 2",W-mg-8,H-5,7,C.textMut);

  /* ── PAGE 3: AI Insights + Risk Analysis ── */
  doc.addPage();
  rect(0,0,W,H,C.bg);
  rect(0,0,W,1.5,C.gold);
  rect(0,0,4,H,C.bgCard);

  rrect(mg,8,W-mg*2,14,C.bgCard,2,C.border);
  label("IMPACTGRID",mg+5,17,8,C.gold,"bold");
  label("  ·  AI INTELLIGENCE & RISK ANALYSIS",mg+30,17,7,C.textMut);

  var y3 = 30;
  label("03  AI FINANCIAL ANALYSIS",mg,y3,9,C.goldLt,"bold");
  rule(y3+2,C.gold,0.3);
  y3 += 8;

  // AI insights box
  if (_insightText.length > 10) {
    var insBoxH = Math.min(90, 16 + Math.ceil(_insightText.length/85)*5);
    rrect(mg,y3,W-mg*2,insBoxH,C.bgCard2,3,C.border);
    setF(C.gold); doc.roundedRect(mg,y3,3,insBoxH,1.5,1.5,"F");
    label("ImpactGrid AI  ·  IFSRM Analysis",mg+7,y3+8,7.5,C.gold,"bold");
    rule(y3+11,[26,32,53],0.15);
    var insLines = wrap(_insightText, W-mg*2-14);
    doc.setFontSize(7.5); doc.setFont("helvetica","normal"); setT(C.textSec);
    var lineY = y3+17;
    insLines.forEach(function(l){
      if(lineY < y3+insBoxH-4){ doc.text(l,mg+7,lineY); lineY+=5; }
    });
    y3 += insBoxH + 6;
  }

  // Risk Assessment
  label("04  RISK ASSESSMENT",mg,y3,9,C.goldLt,"bold");
  rule(y3+2,C.gold,0.3);
  y3 += 8;

  var avgRev = _totalRev / Math.max(1,businessData.length);
  var avgExp = _totalExp / Math.max(1,businessData.length);
  var volatility = 0;
  if(businessData.length > 1){
    var mean = avgRev;
    var variance = businessData.reduce(function(s,d){return s+Math.pow(d.revenue-mean,2);},0)/businessData.length;
    volatility = Math.round(Math.sqrt(variance)/Math.max(1,mean)*100);
  }
  var burnRate = avgExp > 0 ? Math.round(_totalPro>0 ? 0 : Math.abs(_totalPro/avgExp)*30) : 0;
  var risks = [
    {label:"Revenue Volatility",  val:volatility+"%", level:volatility<15?"LOW":volatility<35?"MEDIUM":"HIGH", col:volatility<15?C.green:volatility<35?C.gold:C.red},
    {label:"Expense Ratio",       val:(_totalRev>0?((_totalExp/_totalRev)*100).toFixed(0):100)+"%", level:_totalExp/_totalRev<0.7?"LOW":_totalExp/_totalRev<0.9?"MEDIUM":"HIGH", col:_totalExp/_totalRev<0.7?C.green:_totalExp/_totalRev<0.9?C.gold:C.red},
    {label:"Profitability",       val:_totalPro>=0?"POSITIVE":"NEGATIVE", level:_totalPro>=0?"LOW":"HIGH", col:_totalPro>=0?C.green:C.red},
    {label:"Cash Flow Pressure",  val:_totalPro>=0?"Stable":"Monitor", level:_totalPro>=0?"LOW":"MEDIUM", col:_totalPro>=0?C.green:C.gold}
  ];
  var rw=(W-mg*2-6)/4;
  risks.forEach(function(r,i){
    var rx=mg+i*(rw+2);
    rrect(rx,y3,rw,24,C.bgCard2,2,C.border);
    setF(r.col); doc.roundedRect(rx,y3,rw,1,0.5,0.5,"F");
    label(r.label,rx+3,y3+7,6,C.textMut,"bold");
    doc.setFontSize(9); doc.setFont("helvetica","bold"); setT(r.col);
    doc.text(r.val,rx+3,y3+14);
    rrect(rx+3,y3+17,rw-6,5,r.col===C.green?[8,40,28]:r.col===C.gold?[40,32,8]:[40,8,20],1.5);
    label(r.level,rx+5,y3+20.5,6,[255,255,255],"bold");
  });
  y3 += 30;

  // Stability regime
  label("05  STABILITY REGIME",mg,y3,9,C.goldLt,"bold");
  rule(y3+2,C.gold,0.3);
  y3 += 8;

  var regime = _healthScore >= 70 ? "STABLE" : _healthScore >= 40 ? "TRANSITIONAL" : "DISTRESSED";
  var regimeCol = _healthScore >= 70 ? C.green : _healthScore >= 40 ? C.gold : C.red;
  var regimeDesc = _healthScore >= 70
    ? "Business demonstrates strong financial health. Revenue exceeds expenses with consistent profitability. Continue current strategy while exploring growth opportunities."
    : _healthScore >= 40
    ? "Business is in a transitional phase. Profitability is moderate with some volatility detected. Focus on expense optimisation and revenue diversification."
    : "Business shows signs of financial distress. Immediate action required to reduce expenses, improve cash flow, and strengthen revenue streams.";

  rrect(mg,y3,W-mg*2,30,C.bgCard2,3,C.border);
  setF(regimeCol); doc.roundedRect(mg,y3,W-mg*2,1,1.5,1.5,"F");
  doc.setFontSize(14); doc.setFont("helvetica","bold"); setT(regimeCol);
  doc.text(regime+" REGIME",mg+6,y3+11);
  label("IFSRM Classification  ·  Health Score: "+_healthScore+"/100",mg+6,y3+17,7,C.textMut);
  var descLines = wrap(regimeDesc, W-mg*2-12);
  doc.setFontSize(7.5); doc.setFont("helvetica","normal"); setT(C.textSec);
  descLines.forEach(function(l,i){ doc.text(l,mg+6,y3+22+(i*5)); });
  y3 += 36;

  // Recommendations
  label("06  STRATEGIC RECOMMENDATIONS",mg,y3,9,C.goldLt,"bold");
  rule(y3+2,C.gold,0.3);
  y3 += 8;

  var recs = _healthScore >= 70 ? [
    "Maintain current cost discipline — expense ratio is healthy.",
    "Explore reinvestment opportunities to compound revenue growth.",
    "Build a cash reserve of 3–6 months operating expenses.",
    "Consider scaling highest-margin products or services."
  ] : _healthScore >= 40 ? [
    "Identify and reduce the top 3 expense categories immediately.",
    "Set a monthly revenue target 10–15% above current average.",
    "Review pricing strategy — consider value-based pricing.",
    "Diversify revenue streams to reduce single-source dependency."
  ] : [
    "Conduct urgent expense audit — cut all non-essential costs.",
    "Prioritise cash-generating activities over growth investments.",
    "Seek financial advisory support or business mentorship.",
    "Model a break-even scenario and work backwards to achieve it."
  ];

  recs.forEach(function(rec,i){
    if(y3+9 > H-15){ doc.addPage(); rect(0,0,W,H,C.bg); rect(0,0,W,1.5,C.gold); rect(0,0,4,H,C.bgCard); y3=20; }
    rrect(mg,y3,W-mg*2,8,C.bgCard,2,C.border);
    setF(C.gold); doc.roundedRect(mg,y3,2,8,1,1,"F");
    label(String(i+1),mg+4,y3+5.5,7,C.gold,"bold");
    label(rec,mg+10,y3+5.5,7.5,C.textPri);
    y3 += 10;
  });

  // Footer pg3
  rect(0,H-12,W,12,C.bgCard); rule(H-12,C.border,0.15);
  label("ImpactGrid Analytics  ·  IFSRM v3.0  ·  Confidential — For Authorised Use Only",mg,H-5,7,C.textMut);
  label("Page 3",W-mg-8,H-5,7,C.textMut);

  /* ── PAGE 4: Back Cover ── */
  doc.addPage();
  rect(0,0,W,H,C.bg);
  rect(0,W/2,W/2,H,C.bgCard);
  rect(0,0,W,1.5,C.gold);
  rect(W/2,0,0.5,H,C.gold);

  // Left side
  doc.setFontSize(32); doc.setFont("helvetica","bold"); setT(C.gold);
  doc.text("Impact",mg,60);
  setT(C.textPri);
  doc.text("Grid",mg,75);
  label("Financial Intelligence · IFSRM v3.0",mg,85,8,C.textMut);

  setD(C.gold); doc.setLineWidth(0.4); doc.line(mg,92,80,92);

  label("This report was generated by the ImpactGrid",mg,102,8,C.textSec);
  label("Financial Stability Engine using regime-dependent",mg,109,8,C.textSec);
  label("modelling for SME financial analysis.",mg,116,8,C.textSec);

  label("impactgridanalytics.com",mg,135,9,C.gold,"bold");
  label("Powered by IFSRM v3.0 · Secured by Supabase",mg,143,7,C.textMut);
  label("© 2026 ImpactGrid Analytics",mg,151,7,C.textMut);

  // Right side
  var rx2 = W/2+mg;
  label("REPORT SUMMARY",rx2,40,8,C.gold,"bold");
  setD(C.gold); doc.setLineWidth(0.3); doc.line(rx2,43,W-mg,43);

  var sumItems = [
    ["Health Score",   _healthScore+"/100"],
    ["Total Revenue",  fmt(_totalRev)],
    ["Total Expenses", fmt(_totalExp)],
    ["Net Profit",     fmt(_totalPro)],
    ["Months Analysed",String(businessData.length)],
    ["Stability Regime", regime],
    ["Generated",      new Date().toLocaleDateString("en-GB")]
  ];
  sumItems.forEach(function(s,i){
    label(s[0],rx2,53+(i*10),7.5,C.textMut);
    label(s[1],rx2+40,53+(i*10),7.5,C.textPri,"bold");
  });

  // QR placeholder
  rrect(rx2,H-55,30,30,C.bgCard2,2,C.border);
  label("VISIT",rx2+7,H-28,7,C.textMut,"bold");
  label("ONLINE",rx2+5,H-23,7,C.textMut,"bold");

  label("impactgridanalytics.com",rx2+34,H-40,7,C.gold);
  label("Access your full dashboard,",rx2+34,H-34,6.5,C.textMut);
  label("AI insights, and report history",rx2+34,H-29,6.5,C.textMut);
  label("at any time online.",rx2+34,H-24,6.5,C.textMut);

  // Bottom gold bar
  rect(0,H-8,W,8,C.bgCard);
  rule(H-8,C.border,0.15);
  label("CONFIDENTIAL  ·  Generated by ImpactGrid IFSRM v3.0  ·  © 2026 ImpactGrid Analytics",mg,H-3,6.5,C.textMut);

  /* ── Save PDF to account ── */
  if (typeof savePDFToAccount === "function") {
    try {
      var _pdfBase64 = doc.output("datauristring").split(",")[1];
      savePDFToAccount(_pdfBase64, _pdfMeta);
    } catch(e) { console.error("PDF account save error:", e); }
  }

  doc.save("ImpactGrid_Report_" + new Date().toISOString().slice(0,10) + ".pdf");
}



/* ── PDF Import ── */
function importPDF(file, statusEl) {
  if (statusEl) { statusEl.textContent = "Reading PDF..."; statusEl.style.color = "var(--gold-light)"; }

  /* Use PDF.js if available, otherwise use text extraction */
  if (window.pdfjsLib) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var typedArray = new Uint8Array(e.target.result);
      window.pdfjsLib.getDocument(typedArray).promise.then(function(pdf) {
        var textPromises = [];
        for (var i = 1; i <= pdf.numPages; i++) {
          textPromises.push(pdf.getPage(i).then(function(page) {
            return page.getTextContent().then(function(tc) {
              return tc.items.map(function(item) { return item.str; }).join(" ");
            });
          }));
        }
        Promise.all(textPromises).then(function(pages) {
          var fullText = pages.join("\n");
          parsePDFText(fullText, statusEl);
        });
      }).catch(function(err) {
        if (statusEl) { statusEl.textContent = "Could not read PDF. Try copying data into the Excel template."; statusEl.style.color = "var(--danger)"; }
      });
    };
    reader.readAsArrayBuffer(file);
  } else {
    /* Load PDF.js dynamically */
    var script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = function() {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      importPDF(file, statusEl);
    };
    script.onerror = function() {
      if (statusEl) { statusEl.textContent = "PDF support unavailable. Please use Excel or CSV format."; statusEl.style.color = "var(--danger)"; }
    };
    document.head.appendChild(script);
  }
}

function parsePDFText(text, statusEl) {
  /* Try to extract financial data from PDF text */
  var lines  = text.split(/[\n\r]+/);
  var imported = 0, errors = 0;

  /* Look for patterns like: "January 2024  12500  8200" or "Jan-24: Revenue 12500 Expenses 8200" */
  var monthPattern = /(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[\s\-,]+(?:20)?[0-9]{2}/gi;

  lines.forEach(function(line) {
    var monthMatch = line.match(monthPattern);
    if (!monthMatch) return;

    var nums = line.match(/[0-9]{3,}(?:[,\.][0-9]+)*/g);
    if (!nums || nums.length < 2) return;

    var rev = parseFloat(nums[0].replace(/,/g,""));
    var exp = parseFloat(nums[1].replace(/,/g,""));
    if (isNaN(rev) || isNaN(exp)) return;

    var monthStr = monthMatch[0].replace(/[\-,]/g," ").replace(/\s+/g," ").trim();
    var parsed = parseMonthString(monthStr);
    if (!parsed) return;

    /* Check duplicate */
    var exists = businessData.some(function(d){ return d.month === parsed; });
    if (exists) return;

    businessData.push({ month: parsed, revenue: rev, expenses: exp, profit: rev - exp });
    imported++;
  });

  if (imported > 0) {
    businessData.sort(function(a,b){ return a.month.localeCompare(b.month); });
    renderTable(); updateChart(); updateMetrics(); saveUserData();
    if (statusEl) { statusEl.textContent = "✓ Imported " + imported + " months from PDF."; statusEl.style.color = "var(--success)"; }
    if (errors > 0 && statusEl) statusEl.textContent += " (" + errors + " rows skipped)";
  } else {
    if (statusEl) {
      statusEl.textContent = "Could not detect financial data in this PDF. For best results, use our Excel template.";
      statusEl.style.color = "var(--warning)";
    }
  }
}

/* ================= HELPERS ================= */

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.innerHTML = val;
}

function calculateMonthlyGrowth() {
  if (businessData.length < 2) return 0;
  var first = businessData[0].revenue;
  var last  = businessData[businessData.length - 1].revenue;
  return first > 0 ? ((last - first) / first) * 100 : 0;
}

function calculateVolatility() {
  if (businessData.length < 2) return 0;
  var revenues = businessData.map(function(d) { return d.revenue; });
  var mean     = revenues.reduce(function(a, b) { return a + b; }, 0) / revenues.length;
  var variance = revenues.reduce(function(a, b) { return a + Math.pow(b - mean, 2); }, 0) / revenues.length;
  return mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0;
}

function getMargin() {
  var revenue = sum("revenue");
  var profit  = sum("profit");
  return revenue > 0 ? (profit / revenue) * 100 : 0;
}

function sum(key) {
  return businessData.reduce(function(a, b) { return a + (b[key] || 0); }, 0);
}


/* ================= NAV ================= */

function showSection(section, event) {
  if (section === 'report') {
    if (typeof renderSavedPDFs === 'function') setTimeout(renderSavedPDFs, 150);
  }
  if (section === 'settings') {
    // Populate settings page with live user data
    var email = window.currentUser ? window.currentUser.email : '';
    var plan  = window.currentPlan || 'analyst';
    var cfg   = window.planConfig  ? window.planConfig[plan] : null;
    var initial = email ? email[0].toUpperCase() : 'U';

    var sa = document.getElementById('settingsAvatar');
    var se = document.getElementById('settingsEmail');
    var spb = document.getElementById('settingsPlanBadge');
    var spl = document.getElementById('settingsPlanLabel');

    if (sa)  sa.textContent  = initial;
    if (se)  se.textContent  = email;
    if (spb) { spb.textContent = cfg ? cfg.label : 'Basic'; spb.className = 'plan-badge plan-' + plan; }
    if (spl) spl.textContent = cfg ? cfg.label + (plan === 'analyst' ? ' (Free)' : plan === 'professional' ? ' — £8.99/mo' : ' — £13.99/mo') : 'Basic (Free)';

    // Mirror usage bar into settings
    var ub = document.getElementById('usageBar');
    var sub = document.getElementById('settingsUsageBar');
    if (ub && sub) sub.innerHTML = ub.innerHTML;
  }

  document.querySelectorAll(".page-section").forEach(function(s) {
    s.classList.remove("active-section");
  });
  var target = document.getElementById(section);
  if (target) target.classList.add("active-section");

  document.querySelectorAll(".sidebar li").forEach(function(li) {
    li.classList.remove("active");
  });
  if (event) {
    var li = event.target.closest ? event.target.closest("li") : event.target;
    if (li) li.classList.add("active");
  }

  // Sync bottom nav active state (settings=5, report=6)
  var sectionIndex = {"dashboard":0,"charts":1,"matrix":2,"risk":3,"ai":4,"settings":5,"report":6};
  var idx = sectionIndex[section];
  if (idx !== undefined) {
    var btns = document.querySelectorAll(".mob-nav-btn");
    btns.forEach(function(b) { b.classList.remove("active"); });
    if (btns[idx]) btns[idx].classList.add("active");
  }

  // Close mobile menu after navigation
  if (window.innerWidth <= 900) closeMobileMenu();

  window.scrollTo({ top: 0, behavior: "smooth" });
}


/* ================= SIDEBAR — DESKTOP ================= */

function toggleSidebar() {
  // Desktop only — on mobile we use the overlay system
  if (window.innerWidth <= 900) { toggleMobileMenu(); return; }

  var sidebar = document.getElementById("sidebar");
  if (!sidebar) return;

  sidebar.classList.toggle("collapsed");
  var isCollapsed = sidebar.classList.contains("collapsed");

  var tab = document.getElementById("sidebar-reopen-tab");

  if (isCollapsed) {
    if (!tab) {
      tab = document.createElement("button");
      tab.id = "sidebar-reopen-tab";
      tab.innerHTML = "&#9654;";
      tab.title = "Open sidebar";
      tab.style.cssText =
        "position:fixed;left:0;top:50%;transform:translateY(-50%);" +
        "width:22px;height:48px;background:#0e1220;" +
        "border:1px solid #222b42;border-left:none;" +
        "border-radius:0 6px 6px 0;color:#c8a96e;font-size:11px;" +
        "cursor:pointer;z-index:9999;display:flex;align-items:center;justify-content:center;";
      tab.onclick = function() { toggleSidebar(); };
      document.body.appendChild(tab);
    }
    tab.style.display = "flex";
  } else {
    if (tab) tab.style.display = "none";
  }
}


/* ================= MOBILE MENU ================= */

function toggleMobileMenu() {
  var sidebar   = document.getElementById("sidebar");
  var backdrop  = document.getElementById("mobileBackdrop");
  var btn       = document.getElementById("mobileMenuBtn");
  var closeBtn  = document.getElementById("sidebarCloseBtn");
  if (!sidebar) return;

  var isOpen = sidebar.classList.contains("mobile-open");
  if (isOpen) {
    closeMobileMenu();
  } else {
    sidebar.classList.add("mobile-open");
    if (backdrop) backdrop.classList.add("visible");
    if (btn)      btn.classList.add("open");
    if (closeBtn) closeBtn.style.display = "flex";
    document.body.style.overflow = "hidden";
  }
}

function closeMobileMenu() {
  var sidebar   = document.getElementById("sidebar");
  var backdrop  = document.getElementById("mobileBackdrop");
  var btn       = document.getElementById("mobileMenuBtn");
  var closeBtn  = document.getElementById("sidebarCloseBtn");

  if (sidebar)  sidebar.classList.remove("mobile-open");
  if (backdrop) backdrop.classList.remove("visible");
  if (btn)      btn.classList.remove("open");
  if (closeBtn) closeBtn.style.display = "none";
  document.body.style.overflow = "";
}

function mobileNav(section, el) {
  // Switch section
  document.querySelectorAll(".page-section").forEach(function(s) {
    s.classList.remove("active-section");
  });
  var target = document.getElementById(section);
  if (target) target.classList.add("active-section");

  // Update bottom nav active state
  document.querySelectorAll(".mob-nav-btn").forEach(function(b) {
    b.classList.remove("active");
  });
  if (el) el.classList.add("active");

  // Also sync sidebar active state
  document.querySelectorAll(".sidebar li").forEach(function(li) {
    li.classList.remove("active");
  });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
}


/* ================= THEME ================= */

function toggleTheme(isLight) {
  /* isLight = true means switching TO light mode */
  if (isLight === undefined) {
    isLight = !document.body.classList.contains("light-mode");
  }
  document.body.classList.toggle("light-mode", isLight);

  /* Sync all switches */
  var switches = document.querySelectorAll('.theme-switch input[type="checkbox"]');
  switches.forEach(function(sw) { sw.checked = isLight; });

  /* Update sidebar label */
  var icon  = document.getElementById("themeModeIcon");
  var label = document.getElementById("themeModeLabel");
  if (icon)  icon.textContent  = isLight ? "☀️" : "🌙";
  if (label) label.textContent = isLight ? "Light Mode" : "Dark Mode";

  /* Persist preference */
  try { localStorage.setItem("ig-theme", isLight ? "light" : "dark"); } catch(e) {}
}


/* ================= LOGOUT ================= */

async function logout() {
  if (window.supabaseClient) await window.supabaseClient.auth.signOut();
  window.location.href = "login.html";
}


/* ================= BIND GLOBALS ================= */

// Called immediately so inline onclick handlers work before DOMContentLoaded
function bindGlobalFunctions() {
  window.addData              = addData;
  window.setCurrency          = setCurrency;
  window.showSection          = showSection;
  window.logout               = logout;
  window.askImpactGridAI      = askImpactGridAI;
  window.fillAIChat           = fillAIChat;
  window.toggleTheme          = toggleTheme;
  window.toggleSidebar        = toggleSidebar;
  window.generatePDF          = generatePDF;
  window.generateAIProjection = generateAIProjection;
  window.checkDuplicate       = checkDuplicate;
  window.handleFileImport     = handleFileImport;
  window.openEditModal        = openEditModal;
  window.closeEditModal       = closeEditModal;
  window.saveEdit             = saveEdit;
  window.deleteRecord         = deleteRecord;
  window.toggleMobileMenu     = toggleMobileMenu;
  window.closeMobileMenu      = closeMobileMenu;
  window.mobileNav            = mobileNav;
  window.closeUpgradeModal    = closeUpgradeModal;
  window.showUpgradePrompt    = showUpgradePrompt;
  window.closeLimitModal      = closeLimitModal;
  window.handlePDFClick       = handlePDFClick;
  window.downloadSavedPDF     = downloadSavedPDF;
}

function closeUpgradeModal() {
  if (typeof window.closeUpgradeModal === "function" && window.closeUpgradeModal !== closeUpgradeModal) {
    window.closeUpgradeModal();
  } else {
    var modal = document.getElementById("upgradeModal");
    if (modal) modal.style.display = "none";
  }
}

/* All functions now defined — bind to window so inline onclick handlers work */
bindGlobalFunctions();
