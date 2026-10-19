import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, Copy, CreditCard, History, KeyRound, Loader2, MessageCircle, MoreHorizontal, Send, Settings, Share2, ShieldCheck, Wifi, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type PurchaseItem = {
  id: number;
  pinCode: string;
  cardPassword?: string | null;
  amount: string;
  status: string;
  createdAt: Date;
  packageName: string;
  packageCategory: "card" | "subscription";
  packageSize: "small" | "medium" | "large" | "huge";
  timeLimit?: string | null;
  dataLimit?: string | null;
  routerResponse?: string | null;
};

const formatMoney = (value: string) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(value));

export default function MyCards() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [tab, setTab] = useState<"cards" | "purchases">("cards");
  const [shareTarget, setShareTarget] = useState<PurchaseItem | null>(null);
  const [includePin, setIncludePin] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const { data: purchases = [], isLoading } = trpc.purchases.getUserPurchases.useQuery(undefined, { enabled: !!user });

  const copyToClipboard = async (text: string, id: number) => {
    await navigator.clipboard?.writeText(text);
    setCopiedId(id);
    toast.success("تم نسخ رمز الدخول بنجاح");
    window.setTimeout(() => setCopiedId(null), 2000);
  };
  const status = (value: string) => value === "completed" ? { label: "نشط", tone: "bg-emerald-100 text-emerald-700" } : value === "used" ? { label: "مستخدم", tone: "bg-slate-100 text-slate-700" } : value === "expired" ? { label: "منتهي", tone: "bg-rose-100 text-rose-700" } : { label: "قيد الانتظار", tone: "bg-blue-100 text-blue-700" };
  const shareText = (purchase: PurchaseItem) => `كرت الشامل نت\nالقيمة: ${formatMoney(purchase.amount)} ر.ي\n${includePin ? `رمز الدخول PIN: ${purchase.pinCode}` : "تم شراء الكرت بنجاح. افتح التطبيق لعرض رمز الدخول بصورة آمنة."}`;
  const shareWhatsApp = () => { if (!shareTarget) return; window.open(`https://wa.me/?text=${encodeURIComponent(shareText(shareTarget))}`, "_blank", "noopener,noreferrer"); setShareTarget(null); };
  const shareOther = async () => { if (!shareTarget) return; const content = shareText(shareTarget); if (navigator.share) { await navigator.share({ title: "كرت الشامل نت", text: content }); } else { await navigator.clipboard?.writeText(content); toast.success("تم نسخ نص المشاركة؛ يمكنك لصقه في التطبيق الذي تريده."); } setShareTarget(null); };

  return <main className="shamel-premium-shell min-h-screen p-4 pb-28"><div className="mx-auto max-w-4xl"><header className="relative mb-6 overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-l from-[#051a39] via-[#083775] to-[#1267bd] p-6 text-white shadow-xl shadow-blue-950/20"><div className="absolute -left-7 -bottom-10 h-32 w-32 rounded-full border border-amber-200/25" /><div className="relative flex items-start justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-xs font-black text-amber-200"><ShieldCheck className="h-4 w-4" /> مساحة العميل الآمنة</div><h1 className="text-3xl font-black">كروتي ومشترياتي</h1><p className="mt-2 text-sm text-blue-100">احتفظ برموز الدخول وراجع عمليات الشراء وقتما تحتاج.</p></div><div className="flex gap-2"><button type="button" aria-label="فتح إعدادات الحساب" onClick={() => navigate("/settings")} className="rounded-2xl border border-white/15 bg-white/10 p-3 text-white transition hover:bg-white/20"><Settings className="h-5 w-5" /></button><span className="rounded-2xl border border-amber-200/30 bg-white/10 p-3 text-amber-200"><KeyRound className="h-7 w-7" /></span></div></div></header>

    <div className="mb-5 grid grid-cols-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm"><button onClick={() => setTab("cards")} className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition ${tab === "cards" ? "bg-blue-700 text-white shadow-md" : "text-slate-500"}`}><CreditCard className="h-4 w-4" /> كروتي</button><button onClick={() => setTab("purchases")} className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition ${tab === "purchases" ? "bg-blue-700 text-white shadow-md" : "text-slate-500"}`}><History className="h-4 w-4" /> سجل المشتريات</button></div>

    {isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div> : <AnimatePresence mode="wait"><motion.section key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
      {tab === "cards" ? purchases.length === 0 ? <EmptyCards onBrowse={() => navigate("/")} /> : <div className="space-y-4">{purchases.map((purchase) => <CardItem key={purchase.id} purchase={purchase} copied={copiedId === purchase.id} onCopy={copyToClipboard} onShare={() => { setOpenMenuId(null); setIncludePin(false); setShareTarget(purchase); }} menuOpen={openMenuId === purchase.id} onToggleMenu={() => setOpenMenuId(openMenuId === purchase.id ? null : purchase.id)} status={status(purchase.status)} />)}</div> : <PurchaseHistory purchases={purchases} status={status} />}
    </motion.section></AnimatePresence>}
  </div>
  <AnimatePresence>{shareTarget && <ShareModal purchase={shareTarget} includePin={includePin} setIncludePin={setIncludePin} onClose={() => setShareTarget(null)} onWhatsApp={shareWhatsApp} onOther={shareOther} />}</AnimatePresence>
  </main>;
}

function EmptyCards({ onBrowse }: { onBrowse: () => void }) { return <Card className="border-amber-200/70 bg-gradient-to-br from-white via-white to-blue-50 p-10 text-center shadow-xl shadow-blue-950/5"><div className="mx-auto mb-5 flex h-18 w-18 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-950 to-blue-600 text-amber-200 shadow-lg shadow-blue-950/20"><Wifi className="h-9 w-9" /></div><h2 className="text-xl font-black text-slate-900">لا توجد كروت مشتراة بعد</h2><p className="mx-auto mt-2 max-w-sm leading-7 text-slate-600">بعد إتمام أي شراء، سيظهر رمز الدخول وتفاصيله هنا في مساحة محمية.</p><Button onClick={onBrowse} className="mt-6 bg-blue-700 hover:bg-blue-800">استعراض الباقات</Button></Card>; }

function CardItem({ purchase, copied, onCopy, onShare, menuOpen, onToggleMenu, status }: { purchase: PurchaseItem; copied: boolean; onCopy: (text: string, id: number) => void; onShare: () => void; menuOpen: boolean; onToggleMenu: () => void; status: { label: string; tone: string } }) {
  const kind = purchase.packageCategory === "subscription" ? "اشتراك" : "كرت";
  return (
    <Card className="relative overflow-visible border border-blue-950/10 bg-white/95 p-5 shadow-lg shadow-blue-950/5 transition hover:-translate-y-0.5 hover:shadow-xl">
      <div className="absolute inset-y-0 right-0 w-1.5 rounded-r-3xl bg-gradient-to-b from-amber-400 via-blue-600 to-blue-950" />
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-black text-amber-700">{kind} الشامل نت</p>
            {purchase.timeLimit && (
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-700">
                {purchase.timeLimit}
              </span>
            )}
            {purchase.dataLimit && (
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                {purchase.dataLimit}
              </span>
            )}
          </div>
          <h2 className="mt-1 font-black text-slate-900">{purchase.packageName}</h2>
          <p className="mt-1 text-sm text-slate-600">تاريخ الشراء: {new Date(purchase.createdAt).toLocaleDateString("ar-YE")}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.tone}`}>{status.label}</span>
      </div>

      <div className="mb-4 rounded-2xl border border-blue-100 bg-gradient-to-l from-blue-50 to-slate-50 p-4">
        <p className="mb-2 text-xs font-black tracking-wider text-blue-700">رمز الدخول الخاص بك (PIN CODE)</p>
        <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-white p-3 shadow-sm">
          <span className="font-mono text-xl font-black tracking-[0.2em] text-slate-900">{purchase.pinCode}</span>
          <Button variant="ghost" size="sm" onClick={() => onCopy(purchase.pinCode, purchase.id)} className="text-blue-700 hover:bg-blue-50">
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex items-stretch justify-between gap-3">
        <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs font-bold text-slate-600">المبلغ</p>
          <p className="mt-1 text-lg font-black text-slate-900">{formatMoney(purchase.amount)} ر.ي</p>
        </div>

        <Button
          onClick={() => {
            try {
              navigator.clipboard?.writeText(purchase.pinCode);
            } catch {}
            toast.success("تم نسخ كود الدخول تلقائياً، جاري فتح بوابة الشبكة...");
            const targetUrl = `http://100.100.100.1/login?username=${encodeURIComponent(purchase.pinCode)}&password=${encodeURIComponent(purchase.cardPassword || purchase.pinCode)}`;
            window.open(targetUrl, "_blank");
          }}
          className="bg-blue-700 text-white font-black hover:bg-blue-800 shadow-md transition active:scale-95"
        >
          <Wifi className="ml-1.5 h-4 w-4" /> الدخول للشبكة
        </Button>

        <div className="relative">
          <button
            type="button"
            aria-label="المزيد من خيارات الكرت"
            aria-expanded={menuOpen}
            onClick={onToggleMenu}
            className="flex h-full min-w-14 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="mt-1 text-[10px] font-black">المزيد</span>
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 6 }}
                transition={{ duration: 0.16 }}
                className="absolute bottom-[calc(100%+0.5rem)] left-0 z-20 w-44 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/15"
              >
                <button
                  type="button"
                  onClick={onShare}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-right text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                >
                  <Share2 className="h-4 w-4" /> مشاركة الكرت
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}

function PurchaseHistory({ purchases, status }: { purchases: PurchaseItem[]; status: (value: string) => { label: string; tone: string } }) { if (!purchases.length) return <Card className="p-10 text-center"><History className="mx-auto mb-4 h-10 w-10 text-slate-300" /><h2 className="font-black text-slate-900">لا توجد مشتريات سابقة</h2><p className="mt-2 text-sm text-slate-600">ستظهر هنا كل باقة أو كرت اشتريته، حتى بعد استخدامه.</p></Card>; return <div className="space-y-3">{purchases.map(purchase => { const state = status(purchase.status); const kind = purchase.packageCategory === "subscription" ? "اشتراك" : "كرت"; return <Card key={purchase.id} className="border border-slate-100 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><span className="rounded-2xl bg-blue-50 p-3 text-blue-700"><ReceiptTextIcon /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-black text-slate-900">{purchase.packageName}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${state.tone}`}>{state.label}</span></div><p className="mt-1 text-xs text-slate-500">{kind} · {new Date(purchase.createdAt).toLocaleString("ar-YE")}</p></div><div className="text-left"><p className="font-black text-slate-950">{formatMoney(purchase.amount)} ر.ي</p><p className="mt-1 font-mono text-[11px] text-slate-500">•••• {purchase.pinCode.slice(-4)}</p></div><ChevronLeft className="h-4 w-4 text-slate-300" /></div></Card>; })}</div>; }

function ReceiptTextIcon() { return <History className="h-5 w-5" />; }

function ShareModal({ purchase, includePin, setIncludePin, onClose, onWhatsApp, onOther }: { purchase: PurchaseItem; includePin: boolean; setIncludePin: (value: boolean) => void; onClose: () => void; onWhatsApp: () => void; onOther: () => void }) { return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end bg-slate-950/50 p-4 backdrop-blur-sm sm:items-center sm:justify-center"><motion.section initial={{ y: 32 }} animate={{ y: 0 }} exit={{ y: 32 }} transition={{ type: "spring", damping: 26, stiffness: 280 }} className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-black text-emerald-700">مشاركة آمنة</p><h2 className="mt-1 text-xl font-black text-slate-950">مشاركة كرت الشامل نت</h2></div><button onClick={onClose} className="rounded-xl bg-slate-100 p-2 text-slate-500"><X className="h-5 w-5" /></button></div><div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-sm font-bold text-slate-800">قيمة الكرت: {formatMoney(purchase.amount)} ر.ي</p><label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3"><input type="checkbox" checked={includePin} onChange={event => setIncludePin(event.target.checked)} className="mt-1 h-4 w-4 accent-amber-600" /><span><b className="block text-sm text-amber-950">تضمين رمز PIN في الرسالة</b><small className="mt-1 block leading-5 text-amber-800">لا تفعّل هذا الخيار إلا عند إرسال الكرت لشخص تثق به.</small></span></label></div><div className="mt-5 grid grid-cols-2 gap-3"><button onClick={onWhatsApp} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-black text-white"><MessageCircle className="h-4 w-4" /> واتساب</button><button onClick={onOther} className="flex items-center justify-center gap-2 rounded-xl bg-blue-700 py-3 text-sm font-black text-white"><Send className="h-4 w-4" /> مشاركة أخرى</button></div></motion.section></motion.div>; }
