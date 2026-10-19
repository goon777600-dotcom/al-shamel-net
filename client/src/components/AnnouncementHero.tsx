import { useEffect, useState } from "react";
import { ChevronLeft, RadioTower, Sparkles, Wifi } from "lucide-react";
import { trpc } from "@/lib/trpc";

type Tone = "gold" | "azure" | "emerald";

const toneStyles: Record<Tone, { background: string; badge: string; button: string; orbit: string; icon: string }> = {
  gold: {
    background: "from-[#061a37] via-[#0a3f80] to-[#156fca]",
    badge: "border-amber-200/35 bg-amber-200/12 text-amber-100",
    button: "bg-amber-200 text-[#082653] hover:bg-amber-100",
    orbit: "border-amber-200/25 shadow-[0_0_0_22px_rgba(233,193,105,0.06),0_0_0_44px_rgba(233,193,105,0.04)]",
    icon: "text-amber-200",
  },
  azure: {
    background: "from-[#05234d] via-[#0f58a6] to-[#258ee0]",
    badge: "border-cyan-100/35 bg-cyan-100/12 text-cyan-50",
    button: "bg-white text-[#0a4d97] hover:bg-cyan-50",
    orbit: "border-cyan-100/25 shadow-[0_0_0_22px_rgba(201,240,255,0.07),0_0_0_44px_rgba(201,240,255,0.04)]",
    icon: "text-cyan-100",
  },
  emerald: {
    background: "from-[#063d43] via-[#0b756d] to-[#129d85]",
    badge: "border-emerald-100/35 bg-emerald-100/12 text-emerald-50",
    button: "bg-emerald-100 text-[#075a52] hover:bg-white",
    orbit: "border-emerald-100/25 shadow-[0_0_0_22px_rgba(185,255,234,0.07),0_0_0_44px_rgba(185,255,234,0.04)]",
    icon: "text-emerald-100",
  },
};

export default function AnnouncementHero({ onAction }: { onAction: (ctaText: string) => void }) {
  const { data: announcements = [] } = trpc.announcements.active.useQuery();
  const [currentIndex, setCurrentIndex] = useState(0);
  const current = announcements[currentIndex];

  useEffect(() => {
    if (announcements.length < 2) return;
    const timer = window.setInterval(() => setCurrentIndex(index => (index + 1) % announcements.length), 5500);
    return () => window.clearInterval(timer);
  }, [announcements.length]);

  useEffect(() => {
    if (currentIndex >= announcements.length) setCurrentIndex(0);
  }, [announcements.length, currentIndex]);

  if (!current) return null;
  const style = toneStyles[current.tone as Tone] ?? toneStyles.gold;

  return (
    <section aria-label="عروض الشامل نت" className={`relative mt-6 min-h-60 overflow-hidden rounded-[1.75rem] bg-gradient-to-l p-6 text-white shadow-xl shadow-blue-950/20 transition-colors duration-500 sm:min-h-64 sm:p-8 ${style.background}`}>
      <div className="pointer-events-none absolute inset-0 opacity-55" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,.26) 1px, transparent 0)", backgroundSize: "24px 24px", maskImage: "linear-gradient(110deg, transparent 5%, black 50%, transparent 95%)" }} />
      <div className={`pointer-events-none absolute -left-7 -bottom-8 h-36 w-36 rounded-full border ${style.orbit}`} />
      <div className={`pointer-events-none absolute left-[19%] top-[29%] h-2.5 w-2.5 rounded-full bg-current ${style.icon}`} />
      <div className={`pointer-events-none absolute left-[32%] top-[19%] h-2 w-2 rounded-full bg-current ${style.icon}`} />
      <div className="pointer-events-none absolute -right-8 -top-10 h-48 w-48 rounded-full border border-white/15" />
      <div className="pointer-events-none absolute right-10 top-8 h-20 w-20 rounded-full border border-white/10" />

      <div className={`relative flex min-h-48 flex-col justify-between gap-6 ${current.imageUrl ? "pl-24 sm:pl-0 sm:max-w-[64%]" : "sm:max-w-[75%]"}`}>
        <div>
          <div className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black ${style.badge}`}>
            <RadioTower className="h-3.5 w-3.5" /> {current.label}
          </div>
          <div className="flex items-start gap-3">
            <Sparkles className={`mt-1 h-6 w-6 shrink-0 ${style.icon}`} />
            <div>
              <h2 className="text-2xl font-black leading-tight sm:text-3xl">{current.title}</h2>
              <p className="mt-2 max-w-xl text-sm leading-7 text-white/84 sm:text-base">{current.description}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => onAction(current.ctaText)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black shadow-lg transition active:scale-[0.97] ${style.button}`}>
            {current.ctaText} <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex gap-1.5" aria-label="اختيار الرسالة الإعلانية">
            {announcements.map((announcement, index) => (
              <button key={announcement.id} type="button" aria-label={`عرض الرسالة ${index + 1}`} onClick={() => setCurrentIndex(index)} className={`h-2 rounded-full transition-all ${index === currentIndex ? "w-7 bg-white" : "w-2 bg-white/40 hover:bg-white/70"}`} />
            ))}
          </div>
        </div>
      </div>
      {current.imageUrl && (
        <div className="absolute left-5 top-5 h-16 w-20 overflow-hidden rounded-xl border border-white/25 bg-white/10 p-1 shadow-2xl shadow-blue-950/35 sm:bottom-5 sm:top-5 sm:h-auto sm:w-52 sm:rounded-2xl sm:p-1.5">
          <img src={current.imageUrl} alt={current.title} className="h-full w-full rounded-xl object-cover" />
          <div className="pointer-events-none absolute inset-x-1.5 bottom-1.5 hidden rounded-b-xl bg-gradient-to-t from-[#061a37]/75 to-transparent px-3 pb-3 pt-9 text-[11px] font-black text-white sm:block">عرض الشامل نت</div>
        </div>
      )}
      <Wifi className={`absolute bottom-7 left-7 h-10 w-10 opacity-20 ${style.icon}`} />
    </section>
  );
}
