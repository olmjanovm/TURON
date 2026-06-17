'use client';

/**
 * CenterPin — xarita markazidagi belgi (Yandex Go uslubidagi teardrop).
 *
 * Uchи (pastki nuqta) ANIQ nishonда turadi. Xarita harakatlanganда biroz
 * ko'tariladi + soya kichrayadi, to'xtaganда tushadi. customer + admin
 * pickerlar BIR XIL shu komponentni ishlatadi (yagona ko'rinish).
 *
 * `topLabel` — pin tepasidagi ixtiyoriy yorliq (masalan ETA: "~25 daq").
 */
interface CenterPinProps {
  moving: boolean;
  topLabel?: string;
}

export function CenterPin({ moving, topLabel }: CenterPinProps) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-10">
      {/* Yer soyasi — aniq nishon nuqtasida (xaritaning markazi) */}
      <div
        className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/40 blur-[2px] transition-all duration-200 ease-out"
        style={{ width: moving ? 10 : 18, height: moving ? 4 : 6, opacity: moving ? 0.3 : 0.55 }}
      />
      {/* Pin — uchи nishonда; harakatda ko'tariladi. Wrapper pastki-markazi = svg uchi. */}
      <div
        className="absolute left-0 top-0 transition-transform duration-200 ease-out"
        style={{ width: 32, transform: `translate(-50%, calc(-100% - ${moving ? 12 : 0}px))` }}
      >
        {topLabel && (
          <div className="absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900/90 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-lg backdrop-blur-sm">
            {topLabel}
            <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[5px] border-t-[5px] border-x-transparent border-t-slate-900/90" />
          </div>
        )}
        <svg
          className="block"
          width="32"
          height="29.33"
          viewBox="0 0 24 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="turon-center-pin" x1="12" y1="2" x2="12" y2="20" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fb7185" />
              <stop offset="1" stopColor="#c62020" />
            </linearGradient>
          </defs>
          <path
            d="M12 1.5C7.86 1.5 4.5 4.86 4.5 9C4.5 14.5 12 21.5 12 21.5C12 21.5 19.5 14.5 19.5 9C19.5 4.86 16.14 1.5 12 1.5Z"
            fill="url(#turon-center-pin)"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="9" r="3.1" fill="#ffffff" />
        </svg>
      </div>
    </div>
  );
}
