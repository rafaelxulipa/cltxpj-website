
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  Briefcase, 
  Info, 
  FileText, 
  PieChart as PieChartIcon,
  ShieldCheck,
  Building2,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
  Scale
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { CltInputs, PjInputs } from './types';
import { calculateFullComparison } from './services/calculator';
import AdUnit from './components/AdUnit';
import ResultCard from './components/ResultCard';

type View = 'calculator' | 'terms' | 'privacy';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('calculator');
  const [clt, setClt] = useState<CltInputs>({
    grossSalary: 8500,
    dependents: 0,
    employerChargesRate: 0.338
  });

  const [pj, setPj] = useState<PjInputs>({
    billingMonthly: 12500,
    proLaboreRate: 0.28,
    costsRate: 0.05
  });

  const currentYear = new Date().getFullYear();

  // Smooth scroll to top when changing view
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  const results = useMemo(() => calculateFullComparison(clt, pj), [clt, pj]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const chartData = [
    { name: 'Saldo Líquido', CLT: results.clt.netMonthly, PJ: results.pj.netMonthly },
    { name: 'Custo Total', CLT: results.clt.employerCost, PJ: results.pj.billingMonthly },
  ];

  const renderCalculator = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Inputs Section */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-xl shadow-slate-200/50 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500"></div>
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-blue-50 p-2 rounded-xl">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Parâmetros CLT</h2>
            </div>
            <div className="space-y-6">
              <div className="group">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-tight">Salário Bruto</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                  <input 
                    type="number" 
                    value={clt.grossSalary}
                    onChange={(e) => setClt({...clt, grossSalary: Math.max(0, Number(e.target.value))})}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-800 text-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase">Dependentes</label>
                  <input 
                    type="number" 
                    value={clt.dependents}
                    onChange={(e) => setClt({...clt, dependents: Math.max(0, Number(e.target.value))})}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase">Encargos (%)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={clt.employerChargesRate * 100}
                    onChange={(e) => setClt({...clt, employerChargesRate: Number(e.target.value) / 100})}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-xl shadow-slate-200/50 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500"></div>
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-emerald-50 p-2 rounded-xl">
                <Building2 className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Parâmetros PJ</h2>
            </div>
            <div className="space-y-6">
              <div className="group">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-tight">Faturamento Mensal</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                  <input 
                    type="number" 
                    value={pj.billingMonthly}
                    onChange={(e) => setPj({...pj, billingMonthly: Math.max(0, Number(e.target.value))})}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-800 text-lg"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Pró-labore (%)</label>
                  <span className="text-sm font-black text-emerald-600">{(pj.proLaboreRate * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" 
                  min="1" max="100" 
                  value={pj.proLaboreRate * 100}
                  onChange={(e) => setPj({...pj, proLaboreRate: Number(e.target.value) / 100})}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500 mb-2"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase italic">
                   <span>Fator R Mín 28%</span>
                   <span>Ideal p/ Simples</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase">Custos Fixos (%)</label>
                <input 
                  type="number" 
                  step="0.5"
                  value={pj.costsRate * 100}
                  onChange={(e) => setPj({...pj, costsRate: Number(e.target.value) / 100})}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-semibold"
                />
              </div>
            </div>
          </div>

          <AdUnit slot="sidebar-slot" format="rectangle" />
        </div>

        {/* Results Display */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResultCard 
              label="Líquido Mensal CLT" 
              value={results.clt.netMonthly} 
              subValue={`Anual: ${formatCurrency(results.clt.totalAnnualNet)}`}
              icon={<ShieldCheck className="w-5 h-5 text-blue-500" />}
            />
            <ResultCard 
              label="Líquido Mensal PJ" 
              value={results.pj.netMonthly} 
              subValue={`Anual: ${formatCurrency(results.pj.totalAnnualNet)}`}
              icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
            />
          </div>

          <AdUnit
            slot="results-inline-slot"
            format="auto"
            className="max-w-3xl mx-auto"
          />


          <div className={`group relative p-10 rounded-[2.5rem] shadow-2xl transition-all duration-700 overflow-hidden ${results.difference.annual >= 0 ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white' : 'bg-gradient-to-br from-rose-500 via-rose-600 to-pink-700 text-white'}`}>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
            
            <div className="relative z-10 text-center">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] opacity-80 mb-4">Diferença de Ganho Anual</h3>
              <div className="text-6xl md:text-7xl font-black mb-6 tracking-tighter drop-shadow-lg">
                {formatCurrency(Math.abs(results.difference.annual))}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <div className="px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 font-black text-sm uppercase tracking-wider">
                  {Math.abs(results.difference.percent).toFixed(1)}% de vantagem {results.difference.annual >= 0 ? 'PJ' : 'CLT'}
                </div>
                <div className="px-6 py-2 rounded-full bg-black/10 backdrop-blur-md border border-white/10 font-black text-sm uppercase tracking-wider">
                  {formatCurrency(Math.abs(results.difference.monthly))} extras / mês
                </div>
              </div>
            </div>
          </div>

          <AdUnit
            slot="mid-content-slot"
            format="auto"
            className="max-w-4xl mx-auto"
          />


          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 p-2 rounded-xl">
                  <PieChartIcon className="w-5 h-5 text-indigo-500" />
                </div>
                <h3 className="font-black text-slate-800 tracking-tight text-lg">Projeção de Rendimentos</h3>
              </div>
              <div className="hidden sm:flex gap-6">
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 rounded-full"></span> <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CLT</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-emerald-500 rounded-full"></span> <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PJ</span></div>
              </div>
            </div>
            
            <div className="h-[320px] w-full">
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
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={20} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '20px', fontWeight: 'bold'}}
                  />
                  <Bar dataKey="CLT" fill="url(#cltGradient)" radius={[12, 12, 12, 12]} barSize={60} />
                  <Bar dataKey="PJ" fill="url(#pjGradient)" radius={[12, 12, 12, 12]} barSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
            <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-slate-200 p-2 rounded-xl">
                  <FileText className="w-5 h-5 text-slate-500" />
                </div>
                <h3 className="font-black text-slate-800 text-lg">Fluxo Detalhado</h3>
              </div>
              <div className="px-4 py-1.5 rounded-full bg-white border border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm">Demonstrativo Fiscal {currentYear}</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                    <th className="px-10 py-6">Discriminação</th>
                    <th className="px-10 py-6">Padrão CLT</th>
                    <th className="px-10 py-6">PJ (Anexo III)</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { label: 'Rendimento Bruto (Faturamento)', clt: formatCurrency(results.clt.grossMonthly), pj: formatCurrency(results.pj.billingMonthly), bold: true },
                    { label: 'Previdência Social (INSS)', clt: formatCurrency(results.clt.inss), pj: formatCurrency(results.pj.inssPF + results.pj.inssPatronal), color: 'text-rose-500' },
                    { label: 'Imposto de Renda (IRRF)', clt: formatCurrency(results.clt.irrf), pj: formatCurrency(results.pj.irrf), color: 'text-rose-500' },
                    { label: 'Taxas, DAS e Custos Fixos', clt: 'R$ 0,00', pj: formatCurrency(results.pj.simplesNacional + results.pj.costs), color: 'text-rose-500' },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-slate-50/50 hover:bg-slate-50/80 transition-colors group">
                      <td className={`px-10 py-6 ${row.bold ? 'font-black text-slate-800' : 'text-slate-500 font-medium'}`}>{row.label}</td>
                      <td className={`px-10 py-6 font-bold ${row.color || 'text-slate-700'}`}>{row.clt}</td>
                      <td className={`px-10 py-6 font-bold ${row.color || 'text-slate-700'}`}>{row.pj}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-900 text-white">
                    <td className="px-10 py-8 font-black text-lg">Disponível Líquido</td>
                    <td className="px-10 py-8 font-black text-2xl text-blue-400">{formatCurrency(results.clt.netMonthly)}</td>
                    <td className="px-10 py-8 font-black text-2xl text-emerald-400">{formatCurrency(results.pj.netMonthly)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <AdUnit
            slot="table-bottom-slot"
            format="auto"
            className="max-w-5xl mx-auto"
          />

        </div>
      </div>

      {/* Modern Info Section */}
      <section className="mt-24 grid md:grid-cols-3 gap-8">
        {[
          { icon: <Scale className="text-blue-500" />, title: 'Equilíbrio Fiscal', desc: `Calculamos as alíquotas progressivas de ${currentYear} para garantir precisão absoluta na sua simulação.` },
          { icon: <TrendingUp className="text-emerald-500" />, title: 'Potencial de Ganho', desc: 'Descubra quanto você realmente ganha após todos os descontos invisíveis da CLT e do PJ.' },
          { icon: <ShieldCheck className="text-amber-500" />, title: 'Segurança de Dados', desc: 'Simulação 100% anônima e local. Seus dados não saem do seu navegador.' }
        ].map((item, i) => (
          <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 hover:-translate-y-2 transition-transform duration-500">
            <div className="bg-slate-50 w-16 h-16 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
              {item.icon}
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-4">{item.title}</h3>
            <p className="text-slate-500 leading-relaxed text-sm font-medium">{item.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );

  const renderTerms = () => (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => setCurrentView('calculator')}
        className="flex items-center gap-2 text-blue-600 font-bold mb-10 hover:gap-3 transition-all"
      >
        <ArrowLeft className="w-5 h-5" /> Voltar para Calculadora
      </button>
      <h2 className="text-4xl font-black text-slate-900 mb-8 tracking-tighter">Termos de Uso</h2>
      <div className="prose prose-slate prose-lg max-w-none text-slate-600 font-medium leading-relaxed space-y-6">
        <p>Ao utilizar a <strong>Calculadora CLT x PJ Pro</strong>, você concorda com os termos aqui descritos. Esta ferramenta é fornecida "como está", sem garantias de qualquer tipo.</p>
        <h3 className="text-2xl font-black text-slate-800 pt-6">1. Finalidade Informativa</h3>
        <p>O simulador tem caráter exclusivamente informativo e educativo. Os resultados apresentados são estimativas baseadas em parâmetros gerais e não constituem aconselhamento jurídico, contábil ou financeiro.</p>
        <h3 className="text-2xl font-black text-slate-800 pt-6">2. Responsabilidade do Usuário</h3>
        <p>A decisão final sobre regimes de contratação deve ser validada por um contador qualificado. O usuário é o único responsável pelas decisões tomadas com base nos dados gerados por este site.</p>
        <h3 className="text-2xl font-black text-slate-800 pt-6">3. Atualização de Dados</h3>
        <p>Embora busquemos manter as tabelas de {currentYear} atualizadas (INSS, IRPF, Simples Nacional), alterações legislativas podem ocorrer a qualquer momento sem aviso prévio.</p>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => setCurrentView('calculator')}
        className="flex items-center gap-2 text-blue-600 font-bold mb-10 hover:gap-3 transition-all"
      >
        <ArrowLeft className="w-5 h-5" /> Voltar para Calculadora
      </button>
      <h2 className="text-4xl font-black text-slate-900 mb-8 tracking-tighter">Política de Privacidade</h2>
      <div className="prose prose-slate prose-lg max-w-none text-slate-600 font-medium leading-relaxed space-y-6">
        <p>Sua privacidade é nossa prioridade absoluta na <strong>Calculadora CLT x PJ Pro</strong>.</p>
        <h3 className="text-2xl font-black text-slate-800 pt-6">1. Coleta de Dados</h3>
        <p>Não coletamos, armazenamos ou transmitimos nenhum dado financeiro inserido no simulador. Todos os cálculos são realizados localmente no seu navegador utilizando JavaScript.</p>
        <h3 className="text-2xl font-black text-slate-800 pt-6">2. Cookies e Anúncios</h3>
        <p>Utilizamos cookies básicos para análise de tráfego e exibição de anúncios via Google AdSense. Estes serviços podem coletar informações anônimas de navegação para melhorar a relevância dos anúncios exibidos.</p>
        <h3 className="text-2xl font-black text-slate-800 pt-6">3. Segurança</h3>
        <p>Por não salvarmos dados em servidores externos, sua simulação financeira está segura de vazamentos. Ao fechar a aba do navegador, os dados inseridos são perdidos.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[120px] -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-100/50 rounded-full blur-[120px] translate-y-1/2"></div>
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setCurrentView('calculator')}
          >
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/20 group-hover:rotate-12 transition-transform duration-500">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none">CLT <span className="text-blue-600">vs</span> PJ</h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Calculadora Pro {currentYear}</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4">
             <div className="bg-slate-100 px-4 py-2 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Atualizado {currentYear}</span>
             </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 w-full">
        {currentView === 'calculator' && renderCalculator()}
        {currentView === 'terms' && renderTerms()}
        {currentView === 'privacy' && renderPrivacy()}
      </main>

      <AdUnit
        slot="pre-footer-slot"
        format="auto"
        className="max-w-6xl mx-auto"
      />


      {/* Modern Footer */}
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
