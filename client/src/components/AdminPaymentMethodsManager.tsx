import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Landmark,
  Plus,
  Trash2,
  CheckCircle2,
  Power,
  RefreshCw,
  Wallet,
  Building2,
  Smartphone,
  Banknote,
  Copy,
  Check,
} from "lucide-react";

export default function AdminPaymentMethodsManager() {
  const utils = trpc.useUtils();
  const [openModal, setOpenModal] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [instructions, setInstructions] = useState("");
  const [type, setType] = useState<"bank" | "transfer" | "wallet" | "cash" | "other">("bank");
  const [icon, setIcon] = useState("🏦");

  const { data: methods = [], isLoading, refetch, isFetching } =
    trpc.paymentMethods.getAllForAdmin.useQuery();

  const createMutation = trpc.paymentMethods.create.useMutation({
    onSuccess: async () => {
      await utils.paymentMethods.getAllForAdmin.invalidate();
      await utils.paymentMethods.getAllActive.invalidate();
      toast.success("تمت إضافة طريقة الدفع / البنك بنجاح، وتظهر الآن للزبائن فوراً!");
      resetForm();
      setOpenModal(false);
    },
    onError: (err) => {
      toast.error(err.message || "تعذر إضافة طريقة الدفع");
    },
  });

  const toggleMutation = trpc.paymentMethods.update.useMutation({
    onSuccess: async () => {
      await utils.paymentMethods.getAllForAdmin.invalidate();
      await utils.paymentMethods.getAllActive.invalidate();
      toast.success("تم تحديث حالة طريقة الدفع بنجاح");
    },
    onError: (err) => {
      toast.error(err.message || "تعذر تحديث الحالة");
    },
  });

  const deleteMutation = trpc.paymentMethods.delete.useMutation({
    onSuccess: async () => {
      await utils.paymentMethods.getAllForAdmin.invalidate();
      await utils.paymentMethods.getAllActive.invalidate();
      toast.success("تم حذف طريقة الدفع بنجاح");
    },
    onError: (err) => {
      toast.error(err.message || "تعذر حذف طريقة الدفع");
    },
  });

  const resetForm = () => {
    setName("");
    setAccountNumber("");
    setAccountHolder("");
    setInstructions("");
    setType("bank");
    setIcon("🏦");
  };

  const handleCopy = (text: string, id: number) => {
    try {
      navigator.clipboard?.writeText(text);
    } catch {}
    setCopiedId(id);
    toast.success("تم نسخ رقم الحساب");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("يرجى كتابة اسم البنك أو طريقة الدفع");
      return;
    }
    if (!accountNumber.trim()) {
      toast.error("يرجى كتابة رقم الحساب أو الآيبان");
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      accountNumber: accountNumber.trim(),
      accountHolder: accountHolder.trim() || undefined,
      instructions: instructions.trim() || undefined,
      type,
      icon,
      isActive: true,
      sortOrder: methods.length + 1,
    });
  };

  const handleToggle = (id: number, currentActive: boolean) => {
    toggleMutation.mutate({
      id,
      isActive: !currentActive,
    });
  };

  const handleDelete = (id: number, methodName: string) => {
    if (confirm(`هل أنت متأكد من حذف (${methodName}) نهائياً؟`)) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <Card className="border border-blue-200 bg-white/95 p-5 shadow-xl shadow-blue-950/5 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-900 to-blue-700 text-amber-300 shadow-md">
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-950">إدارة البنوك وطرق الدفع</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              أضف حساباتك في البنوك (بنك الشمول، بنك القطيبي، الكريمي...) لتظهر للزبائن في نافذة شحن المحفظة.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="border-slate-200 text-xs font-bold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ml-1.5 ${isFetching ? "animate-spin" : ""}`} />
            تحديث
          </Button>

          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setOpenModal(true);
            }}
            className="bg-blue-700 hover:bg-blue-800 text-white font-black text-xs shadow-md cursor-pointer"
          >
            <Plus className="h-4 w-4 ml-1.5" /> إضافة بنك / طريقة دفع جديدة
          </Button>
        </div>
      </div>

      {/* List of Payment Methods */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400 font-bold">جاري تحميل البنوك وطرق الدفع...</div>
      ) : methods.length === 0 ? (
        <div className="py-12 text-center">
          <Landmark className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-black text-slate-700">لا توجد طرق دفع مضافة بعد</p>
          <p className="mt-1 text-xs text-slate-500">اضغط على زر الإضافة لإدراج بنك الشمول أو القطيبي أو غيرها.</p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {methods.map((method) => (
            <div
              key={method.id}
              className={`relative rounded-2xl border p-4 transition ${
                method.isActive
                  ? "border-blue-200 bg-gradient-to-br from-blue-50/50 via-white to-slate-50 shadow-sm"
                  : "border-slate-200 bg-slate-50 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{method.icon || "🏦"}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-900 text-base">{method.name}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                          method.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {method.isActive ? "نشط ومتاح للزبائن" : "معطل (مخفي)"}
                      </span>
                    </div>
                    {method.accountHolder && (
                      <p className="mt-0.5 text-xs font-bold text-slate-600">
                        اسم المستلم: <span className="text-slate-900">{method.accountHolder}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggle(method.id, method.isActive)}
                    disabled={toggleMutation.isPending}
                    title={method.isActive ? "تعطيل مؤقتاً" : "تفعيل للزبائن"}
                    className={`h-8 w-8 p-0 rounded-lg ${
                      method.isActive ? "text-emerald-700 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    <Power className="h-4 w-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(method.id, method.name)}
                    disabled={deleteMutation.isPending}
                    title="حذف نهائي"
                    className="h-8 w-8 p-0 rounded-lg text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Account Number Box */}
              <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500">رقم الحساب / الآيبان</span>
                  <span className="font-mono text-sm font-black text-slate-900 tracking-wider">
                    {method.accountNumber}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(method.accountNumber, method.id)}
                  className="h-7 px-2 text-blue-700 hover:bg-blue-50"
                >
                  {copiedId === method.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              {method.instructions && (
                <p className="mt-2 text-[11px] text-slate-500 leading-relaxed bg-slate-100/70 p-2 rounded-lg">
                  💡 {method.instructions}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add New Bank / Payment Method Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-black text-slate-950">
              إضافة بنك أو خيار دفع جديد
            </DialogTitle>
            <DialogDescription className="text-right text-xs text-slate-500">
              أدخل بيانات البنك ورقم الحساب وسيظهر فوراً لجميع الزبائن في المتجر وشحن المحفظة.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-3 space-y-3.5">
            <div>
              <label className="mb-1 block text-xs font-black text-slate-800">
                اسم البنك أو طريقة الدفع <span className="text-rose-600">*</span>
              </label>
              <Input
                placeholder="مثال: بنك القطيبي أو بنك الشمول أو الكريمي"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-black text-slate-800">
                رقم الحساب أو الآيبان <span className="text-rose-600">*</span>
              </label>
              <Input
                placeholder="مثال: 010201604501 أو رقم الحساب"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
                className="font-mono text-sm font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-black text-slate-800">اسم صاحب الحساب / المستلم</label>
              <Input
                placeholder="مثال: خالد الخضر حسين سالم الحميري"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                className="font-bold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-black text-slate-800">نوع الخدمة</label>
                <select
                  value={type}
                  onChange={(e) => {
                    const t = e.target.value as any;
                    setType(t);
                    if (t === "bank") setIcon("🏦");
                    else if (t === "wallet") setIcon("📱");
                    else if (t === "transfer") setIcon("👤");
                    else if (t === "cash") setIcon("💵");
                  }}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none"
                >
                  <option value="bank">🏦 بنك رسمي</option>
                  <option value="wallet">📱 محفظة إلكترونية</option>
                  <option value="transfer">👤 حوالة صراف</option>
                  <option value="cash">💵 تسليم كاش مباشر</option>
                  <option value="other">⚡ أخرى</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-black text-slate-800">الأيقونة / الرمز</label>
                <select
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none"
                >
                  <option value="🏦">🏦 بنك</option>
                  <option value="📱">📱 محفظة / جوال</option>
                  <option value="👤">👤 شخصي / صراف</option>
                  <option value="💵">💵 كاش</option>
                  <option value="💳">💳 بطاقة</option>
                  <option value="⭐">⭐ مميز</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-black text-slate-800">ملاحظات أو تعليمات للزبون (اختياري)</label>
              <Input
                placeholder="مثال: تحويل عبر تطبيق القطيبي لحظات أو كتابة الاسم في الملاحظات"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 h-11 bg-blue-700 hover:bg-blue-800 text-white font-black"
              >
                {createMutation.isPending ? "جارٍ الحفظ..." : "حفظ وإضافة البنك فوراً"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenModal(false)}
                className="h-11 font-bold"
              >
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
