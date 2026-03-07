/* ================================================================
   IMPACTGRID PLAN SYSTEM — plans.js
   Handles: plan detection, feature gating, data persistence,
            expiry, admin bypass, AI user memory
================================================================ */

const IMPACTGRID_ADMIN_ID = "303580e9-38c8-450b-90e0-82045e0b5c27";

const STRIPE_LINKS = {
  professional:  "https://buy.stripe.com/aFa5kwaAg6Pedn64zC8N201",
  enterprise:    "https://buy.stripe.com/8x29AM23Ka1qbeY5DG8N200"
};

const PLAN_CONFIG = {
  analyst: {
    label:          "Analyst",
    dataMonths:     1,
    aiQuestions:    5,
    fileImport:     false,
    pdfExport:      false,
    forecastYears:  1,
    multiProfile:   false,
    price:          "Free"
  },
  professional: {
    label:          "Professional",
    dataMonths:     12,
    aiQuestions:    Infinity,
    fileImport:     true,
    pdfExport:      true,
    forecastYears:  3,
    multiProfile:   false,
    price:          "£8.99/mo"
  },
  enterprise: {
    label:          "Enterprise Intelligence",
    dataMonths:     Infinity,
    aiQuestions:    Infinity,
    fileImport:     true,
    pdfExport:      true,
    forecastYears:  10,
    multiProfile:   true,
    price:          "£13.99/mo"
  },
  admin: {
    label:          "Admin",
    dataMonths:     Infinity,
    aiQuestions:    Infinity,
    fileImport:     true,
    pdfExport:      true,
    forecastYears:  10,
    multiProfile:   true,
    price:          "Internal"
  }
};

/* ── Global plan state ── */
window.currentPlan     = "analyst";
window.currentUser     = null;
window.planConfig      = PLAN_CONFIG;
window.isAdmin         = false;
window.aiDailyCount    = 0;

/* ================================================================
   INIT — call once after auth confirmed
================================================================ */
async function initPlanSystem() {
  try {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) return;

    window.currentUser = session.user;

    /* Admin check */
    if (session.user.id === IMPACTGRID_ADMIN_ID) {
      window.currentPlan = "admin";
      window.isAdmin     = true;
      console.log("Admin access granted.");
      applyPlanUI();
      await loadUserData();
      return;
    }

    /* Load plan from Supabase */
    const { data, error } = await window.supabaseClient
      .from("user_plans")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (error || !data) {
      /* New user — create analyst row */
      await createAnalystRow(session.user.id);
      window.currentPlan = "analyst";
    } else {
      /* Check expiry */
      if (data.data_expires_at && new Date(data.data_expires_at) < new Date()) {
        /* Expired — downgrade to analyst, wipe data */
        await window.supabaseClient
          .from("user_plans")
          .update({ plan: "analyst", data_expires_at: null })
          .eq("user_id", session.user.id);
        await wipeExpiredData(session.user.id);
        window.currentPlan = "analyst";
        showPlanExpiredBanner();
      } else {
        window.currentPlan = data.plan || "analyst";
      }
    }

    applyPlanUI();
    await loadUserData();
    loadAIDailyCount();

  } catch (e) {
    console.error("Plan init error:", e);
  }
}

/* ================================================================
   CREATE ANALYST ROW for new users
================================================================ */
async function createAnalystRow(userId) {
  const expires = new Date();
  expires.setMonth(expires.getMonth() + 1);

  await window.supabaseClient.from("user_plans").insert({
    user_id:        userId,
    plan:           "analyst",
    data_expires_at: expires.toISOString()
  });
}

/* ================================================================
   SAVE USER DATA to Supabase
================================================================ */
async function saveUserData() {
  if (!window.currentUser) return;

  const payload = {
    user_id:      window.currentUser.id,
    data:         JSON.stringify(window.businessData || []),
    currency:     window.currentCurrency || "GBP",
    business_type: (document.getElementById("businessType") || {}).value || "other",
    updated_at:   new Date().toISOString()
  };

  /* Upsert into user_data table */
  const { error } = await window.supabaseClient
    .from("user_data")
    .upsert(payload, { onConflict: "user_id" });

  if (error) console.error("Save error:", error.message);
  else showSaveBadge();
}

/* ================================================================
   LOAD USER DATA from Supabase
================================================================ */
async function loadUserData() {
  if (!window.currentUser) return;

  const { data, error } = await window.supabaseClient
    .from("user_data")
    .select("*")
    .eq("user_id", window.currentUser.id)
    .single();

  if (error || !data) return;

  try {
    const parsed = JSON.parse(data.data || "[]");
    window.businessData = parsed.map(function(d) {
      return {
        date:     new Date(d.date),
        revenue:  d.revenue,
        expenses: d.expenses,
        profit:   d.profit
      };
    });

    /* Restore currency */
    if (data.currency) {
      window.currentCurrency = data.currency;
      const sel = document.getElementById("currencySelector");
      if (sel) sel.value = data.currency;
    }

    /* Restore business type */
    if (data.business_type) {
      const bt = document.getElementById("businessType");
      if (bt) bt.value = data.business_type;
    }

    /* Enforce plan data limit */
    enforcePlanDataLimit();

    if (typeof updateAll === "function") updateAll();

    /* AI user memory greeting */
    if (window.businessData.length > 0) {
      showAIMemoryGreeting();
    }

  } catch(e) {
    console.error("Load parse error:", e);
  }
}

/* ================================================================
   WIPE EXPIRED DATA
================================================================ */
async function wipeExpiredData(userId) {
  await window.supabaseClient
    .from("user_data")
    .delete()
    .eq("user_id", userId);
  window.businessData = [];
}

/* ================================================================
   ENFORCE PLAN DATA LIMIT
   Free = 1 month of data max
================================================================ */
function enforcePlanDataLimit() {
  const config = PLAN_CONFIG[window.currentPlan];
  if (!config || config.dataMonths === Infinity) return;

  if (window.businessData && window.businessData.length > config.dataMonths) {
    /* Keep most recent months only */
    window.businessData = window.businessData.slice(-config.dataMonths);
  }
}

/* ================================================================
   APPLY PLAN UI — show/hide features based on plan
================================================================ */
function applyPlanUI() {
  const config = PLAN_CONFIG[window.currentPlan];
  if (!config) return;

  /* Update plan badge in sidebar */
  const badge = document.getElementById("planBadge");
  if (badge) {
    badge.textContent = config.label;
    badge.className   = "plan-badge plan-" + window.currentPlan;
  }

  /* File import — hide for analyst */
  const importSection = document.getElementById("fileImportSection");
  if (importSection) {
    importSection.style.display = config.fileImport ? "block" : "none";
  }

  /* PDF export button */
  const pdfBtn = document.getElementById("pdfExportBtn");
  if (pdfBtn) {
    if (!config.pdfExport) {
      pdfBtn.onclick = function() { showUpgradePrompt("PDF export", "professional"); };
      pdfBtn.style.opacity = "0.5";
    }
  }

  /* User email in sidebar */
  const userEmail = document.getElementById("sidebarUserEmail");
  if (userEmail && window.currentUser) {
    userEmail.textContent = window.currentUser.email;
  }
}

/* ================================================================
   AI DAILY QUESTION LIMIT (free users)
================================================================ */
function loadAIDailyCount() {
  if (window.currentPlan !== "analyst") return;
  const key   = "ig_ai_date_" + (window.currentUser ? window.currentUser.id : "guest");
  const today = new Date().toDateString();
  const stored = localStorage.getItem(key);

  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed.date === today) {
      window.aiDailyCount = parsed.count;
    } else {
      window.aiDailyCount = 0;
      localStorage.setItem(key, JSON.stringify({ date: today, count: 0 }));
    }
  } else {
    window.aiDailyCount = 0;
    localStorage.setItem(key, JSON.stringify({ date: today, count: 0 }));
  }
}

function incrementAICount() {
  if (window.currentPlan !== "analyst") return true; /* unlimited */
  const config = PLAN_CONFIG["analyst"];
  if (window.aiDailyCount >= config.aiQuestions) return false;

  window.aiDailyCount++;
  const key   = "ig_ai_date_" + (window.currentUser ? window.currentUser.id : "guest");
  const today = new Date().toDateString();
  localStorage.setItem(key, JSON.stringify({ date: today, count: window.aiDailyCount }));
  return true;
}

function getRemainingAIQuestions() {
  if (window.currentPlan !== "analyst") return Infinity;
  return Math.max(0, PLAN_CONFIG["analyst"].aiQuestions - window.aiDailyCount);
}

/* ================================================================
   AI USER MEMORY GREETING
================================================================ */
function showAIMemoryGreeting() {
  const output = document.getElementById("aiChatOutput");
  if (!output || !window.currentUser) return;

  const name    = (window.currentUser.user_metadata && window.currentUser.user_metadata.full_name)
                  ? window.currentUser.user_metadata.full_name.split(" ")[0]
                  : null;
  const months  = window.businessData ? window.businessData.length : 0;
  const greeting = name ? "Welcome back, " + name + "." : "Welcome back.";

  /* Find existing welcome message and update it */
  const existing = output.querySelector(".ai-response");
  if (existing) {
    existing.innerHTML = "<strong>ImpactGrid AI</strong><br><br>" +
      greeting + " I can see your " + months + " month" + (months !== 1 ? "s" : "") +
      " of financial data. Your records are loaded and ready for analysis.<br><br>" +
      "<div class='ai-suggestions'>" +
      "<button class='ai-suggestion-chip' onclick=\"fillAIChat('Give me a full performance summary')\">Performance summary</button>" +
      "<button class='ai-suggestion-chip' onclick=\"fillAIChat('What are my biggest risks?')\">Risk analysis</button>" +
      "<button class='ai-suggestion-chip' onclick=\"fillAIChat('3 year projection')\">3 year projection</button>" +
      "<button class='ai-suggestion-chip' onclick=\"fillAIChat('How can I reduce costs?')\">Reduce costs</button>" +
      "</div>";
  }
}

/* ================================================================
   SHOW UPGRADE PROMPT
================================================================ */
function showUpgradePrompt(feature, requiredPlan) {
  const plan  = PLAN_CONFIG[requiredPlan];
  const modal = document.getElementById("upgradeModal");
  if (modal) {
    document.getElementById("upgradeFeatureName").textContent  = feature;
    document.getElementById("upgradePlanName").textContent     = plan.label;
    document.getElementById("upgradePrice").textContent        = plan.price;
    document.getElementById("upgradeBtn").href                 = STRIPE_LINKS[requiredPlan];
    modal.style.display = "flex";
  }
}

function closeUpgradeModal() {
  const modal = document.getElementById("upgradeModal");
  if (modal) modal.style.display = "none";
}

/* ================================================================
   SHOW PLAN EXPIRED BANNER
================================================================ */
function showPlanExpiredBanner() {
  const banner = document.getElementById("planExpiredBanner");
  if (banner) banner.style.display = "flex";
}

/* ================================================================
   SHOW SAVE BADGE (autosave indicator)
================================================================ */
function showSaveBadge() {
  const badge = document.getElementById("autosaveBadge");
  if (!badge) return;
  badge.style.opacity = "1";
  setTimeout(function() { badge.style.opacity = "0"; }, 2000);
}

/* ================================================================
   EXPOSE GLOBALS
================================================================ */
window.initPlanSystem      = initPlanSystem;
window.saveUserData        = saveUserData;
window.loadUserData        = loadUserData;
window.showUpgradePrompt   = showUpgradePrompt;
window.closeUpgradeModal   = closeUpgradeModal;
window.incrementAICount    = incrementAICount;
window.getRemainingAIQuestions = getRemainingAIQuestions;
window.STRIPE_LINKS        = STRIPE_LINKS;
window.PLAN_CONFIG         = PLAN_CONFIG;

/* ================================================================
   REPORT HISTORY — save snapshot when PDF generated
================================================================ */
async function saveReportSnapshot(summaryData) {
  if (!window.currentUser) return;

  const payload = {
    user_id:        window.currentUser.id,
    summary:        summaryData.summary        || "",
    health_score:   summaryData.healthScore    || 0,
    total_revenue:  summaryData.totalRevenue   || 0,
    total_expenses: summaryData.totalExpenses  || 0,
    total_profit:   summaryData.totalProfit    || 0,
    months_count:   summaryData.monthsCount    || 0,
    ai_insights:    summaryData.aiInsights     || "",
    plan:           window.currentPlan
  };

  const { error } = await window.supabaseClient
    .from("user_reports")
    .insert(payload);

  if (error) console.error("Report save error:", error.message);
  else console.log("Report snapshot saved.");
}

/* ================================================================
   LOAD REPORT HISTORY — for Reports section display
================================================================ */
async function loadReportHistory() {
  if (!window.currentUser) return [];

  const { data, error } = await window.supabaseClient
    .from("user_reports")
    .select("*")
    .eq("user_id", window.currentUser.id)
    .order("report_date", { ascending: false })
    .limit(10);

  if (error) { console.error("Report load error:", error.message); return []; }
  return data || [];
}

/* ================================================================
   RENDER REPORT HISTORY in Reports section
================================================================ */
async function renderReportHistory() {
  const container = document.getElementById("reportHistoryList");
  if (!container) return;

  container.innerHTML = '<div style="font-size:12px;color:var(--text-muted);font-family:\'JetBrains Mono\',monospace;">Loading report history...</div>';

  const reports = await loadReportHistory();

  if (!reports.length) {
    container.innerHTML = '<div style="font-size:12px;color:var(--text-muted);font-family:\'JetBrains Mono\',monospace;padding:16px 0;">No saved reports yet. Generate your first report below.</div>';
    return;
  }

  container.innerHTML = reports.map(function(r) {
    var date    = new Date(r.report_date).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });
    var score   = r.health_score || 0;
    var scoreColor = score >= 70 ? "#2dd4a0" : score >= 40 ? "#c8a96e" : "#ff4d6d";
    var profit  = (r.total_profit >= 0)
      ? '<span style="color:#2dd4a0;">+£' + r.total_profit.toLocaleString() + '</span>'
      : '<span style="color:#ff4d6d;">-£' + Math.abs(r.total_profit).toLocaleString() + '</span>';

    return '<div class="report-history-card">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
        '<div>' +
          '<div style="font-family:\'Syne\',sans-serif;font-size:13px;font-weight:700;color:var(--text-primary);">' + date + ' Report</div>' +
          '<div style="font-size:10px;font-family:\'JetBrains Mono\',monospace;color:var(--text-muted);margin-top:2px;">' + (r.months_count || 0) + ' months analysed · ' + (r.plan || 'analyst') + ' plan</div>' +
        '</div>' +
        '<div style="text-align:right;">' +
          '<div style="font-family:\'Syne\',sans-serif;font-size:20px;font-weight:800;color:' + scoreColor + ';">' + score + '</div>' +
          '<div style="font-size:9px;font-family:\'JetBrains Mono\',monospace;color:var(--text-muted);">HEALTH SCORE</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:10px;">' +
        '<div style="text-align:center;padding:8px;background:var(--bg-mid);border-radius:6px;">' +
          '<div style="font-size:11px;color:#2dd4a0;font-family:\'JetBrains Mono\',monospace;">£' + (r.total_revenue||0).toLocaleString() + '</div>' +
          '<div style="font-size:9px;color:var(--text-muted);margin-top:2px;">Revenue</div>' +
        '</div>' +
        '<div style="text-align:center;padding:8px;background:var(--bg-mid);border-radius:6px;">' +
          '<div style="font-size:11px;color:#ff4d6d;font-family:\'JetBrains Mono\',monospace;">£' + (r.total_expenses||0).toLocaleString() + '</div>' +
          '<div style="font-size:9px;color:var(--text-muted);margin-top:2px;">Expenses</div>' +
        '</div>' +
        '<div style="text-align:center;padding:8px;background:var(--bg-mid);border-radius:6px;">' +
          '<div style="font-size:11px;font-family:\'JetBrains Mono\',monospace;">' + profit + '</div>' +
          '<div style="font-size:9px;color:var(--text-muted);margin-top:2px;">Profit</div>' +
        '</div>' +
      '</div>' +
      (r.ai_insights ? '<div style="font-size:11px;color:var(--text-secondary);font-family:\'JetBrains Mono\',monospace;line-height:1.6;padding:10px;background:rgba(200,169,110,0.05);border:1px solid rgba(200,169,110,0.1);border-radius:6px;">' + r.ai_insights.substring(0,300) + (r.ai_insights.length > 300 ? "..." : "") + '</div>' : '') +
    '</div>';
  }).join("");
}

/* ================================================================
   AI MEMORY FROM REPORTS — build context string for AI
================================================================ */
async function buildAIMemoryContext() {
  if (!window.currentUser) return "";

  const reports = await loadReportHistory();
  if (!reports.length) return "";

  var context = "USER HISTORY (" + reports.length + " saved reports):\n";
  reports.slice(0, 3).forEach(function(r, i) {
    var date = new Date(r.report_date).toLocaleDateString("en-GB", { month:"short", year:"numeric" });
    context += "\nReport " + (i+1) + " (" + date + "): ";
    context += "Health Score " + (r.health_score||0) + "/100, ";
    context += "Revenue £" + (r.total_revenue||0).toLocaleString() + ", ";
    context += "Expenses £" + (r.total_expenses||0).toLocaleString() + ", ";
    context += "Profit £" + (r.total_profit||0).toLocaleString() + ". ";
    if (r.ai_insights) context += "AI noted: " + r.ai_insights.substring(0, 150) + "...";
  });

  window.aiMemoryContext = context;
  return context;
}

/* Expose new functions */
window.saveReportSnapshot   = saveReportSnapshot;
window.loadReportHistory    = loadReportHistory;
window.renderReportHistory  = renderReportHistory;
window.buildAIMemoryContext = buildAIMemoryContext;
