import React, { useEffect, useRef, useState } from "react";

interface AdUnitProps {
  slot: string;
  format?: "auto" | "fluid" | "rectangle";
  className?: string;
}

const AdUnit: React.FC<AdUnitProps> = ({
  slot,
  format = "auto",
  className = "",
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const [hasAd, setHasAd] = useState(false);

  useEffect(() => {
    if (!adRef.current) return;

    try {
      if (adRef.current.childNodes.length === 0) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }

      // Pequeno delay para verificar se o anúncio foi injetado
      const checkAd = setTimeout(() => {
        if (adRef.current?.querySelector("iframe")) {
          setHasAd(true);
        }
      }, 800);

      return () => clearTimeout(checkAd);
    } catch (err) {
      console.error("Erro ao carregar AdSense:", err);
    }
  }, []);

  return (
    <div
      className={`my-8 p-4 bg-slate-100 border border-dashed border-slate-300 rounded-lg text-center flex flex-col items-center justify-center min-h-[100px] ${className}`}
    >
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
        Publicidade
      </span>

      <div ref={adRef} className="w-full">
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-0079702856690089"
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>

      {/* Fallback quando não houver anúncio */}
      {!hasAd && (
        <div className="text-slate-500 text-sm italic mt-2">
          Bloco de Anúncio ({format})
        </div>
      )}
    </div>
  );
};

export default AdUnit;