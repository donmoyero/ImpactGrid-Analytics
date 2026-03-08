/* ================================================================
   IMPACTGRID PLAN SYSTEM v4.0 — plans.js
   - Rolling 30-day usage limits per user
   - Data persistence via Supabase
   - Report history
   - AI memory from past reports
   - Admin bypass
   - Trial banner
================================================================ */

const IMPACTGRID_ADMIN_ID = "303580e9-38c8-450b-90e0-82045e0b5c27";

const STRIPE_LINKS = {
  professional: "https://buy.stripe.com/aFa5kwaAg6Pedn64zC8N201",
  enterprise:   "https://buy.stripe.com/8x29AM23Ka1qbeY5DG8N200"
};

/* ── Plan definitions ── */
const PLAN_CONFIG = {
  analyst: {
    label:          "Basic",
    price:          "Free",
    color:          "#a0b0cc",
    entries:        Infinity,
    analyses:       3,
    pdfs:           3,
    forecasts:      3,
    reportHistory:  3,
    forecastYears:  0.5,
    fileImport:     false,
    matrix:         false,
    benchmarking:   false,
    dataMonths:     1,
    trialDays:      0
  },
  professional: {
    label:          "Professional",
    price:          "£8.99/mo",
    color:          "#e2c98a",
    entries:        Infinity,
    analyses:       20,
    pdfs:           20,
    forecasts:      20,
    reportHistory:  20,
    forecastYears:  3,
    fileImport:     true,
    matrix:         true,
    benchmarking:   false,
    dataMonths:     12,
    trialDays:      30
  },
  enterprise: {
    label:          "Enterprise Intelligence",
    price:          "£13.99/mo",
    color:          "#7eb3ff",
    entries:        Infinity,
    analyses:       Infinity,
    pdfs:           Infinity,
    forecasts:      Infinity,
    reportHistory:  Infinity,
    forecastYears:  10,
    fileImport:     true,
    matrix:         true,
    benchmarking:   true,
    dataMonths:     Infinity,
    trialDays:      30
  },
  admin: {
    label:          "Admin",
    price:          "Internal",
    color:          "#2dd4a0",
    entries:        Infinity,
    analyses:       Infinity,
    pdfs:           Infinity,
    forecasts:      Infinity,
    reportHistory:  Infinity,
    forecastYears:  10,
    fileImport:     true,
    matrix:         true,
    benchmarking:   true,
    dataMonths:     Infinity,
    trialDays:      0
  }
};

/* ── Global state ── */
window.currentPlan    = "analyst";
window.currentUser    = null;
window.isAdmin        = false;
window.planConfig     = PLAN_CONFIG;
window.aiMemoryContext = "";

/* Usage counters (loaded from Supabase) */
window.usageThisMonth = { entries: 0, analyses: 0, pdfs: 0, forecasts: 0 };
window.usagePeriodStart = null;

/* ================================================================
   MAIN INIT — waits for Supabase client via promise
================================================================ */
async function initPlanSystem() {
  try {
    /* FIX: wait for the client instead of grabbing window.supabaseClient directly */
    const supabase = await window.supabaseReady;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    window.currentUser = session.user;

    /* ── Admin bypass ── */
    if (session.user.id === IMPACTGRID_ADMIN_ID) {
      window.currentPlan = "admin";
      window.isAdmin     = true;
      applyPlanUI();
      await loadUserData();
      await buildAIMemoryContext();
      renderReportHistory();
      return;
    }

    /* ── Load or create user plan row ── */
    let { data: planRow } = await supabase
      .from("user_plans")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (!planRow) {
      planRow = await createUserPlanRow(session.user.id, supabase);
    }

    window.currentPlan      = planRow.plan || "analyst";
    window.usagePeriodStart = planRow.usage_period_start
      ? new Date(planRow.usage_period_start)
      : new Date();

    /* ── Check if 30-day usage period has rolled over ── */
    const now       = new Date();
    const periodEnd = new Date(window.usagePeriodStart);
    periodEnd.setDate(periodEnd.getDate() + 30);

    if (now > periodEnd) {
      window.usageThisMonth   = { entries: 0, analyses: 0, pdfs: 0, forecasts: 0 };
      window.usagePeriodStart = now;
      await supabase.from("user_plans").update({
        entries_used:       0,
        analyses_used:      0,
        pdfs_used:          0,
        forecasts_used:     0,
        usage_period_start: now.toISOString()
      }).eq("user_id", session.user.id);
    } else {
      window.usageThisMonth = {
        entries:   planRow.entries_used   || 0,
        analyses:  planRow.analyses_used  || 0,
        pdfs:      planRow.pdfs_used      || 0,
        forecasts: planRow.forecasts_used || 0
      };
    }

    applyPlanUI();
    showTrialBannerIfNeeded(planRow);
    await loadUserData();
    await buildAIMemoryContext();
    renderReportHistory();

  } catch(e) {
    console.error("Plan init error:", e);
  }
}

/* ================================================================
   CREATE USER PLAN ROW
================================================================ */
async function createUserPlanRow(userId, supabase) {
  /* Allow passing supabase client or fall back to window */
  const sb = supabase || window.supabaseClient;
  const now = new Date().toISOString();
  const row = {
    user_id:            userId,
    plan:               "analyst",
    entries_used:       0,
    analyses_used:      0,
    pdfs_used:          0,
    forecasts_used:     0,
    usage_period_start: now
  };
  const { data } = await sb
    .from("user_plans")
    .insert(row)
    .select()
    .single();
  return data || row;
}

/* ================================================================
   USAGE TRACKING
================================================================ */
function getLimit(type) {
  const config = PLAN_CONFIG[window.currentPlan];
  return config ? config[type] : 0;
}

function getUsed(type) {
  return window.usageThisMonth[type] || 0;
}

function getDaysUntilReset() {
  if (!window.usagePeriodStart) return 30;
  const end = new Date(window.usagePeriodStart);
  end.setDate(end.getDate() + 30);
  const diff = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

async function canUse(type) {
  if (window.isAdmin) return true;
  const limit = getLimit(type);
  if (limit === Infinity) return true;
  return getUsed(type) < limit;
}

async function incrementUsage(type) {
  if (window.isAdmin) return;
  const limit = getLimit(type);
  if (limit === Infinity) return;

  window.usageThisMonth[type] = (window.usageThisMonth[type] || 0) + 1;

  const update = {};
  update[type + "_used"] = window.usageThisMonth[type];
  await window.supabaseClient
    .from("user_plans")
    .update(update)
    .eq("user_id", window.currentUser.id);

  updateUsageBar();
}

function showLimitModal(type) {
  const days   = getDaysUntilReset();
  const limit  = getLimit(type);
  const used   = getUsed(type);
  const plan   = PLAN_CONFIG[window.currentPlan];
  const labels = { entries: "data entries", analyses: "AI analyses", pdfs: "PDF reports", forecasts: "forecasts" };

  const modal = document.getElementById("limitModal");
  if (!modal) return;

  document.getElementById("limitModalTitle").textContent  = "Monthly Limit Reached";
  document.getElementById("limitModalBody").innerHTML =
    "You have used <strong style='color:var(--gold)'>" + used + " of " + limit + " " + (labels[type]||type) + "</strong> " +
    "on your <strong>" + plan.label + "</strong> plan this month.<br><br>" +
    "<span style='color:var(--success);font-size:13px;'>⟳ Resets in <strong>" + days + " day" + (days !== 1 ? "s" : "") + "</strong></span>";

  document.getElementById("limitUpgradeBtn").style.display =
    (window.currentPlan === "enterprise") ? "none" : "block";
  document.getElementById("limitUpgradeBtn").href =
    (window.currentPlan === "analyst") ? STRIPE_LINKS.professional : STRIPE_LINKS.enterprise;
  document.getElementById("limitUpgradeBtn").textContent =
    (window.currentPlan === "analyst") ? "Upgrade to Professional — £8.99/mo" : "Upgrade to Enterprise — £13.99/mo";

  modal.style.display = "flex";
}

function closeLimitModal() {
  const modal = document.getElementById("limitModal");
  if (modal) modal.style.display = "none";
}

/* ================================================================
   USAGE BAR
================================================================ */
function updateUsageBar() {
  const bar = document.getElementById("usageBar");
  if (!bar || window.isAdmin) return;

  const plan   = PLAN_CONFIG[window.currentPlan];
  const types  = ["analyses","pdfs","forecasts"];
  const labels = ["Analyses","PDFs","Forecasts"];

  bar.innerHTML = types.map(function(t, i) {
    var limit = plan[t];
    if (limit === Infinity) return "";
    var used  = getUsed(t);
    var pct   = Math.min(100, Math.round((used/limit)*100));
    var color = pct >= 100 ? "#ff4d6d" : pct >= 70 ? "#c8a96e" : "#2dd4a0";
    return '<div style="margin-bottom:8px;">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:3px;">' +
        '<span style="font-size:9px;font-family:\'JetBrains Mono\',monospace;color:var(--text-muted);letter-spacing:0.08em;">' + labels[i].toUpperCase() + '</span>' +
        '<span style="font-size:9px;font-family:\'JetBrains Mono\',monospace;color:' + color + ';">' + used + '/' + limit + '</span>' +
      '</div>' +
      '<div style="height:3px;background:rgba(255,255,255,0.06);border-radius:2px;">' +
        '<div style="height:3px;width:' + pct + '%;background:' + color + ';border-radius:2px;transition:width 0.3s;"></div>' +
      '</div>' +
    '</div>';
  }).join("") +
  '<div style="font-size:9px;font-family:\'JetBrains Mono\',monospace;color:var(--text-muted);margin-top:6px;text-align:center;">Resets in ' + getDaysUntilReset() + ' days</div>';
}

/* ================================================================
   TRIAL BANNER
================================================================ */
function showTrialBannerIfNeeded(planRow) {
  const banner = document.getElementById("trialBanner");
  if (!banner) return;

  if (window.currentPlan === "professional" || window.currentPlan === "enterprise") {
    const createdAt = new Date(planRow.created_at || Date.now());
    const trialEnd  = new Date(createdAt);
    trialEnd.setDate(trialEnd.getDate() + 30);
    const daysLeft  = Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24));

    if (daysLeft > 0 && daysLeft <= 30) {
      document.getElementById("trialDaysLeft").textContent = daysLeft;
      banner.style.display = "flex";
    }
  }
}

/* ================================================================
   APPLY PLAN UI
================================================================ */
function applyPlanUI() {
  const config = PLAN_CONFIG[window.currentPlan];
  if (!config) return;

  const badge = document.getElementById("planBadge");
  if (badge) {
    badge.textContent = config.label;
    badge.className   = "plan-badge plan-" + window.currentPlan;
  }

  const emailEl = document.getElementById("sidebarUserEmail");
  if (emailEl && window.currentUser) {
    emailEl.textContent = window.currentUser.email;
  }
  const avatarEl = document.getElementById("sidebarAvatar");
  if (avatarEl && window.currentUser && window.currentUser.email) {
    avatarEl.textContent = window.currentUser.email[0].toUpperCase();
  }

  const importSection = document.getElementById("fileImportSection");
  if (importSection) {
    importSection.style.display = config.fileImport ? "block" : "none";
  }

  const matrixLinks = document.querySelectorAll("[data-section='matrix']");
  matrixLinks.forEach(function(el) {
    if (!config.matrix) {
      el.style.opacity = "0.4";
      el.title = "Available on Professional plan";
    }
  });

  const pdfBtn = document.getElementById("pdfExportBtn");
  if (pdfBtn) {
    pdfBtn.onclick = function() { handlePDFClick(); };
  }

  updateUsageBar();
}

/* ================================================================
   SAVE USER DATA
================================================================ */
async function saveUserData() {
  if (!window.currentUser) {
    console.warn("saveUserData: no user");
    return;
  }

  try {
    const payload = {
      user_id:       window.currentUser.id,
      data:          JSON.stringify(window.businessData || []),
      currency:      window.currentCurrency || "GBP",
      business_type: (document.getElementById("businessType") || {}).value || "other",
      updated_at:    new Date().toISOString()
    };

    const { error } = await window.supabaseClient
      .from("user_data")
      .upsert(payload, { onConflict: "user_id" });

    if (error) {
      console.error("Save error:", error.message);
    } else {
      console.log("Data saved successfully");
      showSaveBadge();
    }
  } catch(e) {
    console.error("Save exception:", e);
  }
}

/* ================================================================
   LOAD USER DATA
================================================================ */
async function loadUserData() {
  if (!window.currentUser) return;

  try {
    const { data, error } = await window.supabaseClient
      .from("user_data")
      .select("*")
      .eq("user_id", window.currentUser.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        console.log("No saved data yet for this user.");
      } else {
        console.error("Load error:", error.message, error.code);
      }
      return;
    }

    if (!data || !data.data) return;

    const parsed = JSON.parse(data.data);
    if (!parsed || !parsed.length) return;

    window.businessData = parsed.map(function(d) {
      return {
        date:     new Date(d.date),
        revenue:  Number(d.revenue),
        expenses: Number(d.expenses),
        profit:   Number(d.profit)
      };
    });

    console.log("Loaded", window.businessData.length, "months of data");

    if (data.currency) {
      window.currentCurrency = data.currency;
      const sel = document.getElementById("currencySelector");
      if (sel) sel.value = data.currency;
    }

    if (data.business_type) {
      const bt = document.getElementById("businessType");
      if (bt) bt.value = data.business_type;
    }

    if (typeof businessData !== "undefined") {
      businessData.length = 0;
      (window.businessData || []).forEach(function(d){ businessData.push(d); });
    }
    if (typeof updateAll === "function") updateAll();
    if (typeof renderRecordsPanel === "function") renderRecordsPanel();
    showAIMemoryGreeting();

  } catch(e) {
    console.error("Load exception:", e);
  }
}

/* ================================================================
   AI MEMORY GREETING
================================================================ */
function showAIMemoryGreeting() {
  const output = document.getElementById("aiChatOutput");
  if (!output || !window.currentUser) return;

  const meta   = window.currentUser.user_metadata || {};
  const name   = meta.full_name ? meta.full_name.split(" ")[0] : null;
  const months = (window.businessData || []).length;
  const greeting = name ? "Welcome back, " + name + "." : "Welcome back.";

  const existing = output.querySelector(".ai-response");
  if (existing && months > 0) {
    existing.innerHTML =
      "<strong>ImpactGrid AI</strong><br><br>" +
      greeting + " Your " + months + " month" + (months !== 1 ? "s" : "") +
      " of financial data " + (months !== 1 ? "are" : "is") + " loaded and ready for analysis." +
      (window.aiMemoryContext ? " I also have context from your previous reports." : "") +
      "<br><br><div class='ai-suggestions'>" +
      "<button class='ai-suggestion-chip' onclick=\"fillAIChat('Give me a full performance summary')\">Performance summary</button>" +
      "<button class='ai-suggestion-chip' onclick=\"fillAIChat('What are my biggest risks?')\">Risk analysis</button>" +
      "<button class='ai-suggestion-chip' onclick=\"fillAIChat('3 year projection')\">Forecast</button>" +
      "<button class='ai-suggestion-chip' onclick=\"fillAIChat('How can I reduce costs?')\">Reduce costs</button>" +
      "</div>";
  }
}

/* ================================================================
   SAVE REPORT SNAPSHOT
================================================================ */
async function saveReportSnapshot(summaryData) {
  if (!window.currentUser) return;

  try {
    const { error } = await window.supabaseClient
      .from("user_reports")
      .insert({
        user_id:        window.currentUser.id,
        summary:        summaryData.summary       || "",
        health_score:   summaryData.healthScore   || 0,
        total_revenue:  summaryData.totalRevenue  || 0,
        total_expenses: summaryData.totalExpenses || 0,
        total_profit:   summaryData.totalProfit   || 0,
        months_count:   summaryData.monthsCount   || 0,
        ai_insights:    summaryData.aiInsights    || "",
        plan:           window.currentPlan
      });

    if (error) console.error("Report save error:", error.message);
    else { console.log("Report saved"); renderReportHistory(); }
  } catch(e) {
    console.error("Report save exception:", e);
  }
}

/* ================================================================
   LOAD & RENDER REPORT HISTORY
================================================================ */
async function renderReportHistory() {
  const container = document.getElementById("reportHistoryList");
  if (!container || !window.currentUser) return;

  container.innerHTML = '<div style="font-size:12px;color:var(--text-muted);font-family:\'JetBrains Mono\',monospace;padding:10px 0;">Loading report history...</div>';

  try {
    const limit = PLAN_CONFIG[window.currentPlan].reportHistory;
    const query = window.supabaseClient
      .from("user_reports")
      .select("*")
      .eq("user_id", window.currentUser.id)
      .order("report_date", { ascending: false });

    if (limit !== Infinity) query.limit(limit);
    else query.limit(50);

    const { data, error } = await query;

    if (error) { console.error("Report history error:", error.message); return; }
    if (!data || !data.length) {
      container.innerHTML = '<div style="font-size:12px;color:var(--text-muted);font-family:\'JetBrains Mono\',monospace;padding:16px 0;">No saved reports yet — generate your first report below.</div>';
      return;
    }

    container.innerHTML = data.map(function(r) {
      var date       = new Date(r.report_date).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });
      var score      = r.health_score || 0;
      var scoreColor = score >= 70 ? "#2dd4a0" : score >= 40 ? "#c8a96e" : "#ff4d6d";
      var profitFmt  = r.total_profit >= 0
        ? '<span style="color:#2dd4a0;">+£' + Number(r.total_profit).toLocaleString() + '</span>'
        : '<span style="color:#ff4d6d;">−£' + Math.abs(Number(r.total_profit)).toLocaleString() + '</span>';

      return '<div class="report-history-card">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;">' +
          '<div>' +
            '<div style="font-family:\'Syne\',sans-serif;font-size:14px;font-weight:700;color:var(--text-primary);">' + date + '</div>' +
            '<div style="font-size:10px;font-family:\'JetBrains Mono\',monospace;color:var(--text-muted);margin-top:3px;">' + (r.months_count||0) + ' months · ' + (r.plan||"analyst") + ' plan</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<div style="font-family:\'Syne\',sans-serif;font-size:24px;font-weight:800;color:' + scoreColor + ';line-height:1;">' + score + '</div>' +
            '<div style="font-size:9px;font-family:\'JetBrains Mono\',monospace;color:var(--text-muted);">HEALTH SCORE</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">' +
          '<div style="text-align:center;padding:8px;background:rgba(6,8,15,0.4);border-radius:6px;">' +
            '<div style="font-size:11px;color:#2dd4a0;font-family:\'JetBrains Mono\',monospace;font-weight:600;">£' + Number(r.total_revenue||0).toLocaleString() + '</div>' +
            '<div style="font-size:9px;color:var(--text-muted);margin-top:2px;">Revenue</div>' +
          '</div>' +
          '<div style="text-align:center;padding:8px;background:rgba(6,8,15,0.4);border-radius:6px;">' +
            '<div style="font-size:11px;color:#ff4d6d;font-family:\'JetBrains Mono\',monospace;font-weight:600;">£' + Number(r.total_expenses||0).toLocaleString() + '</div>' +
            '<div style="font-size:9px;color:var(--text-muted);margin-top:2px;">Expenses</div>' +
          '</div>' +
          '<div style="text-align:center;padding:8px;background:rgba(6,8,15,0.4);border-radius:6px;">' +
            '<div style="font-size:11px;font-family:\'JetBrains Mono\',monospace;font-weight:600;">' + profitFmt + '</div>' +
            '<div style="font-size:9px;color:var(--text-muted);margin-top:2px;">Profit</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join("");

  } catch(e) {
    console.error("renderReportHistory exception:", e);
  }
}

/* ================================================================
   AI MEMORY CONTEXT from past reports
================================================================ */
async function buildAIMemoryContext() {
  if (!window.currentUser) return "";
  try {
    const { data } = await window.supabaseClient
      .from("user_reports")
      .select("*")
      .eq("user_id", window.currentUser.id)
      .order("report_date", { ascending: false })
      .limit(3);

    if (!data || !data.length) { window.aiMemoryContext = ""; return ""; }

    var ctx = "USER REPORT HISTORY (" + data.length + " previous reports):\n";
    data.forEach(function(r, i) {
      var d = new Date(r.report_date).toLocaleDateString("en-GB", { month:"short", year:"numeric" });
      ctx += "\nReport " + (i+1) + " (" + d + "): Health Score " + (r.health_score||0) + "/100, ";
      ctx += "Revenue £" + Number(r.total_revenue||0).toLocaleString() + ", ";
      ctx += "Expenses £" + Number(r.total_expenses||0).toLocaleString() + ", ";
      ctx += "Profit £" + Number(r.total_profit||0).toLocaleString() + ".";
      if (r.ai_insights) ctx += " Key insight: " + r.ai_insights.substring(0,120) + "...";
    });

    window.aiMemoryContext = ctx;
    return ctx;
  } catch(e) {
    console.error("AI memory error:", e);
    return "";
  }
}

/* ================================================================
   SHOW SAVE BADGE
================================================================ */
function showSaveBadge() {
  const badge = document.getElementById("autosaveBadge");
  if (!badge) return;
  badge.style.opacity = "1";
  setTimeout(function() { badge.style.opacity = "0"; }, 2500);
}

/* ================================================================
   UPGRADE MODAL
================================================================ */
function showUpgradePrompt(feature, requiredPlan) {
  const plan  = PLAN_CONFIG[requiredPlan];
  const modal = document.getElementById("upgradeModal");
  if (!modal) return;
  document.getElementById("upgradeFeatureName").textContent = feature;
  document.getElementById("upgradePlanName").textContent    = plan.label;
  document.getElementById("upgradePrice").textContent       = plan.price;
  document.getElementById("upgradeBtn").href                = STRIPE_LINKS[requiredPlan];
  modal.style.display = "flex";
}

function closeUpgradeModal() {
  const modal = document.getElementById("upgradeModal");
  if (modal) modal.style.display = "none";
}

/* ================================================================
   HANDLE PDF CLICK
================================================================ */
async function handlePDFClick() {
  const allowed = await canUse("pdfs");
  if (!allowed) { showLimitModal("pdfs"); return; }
  await incrementUsage("pdfs");
  if (typeof window.generatePDF === "function") window.generatePDF();
  else console.error("generatePDF not found — check script.js load order");
}

/* ================================================================
   EXPOSE GLOBALS
================================================================ */
window.initPlanSystem      = initPlanSystem;
window.saveUserData        = saveUserData;
window.loadUserData        = loadUserData;
window.canUse              = canUse;
window.incrementUsage      = incrementUsage;
window.showLimitModal      = showLimitModal;
window.closeLimitModal     = closeLimitModal;
window.showUpgradePrompt   = showUpgradePrompt;
window.closeUpgradeModal   = closeUpgradeModal;
window.saveReportSnapshot  = saveReportSnapshot;
window.renderReportHistory = renderReportHistory;
window.buildAIMemoryContext = buildAIMemoryContext;
window.updateUsageBar      = updateUsageBar;
window.handlePDFClick      = handlePDFClick;
window.STRIPE_LINKS        = STRIPE_LINKS;
window.PLAN_CONFIG         = PLAN_CONFIG;

/* ================================================================
   PDF STORAGE
================================================================ */
async function savePDFToAccount(pdfBase64, metadata) {
  if (!window.currentUser) return;

  try {
    const limit = PLAN_CONFIG[window.currentPlan].reportHistory;

    if (limit !== Infinity) {
      const { count } = await window.supabaseClient
        .from("user_pdfs")
        .select("id", { count: "exact" })
        .eq("user_id", window.currentUser.id);

      if (count >= limit) {
        const { data: oldest } = await window.supabaseClient
          .from("user_pdfs")
          .select("id")
          .eq("user_id", window.currentUser.id)
          .order("created_at", { ascending: true })
          .limit(1);

        if (oldest && oldest.length) {
          await window.supabaseClient
            .from("user_pdfs")
            .delete()
            .eq("id", oldest[0].id);
        }
      }
    }

    const filename = "ImpactGrid-Report-" +
      new Date().toLocaleDateString("en-GB").replace(/\//g,"-") + ".pdf";

    const { error } = await window.supabaseClient
      .from("user_pdfs")
      .insert({
        user_id:      window.currentUser.id,
        filename:     filename,
        pdf_data:     pdfBase64,
        months_count: metadata.monthsCount  || 0,
        health_score: metadata.healthScore  || 0,
        plan:         window.currentPlan
      });

    if (error) console.error("PDF save error:", error.message);
    else {
      console.log("PDF saved to account");
      renderSavedPDFs();
    }
  } catch(e) {
    console.error("PDF save exception:", e);
  }
}

async function renderSavedPDFs() {
  const container = document.getElementById("savedPDFsList");
  if (!container || !window.currentUser) return;

  container.innerHTML = '<div style="font-size:12px;color:var(--text-muted);font-family:\'JetBrains Mono\',monospace;padding:8px 0;">Loading saved reports...</div>';

  try {
    const { data, error } = await window.supabaseClient
      .from("user_pdfs")
      .select("id, created_at, filename, months_count, health_score, plan")
      .eq("user_id", window.currentUser.id)
      .order("created_at", { ascending: false });

    if (error) { console.error("PDF list error:", error.message); return; }

    if (!data || !data.length) {
      container.innerHTML = '<div style="font-size:12px;color:var(--text-muted);font-family:\'JetBrains Mono\',monospace;padding:8px 0;">No saved reports yet — generate your first report below.</div>';
      return;
    }

    container.innerHTML = data.map(function(p) {
      var date       = new Date(p.created_at).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });
      var time       = new Date(p.created_at).toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" });
      var score      = p.health_score || 0;
      var scoreColor = score >= 70 ? "#2dd4a0" : score >= 40 ? "#c8a96e" : "#ff4d6d";

      return '<div class="saved-pdf-card">' +
        '<div style="display:flex;align-items:center;gap:14px;">' +
          '<div style="width:42px;height:42px;border-radius:10px;background:rgba(200,169,110,0.1);border:1px solid rgba(200,169,110,0.2);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">⊡</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-family:\'Syne\',sans-serif;font-size:13px;font-weight:700;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (p.filename || "Report") + '</div>' +
            '<div style="font-size:10px;font-family:\'JetBrains Mono\',monospace;color:var(--text-muted);margin-top:2px;">' + date + ' · ' + time + ' · ' + (p.months_count||0) + ' months</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:12px;flex-shrink:0;">' +
            '<div style="text-align:center;">' +
              '<div style="font-family:\'Syne\',sans-serif;font-size:16px;font-weight:800;color:' + scoreColor + ';line-height:1;">' + score + '</div>' +
              '<div style="font-size:8px;font-family:\'JetBrains Mono\',monospace;color:var(--text-muted);">SCORE</div>' +
            '</div>' +
            '<button onclick="downloadSavedPDF(\'' + p.id + '\')" style="padding:8px 14px;background:linear-gradient(135deg,rgba(200,169,110,0.15),rgba(226,201,138,0.1));border:1px solid rgba(200,169,110,0.3);border-radius:7px;color:var(--gold-light);font-size:11px;font-family:\'JetBrains Mono\',monospace;cursor:pointer;letter-spacing:0.05em;white-space:nowrap;">↓ Download</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join("");

  } catch(e) {
    console.error("renderSavedPDFs error:", e);
  }
}

async function downloadSavedPDF(pdfId) {
  try {
    const btn = event.target;
    btn.textContent = "Loading...";
    btn.style.opacity = "0.7";

    const { data, error } = await window.supabaseClient
      .from("user_pdfs")
      .select("pdf_data, filename")
      .eq("id", pdfId)
      .eq("user_id", window.currentUser.id)
      .single();

    if (error || !data) {
      console.error("Download error:", error);
      btn.textContent = "↓ Download";
      btn.style.opacity = "1";
      return;
    }

    var binary = atob(data.pdf_data);
    var bytes  = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    var blob = new Blob([bytes], { type: "application/pdf" });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement("a");
    a.href     = url;
    a.download = data.filename || "ImpactGrid-Report.pdf";
    a.click();
    URL.revokeObjectURL(url);

    btn.textContent = "↓ Download";
    btn.style.opacity = "1";

  } catch(e) {
    console.error("Download exception:", e);
  }
}

window.savePDFToAccount  = savePDFToAccount;
window.renderSavedPDFs   = renderSavedPDFs;
window.downloadSavedPDF  = downloadSavedPDF;
