import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, MessageCircle, Send, ShieldCheck, DollarSign, LogIn, Sparkles } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"accounts" | "request">("request");

  // Form states
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [senderName, setSenderName] = useState("");
  const [notes, setNotes] = useState("");

  const { data: dbMethods = [] } = trpc.paymentMethods.getAllActive.useQuery();

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
      onOpenChange(false);
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
        <div className="grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-black">
          <button
            type="button"
            onClick={() => setActiveTab("request")}
            className={`rounded-lg py-2 transition cursor-pointer ${
              activeTab === "request" ? "bg-white text-blue-800 shadow-sm font-black" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ✍️ إرسال طلب شحن
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("accounts")}
            className={`rounded-lg py-2 transition cursor-pointer ${
              activeTab === "accounts" ? "bg-white text-blue-800 shadow-sm font-black" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🏦 بيانات الحسابات المعتمدة
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

        {activeTab === "request" ? (
          <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
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
              disabled={submitMutation.isPending}
              className="w-full h-11 bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 font-black text-white shadow-md cursor-pointer transition active:scale-95"
            >
              <Send className="ml-2 h-4 w-4" />
              {submitMutation.isPending ? "جارٍ إرسال الطلب…" : "إرسال طلب الشحن للإدارة"}
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
        ) : (
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
