import React from 'react';

const CONSENT_KEY = 'cookie_consent';

export type ConsentStatus = 'accepted' | 'declined' | null;

export function getConsent(): ConsentStatus {
  return (localStorage.getItem(CONSENT_KEY) as ConsentStatus) ?? null;
}

export function setConsent(value: 'accepted' | 'declined') {
  localStorage.setItem(CONSENT_KEY, value);
}

interface Props {
  onAccept: () => void;
  onDecline: () => void;
}

const CookieConsent: React.FC<Props> = ({ onAccept, onDecline }) => (
  <div
    style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: '#1a1a2e',
      borderTop: '1px solid #2e2e4a',
      padding: '16px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}
  >
    <div style={{ maxWidth: 960, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: 0, color: '#c9c9e0', fontSize: 13, lineHeight: 1.6 }}>
        Usamos <strong style={{ color: '#fff' }}>cookies de publicidade</strong> via Google AdSense para exibir anúncios
        personalizados. Nenhum dado financeiro que você digita é coletado — todos os cálculos ficam apenas no seu
        navegador.{' '}
        <button
          onClick={() => {
            const event = new CustomEvent('navigate-privacy');
            window.dispatchEvent(event);
          }}
          style={{ background: 'none', border: 'none', padding: 0, color: '#B2FF5C', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}
        >
          Política de Privacidade e Cookies
        </button>
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={onAccept}
          style={{
            padding: '8px 20px',
            borderRadius: 6,
            border: 'none',
            background: '#B2FF5C',
            color: '#0d0d1a',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            letterSpacing: '0.05em',
          }}
        >
          Aceitar cookies
        </button>
        <button
          onClick={onDecline}
          style={{
            padding: '8px 20px',
            borderRadius: 6,
            border: '1px solid #3a3a5a',
            background: 'transparent',
            color: '#9999b8',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            letterSpacing: '0.05em',
          }}
        >
          Recusar
        </button>
      </div>
    </div>
  </div>
);

export default CookieConsent;
