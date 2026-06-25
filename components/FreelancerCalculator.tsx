
import React, { useState } from 'react';
import { TrendingUp, Shield, Lock } from 'lucide-react';
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
