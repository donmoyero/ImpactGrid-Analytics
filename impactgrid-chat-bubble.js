/* ================================================================
   IMPACTGRID CHAT BUBBLE v6.0 — Dijo
   + Supabase chat history (persists across sessions)
   + Gemini AI (same key as impactgrid-ai.js)
   + Reddit + Google market research
   + Reads live businessData, plan, currency from dashboard

   REQUIRES: supabase.js loaded first on the page
================================================================ */

(function () {

  /* ── Config ── */
  var GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE"; /* same key as impactgrid-ai.js */
  var GEMINI_MODEL   = "gemini-2.0-flash";
  var MAX_HISTORY    = 20;   /* messages kept in Supabase per user */
  var HISTORY        = [];   /* in-memory for this session         */
  var TYPING         = false;
  var DB_LOADED      = false;

  function _gURL() {
    return "https://generativelanguage.googleapis.com/v1beta/models/"
         + GEMINI_MODEL + ":generateContent?key=" + GEMINI_API_KEY;
  }
  function _sym(c) { return ({USD:"$",EUR:"€",NGN:"₦",GBP:"£"})[c]||"£"; }

  /* ================================================================
     SUPABASE CHAT HISTORY
     Table: ai_chat_history (user_id, messages jsonb, updated_at)
     Run this SQL once in Supabase → SQL Editor:

     create table if not exists ai_chat_history (
       id         uuid default gen_random_uuid() primary key,
       user_id    uuid references auth.users(id) on delete cascade unique,
       messages   jsonb not null default '[]',
       updated_at timestamptz default now()
     );
     alter table ai_chat_history enable row level security;
     create policy "owner only" on ai_chat_history
       for all using (auth.uid() = user_id);
  ================================================================ */

  async function dbLoad() {
    try {
      var sb = await window.supabaseReady;
      var { data: { session } } = await sb.auth.getSession();
      if (!session) return;

      var { data, error } = await sb.from("ai_chat_history")
        .select("messages")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) { console.warn("[Dijo] load error:", error.message); return; }
      if (!data || !data.messages) return;

      var saved = Array.isArray(data.messages) ? data.messages : JSON.parse(data.messages);
      /* Load last MAX_HISTORY messages into memory */
      HISTORY = saved.slice(-MAX_HISTORY);
      DB_LOADED = true;

      /* Replay into UI — skip welcome msg, show last 8 */
      var toShow = HISTORY.slice(-8);
      toShow.forEach(function(m) {
        if (m.role === "user") {
          igAppendMsg("user", igEsc(m.content), true);
        } else {
          igAppendMsg("ai", m.content, true);
        }
      });
      if (toShow.length) igScrollBottom();

    } catch(e) {
      console.warn("[Dijo] dbLoad exception:", e.message);
    }
  }

  async function dbSave() {
    try {
      var sb = await window.supabaseReady;
      var { data: { session } } = await sb.auth.getSession();
      if (!session) return;

      /* Keep last MAX_HISTORY messages only */
      var toSave = HISTORY.slice(-MAX_HISTORY);

      await sb.from("ai_chat_history").upsert({
        user_id:    session.user.id,
        messages:   toSave,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });

    } catch(e) {
      console.warn("[Dijo] dbSave exception:", e.message);
    }
  }

  /* ================================================================
     INJECT CSS
  ================================================================ */
  var link = document.createElement("link");
  link.rel  = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:wght@700&display=swap";
  document.head.appendChild(link);

  var style = document.createElement("style");
  style.textContent = `
    #ig-bubble-btn {
      position:fixed;bottom:28px;right:28px;z-index:99999;
      width:60px;height:60px;border-radius:50%;
      background:linear-gradient(135deg,#1a3a6a,#2563eb);
      border:none;cursor:pointer;
      box-shadow:0 8px 32px rgba(37,99,235,0.4),0 2px 8px rgba(0,0,0,0.15);
      display:flex;align-items:center;justify-content:center;
      transition:transform 0.2s,box-shadow 0.2s;
      animation:ig-bubble-in 0.5s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes ig-bubble-in{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
    #ig-bubble-btn:hover{transform:scale(1.08);box-shadow:0 12px 40px rgba(37,99,235,0.5)}
    #ig-bubble-btn.open svg.chat-icon{display:none}
    #ig-bubble-btn.open svg.close-icon{display:block!important}
    #ig-unread{
      position:absolute;top:-2px;right:-2px;
      width:18px;height:18px;border-radius:50%;
      background:#ef4444;border:2px solid #fff;
      font-family:'DM Sans',sans-serif;font-size:10px;font-weight:700;color:#fff;
      display:flex;align-items:center;justify-content:center;
      animation:ig-badge-pop 0.3s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes ig-badge-pop{from{transform:scale(0)}to{transform:scale(1)}}
    #ig-chat-panel{
      position:fixed;bottom:100px;right:28px;z-index:99998;
      width:360px;background:#ffffff;border-radius:20px;
      box-shadow:0 24px 80px rgba(0,0,0,0.18),0 4px 16px rgba(0,0,0,0.08);
      display:flex;flex-direction:column;overflow:hidden;
      transform-origin:bottom right;
      animation:ig-panel-in 0.35s cubic-bezier(0.34,1.56,0.64,1);
      max-height:580px;font-family:'DM Sans',sans-serif;
    }
    @keyframes ig-panel-in{from{transform:scale(0.7) translateY(20px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
    #ig-chat-panel.closing{animation:ig-panel-out 0.2s ease-in forwards}
    @keyframes ig-panel-out{to{transform:scale(0.7) translateY(20px);opacity:0}}
    .ig-panel-header{
      background:linear-gradient(135deg,#1a3a6a 0%,#2563eb 100%);
      padding:18px 20px 16px;display:flex;align-items:center;gap:12px;flex-shrink:0;
    }
    .ig-header-avatar{
      width:40px;height:40px;border-radius:50%;
      background:rgba(255,255,255,0.15);border:1.5px solid rgba(255,255,255,0.3);
      display:flex;align-items:center;justify-content:center;
      flex-shrink:0;position:relative;
    }
    .ig-header-avatar::after{
      content:'';position:absolute;bottom:1px;right:1px;
      width:10px;height:10px;border-radius:50%;
      background:#4ade80;border:2px solid #1a3a6a;
    }
    .ig-header-text{flex:1;min-width:0}
    .ig-header-name{font-family:'Fraunces',Georgia,serif;font-size:15px;font-weight:700;color:#fff;line-height:1.2}
    .ig-header-sub{font-size:11px;color:rgba(255,255,255,0.65);margin-top:2px;font-weight:400}
    .ig-header-actions{display:flex;align-items:center;gap:6px;flex-shrink:0}
    .ig-header-btn{
      background:rgba(255,255,255,0.12);border:none;border-radius:8px;
      width:30px;height:30px;color:rgba(255,255,255,0.8);cursor:pointer;
      display:flex;align-items:center;justify-content:center;transition:background 0.2s;
    }
    .ig-header-btn:hover{background:rgba(255,255,255,0.22)}
    .ig-messages{
      flex:1;overflow-y:auto;padding:20px 16px 12px;
      display:flex;flex-direction:column;gap:12px;
      min-height:260px;max-height:360px;
      scroll-behavior:smooth;background:#f8faff;
    }
    .ig-messages::-webkit-scrollbar{width:3px}
    .ig-messages::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:2px}
    .ig-msg{display:flex;gap:8px;align-items:flex-end;animation:ig-msg-in 0.25s ease;max-width:100%}
    @keyframes ig-msg-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    .ig-msg.user{flex-direction:row-reverse}
    .ig-msg-av{
      width:28px;height:28px;border-radius:50%;flex-shrink:0;
      display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;
    }
    .ig-msg.ai   .ig-msg-av{background:linear-gradient(135deg,#1a3a6a,#2563eb);color:#fff}
    .ig-msg.user .ig-msg-av{background:#e2e8f0;color:#64748b}
    .ig-msg-text{
      padding:10px 14px;border-radius:14px;
      font-size:13.5px;line-height:1.65;max-width:78%;word-break:break-word;
    }
    .ig-msg.ai   .ig-msg-text{background:#fff;border:1px solid #e8edf5;color:#1e293b;border-bottom-left-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.04)}
    .ig-msg.user .ig-msg-text{background:linear-gradient(135deg,#1a3a6a,#2563eb);color:#fff;border-bottom-right-radius:4px}
    .ig-msg-text strong{font-weight:600}
    .ig-msg-text a{color:#2563eb;text-decoration:underline}
    .ig-msg-time{font-size:9px;color:#94a3b8;margin-top:3px;text-align:right}
    .ig-typing{display:flex;gap:8px;align-items:flex-end;padding:0 16px 8px}
    .ig-typing-av{
      width:28px;height:28px;border-radius:50%;
      background:linear-gradient(135deg,#1a3a6a,#2563eb);
      display:flex;align-items:center;justify-content:center;
      font-size:11px;font-weight:700;color:#fff;flex-shrink:0;
    }
    .ig-typing-dots{
      display:flex;gap:4px;align-items:center;padding:10px 14px;
      background:#fff;border:1px solid #e8edf5;border-radius:14px;
      border-bottom-left-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.04);
    }
    .ig-typing-dots span{width:6px;height:6px;border-radius:50%;background:#94a3b8;animation:ig-dot 1.4s ease-in-out infinite}
    .ig-typing-dots span:nth-child(2){animation-delay:0.2s}
    .ig-typing-dots span:nth-child(3){animation-delay:0.4s}
    @keyframes ig-dot{0%,80%,100%{transform:translateY(0);opacity:0.4}40%{transform:translateY(-5px);opacity:1}}
    .ig-input-row{
      display:flex;align-items:center;gap:8px;padding:12px 16px;
      border-top:1px solid #f1f5f9;background:#fff;flex-shrink:0;
    }
    .ig-input{
      flex:1;border:1.5px solid #e2e8f0;border-radius:12px;
      padding:10px 14px;font-size:13.5px;font-family:'DM Sans',sans-serif;
      outline:none;transition:border-color 0.2s;background:#f8faff;color:#1e293b;
    }
    .ig-input:focus{border-color:#2563eb;background:#fff}
    .ig-send{
      width:38px;height:38px;border-radius:10px;border:none;cursor:pointer;
      background:linear-gradient(135deg,#1a3a6a,#2563eb);
      display:flex;align-items:center;justify-content:center;
      transition:transform 0.15s,box-shadow 0.15s;flex-shrink:0;
    }
    .ig-send:hover{transform:scale(1.05);box-shadow:0 4px 12px rgba(37,99,235,0.4)}
    .ig-send:disabled{opacity:0.5;cursor:not-allowed;transform:none}
    .ig-powered{
      text-align:center;font-size:10px;color:#94a3b8;
      padding:6px 0 10px;background:#fff;flex-shrink:0;
    }
    .ig-powered a{color:#2563eb;text-decoration:none}
    .ig-clear-btn{
      font-size:10px;color:rgba(255,255,255,0.55);background:none;border:none;
      cursor:pointer;padding:2px 6px;border-radius:4px;transition:color 0.2s;
    }
    .ig-clear-btn:hover{color:#fff}
    @media(max-width:420px){
      #ig-chat-panel{width:calc(100vw - 24px);right:12px;bottom:88px}
      #ig-bubble-btn{bottom:20px;right:16px}
    }
  `;
  document.head.appendChild(style);

  /* ================================================================
     INJECT HTML
  ================================================================ */
  var wrap = document.createElement("div");
  wrap.innerHTML = `
    <button id="ig-bubble-btn" onclick="igToggleChat()" aria-label="Open AI chat">
      <svg class="chat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <svg class="close-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" style="display:none">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>

    <div id="ig-chat-panel" style="display:none;">
      <div class="ig-panel-header">
        <div class="ig-header-avatar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        </div>
        <div class="ig-header-text">
          <div class="ig-header-name">Dijo by ImpactGrid</div>
          <div class="ig-header-sub" id="ig-header-sub">Your AI adviser · Online now</div>
        </div>
        <div class="ig-header-actions">
          <button class="ig-header-btn ig-clear-btn" onclick="igClearHistory()" title="Clear chat history">🗑</button>
          <button class="ig-header-btn" onclick="igToggleChat()" title="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="ig-messages" id="ig-messages"></div>
      <div class="ig-typing" id="ig-typing" style="display:none;">
        <div class="ig-typing-av">AI</div>
        <div class="ig-typing-dots"><span></span><span></span><span></span></div>
      </div>
      <div class="ig-input-row">
        <input id="ig-input" class="ig-input" placeholder="Ask Dijo anything…"
          onkeydown="if(event.key==='Enter'){event.preventDefault();igSend();}">
        <button class="ig-send" id="ig-send-btn" onclick="igSend()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
      <div class="ig-powered">Powered by <a href="https://impactgridanalytics.com" target="_blank">ImpactGrid</a></div>
    </div>
  `;
  document.body.appendChild(wrap);

  /* ================================================================
     INIT — load history + show welcome
  ================================================================ */
  setTimeout(async function () {
    /* Try to load saved history from Supabase */
    await dbLoad();

    /* Show welcome only if no history was loaded */
    if (!HISTORY.length) {
      var isLoggedIn = !!(window.currentUser || window.__igLoggedIn);
      var name = window.currentUser
        ? (window.currentUser.user_metadata||{}).full_name || null
        : null;
      var greeting = name
        ? "Hey " + name.split(" ")[0] + "! 👋 I'm Dijo — your ImpactGrid AI adviser. Ask me about your numbers, forecasts, or anything business-related."
        : "Hey! 👋 I'm Dijo, your ImpactGrid AI adviser. Ask me about your business data, forecasts, or market research — I'm wired into your live numbers.";

      if (!isLoggedIn) {
        greeting = "Hey! 👋 I'm Dijo. Happy to explain what ImpactGrid does, how pricing works, or anything else. What do you want to know?";
      }
      igAppendMsg("ai", greeting);
    }

    /* Update sub-header with user context */
    var sub = document.getElementById("ig-header-sub");
    if (sub && window.currentUser) {
      var plan = window.currentPlan || "basic";
      sub.textContent = "AI adviser · " + plan.charAt(0).toUpperCase()+plan.slice(1) + " plan";
    }
  }, 400);

  /* ================================================================
     TOGGLE PANEL
  ================================================================ */
  window.igToggleChat = function () {
    var panel  = document.getElementById("ig-chat-panel");
    var btn    = document.getElementById("ig-bubble-btn");
    var unread = document.getElementById("ig-unread");
    var isOpen = panel.style.display !== "none";
    if (isOpen) {
      panel.classList.add("closing");
      setTimeout(function () { panel.style.display = "none"; panel.classList.remove("closing"); }, 200);
      btn.classList.remove("open");
    } else {
      panel.style.display = "flex";
      panel.style.flexDirection = "column";
      btn.classList.add("open");
      if (unread) unread.remove();
      document.getElementById("ig-input").focus();
      igScrollBottom();
    }
  };

  /* ================================================================
     CLEAR HISTORY
  ================================================================ */
  window.igClearHistory = async function () {
    HISTORY = [];
    var msgs = document.getElementById("ig-messages");
    if (msgs) msgs.innerHTML = "";
    igAppendMsg("ai", "History cleared. Fresh start — what do you want to know?");
    /* Clear in Supabase too */
    try {
      var sb = await window.supabaseReady;
      var { data: { session } } = await sb.auth.getSession();
      if (session) {
        await sb.from("ai_chat_history").upsert({
          user_id: session.user.id,
          messages: [],
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });
      }
    } catch(e) {}
  };

  /* ================================================================
     SEND
  ================================================================ */
  window.igSend = function () {
    var input = document.getElementById("ig-input");
    var msg   = (input ? input.value : "").trim();
    if (!msg || TYPING) return;
    input.value = "";
    igAsk(msg);
  };

  /* ================================================================
     ASK — main AI call
  ================================================================ */
  window.igAsk = async function (message) {
    if (!message || TYPING) return;

    igAppendMsg("user", igEsc(message));
    HISTORY.push({ role: "user", content: message });

    TYPING = true;
    var typingEl = document.getElementById("ig-typing");
    var sendBtn  = document.getElementById("ig-send-btn");
    if (typingEl) typingEl.style.display = "flex";
    if (sendBtn)  sendBtn.disabled = true;
    igScrollBottom();

    try {
      if (!GEMINI_API_KEY || GEMINI_API_KEY.startsWith("YOUR")) {
        throw new Error("no_key");
      }

      /* 1. Market research if needed */
      var research = null;
      if (igNeedsResearch(message)) {
        var bType = (document.getElementById("businessType")||{}).value || "SME";
        var [rRes, gRes] = await Promise.allSettled([
          igReddit(message + " " + bType + " UK", bType),
          igGoogle(message + " " + bType + " UK industry 2025")
        ]);
        var parts = [];
        if (rRes.status==="fulfilled" && rRes.value) parts.push(rRes.value);
        if (gRes.status==="fulfilled" && gRes.value) parts.push(gRes.value);
        if (parts.length) research = parts.join("\n\n");
      }

      /* 2. Build contents */
      var contents = [];

      /* Research context turn */
      if (research) {
        contents.push({ role:"user",  parts:[{text:"LIVE MARKET RESEARCH:\n\n" + research}] });
        contents.push({ role:"model", parts:[{text:"Got the market context."}] });
      }

      /* Last 8 turns of history (excluding current message) */
      HISTORY.slice(-9, -1).forEach(function(m) {
        var isUser = m.role === "user";
        var text   = isUser ? m.content : (m.content||"").replace(/<[^>]+>/g,"");
        if (text.trim()) contents.push({ role: isUser?"user":"model", parts:[{text:text.trim()}] });
      });

      /* Current message */
      contents.push({ role:"user", parts:[{text:message}] });

      /* 3. Call Gemini */
      var res = await fetch(_gURL(), {
        method:  "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          system_instruction: { parts:[{text: igSystemPrompt()}] },
          contents: contents,
          generationConfig: { temperature:0.65, maxOutputTokens:500, topP:0.9 },
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
        if (res.status === 429) throw new Error("rate_limit");
        throw new Error("api_" + res.status);
      }

      var json  = await res.json();
      var reply = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!reply) throw new Error("empty");

      var html = igFormat(reply, research);
      HISTORY.push({ role: "assistant", content: html });
      igAppendMsg("ai", html);

      /* Save to Supabase after every reply */
      dbSave();

    } catch(e) {
      var errMsg;
      if (e.message === "no_key") {
        errMsg = "Gemini API key not set yet — add it to <code>impactgrid-chat-bubble.js</code>.";
      } else if (e.message === "rate_limit") {
        errMsg = "⏱ Rate limit hit — free tier is 15 requests/min. Wait a moment.";
      } else {
        errMsg = "Hmm, something went wrong. Try again in a moment. If it keeps happening, check your Gemini API key.";
      }
      igAppendMsg("ai", errMsg);
    } finally {
      TYPING = false;
      if (typingEl) typingEl.style.display = "none";
      if (sendBtn)  sendBtn.disabled = false;
      igScrollBottom();
    }
  };

  /* ================================================================
     SYSTEM PROMPT — knows everything about this user
  ================================================================ */
  function igSystemPrompt() {
    var isLoggedIn = !!(window.currentUser || window.__igLoggedIn);
    var plan       = window.currentPlan || "basic";
    var currency   = window.currentCurrency || "GBP";
    var sym        = _sym(currency);
    var bType      = (document.getElementById("businessType")     ||{}).value || "business";
    var sDate      = (document.getElementById("businessStartDate")||{}).value || "";
    var data       = window.businessData || [];
    var memory     = window.aiMemoryContext || "";

    var financials = "No financial data entered yet.";
    if (data.length) {
      var sorted = data.slice().sort(function(a,b){return new Date(a.date)-new Date(b.date);});
      var totRev  = sorted.reduce(function(s,d){return s+(d.revenue||0);},0);
      var totProf = sorted.reduce(function(s,d){return s+(d.profit||0);},0);
      var avgMg   = totRev>0 ? (totProf/totRev*100).toFixed(1) : "0";
      var rows    = sorted.map(function(d){
        var mo = new Date(d.date).toLocaleString("en-GB",{month:"short",year:"numeric"});
        var mg = d.revenue>0?(d.profit/d.revenue*100).toFixed(1):"0";
        return mo+": Rev="+sym+Number(d.revenue).toLocaleString()
             +" Exp="+sym+Number(d.expenses).toLocaleString()
             +" Profit="+sym+Number(d.profit).toLocaleString()
             +" Margin="+mg+"%";
      });
      financials = "FINANCIAL DATA ("+data.length+" months):\n"
        + rows.join("\n") + "\n"
        + "Totals: Rev="+sym+totRev.toLocaleString()
        + " Profit="+sym+totProf.toLocaleString()
        + " Avg Margin="+avgMg+"%";
    }

    var base = [
      "You are Dijo — ImpactGrid's sharp, friendly AI adviser.",
      "You have access to this user's live business data. Use it. Be specific.",
      "",
      "CONTEXT:",
      isLoggedIn ? ("Plan: "+plan+" | Currency: "+currency+" | Business: "+bType) : "User is a guest (not logged in).",
      sDate ? "Trading since: "+sDate : "",
      "",
      financials,
      "",
      memory ? "REPORT HISTORY:\n"+memory : "",
      "",
      "RULES:",
      "- Short answers. 2–4 sentences max unless they ask for a deep dive.",
      "- Use their exact numbers. Never invent figures.",
      "- If market/Reddit data is in context, reference it in one sentence.",
      "- 'What should I do?' → 3 numbered actions, one sentence each.",
      "- Never say: 'great question', 'certainly', 'As an AI', 'I understand'.",
      "- Tone: smart CFO friend texting you. Direct, warm, honest.",
      isLoggedIn ? "" : "- If they ask about their data, encourage them to sign up and log in."
    ].filter(Boolean).join("\n");

    return base;
  }

  /* ================================================================
     MARKET RESEARCH
  ================================================================ */
  function igNeedsResearch(q) {
    var keywords = ["market","industry","competitor","benchmark","sector","trend","economy","inflation","average","typical","compare","uk sme","small business","retail","hospitality","café","cafe","restaurant","construction","consulting","ecommerce","recession","interest rate","supply chain","is it normal","should i worry","typical for","other business","similar","reddit","cost of living","pricing","charge","rate","wage","staff","hiring","supplier","materials"];
    var lower = q.toLowerCase();
    return keywords.some(function(k){ return lower.indexOf(k) !== -1; });
  }

  async function igReddit(query, businessType) {
    try {
      var bt   = (businessType||"").toLowerCase();
      var subs = ["UKBusiness","smallbusiness","Entrepreneur","ukpersonalfinance","selfemployed_uk"];
      if (/café|cafe|restaurant|food|takeaway/.test(bt)) subs.push("restaurant","KitchenConfidential","cafe");
      if (/retail/.test(bt)) subs.push("retailnews","ecommerce");
      if (/consult|freelance|agency/.test(bt)) subs.push("consulting","freelance");
      if (/tech|saas|software|app/.test(bt)) subs.push("SaaS","startups");
      if (/construct|trade|builder/.test(bt)) subs.push("Construction");

      var url = "https://www.reddit.com/r/" + subs.join("+") + "/search.json"
              + "?q=" + encodeURIComponent(query)
              + "&sort=relevance&t=year&limit=8&restrict_sr=1";

      var res  = await fetch(url, {headers:{"User-Agent":"ImpactGridAI/5.0"}});
      if (!res.ok) return null;
      var json = await res.json();
      var posts = (json?.data?.children||[])
        .map(function(p){return p.data;})
        .filter(function(d){
          return d && d.score>3 && d.title
            && d.selftext!=="[deleted]" && d.selftext!=="[removed]";
        }).slice(0,4);

      if (!posts.length) return null;
      return "REDDIT:\n" + posts.map(function(d){
        var s = (d.selftext||"").replace(/\n/g," ").slice(0,200);
        return "• r/"+d.subreddit+" [↑"+d.score+"] "+d.title+(s?" — "+s:"");
      }).join("\n");
    } catch(e){ return null; }
  }

  async function igGoogle(query) {
    /* Google CSE key is optional — skip silently if not set */
    var key = window._igGoogleCSEKey;
    var cx  = window._igGoogleCSEID;
    if (!key || !cx) return null;
    try {
      var url = "https://www.googleapis.com/customsearch/v1?key="+key+"&cx="+cx
              + "&num=3&q="+encodeURIComponent(query);
      var res  = await fetch(url);
      if (!res.ok) return null;
      var json = await res.json();
      if (!json.items?.length) return null;
      return "GOOGLE:\n" + json.items.slice(0,3).map(function(i){
        return "• "+i.title+": "+(i.snippet||"").replace(/\n/g," ").slice(0,180);
      }).join("\n");
    } catch(e){ return null; }
  }

  /* ================================================================
     HELPERS
  ================================================================ */
  function igAppendMsg(role, html, silent) {
    var msgs = document.getElementById("ig-messages");
    if (!msgs) return;
    var isAI = role === "ai";
    var div  = document.createElement("div");
    div.className = "ig-msg " + role;
    div.innerHTML = '<div class="ig-msg-av">'+(isAI?"AI":"You")+'</div>'
                  + '<div class="ig-msg-text">'+html+'</div>';
    msgs.appendChild(div);
    if (!silent) igScrollBottom();
  }

  function igScrollBottom() {
    var msgs = document.getElementById("ig-messages");
    if (msgs) setTimeout(function(){ msgs.scrollTop = msgs.scrollHeight; }, 50);
  }

  function igEsc(str) {
    return String(str)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;")
      .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  function igFormat(text, research) {
    var html = text
      .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
      .replace(/\*(.+?)\*/g,"<em>$1</em>")
      .replace(/^(\d+)\.\s+(.+)$/gm,"<div style='margin:4px 0'><strong>$1.</strong> $2</div>")
      .replace(/^[-•]\s+(.+)$/gm,"<div style='margin:3px 0 3px 10px'>→ $1</div>")
      .replace(/\n{2,}/g,"<br><br>")
      .replace(/\n/g,"<br>");

    if (research) {
      var badges = [];
      if (research.includes("REDDIT")) badges.push("💬 Reddit");
      if (research.includes("GOOGLE")) badges.push("📰 Google");
      if (badges.length) {
        html += "<br><span style='font-size:10px;color:#94a3b8;font-family:monospace'>"
              + "Sources: "+badges.join(" + ")+"</span>";
      }
    }
    return html;
  }

})();
