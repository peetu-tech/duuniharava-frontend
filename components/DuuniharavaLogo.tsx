"use client";

export default function DuuniharavaLogo({
  size = "md",
  showText = true,
}: {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}) {
  const sizes = {
    sm: {
      wrap: "h-10 w-10",
      icon: "h-10 w-10",
      title: "text-lg",
      sub: "text-[10px]",
    },
    md: {
      wrap: "h-12 w-12",
      icon: "h-12 w-12",
      title: "text-xl",
      sub: "text-[11px]",
    },
    lg: {
      wrap: "h-14 w-14",
      icon: "h-14 w-14",
      title: "text-2xl",
      sub: "text-xs",
    },
  };

  const s = sizes[size];

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${s.wrap} relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-500 p-[1px] shadow-[0_10px_30px_rgba(16,185,129,0.22)]`}
      >
        <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-[#07111f]">
          <svg
            viewBox="0 0 64 64"
            className={`${s.icon}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 45L32 18L46 45"
              stroke="url(#grad1)"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M23 36H41"
              stroke="url(#grad1)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M20 42H44"
              stroke="url(#grad2)"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.95"
            />
            <circle cx="32" cy="18" r="4.5" fill="url(#grad1)" />
            <defs>
              <linearGradient id="grad1" x1="12" y1="10" x2="52" y2="50">
                <stop stopColor="#34d399" />
                <stop offset="0.5" stopColor="#22d3ee" />
                <stop offset="1" stopColor="#60a5fa" />
              </linearGradient>
              <linearGradient id="grad2" x1="18" y1="40" x2="46" y2="44">
                <stop stopColor="#a7f3d0" />
                <stop offset="1" stopColor="#67e8f9" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {showText && (
        <div className="leading-tight">
          <div className={`${s.title} font-black tracking-[-0.03em] text-white`}>
            Duuniharava
          </div>
          <div className={`${s.sub} uppercase tracking-[0.26em] text-zinc-400`}>
            CV · Työpaikat · Hakemukset
          </div>
        </div>
      )}
    </div>
  );
}