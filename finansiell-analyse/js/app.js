'use strict';

// ====================================================================
// 1. STORAGE
// ====================================================================

const STORAGE_KEY = 'finansiell-analyse-v1';
const SECTORS = ['Teknologi','Energi','Materialer','Industri','Forbruksvarer','Helse','Finans','Eiendom','Forsyning','Kommunikasjon','Annet'];
const CURRENCIES = ['NOK','USD','EUR','GBP','SEK','DKK'];

function getCompanies() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function saveCompanies(cs) { localStorage.setItem(STORAGE_KEY, JSON.stringify(cs)); }
function getCompany(id) { return getCompanies().find(c => c.id === id); }
function saveCompany(company) {
  const cs = getCompanies();
  const i = cs.findIndex(c => c.id === company.id);
  if (i !== -1) { cs[i] = { ...company, updatedAt: Date.now() }; saveCompanies(cs); }
}
function deleteCompany(id) { saveCompanies(getCompanies().filter(c => c.id !== id)); }

function defaultDCF() {
  const y = new Date().getFullYear();
  return {
    projectionYears: 5,
    historical: {
      years: [y-3, y-2, y-1],
      revenue:   ['','',''],
      ebit:      ['','',''],
      da:        ['','',''],
      capex:     ['','',''],
      nwcChange: ['','','']
    },
    assumptions: {
      taxRate:           '25',
      revenueGrowth:     ['10','10','9','8','7','6','5','5','5','5'],
      ebitMargin:        ['20','21','22','22','22','22','22','22','22','22'],
      daPercent:         ['5','5','5','5','5','5','5','5','5','5'],
      capexPercent:      ['7','7','7','6','6','6','6','6','6','6'],
      nwcChangePercent:  ['2','2','2','2','2','2','2','2','2','2']
    },
    wacc: {
      riskFreeRate: '4.0', erp: '5.5', beta: '1.00',
      costOfDebt: '5.0', taxRate: '25.0',
      debtWeight: '20', equityWeight: '80'
    },
    terminalValue: { method: 'gordon', terminalGrowthRate: '2.5', exitMultiple: '10' },
    bridge: { netDebt: '0', minorities: '0', otherAdjustments: '0', sharesOutstanding: '1000', currentPrice: '0' }
  };
}

function defaultMultiples() {
  return {
    subject: { revenue:'', ebitda:'', ebit:'', netIncome:'', eps:'', netDebt:'', sharesOutstanding:'', currentPrice:'' },
    peers: []
  };
}

function createCompany(data) {
  const company = {
    id: crypto.randomUUID(), name: data.name, ticker: data.ticker.toUpperCase(),
    sector: data.sector || '', currency: data.currency || 'NOK',
    createdAt: Date.now(), updatedAt: Date.now(),
    dcf: defaultDCF(), multiples: defaultMultiples()
  };
  const cs = getCompanies(); cs.push(company); saveCompanies(cs);
  return company;
}

// ====================================================================
// 2. DCF CALCULATIONS
// ====================================================================

function calcWACC(w) {
  const rf = pf(w.riskFreeRate) / 100, erp = pf(w.erp) / 100, beta = pf(w.beta) || 1;
  const kd = pf(w.costOfDebt) / 100, t = pf(w.taxRate) / 100;
  const wd = pf(w.debtWeight) / 100, we = pf(w.equityWeight) / 100;
  const ke = rf + beta * erp;
  const kdAt = kd * (1 - t);
  return { ke, kdAt, wacc: ke * we + kdAt * wd };
}

function calcProjectionRows(dcf, waccOvr) {
  const { assumptions: a, historical: h, projectionYears } = dcf;
  const n = parseInt(projectionYears) || 5;
  const tax = pf(a.taxRate) / 100;
  const wacc = waccOvr !== undefined ? waccOvr : calcWACC(dcf.wacc).wacc;
  const base = pf(h.revenue[2]) || 0;
  let prev = base;
  const rows = [];
  for (let i = 0; i < n; i++) {
    const g     = pf(a.revenueGrowth[i]) / 100;
    const m     = pf(a.ebitMargin[i]) / 100;
    const daP   = pf(a.daPercent[i]) / 100;
    const capP  = pf(a.capexPercent[i]) / 100;
    const nwcP  = pf(a.nwcChangePercent[i]) / 100;
    const rev   = prev * (1 + g);
    const ebit  = rev * m;
    const nopat = ebit * (1 - tax);
    const da    = rev * daP;
    const capex = rev * capP;
    const nwc   = rev * nwcP;
    const fcf   = nopat + da - capex - nwc;
    const df    = 1 / Math.pow(1 + wacc, i + 1);
    rows.push({ year: i+1, rev, ebit, nopat, da, capex, nwc, fcf, df, pvFcf: fcf*df, ebitda: ebit+da });
    prev = rev;
  }
  return rows;
}

function calcDCF(company, waccOvr, tgrOvr) {
  const dcf = company.dcf;
  const wacc = waccOvr !== undefined ? waccOvr : calcWACC(dcf.wacc).wacc;
  const rows = calcProjectionRows(dcf, wacc);
  const n = rows.length;
  const last = rows[n - 1];
  const tgr = tgrOvr !== undefined ? tgrOvr : pf(dcf.terminalValue.terminalGrowthRate) / 100;

  let tv = 0;
  if (dcf.terminalValue.method === 'gordon') {
    tv = (wacc > tgr && last) ? last.fcf * (1 + tgr) / (wacc - tgr) : 0;
  } else {
    tv = last ? last.ebitda * (pf(dcf.terminalValue.exitMultiple) || 0) : 0;
  }
  const pvTV = n > 0 ? tv / Math.pow(1 + wacc, n) : 0;
  const sumPv = rows.reduce((s, r) => s + r.pvFcf, 0);
  const ev = sumPv + pvTV;
  const nd = pf(dcf.bridge.netDebt), min = pf(dcf.bridge.minorities), oth = pf(dcf.bridge.otherAdjustments);
  const sh = pf(dcf.bridge.sharesOutstanding) || 1;
  const eq = ev - nd - min + oth;
  return { rows, tv, pvTV, sumPv, ev, eq, price: eq / sh };
}

function calcSensitivity(company) {
  const { wacc } = calcWACC(company.dcf.wacc);
  const tgr = pf(company.dcf.terminalValue.terminalGrowthRate) / 100;
  const wRange = [-0.02, -0.01, 0, 0.01, 0.02].map(d => wacc + d);
  const gRange = [-0.02, -0.01, 0, 0.01, 0.02].map(d => tgr + d);
  return wRange.map(w => gRange.map(g => ({ w, g, price: calcDCF(company, w, g).price })));
}

// ====================================================================
// 3. MULTIPLES CALCULATIONS
// ====================================================================

function peerMultiples(peer) {
  const ev = pf(peer.ev), rev = pf(peer.revenue), ebitda = pf(peer.ebitda);
  const ebit = pf(peer.ebit), ni = pf(peer.netIncome), mc = pf(peer.marketCap);
  return {
    evRev:    rev > 0   ? ev / rev    : null,
    evEbitda: ebitda > 0 ? ev / ebitda : null,
    evEbit:   ebit > 0  ? ev / ebit   : null,
    pe:       ni > 0 && mc > 0 ? mc / ni : null
  };
}

function pctile(arr, p) {
  if (!arr.length) return null;
  const s = [...arr].sort((a,b) => a-b);
  const idx = (p/100) * (s.length - 1);
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  return lo === hi ? s[lo] : s[lo] + (idx-lo) * (s[hi]-s[lo]);
}

function multipleStats(peers) {
  const mults = peers.map(peerMultiples);
  const out = {};
  for (const key of ['evRev','evEbitda','evEbit','pe']) {
    const vals = mults.map(m => m[key]).filter(v => v !== null && isFinite(v) && v > 0);
    out[key] = vals.length ? {
      p25: pctile(vals,25), median: pctile(vals,50),
      mean: vals.reduce((a,b)=>a+b,0)/vals.length, p75: pctile(vals,75), n: vals.length
    } : null;
  }
  return out;
}

function impliedVals(stats, subj) {
  const rev = pf(subj.revenue), ebitda = pf(subj.ebitda), ebit = pf(subj.ebit);
  const eps = pf(subj.eps), nd = pf(subj.netDebt), sh = pf(subj.sharesOutstanding) || 1;
  const toP = ev => (ev - nd) / sh;
  const res = [];
  if (stats.evRev    && rev > 0)    res.push({ name:'EV/Revenue', low: toP(stats.evRev.p25*rev),    mid: toP(stats.evRev.median*rev),    high: toP(stats.evRev.p75*rev) });
  if (stats.evEbitda && ebitda > 0) res.push({ name:'EV/EBITDA',  low: toP(stats.evEbitda.p25*ebitda), mid: toP(stats.evEbitda.median*ebitda), high: toP(stats.evEbitda.p75*ebitda) });
  if (stats.evEbit   && ebit > 0)   res.push({ name:'EV/EBIT',    low: toP(stats.evEbit.p25*ebit),   mid: toP(stats.evEbit.median*ebit),   high: toP(stats.evEbit.p75*ebit) });
  if (stats.pe       && eps > 0)    res.push({ name:'P/E',        low: stats.pe.p25*eps,             mid: stats.pe.median*eps,             high: stats.pe.p75*eps });
  return res;
}

// ====================================================================
// 4. FORMATTERS
// ====================================================================

function pf(v) { return parseFloat(v) || 0; }

function fN(v, d=1) {
  if (v === null || v === undefined || !isFinite(v)) return '—';
  const a = Math.abs(v);
  if (a >= 1e12) return (v/1e12).toFixed(d) + 'T';
  if (a >= 1e9)  return (v/1e9).toFixed(d) + 'B';
  if (a >= 1e6)  return (v/1e6).toFixed(d) + 'M';
  if (a >= 1e3)  return (v/1e3).toFixed(d) + 'K';
  return v.toFixed(d);
}
function fP(v, d=1) { return !isFinite(v) ? '—' : (v*100).toFixed(d)+'%'; }
function fX(v, d=1) { return (v===null||!isFinite(v)) ? '—' : v.toFixed(d)+'x'; }
function fPr(v, d=2) { return (v===null||!isFinite(v)) ? '—' : v.toFixed(d); }
function fPct(v, d=1) { return !isFinite(v) ? '—' : (v*100).toFixed(d)+'%'; }

// ====================================================================
// 5. APP STATE
// ====================================================================

const state = { currentId: null, currentTab: 'dcf' };

// ====================================================================
// 6. RENDER: SIDEBAR
// ====================================================================

function renderSidebar() {
  const cs = getCompanies();
  const list = document.getElementById('company-list');
  list.innerHTML = cs.length ? cs.map(c => `
    <div class="company-nav-item ${c.id === state.currentId ? 'active' : ''}"
         data-action="open-company" data-id="${c.id}">
      <span class="company-nav-ticker">${esc(c.ticker)}</span>
      <span class="company-nav-name">${esc(c.name)}</span>
    </div>`).join('') : `<div style="padding:8px 16px;font-size:11px;color:#475569">Ingen selskaper ennå</div>`;
}

// ====================================================================
// 7. RENDER: DASHBOARD
// ====================================================================

function renderDashboard() {
  const cs = getCompanies();
  state.currentId = null;
  renderSidebar();
  const main = document.getElementById('main-content');
  if (!cs.length) {
    main.innerHTML = `
      <div class="empty-state">
        <h3>Ingen selskaper</h3>
        <p>Klikk «+ Legg til selskap» i sidepanelet for å komme i gang.</p>
      </div>`;
    return;
  }
  main.innerHTML = `
    <div class="dashboard-header">
      <h2>Portefølje</h2>
      <p>${cs.length} selskap${cs.length !== 1 ? 'er' : ''}</p>
    </div>
    <div class="company-grid">
      ${cs.map(c => `
        <div class="company-card" data-action="open-company" data-id="${c.id}">
          <div class="company-card-header">
            <span class="company-card-ticker">${esc(c.ticker)}</span>
            <button class="btn-delete-company" data-action="delete-company" data-id="${c.id}" title="Slett">✕</button>
          </div>
          <div class="company-card-name">${esc(c.name)}</div>
          <div class="company-card-meta">${esc(c.sector)} · ${esc(c.currency)}</div>
        </div>`).join('')}
    </div>`;
}

// ====================================================================
// 8. RENDER: COMPANY (tabs)
// ====================================================================

function renderCompany(id) {
  const company = getCompany(id);
  if (!company) { renderDashboard(); return; }
  state.currentId = id;
  renderSidebar();
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="company-header">
      <span class="company-ticker-badge">${esc(company.ticker)}</span>
      <div class="company-header-info">
        <h2>${esc(company.name)}</h2>
        <div class="meta">${esc(company.sector)} · ${esc(company.currency)}</div>
      </div>
      <button class="btn-danger-sm" data-action="delete-company" data-id="${company.id}">Slett selskap</button>
    </div>
    <div class="tabs">
      <button class="tab-btn ${state.currentTab==='dcf'?'active':''}" data-action="switch-tab" data-tab="dcf">DCF-analyse</button>
      <button class="tab-btn ${state.currentTab==='multiples'?'active':''}" data-action="switch-tab" data-tab="multiples">Multippelanalyse</button>
    </div>
    <div id="tab-content"></div>`;
  renderTab(company);
}

function renderTab(company) {
  const el = document.getElementById('tab-content');
  if (!el) return;
  el.innerHTML = state.currentTab === 'dcf' ? renderDCF(company) : renderMultiples(company);
}

// ====================================================================
// 9. RENDER: DCF
// ====================================================================

function renderDCF(company) {
  const dcf = company.dcf;
  const { ke, kdAt, wacc } = calcWACC(dcf.wacc);
  const res = calcDCF(company);
  const n = parseInt(dcf.projectionYears) || 5;
  const rows = res.rows;
  const currPrice = pf(dcf.bridge.currentPrice);
  const upside = currPrice > 0 ? (res.price - currPrice) / currPrice : null;

  return `
    ${renderWACC(dcf, ke, kdAt, wacc)}
    ${renderProjections(dcf, rows, n)}
    ${renderTerminalValue(dcf, res)}
    ${renderBridge(dcf, res, currPrice, upside)}
    ${renderSensitivity(company, wacc)}`;
}

function renderWACC(dcf, ke, kdAt, wacc) {
  const w = dcf.wacc;
  return `
  <div class="section-card">
    <div class="section-header">
      <span class="section-title">WACC-kalkulator</span>
    </div>
    <div class="section-body">
      <div class="wacc-grid">
        ${wField('Risikofri rente (%)', 'dcf.wacc.riskFreeRate', w.riskFreeRate)}
        ${wField('Egenkapitalpremie (%)', 'dcf.wacc.erp', w.erp)}
        ${wField('Beta', 'dcf.wacc.beta', w.beta)}
        ${wField('Lånekostnad (%)', 'dcf.wacc.costOfDebt', w.costOfDebt)}
        ${wField('Skattesats (%)', 'dcf.wacc.taxRate', w.taxRate)}
        ${wField('Gjeldsandel (%)', 'dcf.wacc.debtWeight', w.debtWeight)}
        ${wField('EK-andel (%)', 'dcf.wacc.equityWeight', w.equityWeight)}
      </div>
      <div class="wacc-result-row">
        <div class="wacc-result-item">
          <span class="wacc-result-label">Egenkapitalkostnad (Ke)</span>
          <span class="wacc-result-value" id="out-ke">${fP(ke)}</span>
        </div>
        <div class="wacc-result-item">
          <span class="wacc-result-label">Etter skatt lånekostnad (Kd)</span>
          <span class="wacc-result-value" id="out-kdat">${fP(kdAt)}</span>
        </div>
        <div class="wacc-result-item">
          <span class="wacc-result-label">WACC</span>
          <span class="wacc-result-value main" id="out-wacc">${fP(wacc)}</span>
        </div>
      </div>
    </div>
  </div>`;
}

function wField(label, path, val) {
  return `<div class="field-group">
    <label class="field-label">${label}</label>
    <input class="field-input" type="number" step="any" data-path="${path}" value="${val}">
  </div>`;
}

function renderProjections(dcf, rows, n) {
  const h = dcf.historical;
  const a = dcf.assumptions;
  const histRevs = h.revenue.map(pf);
  const histGrowth = [
    '—',
    histRevs[0] > 0 ? fP((histRevs[1]-histRevs[0])/histRevs[0]) : '—',
    histRevs[1] > 0 ? fP((histRevs[2]-histRevs[1])/histRevs[1]) : '—'
  ];
  const histMargin = h.revenue.map((rv,i) => {
    const r = pf(rv), e = pf(h.ebit[i]);
    return r > 0 ? fP(e/r) : '—';
  });

  const hCols = h.years.map((y,i) => ({ y, i }));
  const pCols = rows;

  const head = `<thead><tr>
    <th>Linje</th>
    ${hCols.map(({y}) => `<th class="col-hist">${y}A</th>`).join('')}
    ${pCols.map(r => `<th class="col-proj">År ${r.year}</th>`).join('')}
  </tr></thead>`;

  // Helper: historical input cell
  const hIn = (field, idx) => `<td class="col-hist"><input class="tbl-input" type="number" step="any" data-path="dcf.historical.${field}.${idx}" value="${dcf.historical[field][idx]}"></td>`;
  // Helper: projection assumption input cell
  const pIn = (field, idx) => `<td class="col-proj"><input class="tbl-input" type="number" step="any" data-path="dcf.assumptions.${field}.${idx}" value="${a[field][idx]}"></td>`;
  // Helper: computed cell
  const cOut = (id, val) => `<td id="${id}">${val}</td>`;

  const body = `<tbody>
    <tr class="row-input"><td><b>Omsetningsvekst (%)</b></td>
      ${hCols.map(({i}) => `<td class="col-hist">${histGrowth[i]}</td>`).join('')}
      ${pCols.map((_,i) => pIn('revenueGrowth', i)).join('')}
    </tr>
    <tr class="row-computed"><td><b>Omsetning</b></td>
      ${hCols.map(({i}) => hIn('revenue', i)).join('')}
      ${rows.map(r => cOut(`out-rev-${r.year}`, fN(r.rev))).join('')}
    </tr>
    <tr class="row-input"><td class="row-label-indent">EBIT-margin (%)</td>
      ${hCols.map(({i}) => `<td class="col-hist">${histMargin[i]}</td>`).join('')}
      ${pCols.map((_,i) => pIn('ebitMargin', i)).join('')}
    </tr>
    <tr class="row-computed"><td class="row-label-indent">EBIT</td>
      ${hCols.map(({i}) => hIn('ebit', i)).join('')}
      ${rows.map(r => cOut(`out-ebit-${r.year}`, fN(r.ebit))).join('')}
    </tr>
    <tr class="row-computed"><td class="row-label-indent">EBITDA</td>
      ${hCols.map(({i}) => `<td class="col-hist">—</td>`).join('')}
      ${rows.map(r => cOut(`out-ebitda-${r.year}`, fN(r.ebitda))).join('')}
    </tr>
    <tr class="row-separator"><td colspan="${3+n}"></td></tr>
    <tr class="row-input"><td class="row-label-indent">D&A som % omsetning</td>
      ${hCols.map(() => `<td class="col-hist">—</td>`).join('')}
      ${pCols.map((_,i) => pIn('daPercent', i)).join('')}
    </tr>
    <tr class="row-computed"><td class="row-label-indent">+ D&A</td>
      ${hCols.map(({i}) => hIn('da', i)).join('')}
      ${rows.map(r => cOut(`out-da-${r.year}`, fN(r.da))).join('')}
    </tr>
    <tr class="row-input"><td class="row-label-indent">CapEx som % omsetning</td>
      ${hCols.map(() => `<td class="col-hist">—</td>`).join('')}
      ${pCols.map((_,i) => pIn('capexPercent', i)).join('')}
    </tr>
    <tr class="row-computed"><td class="row-label-indent">– CapEx</td>
      ${hCols.map(({i}) => hIn('capex', i)).join('')}
      ${rows.map(r => cOut(`out-capex-${r.year}`, fN(r.capex))).join('')}
    </tr>
    <tr class="row-input"><td class="row-label-indent">ΔNWC som % omsetning</td>
      ${hCols.map(() => `<td class="col-hist">—</td>`).join('')}
      ${pCols.map((_,i) => pIn('nwcChangePercent', i)).join('')}
    </tr>
    <tr class="row-computed"><td class="row-label-indent">– ΔNWC</td>
      ${hCols.map(({i}) => hIn('nwcChange', i)).join('')}
      ${rows.map(r => cOut(`out-nwc-${r.year}`, fN(r.nwc))).join('')}
    </tr>
    <tr class="row-separator"><td colspan="${3+n}"></td></tr>
    <tr class="row-input"><td class="row-label-indent">Skattesats (%)</td>
      ${hCols.map(() => `<td class="col-hist">—</td>`).join('')}
      <td colspan="${n}"><input class="tbl-input" type="number" step="any" data-path="dcf.assumptions.taxRate" value="${a.taxRate}" style="width:60px"> (gjelder alle år)</td>
    </tr>
    <tr class="row-computed"><td><b>NOPAT</b></td>
      ${hCols.map(() => `<td class="col-hist">—</td>`).join('')}
      ${rows.map(r => cOut(`out-nopat-${r.year}`, fN(r.nopat))).join('')}
    </tr>
    <tr class="row-total"><td><b>Fri kontantstrøm (FCF)</b></td>
      ${hCols.map(() => `<td class="col-hist">—</td>`).join('')}
      ${rows.map(r => cOut(`out-fcf-${r.year}`, fN(r.fcf))).join('')}
    </tr>
    <tr class="row-computed"><td class="row-label-indent">Diskonteringsfaktor</td>
      ${hCols.map(() => `<td class="col-hist">—</td>`).join('')}
      ${rows.map(r => cOut(`out-df-${r.year}`, r.df.toFixed(4))).join('')}
    </tr>
    <tr class="row-computed"><td class="row-label-indent">PV av FCF</td>
      ${hCols.map(() => `<td class="col-hist">—</td>`).join('')}
      ${rows.map(r => cOut(`out-pvfcf-${r.year}`, fN(r.pvFcf))).join('')}
    </tr>
  </tbody>`;

  return `
  <div class="section-card">
    <div class="section-header">
      <span class="section-title">Projeksjoner</span>
      <div class="proj-year-toggle">
        <button class="proj-year-btn ${parseInt(dcf.projectionYears)===5?'active':''}" data-action="set-proj-years" data-years="5">5 år</button>
        <button class="proj-year-btn ${parseInt(dcf.projectionYears)===10?'active':''}" data-action="set-proj-years" data-years="10">10 år</button>
      </div>
    </div>
    <div class="section-body section-body-pad0">
      <div class="table-wrap">
        <table>${head}${body}</table>
      </div>
    </div>
  </div>`;
}

function renderTerminalValue(dcf, res) {
  const tv = dcf.terminalValue;
  const isGordon = tv.method === 'gordon';
  return `
  <div class="section-card">
    <div class="section-header"><span class="section-title">Terminalverdi</span></div>
    <div class="section-body">
      <div class="tv-grid">
        <div>
          <div class="field-group" style="margin-bottom:12px">
            <label class="field-label">Metode</label>
            <select class="field-input" data-path="dcf.terminalValue.method" style="width:220px">
              <option value="gordon" ${isGordon?'selected':''}>Gordon Growth Model</option>
              <option value="exit" ${!isGordon?'selected':''}>EV/EBITDA Exit Multiple</option>
            </select>
          </div>
          <div class="tv-inputs">
            ${isGordon
              ? wField('Terminalvekstrate (%)', 'dcf.terminalValue.terminalGrowthRate', tv.terminalGrowthRate)
              : wField('Exit EV/EBITDA Multippel', 'dcf.terminalValue.exitMultiple', tv.exitMultiple)}
          </div>
        </div>
        <div class="tv-results">
          <div class="tv-result-row">
            <span class="tv-result-label">Sum PV FCF (projeksjonsperiode)</span>
            <span class="tv-result-value" id="out-sumpv">${fN(res.sumPv)}</span>
          </div>
          <div class="tv-result-row">
            <span class="tv-result-label">Terminalverdi (TV)</span>
            <span class="tv-result-value" id="out-tv">${fN(res.tv)}</span>
          </div>
          <div class="tv-result-row">
            <span class="tv-result-label">PV av terminalverdi</span>
            <span class="tv-result-value" id="out-pvtv">${fN(res.pvTV)}</span>
          </div>
          <div class="tv-result-row" style="font-weight:700;border-top:1px solid #bfdbfe;margin-top:4px;padding-top:8px">
            <span class="tv-result-label">Enterprise Value</span>
            <span class="tv-result-value" id="out-ev2">${fN(res.ev)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function renderBridge(dcf, res, currPrice, upside) {
  const b = dcf.bridge;
  const upsideHtml = upside !== null
    ? `<span class="${upside >= 0 ? 'upside' : 'downside'}">${upside >= 0 ? '+' : ''}${fP(upside)} vs. kurs</span>`
    : '';
  return `
  <div class="section-card">
    <div class="section-header"><span class="section-title">VerdsettelsesbroEV → Aksjeverd</span></div>
    <div class="section-body">
      <div class="bridge-grid">
        <div>
          <table class="bridge-table">
            <tr><td class="bridge-label"><span class="bridge-sign"> </span>Enterprise Value</td>
                <td><span id="out-ev">${fN(res.ev)}</span></td></tr>
            <tr><td class="bridge-label"><span class="bridge-sign">–</span>Netto gjeld</td>
                <td><input class="tbl-input" type="number" step="any" data-path="dcf.bridge.netDebt" value="${b.netDebt}" style="width:80px;text-align:right"></td></tr>
            <tr><td class="bridge-label"><span class="bridge-sign">–</span>Minoritetsinteresser</td>
                <td><input class="tbl-input" type="number" step="any" data-path="dcf.bridge.minorities" value="${b.minorities}" style="width:80px;text-align:right"></td></tr>
            <tr><td class="bridge-label"><span class="bridge-sign">+</span>Andre justeringer</td>
                <td><input class="tbl-input" type="number" step="any" data-path="dcf.bridge.otherAdjustments" value="${b.otherAdjustments}" style="width:80px;text-align:right"></td></tr>
            <tr class="bridge-total"><td>= Egenkapitalverdi</td>
                <td><span id="out-eq">${fN(res.eq)}</span></td></tr>
          </table>
        </div>
        <div>
          <table class="bridge-table">
            <tr><td class="bridge-label">÷ Antall aksjer (mill.)</td>
                <td><input class="tbl-input" type="number" step="any" data-path="dcf.bridge.sharesOutstanding" value="${b.sharesOutstanding}" style="width:80px;text-align:right"></td></tr>
            <tr class="bridge-price">
                <td>= Implisert aksjekurs</td>
                <td><span id="out-price">${fPr(res.price)}</span></td></tr>
            <tr><td class="bridge-label">Gjeldende kurs</td>
                <td><input class="tbl-input" type="number" step="any" data-path="dcf.bridge.currentPrice" value="${b.currentPrice}" style="width:80px;text-align:right"></td></tr>
            <tr><td class="bridge-label">Oppside / nedside</td>
                <td id="out-upside">${upsideHtml || '—'}</td></tr>
          </table>
        </div>
      </div>
    </div>
  </div>`;
}

function renderSensitivity(company, centralWacc) {
  const matrix = calcSensitivity(company);
  const currPrice = pf(company.dcf.bridge.currentPrice);
  const tgr = pf(company.dcf.terminalValue.terminalGrowthRate) / 100;

  function cellClass(price, w, g) {
    if (Math.abs(w - centralWacc) < 0.001 && Math.abs(g - tgr) < 0.001) return 'sens-neutral';
    if (currPrice <= 0) return '';
    const up = (price - currPrice) / currPrice;
    if (up >  0.25) return 'sens-upside-3';
    if (up >  0.10) return 'sens-upside-2';
    if (up >  0)    return 'sens-upside-1';
    if (up > -0.10) return 'sens-down-1';
    if (up > -0.25) return 'sens-down-2';
    return 'sens-down-3';
  }

  const gValues = matrix[0].map(c => c.g);
  const thead = `<thead><tr>
    <th>WACC \\ TGR</th>
    ${gValues.map(g => `<th>${fP(g)}</th>`).join('')}
  </tr></thead>`;

  const tbody = `<tbody>${matrix.map(row => `<tr>
    <td>${fP(row[0].w)}</td>
    ${row.map(cell => `<td class="${cellClass(cell.price, cell.w, cell.g)}">${fPr(cell.price)}</td>`).join('')}
  </tr>`).join('')}</tbody>`;

  return `
  <div class="section-card">
    <div class="section-header"><span class="section-title">Sensitivitetsanalyse — WACC vs. Terminalvekstrate</span></div>
    <div class="section-body">
      <div class="sensitivity-wrap">
        <table class="sensitivity-table">${thead}${tbody}</table>
      </div>
      <div class="sens-legend">
        <span class="sens-legend-item"><span class="sens-legend-dot" style="background:#065f46"></span>&gt;25% oppside</span>
        <span class="sens-legend-item"><span class="sens-legend-dot" style="background:#10b981"></span>10–25% oppside</span>
        <span class="sens-legend-item"><span class="sens-legend-dot" style="background:#d1fae5"></span>0–10% oppside</span>
        <span class="sens-legend-item"><span class="sens-legend-dot" style="background:#fef9c3;border:1px solid #fbbf24"></span>Sentralcase</span>
        <span class="sens-legend-item"><span class="sens-legend-dot" style="background:#fee2e2"></span>0–10% nedside</span>
        <span class="sens-legend-item"><span class="sens-legend-dot" style="background:#ef4444"></span>10–25% nedside</span>
        <span class="sens-legend-item"><span class="sens-legend-dot" style="background:#7f1d1d"></span>&gt;25% nedside</span>
      </div>
      <p class="hint" style="margin-top:8px">Tall viser implisert aksjekurs. Farge angir oppside/nedside vs. gjeldende kurs.</p>
    </div>
  </div>`;
}

// ====================================================================
// 10. RENDER: MULTIPLES
// ====================================================================

function renderMultiples(company) {
  const m = company.multiples;
  const stats = multipleStats(m.peers);
  const implied = impliedVals(stats, m.subject);
  const currPrice = pf(m.subject.currentPrice);

  return `
    ${renderSubjectMetrics(m.subject)}
    ${renderPeerTable(m.peers)}
    ${renderMultipleStats(stats)}
    ${renderImpliedValuation(implied, currPrice)}`;
}

function renderSubjectMetrics(s) {
  const fields = [
    ['Omsetning (LTM)', 'multiples.subject.revenue', s.revenue],
    ['EBITDA', 'multiples.subject.ebitda', s.ebitda],
    ['EBIT', 'multiples.subject.ebit', s.ebit],
    ['Nettoresultat', 'multiples.subject.netIncome', s.netIncome],
    ['EPS', 'multiples.subject.eps', s.eps],
    ['Netto gjeld', 'multiples.subject.netDebt', s.netDebt],
    ['Antall aksjer (mill.)', 'multiples.subject.sharesOutstanding', s.sharesOutstanding],
    ['Gjeldende kurs', 'multiples.subject.currentPrice', s.currentPrice],
  ];
  return `
  <div class="section-card">
    <div class="section-header"><span class="section-title">Nøkkeltall — Analyseobjekt</span></div>
    <div class="section-body">
      <div class="multiples-grid">
        ${fields.map(([lbl,path,val]) => `
          <div class="field-group">
            <label class="field-label">${lbl}</label>
            <input class="field-input" type="number" step="any" data-path="${path}" value="${val}">
          </div>`).join('')}
      </div>
    </div>
  </div>`;
}

function renderPeerTable(peers) {
  const mults = peers.map(peerMultiples);
  return `
  <div class="section-card">
    <div class="section-header"><span class="section-title">Sammenlignbare selskaper</span></div>
    <div class="section-body section-body-pad0">
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Selskap</th>
            <th>EV</th><th>Omsetning</th><th>EBITDA</th><th>EBIT</th>
            <th>Nettoresultat</th><th>Market Cap</th>
            <th>EV/Rev</th><th>EV/EBITDA</th><th>EV/EBIT</th><th>P/E</th>
            <th></th>
          </tr></thead>
          <tbody id="peer-tbody">
            ${peers.map((p,i) => renderPeerRow(p, i, mults[i])).join('')}
          </tbody>
        </table>
      </div>
      <button class="btn-add-peer" data-action="add-peer">+ Legg til sammenlignbart selskap</button>
    </div>
  </div>`;
}

function renderPeerRow(p, i, m) {
  const pIn = (field, val) => `<td><input class="tbl-input" type="number" step="any" data-path="multiples.peers.${i}.${field}" value="${val}" style="width:75px"></td>`;
  return `<tr>
    <td><input class="tbl-input" type="text" data-path="multiples.peers.${i}.name" value="${esc(p.name)}" style="width:110px;text-align:left"></td>
    ${pIn('ev', p.ev)}${pIn('revenue', p.revenue)}${pIn('ebitda', p.ebitda)}
    ${pIn('ebit', p.ebit)}${pIn('netIncome', p.netIncome)}${pIn('marketCap', p.marketCap)}
    <td id="pm-evrev-${i}" class="row-computed">${fX(m.evRev)}</td>
    <td id="pm-eveb-${i}" class="row-computed">${fX(m.evEbitda)}</td>
    <td id="pm-eveit-${i}" class="row-computed">${fX(m.evEbit)}</td>
    <td id="pm-pe-${i}" class="row-computed">${fX(m.pe)}</td>
    <td><button class="btn-remove-peer" data-action="remove-peer" data-index="${i}">✕</button></td>
  </tr>`;
}

function renderMultipleStats(stats) {
  const keys = ['evRev','evEbitda','evEbit','pe'];
  const labels = { evRev:'EV/Revenue', evEbitda:'EV/EBITDA', evEbit:'EV/EBIT', pe:'P/E' };
  const rows = ['25. persentil','Median','Gjennomsnitt','75. persentil'];
  const vals = key => stats[key] ? [stats[key].p25, stats[key].median, stats[key].mean, stats[key].p75] : [null,null,null,null];

  return `
  <div class="section-card">
    <div class="section-header"><span class="section-title">Multippelstatistikk</span></div>
    <div class="section-body section-body-pad0">
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Statistikk</th>
            ${keys.map(k => `<th>${labels[k]}</th>`).join('')}
          </tr></thead>
          <tbody id="stats-tbody">
            ${rows.map((r,ri) => `<tr class="row-computed">
              <td><b>${r}</b></td>
              ${keys.map(k => `<td id="stat-${k}-${ri}">${fX(vals(k)[ri])}</td>`).join('')}
            </tr>`).join('')}
            <tr class="row-computed" style="font-size:11px;color:var(--text-muted)">
              <td>Antall selskaper</td>
              ${keys.map(k => `<td>${stats[k] ? stats[k].n : 0}</td>`).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

function renderImpliedValuation(implied, currPrice) {
  if (!implied.length) {
    return `<div class="section-card"><div class="section-header"><span class="section-title">Implisert verdsettelse</span></div>
      <div class="section-body"><p style="color:var(--text-muted)">Legg til sammenlignbare selskaper og fyll inn nøkkeltall for å se implisert verdsettelse.</p></div></div>`;
  }

  const allMids = implied.map(r => r.mid).filter(v => isFinite(v));
  const globalMin = Math.min(...implied.map(r => r.low).filter(isFinite), currPrice || Infinity);
  const globalMax = Math.max(...implied.map(r => r.high).filter(isFinite), currPrice || -Infinity);
  const range = globalMax - globalMin || 1;

  const bars = implied.map(row => {
    const left = ((row.low - globalMin) / range * 100).toFixed(1);
    const width = (((row.high - row.low) / range) * 100).toFixed(1);
    return `<div class="football-row">
      <div class="football-name">${row.name}</div>
      <div class="football-bar-wrap">
        <div class="football-bar" style="margin-left:${left}%;width:${width}%"></div>
      </div>
      <div class="football-prices">
        <span class="football-low">${fPr(row.low)}</span>
        <span class="football-mid">${fPr(row.mid)}</span>
        <span class="football-high">${fPr(row.high)}</span>
      </div>
    </div>`;
  }).join('');

  const currLine = currPrice > 0
    ? `<div class="current-price-line">Gjeldende aksjekurs: <span class="current-price-badge">${fPr(currPrice)}</span></div>`
    : '';

  return `
  <div class="section-card">
    <div class="section-header"><span class="section-title">Implisert verdsettelse — Football Field</span></div>
    <div class="section-body section-body-pad0">
      <div class="football-field">
        <div style="padding:12px 16px 4px;display:flex;gap:24px;font-size:11px;color:var(--text-muted);border-bottom:1px solid var(--border)">
          <span style="width:100px"></span><span style="flex:1"></span>
          <div class="football-prices"><span class="football-low">25. pctl</span><span class="football-mid">Median</span><span class="football-high">75. pctl</span></div>
        </div>
        ${bars}
        ${currLine}
      </div>
    </div>
  </div>
  <div class="section-card">
    <div class="section-header"><span class="section-title">Verdsettelsessammendrag</span></div>
    <div class="section-body section-body-pad0">
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Metodikk</th><th>Lav (25. pctl)</th><th>Mid (Median)</th><th>Høy (75. pctl)</th>
            ${currPrice > 0 ? '<th>Oppside (mid)</th>' : ''}
          </tr></thead>
          <tbody>
            ${implied.map(row => {
              const up = currPrice > 0 ? (row.mid - currPrice) / currPrice : null;
              return `<tr>
                <td><b>${row.name}</b></td>
                <td>${fPr(row.low)}</td>
                <td><b>${fPr(row.mid)}</b></td>
                <td>${fPr(row.high)}</td>
                ${currPrice > 0 ? `<td class="${up >= 0 ? 'upside' : 'downside'}">${up >= 0 ? '+' : ''}${fP(up)}</td>` : ''}
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

// ====================================================================
// 11. MODAL
// ====================================================================

function showModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-overlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  document.getElementById('modal-content').innerHTML = '';
}

function showAddCompanyModal() {
  showModal(`
    <div class="modal-header">
      <h3>Legg til selskap</h3>
      <button class="btn-close-modal" data-action="close-modal">✕</button>
    </div>
    <div class="modal-body">
      <div class="field-group">
        <label class="field-label">Selskapsnavn *</label>
        <input class="field-input" id="new-name" placeholder="f.eks. Equinor ASA">
      </div>
      <div class="field-group">
        <label class="field-label">Ticker *</label>
        <input class="field-input" id="new-ticker" placeholder="f.eks. EQNR">
      </div>
      <div class="field-group">
        <label class="field-label">Sektor</label>
        <select class="field-input" id="new-sector">
          ${SECTORS.map(s => `<option>${s}</option>`).join('')}
        </select>
      </div>
      <div class="field-group">
        <label class="field-label">Valuta</label>
        <select class="field-input" id="new-currency">
          ${CURRENCIES.map(c => `<option>${c}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" data-action="close-modal">Avbryt</button>
      <button class="btn btn-primary" data-action="confirm-add-company">Legg til</button>
    </div>`);
}

// ====================================================================
// 12. UPDATE HELPERS (partial DOM update without full re-render)
// ====================================================================

function refreshDCFOutputs(company) {
  const { ke, kdAt, wacc } = calcWACC(company.dcf.wacc);
  const res = calcDCF(company);
  const { rows } = res;
  const currPrice = pf(company.dcf.bridge.currentPrice);

  set('out-ke', fP(ke));
  set('out-kdat', fP(kdAt));
  set('out-wacc', fP(wacc));

  rows.forEach(r => {
    set(`out-rev-${r.year}`, fN(r.rev));
    set(`out-ebit-${r.year}`, fN(r.ebit));
    set(`out-ebitda-${r.year}`, fN(r.ebitda));
    set(`out-da-${r.year}`, fN(r.da));
    set(`out-capex-${r.year}`, fN(r.capex));
    set(`out-nwc-${r.year}`, fN(r.nwc));
    set(`out-nopat-${r.year}`, fN(r.nopat));
    set(`out-fcf-${r.year}`, fN(r.fcf));
    set(`out-df-${r.year}`, r.df.toFixed(4));
    set(`out-pvfcf-${r.year}`, fN(r.pvFcf));
  });

  set('out-sumpv', fN(res.sumPv));
  set('out-tv', fN(res.tv));
  set('out-pvtv', fN(res.pvTV));
  set('out-ev', fN(res.ev));
  set('out-ev2', fN(res.ev));
  set('out-eq', fN(res.eq));
  set('out-price', fPr(res.price));

  const upside = currPrice > 0 ? (res.price - currPrice) / currPrice : null;
  const uEl = document.getElementById('out-upside');
  if (uEl && upside !== null) {
    uEl.innerHTML = `<span class="${upside >= 0 ? 'upside' : 'downside'}">${upside >= 0 ? '+' : ''}${fP(upside)} vs. kurs</span>`;
  }

  // Refresh sensitivity
  const sensWrap = document.querySelector('.sensitivity-wrap');
  if (sensWrap) {
    const matrix = calcSensitivity(company);
    const tgr = pf(company.dcf.terminalValue.terminalGrowthRate) / 100;
    function cellClass(price, w, g) {
      if (Math.abs(w - wacc) < 0.001 && Math.abs(g - tgr) < 0.001) return 'sens-neutral';
      if (currPrice <= 0) return '';
      const up = (price - currPrice) / currPrice;
      if (up > 0.25) return 'sens-upside-3';
      if (up > 0.10) return 'sens-upside-2';
      if (up > 0)    return 'sens-upside-1';
      if (up > -0.10) return 'sens-down-1';
      if (up > -0.25) return 'sens-down-2';
      return 'sens-down-3';
    }
    const gValues = matrix[0].map(c => c.g);
    const thead = `<thead><tr><th>WACC \\ TGR</th>${gValues.map(g=>`<th>${fP(g)}</th>`).join('')}</tr></thead>`;
    const tbody = `<tbody>${matrix.map(row=>`<tr><td>${fP(row[0].w)}</td>${row.map(cell=>`<td class="${cellClass(cell.price,cell.w,cell.g)}">${fPr(cell.price)}</td>`).join('')}</tr>`).join('')}</tbody>`;
    sensWrap.innerHTML = `<table class="sensitivity-table">${thead}${tbody}</table>`;
  }
}

function refreshMultiplesOutputs(company) {
  const m = company.multiples;
  const stats = multipleStats(m.peers);

  m.peers.forEach((p, i) => {
    const mu = peerMultiples(p);
    set(`pm-evrev-${i}`, fX(mu.evRev));
    set(`pm-eveb-${i}`, fX(mu.evEbitda));
    set(`pm-eveit-${i}`, fX(mu.evEbit));
    set(`pm-pe-${i}`, fX(mu.pe));
  });

  const keys = ['evRev','evEbitda','evEbit','pe'];
  const vals = key => stats[key] ? [stats[key].p25, stats[key].median, stats[key].mean, stats[key].p75] : [null,null,null,null];
  keys.forEach(key => {
    vals(key).forEach((v, ri) => set(`stat-${key}-${ri}`, fX(v)));
  });
}

function set(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ====================================================================
// 13. DEEP SET UTILITY
// ====================================================================

function setNestedVal(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    // Handle array index
    const next = parts[i+1];
    const isNextIndex = /^\d+$/.test(next);
    if (cur[p] === undefined) cur[p] = isNextIndex ? [] : {};
    cur = cur[p];
  }
  const last = parts[parts.length - 1];
  cur[last] = value;
}

// ====================================================================
// 14. EVENT HANDLING
// ====================================================================

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;

  if (action === 'open-company') {
    e.stopPropagation();
    state.currentTab = 'dcf';
    renderCompany(btn.dataset.id);
  }
  else if (action === 'delete-company') {
    e.stopPropagation();
    const id = btn.dataset.id;
    const c = getCompany(id);
    if (!c) return;
    if (!confirm(`Slett "${c.name}"? Denne handlingen kan ikke angres.`)) return;
    deleteCompany(id);
    if (state.currentId === id) state.currentId = null;
    renderDashboard();
  }
  else if (action === 'add-company-btn' || btn.id === 'add-company-btn') {
    showAddCompanyModal();
  }
  else if (action === 'close-modal') {
    closeModal();
  }
  else if (action === 'confirm-add-company') {
    const name   = document.getElementById('new-name').value.trim();
    const ticker = document.getElementById('new-ticker').value.trim();
    const sector = document.getElementById('new-sector').value;
    const currency = document.getElementById('new-currency').value;
    if (!name || !ticker) { alert('Navn og ticker er påkrevd.'); return; }
    const company = createCompany({ name, ticker, sector, currency });
    closeModal();
    state.currentTab = 'dcf';
    renderCompany(company.id);
  }
  else if (action === 'switch-tab') {
    state.currentTab = btn.dataset.tab;
    if (state.currentId) renderCompany(state.currentId);
  }
  else if (action === 'set-proj-years') {
    if (!state.currentId) return;
    const company = getCompany(state.currentId);
    company.dcf.projectionYears = parseInt(btn.dataset.years);
    saveCompany(company);
    renderCompany(state.currentId);
  }
  else if (action === 'add-peer') {
    if (!state.currentId) return;
    const company = getCompany(state.currentId);
    company.multiples.peers.push({ id: crypto.randomUUID(), name:'', ev:'', revenue:'', ebitda:'', ebit:'', netIncome:'', marketCap:'' });
    saveCompany(company);
    // Re-render multiples tab
    const el = document.getElementById('tab-content');
    if (el) { state.currentTab = 'multiples'; el.innerHTML = renderMultiples(company); }
  }
  else if (action === 'remove-peer') {
    if (!state.currentId) return;
    const company = getCompany(state.currentId);
    company.multiples.peers.splice(parseInt(btn.dataset.index), 1);
    saveCompany(company);
    const el = document.getElementById('tab-content');
    if (el) { state.currentTab = 'multiples'; el.innerHTML = renderMultiples(company); }
  }
});

// Add-company button click (direct ID handler as backup)
document.getElementById('add-company-btn').addEventListener('click', () => showAddCompanyModal());

// Close modal on overlay click
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

// Input changes — update state + refresh outputs
document.addEventListener('input', e => {
  const el = e.target;
  const path = el.dataset.path;
  if (!path || !state.currentId) return;

  const company = getCompany(state.currentId);
  if (!company) return;

  setNestedVal(company, path, el.value);
  saveCompany(company);

  if (path.startsWith('dcf.')) {
    refreshDCFOutputs(company);
  } else if (path.startsWith('multiples.')) {
    refreshMultiplesOutputs(company);
  }
});

// Terminal value method change triggers full re-render of TV section
document.addEventListener('change', e => {
  const el = e.target;
  const path = el.dataset.path;
  if (!path || !state.currentId) return;
  if (path !== 'dcf.terminalValue.method') return;

  const company = getCompany(state.currentId);
  if (!company) return;
  company.dcf.terminalValue.method = el.value;
  saveCompany(company);
  renderCompany(state.currentId);
});

// ====================================================================
// 15. UTILITY
// ====================================================================

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ====================================================================
// 16. INIT
// ====================================================================

renderDashboard();
