export default function BrandMark({
  context = "Systems",
  compact = false,
  light = false,
  className = "",
}) {
  const textColor = light ? "text-white" : "text-slate-950";
  const mutedColor = light ? "text-slate-300" : "text-slate-500";
  const accentColor = light ? "text-sky-300" : "text-[#0B5FFF]";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[18px] border border-white/15 bg-[linear-gradient(145deg,#031326_0%,#062A63_52%,#0B5FFF_100%)] shadow-[0_18px_32px_rgba(3,19,38,0.24)]">
        <span className="absolute -right-3 -top-3 h-9 w-9 rounded-full bg-sky-300/25 blur-xl" />
        <span className="relative text-lg font-black italic tracking-[-0.16em] text-white">
          JT
        </span>
        <span className="absolute left-2.5 top-2.5 h-1.5 w-1.5 rounded-[3px] bg-white/75" />
        <span className="absolute left-4 top-4 h-1.5 w-1.5 rounded-[3px] bg-sky-300/90" />
        <span className="absolute left-2.5 top-6 h-1 w-1 rounded-[2px] bg-slate-900/80" />
      </div>
      <div className="min-w-0">
        <p className={`text-lg font-black leading-none tracking-[0.08em] ${textColor}`}>
          JAY<span className={accentColor}>TRIX</span>
        </p>
        {!compact ? (
          <p className={`mt-1 text-[10px] font-semibold uppercase tracking-[0.32em] ${mutedColor}`}>
            {context}
          </p>
        ) : null}
      </div>
    </div>
  );
}
