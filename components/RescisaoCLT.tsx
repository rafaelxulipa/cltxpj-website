
import React, { useState, useEffect } from 'react';
import { FileDown, TrendingUp, Shield, Lock } from 'lucide-react';
import AdUnit from './AdUnit';
import { calcularRescisao, RescisaoInputs, RescisaoResult, VerbaItem } from '../services/rescisaoCalculator';
import { TipoRescisao, ModoAvisoPrevio, LABELS_TIPO } from '../services/rescisaoRules';

interface Props {
  consentAccepted: boolean;
  pjColor: string;
  cltColor: string;
  negColor: string;
  isDark: boolean;
  year: number;
}

const v = (name: string) => `var(--${name})`;
const fmt = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
const fmtShort = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

const Divider = () => (
  <div className="my-7 h-px w-full" style={{ background: v('border') }} />
);

// ── Local input components ────────────────────────────────────────────────────

const MoneyField: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}> = ({ label, value, onChange, hint }) => {
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
          className="field-input flex-1 clt-focus"
        />
      </div>
      {hint && (
        <p className="mt-1.5 text-[10px] leading-relaxed" style={{ color: v('t3'), fontFamily: 'Roboto, sans-serif' }}>
          {hint}
        </p>
      )}
    </div>
  );
};

const toDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const DateField: React.FC<{
  label: string;
  value: Date;
  onChange: (d: Date) => void;
}> = ({ label, value, onChange }) => {
  const [local, setLocal] = useState(toDateStr(value));
  const [focused, setFocused] = useState(false);

  // Sincroniza valor externo quando não está em foco
  useEffect(() => {
    if (!focused) setLocal(toDateStr(value));
  }, [value, focused]);

  return (
    <div>
      <label className="field-label">{label}</label>
      <input
        type="date"
        value={local}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          // Se saiu com valor inválido, restaura o valor atual
          if (!local || local.length < 10) setLocal(toDateStr(value));
        }}
        onChange={e => {
          setLocal(e.target.value);
          if (e.target.value.length === 10) {
            const [y, m, d] = e.target.value.split('-').map(Number);
            if (y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
              onChange(new Date(y, m - 1, d));
            }
          }
        }}
        className="field-input w-full clt-focus"
        style={{ colorScheme: 'dark' }}
      />
    </div>
  );
};

const SelectField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  hint?: string;
}> = ({ label, value, onChange, options, hint }) => (
  <div>
    <label className="field-label">{label}</label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="field-input w-full clt-focus"
      style={{ background: v('surface'), color: v('t1') }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    {hint && (
      <p className="mt-1.5 text-[10px] leading-relaxed" style={{ color: v('t3'), fontFamily: 'Roboto, sans-serif' }}>
        {hint}
      </p>
    )}
  </div>
);

const NumberField: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  hint?: string;
}> = ({ label, value, onChange, min = 0, max = 100, hint }) => (
  <div>
    <label className="field-label">{label}</label>
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={e => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || 0)))}
      className="field-input w-full clt-focus"
    />
    {hint && (
      <p className="mt-1.5 text-[10px] leading-relaxed" style={{ color: v('t3'), fontFamily: 'Roboto, sans-serif' }}>
        {hint}
      </p>
    )}
  </div>
);

const CheckboxField: React.FC<{
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}> = ({ label, checked, onChange, hint }) => (
  <div>
    <label
      className="flex items-start gap-3 cursor-pointer"
      style={{ fontFamily: 'Roboto, sans-serif' }}
    >
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          border: `2px solid ${checked ? 'var(--clt)' : 'var(--border)'}`,
          background: checked ? 'var(--clt)' : 'transparent',
          flexShrink: 0,
          marginTop: 2,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
        }}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <div>
        <span className="text-sm" style={{ color: v('t1') }}>{label}</span>
        {hint && (
          <p className="mt-1 text-[10px] leading-relaxed" style={{ color: v('t3') }}>
            {hint}
          </p>
        )}
      </div>
    </label>
  </div>
);

// ── PDF generation ────────────────────────────────────────────────────────────

function buildRescisaoPdfHtml(result: RescisaoResult, inputs: RescisaoInputs, year: number): string {
  const today = new Date().toLocaleDateString('pt-BR');
  const tipoLabel = LABELS_TIPO[inputs.tipo];
  const periodo = result.periodoTrabalhado;
  const accent = '#1D60C8';

  const rows = result.verbas.map(v => `
    <tr>
      <td>${v.descricao}</td>
      <td style="color:#555;font-size:9pt;">${v.baseCalculo}</td>
      <td class="tr mono" style="color:${v.valorBruto < 0 ? '#DC2626' : '#111'};">${fmt(v.valorBruto)}</td>
      <td class="tr mono" style="color:${v.inss < 0 ? '#DC2626' : '#888'};">${v.inss !== 0 ? fmt(v.inss) : '—'}</td>
      <td class="tr mono" style="color:${v.irrf < 0 ? '#DC2626' : '#888'};">${v.irrf !== 0 ? fmt(v.irrf) : '—'}</td>
      <td class="tr mono" style="font-weight:700;color:${v.valorLiquido < 0 ? '#DC2626' : '#111'};">${fmt(v.valorLiquido)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Rescisão CLT — ${today}</title>
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
    .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .card { border: 1px solid #e0e0ec; border-radius: 8px; padding: 14px; }
    .lbl { font-size: 8pt; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; color: #888; margin-bottom: 7px; }
    .kv { display: flex; justify-content: space-between; margin-bottom: 3px; }
    .kv span:first-child { color: #555; font-size: 9.5pt; }
    .kv span:last-child { font-family: 'Roboto Mono', monospace; font-weight: 700; }
  </style>
</head>
<body>

  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;border-bottom:2px solid #111;padding-bottom:12px;">
    <div>
      <div style="font-size:22pt;font-weight:900;letter-spacing:-.02em;">
        Rescisão <span style="color:${accent};">CLT</span>
      </div>
      <div style="font-size:8pt;letter-spacing:.2em;text-transform:uppercase;color:#888;margin-top:3px;">
        Demonstrativo de Verbas Rescisórias
      </div>
    </div>
    <div style="text-align:right;font-size:9pt;color:#888;line-height:1.7;">
      <div>Gerado em ${today}</div>
      <div>Tabelas ${year} · CLT Art. 477</div>
    </div>
  </div>

  <div style="font-size:8pt;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#aaa;margin-bottom:9px;">Dados da Rescisão</div>
  <div class="g2" style="margin-bottom:18px;">
    <div class="card">
      <div class="lbl" style="color:${accent};">● Dados do Contrato</div>
      <div class="kv"><span>Tipo de Rescisão</span><span style="color:${accent};">${tipoLabel}</span></div>
      <div class="kv"><span>Período Trabalhado</span><span>${periodo.anos}a ${periodo.meses}m ${periodo.dias}d</span></div>
      <div class="kv"><span>Admissão</span><span>${inputs.admissao.toLocaleDateString('pt-BR')}</span></div>
      <div class="kv"><span>Desligamento</span><span>${inputs.desligamento.toLocaleDateString('pt-BR')}</span></div>
    </div>
    <div class="card">
      <div class="lbl" style="color:${accent};">● Remuneração</div>
      <div class="kv"><span>Salário Bruto</span><span>${fmt(inputs.salario)}</span></div>
      ${inputs.mediaVariavel > 0 ? `<div class="kv"><span>Média Variável</span><span>${fmt(inputs.mediaVariavel)}</span></div>` : ''}
      <div class="kv"><span>Base de Cálculo</span><span style="color:${accent};">${fmt(result.salarioBase)}</span></div>
      <div class="kv"><span>Aviso Prévio</span><span>${result.avisoPrevioDias} dias</span></div>
    </div>
  </div>

  <div style="border:1.5px solid ${accent};border-radius:10px;padding:16px 20px;margin-bottom:18px;background:#eff6ff;">
    <div style="font-size:8pt;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:${accent};margin-bottom:6px;">● Total Líquido a Receber</div>
    <div class="mono" style="font-size:30pt;font-weight:900;color:${accent};line-height:1;margin-bottom:6px;">${fmtShort(result.totalLiquido)}</div>
    <div style="display:flex;gap:24px;font-size:10pt;color:#555;">
      <span>Bruto: <strong class="mono">${fmt(result.totalBruto)}</strong></span>
      <span>INSS: <strong class="mono" style="color:#DC2626;">${fmt(result.totalINSS)}</strong></span>
      <span>IRRF: <strong class="mono" style="color:#DC2626;">${fmt(result.totalIRRF)}</strong></span>
    </div>
  </div>

  <div style="font-size:8pt;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#aaa;margin-bottom:8px;">Demonstrativo Detalhado de Verbas</div>
  <table style="margin-bottom:18px;">
    <thead>
      <tr>
        <th style="width:25%;">Verba</th>
        <th style="width:22%;">Base de Cálculo</th>
        <th class="tr" style="width:13%;">Bruto</th>
        <th class="tr" style="width:13%;color:#DC2626;">INSS</th>
        <th class="tr" style="width:13%;color:#DC2626;">IRRF</th>
        <th class="tr" style="width:14%;color:${accent};">Líquido</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr style="background:#f7f8fc;">
        <td colspan="2" style="font-weight:700;font-size:11pt;text-transform:uppercase;letter-spacing:.05em;border-bottom:none;">Total</td>
        <td class="tr mono" style="font-weight:700;border-bottom:none;">${fmt(result.totalBruto)}</td>
        <td class="tr mono" style="font-weight:700;color:#DC2626;border-bottom:none;">${fmt(result.totalINSS)}</td>
        <td class="tr mono" style="font-weight:700;color:#DC2626;border-bottom:none;">${fmt(result.totalIRRF)}</td>
        <td class="tr mono" style="font-weight:900;font-size:13pt;color:${accent};border-bottom:none;">${fmt(result.totalLiquido)}</td>
      </tr>
    </tbody>
  </table>

  ${(result.saqueFGTS > 0 || result.seguroDesemprego) ? `
  <div style="font-size:8pt;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#aaa;margin-bottom:8px;">Outros Direitos</div>
  <div class="g2" style="margin-bottom:18px;">
    ${result.saqueFGTS > 0 ? `<div class="card"><div class="lbl">Saque FGTS</div><div class="mono" style="font-size:16pt;font-weight:900;color:${accent};">${fmt(result.saqueFGTS)}</div><div style="font-size:9pt;color:#888;margin-top:3px;">Isento de IR · não incluso no líquido acima</div></div>` : '<div></div>'}
    ${result.seguroDesemprego ? `<div class="card"><div class="lbl">Seguro-Desemprego</div><div style="font-size:13pt;font-weight:700;color:${accent};">Tem direito</div><div style="font-size:9pt;color:#888;margin-top:3px;">Solicitar no Ministério do Trabalho</div></div>` : '<div></div>'}
  </div>
  ` : ''}

  <div style="border-top:1px solid #e0e0ec;padding-top:8px;display:flex;justify-content:space-between;margin-top:8px;">
    <span style="font-size:8pt;color:#aaa;">Estimativa com base nas tabelas ${year}. Férias isentas de IRRF (Lei 7.713/88, art. 6, V). Não substitui orientação jurídica ou contábil profissional.</span>
    <span style="font-size:8pt;color:#aaa;">calculadorapj.otaviorafael.com.br</span>
  </div>

</body>
</html>`;
}

// ── Main component ────────────────────────────────────────────────────────────

const RescisaoCLT: React.FC<Props> = ({ consentAccepted, cltColor, negColor, isDark, year }) => {
  const [inputs, setInputs] = useState<RescisaoInputs>({
    salario: 5000,
    admissao: new Date(new Date().getFullYear() - 2, 0, 1),
    desligamento: new Date(),
    tipo: 'sem_justa_causa',
    modoAvisoPrevio: 'indenizado',
    saldoFGTS: 0,
    mediaVariavel: 0,
    feriasVencidasPendentes: false,
    dependentes: 0,
  });
  const [result, setResult] = useState<RescisaoResult | null>(null);
  const [calculando, setCalculando] = useState(false);

  const accentDim = isDark ? 'rgba(92,160,255,0.1)' : 'rgba(29,96,200,0.08)';

  const tipoOptions = (Object.keys(LABELS_TIPO) as TipoRescisao[]).map(k => ({
    value: k,
    label: LABELS_TIPO[k],
  }));

  const modoAPHint: Record<ModoAvisoPrevio, string> = {
    indenizado: inputs.tipo === 'pedido_demissao'
      ? 'Você não cumpriu o aviso — será descontado do seu acerto.'
      : 'Empregador paga os dias de aviso sem você trabalhar.',
    trabalhado: 'Você trabalhou o período do aviso — sem verba adicional na rescisão.',
    dispensado: 'Empregador dispensou o aviso — sem verba adicional na rescisão.',
  };

  const handleCalcular = () => {
    setCalculando(true);
    setTimeout(() => {
      setResult(calcularRescisao(inputs));
      setCalculando(false);
    }, 300);
  };

  const handlePrint = () => {
    if (!result) return;
    const html = buildRescisaoPdfHtml(result, inputs, year);
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  const upd = (partial: Partial<RescisaoInputs>) => setInputs(prev => ({ ...prev, ...partial }));

  return (
    <div className="page-in grid grid-cols-1 lg:grid-cols-[400px_1fr]">

      {/* ─── Inputs ──────────────────────────────────────────────────────── */}
      <div
        className="lg:sticky lg:top-[72px] lg:h-[calc(100vh-72px)] lg:flex lg:flex-col border-b lg:border-b-0 lg:border-r"
        style={{ borderColor: v('border') }}
      >
        {/* área rolável */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 pt-8 pb-4">

        <div className="flex items-center gap-2 mb-6">
          <span className="w-2 h-2 rounded-full" style={{ background: cltColor }} />
          <span
            className="text-[10px] font-bold tracking-[0.2em] uppercase"
            style={{ color: cltColor, fontFamily: 'Roboto, sans-serif' }}
          >
            Dados da Rescisão
          </span>
        </div>

        <div className="space-y-6">
          <MoneyField
            label="Salário Bruto Mensal"
            value={inputs.salario}
            onChange={salario => upd({ salario })}
          />
          <DateField
            label="Data de Admissão"
            value={inputs.admissao}
            onChange={admissao => upd({ admissao })}
          />
          <DateField
            label="Data de Desligamento"
            value={inputs.desligamento}
            onChange={desligamento => upd({ desligamento })}
          />
          <SelectField
            label="Tipo de Rescisão"
            value={inputs.tipo}
            onChange={v => upd({ tipo: v as TipoRescisao })}
            options={tipoOptions}
          />
          <SelectField
            label="Aviso Prévio"
            value={inputs.modoAvisoPrevio}
            onChange={v => upd({ modoAvisoPrevio: v as ModoAvisoPrevio })}
            options={[
              { value: 'indenizado', label: 'Indenizado' },
              { value: 'trabalhado', label: 'Trabalhado' },
              { value: 'dispensado', label: 'Dispensado pelo empregador' },
            ]}
            hint={modoAPHint[inputs.modoAvisoPrevio]}
          />
        </div>

        <Divider />

        <div className="flex items-center gap-2 mb-6">
          <span className="w-2 h-2 rounded-full" style={{ background: v('t3') }} />
          <span
            className="text-[10px] font-bold tracking-[0.2em] uppercase"
            style={{ color: v('t3'), fontFamily: 'Roboto, sans-serif' }}
          >
            Dados Opcionais
          </span>
        </div>

        <div className="space-y-6">
          <MoneyField
            label="Saldo FGTS"
            value={inputs.saldoFGTS}
            onChange={saldoFGTS => upd({ saldoFGTS })}
            hint="Informe o saldo atual da sua conta FGTS para cálculo da multa"
          />
          <MoneyField
            label="Média Variável"
            value={inputs.mediaVariavel}
            onChange={mediaVariavel => upd({ mediaVariavel })}
            hint="Média mensal de comissões ou horas extras dos últimos 12 meses"
          />
          <CheckboxField
            label="Férias vencidas pendentes"
            checked={inputs.feriasVencidasPendentes}
            onChange={feriasVencidasPendentes => upd({ feriasVencidasPendentes })}
            hint="Período aquisitivo completo não gozado"
          />
          <NumberField
            label="Dependentes para IRRF"
            value={inputs.dependentes}
            onChange={dependentes => upd({ dependentes })}
            min={0}
            max={10}
          />
        </div>

          <div className="mt-6">
            <AdUnit slot="9217882912" consentAccepted={consentAccepted} />
          </div>

        </div>{/* fim área rolável */}

        {/* botão fixo no rodapé do painel */}
        <div
          className="px-5 sm:px-7 py-4 border-t"
          style={{
            borderColor: v('border'),
            background: v('surface'),
          }}
        >
          <button
            onClick={handleCalcular}
            disabled={calculando}
            className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all"
            style={{
              background: cltColor,
              color: isDark ? '#0C0E14' : '#fff',
              fontFamily: 'Roboto, sans-serif',
              letterSpacing: '0.06em',
              opacity: calculando ? 0.7 : 1,
            }}
          >
            {calculando ? 'Calculando...' : 'Calcular Rescisão'}
          </button>
        </div>
      </div>

      {/* ─── Results ─────────────────────────────────────────────────────── */}
      <div className="px-6 lg:px-10 py-8 space-y-5">

        {!result ? (
          <div
            className="rounded-2xl flex flex-col items-center justify-center py-24"
            style={{ background: v('surface'), border: `1px solid ${v('border')}` }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: accentDim }}
            >
              <span style={{ color: cltColor, fontSize: 28 }}>⊖</span>
            </div>
            <p className="text-lg font-bold mb-2" style={{ color: v('t1'), fontFamily: 'Roboto, sans-serif' }}>
              Calcule sua rescisão
            </p>
            <p className="text-sm text-center max-w-xs" style={{ color: v('t2'), fontFamily: 'Roboto, sans-serif' }}>
              Preencha os dados e clique em Calcular para ver o demonstrativo completo das suas verbas rescisórias.
            </p>
          </div>
        ) : (
          <>
            {/* Verdict card */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: `1px solid ${cltColor}30`, background: v('surface') }}
            >
              <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${cltColor}, transparent)` }} />
              <div className="px-7 py-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-[0.15em] uppercase"
                    style={{ color: cltColor, background: accentDim, fontFamily: 'Roboto, sans-serif' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: cltColor }} />
                    Rescisão — {LABELS_TIPO[inputs.tipo]}
                  </span>
                  <span className="text-[11px]" style={{ color: v('t3'), fontFamily: 'Roboto, sans-serif' }}>
                    {result.periodoTrabalhado.anos}a {result.periodoTrabalhado.meses}m {result.periodoTrabalhado.dias}d trabalhados
                  </span>
                </div>

                <p
                  className="num-flash font-black leading-none"
                  style={{
                    fontFamily: "'Roboto Mono', monospace",
                    fontSize: 'clamp(2.6rem, 5.5vw, 4rem)',
                    color: cltColor,
                    textShadow: isDark ? `0 0 80px ${cltColor}50` : 'none',
                  }}
                >
                  {fmtShort(result.totalLiquido)}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-y-3 mt-3">
                  <div className="flex flex-wrap gap-x-5 gap-y-1">
                    <span style={{ fontFamily: 'Roboto, sans-serif', color: v('t2'), fontSize: 13 }}>
                      Bruto:{' '}
                      <span style={{ color: v('t1'), fontFamily: "'Roboto Mono', monospace", fontWeight: 700 }}>
                        {fmt(result.totalBruto)}
                      </span>
                    </span>
                    {result.totalINSS < 0 && (
                      <span style={{ fontFamily: 'Roboto, sans-serif', color: v('t2'), fontSize: 13 }}>
                        INSS:{' '}
                        <span style={{ color: negColor, fontFamily: "'Roboto Mono', monospace", fontWeight: 700 }}>
                          {fmt(result.totalINSS)}
                        </span>
                      </span>
                    )}
                    {result.totalIRRF < 0 && (
                      <span style={{ fontFamily: 'Roboto, sans-serif', color: v('t2'), fontSize: 13 }}>
                        IRRF:{' '}
                        <span style={{ color: negColor, fontFamily: "'Roboto Mono', monospace", fontWeight: 700 }}>
                          {fmt(result.totalIRRF)}
                        </span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold tracking-wide transition-all"
                    style={{
                      background: accentDim,
                      color: cltColor,
                      border: `1px solid ${cltColor}40`,
                      fontFamily: 'Roboto, sans-serif',
                      letterSpacing: '0.08em',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = `${cltColor}22`;
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

                {(result.saqueFGTS > 0 || result.seguroDesemprego) && (
                  <div className="flex flex-wrap gap-4 mt-4 pt-4" style={{ borderTop: `1px solid ${v('border')}` }}>
                    {result.saqueFGTS > 0 && (
                      <span style={{ fontFamily: 'Roboto, sans-serif', color: v('t2'), fontSize: 13 }}>
                        FGTS a sacar:{' '}
                        <span style={{ color: cltColor, fontFamily: "'Roboto Mono', monospace", fontWeight: 700 }}>
                          {fmt(result.saqueFGTS)}
                        </span>
                        <span className="ml-1 text-[10px]" style={{ color: v('t3') }}>(isento de IR)</span>
                      </span>
                    )}
                    {result.seguroDesemprego && (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-[0.12em] uppercase"
                        style={{ color: cltColor, background: accentDim, fontFamily: 'Roboto, sans-serif' }}
                      >
                        ✓ Seguro-Desemprego
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${cltColor}50, transparent)` }} />
            </div>

            {/* Mini cards */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Bruto', value: result.totalBruto, color: v('t1') },
                { label: 'INSS Total', value: result.totalINSS, color: negColor },
                { label: 'IRRF Total', value: result.totalIRRF, color: negColor },
              ].map(card => (
                <div
                  key={card.label}
                  className="rounded-xl px-3 sm:px-4 py-4"
                  style={{ background: v('surface'), border: `1px solid ${v('border')}` }}
                >
                  <p className="field-label" style={{ marginBottom: 6 }}>{card.label}</p>
                  <p
                    className="font-bold truncate"
                    style={{ color: card.color, fontFamily: "'Roboto Mono', monospace", fontSize: 'clamp(0.8rem, 2.5vw, 1.1rem)' }}
                  >
                    {fmt(card.value)}
                  </p>
                </div>
              ))}
            </div>

            <AdUnit slot="6312517973" format="auto" consentAccepted={consentAccepted} />

            {/* Verbas table */}
            <div className="rounded-2xl overflow-hidden" style={{ background: v('surface'), border: `1px solid ${v('border')}` }}>
              <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: v('border') }}>
                <span className="text-[11px] font-bold tracking-[0.18em] uppercase" style={{ color: v('t2'), fontFamily: 'Roboto, sans-serif' }}>
                  Demonstrativo de Verbas Rescisórias {year}
                </span>
                <span className="text-[10px] font-bold tracking-wider" style={{ color: cltColor, fontFamily: 'Roboto, sans-serif' }}>
                  ● CLT
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${v('border')}` }}>
                      {['Verba', 'Base de Cálculo', 'Bruto', 'INSS', 'IRRF', 'Líquido'].map((h, i) => (
                        <th
                          key={h}
                          className={`px-2 sm:px-4 py-3 text-[10px] font-bold tracking-[0.15em] uppercase ${i === 0 || i === 1 ? 'text-left' : 'text-right'}`}
                          style={{
                            color: i === 0 || i === 1 ? v('t3') : i >= 2 && i <= 4 ? v('t3') : cltColor,
                            fontFamily: 'Roboto, sans-serif',
                            borderBottomColor: v('border'),
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.verbas.map((verba: VerbaItem) => (
                      <tr key={verba.id} style={{ borderBottomColor: v('border') }}>
                        <td
                          className="py-3.5 px-2 sm:px-4 text-left text-[12px] border-b"
                          style={{ color: v('t1'), fontFamily: 'Roboto, sans-serif', borderBottomColor: v('border') }}
                        >
                          {verba.descricao}
                        </td>
                        <td
                          className="py-3.5 px-2 sm:px-4 text-left text-[11px] border-b"
                          style={{ color: v('t3'), fontFamily: 'Roboto, sans-serif', borderBottomColor: v('border') }}
                        >
                          {verba.baseCalculo}
                        </td>
                        {[verba.valorBruto, verba.inss, verba.irrf, verba.valorLiquido].map((val, vi) => (
                          <td
                            key={vi}
                            className="py-3.5 px-2 sm:px-4 text-right text-[12px] border-b whitespace-nowrap"
                            style={{
                              fontFamily: "'Roboto Mono', monospace",
                              fontWeight: vi === 3 ? 700 : 500,
                              color: val < 0 ? negColor : vi === 3 ? cltColor : val === 0 ? v('t3') : v('t1'),
                              borderBottomColor: v('border'),
                            }}
                          >
                            {val === 0 ? <span style={{ color: v('t3') }}>—</span> : fmt(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr style={{ background: v('surface2') }}>
                      <td
                        colSpan={2}
                        className="py-5 px-2 sm:px-4 text-left text-[11px] border-b font-bold uppercase tracking-wider"
                        style={{ color: v('t1'), fontFamily: 'Roboto, sans-serif', borderBottomColor: v('border'), letterSpacing: '0.06em' }}
                      >
                        Total
                      </td>
                      {[result.totalBruto, result.totalINSS, result.totalIRRF, result.totalLiquido].map((val, vi) => (
                        <td
                          key={vi}
                          className="py-5 px-2 sm:px-4 text-right border-b whitespace-nowrap"
                          style={{
                            fontFamily: "'Roboto Mono', monospace",
                            fontWeight: 700,
                            fontSize: vi === 3 ? 15 : 13,
                            color: val < 0 ? negColor : vi === 3 ? cltColor : v('t1'),
                            borderBottomColor: v('border'),
                          }}
                        >
                          {fmt(val)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-3 border-t text-[10px] leading-relaxed" style={{ borderColor: v('border'), color: v('t3'), fontFamily: 'Roboto, sans-serif' }}>
                Férias vencidas e proporcionais isentas de IRRF (Lei 7.713/88, art. 6, V) · Multa FGTS isenta de IR · Aviso indenizado não tem incidência de INSS
              </div>
            </div>

            {/* Outros Direitos */}
            <div className="rounded-2xl p-6" style={{ background: v('surface'), border: `1px solid ${v('border')}` }}>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-5" style={{ color: v('t2'), fontFamily: 'Roboto, sans-serif' }}>
                Outros Direitos
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <p className="field-label">Saque FGTS</p>
                  <p className="text-xl font-bold" style={{ color: cltColor, fontFamily: "'Roboto Mono', monospace" }}>
                    {result.saqueFGTS > 0 ? fmt(result.saqueFGTS) : <span style={{ color: v('t3'), fontSize: 14 }}>Não tem direito</span>}
                  </p>
                  {result.saqueFGTS > 0 && (
                    <p className="text-[11px] mt-1" style={{ color: v('t3'), fontFamily: 'Roboto, sans-serif' }}>
                      {Math.round(REGRAS_SAQUE[inputs.tipo] * 100)}% do saldo · isento de IR
                    </p>
                  )}
                </div>
                <div>
                  <p className="field-label">Seguro-Desemprego</p>
                  <p className="text-base font-bold" style={{ color: result.seguroDesemprego ? cltColor : v('t3'), fontFamily: 'Roboto, sans-serif' }}>
                    {result.seguroDesemprego ? '✓ Tem direito' : '✗ Não tem direito'}
                  </p>
                  {result.seguroDesemprego && (
                    <p className="text-[11px] mt-1" style={{ color: v('t3'), fontFamily: 'Roboto, sans-serif' }}>
                      Solicitar no Ministério do Trabalho
                    </p>
                  )}
                </div>
                <div>
                  <p className="field-label">Aviso Prévio</p>
                  <p className="text-xl font-bold" style={{ color: cltColor, fontFamily: "'Roboto Mono', monospace" }}>
                    {result.avisoPrevioDias} dias
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: v('t3'), fontFamily: 'Roboto, sans-serif' }}>
                    Lei 12.506/2011
                  </p>
                </div>
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: <TrendingUp className="w-4 h-4" />, color: cltColor,   title: `Tabelas ${year}`,   desc: 'INSS progressivo, IRRF com isenção progressiva 2026, aviso prévio Lei 12.506/2011.' },
                { icon: <Shield     className="w-4 h-4" />, color: cltColor,   title: 'CLT Art. 477',      desc: 'Cálculo conforme as regras da Consolidação das Leis do Trabalho.' },
                { icon: <Lock       className="w-4 h-4" />, color: '#9B8CFF',  title: 'Dados Locais',      desc: 'Tudo calculado no seu browser. Nenhum dado enviado a servidores.' },
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

            {/* Disclaimer */}
            <div
              className="rounded-xl p-5 text-[11px] leading-relaxed"
              style={{ background: v('surface'), border: `1px solid ${v('border')}`, color: v('t3'), fontFamily: 'Roboto, sans-serif' }}
            >
              <strong style={{ color: v('t2') }}>Aviso:</strong>{' '}
              Este cálculo é uma estimativa baseada nas tabelas fiscais de {year} e nas regras gerais da CLT. Valores podem variar conforme convenção coletiva, cláusulas contratuais específicas ou decisões judiciais. Não substitui orientação de advogado trabalhista ou contador especializado. Para homologação da rescisão, consulte sempre um profissional habilitado.
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Helper para percentual de saque por tipo (usado no componente)
import { REGRAS as REGRAS_OBJ } from '../services/rescisaoRules';
const REGRAS_SAQUE: Record<TipoRescisao, number> = Object.fromEntries(
  (Object.keys(REGRAS_OBJ) as TipoRescisao[]).map(k => [k, REGRAS_OBJ[k].percentualSaqueFGTS])
) as Record<TipoRescisao, number>;

export default RescisaoCLT;
