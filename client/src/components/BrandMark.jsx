export default function BrandMark({
  context = "Systems",
  compact = false,
  light = false,
  iconOnly = false,
  className = "",
  markClassName = "",
}) {
  const textColor = light ? "text-white" : "text-slate-950";
  const mutedColor = light ? "text-slate-300" : "text-slate-500";
  const accentColor = light ? "text-sky-300" : "text-[#0B5FFF]";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/brand/jaytrix-mark.svg"
        alt=""
        aria-hidden="true"
        className={`h-11 w-11 shrink-0 rounded-[18px] object-contain shadow-[0_18px_32px_rgba(3,19,38,0.20)] ${markClassName}`}
      />
      {!iconOnly ? (
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
      ) : null}
    </div>
  );
}
