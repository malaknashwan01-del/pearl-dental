/* رسومات الزينة — كلها SVG بألوان المعجون، فخفيفة وحادة على أي شاشة */

const WHITE = "#FFFFFF";
const BLUE = "#2D8CFF";
const AQUA = "#7FD3FF";
const PINK = "#FF7EB3";

/** شريط معجون مخطط: نفس الخط مرسوم بعروض مختلفة فبتطلع خطوط على طوله */
function PasteRibbon({ d, width }: { d: string; width: number }) {
  const stroke = { fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <g>
      <path d={d} {...stroke} stroke="#0F3D91" strokeOpacity={0.12} strokeWidth={width} transform="translate(10 18)" />
      <path d={d} {...stroke} stroke={WHITE} strokeWidth={width} />
      <path d={d} {...stroke} stroke={BLUE} strokeWidth={width * 0.66} />
      <path d={d} {...stroke} stroke={WHITE} strokeWidth={width * 0.42} />
      <path d={d} {...stroke} stroke={PINK} strokeWidth={width * 0.2} />
      <path d={d} {...stroke} stroke={WHITE} strokeOpacity={0.55} strokeWidth={width * 0.07} transform={`translate(${-width * 0.18} ${-width * 0.2})`} />
    </g>
  );
}

export function ToothpasteSwirl({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 800 800" className={className} style={style} aria-hidden="true">
      <PasteRibbon
        width={118}
        d="M-60 860 C 90 700, 40 520, 220 450 C 400 380, 560 470, 520 610 C 485 730, 320 720, 318 610 C 316 520, 420 500, 446 560"
      />
    </svg>
  );
}

export function HangingTube({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 320 900" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id="tubeBody" x1="0" x2="1">
          <stop offset="0" stopColor="#DDEEFF" />
          <stop offset="0.35" stopColor={WHITE} />
          <stop offset="1" stopColor="#C9E2FF" />
        </linearGradient>
        <linearGradient id="tubeCap" x1="0" x2="1">
          <stop offset="0" stopColor="#FF5C9D" />
          <stop offset="0.45" stopColor="#FF9CC5" />
          <stop offset="1" stopColor="#E9508E" />
        </linearGradient>
        <clipPath id="tubeClip">
          <path d="M45 40 H275 L262 520 C258 560, 220 585, 200 600 H120 C100 585, 62 560, 58 520 Z" />
        </clipPath>
      </defs>
      {/* الطرف المضغوط فوق */}
      <rect x="38" y="0" width="244" height="52" rx="6" fill="#CFE3FA" />
      {Array.from({ length: 11 }, (_, i) => (
        <rect key={i} x={50 + i * 21} y="6" width="6" height="40" rx="3" fill="#B4D3F5" />
      ))}
      {/* جسم الأنبوب */}
      <path d="M45 40 H275 L262 520 C258 560, 220 585, 200 600 H120 C100 585, 62 560, 58 520 Z" fill="url(#tubeBody)" />
      <g clipPath="url(#tubeClip)">
        <rect x="0" y="250" width="320" height="120" fill={BLUE} transform="rotate(-12 160 310)" />
        <rect x="0" y="380" width="320" height="22" fill={PINK} transform="rotate(-12 160 390)" />
        <rect x="0" y="232" width="320" height="10" fill={AQUA} transform="rotate(-12 160 237)" />
        <text x="160" y="330" textAnchor="middle" fontSize="44" fontWeight="800" fill={WHITE} transform="rotate(-12 160 318)" style={{ letterSpacing: "0.08em" }}>
          PEARL
        </text>
        <rect x="70" y="40" width="26" height="480" rx="13" fill={WHITE} opacity="0.6" />
      </g>
      {/* الغطا */}
      <rect x="112" y="596" width="96" height="22" rx="4" fill="#E9508E" />
      <rect x="104" y="612" width="112" height="96" rx="16" fill="url(#tubeCap)" />
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={116 + i * 16} y="622" width="6" height="76" rx="3" fill={WHITE} opacity="0.22" />
      ))}
      {/* نقطة معجون نازلة */}
      <PasteRibbon width={34} d="M160 735 C 160 770, 150 790, 166 820 C 176 840, 158 858, 160 868" />
    </svg>
  );
}

export function Bubbles({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const bubbles = [
    { x: 520, y: 520, r: 190 },
    { x: 260, y: 640, r: 110 },
    { x: 690, y: 250, r: 90 },
    { x: 330, y: 360, r: 62 },
    { x: 140, y: 470, r: 38 },
    { x: 560, y: 150, r: 34 },
    { x: 760, y: 560, r: 54 },
    { x: 420, y: 760, r: 46 },
  ];
  return (
    <svg viewBox="0 0 860 860" className={className} style={style} aria-hidden="true">
      <defs>
        <radialGradient id="bubble" cx="50%" cy="50%" r="50%">
          <stop offset="0.62" stopColor={WHITE} stopOpacity="0.02" />
          <stop offset="0.9" stopColor={AQUA} stopOpacity="0.28" />
          <stop offset="1" stopColor={WHITE} stopOpacity="0.55" />
        </radialGradient>
        <linearGradient id="bubbleTint" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={PINK} stopOpacity="0.35" />
          <stop offset="0.5" stopColor={WHITE} stopOpacity="0" />
          <stop offset="1" stopColor={AQUA} stopOpacity="0.45" />
        </linearGradient>
      </defs>
      {bubbles.map((b, i) => (
        <g key={i}>
          <circle cx={b.x} cy={b.y} r={b.r} fill="url(#bubble)" />
          <circle cx={b.x} cy={b.y} r={b.r} fill="none" stroke="url(#bubbleTint)" strokeWidth={Math.max(2, b.r * 0.05)} />
          <ellipse cx={b.x - b.r * 0.38} cy={b.y - b.r * 0.42} rx={b.r * 0.22} ry={b.r * 0.11} fill={WHITE} opacity="0.75" transform={`rotate(-35 ${b.x - b.r * 0.38} ${b.y - b.r * 0.42})`} />
          <circle cx={b.x + b.r * 0.42} cy={b.y + b.r * 0.4} r={b.r * 0.05} fill={WHITE} opacity="0.5" />
        </g>
      ))}
    </svg>
  );
}

export function Toothbrush({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 900 400" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id="handle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5AA6FF" />
          <stop offset="0.5" stopColor={BLUE} />
          <stop offset="1" stopColor="#1E6FD6" />
        </linearGradient>
      </defs>
      <g transform="rotate(-18 450 200)">
        {/* المقبض */}
        <path d="M60 210 C 60 180, 90 170, 130 172 L 520 186 C 540 187, 560 190, 580 196 L 640 206 L 640 226 L 580 230 C 560 234, 540 236, 520 236 L 130 248 C 90 250, 60 240, 60 210 Z" fill="url(#handle)" />
        <rect x="120" y="186" width="230" height="46" rx="23" fill={PINK} />
        {Array.from({ length: 7 }, (_, i) => (
          <rect key={i} x={140 + i * 28} y="194" width="10" height="30" rx="5" fill={WHITE} opacity="0.35" />
        ))}
        <path d="M120 182 L 500 192" stroke={WHITE} strokeOpacity="0.45" strokeWidth="6" strokeLinecap="round" />
        {/* الرأس */}
        <rect x="630" y="196" width="190" height="40" rx="20" fill={BLUE} />
        {/* الشعيرات */}
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={642 + i * 22} y={126 - (i % 2) * 8} width="16" height={76 + (i % 2) * 8} rx="8" fill={i % 3 === 1 ? AQUA : WHITE} stroke="#CFE3FA" strokeWidth="2" />
        ))}
        {/* معجون على الفرشاة */}
        <PasteRibbon width={46} d="M650 104 C 690 74, 730 116, 770 88 C 800 68, 820 96, 800 112" />
      </g>
    </svg>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="pearl" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor={WHITE} />
          <stop offset="0.6" stopColor="#E7F3FF" />
          <stop offset="1" stopColor="#9CC9FF" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill={BLUE} />
      <path
        d="M12.5 13.5c0-3 2.2-4.8 4.6-4.8 1.3 0 2 .6 2.9.6s1.6-.6 2.9-.6c2.4 0 4.6 1.8 4.6 4.8 0 2.4-.9 3.7-1.3 6.1-.5 3-.7 9.6-2.6 9.6-1.7 0-1.6-6-3.6-6s-1.9 6-3.6 6c-1.9 0-2.1-6.6-2.6-9.6-.4-2.4-1.3-3.7-1.3-6.1z"
        fill="url(#pearl)"
      />
      <circle cx="29" cy="11" r="2" fill={PINK} />
    </svg>
  );
}

export function Chevron() {
  return (
    <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M3 1l4 4-4 4" />
    </svg>
  );
}
