import React from 'react';

interface Props {
  onSelect: (mode: 'comparativo' | 'pj' | 'clt') => void;
  isDark: boolean;
  pjColor: string;
  cltColor: string;
}

const v = (name: string) => `var(--${name})`;

const ModeSelectModal: React.FC<Props> = ({ onSelect, isDark, pjColor, cltColor }) => {
  const overlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    background: isDark ? 'rgba(6,8,16,0.92)' : 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  };

  const card = (
    mode: 'comparativo' | 'pj' | 'clt',
    accentColor: string,
    icon: React.ReactNode,
    title: string,
    subtitle: string,
    tags: string[],
  ) => {
    const dimBg = isDark
      ? `${accentColor}14`
      : `${accentColor}10`;
    const borderColor = `${accentColor}35`;

    return (
      <button
        onClick={() => onSelect(mode)}
        style={{
          flex: '1 1 280px',
          maxWidth: 360,
          background: v('surface'),
          border: `1.5px solid ${borderColor}`,
          borderRadius: 16,
          padding: '28px 24px',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.18s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget;
          el.style.borderColor = accentColor;
          el.style.transform = 'translateY(-3px)';
          el.style.boxShadow = `0 12px 40px ${accentColor}22`;
        }}
        onMouseLeave={e => {
          const el = e.currentTarget;
          el.style.borderColor = borderColor;
          el.style.transform = 'none';
          el.style.boxShadow = 'none';
        }}
      >
        {/* Top accent line */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 3,
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        }} />

        {/* Icon */}
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: dimBg,
          border: `1px solid ${accentColor}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}>
          <span style={{ color: accentColor, fontSize: 22 }}>{icon}</span>
        </div>

        {/* Title */}
        <p style={{
          margin: '0 0 8px',
          fontSize: 20,
          fontWeight: 900,
          color: v('t1'),
          fontFamily: 'Roboto, sans-serif',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}>
          {title}
        </p>

        {/* Subtitle */}
        <p style={{
          margin: '0 0 20px',
          fontSize: 13,
          color: v('t2'),
          fontFamily: 'Roboto, sans-serif',
          lineHeight: 1.6,
        }}>
          {subtitle}
        </p>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {tags.map(tag => (
            <span key={tag} style={{
              padding: '3px 8px',
              borderRadius: 5,
              background: dimBg,
              color: accentColor,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontFamily: 'Roboto, sans-serif',
            }}>
              {tag}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          marginTop: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: accentColor,
          fontSize: 12,
          fontWeight: 700,
          fontFamily: 'Roboto, sans-serif',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          Acessar calculadora
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </button>
    );
  };

  return (
    <div style={overlay}>
      <div style={{ width: '100%', maxWidth: 1160 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{
            margin: '0 0 10px',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: v('t3'),
            fontFamily: 'Roboto, sans-serif',
          }}>
            Calculadora Pro · {new Date().getFullYear()}
          </p>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(1.6rem, 5vw, 2.4rem)',
            fontWeight: 900,
            color: v('t1'),
            fontFamily: 'Roboto, sans-serif',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}>
            O que você quer calcular hoje?
          </h1>
          <p style={{
            margin: '12px 0 0',
            fontSize: 14,
            color: v('t2'),
            fontFamily: 'Roboto, sans-serif',
          }}>
            Escolha o modo que melhor se encaixa no que você precisa agora.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          {card(
            'comparativo',
            cltColor,
            '⇄',
            'CLT vs PJ',
            'Compare os dois regimes lado a lado e descubra qual é mais vantajoso para o seu caso.',
            ['Comparativo', 'CLT + PJ', 'PDF'],
          )}
          {card(
            'pj',
            pjColor,
            '◈',
            'Calculadora PJ',
            'Simule seu cenário como PJ: faturamento, pró-labore, Simples Nacional e líquido real.',
            ['PJ Exclusivo', 'Simples III', 'PDF'],
          )}
          {card(
            'clt',
            cltColor,
            '●',
            'Calculadora CLT',
            'Calcule seu salário líquido CLT, impostos, custo total para a empresa e todas as deduções.',
            ['CLT Exclusivo', 'INSS + IRRF', 'PDF'],
          )}
        </div>

        <p style={{
          textAlign: 'center',
          marginTop: 24,
          fontSize: 11,
          color: v('t3'),
          fontFamily: 'Roboto, sans-serif',
        }}>
          Você pode trocar de modo a qualquer momento pelo menu superior.
        </p>
      </div>
    </div>
  );
};

export default ModeSelectModal;
