import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { ArrowDownLeft, ArrowUpRight, Clock3, Loader2, ReceiptText, ShieldCheck, WalletCards } from "lucide-react";

const formatMoney = (value: string) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(value));

export default function History() {
  const { user } = useAuth();
  const { data: transactions = [], isLoading } = trpc.transactions.getHistory.useQuery({ limit: 100 }, { enabled: !!user });

  const meta = (type: string) => {
    if (type === "purchase") return { label: "شراء باقة", icon: <ArrowUpRight className="h-5 w-5" />, iconBox: "bg-rose-100 text-rose-700", amount: "text-rose-700", prefix: "-" };
    if (type === "topup") return { label: "شحن محفظة", icon: <ArrowDownLeft className="h-5 w-5" />, iconBox: "bg-emerald-100 text-emerald-700", amount: "text-emerald-700", prefix: "+" };
    if (type === "refund") return { label: "استرجاع رصيد", icon: <ArrowDownLeft className="h-5 w-5" />, iconBox: "bg-blue-100 text-blue-700", amount: "text-blue-700", prefix: "+" };
    return { label: "تعديل حساب", icon: <WalletCards className="h-5 w-5" />, iconBox: "bg-amber-100 text-amber-700", amount: "text-amber-700", prefix: "±" };
  };

  return <main className="shamel-premium-shell min-h-screen px-4 pb-28 pt-6"><div className="mx-auto max-w-3xl"><header className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-[#061a37] via-[#0a3a78] to-[#1269c0] p-5 text-white shadow-xl shadow-blue-950/20"><div className="absolute -left-7 -bottom-10 h-32 w-32 rounded-full border border-amber-200/25" /><div className="relative flex items-start justify-between gap-3"><div><p className="text-xs font-black tracking-[0.16em] text-amber-200">WALLET HISTORY</p><h1 className="mt-2 text-2xl font-black">سجل المعاملات</h1><p className="mt-2 text-sm leading-6 text-blue-100">تابع كل عمليات الشحن والشراء ورصيدك بعد كل عملية.</p></div><span className="rounded-2xl bg-white/10 p-3 text-amber-200"><ReceiptText className="h-7 w-7" /></span></div></header>
    {!user ? <Card className="mt-5 border border-amber-200 bg-amber-50/70 p-6 text-center"><ShieldCheck className="mx-auto mb-3 h-9 w-9 text-amber-700" /><h2 className="font-black text-slate-950">سجل خاص بحسابك</h2><p className="mt-2 text-sm leading-6 text-slate-600">سجّل الدخول ليظهر لك تاريخ العمليات المالية بصورة آمنة.</p></Card> : isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-blue-700" /></div> : transactions.length === 0 ? <Card className="mt-5 overflow-hidden border border-blue-100 bg-white/95 p-8 text-center shadow-xl shadow-blue-950/5"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#061a37] to-[#1269c0] text-amber-200"><Clock3 className="h-8 w-8" /></div><h2 className="text-xl font-black text-slate-950">لا توجد معاملات بعد</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-slate-600">عند شحن المحفظة أو شراء باقة، ستظهر التفاصيل هنا بالوقت والمبلغ والرصيد المتبقي.</p></Card> : <section className="mt-5 space-y-3">{transactions.map(transaction => { const style = meta(transaction.type); return <Card key={transaction.id} className="border border-slate-100 bg-white/95 p-4 shadow-lg shadow-blue-950/[0.04] transition hover:-translate-y-0.5"><div className="flex items-center gap-3"><span className={`rounded-2xl p-3 ${style.iconBox}`}>{style.icon}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-black text-slate-950">{transaction.description || style.label}</p><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">{style.label}</span></div><p className="mt-1 text-xs text-slate-500">{new Date(transaction.createdAt).toLocaleString("ar-YE")}</p></div><div className="shrink-0 text-left"><p className={`font-black ${style.amount}`}>{style.prefix}{formatMoney(transaction.amount)} ر.ي</p><p className="mt-1 text-[11px] text-slate-500">الرصيد {formatMoney(transaction.balanceAfter)} ر.ي</p></div></div></Card>; })}</section>}
  </div></main>;
}
