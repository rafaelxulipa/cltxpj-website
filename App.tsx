
import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  TrendingUp,
  Briefcase,
  FileText,
  PieChart as PieChartIcon,
  ShieldCheck,
  Building2,
  ArrowLeft,
  ExternalLink,
  Scale,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CltInputs, PjInputs } from './types';
import { calculateFullComparison } from './services/calculator';
import AdUnit from './components/AdUnit';
import ResultCard from './components/ResultCard';
import CurrencyInput from './components/CurrencyInput';

type View = 'calculator' | 'terms' | 'privacy';

const fmt = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const pct = (val: number) => `${(val * 100).toFixed(1)}%`;

// ── Tooltip de ajuda ──────────────────────────────────────────────────────────
const Tip: React.FC<{ text: string }> = ({ text }) => (
  <div className="group relative inline-flex ml-1.5">
    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-xl bg-slate-800 px-3 py-2 text-[11px] font-medium text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 leading-relaxed">
      {text}
    </div>
  </div>
);

// ── Linha de detalhe ──────────────────────────────────────────────────────────
const DetailRow: React.FC<{
  label: string;
  tip?: string;
  clt: string;
  pj: string;
  bold?: boolean;
  negative?: boolean;
}> = ({ label, tip, clt, pj, bold, negative }) => (
  <tr className="border-b border-slate-50/60 hover:bg-slate-50/70 transition-colors">
    <td className={`px-6 py-4 ${bold ? 'font-black text-slate-800 text-base' : 'text-slate-500 font-medium text-sm'}`}>
      <span className="flex items-center gap-1">
        {label}
        {tip && <Tip text={tip} />}
      </span>
    </td>
    <td className={`px-6 py-4 font-bold text-sm ${negative ? 'text-rose-500' : bold ? 'text-blue-600 text-lg' : 'text-slate-700'}`}>{clt}</td>
    <td className={`px-6 py-4 font-bold text-sm ${negative ? 'text-rose-500' : bold ? 'text-emerald-600 text-lg' : 'text-slate-700'}`}>{pj}</td>
  </tr>
);

// ── Input numérico (percentual) ───────────────────────────────────────────────
const PercentInput: React.FC<{
  value: number; // 0–100
  onChange: (v: number) => void;
  step?: number;
  className?: string;
}> = ({ value, onChange, step = 0.1, className = '' }) => {
  const [raw, setRaw] = useState('');
  const [focused, setFocused] = useState(false);

  const display = focused ? raw : value.toFixed(1);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={display}
      onFocus={() => { setFocused(true); setRaw(value.toFixed(1)); }}
      onBlur={() => {
        setFocused(false);
        const v = parseFloat(raw.replace(',', '.'));
        if (!isNaN(v)) onChange(Math.max(0, Math.min(100, v)));
      }}
      onChange={(e) => {
        const s = e.target.value.replace(/[^0-9.,]/g, '');
        setRaw(s);
        const v = parseFloat(s.replace(',', '.'));
        if (!isNaN(v)) onChange(Math.max(0, Math.min(100, v)));
      }}
      className={className}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('calculator');

  const [clt, setClt] = useState<CltInputs>({
    grossSalary: 8500,
    employerChargesRate: 0.338,
  });

  const [pj, setPj] = useState<PjInputs>({
    billingMonthly: 12500,
    proLaboreRate: 0.28,
    costsRate: 0.05,
  });

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  const results = useMemo(() => calculateFullComparison(clt, pj), [clt, pj]);

  const chartData = [
    { name: 'Líquido Mensal', CLT: results.clt.netMonthly, PJ: results.pj.netMonthly },
    { name: 'Custo Total', CLT: results.clt.employerCost, PJ: results.pj.billingMonthly },
  ];

  const inputBase =
    'w-full bg-slate-50/60 border border-slate-200 rounded-xl outline-none transition-all font-semibold text-slate-800 focus:ring-4 focus:border-blue-500 focus:ring-blue-500/10';
  const inputLg = `${inputBase} pl-12 pr-4 py-3.5 text-lg font-bold`;
  const inputSm = `${inputBase} px-4 py-3 text-sm`;

  const renderCalculator = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── Inputs ───────────────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-6">

          {/* CLT */}
          <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-xl shadow-slate-200/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500 rounded-r-3xl" />
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-50 p-2 rounded-xl">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Parâmetros CLT</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-tight">
                  Salário Bruto
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm select-none">R$</span>
                  <CurrencyInput
                    value={clt.grossSalary}
                    onChange={(v) => setClt({ ...clt, grossSalary: v })}
                    className={inputLg}
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-tight">
                  Encargos Patronais
                  <Tip text="Total de encargos que o empregador paga além do salário: INSS Patronal (20%), FGTS (8%), 13º, Férias, PIS, etc. Padrão: 33,8%." />
                </label>
                <div className="relative">
                  <PercentInput
                    value={clt.employerChargesRate * 100}
                    onChange={(v) => setClt({ ...clt, employerChargesRate: v / 100 })}
                    className={`${inputSm} pr-8`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm select-none">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* PJ */}
          <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-xl shadow-slate-200/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500 rounded-r-3xl" />
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-emerald-50 p-2 rounded-xl">
                <Building2 className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Parâmetros PJ</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-tight">
                  Faturamento Mensal
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm select-none">R$</span>
                  <CurrencyInput
                    value={pj.billingMonthly}
                    onChange={(v) => setPj({ ...pj, billingMonthly: v })}
                    className={`${inputLg} focus:border-emerald-500 focus:ring-emerald-500/10`}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-tight">
                    Pró-labore (Fator R)
                    <Tip text="% do faturamento declarado como pró-labore. Mínimo de 28% (Fator R) para Simples Nacional Anexo III. Mínimo absoluto: 1 salário mínimo (R$ 1.621)." />
                  </label>
                  <span className="text-sm font-black text-emerald-600">{pct(pj.proLaboreRate)}</span>
                </div>
                <input
                  type="range"
                  min="1" max="100"
                  value={pj.proLaboreRate * 100}
                  onChange={(e) => setPj({ ...pj, proLaboreRate: Number(e.target.value) / 100 })}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500 mb-1"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                  <span>Mín. 28%</span>
                  <span>{fmt(Math.max(pj.billingMonthly * pj.proLaboreRate, 1621))}</span>
                </div>
              </div>

              <div>
                <label className="flex items-center text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-tight">
                  Custos Fixos
                  <Tip text="Custos operacionais mensais como porcentagem do faturamento: contador, software, aluguel, etc." />
                </label>
                <div className="relative">
                  <PercentInput
                    value={pj.costsRate * 100}
                    onChange={(v) => setPj({ ...pj, costsRate: v / 100 })}
                    className={`${inputSm} pr-8 focus:border-emerald-500 focus:ring-emerald-500/10`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm select-none">%</span>
                </div>
              </div>
            </div>
          </div>

          <AdUnit slot="9217882912" />
        </div>

        {/* ── Resultados ───────────────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-8">

          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResultCard
              label="Líquido Mensal CLT"
              value={results.clt.netMonthly}
              subValue={`Anual: ${fmt(results.clt.totalAnnualNet)}`}
              icon={<ShieldCheck className="w-5 h-5 text-blue-500" />}
            />
            <ResultCard
              label="Líquido Mensal PJ"
              value={results.pj.netMonthly}
              subValue={`Anual: ${fmt(results.pj.totalAnnualNet)}`}
              icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
            />
          </div>

          <AdUnit slot="6312517973" format="auto" className="max-w-3xl mx-auto" />

          {/* Banner diferença */}
          <div className={`group relative p-10 rounded-[2.5rem] shadow-2xl overflow-hidden transition-all duration-700 ${results.difference.annual >= 0 ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700' : 'bg-gradient-to-br from-rose-500 via-rose-600 to-pink-700'} text-white`}>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
            <div className="relative z-10 text-center">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] opacity-80 mb-4">Diferença de Ganho Anual</h3>
              <div className="text-5xl md:text-6xl font-black mb-5 tracking-tighter drop-shadow-lg">
                {fmt(Math.abs(results.difference.annual))}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="px-5 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 font-black text-sm uppercase tracking-wider">
                  {Math.abs(results.difference.percent).toFixed(1)}% de vantagem {results.difference.annual >= 0 ? 'PJ' : 'CLT'}
                </span>
                <span className="px-5 py-2 rounded-full bg-black/15 backdrop-blur-md border border-white/10 font-black text-sm uppercase tracking-wider">
                  {fmt(Math.abs(results.difference.monthly))}/mês
                </span>
              </div>
            </div>
          </div>

          <AdUnit slot="6312517973" format="auto" className="max-w-4xl mx-auto" />

          {/* Gráfico */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 p-2 rounded-xl">
                  <PieChartIcon className="w-5 h-5 text-indigo-500" />
                </div>
                <h3 className="font-black text-slate-800 tracking-tight text-lg">Projeção de Rendimentos</h3>
              </div>
              <div className="hidden sm:flex gap-5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CLT</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PJ</span>
                </div>
              </div>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cltGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                    <linearGradient id="pjGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} dy={16} />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    formatter={(v: number) => fmt(v)}
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px -8px rgb(0 0 0 / 0.12)', padding: '16px 20px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="CLT" fill="url(#cltGradient)" radius={[10, 10, 10, 10]} barSize={52} />
                  <Bar dataKey="PJ" fill="url(#pjGradient)" radius={[10, 10, 10, 10]} barSize={52} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fluxo detalhado */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-slate-200 p-2 rounded-xl">
                  <FileText className="w-5 h-5 text-slate-500" />
                </div>
                <h3 className="font-black text-slate-800 text-lg">Fluxo Detalhado</h3>
              </div>
              <span className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm">
                Demonstrativo Fiscal {currentYear}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100">
                    <th className="px-6 py-4">Discriminação</th>
                    <th className="px-6 py-4">CLT</th>
                    <th className="px-6 py-4">PJ — Simples III</th>
                  </tr>
                </thead>
                <tbody>
                  <DetailRow
                    label="Rendimento / Faturamento Bruto"
                    clt={fmt(results.clt.grossMonthly)}
                    pj={fmt(results.pj.billingMonthly)}
                    bold
                  />
                  <DetailRow
                    label="INSS"
                    tip="CLT: descontado do salário. PJ: INSS Patronal Simples (11% sobre pró-labore, teto R$932,31)."
                    clt={fmt(results.clt.inss)}
                    pj={fmt(results.pj.inssPatronal)}
                    negative
                  />
                  <DetailRow
                    label="IRRF"
                    tip="Imposto de renda retido na fonte. Com isenção progressiva 2026: rendimentos até R$5.000 isentos."
                    clt={fmt(results.clt.irrf)}
                    pj={fmt(results.pj.irrf)}
                    negative
                  />
                  <DetailRow
                    label="DAS — Simples Nacional Anexo III"
                    tip="Guia unificada do Simples (inclui ISS, PIS, COFINS, CSLL, IRPJ). Calculada sobre o faturamento mensal."
                    clt="—"
                    pj={fmt(results.pj.simplesNacional)}
                    negative
                  />
                  <DetailRow
                    label="Custos Operacionais"
                    tip="Contador, softwares, infraestrutura, etc."
                    clt="—"
                    pj={fmt(results.pj.costs)}
                    negative
                  />
                  <tr className="bg-slate-900 text-white">
                    <td className="px-6 py-6 font-black text-base">Disponível Líquido</td>
                    <td className="px-6 py-6 font-black text-xl text-blue-400">{fmt(results.clt.netMonthly)}</td>
                    <td className="px-6 py-6 font-black text-xl text-emerald-400">{fmt(results.pj.netMonthly)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Legenda tabelas */}
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-400 leading-relaxed">
              Tabelas {currentYear}: INSS progressivo (7,5–14%), IRRF com isenção progressiva até R$5.000, Simples Nacional Anexo III mensal. Pró-labore mínimo: MAX(faturamento × {pct(pj.proLaboreRate)}, R$1.621).
            </div>
          </div>

          {/* Custo para empresa */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-6">
            <h3 className="font-black text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Scale className="w-4 h-4 text-slate-400" /> Custo Total para a Empresa
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-2xl p-5">
                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">CLT</p>
                <p className="text-2xl font-black text-blue-700">{fmt(results.clt.employerCost)}</p>
                <p className="text-xs text-blue-400 mt-1">+{pct(clt.employerChargesRate)} de encargos</p>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-5">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">PJ</p>
                <p className="text-2xl font-black text-emerald-700">{fmt(results.pj.billingMonthly)}</p>
                <p className="text-xs text-emerald-400 mt-1">faturamento bruto contratado</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <section className="mt-20 grid md:grid-cols-3 gap-6">
        {[
          {
            icon: <Scale className="text-blue-500 w-6 h-6" />,
            title: 'Tabelas 2026',
            desc: `INSS progressivo atualizado, IRRF com isenção para renda até R$5.000 e Simples Nacional Anexo III. Pró-labore mínimo respeitado (Fator R).`,
          },
          {
            icon: <TrendingUp className="text-emerald-500 w-6 h-6" />,
            title: 'Potencial Real de Ganho',
            desc: 'Descubra quanto você realmente leva para casa após todos os descontos invisíveis do CLT e do PJ, com INSS Patronal Simples correto.',
          },
          {
            icon: <ShieldCheck className="text-amber-500 w-6 h-6" />,
            title: 'Privacidade Total',
            desc: 'Simulação 100% local. Seus dados não saem do seu navegador e são descartados ao fechar a aba.',
          },
        ].map((item, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 hover:-translate-y-2 transition-transform duration-500">
            <div className="bg-slate-50 w-14 h-14 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
              {item.icon}
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-3">{item.title}</h3>
            <p className="text-slate-500 leading-relaxed text-sm font-medium">{item.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );

  const renderTerms = () => (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button onClick={() => setCurrentView('calculator')} className="flex items-center gap-2 text-blue-600 font-bold mb-10 hover:gap-3 transition-all">
        <ArrowLeft className="w-5 h-5" /> Voltar para Calculadora
      </button>
      <h2 className="text-4xl font-black text-slate-900 mb-8 tracking-tighter">Termos de Uso</h2>
      <div className="prose prose-slate prose-lg max-w-none text-slate-600 font-medium leading-relaxed space-y-6">
        <p>Ao utilizar a <strong>Calculadora CLT x PJ Pro</strong>, você concorda com os termos aqui descritos.</p>
        <h3 className="text-2xl font-black text-slate-800 pt-6">1. Finalidade Informativa</h3>
        <p>O simulador tem caráter exclusivamente informativo e educativo. Os resultados são estimativas baseadas em parâmetros gerais e não constituem aconselhamento jurídico, contábil ou financeiro.</p>
        <h3 className="text-2xl font-black text-slate-800 pt-6">2. Responsabilidade do Usuário</h3>
        <p>A decisão final sobre regimes de contratação deve ser validada por um contador qualificado. O usuário é o único responsável pelas decisões tomadas com base nos dados gerados por este site.</p>
        <h3 className="text-2xl font-black text-slate-800 pt-6">3. Atualização de Dados</h3>
        <p>Buscamos manter as tabelas de {currentYear} atualizadas (INSS, IRPF, Simples Nacional), mas alterações legislativas podem ocorrer sem aviso prévio.</p>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button onClick={() => setCurrentView('calculator')} className="flex items-center gap-2 text-blue-600 font-bold mb-10 hover:gap-3 transition-all">
        <ArrowLeft className="w-5 h-5" /> Voltar para Calculadora
      </button>
      <h2 className="text-4xl font-black text-slate-900 mb-8 tracking-tighter">Política de Privacidade</h2>
      <div className="prose prose-slate prose-lg max-w-none text-slate-600 font-medium leading-relaxed space-y-6">
        <p>Sua privacidade é nossa prioridade na <strong>Calculadora CLT x PJ Pro</strong>.</p>
        <h3 className="text-2xl font-black text-slate-800 pt-6">1. Coleta de Dados</h3>
        <p>Não coletamos, armazenamos ou transmitimos nenhum dado financeiro inserido no simulador. Todos os cálculos são realizados localmente no seu navegador.</p>
        <h3 className="text-2xl font-black text-slate-800 pt-6">2. Cookies e Anúncios</h3>
        <p>Utilizamos cookies básicos para análise de tráfego e exibição de anúncios via Google AdSense, que pode coletar informações anônimas de navegação.</p>
        <h3 className="text-2xl font-black text-slate-800 pt-6">3. Segurança</h3>
        <p>Por não salvarmos dados em servidores externos, sua simulação financeira está protegida de vazamentos. Ao fechar a aba, os dados são descartados.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[120px] -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-100/50 rounded-full blur-[120px] translate-y-1/2" />
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentView('calculator')}>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/20 group-hover:rotate-12 transition-transform duration-500">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none">CLT <span className="text-blue-600">vs</span> PJ</h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Calculadora Pro {currentYear}</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <div className="bg-slate-100 px-4 py-2 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tabelas {currentYear}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 w-full">
        {currentView === 'calculator' && renderCalculator()}
        {currentView === 'terms' && renderTerms()}
        {currentView === 'privacy' && renderPrivacy()}
      </main>

      <AdUnit slot="6312517973" format="auto" className="max-w-6xl mx-auto" />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-20 mt-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <div className="flex flex-col items-center mb-12">
            <div className="bg-slate-100 p-3 rounded-[1.5rem] mb-6 shadow-inner">
              <Calculator className="w-8 h-8 text-slate-400" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tighter">Decida com Dados.</span>
            <p className="text-slate-400 text-sm mt-3 font-medium max-w-md">
              A ferramenta definitiva para comparar regimes de contratação com precisão fiscal e matemática.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-12">
            <button onClick={() => setCurrentView('terms')} className="hover:text-blue-600 transition-colors">Termos de Uso</button>
            <button onClick={() => setCurrentView('privacy')} className="hover:text-blue-600 transition-colors">Privacidade</button>
          </div>

          <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              © {currentYear} Calculadora CLT x PJ. Todos os direitos reservados.
            </p>
            <a
              href="https://orlamsolutions.or.app.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-500"
            >
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none">Powered by Agency</span>
                <span className="text-sm font-black text-slate-800 tracking-tighter">Orlam Solutions</span>
              </div>
              <div className="bg-white p-1.5 rounded-lg border border-slate-100 group-hover:rotate-12 transition-transform">
                <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
              </div>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
