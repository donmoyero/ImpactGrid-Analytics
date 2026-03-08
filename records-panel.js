/* ================================================================
   IMPACTGRID — RECORDS PANEL v2.0
   Spreadsheet-style sidebar panel.
   Data persists in Supabase per user.
   Retention enforced by plan:
     analyst      → 1 month  (most recent only)
     professional → 12 months
     enterprise   → forever
     admin        → forever
================================================================ */

/* ── Plan retention limits ── */
const DATA_RETENTION_MONTHS = {
  analyst:      1,
  professional: 12,
  enterprise:   Infinity,
  admin:        Infinity
};

/* ── Enforce retention on load ── */
function enforceDataRetention() {
  const plan    = window.currentPlan || 'analyst';
  const maxMo   = DATA_RETENTION_MONTHS[plan] ?? 1;
  const data    = window.businessData || [];
  if (!data.length || maxMo === Infinity) return;

  // Sort newest first, keep only allowed months
  data.sort((a, b) => new Date(b.date) - new Date(a.date));
  if (data.length > maxMo) {
    data.splice(maxMo); // drop oldest beyond limit
    window.businessData = data;
  }
}

/* ── Main render ── */
function renderRecordsPanel() {
  enforceDataRetention();

  const panel = document.getElementById('recordsPanel');
  if (!panel) return;

  const data     = (window.businessData || []).slice().sort((a,b) => new Date(b.date)-new Date(a.date));
  const plan     = window.currentPlan || 'analyst';
  const maxMo    = DATA_RETENTION_MONTHS[plan] ?? 1;
  const currency = window.currentCurrency || 'GBP';
  const sym      = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';

  /* totals */
  const totRev  = data.reduce((s,d) => s + (d.revenue  ||0), 0);
  const totExp  = data.reduce((s,d) => s + (d.expenses ||0), 0);
  const totProf = data.reduce((s,d) => s + (d.profit   ||0), 0);

  const retLabel = maxMo === Infinity
    ? 'Unlimited storage'
    : `${maxMo} month${maxMo>1?'s':''} storage`;

  const planColor = {
    analyst: 'var(--text-muted)',
    professional: 'var(--gold)',
    enterprise: 'var(--blue)',
    admin: 'var(--success)'
  }[plan] || 'var(--text-muted)';

  /* ── Build spreadsheet rows ── */
  let rowsHTML = '';
  if (!data.length) {
    rowsHTML = `
      <tr class="rp-empty-row">
        <td colspan="5">
          <div class="rp-empty-cell">No data yet — add your first month below</div>
        </td>
      </tr>`;
  } else {
    data.forEach((d, i) => {
      const prev    = data[i + 1];
      const date    = new Date(d.date);
      const mo      = date.toLocaleString('en-GB', { month: 'short', year: 'numeric' });
      const margin  = d.revenue > 0 ? ((d.profit / d.revenue) * 100).toFixed(1) : '0.0';
      const profit  = d.profit || 0;
      const profCls = profit >= 0 ? 'rp-cell-pos' : 'rp-cell-neg';
      const profPfx = profit >= 0 ? '+' : '-';

      let trendHTML = '';
      if (prev) {
        const diff = d.revenue - prev.revenue;
        if      (diff > 0)  trendHTML = `<span class="rp-trend-up">▲</span>`;
        else if (diff < 0)  trendHTML = `<span class="rp-trend-dn">▼</span>`;
        else                trendHTML = `<span class="rp-trend-fl">–</span>`;
      }

      rowsHTML += `
        <tr class="rp-data-row" onclick="handleRPRowClick(${i})" title="Click to edit ${mo}">
          <td class="rp-cell rp-cell-date">${mo} ${trendHTML}</td>
          <td class="rp-cell rp-cell-num rp-cell-rev">${sym}${Number(d.revenue||0).toLocaleString()}</td>
          <td class="rp-cell rp-cell-num rp-cell-exp">${sym}${Number(d.expenses||0).toLocaleString()}</td>
          <td class="rp-cell rp-cell-num ${profCls}">${profPfx}${sym}${Math.abs(profit).toLocaleString()}</td>
          <td class="rp-cell rp-cell-num rp-cell-mg">${margin}%</td>
        </tr>`;
    });
  }

  /* ── Totals row ── */
  const totProfCls = totProf >= 0 ? 'rp-cell-pos' : 'rp-cell-neg';
  const totProfPfx = totProf >= 0 ? '+' : '-';
  const totMargin  = totRev > 0 ? ((totProf / totRev) * 100).toFixed(1) : '0.0';

  const totalsRow = data.length ? `
    <tr class="rp-totals-row">
      <td class="rp-cell rp-cell-date rp-totals-label">TOTAL (${data.length}mo)</td>
      <td class="rp-cell rp-cell-num rp-cell-rev">${sym}${totRev.toLocaleString()}</td>
      <td class="rp-cell rp-cell-num rp-cell-exp">${sym}${totExp.toLocaleString()}</td>
      <td class="rp-cell rp-cell-num ${totProfCls}">${totProfPfx}${sym}${Math.abs(totProf).toLocaleString()}</td>
      <td class="rp-cell rp-cell-num rp-cell-mg">${totMargin}%</td>
    </tr>` : '';

  /* ── Sync dot ── */
  const dotCls  = 'synced';
  const dotLabel = 'Saved to account';

  /* ── Retention banner ── */
  const isLimited = maxMo !== Infinity;
  const retBanner = isLimited ? `
    <div class="rp-retention-banner">
      <span class="rp-retention-icon">⏱</span>
      <span class="rp-retention-text">
        <strong>${retLabel}</strong> on ${plan.charAt(0).toUpperCase()+plan.slice(1)} plan.
        <a href="#" onclick="showSection('upgrade');closeRecordsPanel();return false;" class="rp-upgrade-link">Upgrade for more →</a>
      </span>
    </div>` : `
    <div class="rp-retention-banner rp-retention-ok">
      <span class="rp-retention-icon">✓</span>
      <span class="rp-retention-text"><strong>${retLabel}</strong> — all your data is always here.</span>
    </div>`;

  panel.innerHTML = `
    <!-- Header -->
    <div class="rp-header">
      <div>
        <div class="rp-title">Financial Records</div>
        <div class="rp-sub">Live spreadsheet · ${data.length} month${data.length!==1?'s':''} of data</div>
      </div>
      <button class="rp-close" onclick="closeRecordsPanel()" title="Close">✕</button>
    </div>

    <!-- Sync status -->
    <div class="rp-status">
      <span class="rp-dot ${dotCls}"></span>
      <span id="rpSyncLabel" style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--text-muted);">${dotLabel}</span>
      <span class="rp-plan-chip" style="margin-left:auto;color:${planColor};">${plan.toUpperCase()}</span>
    </div>

    <!-- Retention banner -->
    ${retBanner}

    <!-- Spreadsheet -->
    <div class="rp-sheet-wrap">
      <table class="rp-sheet">
        <thead>
          <tr class="rp-sheet-head">
            <th class="rp-th rp-th-date">MONTH</th>
            <th class="rp-th rp-th-num">REVENUE</th>
            <th class="rp-th rp-th-num">EXPENSES</th>
            <th class="rp-th rp-th-num">PROFIT</th>
            <th class="rp-th rp-th-num">MARGIN</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
          ${totalsRow}
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div class="rp-footer">
      <button class="rp-add-btn" onclick="scrollToDataEntry()">+ Add Month</button>
    </div>
  `;
}

/* ── Row click → open edit modal ── */
function handleRPRowClick(reversedIndex) {
  const data   = (window.businessData || []).slice().sort((a,b) => new Date(b.date)-new Date(a.date));
  const record = data[reversedIndex];
  if (!record) return;

  // Try to use existing edit modal if available
  if (typeof openEditModal === 'function') {
    const originalIndex = window.businessData.indexOf(record);
    openEditModal(originalIndex);
  }
}

/* ── Scroll to data entry section ── */
function scrollToDataEntry() {
  closeRecordsPanel();
  const el = document.getElementById('dateInput') || document.getElementById('revenueInput');
  if (el) { el.scrollIntoView({ behavior:'smooth', block:'center' }); el.focus(); }
}

/* ── Panel open/close ── */
function openRecordsPanel()  {
  renderRecordsPanel();
  const p = document.getElementById('recordsPanel');
  const o = document.getElementById('sbOverlay');
  if (p) p.classList.add('open');
  if (o) { o.style.display = 'block'; o.onclick = closeRecordsPanel; }
}

function closeRecordsPanel() {
  const p = document.getElementById('recordsPanel');
  const o = document.getElementById('sbOverlay');
  if (p) p.classList.remove('open');
  if (o) { o.style.display = 'none'; o.onclick = null; }
}

/* ── Sign-out data cleanup ── */
// When user signs out, window.businessData is cleared in memory automatically.
// Supabase data persists server-side; on next login loadUserData() reloads it.
// Analyst plan: server enforces 1-month cap via saveUserData trim below.

/* Override saveUserData to trim before saving based on plan */
const _origSaveUserData = window.saveUserData;
window.saveUserData = async function() {
  enforceDataRetention();
  if (_origSaveUserData) return _origSaveUserData();
};

/* Expose globals */
window.renderRecordsPanel  = renderRecordsPanel;
window.openRecordsPanel    = openRecordsPanel;
window.closeRecordsPanel   = closeRecordsPanel;
window.handleRPRowClick    = handleRPRowClick;
window.enforceDataRetention = enforceDataRetention;
