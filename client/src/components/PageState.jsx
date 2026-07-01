export default function PageState({
  title,
  description,
  tone = "neutral",
}) {
  const toneStyles = {
    neutral:
      "border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] text-slate-700 shadow-[0_16px_36px_rgba(15,23,42,0.05)]",
    info:
      "border-[#062A63]/15 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_100%)] text-[#062A63] shadow-[0_16px_36px_rgba(6,42,99,0.08)]",
    error:
      "border-red-200 bg-[linear-gradient(135deg,#fef2f2_0%,#fff7ed_100%)] text-red-700 shadow-[0_16px_36px_rgba(220,38,38,0.08)]",
    warning:
      "border-orange-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_100%)] text-orange-700 shadow-[0_16px_36px_rgba(11,95,255,0.08)]",
  };

  return (
    <div className={`rounded-[24px] border p-4 md:p-5 ${toneStyles[tone] || toneStyles.neutral}`}>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] opacity-70">System Update</p>
      <p className="mt-2 font-black">{title}</p>
      {description ? <p className="mt-1 text-sm opacity-90">{description}</p> : null}
    </div>
  );
}
