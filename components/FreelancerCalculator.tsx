
import React, { useState } from 'react';
import { TrendingUp, Shield, Lock, FileDown } from 'lucide-react';
import AdUnit from './AdUnit';

interface Props {
  freelancerColor: string;
  isDark: boolean;
  consentAccepted: boolean;
}

const v = (name: string) => `var(--${name})`;
const fmt = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const MoneyField: React.FC<{ label: string; value: number; onChange: (v: number) => void; hint?: string }> = ({
  label, value, onChange, hint,
}) => {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState('');
  const display = focused
    ? raw === '' ? '' : (parseInt(raw, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    : value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="flex items-baseline gap-2">
        <span style={{ color: v('t3'), fontFamily: "'Roboto Mono', monospace", fontSize: 12, fontWeight: 700, paddingBottom: 8 }}>R$</span>
        <input
          type="text" inputMode="numeric" value={display}
          onFocus={() => { setFocused(true); setRaw(value === 0 ? '' : String(Math.round(value * 100))); }}
          onBlur={() => { setFocused(false); onChange(parseInt(raw || '0', 10) / 100); }}
          onChange={e => {
            const d = e.target.value.replace(/\D/g, '');
            setRaw(d);
            onChange(parseInt(d || '0', 10) / 100);
          }}
          className="field-input flex-1"
        />
      </div>
      {hint && <p className="mt-1.5 text-[10px] leading-relaxed" style={{ color: v('t3'), fontFamily: 'Roboto, sans-serif' }}>{hint}</p>}
    </div>
  );
};

const NumField: React.FC<{ label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; suffix?: string; hint?: string }> = ({
  label, value, onChange, min = 1, max = 9999, suffix, hint,
}) => {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState(String(value));

  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="relative">
        <input
          type="text" inputMode="numeric"
          value={focused ? raw : String(value)}
          onFocus={() => { setFocused(true); setRaw(String(value)); }}
          onBlur={() => {
            setFocused(false);
            const n = parseInt(raw, 10);
            onChange(!isNaN(n) ? Math.max(min, Math.min(max, n)) : value);
          }}
          onChange={e => {
            const s = e.target.value.replace(/\D/g, '');
            setRaw(s);
            const n = parseInt(s, 10);
            if (!isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
          }}
          className="field-input"
          style={suffix ? { paddingRight: '4rem' } : undefined}
        />
        {suffix && (
          <span className="absolute right-0 bottom-2 text-[12px]" style={{ color: v('t2'), fontFamily: "'Roboto Mono', monospace" }}>
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="mt-1.5 text-[10px] leading-relaxed" style={{ color: v('t3'), fontFamily: 'Roboto, sans-serif' }}>{hint}</p>}
    </div>
  );
};

// ── PDF generation ────────────────────────────────────────────────────────────

interface FreelancerPdfData {
  tab: 'hourly' | 'project';
  accent: string;
  monthlyIncome: number;
  hoursPerDay: number;
  daysPerWeek: number;
  vacationWeeks: number;
  workingWeeks: number;
  annualHours: number;
  monthlyHours: number;
  hourlyRate: number;
  projectRate: number;
  projectHoursPerDay: number;
  projectDays: number;
  totalProjectHours: number;
  projectValue: number;
}

function buildFreelancerPdfHtml(d: FreelancerPdfData): string {
  const today = new Date().toLocaleDateString('pt-BR');
  const accent = d.accent;
  const isHourly = d.tab === 'hourly';
  const mainValue = isHourly ? d.hourlyRate : d.projectValue;
  const mainLabel = isHourly ? 'Valor por Hora' : 'Valor do Projeto';
  const mainSuffix = isHourly ? '/hora' : '';

  const hourlyRows = [
    ['Rendimento mensal desejado', fmt(d.monthlyIncome)],
    ['Rendimento anual (× 12)', fmt(d.monthlyIncome * 12)],
    ['Horas por dia', `${d.hoursPerDay}h`],
    ['Dias de trabalho por semana', `${d.daysPerWeek} dias`],
    [`Semanas úteis (52 − ${d.vacationWeeks})`, `${d.workingWeeks} semanas`],
    ['Total horas faturáveis/ano', `${d.annualHours}h`],
  ];

  const projectRows = [
    ['Valor da hora', `${fmt(d.projectRate)}/h`],
    ['Horas por dia no projeto', `${d.projectHoursPerDay}h/dia`],
    ['Duração do projeto', `${d.projectDays} dias`],
    ['Total de horas trabalhadas', `${d.totalProjectHours}h`],
  ];

  const rows = (isHourly ? hourlyRows : projectRows).map(([label, value]) => `
    <tr>
      <td>${label}</td>
      <td class="tr mono" style="font-weight:600;">${value}</td>
    </tr>
  `).join('');

  const statsHtml = isHourly ? `
    <div class="g3" style="margin-bottom:18px;">
      <div class="card"><div class="lbl">Horas faturáveis/ano</div><div class="mono big-num" style="color:${accent};">${d.annualHours}h</div><div class="sub">${d.hoursPerDay}h × ${d.daysPerWeek}d × ${d.workingWeeks}sem</div></div>
      <div class="card"><div class="lbl">Horas faturáveis/mês</div><div class="mono big-num" style="color:${accent};">${d.monthlyHours}h</div><div class="sub">média mensal</div></div>
      <div class="card"><div class="lbl">Rendimento anual</div><div class="mono big-num">${fmt(d.monthlyIncome * 12)}</div><div class="sub">objetivo total</div></div>
    </div>
  ` : `
    <div class="g3" style="margin-bottom:18px;">
      <div class="card"><div class="lbl">Total de horas</div><div class="mono big-num" style="color:${accent};">${d.totalProjectHours}h</div><div class="sub">${d.projectHoursPerDay}h/dia × ${d.projectDays}d</div></div>
      <div class="card"><div class="lbl">Valor/hora aplicado</div><div class="mono big-num" style="color:${accent};">${fmt(d.projectRate)}</div><div class="sub">por hora trabalhada</div></div>
      <div class="card"><div class="lbl">Duração do projeto</div><div class="mono big-num">${d.projectDays} dias</div><div class="sub">≈ ${Math.ceil(d.projectDays / 7)} semanas</div></div>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Freelancer — ${mainLabel} — ${today}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4; margin: 14mm 14mm 16mm 14mm; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Roboto', sans-serif; color: #111; background: #fff; font-size: 10pt; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .mono { font-family: 'Roboto Mono', monospace; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 8pt; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; border-bottom: 1.5px solid #e0e0ec; padding: 6px 8px; color: #888; }
    td { padding: 6px 8px; font-size: 9.5pt; border-bottom: 1px solid #f0f0f8; }
    .tr { text-align: right; }
    .g3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .card { border: 1px solid #e0e0ec; border-radius: 8px; padding: 12px 14px; }
    .lbl { font-size: 8pt; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; color: #888; margin-bottom: 6px; }
    .big-num { font-size: 16pt; font-weight: 900; }
    .sub { font-size: 8pt; color: #888; margin-top: 3px; }
    .section-label { font-size: 8pt; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: #aaa; margin-bottom: 9px; }
  </style>
</head>
<body>

  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;border-bottom:2px solid #111;padding-bottom:12px;">
    <div>
      <div style="font-size:22pt;font-weight:900;letter-spacing:-.02em;">
        Calculadora <span style="color:${accent};">Freelancer</span>
      </div>
      <div style="font-size:8pt;letter-spacing:.2em;text-transform:uppercase;color:#888;margin-top:3px;">
        ${isHourly ? 'Precificação por Hora' : 'Precificação de Projeto'}
      </div>
    </div>
    <div style="text-align:right;font-size:9pt;color:#888;line-height:1.7;">
      <div>Gerado em ${today}</div>
    </div>
  </div>

  <div style="border:1.5px solid ${accent};border-radius:10px;padding:16px 20px;margin-bottom:18px;background:#f0f9ff;">
    <div style="font-size:8pt;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:${accent};margin-bottom:6px;">● ${mainLabel}</div>
    <div class="mono" style="font-size:34pt;font-weight:900;color:${accent};line-height:1;margin-bottom:4px;">${fmt(mainValue)}${mainSuffix ? `<span style="font-size:18pt;font-weight:500;color:#555;"> ${mainSuffix}</span>` : ''}</div>
    ${isHourly ? `<div style="font-size:10pt;color:#555;">Rendimento desejado: <strong class="mono">${fmt(d.monthlyIncome)}/mês</strong> · <strong class="mono">${d.annualHours}h</strong> faturáveis/ano</div>` : `<div style="font-size:10pt;color:#555;">Taxa: <strong class="mono">${fmt(d.projectRate)}/h</strong> · <strong class="mono">${d.totalProjectHours}h</strong> no projeto</div>`}
  </div>

  <div class="section-label">Detalhes</div>
  ${statsHtml}

  <div class="section-label">Memória de Cálculo</div>
  <table style="margin-bottom:20px;">
    <thead>
      <tr>
        <th style="width:65%;">Parâmetro</th>
        <th class="tr" style="width:35%;">Valor</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr style="background:#f7f8fc;">
        <td style="font-weight:700;font-size:11pt;border-bottom:none;">${isHourly ? 'Anual ÷ Horas/ano' : 'Horas × Valor/hora'}</td>
        <td class="tr mono" style="font-weight:900;font-size:13pt;color:${accent};border-bottom:none;">${fmt(mainValue)}${isHourly ? '/h' : ''}</td>
      </tr>
    </tbody>
  </table>

  <div style="border-top:1px solid #e0e0ec;padding-top:8px;display:flex;justify-content:space-between;margin-top:8px;">
    <span style="font-size:8pt;color:#aaa;">Estimativa gerada pela calculadora. Não inclui impostos, benefícios ou custos operacionais do freelancer.</span>
    <span style="font-size:8pt;color:#aaa;">calculadorapj.otaviorafael.com.br</span>
  </div>

</body>
</html>`;
}

const FreelancerCalculator: React.FC<Props> = ({ freelancerColor, isDark, consentAccepted }) => {
  const [tab, setTab] = useState<'hourly' | 'project'>('hourly');

  const [monthlyIncome, setMonthlyIncome]   = useState(5000);
  const [hoursPerDay, setHoursPerDay]       = useState(8);
  const [daysPerWeek, setDaysPerWeek]       = useState(5);
  const [vacationWeeks, setVacationWeeks]   = useState(4);

  const [projectRate, setProjectRate]               = useState(0);
  const [projectHoursPerDay, setProjectHoursPerDay] = useState(8);
  const [projectDays, setProjectDays]               = useState(30);

  const workingWeeks   = Math.max(52 - vacationWeeks, 1);
  const annualHours    = hoursPerDay * daysPerWeek * workingWeeks;
  const hourlyRate     = annualHours > 0 ? (monthlyIncome * 12) / annualHours : 0;
  const monthlyHours   = Math.round(annualHours / 12);

  const totalProjectHours = projectHoursPerDay * projectDays;
  const projectValue      = projectRate * totalProjectHours;

  const dimBg              = isDark ? `${freelancerColor}14` : `${freelancerColor}10`;
  const calcHourlyRounded  = Math.round(hourlyRate * 100) / 100;

  const handlePrint = () => {
    const html = buildFreelancerPdfHtml({
      tab,
      accent: freelancerColor,
      monthlyIncome,
      hoursPerDay,
      daysPerWeek,
      vacationWeeks,
      workingWeeks,
      annualHours,
      monthlyHours,
      hourlyRate,
      projectRate,
      projectHoursPerDay,
      projectDays,
      totalProjectHours,
      projectValue,
    });
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  const handleTabChange = (newTab: 'hourly' | 'project') => {
    if (newTab === 'project' && projectRate === 0 && hourlyRate > 0) {
      setProjectRate(calcHourlyRounded);
    }
    setTab(newTab);
  };

  const trustBadges = (badges: Array<{ icon: React.ReactNode; color: string; title: string; desc: string }>) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {badges.map((item, i) => (
        <div key={i} className="rounded-xl p-4" style={{ background: v('surface'), border: `1px solid ${v('border')}` }}>
          <div className="flex items-center gap-2 mb-2">
            <span style={{ color: item.color }}>{item.icon}</span>
            <p className="text-[11px] font-bold" style={{ color: item.color, fontFamily: 'Roboto, sans-serif' }}>{item.title}</p>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: v('t2'), fontFamily: 'Roboto, sans-serif' }}>{item.desc}</p>
        </div>
      ))}
    </div>
  );

  const tagEl = (label: string) => (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md" style={{ color: freelancerColor, background: dimBg, fontFamily: 'Roboto, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: freelancerColor }} />
      {label}
    </span>
  );

  const bigNumber = (value: number, suffix?: string) => (
    <div className="flex items-baseline gap-3">
      <p className="font-black leading-none" style={{ fontFamily: "'Roboto Mono', monospace", fontSize: 'clamp(2.6rem, 5.5vw, 4rem)', color: freelancerColor, textShadow: isDark ? `0 0 80px ${freelancerColor}50` : 'none' }}>
        {fmt(value)}
      </p>
      {suffix && <span className="font-bold" style={{ color: v('t3'), fontFamily: "'Roboto Mono', monospace", fontSize: '1.3rem' }}>{suffix}</span>}
    </div>
  );

  const resultCard = (tagLabel: string, subtitle: string, value: number, suffix?: string) => (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${freelancerColor}30`, background: v('surface') }}>
      <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${freelancerColor}, transparent)` }} />
      <div className="px-7 py-6">
        <div className="flex items-center justify-between mb-4">
          {tagEl(tagLabel)}
          <span className="text-[11px]" style={{ color: v('t3'), fontFamily: 'Roboto, sans-serif' }}>{subtitle}</span>
        </div>
        {bigNumber(value, suffix)}
      </div>
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${freelancerColor}50, transparent)` }} />
    </div>
  );

  const breakdownCard = (rows: string[][], formula: string, result: string) => (
    <div className="rounded-2xl overflow-hidden" style={{ background: v('surface'), border: `1px solid ${v('border')}` }}>
      <div className="px-6 py-4 border-b" style={{ borderColor: v('border') }}>
        <span className="text-[11px] font-bold tracking-[0.18em] uppercase" style={{ color: v('t2'), fontFamily: 'Roboto, sans-serif' }}>Memória de Cálculo</span>
      </div>
      <div className="px-6 py-5 space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between items-center py-1">
            <span className="text-[12px]" style={{ color: v('t2'), fontFamily: 'Roboto, sans-serif' }}>{label}</span>
            <span className="text-[12px] font-semibold" style={{ color: v('t1'), fontFamily: "'Roboto Mono', monospace" }}>{value}</span>
          </div>
        ))}
        <div className="pt-3 mt-1 border-t flex justify-between items-center" style={{ borderColor: v('border') }}>
          <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: v('t1'), fontFamily: 'Roboto, sans-serif' }}>{formula}</span>
          <span className="font-bold" style={{ color: freelancerColor, fontFamily: "'Roboto Mono', monospace", fontSize: '1.2rem' }}>{result}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-in">
      {/* Tab bar */}
      <div className="px-5 sm:px-7 pt-6">
        <div className="inline-flex gap-1 p-1 rounded-xl" style={{ background: v('surface2'), border: `1px solid ${v('border')}` }}>
          {([
            { key: 'hourly'   as const, label: 'Valor/Hora' },
            { key: 'project'  as const, label: 'Valor do Projeto' },
          ]).map(item => (
            <button
              key={item.key}
              onClick={() => handleTabChange(item.key)}
              className="px-4 py-2 rounded-lg text-[11px] font-bold tracking-wide transition-all"
              style={{
                background: tab === item.key ? freelancerColor : 'transparent',
                color: tab === item.key ? (isDark ? '#0C0E14' : '#fff') : v('t2'),
                fontFamily: 'Roboto, sans-serif',
                letterSpacing: '0.06em',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr]">
        {/* Inputs */}
        <div
          className="lg:sticky lg:top-[72px] lg:h-[calc(100vh-72px)] lg:overflow-y-auto px-5 sm:px-7 py-8 border-b lg:border-b-0 lg:border-r"
          style={{ borderColor: v('border') }}
        >
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full" style={{ background: freelancerColor }} />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: freelancerColor, fontFamily: 'Roboto, sans-serif' }}>
              {tab === 'hourly' ? 'Calculadora de Valor/Hora' : 'Calculadora de Valor de Projeto'}
            </span>
          </div>

          {tab === 'hourly' ? (
            <div className="space-y-6">
              <MoneyField label="Rendimento mensal desejado" value={monthlyIncome} onChange={setMonthlyIncome} hint="O quanto você quer receber por mês" />
              <NumField label="Horas de trabalho por dia" value={hoursPerDay} onChange={setHoursPerDay} min={1} max={24} suffix="h" />
              <NumField label="Dias de trabalho por semana" value={daysPerWeek} onChange={setDaysPerWeek} min={1} max={7} suffix="dias" />
              <NumField label="Semanas de férias por ano" value={vacationWeeks} onChange={setVacationWeeks} min={0} max={12} suffix="sem." hint="Semanas sem projetos faturáveis" />
            </div>
          ) : (
            <div className="space-y-6">
              <MoneyField label="Valor da hora" value={projectRate} onChange={setProjectRate} hint="Use a aba Valor/Hora ou defina manualmente" />
              {hourlyRate > 0 && Math.abs(projectRate - calcHourlyRounded) > 0.01 && (
                <button
                  onClick={() => setProjectRate(calcHourlyRounded)}
                  className="w-full text-left text-[11px] font-bold px-3 py-2.5 rounded-lg"
                  style={{ background: dimBg, color: freelancerColor, border: `1px solid ${freelancerColor}30`, fontFamily: 'Roboto, sans-serif' }}
                >
                  ↑ Usar valor calculado: {fmt(hourlyRate)}/h
                </button>
              )}
              <NumField label="Horas por dia no projeto" value={projectHoursPerDay} onChange={setProjectHoursPerDay} min={1} max={24} suffix="h/dia" />
              <NumField label="Duração do projeto" value={projectDays} onChange={setProjectDays} min={1} max={365} suffix="dias" />
            </div>
          )}

          <div className="mt-8"><AdUnit slot="9217882912" consentAccepted={consentAccepted} /></div>
        </div>

        {/* Results */}
        <div className="px-6 lg:px-10 py-8 space-y-5">
          <div className="flex justify-end">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold tracking-wide transition-all"
              style={{
                background: dimBg,
                color: freelancerColor,
                border: `1px solid ${freelancerColor}40`,
                fontFamily: 'Roboto, sans-serif',
                letterSpacing: '0.08em',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = `${freelancerColor}22`;
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = dimBg;
                (e.currentTarget as HTMLButtonElement).style.transform = 'none';
              }}
            >
              <FileDown className="w-3.5 h-3.5" />
              Baixar PDF
            </button>
          </div>

          {tab === 'hourly' ? (
            <>
              {resultCard('Valor por Hora', 'cobrar por hora', hourlyRate, '/hora')}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Horas faturáveis/ano', value: `${annualHours}h`, sub: `${hoursPerDay}h × ${daysPerWeek}d × ${workingWeeks}sem`, color: freelancerColor },
                  { label: 'Horas faturáveis/mês', value: `${monthlyHours}h`, sub: 'média mensal', color: freelancerColor },
                  { label: 'Rendimento anual', value: fmt(monthlyIncome * 12), sub: 'objetivo total', color: v('t2') },
                ].map(card => (
                  <div key={card.label} className="rounded-xl px-4 py-4" style={{ background: v('surface'), border: `1px solid ${v('border')}` }}>
                    <p className="field-label" style={{ marginBottom: 6 }}>{card.label}</p>
                    <p className="font-bold" style={{ color: card.color, fontFamily: "'Roboto Mono', monospace", fontSize: '1.1rem' }}>{card.value}</p>
                    <p className="text-[11px] mt-1" style={{ color: v('t3'), fontFamily: 'Roboto, sans-serif' }}>{card.sub}</p>
                  </div>
                ))}
              </div>

              <AdUnit slot="6312517973" format="auto" consentAccepted={consentAccepted} />

              {breakdownCard(
                [
                  ['Rendimento mensal desejado', fmt(monthlyIncome)],
                  ['Rendimento anual (× 12)', fmt(monthlyIncome * 12)],
                  ['Horas por dia', `${hoursPerDay}h`],
                  ['Dias de trabalho por semana', `${daysPerWeek} dias`],
                  [`Semanas úteis (52 − ${vacationWeeks})`, `${workingWeeks} semanas`],
                  ['Total horas faturáveis/ano', `${annualHours}h`],
                ],
                'Anual ÷ Horas/ano',
                `${fmt(hourlyRate)}/h`,
              )}

              {trustBadges([
                { icon: <TrendingUp className="w-4 h-4" />, color: freelancerColor, title: 'Fórmula Padrão', desc: 'Rendimento anual ÷ horas faturáveis. Metodologia amplamente usada para precificação freelancer.' },
                { icon: <Shield className="w-4 h-4" />, color: freelancerColor, title: 'Férias Incluídas', desc: 'As semanas de férias são descontadas do total anual para refletir a realidade do freelancer.' },
                { icon: <Lock className="w-4 h-4" />, color: '#9B8CFF', title: 'Privacidade Total', desc: 'Tudo local no browser. Nenhum dado enviado a servidores.' },
              ])}
            </>
          ) : (
            <>
              {resultCard('Valor do Projeto', 'valor total a cobrar', projectValue)}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Total de horas', value: `${totalProjectHours}h`, sub: `${projectHoursPerDay}h/dia × ${projectDays}d`, color: freelancerColor },
                  { label: 'Valor/hora aplicado', value: fmt(projectRate), sub: 'por hora trabalhada', color: freelancerColor },
                  { label: 'Duração do projeto', value: `${projectDays} dias`, sub: `≈ ${Math.ceil(projectDays / 7)} semanas`, color: v('t2') },
                ].map(card => (
                  <div key={card.label} className="rounded-xl px-4 py-4" style={{ background: v('surface'), border: `1px solid ${v('border')}` }}>
                    <p className="field-label" style={{ marginBottom: 6 }}>{card.label}</p>
                    <p className="font-bold" style={{ color: card.color, fontFamily: "'Roboto Mono', monospace", fontSize: '1.1rem' }}>{card.value}</p>
                    <p className="text-[11px] mt-1" style={{ color: v('t3'), fontFamily: 'Roboto, sans-serif' }}>{card.sub}</p>
                  </div>
                ))}
              </div>

              <AdUnit slot="6312517973" format="auto" consentAccepted={consentAccepted} />

              {breakdownCard(
                [
                  ['Valor da hora', `${fmt(projectRate)}/h`],
                  ['Horas por dia no projeto', `${projectHoursPerDay}h/dia`],
                  ['Duração do projeto', `${projectDays} dias`],
                  ['Total de horas trabalhadas', `${totalProjectHours}h`],
                ],
                'Horas × Valor/hora',
                fmt(projectValue),
              )}

              {trustBadges([
                { icon: <TrendingUp className="w-4 h-4" />, color: freelancerColor, title: 'Precificação Justa', desc: 'Calcule o valor real do projeto com base no tempo estimado e na sua taxa horária.' },
                { icon: <Shield className="w-4 h-4" />, color: freelancerColor, title: 'Integração', desc: 'Use o valor/hora da aba anterior para uma precificação consistente e profissional.' },
                { icon: <Lock className="w-4 h-4" />, color: '#9B8CFF', title: 'Privacidade Total', desc: 'Tudo local no browser. Nenhum dado enviado a servidores.' },
              ])}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FreelancerCalculator;
