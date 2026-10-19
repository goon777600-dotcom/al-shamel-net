import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, ChevronLeft, CircleUserRound, KeyRound, LifeBuoy, LogOut, Mail, ShieldCheck, Smartphone, WalletCards } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Settings() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const initials = (user?.name || "عميل الشامل").trim().slice(0, 1);

  if (!user) {
    return <main className="shamel-premium-shell flex min-h-screen items-center justify-center p-4"><Card className="max-w-md p-7 text-center"><ShieldCheck className="mx-auto mb-4 h-10 w-10 text-blue-700" /><h1 className="text-xl font-black text-slate-950">إعدادات الحساب</h1><p className="mt-2 text-sm leading-6 text-slate-600">سجّل دخولك أولاً للوصول إلى إعداداتك الشخصية.</p><Button onClick={() => navigate("/")} className="mt-5 w-full bg-blue-700 hover:bg-blue-800">العودة إلى المتجر</Button></Card></main>;
  }

  const rows = [
    { icon: WalletCards, title: "كروتي ومشترياتي", text: "راجع الكروت والرموز وسجل الشراء", onClick: () => navigate("/cards"), tone: "text-blue-700 bg-blue-50" },
    { icon: Bell, title: "إشعارات الحساب", text: "سيتم تفعيل التنبيهات الرسمية مع نسخة الجوال النهائية", onClick: () => toast.info("ستنضم إشعارات التطبيق الرسمية في مرحلة الربط النهائية."), tone: "text-amber-700 bg-amber-50" },
    { icon: LifeBuoy, title: "الدعم الفني", text: "الأسئلة الشائعة وطرق التواصل السريعة", onClick: () => navigate("/support"), tone: "text-emerald-700 bg-emerald-50" },
  ];

  return <main className="shamel-premium-shell min-h-screen p-4 pb-28"><div className="mx-auto max-w-2xl">
    <header className="relative mb-6 overflow-hidden rounded-[2rem] bg-[linear-gradient(130deg,#04162f,#074482_60%,#126dbc)] p-6 text-white shadow-xl shadow-blue-950/20"><div className="absolute -left-8 -bottom-10 h-36 w-36 rounded-full border border-amber-200/25" /><div className="relative flex items-center gap-4"><div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/10 text-2xl font-black text-amber-200">{initials}</div><div><p className="text-xs font-black tracking-[0.16em] text-amber-200">MY ACCOUNT</p><h1 className="mt-1 text-2xl font-black">إعداداتي</h1><p className="mt-1 text-sm text-blue-100">تحكم بمعلومات حسابك وخدمات الشامل نت.</p></div></div></header>

    <Card className="mb-5 border-blue-100 bg-white p-5 shadow-lg shadow-blue-950/5"><div className="mb-4 flex items-center gap-3"><span className="rounded-2xl bg-blue-50 p-2.5 text-blue-700"><CircleUserRound className="h-5 w-5" /></span><div><h2 className="font-black text-slate-950">معلومات الحساب</h2><p className="mt-1 text-xs text-slate-500">تُحفظ بياناتك في مساحة العميل الآمنة.</p></div></div><div className="space-y-3"><div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">اسم العميل</p><p className="mt-1 font-black text-slate-900">{user.name || "عميل الشامل"}</p></div><div className="rounded-2xl bg-slate-50 p-3"><p className="flex items-center gap-1 text-xs font-bold text-slate-500"><Mail className="h-3.5 w-3.5" /> البريد أو معرف الدخول</p><p className="mt-1 break-all text-sm font-black text-slate-800">{user.email || "حساب الشامل نت الآمن"}</p></div></div></Card>

    <Card className="mb-5 border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm"><div className="flex gap-3"><span className="rounded-2xl bg-white p-2.5 text-emerald-700 shadow-sm"><ShieldCheck className="h-5 w-5" /></span><div><h2 className="font-black text-slate-950">حماية الحساب</h2><p className="mt-1 text-sm leading-6 text-slate-600">جلسة الدخول محمية. عند تفعيل التسجيل برقم الهاتف ستظهر هنا أدوات تغيير كلمة المرور والتحقق بخطوتين.</p></div></div></Card>

    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">{rows.map(({ icon: Icon, title, text, onClick, tone }) => <button key={title} type="button" onClick={onClick} className="flex w-full items-center gap-3 border-b border-slate-100 p-4 text-right transition last:border-0 hover:bg-slate-50"><span className={`rounded-2xl p-2.5 ${tone}`}><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-black text-slate-900">{title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{text}</span></span><ChevronLeft className="h-4 w-4 text-slate-300" /></button>)}</Card>

    <Button variant="outline" onClick={() => logout()} className="mt-5 w-full border-rose-200 bg-white text-rose-700 hover:bg-rose-50"><LogOut className="ml-2 h-4 w-4" />تسجيل الخروج من الحساب</Button>
    <p className="mt-5 flex items-center justify-center gap-1 text-center text-xs text-slate-500"><Smartphone className="h-3.5 w-3.5" /> الشامل نت · تجربة هاتف آمنة</p>
  </div></main>;
}
