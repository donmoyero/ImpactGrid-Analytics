/* ================================================================
   IMPACTGRID AI ENGINE v5.0
   → Gemini 2.0 Flash (free — 1,500 req/day)
   → Reddit live posts (zero API key needed)
   → Google Custom Search news (optional free key)
   → Full financial brain in system prompt

   SETUP (5 mins, all free):
   1. Gemini key  → aistudio.google.com/app/apikey
   2. Reddit      → nothing. Works now.
   3. Google CSE  → programmablesearchengine.google.com (optional)
                    + console.cloud.google.com → Custom Search API key
================================================================ */

var GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";
var GOOGLE_CSE_KEY = "YOUR_GOOGLE_CSE_KEY_HERE";  /* optional */
var GOOGLE_CSE_ID  = "YOUR_GOOGLE_CSE_ID_HERE";   /* optional */

var _GMODEL = "gemini-2.0-flash";
function _gURL() {
  return "https://generativelanguage.googleapis.com/v1beta/models/"
       + _GMODEL + ":generateContent?key=" + GEMINI_API_KEY;
}
function _sym(c) { return ({USD:"$",EUR:"€",NGN:"₦",GBP:"£"})[c]||"£"; }

/* ================================================================
   REDDIT — no key, public JSON endpoint
   Auto-picks subreddits based on business type
================================================================ */
async function igReddit(query, businessType) {
  try {
    var bt  = (businessType||"").toLowerCase();

    /* Core finance subreddits always included */
    var subs = ["UKBusiness","smallbusiness","Entrepreneur","ukpersonalfinance","Accounting","selfemployed_uk"];

    /* Add sector-specific ones */
    if (/café|cafe|restaurant|food|takeaway|hospitality/.test(bt))
      subs.push("restaurant","KitchenConfidential","cafe","UKFoodandDrink");
    if (/retail/.test(bt))
      subs.push("retailnews","ecommerce","Flipping");
    if (/consult|freelance|agency/.test(bt))
      subs.push("consulting","freelance","agency");
    if (/tech|saas|software|app|startup/.test(bt))
      subs.push("SaaS","startups","Entrepreneur","webdev");
    if (/construct|trade|builder|plumber|electric/.test(bt))
      subs.push("Construction","HVAC","Plumbing","Electricians");
    if (/health|salon|beauty|clinic|physio/.test(bt))
      subs.push("Dentistry","smallbusiness","beauty");
    if (/property|estate|lettings|landlord/.test(bt))
      subs.push("HousingUK","LandlordUK","PropertyInvesting");

    var subredditStr = subs.join("+");
    var url = "https://www.reddit.com/r/" + subredditStr + "/search.json"
            + "?q=" + encodeURIComponent(query)
            + "&sort=relevance&t=year&limit=10&restrict_sr=1";

    var res = await fetch(url, {
      headers: { "User-Agent": "ImpactGridAI/5.0 (market-research-tool)" }
    });
    if (!res.ok) return null;

    var json  = await res.json();
    var posts = (json?.data?.children || [])
      .map(function(p){ return p.data; })
      .filter(function(d){
        return d && d.score > 3
          && d.title
          && d.selftext !== "[deleted]"
          && d.selftext !== "[removed]"
          && !d.removed_by_category;
      })
      .slice(0, 5);

    if (!posts.length) return null;

    var lines = posts.map(function(d) {
      var snippet = (d.selftext || "").replace(/\n|\r/g," ").trim().slice(0, 220);
      return "• r/" + d.subreddit + " [↑" + d.score + "] " + d.title
           + (snippet ? " — " + snippet + (snippet.length >= 220 ? "…" : "") : "");
    });

    return "REDDIT (real owner discussions):\n" + lines.join("\n");

  } catch(e) {
    console.warn("[ImpactGrid Reddit]", e.message);
    return null;
  }
}

/* ================================================================
   GOOGLE CUSTOM SEARCH — news + industry data (optional)
================================================================ */
async function igGoogle(query) {
  if (!GOOGLE_CSE_KEY || GOOGLE_CSE_KEY.startsWith("YOUR")) return null;
  try {
    var url = "https://www.googleapis.com/customsearch/v1"
            + "?key=" + GOOGLE_CSE_KEY
            + "&cx="  + GOOGLE_CSE_ID
            + "&num=4&q=" + encodeURIComponent(query);

    var res  = await fetch(url);
    if (!res.ok) return null;
    var json = await res.json();
    if (!json.items?.length) return null;

    return "GOOGLE (news & industry reports):\n" + json.items.slice(0,4).map(function(i){
      return "• " + i.title + ": " + (i.snippet||"").replace(/\n/g," ").slice(0,200);
    }).join("\n");

  } catch(e) {
    console.warn("[ImpactGrid Google]", e.message);
    return null;
  }
}

/* ================================================================
   RESEARCH TRIGGER
   Detects questions that benefit from live market data
================================================================ */
function igNeedsResearch(q) {
  return /market|industry|competitor|benchmark|sector|trend|economy|
    inflation|average|typical|compare|uk sme|small business|retail|
    hospitality|café|cafe|restaurant|construction|consulting|ecommerce|
    recession|interest rate|supply chain|others doing|is it normal|
    should i be worried|common problem|typical for|how does|people say|
    other business|similar business|reddit|what.s happening|cost of living|
    pricing|charge|rate|wage|staff cost|hiring|supplier|materials/xi.test(q);
}

/* ================================================================
   FINANCIAL BRAIN
   Crunches live businessData into a dense context block for Gemini
================================================================ */
function igFinancials(data, currency) {
  if (!data || !data.length) return "No financial records entered yet.";

  var sym    = _sym(currency);
  var sorted = data.slice().sort(function(a,b){ return new Date(a.date)-new Date(b.date); });
  var n      = sorted.length;

  var totRev  = sorted.reduce(function(s,d){ return s+(d.revenue||0);  },0);
  var totExp  = sorted.reduce(function(s,d){ return s+(d.expenses||0); },0);
  var totProf = sorted.reduce(function(s,d){ return s+(d.profit||0);   },0);
  var avgMg   = totRev>0 ? (totProf/totRev*100).toFixed(1) : "0";
  var avgRev  = (totRev/n).toFixed(0);

  /* Month-by-month table */
  var rows = sorted.map(function(d) {
    var mo = new Date(d.date).toLocaleString("en-GB",{month:"short",year:"numeric"});
    var mg = d.revenue>0 ? (d.profit/d.revenue*100).toFixed(1) : "0";
    return mo+": Rev="+sym+Number(d.revenue).toLocaleString()
         +" Exp="+sym+Number(d.expenses).toLocaleString()
         +" Profit="+sym+Number(d.profit).toLocaleString()
         +" Margin="+mg+"%";
  });

  /* Growth */
  var growthLine = "";
  if (n>=2) {
    var pct = sorted[0].revenue>0
      ? (((sorted[n-1].revenue - sorted[0].revenue)/sorted[0].revenue)*100).toFixed(1)
      : "0";
    growthLine = "Overall revenue change (first→last): "+pct+"%";
  }

  /* MoM average */
  var momRates = [];
  for (var i=1; i<n; i++) {
    if (sorted[i-1].revenue>0)
      momRates.push(((sorted[i].revenue-sorted[i-1].revenue)/sorted[i-1].revenue*100));
  }
  var avgMoM = momRates.length
    ? (momRates.reduce(function(a,b){return a+b;},0)/momRates.length).toFixed(1)
    : "0";

  /* Last 3 month trend */
  var trendLine = "";
  if (n>=3) {
    var l3    = sorted.slice(-3);
    var revDir = l3[2].revenue > l3[0].revenue ? "↑ growing" : "↓ declining";
    var mgDir  = (l3[2].profit/Math.max(l3[2].revenue,1)) > (l3[0].profit/Math.max(l3[0].revenue,1))
               ? "margin improving" : "margin compressing";
    trendLine = "Last 3 months: revenue "+revDir+", "+mgDir;
  }

  /* Best/worst */
  var bestR  = sorted.reduce(function(a,b){ return b.revenue > a.revenue ? b : a; });
  var worstR = sorted.reduce(function(a,b){ return b.revenue < a.revenue ? b : a; });
  var bestP  = sorted.reduce(function(a,b){ return b.profit  > a.profit  ? b : a; });
  function _mo(d){ return new Date(d.date).toLocaleString("en-GB",{month:"short",year:"numeric"}); }

  /* Expense creep detection */
  var creepLine = "";
  if (n>=4) {
    var half   = Math.floor(n/2);
    var earlyMg = sorted.slice(0,half).reduce(function(s,d){ return s+(d.revenue>0?d.profit/d.revenue:0); },0)/half*100;
    var lateMg  = sorted.slice(-half).reduce(function(s,d){ return s+(d.revenue>0?d.profit/d.revenue:0); },0)/half*100;
    var diff    = (lateMg - earlyMg).toFixed(1);
    creepLine = "Margin drift (first half→second half): "+(diff>0?"+":"")+diff+"%"
              + (diff < -3 ? " ⚠️ cost creep detected" : diff > 3 ? " ✅ efficiency improving" : " — stable");
  }

  /* Volatility */
  var mean   = totRev/n;
  var stdDev = Math.sqrt(sorted.reduce(function(s,d){ return s+Math.pow((d.revenue||0)-mean,2); },0)/n);
  var volPct = mean>0 ? (stdDev/mean*100).toFixed(1) : "0";

  /* Break-even estimate */
  var avgExp2   = totExp/n;
  var fixedEst  = avgExp2 * 0.6;
  var varRatio  = (avgExp2 * 0.4) / Math.max(avgRev, 1);
  var breakEven = varRatio < 1 ? Math.round(fixedEst / (1 - varRatio)) : 0;

  /* Burn rate */
  var lastMo    = sorted[n-1];
  var burnLine  = lastMo && lastMo.profit < 0
    ? "⚠️ Currently losing "+sym+Math.abs(lastMo.profit).toLocaleString()+"/month"
    : "";

  return [
    "FINANCIAL DATA ("+n+" months, currency: "+currency+"):",
    rows.join("\n"),
    "",
    "TOTALS: Revenue="+sym+totRev.toLocaleString()
      +" | Expenses="+sym+totExp.toLocaleString()
      +" | Profit="+sym+totProf.toLocaleString()
      +" | Avg Margin="+avgMg+"%",
    "Avg monthly revenue: "+sym+Number(avgRev).toLocaleString(),
    "Avg MoM growth rate: "+avgMoM+"%",
    growthLine,
    trendLine,
    "Revenue volatility (CV): "+volPct+"% "+(volPct>30?"⚠️ high":"✅ stable"),
    creepLine,
    "Best revenue month: "+_mo(bestR)+" ("+sym+Number(bestR.revenue).toLocaleString()+")",
    "Worst revenue month: "+_mo(worstR)+" ("+sym+Number(worstR.revenue).toLocaleString()+")",
    "Best profit month: "+_mo(bestP)+" ("+sym+Number(bestP.profit).toLocaleString()+")",
    breakEven>0 ? "Break-even estimate: "+sym+Number(breakEven).toLocaleString()+"/month" : "",
    burnLine
  ].filter(Boolean).join("\n");
}

/* ================================================================
   SYSTEM PROMPT
   What Gemini knows about ImpactGrid + this user
================================================================ */
function igSystemPrompt(data, currency) {
  var bType  = (document.getElementById("businessType")     ||{}).value || "business";
  var sDate  = (document.getElementById("businessStartDate")||{}).value || "";
  var plan   = window.currentPlan || "basic";
  var memory = window.aiMemoryContext || "";

  return [
    "You are ImpactGrid AI — a sharp, no-nonsense financial adviser for UK SME owners.",
    "You have the user's complete live business data below. Always use real numbers from it.",
    "",
    "BUSINESS PROFILE:",
    "Type: "+bType+" | Plan: "+plan+" | Currency: "+currency,
    sDate ? "Trading since: "+sDate : "",
    "",
    igFinancials(data, currency),
    "",
    memory ? "PREVIOUS REPORT HISTORY:\n"+memory+"\n" : "",
    "RESPONSE RULES — non-negotiable:",
    "1. Be SHORT. 3–5 sentences max unless they ask for deep analysis or a full report.",
    "2. Always use their exact numbers. Never make up figures.",
    "3. If Reddit/Google market data is in context — reference it in one line max.",
    "4. 'What should I do?' or 'next steps?' → exactly 3 numbered actions, one sentence each.",
    "5. Forecasts → use their actual avg MoM growth rate, show the maths in one line.",
    "6. NEVER say: 'great question', 'certainly!', 'of course', 'As an AI', 'I understand'.",
    "7. NEVER apologise. NEVER hedge with 'it depends' without following up with an answer.",
    "8. Bold (**) only key numbers. No markdown headers (#). No bullet walls.",
    "9. Tone: smart CFO friend texting you. Direct, honest, warm. Not corporate.",
    "10. If they ask about market/industry context and research was provided, use it confidently."
  ].filter(Boolean).join("\n");
}

/* ================================================================
   MAIN ENTRY POINT
   Called by script.js: ImpactGridAI.analyze(question, data, currency, history)
================================================================ */
var ImpactGridAI = {

  analyze: async function(question, data, currency, history) {
    history  = history  || [];
    currency = currency || window.currentCurrency || "GBP";
    data     = data     || window.businessData    || [];

    /* Strip memory prefix that plans.js injects */
    var q = question;
    if (window.aiMemoryContext && q.startsWith(window.aiMemoryContext)) {
      q = q.slice(window.aiMemoryContext.length).replace(/^CURRENT SESSION:\n/,"").trim();
    }
    q = q.trim();

    /* No key → instant fallback */
    if (!GEMINI_API_KEY || GEMINI_API_KEY.startsWith("YOUR"))
      return igFallback(data, currency);

    var bType = (document.getElementById("businessType")||{}).value || "SME";

    /* 1. Market research — Reddit + Google in parallel (only if question warrants it) */
    var research = null;
    if (igNeedsResearch(q)) {
      var [rRes, gRes] = await Promise.allSettled([
        igReddit(q + " " + bType + " UK", bType),
        igGoogle(q + " " + bType + " UK industry statistics 2024 2025")
      ]);
      var parts = [];
      if (rRes.status==="fulfilled" && rRes.value) parts.push(rRes.value);
      if (gRes.status==="fulfilled" && gRes.value) parts.push(gRes.value);
      if (parts.length) research = parts.join("\n\n");
    }

    /* 2. Build Gemini conversation */
    var contents = [];

    /* Inject research as context turn first */
    if (research) {
      contents.push({
        role:  "user",
        parts: [{ text: "LIVE MARKET RESEARCH — use this as context, cite sparingly:\n\n" + research }]
      });
      contents.push({
        role:  "model",
        parts: [{ text: "Understood, I have the market context." }]
      });
    }

    /* Chat history — last 8 turns, strip HTML from AI messages */
    history.slice(-8).forEach(function(m) {
      var isUser = m.role==="user" || m.role==="human";
      var text   = isUser
        ? m.content
        : (m.content||"").replace(/<[^>]+>/g,"").replace(/→ /g,"- ");
      if (text && text.trim()) {
        contents.push({ role: isUser?"user":"model", parts:[{text:text.trim()}] });
      }
    });

    /* Current question */
    contents.push({ role:"user", parts:[{text:q}] });

    /* 3. Call Gemini 2.0 Flash */
    try {
      var res = await fetch(_gURL(), {
        method:  "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          system_instruction: { parts:[{ text: igSystemPrompt(data, currency) }] },
          contents: contents,
          generationConfig: {
            temperature:     0.65,
            maxOutputTokens: 550,
            topP:            0.9,
            topK:            40
          },
          safetySettings: [
            {category:"HARM_CATEGORY_HARASSMENT",        threshold:"BLOCK_NONE"},
            {category:"HARM_CATEGORY_HATE_SPEECH",       threshold:"BLOCK_NONE"},
            {category:"HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold:"BLOCK_NONE"},
            {category:"HARM_CATEGORY_DANGEROUS_CONTENT", threshold:"BLOCK_NONE"}
          ]
        })
      });

      if (!res.ok) {
        var err = await res.json().catch(function(){return{};});
        console.error("[ImpactGrid AI] Gemini error:", res.status, err);
        if (res.status===429)
          return "⏱ Rate limit hit — Gemini free tier is 15 requests/min. Wait a moment and try again.";
        return igFallback(data, currency);
      }

      var json = await res.json();
      var text = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!text) return igFallback(data, currency);

      return igFormat(text, research);

    } catch(e) {
      console.error("[ImpactGrid AI]", e);
      return igFallback(data, currency);
    }
  }
};

/* ================================================================
   FORMAT — Gemini markdown → HTML for chat UI
================================================================ */
function igFormat(text, research) {
  var html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g,     "<em>$1</em>")
    .replace(/^(\d+)\.\s+(.+)$/gm,
      "<div style='margin:5px 0'><strong>$1.</strong> $2</div>")
    .replace(/^[-•]\s+(.+)$/gm,
      "<div style='margin:3px 0 3px 12px'>→ $1</div>")
    .replace(/\n{2,}/g, "<br><br>")
    .replace(/\n/g,     "<br>");

  /* Source badges */
  if (research) {
    var badges = [];
    if (research.includes("REDDIT")) badges.push("💬 Reddit");
    if (research.includes("GOOGLE")) badges.push("📰 Google");
    if (badges.length) {
      html += "<br><br><span style='font-size:10px;color:var(--text-muted);"
            + "font-family:monospace'>Sources: "
            + badges.join(" + ") + "</span>";
    }
  }
  return html;
}

/* ================================================================
   FALLBACK — when Gemini key not set
================================================================ */
function igFallback(data, currency) {
  var sym = _sym(currency);
  if (!data || !data.length)
    return "No data yet — add your first month to get started.";
  var rev  = data.reduce(function(s,d){ return s+(d.revenue||0);  },0);
  var prof = data.reduce(function(s,d){ return s+(d.profit||0);   },0);
  var mg   = rev>0 ? (prof/rev*100).toFixed(1) : "0";
  return "<strong>Quick summary</strong><br>"
    + "Revenue: <strong>"+sym+rev.toLocaleString()+"</strong><br>"
    + "Profit: <strong>"+sym+prof.toLocaleString()+"</strong> · "
    + "Margin: <strong>"+mg+"%</strong><br><br>"
    + "<span style='color:var(--text-muted);font-size:11px'>"
    + "⚙️ Paste your Gemini API key into <code>impactgrid-ai.js</code> to unlock full AI.</span>";
}

window.ImpactGridAI = ImpactGridAI;
