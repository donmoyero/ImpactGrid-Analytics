/* ================================================================
   IMPACTGRID AI ENGINE v4.0 — Powered by Google Gemini (Free)
   + Google Custom Search for live market research

   HOW TO SET UP (free, takes 5 mins):
   ─────────────────────────────────────
   1. GEMINI API KEY (free):
      → https://aistudio.google.com/app/apikey
      → Create API key → paste below as GEMINI_API_KEY

   2. GOOGLE CUSTOM SEARCH (100 free searches/day):
      → https://programmablesearchengine.google.com/
      → Create search engine → get Search Engine ID
      → https://console.cloud.google.com/ → enable Custom Search API → get API key
      → paste both below

   Drop this file in place of the old impactgrid-ai.js.
   No other files need changing.
================================================================ */

/* ── YOUR KEYS — replace these ── */
var GEMINI_API_KEY  = "YOUR_GEMINI_API_KEY_HERE";
var GOOGLE_CSE_KEY  = "YOUR_GOOGLE_SEARCH_API_KEY_HERE";
var GOOGLE_CSE_ID   = "YOUR_CUSTOM_SEARCH_ENGINE_ID_HERE";

/* ── Gemini model — Flash is free tier ── */
var GEMINI_MODEL = "gemini-1.5-flash-latest";
var GEMINI_URL   = "https://generativelanguage.googleapis.com/v1beta/models/"
                 + GEMINI_MODEL + ":generateContent?key=" + GEMINI_API_KEY;

/* ================================================================
   MARKET RESEARCH — Google Custom Search
   Called automatically when question looks like market/industry query
================================================================ */
async function igMarketSearch(query) {
  if (!GOOGLE_CSE_KEY || GOOGLE_CSE_KEY.startsWith("YOUR")) return null;
  try {
    var url = "https://www.googleapis.com/customsearch/v1"
      + "?key=" + GOOGLE_CSE_KEY
      + "&cx="  + GOOGLE_CSE_ID
      + "&num=3"
      + "&q="   + encodeURIComponent(query);

    var res  = await fetch(url);
    if (!res.ok) return null;
    var json = await res.json();
    if (!json.items || !json.items.length) return null;

    /* Return top 3 snippets as context */
    return json.items.slice(0, 3).map(function(item) {
      return "• " + item.title + ": " + (item.snippet || "").replace(/\n/g, " ");
    }).join("\n");

  } catch(e) {
    console.warn("[ImpactGrid] Market search failed:", e.message);
    return null;
  }
}

/* ================================================================
   DETECT IF QUESTION NEEDS MARKET RESEARCH
================================================================ */
function igNeedsMarketData(question) {
  var q = question.toLowerCase();
  var triggers = [
    "market","industry","competitor","benchmark","sector","trend",
    "economy","inflation","interest rate","average","typical","standard",
    "how do i compare","similar business","other business","my area",
    "uk sme","small business","retail average","hospitality","café","restaurant",
    "construction","consulting","tech startup","ecommerce","what's happening"
  ];
  return triggers.some(function(t) { return q.includes(t); });
}

/* ================================================================
   BUILD SYSTEM PROMPT
   Packs in all the user's live financial data + profile + history
================================================================ */
function igBuildSystemPrompt(data, currency, memoryContext) {
  var sym = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "NGN" ? "₦" : "£";

  /* Business profile */
  var businessType  = (document.getElementById("businessType")      || {}).value || "business";
  var startDate     = (document.getElementById("businessStartDate") || {}).value || "";
  var reportingDate = (document.getElementById("reportingDate")     || {}).value || "";
  var plan          = window.currentPlan || "basic";

  /* Financial records summary */
  var recordsSummary = "";
  if (data && data.length) {
    var totalRev  = data.reduce(function(s,d){return s+(d.revenue||0);},0);
    var totalExp  = data.reduce(function(s,d){return s+(d.expenses||0);},0);
    var totalProf = data.reduce(function(s,d){return s+(d.profit||0);},0);
    var avgMargin = totalRev > 0 ? ((totalProf/totalRev)*100).toFixed(1) : "0";

    /* Month-by-month table */
    var rows = data.slice().sort(function(a,b){return new Date(a.date)-new Date(b.date);}).map(function(d) {
      var mo     = new Date(d.date).toLocaleString("en-GB",{month:"short",year:"numeric"});
      var margin = d.revenue > 0 ? ((d.profit/d.revenue)*100).toFixed(1) : "0";
      return mo + ": Rev=" + sym + Number(d.revenue||0).toLocaleString()
           + " Exp=" + sym + Number(d.expenses||0).toLocaleString()
           + " Profit=" + sym + Number(d.profit||0).toLocaleString()
           + " Margin=" + margin + "%";
    });

    /* Growth trend */
    var sorted = data.slice().sort(function(a,b){return new Date(a.date)-new Date(b.date);});
    var growthNote = "";
    if (sorted.length >= 2) {
      var first = sorted[0].revenue;
      var last  = sorted[sorted.length-1].revenue;
      var pct   = first > 0 ? (((last-first)/first)*100).toFixed(1) : "0";
      growthNote = "Overall revenue change first→last month: " + pct + "%";
    }

    recordsSummary = [
      "FINANCIAL DATA (" + data.length + " months, currency: " + currency + "):",
      rows.join("\n"),
      "TOTALS: Revenue=" + sym + totalRev.toLocaleString()
        + " | Expenses=" + sym + totalExp.toLocaleString()
        + " | Profit=" + sym + totalProf.toLocaleString()
        + " | Avg Margin=" + avgMargin + "%",
      growthNote
    ].join("\n");
  } else {
    recordsSummary = "No financial records entered yet.";
  }

  return [
    "You are ImpactGrid AI — a sharp, direct financial adviser for SME owners.",
    "You have full access to this user's real business data below. Use it.",
    "",
    "BUSINESS PROFILE:",
    "Type: " + businessType,
    startDate     ? "Trading since: " + startDate     : "",
    reportingDate ? "Reporting date: " + reportingDate : "",
    "Plan: " + plan,
    "",
    recordsSummary,
    "",
    memoryContext ? ("PREVIOUS REPORT HISTORY:\n" + memoryContext) : "",
    "",
    "YOUR RULES:",
    "- Be concise. Short sharp answers. No waffle.",
    "- Use the actual numbers from their data — be specific.",
    "- If market research is provided below, cite it briefly.",
    "- Give numbered action points when they ask what to do.",
    "- Never say 'I cannot access real-time data' — if market data is provided, use it.",
    "- Respond in plain text. Use ** for bold sparingly. No markdown headers.",
    "- If data is missing, say so in one line then answer with what you have.",
    "- Currency is always " + currency + " (" + sym + ")."
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

    /* Strip memory prefix if plans.js pre-pended it — we rebuild it ourselves */
    var cleanQuestion = question;
    if (window.aiMemoryContext && question.startsWith(window.aiMemoryContext)) {
      cleanQuestion = question.slice(window.aiMemoryContext.length).replace(/^CURRENT SESSION:\n/,"").trim();
    }

    /* 1. Check if market research would help */
    var marketContext = null;
    if (igNeedsMarketData(cleanQuestion)) {
      var businessType = (document.getElementById("businessType")||{}).value || "SME";
      var searchQuery  = cleanQuestion + " " + businessType + " UK 2024 industry data";
      marketContext    = await igMarketSearch(searchQuery);
    }

    /* 2. Build system prompt with all data */
    var systemPrompt = igBuildSystemPrompt(data, currency, window.aiMemoryContext || "");

    /* 3. Build conversation turns for Gemini */
    var contents = [];

    /* Inject market research as a system-like context turn if we got results */
    if (marketContext) {
      contents.push({
        role: "user",
        parts: [{ text: "LIVE MARKET RESEARCH for this query:\n" + marketContext + "\n\nUse this data when answering." }]
      });
      contents.push({
        role: "model",
        parts: [{ text: "Got it — I'll incorporate the market data." }]
      });
    }

    /* Add conversation history (last 6 turns to stay within token limits) */
    var recent = history.slice(-6);
    recent.forEach(function(m) {
      if (m.role === "user" || m.role === "human") {
        contents.push({ role: "user",  parts: [{ text: m.content }] });
      } else if (m.role === "ai" || m.role === "assistant" || m.role === "model") {
        /* Strip HTML tags from previous AI responses */
        var plain = (m.content || "").replace(/<[^>]+>/g, "");
        contents.push({ role: "model", parts: [{ text: plain }] });
      }
    });

    /* Add the current question */
    contents.push({
      role: "user",
      parts: [{ text: cleanQuestion }]
    });

    /* 4. Call Gemini */
    try {
      if (!GEMINI_API_KEY || GEMINI_API_KEY.startsWith("YOUR")) {
        return igFallback(cleanQuestion, data, currency);
      }

      var body = {
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: contents,
        generationConfig: {
          temperature:     0.7,
          maxOutputTokens: 600,
          topP:            0.9
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      };

      var res = await fetch(GEMINI_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body)
      });

      if (!res.ok) {
        var errJson = await res.json().catch(function(){return {};});
        console.error("[ImpactGrid AI] Gemini error:", res.status, errJson);

        /* Handle quota exceeded gracefully */
        if (res.status === 429) {
          return "<strong>AI quota reached</strong> — Gemini free tier limit hit. Try again in a minute.";
        }
        return igFallback(cleanQuestion, data, currency);
      }

      var json = await res.json();
      var text = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!text) return igFallback(cleanQuestion, data, currency);

      /* Format response: bold, line breaks, numbered lists */
      return igFormatResponse(text, marketContext);

    } catch(e) {
      console.error("[ImpactGrid AI] fetch failed:", e);
      return igFallback(cleanQuestion, data, currency);
    }
  }
};

/* ================================================================
   FORMAT RESPONSE
   Converts Gemini plain text to clean HTML for the chat UI
================================================================ */
function igFormatResponse(text, marketContext) {
  var html = text
    /* Bold */
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    /* Italic */
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    /* Numbered lists */
    .replace(/^(\d+)\.\s+(.+)$/gm, "<div style='margin:4px 0;'><strong>$1.</strong> $2</div>")
    /* Bullet lists */
    .replace(/^[-•]\s+(.+)$/gm, "<div style='margin:3px 0 3px 10px;'>→ $1</div>")
    /* Double newlines → paragraph break */
    .replace(/\n{2,}/g, "<br><br>")
    /* Single newlines */
    .replace(/\n/g, "<br>");

  /* Append market source note if we used live search */
  if (marketContext) {
    html += "<br><br><span style='font-size:10px;color:var(--text-muted);font-family:monospace;'>"
         + "📡 Market data: live Google search</span>";
  }

  return html;
}

/* ================================================================
   FALLBACK — basic rule-based response if API key not set yet
================================================================ */
function igFallback(question, data, currency) {
  var sym = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "NGN" ? "₦" : "£";
  if (!data || !data.length) {
    return "No financial data yet. Add your first month's revenue and expenses to get started.";
  }
  var totalRev  = data.reduce(function(s,d){return s+(d.revenue||0);},0);
  var totalProf = data.reduce(function(s,d){return s+(d.profit||0);},0);
  var margin    = totalRev > 0 ? ((totalProf/totalRev)*100).toFixed(1) : "0";
  return "<strong>Quick summary</strong><br>"
    + "Revenue: <strong>" + sym + totalRev.toLocaleString() + "</strong><br>"
    + "Profit: <strong>" + sym + totalProf.toLocaleString() + "</strong><br>"
    + "Margin: <strong>" + margin + "%</strong><br><br>"
    + "<span style='color:var(--text-muted);font-size:11px;'>⚠️ Add your Gemini API key to impactgrid-ai.js for full AI responses.</span>";
}

/* Expose globally */
window.ImpactGridAI = ImpactGridAI;
