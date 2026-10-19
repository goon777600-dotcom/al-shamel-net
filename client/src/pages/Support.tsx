import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Phone, MessageCircle, MapPin, Clock, CircleHelp, CreditCard, ShieldCheck } from "lucide-react";
import TopUpModal from "@/components/TopUpModal";
import { trpc } from "@/lib/trpc";

const whatsappUrl = "https://wa.me/967777600474";
const faqs = [
  ["connection", "لا أستطيع الاتصال بالإنترنت، ماذا أفعل؟", "تأكد من تشغيل الواي فاي واتصالك بالشبكة الصحيحة، ثم أوقفه وشغّله مجدداً. إن استمرت المشكلة، أعد تشغيل الهاتف وتحقق من وجود كرت نشط في صفحة «كروتي»."],
  ["pin", "أين أجد رمز الدخول PIN بعد شراء الباقة؟", "يظهر الرمز فور إتمام الشراء، ويمكنك الرجوع إليه في أي وقت من صفحة «كروتي». انسخه ثم الصقه في صفحة تسجيل الدخول إلى الشبكة."],
  ["balance", "حوّلت رصيداً ولم يظهر في محفظتي، ماذا أفعل؟", "أرسل إشعار التحويل عبر واتساب بعد استخدام طريقة شحن معتمدة. يراجع الفريق العملية ثم يضيف الرصيد بعد التحقق."],
  ["purchase", "لماذا لم تكتمل عملية شراء الباقة؟", "تأكد أن رصيد المحفظة يغطي السعر. إن كان كافياً، راجع صفحة «كروتي» قبل إعادة المحاولة حتى لا يتكرر الشراء."],
  ["account", "كيف أحافظ على أمان حسابي ورمز الدخول؟", "لا تشارك رمز PIN أو كلمة المرور مع أي شخص. فريق الدعم لا يطلب منك رمز الدخول كاملاً عبر الرسائل."],
] as const;

type ContactCardProps = { title: string; description: string; number: string; action: string; onClick: () => void; tone: "emerald" | "blue"; icon: typeof Phone };

function ContactCard({ title, description, number, action, onClick, tone, icon: Icon }: ContactCardProps) {
  const isWhatsApp = tone === "emerald";
  return <Card className={`border p-5 shadow-[0_16px_34px_rgba(7,38,82,0.08)] ${isWhatsApp ? "border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white" : "border-blue-200/80 bg-gradient-to-br from-blue-50 to-white"}`}>
    <div className="mb-4 flex items-start gap-3"><div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white shadow-sm ${isWhatsApp ? "text-emerald-600" : "text-blue-700"}`}><Icon className="h-6 w-6" /></div><div><h2 className="font-black text-slate-950">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-600">{description}</p></div></div>
    <p className={`mb-4 text-xl font-black font-mono ${isWhatsApp ? "text-emerald-700" : "text-blue-800"}`}>{number}</p>
    <Button onClick={onClick} className={`w-full text-white ${isWhatsApp ? "bg-emerald-600 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700" : "bg-blue-700 shadow-lg shadow-blue-700/20 hover:bg-blue-800"}`}><Icon className="ml-2 h-4 w-4" />{action}</Button>
  </Card>;
}

export default function Support() {
  const [topUpOpen, setTopUpOpen] = useState(false);
  const { data: dbMethods = [] } = trpc.paymentMethods.getAllActive.useQuery();
  const openWhatsApp = () => window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  const callSupport = () => { window.location.href = "tel:+967777600474"; };

  const methodsToDisplay = dbMethods.length > 0
    ? dbMethods.map((m) => [m.name, `${m.accountNumber} ${m.accountHolder ? `(باسم: ${m.accountHolder})` : ""}`])
    : [
        ["بنك الشمول", "010201604501"],
        ["حوالة عبر الصراف", "باسم: خالد الخضر حسين سالم الحميري"],
        ["تسليم كاش مباشر", "الفرع الرئيسي بيافع - الصعيد"],
      ];

  return <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_8%,rgba(65,156,255,0.14),transparent_24rem),linear-gradient(145deg,#f8fbff_0%,#edf4fb_100%)] p-4">
    <div className="mx-auto max-w-4xl">
      <section className="relative mb-6 overflow-hidden rounded-[2rem] bg-[linear-gradient(125deg,#03152e_0%,#084986_58%,#106db2_100%)] px-5 py-6 text-white shadow-[0_22px_48px_rgba(7,38,82,0.2)] sm:px-8">
        <div className="absolute -left-8 -top-10 h-36 w-36 rounded-full border border-amber-200/35" /><div className="absolute bottom-0 left-12 h-20 w-20 rounded-full bg-amber-300/10 blur-2xl" />
        <div className="relative flex items-center gap-4"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/10 shadow-inner"><CircleHelp className="h-7 w-7 text-amber-200" /></div><div><p className="text-xs font-black tracking-[0.16em] text-amber-200">AL SHAMEL CARE</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">الدعم الفني</h1><p className="mt-1 text-sm leading-6 text-blue-100">نساعدك في الكروت والمحفظة والاتصال، في أي وقت تحتاجه.</p></div></div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2"><ContactCard tone="emerald" title="واتساب الدعم" description="الأسرع لإرسال إشعار التحويل أو طلب مساعدة." icon={MessageCircle} number="+967 777 600 474" action="فتح واتساب" onClick={openWhatsApp} /><ContactCard tone="blue" title="اتصال مباشر" description="تواصل معنا صوتياً عند الحاجة إلى مساعدة عاجلة." icon={Phone} number="+967 777 600 474" action="اتصل الآن" onClick={callSupport} /></section>

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2"><Card className="border-rose-100 bg-white p-5 shadow-sm"><div className="flex gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-50 text-rose-600"><MapPin className="h-5 w-5" /></div><div><h2 className="font-black text-slate-950">الموقع الرئيسي</h2><p className="mt-1 text-sm font-bold text-slate-700">يافع - الصعيد</p><p className="mt-1 text-xs text-slate-500">الفرع الرئيسي وخدمة الكاش</p></div></div></Card><Card className="border-violet-100 bg-white p-5 shadow-sm"><div className="flex gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-50 text-violet-600"><Clock className="h-5 w-5" /></div><div><h2 className="font-black text-slate-950">ساعات العمل</h2><p className="mt-1 text-sm font-bold text-slate-700">8:00 صباحاً - 10:00 مساءً</p><p className="mt-1 text-xs text-slate-500">طوال أيام الأسبوع</p></div></div></Card></section>

      <Card className="mb-6 border-slate-200 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 font-black text-slate-950"><ShieldCheck className="h-5 w-5 text-blue-700" />خدمات المساعدة</h2><div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">{["شراء وتفعيل باقات الإنترنت", "شحن المحفظة الرقمية", "الدعم الفني والاستفسارات", "معالجة الشكاوى والمشاكل"].map(item => <div key={item} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3"><span className="h-2 w-2 rounded-full bg-amber-400" />{item}</div>)}</div></Card>

      <Card className="mb-6 border-blue-100 bg-white p-5 shadow-[0_16px_38px_rgba(17,69,129,0.08)]"><div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700"><CircleHelp className="h-5 w-5" /></div><div><h2 className="font-black text-slate-950">الأسئلة الشائعة</h2><p className="mt-1 text-xs leading-5 text-slate-600">حلول سريعة قبل التواصل مع فريق الدعم.</p></div></div><Accordion type="single" collapsible className="mt-4">{faqs.map(([value, question, answer]) => <AccordionItem key={value} value={value}><AccordionTrigger className="text-right text-sm font-bold text-slate-800 hover:no-underline">{question}</AccordionTrigger><AccordionContent className="text-right text-sm leading-7 text-slate-600">{answer}</AccordionContent></AccordionItem>)}</Accordion><div className="mt-5 rounded-2xl bg-slate-50 p-4 text-center"><p className="mb-3 text-sm text-slate-600">لم تجد إجابة لمشكلتك؟</p><Button onClick={openWhatsApp} variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"><MessageCircle className="ml-2 h-4 w-4" />تواصل مع الدعم عبر واتساب</Button></div></Card>

      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-black text-slate-950"><CreditCard className="h-5 w-5 text-amber-700" />طرق الشحن المتاحة</h2>
        <div className="mt-4 space-y-3">{methodsToDisplay.map(([title, detail]) => <div key={title} className="flex gap-3 rounded-xl bg-white/75 p-3"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-500" /><div><p className="font-bold text-slate-900">{title}</p><p className="mt-0.5 text-xs leading-5 text-slate-600">{detail}</p></div></div>)}</div>
        <Button onClick={() => setTopUpOpen(true)} className="mt-4 w-full bg-blue-700 hover:bg-blue-800 text-white font-black text-sm py-3 shadow-md">
          💰 إرسال طلب شحن رصيد للمحفظة الآن
        </Button>
      </Card>

      <TopUpModal open={topUpOpen} onOpenChange={setTopUpOpen} />
    </div>
  </main>;
}
