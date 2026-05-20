
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Calculator, ArrowLeft, ExternalLink, TrendingUp, Shield, Lock, Sun, Moon, FileDown } from 'lucide-react';
import { CltInputs, PjInputs } from './types';
import { calculateFullComparison } from './services/calculator';
import AdUnit from './components/AdUnit';
import CookieConsent, { getConsent, setConsent, ConsentStatus } from './components/CookieConsent';

type View  = 'calculator' | 'terms' | 'privacy' | 'cookies';
type Theme = 'dark' | 'light';

// ── Formatters ────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtShort = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

// ── Flash hook ────────────────────────────────────────────────────────────────
function useFlash(value: number) {
  const [key, setKey] = useState(0);
  const prev = useRef(value);
  useEffect(() => {
    if (Math.abs(prev.current - value) > 0.005) {
      setKey(k => k + 1);
      prev.current = value;
    }
  }, [value]);
  return key;
}

// ── Theme-aware accent colors ─────────────────────────────────────────────────
function useAccents(theme: Theme) {
  const isDark = theme === 'dark';
  return {
    pj:    isDark ? '#B2FF5C' : '#16A34A',
    clt:   isDark ? '#5CA0FF' : '#1D60C8',
    neg:   isDark ? '#FF5D6C' : '#DC2626',
    isDark,
  };
}

// ── CSS var helper ────────────────────────────────────────────────────────────
const v = (name: string) => `var(--${name})`;

// ── Divider ───────────────────────────────────────────────────────────────────
const Divider = () => (
  <div className="my-7 h-px w-full" style={{ background: v('border') }} />
);

// ── Tag/badge ─────────────────────────────────────────────────────────────────
const Tag: React.FC<{ color: string; dimBg: string; children: React.ReactNode }> = ({ color, dimBg, children }) => (
  <span
    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md"
    style={{
      color,
      background: dimBg,
      fontFamily: 'Roboto, sans-serif',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
    }}
  >
    {children}
  </span>
);

// ── Currency input ────────────────────────────────────────────────────────────
const MoneyField: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  isClt?: boolean;
}> = ({ label, value, onChange, isClt }) => {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState('');

  const display = focused
    ? raw === '' ? '' : (parseInt(raw, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    : value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="flex items-baseline gap-2">
        <span style={{ color: v('t3'), fontFamily: "'Roboto Mono', monospace", fontSize: 12, fontWeight: 700, paddingBottom: 8 }}>
          R$
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={display}
          onFocus={() => { setFocused(true); setRaw(value === 0 ? '' : String(Math.round(value * 100))); }}
          onBlur={() => { setFocused(false); onChange(parseInt(raw || '0', 10) / 100); }}
          onChange={e => {
            const d = e.target.value.replace(/\D/g, '');
            setRaw(d);
            onChange(parseInt(d || '0', 10) / 100);
          }}
          className={`field-input flex-1 ${isClt ? 'clt-focus' : ''}`}
        />
      </div>
    </div>
  );
};

// ── Percent input ─────────────────────────────────────────────────────────────
const PctField: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
  isClt?: boolean;
}> = ({ label, value, onChange, hint, isClt }) => {
  const [raw, setRaw] = useState(value.toFixed(1));
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={focused ? raw : value.toFixed(1)}
          onFocus={() => { setFocused(true); setRaw(value.toFixed(1)); }}
          onBlur={() => {
            setFocused(false);
            const n = parseFloat(raw.replace(',', '.'));
            if (!isNaN(n)) onChange(Math.max(0, Math.min(100, n)));
          }}
          onChange={e => {
            const s = e.target.value.replace(/[^0-9.,]/g, '');
            setRaw(s);
            const n = parseFloat(s.replace(',', '.'));
            if (!isNaN(n)) onChange(Math.max(0, Math.min(100, n)));
          }}
          className={`field-input pr-6 ${isClt ? 'clt-focus' : ''}`}
        />
        <span
          className="absolute right-0 bottom-2"
          style={{ color: v('t2'), fontFamily: "'Roboto Mono', monospace", fontSize: 14 }}
        >
          %
        </span>
      </div>
      {hint && (
        <p className="mt-1.5 text-[10px] leading-relaxed" style={{ color: v('t3'), fontFamily: 'Roboto, sans-serif' }}>
          {hint}
        </p>
      )}
    </div>
  );
};

// ── Pro-labore slider ─────────────────────────────────────────────────────────
const ProLaboreSlider: React.FC<{
  rate: number;
  onChange: (v: number) => void;
  billing: number;
  pjColor: string;
}> = ({ rate, onChange, billing, pjColor }) => {
  const computed = Math.max(billing * rate, 1621);
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-y-1 mb-1.5">
        <label className="field-label" style={{ marginBottom: 0 }}>Pró-labore (Fator R)</label>
        <span style={{ color: pjColor, fontFamily: "'Roboto Mono', monospace", fontSize: 12, fontWeight: 700 }}>
          {(rate * 100).toFixed(0)}% → {fmt(computed)}
        </span>
      </div>
      <input
        type="range"
        min="1" max="100"
        value={rate * 100}
        onChange={e => onChange(Number(e.target.value) / 100)}
        className="custom-range mt-3"
      />
      <div className="flex justify-between mt-1.5 text-[10px]" style={{ color: v('t3'), fontFamily: 'Roboto, sans-serif' }}>
        <span>Mín. 28% (Simples III)</span>
        <span>Mín. absoluto: R$1.621</span>
      </div>
    </div>
  );
};

// ── Table row ─────────────────────────────────────────────────────────────────
const TRow: React.FC<{
  label: string;
  clt: string | null;
  pj: string | null;
  negative?: boolean;
  totals?: boolean;
  cltColor: string;
  pjColor: string;
  negColor: string;
}> = ({ label, clt, pj, negative, totals, cltColor, pjColor, negColor }) => (
  <tr style={{ background: totals ? v('surface2') : undefined, borderBottomColor: v('border') }}>
    <td
      className={`${totals ? 'py-5' : 'py-3.5'} px-2 sm:px-5 text-left text-[12px] border-b`}
      style={{
        color: totals ? v('t1') : v('t2'),
        fontFamily: 'Roboto, sans-serif',
        fontWeight: totals ? 700 : 400,
        borderBottomColor: v('border'),
        letterSpacing: totals ? '0.06em' : undefined,
        textTransform: totals ? 'uppercase' : undefined,
        fontSize: totals ? 11 : undefined,
      }}
    >
      {label}
    </td>
    <td
      className={`${totals ? 'py-5' : 'py-3.5'} px-2 sm:px-5 text-right text-[12px] border-b whitespace-nowrap`}
      style={{
        fontFamily: "'Roboto Mono', monospace",
        fontWeight: totals ? 700 : 500,
        fontSize: totals ? 15 : 12,
        color: negative ? negColor : totals ? cltColor : v('t1'),
        borderBottomColor: v('border'),
      }}
    >
      {clt ?? <span style={{ color: v('t3') }}>—</span>}
    </td>
    <td
      className={`${totals ? 'py-5' : 'py-3.5'} px-2 sm:px-5 text-right text-[12px] border-b whitespace-nowrap`}
      style={{
        fontFamily: "'Roboto Mono', monospace",
        fontWeight: totals ? 700 : 500,
        fontSize: totals ? 15 : 12,
        color: negative ? negColor : totals ? pjColor : v('t1'),
        borderBottomColor: v('border'),
      }}
    >
      {pj ?? <span style={{ color: v('t3') }}>—</span>}
    </td>
  </tr>
);

// ── LinkedIn SVG icon ─────────────────────────────────────────────────────────
const LinkedInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

// ── PDF: gera HTML completo em nova janela e imprime ─────────────────────────
function buildPdfHtml(
  r: ReturnType<typeof calculateFullComparison>,
  clt: CltInputs,
  pj: PjInputs,
  year: number,
): string {
  const pjWins    = r.difference.annual >= 0;
  const winner    = pjWins ? 'PJ' : 'CLT';
  const accent    = pjWins ? '#16A34A' : '#1D60C8';
  const accentBg  = pjWins ? '#f0fdf4' : '#eff6ff';
  const proLabore = fmt(Math.max(pj.billingMonthly * pj.proLaboreRate, 1621));
  const today     = new Date().toLocaleDateString('pt-BR');

  const card = (content: string) =>
    `<div style="border:1px solid #e0e0ec;border-radius:8px;padding:14px;">${content}</div>`;

  const label = (text: string, color = '#888') =>
    `<p style="font-size:8pt;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:${color};margin-bottom:7px;font-family:Roboto,sans-serif;">${text}</p>`;

  const kv = (k: string, val: string, valColor = '#111') =>
    `<div style="display:flex;justify-content:space-between;margin-bottom:3px;">
       <span style="color:#555;font-size:10pt;">${k}</span>
       <span style="font-family:'Roboto Mono',monospace;font-weight:700;color:${valColor};">${val}</span>
     </div>`;

  const rows = [
    { desc: 'Salário Bruto / Faturamento', cVal: fmt(r.clt.grossMonthly),  pVal: fmt(r.pj.billingMonthly),  neg: false },
    { desc: 'INSS',                         cVal: fmt(r.clt.inss),           pVal: fmt(r.pj.inssPatronal),    neg: true  },
    { desc: 'IRRF',                         cVal: fmt(r.clt.irrf),           pVal: fmt(r.pj.irrf),            neg: true  },
    { desc: 'DAS — Simples Nacional III',   cVal: '—',                       pVal: fmt(r.pj.simplesNacional), neg: true  },
    { desc: 'Custos Operacionais',          cVal: '—',                       pVal: fmt(r.pj.costs),           neg: true  },
  ];

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório CLT vs PJ — ${today}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4; margin: 14mm 14mm 16mm 14mm; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Roboto', sans-serif;
      color: #111;
      background: #fff;
      font-size: 10pt;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .mono { font-family: 'Roboto Mono', monospace; }
    table { width: 100%; border-collapse: collapse; }
    th {
      text-align: left; font-size: 8pt; font-weight: 700;
      letter-spacing: .12em; text-transform: uppercase;
      border-bottom: 1.5px solid #e0e0ec; padding: 6px 8px;
      color: #888; font-family: Roboto, sans-serif;
    }
    td { padding: 7px 8px; font-size: 10pt; border-bottom: 1px solid #f0f0f8; }
    .tr { text-align: right; }
    .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  </style>
</head>
<body>

  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;border-bottom:2px solid #111;padding-bottom:12px;">
    <div>
      <div style="font-size:22pt;font-weight:900;letter-spacing:-.02em;">
        CLT <span style="color:${accent};">vs</span> PJ
      </div>
      <div style="font-size:8pt;letter-spacing:.2em;text-transform:uppercase;color:#888;margin-top:3px;">
        Relatório Comparativo de Regime de Contratação
      </div>
    </div>
    <div style="text-align:right;font-size:9pt;color:#888;line-height:1.7;">
      <div>Gerado em ${today}</div>
      <div>Tabelas ${year} · INSS, IRRF, Simples Nacional III</div>
    </div>
  </div>

  <!-- Parameters -->
  <div style="font-size:8pt;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#aaa;margin-bottom:9px;">Parâmetros Simulados</div>
  <div class="g2" style="margin-bottom:18px;">
    ${card(label('● CLT', '#1D60C8') + kv('Salário Bruto', fmt(clt.grossSalary), '#1D60C8') + kv('Encargos Patronais', `${(clt.employerChargesRate * 100).toFixed(1)}%`))}
    ${card(label('● PJ — Simples Nacional III', '#16A34A') + kv('Faturamento Mensal', fmt(pj.billingMonthly), '#16A34A') + kv('Pró-labore (Fator R)', `${(pj.proLaboreRate * 100).toFixed(0)}% = ${proLabore}`) + kv('Custos Operacionais', `${(pj.costsRate * 100).toFixed(1)}%`))}
  </div>

  <!-- Verdict -->
  <div style="border:1.5px solid ${accent};border-radius:10px;padding:16px 20px;margin-bottom:18px;background:${accentBg};">
    ${label(`● ${winner} Vence — Vantagem Anual`, accent)}
    <div class="mono" style="font-size:30pt;font-weight:900;color:${accent};line-height:1;margin-bottom:6px;">${fmtShort(Math.abs(r.difference.annual))}</div>
    <div style="display:flex;gap:24px;font-size:10pt;color:#555;">
      <span><strong class="mono" style="color:${accent};">${fmt(Math.abs(r.difference.monthly))}</strong> por mês</span>
      <span><strong class="mono" style="color:${accent};">${Math.abs(r.difference.percent).toFixed(1)}%</strong> de ganho a mais</span>
    </div>
  </div>

  <!-- Net liquid -->
  <div class="g2" style="margin-bottom:18px;">
    ${card(label('CLT — Líquido Mensal', '#1D60C8') + `<div class="mono" style="font-size:18pt;font-weight:900;color:#1D60C8;line-height:1.1;">${fmt(r.clt.netMonthly)}</div><div style="font-size:9pt;color:#888;margin-top:4px;">${fmtShort(r.clt.totalAnnualNet)}/ano</div>`)}
    ${card(label('PJ — Líquido Mensal', '#16A34A') + `<div class="mono" style="font-size:18pt;font-weight:900;color:#16A34A;line-height:1.1;">${fmt(r.pj.netMonthly)}</div><div style="font-size:9pt;color:#888;margin-top:4px;">${fmtShort(r.pj.totalAnnualNet)}/ano</div>`)}
  </div>

  <!-- Detail table -->
  <div style="font-size:8pt;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#aaa;margin-bottom:8px;">Demonstrativo Fiscal Detalhado — ${year}</div>
  <table style="margin-bottom:18px;">
    <thead>
      <tr>
        <th style="width:48%;">Discriminação</th>
        <th class="tr" style="color:#1D60C8;">CLT</th>
        <th class="tr" style="color:#16A34A;">PJ — Simples III</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map(row => `
      <tr>
        <td style="color:#444;">${row.desc}</td>
        <td class="tr mono" style="font-weight:500;color:${row.neg ? '#DC2626' : '#111'};">${row.cVal}</td>
        <td class="tr mono" style="font-weight:500;color:${row.neg ? '#DC2626' : '#111'};">${row.pVal}</td>
      </tr>`).join('')}
      <tr style="background:#f7f8fc;">
        <td style="font-weight:700;font-size:11pt;text-transform:uppercase;letter-spacing:.05em;border-bottom:none;">Disponível Líquido</td>
        <td class="tr mono" style="font-weight:900;font-size:13pt;color:#1D60C8;border-bottom:none;">${fmt(r.clt.netMonthly)}</td>
        <td class="tr mono" style="font-weight:900;font-size:13pt;color:#16A34A;border-bottom:none;">${fmt(r.pj.netMonthly)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Employer cost -->
  <div style="font-size:8pt;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#aaa;margin-bottom:8px;">Custo Total Para a Empresa</div>
  <div class="g2" style="margin-bottom:24px;">
    ${card(label('CLT', '#1D60C8') + `<div class="mono" style="font-size:16pt;font-weight:900;color:#1D60C8;">${fmt(r.clt.employerCost)}</div><div style="font-size:9pt;color:#888;margin-top:3px;">+${(clt.employerChargesRate * 100).toFixed(1)}% em encargos patronais</div>`)}
    ${card(label('PJ', '#16A34A') + `<div class="mono" style="font-size:16pt;font-weight:900;color:#16A34A;">${fmt(r.pj.billingMonthly)}</div><div style="font-size:9pt;color:#888;margin-top:3px;">Faturamento bruto contratado</div>`)}
  </div>

  <!-- Footer -->
  <div style="border-top:1px solid #e0e0ec;padding-top:8px;display:flex;justify-content:space-between;">
    <span style="font-size:8pt;color:#aaa;">Estimativa com base nas tabelas ${year}. Não substitui orientação contábil profissional.</span>
    <span style="font-size:8pt;color:#aaa;">calculadorapj.otaviorafael.com.br</span>
  </div>

</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const [view,  setView]  = useState<View>('calculator');
  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem('theme') as Theme) || 'dark'
  );
  const [consent, setConsentState] = useState<ConsentStatus>(() => getConsent());

  useEffect(() => {
    const handler = () => setView('cookies');
    window.addEventListener('navigate-privacy', handler);
    return () => window.removeEventListener('navigate-privacy', handler);
  }, []);

  function handleAccept() {
    setConsent('accepted');
    setConsentState('accepted');
  }
  function handleDecline() {
    setConsent('declined');
    setConsentState('declined');
  }

  const [clt, setClt] = useState<CltInputs>({ grossSalary: 8500, employerChargesRate: 0.338 });
  const [pj,  setPj]  = useState<PjInputs>({ billingMonthly: 12500, proLaboreRate: 0.28, costsRate: 0.05 });

  const year = new Date().getFullYear();
  const { pj: pjColor, clt: cltColor, neg: negColor, isDark } = useAccents(theme);

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [view]);

  const r = useMemo(() => calculateFullComparison(clt, pj), [clt, pj]);

  const pjWins   = r.difference.annual >= 0;
  const accent   = pjWins ? pjColor  : cltColor;
  const accentDim = pjWins
    ? isDark ? 'rgba(178,255,92,0.1)' : 'rgba(22,163,74,0.08)'
    : isDark ? 'rgba(92,160,255,0.1)' : 'rgba(29,96,200,0.08)';
  const winnerLabel = pjWins ? 'PJ' : 'CLT';

  const verdictKey = useFlash(r.difference.annual);
  const cltKey     = useFlash(r.clt.netMonthly);
  const pjKey      = useFlash(r.pj.netMonthly);

  const handlePrint = () => {
    const html = buildPdfHtml(r, clt, pj, year);
    const win  = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    // Wait for fonts to load before printing
    win.onload = () => { win.focus(); win.print(); };
  };

  // ── Calculator ──────────────────────────────────────────────────────────────
  const calculator = (
    <div className="page-in grid grid-cols-1 lg:grid-cols-[400px_1fr]">

      {/* ─── Inputs (sticky left) ────────────────────────────────────────── */}
      <div
        className="lg:sticky lg:top-[72px] lg:h-[calc(100vh-72px)] lg:overflow-y-auto px-5 sm:px-7 py-8 border-b lg:border-b-0 lg:border-r"
        style={{ borderColor: v('border') }}
      >
        {/* CLT */}
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2 h-2 rounded-full" style={{ background: cltColor }} />
          <span
            className="text-[10px] font-bold tracking-[0.2em] uppercase"
            style={{ color: cltColor, fontFamily: 'Roboto, sans-serif' }}
          >
            Regime CLT
          </span>
        </div>

        <div className="space-y-6">
          <MoneyField label="Salário Bruto Mensal" value={clt.grossSalary} onChange={g => setClt({ ...clt, grossSalary: g })} isClt />
          <PctField
            label="Encargos Patronais"
            value={clt.employerChargesRate * 100}
            onChange={n => setClt({ ...clt, employerChargesRate: n / 100 })}
            hint="INSS (20%) + FGTS (8%) + 13º + Férias + PIS/PASEP. Padrão: 33,8%"
            isClt
          />
        </div>

        <Divider />

        {/* PJ */}
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2 h-2 rounded-full" style={{ background: pjColor }} />
          <span
            className="text-[10px] font-bold tracking-[0.2em] uppercase"
            style={{ color: pjColor, fontFamily: 'Roboto, sans-serif' }}
          >
            Regime PJ — Simples Nacional III
          </span>
        </div>

        <div className="space-y-6">
          <MoneyField label="Faturamento Mensal" value={pj.billingMonthly} onChange={b => setPj({ ...pj, billingMonthly: b })} />
          <ProLaboreSlider rate={pj.proLaboreRate} onChange={r => setPj({ ...pj, proLaboreRate: r })} billing={pj.billingMonthly} pjColor={pjColor} />
          <PctField
            label="Custos Operacionais"
            value={pj.costsRate * 100}
            onChange={n => setPj({ ...pj, costsRate: n / 100 })}
            hint="Contador, softwares, infraestrutura (% sobre faturamento)"
          />
        </div>

        <div className="mt-8"><AdUnit slot="9217882912" consentAccepted={consent === 'accepted'} /></div>
      </div>

      {/* ─── Results (right) ─────────────────────────────────────────────── */}
      <div className="px-6 lg:px-10 py-8 space-y-5">

        {/* VERDICT */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: `1px solid ${accent}30`, background: v('surface') }}
        >
          <div
            className="verdict-gradient-line"
            style={{
              height: 2,
              background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            }}
          />
          <div className="px-7 py-6">
            <div className="flex items-center justify-between mb-4">
              <Tag color={accent} dimBg={accentDim}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
                {winnerLabel} vence
              </Tag>
              <span className="text-[11px]" style={{ color: v('t3'), fontFamily: 'Roboto, sans-serif' }}>
                vantagem anual
              </span>
            </div>

            <p
              key={verdictKey}
              className="num-flash font-black leading-none verdict-glow"
              style={{
                fontFamily: "'Roboto Mono', monospace",
                fontSize: 'clamp(2.6rem, 5.5vw, 4rem)',
                color: accent,
                textShadow: isDark ? `0 0 80px ${accent}50` : 'none',
              }}
            >
              {fmtShort(Math.abs(r.difference.annual))}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-y-3 mt-3">
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                <span style={{ fontFamily: 'Roboto, sans-serif', color: v('t2'), fontSize: 13 }}>
                  <span style={{ color: accent, fontFamily: "'Roboto Mono', monospace", fontWeight: 700 }}>
                    {fmt(Math.abs(r.difference.monthly))}
                  </span>{' '}
                  por mês
                </span>
                <span style={{ fontFamily: 'Roboto, sans-serif', color: v('t2'), fontSize: 13 }}>
                  <span style={{ color: accent, fontFamily: "'Roboto Mono', monospace", fontWeight: 700 }}>
                    {Math.abs(r.difference.percent).toFixed(1)}%
                  </span>{' '}
                  de ganho a mais
                </span>
              </div>

              {/* PDF button */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold tracking-wide transition-all"
                style={{
                  background: accentDim,
                  color: accent,
                  border: `1px solid ${accent}40`,
                  fontFamily: 'Roboto, sans-serif',
                  letterSpacing: '0.08em',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = `${accent}22`;
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = accentDim;
                  (e.currentTarget as HTMLButtonElement).style.transform = 'none';
                }}
              >
                <FileDown className="w-3.5 h-3.5" />
                Baixar PDF
              </button>
            </div>
          </div>
          <div
            className="verdict-gradient-line"
            style={{
              height: 1,
              background: `linear-gradient(90deg, transparent, ${accent}50, transparent)`,
            }}
          />
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'CLT Líquido',  net: r.clt.netMonthly, annual: r.clt.totalAnnualNet, color: cltColor, flashKey: cltKey },
            { label: 'PJ Líquido',   net: r.pj.netMonthly,  annual: r.pj.totalAnnualNet,  color: pjColor,  flashKey: pjKey  },
          ].map(card => (
            <div key={card.label} className="rounded-xl px-3 sm:px-5 py-4 min-w-0 overflow-hidden" style={{ background: v('surface'), border: `1px solid ${v('border')}` }}>
              <div className="flex items-center gap-1.5 mb-3">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: card.color }} />
                <span className="field-label" style={{ marginBottom: 0 }}>{card.label}</span>
              </div>
              <p
                key={card.flashKey}
                className="num-flash font-bold truncate"
                style={{ color: card.color, fontFamily: "'Roboto Mono', monospace", fontSize: 'clamp(0.9rem, 3.5vw, 1.25rem)' }}
              >
                {fmt(card.net)}
              </p>
              <p className="text-[11px] mt-1" style={{ color: v('t3'), fontFamily: 'Roboto, sans-serif' }}>
                {fmtShort(card.annual)}/ano
              </p>
            </div>
          ))}
        </div>

        <AdUnit slot="6312517973" format="auto" consentAccepted={consent === 'accepted'} />

        {/* Detail table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: v('surface'), border: `1px solid ${v('border')}` }}>
          <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: v('border') }}>
            <span className="text-[11px] font-bold tracking-[0.18em] uppercase" style={{ color: v('t2'), fontFamily: 'Roboto, sans-serif' }}>
              Demonstrativo Fiscal {year}
            </span>
            <div className="flex items-center gap-4 text-[10px] font-bold tracking-wider" style={{ fontFamily: 'Roboto, sans-serif' }}>
              <span style={{ color: cltColor }}>● CLT</span>
              <span style={{ color: pjColor }}>● PJ</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[340px]">
              <thead>
                <tr style={{ borderBottom: `1px solid ${v('border')}` }}>
                  {['Item', 'CLT', 'PJ — Simples III'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-2 sm:px-5 py-3 text-[10px] font-bold tracking-[0.15em] uppercase ${i === 0 ? 'text-left' : 'text-right'}`}
                      style={{ color: i === 0 ? v('t3') : i === 1 ? cltColor : pjColor, fontFamily: 'Roboto, sans-serif', borderBottomColor: v('border') }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <TRow label="Bruto / Faturamento" clt={fmt(r.clt.grossMonthly)} pj={fmt(r.pj.billingMonthly)} cltColor={cltColor} pjColor={pjColor} negColor={negColor} />
                <TRow label="INSS" clt={fmt(r.clt.inss)} pj={fmt(r.pj.inssPatronal)} negative cltColor={cltColor} pjColor={pjColor} negColor={negColor} />
                <TRow label="IRRF" clt={fmt(r.clt.irrf)} pj={fmt(r.pj.irrf)} negative cltColor={cltColor} pjColor={pjColor} negColor={negColor} />
                <TRow label="DAS — Simples Nacional III" clt={null} pj={fmt(r.pj.simplesNacional)} negative cltColor={cltColor} pjColor={pjColor} negColor={negColor} />
                <TRow label="Custos Operacionais" clt={null} pj={fmt(r.pj.costs)} negative cltColor={cltColor} pjColor={pjColor} negColor={negColor} />
                <TRow label="Disponível Líquido" clt={fmt(r.clt.netMonthly)} pj={fmt(r.pj.netMonthly)} totals cltColor={cltColor} pjColor={pjColor} negColor={negColor} />
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 border-t text-[10px] leading-relaxed" style={{ borderColor: v('border'), color: v('t3'), fontFamily: 'Roboto, sans-serif' }}>
            INSS 7,5–14% progressivo · IRRF com isenção progressiva até R$5.000 ({year}) · Simples Nacional Anexo III · INSS Patronal Simples 11%
          </div>
        </div>

        {/* Employer cost */}
        <div className="rounded-2xl p-6" style={{ background: v('surface'), border: `1px solid ${v('border')}` }}>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-5" style={{ color: v('t2'), fontFamily: 'Roboto, sans-serif' }}>
            Custo Total Para a Empresa
          </p>
          <div className="grid grid-cols-2 gap-6 mb-5">
            {[
              { label: 'CLT', value: r.clt.employerCost, color: cltColor, sub: `+${(clt.employerChargesRate * 100).toFixed(1)}% encargos` },
              { label: 'PJ',  value: r.pj.billingMonthly,  color: pjColor,  sub: 'faturamento bruto' },
            ].map(item => (
              <div key={item.label}>
                <p className="field-label">{item.label}</p>
                <p className="text-xl font-bold" style={{ color: item.color, fontFamily: "'Roboto Mono', monospace" }}>
                  {fmt(item.value)}
                </p>
                <p className="text-[11px] mt-1" style={{ color: v('t3'), fontFamily: 'Roboto, sans-serif' }}>{item.sub}</p>
              </div>
            ))}
          </div>
          {[
            { label: 'CLT', value: r.clt.employerCost,   color: cltColor },
            { label: 'PJ',  value: r.pj.billingMonthly,  color: pjColor  },
          ].map(bar => {
            const max = Math.max(r.clt.employerCost, r.pj.billingMonthly);
            return (
              <div key={bar.label} className="flex items-center gap-3 mb-2.5 last:mb-0">
                <span className="text-[10px] font-bold w-6 flex-shrink-0" style={{ color: bar.color, fontFamily: 'Roboto, sans-serif' }}>
                  {bar.label}
                </span>
                <div className="flex-1 h-1 rounded-full" style={{ background: v('border2') }}>
                  <div
                    className="cost-bar h-full rounded-full"
                    style={{ width: max > 0 ? `${(bar.value / max) * 100}%` : '0%', background: bar.color }}
                  />
                </div>
                <span className="text-[11px] font-semibold w-28 text-right flex-shrink-0" style={{ color: bar.color, fontFamily: "'Roboto Mono', monospace" }}>
                  {fmt(bar.value)}
                </span>
              </div>
            );
          })}
        </div>

        <AdUnit slot="6312517973" format="auto" consentAccepted={consent === 'accepted'} />

        {/* Trust badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: <TrendingUp className="w-4 h-4" />, color: pjColor,  title: `Tabelas ${year}`,   desc: 'INSS, IRRF e Simples Nacional atualizados. Isenção progressiva 2026.' },
            { icon: <Shield     className="w-4 h-4" />, color: cltColor, title: 'Cálculo Preciso',   desc: 'INSS Patronal Simples (11%), Fator R e desconto simplificado aplicados.' },
            { icon: <Lock       className="w-4 h-4" />, color: '#9B8CFF', title: 'Privacidade Total', desc: 'Tudo local no browser. Nenhum dado enviado a servidores.' },
          ].map((item, i) => (
            <div key={i} className="rounded-xl p-4" style={{ background: v('surface'), border: `1px solid ${v('border')}` }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: item.color }}>{item.icon}</span>
                <p className="text-[11px] font-bold" style={{ color: item.color, fontFamily: 'Roboto, sans-serif' }}>{item.title}</p>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: v('t2'), fontFamily: 'Roboto, sans-serif' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Static pages ─────────────────────────────────────────────────────────────
  const staticPage = (title: string, content: React.ReactNode) => (
    <div className="page-in max-w-2xl mx-auto px-6 py-12">
      <button
        onClick={() => setView('calculator')}
        className="flex items-center gap-2 text-[12px] font-bold mb-10 transition-colors"
        style={{ color: v('t2'), fontFamily: 'Roboto, sans-serif' }}
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>
      <h2 className="text-3xl font-bold mb-8" style={{ color: v('t1'), fontFamily: 'Roboto, sans-serif' }}>
        {title}
      </h2>
      <div className="space-y-5 text-sm leading-relaxed" style={{ color: v('t2'), fontFamily: 'Roboto, sans-serif' }}>
        {content}
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: v('bg'), color: v('t1'), minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: v('header-bg'),
          borderColor: v('border'),
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        <div className="max-w-[1440px] mx-auto px-6 flex items-center justify-between" style={{ height: 72 }}>
          {/* Logo */}
          <button onClick={() => setView('calculator')} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: pjColor }}>
              <Calculator className="w-[18px] h-[18px]" style={{ color: isDark ? '#0C0E14' : '#fff' }} />
            </div>
            <div className="text-left">
              <p className="text-base font-bold leading-tight" style={{ fontFamily: 'Roboto, sans-serif', color: v('t1') }}>
                CLT <span style={{ color: pjColor }}>vs</span> PJ
              </p>
              <p className="text-[9px] tracking-[0.22em] uppercase mt-0.5" style={{ color: v('t3'), fontFamily: 'Roboto, sans-serif' }}>
                Calculadora Pro
              </p>
            </div>
          </button>

          <div className="flex items-center gap-3">
            {/* Live tables badge */}
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase"
              style={{ background: v('surface2'), color: pjColor, border: `1px solid ${v('border2')}`, fontFamily: 'Roboto, sans-serif' }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: pjColor, animation: 'glowPulse 2s ease-in-out infinite' }}
              />
              Tabelas {year}
            </div>

            {/* Theme toggle */}
            <button
              className="theme-btn"
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            >
              {theme === 'dark'
                ? <Sun  className="w-4 h-4" />
                : <Moon className="w-4 h-4" />
              }
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow max-w-[1440px] mx-auto w-full">
        {view === 'calculator' && calculator}
        {view === 'terms' && staticPage('Termos de Uso', (
          <>
            <p>Ao utilizar a <strong style={{ color: v('t1') }}>Calculadora CLT × PJ Pro</strong>, você concorda com os termos aqui descritos.</p>
            <p><strong style={{ color: v('t1') }}>Finalidade Informativa:</strong> Caráter exclusivamente informativo. Os resultados são estimativas e não constituem aconselhamento jurídico, contábil ou financeiro.</p>
            <p><strong style={{ color: v('t1') }}>Responsabilidade:</strong> A decisão final deve ser validada por um contador qualificado.</p>
            <p><strong style={{ color: v('t1') }}>Atualização:</strong> Tabelas de {year} mantidas atualizadas, mas alterações legislativas podem ocorrer sem aviso prévio.</p>
          </>
        ))}
        {view === 'privacy' && staticPage('Política de Privacidade', (
          <>
            <p>Não coletamos, armazenamos ou transmitimos nenhum dado financeiro inserido na calculadora. Todos os cálculos são realizados localmente no seu navegador.</p>
            <p><strong style={{ color: v('t1') }}>Dados coletados:</strong> Não há coleta de dados pessoais identificáveis. Não há cadastro, login ou formulário de contato neste site.</p>
            <p><strong style={{ color: v('t1') }}>Cookies e publicidade:</strong> Utilizamos o Google AdSense para exibir anúncios. O Google pode usar cookies para personalizar anúncios com base nas suas visitas anteriores a este e a outros sites. Você pode optar por não receber anúncios personalizados acessando as <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" style={{ color: v('t1') }}>Configurações de anúncios do Google</a>.</p>
            <p><strong style={{ color: v('t1') }}>Segurança:</strong> Ao fechar a aba, todos os dados inseridos são descartados. Nada é enviado a servidores externos.</p>
            <p><strong style={{ color: v('t1') }}>Gerenciar consentimento:</strong>{' '}
              <button
                onClick={() => setView('cookies')}
                style={{ background: 'none', border: 'none', padding: 0, color: v('t1'), cursor: 'pointer', fontSize: 'inherit', textDecoration: 'underline' }}
              >
                Clique aqui para revisar sua preferência de cookies.
              </button>
            </p>
          </>
        ))}
        {view === 'cookies' && staticPage('Política de Privacidade e Cookies', (
          <>
            <h3 style={{ color: v('t1'), marginTop: 0 }}>O que são cookies?</h3>
            <p>Cookies são pequenos arquivos de texto armazenados no seu navegador quando você visita um site. Eles servem para lembrar preferências, medir audiência e exibir publicidade relevante.</p>

            <h3 style={{ color: v('t1') }}>Quais cookies usamos?</h3>
            <p><strong style={{ color: v('t1') }}>Cookies de preferência (necessários):</strong> Salvamos no <code>localStorage</code> do seu navegador apenas o tema visual escolhido (claro/escuro) e sua preferência de consentimento de cookies. Esses dados ficam exclusivamente no seu dispositivo.</p>
            <p><strong style={{ color: v('t1') }}>Cookies de publicidade (Google AdSense):</strong> Se você aceitar, o Google AdSense pode armazenar cookies para exibir anúncios personalizados. O Google coleta dados como páginas visitadas, localização aproximada e interesses inferidos para personalizar os anúncios.</p>

            <h3 style={{ color: v('t1') }}>Dados que NÃO coletamos</h3>
            <p>Todos os valores financeiros digitados na calculadora (salário, encargos, faturamento etc.) são processados apenas no seu navegador e nunca são enviados a nenhum servidor.</p>

            <h3 style={{ color: v('t1') }}>Seus direitos</h3>
            <p>Você pode recusar os cookies de publicidade a qualquer momento usando os botões abaixo. Ao recusar, os anúncios do Google AdSense não serão carregados. Sua preferência fica salva no seu navegador.</p>
            <p>Para revogar o consentimento junto ao Google, acesse: <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" style={{ color: v('t1') }}>adssettings.google.com</a>.</p>

            <h3 style={{ color: v('t1') }}>Contato</h3>
            <p>Dúvidas? Entre em contato via <a href="https://www.linkedin.com/in/otaviorafaelarruda/" target="_blank" rel="noopener noreferrer" style={{ color: v('t1') }}>LinkedIn</a>.</p>

            <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => { handleAccept(); setView('calculator'); }}
                style={{
                  padding: '10px 24px',
                  borderRadius: 6,
                  border: 'none',
                  background: isDark ? '#B2FF5C' : '#16A34A',
                  color: isDark ? '#0d0d1a' : '#fff',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                }}
              >
                {consent === 'accepted' ? '✓ Cookies aceitos' : 'Aceitar cookies de publicidade'}
              </button>
              <button
                onClick={() => { handleDecline(); setView('calculator'); }}
                style={{
                  padding: '10px 24px',
                  borderRadius: 6,
                  border: `1px solid ${v('border')}`,
                  background: 'transparent',
                  color: v('t2'),
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                }}
              >
                {consent === 'declined' ? '✓ Cookies recusados' : 'Recusar cookies de publicidade'}
              </button>
            </div>
          </>
        ))}
      </main>

      {/* Footer */}
      <footer className="border-t mt-8" style={{ borderColor: v('border'), background: v('surface') }}>

        {/* LinkedIn CTA */}
        <div
          className="border-b py-8 px-6"
          style={{ borderColor: v('border') }}
        >
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
            <div>
              <p className="text-base font-bold" style={{ color: v('t1'), fontFamily: 'Roboto, sans-serif' }}>
                Esse comparativo te ajudou?
              </p>
              <p className="text-sm mt-0.5" style={{ color: v('t2'), fontFamily: 'Roboto, sans-serif' }}>
                Sigo compartilhando conteúdo sobre carreira, tecnologia e finanças para devs.
              </p>
            </div>
            <a
              href="https://www.linkedin.com/in/otaviorafaelarruda/"
              target="_blank"
              rel="noopener noreferrer"
              className="linkedin-btn flex-shrink-0"
            >
              <LinkedInIcon />
              Me seguir no LinkedIn
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-5 px-6">
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div
              className="flex flex-wrap items-center gap-6 text-[10px] font-bold tracking-[0.18em] uppercase"
              style={{ color: v('t3'), fontFamily: 'Roboto, sans-serif' }}
            >
              <button onClick={() => setView('terms')} style={{ color: v('t3') }}
                onMouseEnter={e => (e.currentTarget.style.color = pjColor)}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--t3)')}>
                Termos
              </button>
              <button onClick={() => setView('privacy')} style={{ color: v('t3') }}
                onMouseEnter={e => (e.currentTarget.style.color = pjColor)}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--t3)')}>
                Privacidade
              </button>
              <button onClick={() => setView('cookies')} style={{ color: v('t3') }}
                onMouseEnter={e => (e.currentTarget.style.color = pjColor)}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--t3)')}>
                Cookies
              </button>
              <span>© {year} CLT vs PJ</span>
            </div>
            <a
              href="https://orlamsolutions.or.app.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase transition-colors"
              style={{ color: v('t3'), fontFamily: 'Roboto, sans-serif' }}
              onMouseEnter={e => (e.currentTarget.style.color = pjColor)}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--t3)')}
            >
              Orlam Solutions <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {consent === null && (
        <CookieConsent onAccept={handleAccept} onDecline={handleDecline} />
      )}
    </div>
  );
};

export default App;
