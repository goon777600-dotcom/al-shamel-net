import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Copy,
  Check,
  MessageCircle,
  Send,
  ShieldCheck,
  DollarSign,
  LogIn,
  Sparkles,
  Clock,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface TopUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TopUpModal({ open, onOpenChange }: TopUpModalProps) {
  const { user } = useAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"request" | "my_requests" | "accounts">("request");

  // Form states
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [senderName, setSenderName] = useState("");
  const [notes, setNotes] = useState("");

  const { data: dbMethods = [] } = trpc.paymentMethods.getAllActive.useQuery();

  const { data: limitStatus, refetch: refetchLimitStatus } = trpc.topUp.getDailyLimitStatus.useQuery(
    undefined,
    { enabled: Boolean(user && open) }
  );

  const {
    data: myRequests = [],
    refetch: refetchMyRequests,
    isFetching: isFetchingMyRequests,
  } = trpc.topUp.getMyRequests.useQuery(undefined, {
    enabled: Boolean(user && open),
    refetchInterval: open ? 10000 : false,
  });

  const rejectedRequests = useMemo(
    () => myRequests.filter((r) => r.status === "rejected"),
    [myRequests]
  );
  const latestRejected = rejectedRequests[0];

  const handleWhatsAppForRejected = (req: {
    id: number;
    amount: string;
    method: string;
    referenceNumber?: string | null;
    adminNotes?: string | null;
  }) => {
    const text = encodeURIComponent(
      `مرحباً إدارة شبكة الشامل،\nبخصوص طلب شحن المحفظة رقم #${req.id} بمبلغ ${parseFloat(req.amount).toLocaleString("ar-YE")} ر.ي (المرفوض)\nطريقة الدفع: ${req.method}\nرقم السند/الحوالة: ${req.referenceNumber || "غير متوفر"}\nسبب الرفض المسجل: ${req.adminNotes || "غير محدد"}\nأود مراجعة وتأكيد العملية معكم، وشكراً.`
    );
    window.open(`https://wa.me/967777600474?text=${text}`, "_blank");
  };

  const paymentMethods = useMemo(() => {
    if (dbMethods && dbMethods.length > 0) {
      return dbMethods.map((m) => ({
        id: String(m.id),
        name: m.name,
        icon: m.icon || "🏦",
        account: m.accountNumber,
        holder: m.accountHolder || "",
        description:
          m.type === "bank"
            ? "رقم الحساب"
            : m.type === "transfer"
            ? "اسم مستلم الحوالة"
            : "بيانات الدفع",
        instructions: m.instructions || "",
      }));
    }
    return [
      {
        id: "bank-1",
        name: "بنك الشمول",
        icon: "🏦",
        account: "010201604501",
        holder: "خالد الخضر حسين سالم الحميري",
        description: "رقم الحساب",
        instructions: "يرجى إرسال إشعار التحويل بعد إتمام العملية",
      },
      {
        id: "bank-2",
        name: "بنك القطيبي",
        icon: "🏦",
        account: "122000000",
        holder: "خالد الخضر حسين سالم الحميري",
        description: "رقم الحساب",
        instructions: "تحويل عبر تطبيق القطيبي لحظات",
      },
      {
        id: "transfer-1",
        name: "حوالة عبر الصراف",
        icon: "👤",
        account: "باسم المستلم أدناه",
        holder: "خالد الخضر حسين سالم الحميري",
        description: "اسم مستلم الحوالة",
        instructions: "عبر النجم أو العمقي أو الكريمي",
      },
      {
        id: "cash-1",
        name: "تسليم كاش مباشر",
        icon: "💵",
        account: "يافع - الصعيد",
        holder: "الفرع الرئيسي",
        description: "الفرع الرئيسي",
        instructions: "الفرع الرئيسي وخدمة الكاش المباشر",
      },
    ];
  }, [dbMethods]);

  // Set default method once methods are available
  useEffect(() => {
    if (paymentMethods.length > 0 && !method) {
      setMethod(`${paymentMethods[0].name} (${paymentMethods[0].account})`);
    }
  }, [paymentMethods, method]);

  // Fill default sender name if logged in
  useEffect(() => {
    if (user?.name && !senderName) {
      setSenderName(user.name);
    }
  }, [user?.name]);

  const submitMutation = trpc.topUp.submitRequest.useMutation({
    onSuccess: (res) => {
      toast.success(res.message);
      setAmount("");
      setReferenceNumber("");
      setNotes("");
      refetchLimitStatus();
      refetchMyRequests();
      setActiveTab("my_requests");
    },
    onError: (err) => {
      toast.error(err.message || "تعذر إرسال طلب الشحن");
    },
  });

  const copyToClipboard = async (text: string, id: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
    } catch {}
    setCopiedId(id);
    toast.success("تم نسخ رقم الحساب بنجاح");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `مرحباً إدارة الشامل نت، أود شحن محفظتي بمبلغ ${amount || "..."} ر.ي\nرقم السند/الحوالة: ${referenceNumber || "..."}`
    );
    window.open(`https://wa.me/967777600474?text=${text}`, "_blank");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("يرجى تسجيل الدخول أولاً لتتمكن من إرسال طلب الشحن.");
      onOpenChange(false);
      document.querySelector(".shamel-auth-card")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (limitStatus && !limitStatus.canSubmit) {
      toast.error(`عذراً، لقد استهلكت الحد المسموح به لطلبات الشحن اليوم (${limitStatus.maxDailyRequests} طلبات يومياً). يرجى الانتظار حتى الغد أو التواصل مع الإدارة عبر الواتساب.`);
      return;
    }
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح للشحن.");
      return;
    }
    submitMutation.mutate({
      amount: num,
      method: method || (paymentMethods[0] ? `${paymentMethods[0].name} (${paymentMethods[0].account})` : "بنك الشمول"),
      referenceNumber: referenceNumber.trim() || undefined,
      senderName: senderName.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  const quickAmounts = ["500", "1000", "2000", "3000", "5000"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-right text-lg font-black text-slate-950 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400 text-slate-950 text-base shadow-xs">
              💰
            </span>
            <span>شحن رصيد المحفظة</span>
          </DialogTitle>
          <DialogDescription className="text-right text-xs text-slate-500">
            أرسل طلب شحن رصيد لمحفظتك أو استعرض أرقام الحسابات للتحويل المباشر.
          </DialogDescription>
        </DialogHeader>

        {/* Tab switch */}
        <div className="grid grid-cols-3 rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-black">
          <button
            type="button"
            onClick={() => setActiveTab("request")}
            className={`rounded-lg py-2 transition cursor-pointer text-center ${
              activeTab === "request"
                ? "bg-white text-blue-800 shadow-sm font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ✍️ إرسال طلب
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("my_requests")}
            className={`relative rounded-lg py-2 transition cursor-pointer text-center flex items-center justify-center gap-1 ${
              activeTab === "my_requests"
                ? "bg-white text-blue-800 shadow-sm font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>📋 متابعة طلباتي</span>
            {myRequests.length > 0 && (
              <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded-full font-bold">
                {myRequests.length}
              </span>
            )}
            {rejectedRequests.length > 0 && (
              <span
                title="لديك طلب مرفوض يتطلب المراجعة"
                className="inline-block h-2 w-2 rounded-full bg-rose-500 animate-pulse"
              />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("accounts")}
            className={`rounded-lg py-2 transition cursor-pointer text-center ${
              activeTab === "accounts"
                ? "bg-white text-blue-800 shadow-sm font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🏦 بيانات الحسابات
          </button>
        </div>

        {!user && activeTab === "request" && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
            <p className="text-xs font-bold text-amber-900 mb-2">
              ⚠️ يجب تسجيل الدخول أولاً لربط الرصيد بحسابك ومحفظتك.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                document.querySelector(".shamel-auth-card")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-blue-700 hover:bg-blue-800 text-white font-black text-xs"
            >
              <LogIn className="ml-1.5 h-3.5 w-3.5" /> تسجيل الدخول الآن
            </Button>
          </div>
        )}

        {activeTab === "request" && (
          <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
            {/* Alert for Rejected Request with Direct WhatsApp Button */}
            {latestRejected && (
              <div className="rounded-xl border border-rose-300 bg-rose-50/90 p-3 text-right shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="flex items-center gap-1.5 text-xs font-black text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    تنبيه: تم رفض طلب شحن سابق لك بمبلغ {parseFloat(latestRejected.amount).toLocaleString("ar-YE")} ر.ي
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("my_requests")}
                    className="text-[10px] font-black text-rose-700 underline cursor-pointer"
                  >
                    عرض التفاصيل
                  </button>
                </div>
                <p className="text-xs text-rose-800 font-bold mb-2">
                  <span className="text-rose-950 font-black">السبب من الإدارة:</span>{" "}
                  {latestRejected.adminNotes || "يرجى مراجعة الإدارة عبر الواتساب"}
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleWhatsAppForRejected(latestRejected)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-8 shadow-xs cursor-pointer active:scale-95"
                >
                  <MessageCircle className="ml-1.5 h-3.5 w-3.5" />
                  مراسلة الإدارة عبر الواتساب (777600474) لمراجعة الطلب
                </Button>
              </div>
            )}

            {user && limitStatus && (
              <div
                className={`rounded-xl border p-2.5 text-xs font-bold flex items-center justify-between shadow-xs ${
                  limitStatus.canSubmit
                    ? "bg-blue-50/80 border-blue-200 text-blue-900"
                    : "bg-rose-50 border-rose-300 text-rose-900"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{limitStatus.canSubmit ? "⚡" : "⚠️"}</span>
                  <span>
                    {limitStatus.canSubmit
                      ? `الطلبات المتبقية لك اليوم: ${limitStatus.remainingToday} من أصل ${limitStatus.maxDailyRequests}`
                      : "استنفدت الحد اليومي للشحن (طلبان اثنان في اليوم)"}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    limitStatus.canSubmit
                      ? "bg-blue-200 text-blue-950"
                      : "bg-rose-200 text-rose-950"
                  }`}
                >
                  {limitStatus.usedToday}/{limitStatus.maxDailyRequests} اليوم
                </span>
              </div>
            )}

            {user && limitStatus && !limitStatus.canSubmit && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-right">
                <p className="text-xs font-black text-rose-900 leading-relaxed">
                  🚫 تم إيقاف تقديم طلبات شحن إضافية اليوم (الحد الأقصى: طلبان يومياً).
                </p>
                <p className="text-[11px] text-rose-700 mt-1 font-bold">
                  سيتم فتح إمكانية تقديم الطلبات مجدداً غداً بإذن الله. إذا كنت قد قمت بالتحويل، يمكنك النقر على زر الواتساب بالأسفل لإرسال صورة السند مباشرة للإدارة لتأكيد شحنك.
                </p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-black text-slate-800">
                  المبلغ المراد شحنه (ريال يمني) <span className="text-rose-600">*</span>
                </label>
                <span className="text-[10px] font-bold text-amber-700">خيارات سريعة:</span>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  min="50"
                  step="50"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="أدخل المبلغ (مثال: 500 أو 1000)"
                  className="font-black text-slate-900 pr-9 text-base h-11"
                />
                <DollarSign className="absolute right-2.5 top-3 h-4 w-4 text-slate-400" />
              </div>

              {/* Quick Amount Chips */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {quickAmounts.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setAmount(q)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-black transition cursor-pointer ${
                      amount === q
                        ? "border-amber-400 bg-amber-400 text-slate-950 shadow-xs"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {q} ر.ي
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-black text-slate-800">طريقة التحويل / الدفع المعتمدة</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={`${pm.name} (${pm.account})`}>
                    {pm.icon} {pm.name} ({pm.account}) {pm.holder ? `- ${pm.holder}` : ""}
                  </option>
                ))}
                <option value="أخرى / تحويل مباشر">أخرى / تحويل مباشر</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-black text-slate-800">رقم السند أو الحوالة</label>
                <Input
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="رقم السند"
                  className="text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-black text-slate-800">اسم المحوّل</label>
                <Input
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="اسم الشخص المحول"
                  className="text-xs font-bold"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitMutation.isPending || Boolean(limitStatus && !limitStatus.canSubmit)}
              className={`w-full h-11 font-black text-white shadow-md transition ${
                limitStatus && !limitStatus.canSubmit
                  ? "bg-slate-400 cursor-not-allowed opacity-80"
                  : "bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 cursor-pointer active:scale-95"
              }`}
            >
              <Send className="ml-2 h-4 w-4" />
              {submitMutation.isPending
                ? "جارٍ إرسال الطلب…"
                : limitStatus && !limitStatus.canSubmit
                ? "تم استهلاك الحد اليومي (طلبان باليوم)"
                : "إرسال طلب الشحن للإدارة"}
            </Button>

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-center">
              <p className="text-[11px] text-amber-900 leading-relaxed font-bold">
                💡 فور إرسال الطلب، يصل إشعار مباشر لمدير الشبكة لمراجعة الحوالة وتنزيل الرصيد في محفظتك فورياً.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleWhatsApp}
              className="w-full border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-bold cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 ml-2 text-emerald-600" />
              إرسال صورة السند عبر الواتساب للمدير
            </Button>
          </form>
        )}

        {/* Tab 2: My Requests */}
        {activeTab === "my_requests" && (
          <div className="space-y-3 mt-2">
            <div className="flex items-center justify-between pb-1">
              <p className="text-xs font-black text-slate-800">
                سجل طلبات شحن المحفظة الخاصة بك ({myRequests.length}):
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => refetchMyRequests()}
                disabled={isFetchingMyRequests}
                className="h-7 px-2 text-xs text-slate-600 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ml-1 ${isFetchingMyRequests ? "animate-spin" : ""}`} />
                تحديث
              </Button>
            </div>

            {myRequests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
                <p className="text-xs font-bold text-slate-600">لا توجد لديك طلبات شحن مسجلة بعد.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  عندما ترسل طلب شحن، ستتمكن من متابعة حالته وتأكيده هنا لحظة بلحظة.
                </p>
                <Button
                  type="button"
                  onClick={() => setActiveTab("request")}
                  className="mt-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs h-8 cursor-pointer"
                >
                  ✍️ تقديم طلب شحن جديد
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-0.5">
                {myRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`rounded-xl border p-3 transition text-right ${
                      req.status === "rejected"
                        ? "border-rose-300 bg-rose-50/40"
                        : req.status === "approved"
                        ? "border-emerald-200 bg-white"
                        : "border-amber-200 bg-amber-50/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-base font-black text-slate-900">
                        {parseFloat(req.amount).toLocaleString("ar-YE")} <span className="text-xs">ر.ي</span>
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                          req.status === "pending"
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : req.status === "approved"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-rose-100 text-rose-800 border border-rose-300"
                        }`}
                      >
                        {req.status === "pending"
                          ? "⏳ قيد المراجعة"
                          : req.status === "approved"
                          ? "✅ تم الشحن بنجاح"
                          : "❌ تم الرفض"}
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
                      <span>
                        <strong className="text-slate-800">الطريقة:</strong> {req.method}
                      </span>
                      {req.referenceNumber && (
                        <span>
                          <strong className="text-slate-800">رقم السند:</strong>{" "}
                          <code className="rounded bg-slate-100 px-1 font-mono font-bold text-blue-700">
                            {req.referenceNumber}
                          </code>
                        </span>
                      )}
                      <span className="text-slate-400">
                        {new Date(req.createdAt).toLocaleString("ar-YE")}
                      </span>
                    </div>

                    {/* Rejection Details & WhatsApp Button */}
                    {req.status === "rejected" && (
                      <div className="mt-2.5 rounded-lg border border-rose-300 bg-white p-2.5 shadow-xs">
                        <p className="text-xs font-bold text-rose-900">
                          <span className="font-black text-rose-950">سبب الرفض المسجل من الإدارة:</span>{" "}
                          {req.adminNotes || "لم يتم توضيح سبب محدد، يرجى التواصل مع الإدارة."}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-600">
                          لحل أي التباس أو تأكيد حوالتك مباشرة مع مدير الشبكة:
                        </p>
                        <Button
                          type="button"
                          onClick={() => handleWhatsAppForRejected(req)}
                          className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-9 shadow-xs cursor-pointer active:scale-95"
                        >
                          <MessageCircle className="ml-1.5 h-4 w-4" />
                          مراسلة الإدارة عبر الواتساب (777600474) لمراجعة الطلب
                        </Button>
                      </div>
                    )}

                    {/* Pending state help button */}
                    {req.status === "pending" && (
                      <div className="mt-2 pt-2 border-t border-amber-200/60">
                        <p className="text-[11px] text-amber-900 font-medium">
                          طلبك قيد المراجعة الآن من مدير الشبكة. يمكنك تسريع الاعتماد بإرسال صورة السند عبر الواتساب:
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const text = encodeURIComponent(
                              `مرحباً إدارة شبكة الشامل،\nأرسلت طلب شحن بمبلغ ${parseFloat(req.amount).toLocaleString("ar-YE")} ر.ي عبر ${req.method}.\nرقم السند: ${req.referenceNumber || "غير متوفر"}\nيرجى التكرم باعتماده وشكراً.`
                            );
                            window.open(`https://wa.me/967777600474?text=${text}`, "_blank");
                          }}
                          className="mt-1.5 w-full border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-bold h-8 cursor-pointer"
                        >
                          <MessageCircle className="ml-1.5 h-3.5 w-3.5 text-emerald-600" />
                          إرسال صورة السند للواتساب (777600474)
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Payment Accounts */}
        {activeTab === "accounts" && (
          <div className="space-y-3 mt-2">
            {paymentMethods.map((m) => (
              <div key={m.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{m.icon}</span>
                    <div>
                      <p className="font-black text-slate-900 text-sm">{m.name}</p>
                      <p className="text-[11px] font-semibold text-slate-500">{m.description}</p>
                    </div>
                  </div>
                  {m.holder && (
                    <span className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                      {m.holder}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-xs font-mono font-black text-slate-900 truncate">{m.account}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(m.account, m.id)}
                    className="h-7 px-2 text-blue-700 hover:bg-blue-50 cursor-pointer font-bold text-xs"
                  >
                    {copiedId === m.id ? (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold">
                        <Check className="w-3.5 h-3.5" /> تم النسخ
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Copy className="w-3.5 h-3.5" /> نسخ
                      </span>
                    )}
                  </Button>
                </div>
                {m.instructions && (
                  <p className="mt-1.5 text-[10px] text-slate-500 leading-tight font-medium">
                    💡 {m.instructions}
                  </p>
                )}
              </div>
            ))}

            <Button
              type="button"
              onClick={() => setActiveTab("request")}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black text-xs h-10 shadow-sm cursor-pointer"
            >
              تم التحويل؟ اضغط هنا لإرسال طلب الشحن للإدارة
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
