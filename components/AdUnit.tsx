import React, { useEffect } from "react";
import { getConsent } from "./CookieConsent";

interface AdUnitProps {
  slot: string;
  format?: "auto" | "fluid" | "rectangle";
  className?: string;
  consentAccepted?: boolean;
}

const AdUnit: React.FC<AdUnitProps> = ({
  slot,
  format = "auto",
  className = "",
  consentAccepted,
}) => {
  const hasConsent = consentAccepted ?? getConsent() === 'accepted';

  useEffect(() => {
    if (!hasConsent) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense script error:', e);
    }
  }, [hasConsent]);

  if (!hasConsent) return null;

  return (
    <div
      className={`my-8 p-4 bg-slate-100 border border-dashed border-slate-300 rounded-lg text-center flex flex-col items-center justify-center min-h-[100px] ${className}`}
    >
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
        Publicidade
      </span>

      <div className="w-full">
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-0079702856690089"
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
};

export default AdUnit;