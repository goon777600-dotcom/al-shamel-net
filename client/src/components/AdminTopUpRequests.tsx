import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  RefreshCw,
  User,
  XCircle,
  FileText,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface RejectDialogState {
  requestId: number;
  userName: string | null;
  amount: string;
  referenceNumber?: string | null;
  method?: string | null;
}

const QUICK_REJECTION_REASONS = [
  {
    id: "not_received",
    title: "لم يصل إشعار التحويل في حسابنا حتى الآن",
    icon: "⏳",
  },
  {
    id: "invalid_ref",
    title: "رقم السند أو رقم الحوالة غير صحيح",
    icon: "📄",
  },
  {
    id: "amount_mismatch",
    title: "المبلغ المحول غير مطابق للمبلغ المطلوب",
    icon: "💵",
  },
  {
    id: "wrong_account",
    title: "الحساب المحول إليه غير صحيح / لم نستلم المبلغ",
    icon: "🏦",
  },
  {
    id: "service_provider",
    title: "رصيدك أو عمليتك تحتاج مراجعة، تواصل مع مزود الخدمة",
    icon: "⚠️",
  },
  {
    id: "contact_admin",
    title: "يرجى التواصل مع إدارة الشبكة عبر الواتساب لتأكيد العملية",
    icon: "💬",
  },
];

export default function AdminTopUpRequests() {
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | undefined>("pending");

  const [rejectDialog, setRejectDialog] = useState<RejectDialogState | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: requests = [], isLoading, refetch, isFetching } =
    trpc.topUp.getAdminRequests.useQuery({ status: filter }, {
      refetchInterval: 12000,
    });

  const approveMutation = trpc.topUp.approve.useMutation({
    onSuccess: async (res) => {
      await utils.topUp.getAdminRequests.invalidate();
      await utils.notifications.getAdminList.invalidate();
      await utils.admin.overview.invalidate();
      toast.success("تمت الموافقة بنجاح وتم شحن محفظة العميل فوراً!");
    },
    onError: (err) => {
      toast.error(err.message || "تعذر معالجة الطلب");
    },
  });

  const rejectMutation = trpc.topUp.reject.useMutation({
    onSuccess: async () => {
      await utils.topUp.getAdminRequests.invalidate();
      await utils.notifications.getAdminList.invalidate();
      setRejectDialog(null);
      setRejectReason("");
      toast.info("تم رفض الطلب وإرسال التنبيه للعميل برقم الواتساب");
    },
    onError: (err) => {
      toast.error(err.message || "تعذر رفض الطلب");
    },
  });

  const handleApprove = (id: number, amount: string, name: string | null) => {
    if (confirm(`هل أنت متأكد من شحن مبلغ ${amount} ر.ي لمحفظة العميل (${name || "العميل"})؟`)) {
      approveMutation.mutate({ requestId: id });
    }
  };

  const openRejectDialog = (req: {
    id: number;
    userName: string | null;
    amount: string;
    referenceNumber: string | null;
    method: string | null;
  }) => {
    setRejectDialog({
      requestId: req.id,
      userName: req.userName,
      amount: req.amount,
      referenceNumber: req.referenceNumber,
      method: req.method,
    });
    setRejectReason(QUICK_REJECTION_REASONS[0].title);
  };

  const handleConfirmReject = () => {
    if (!rejectDialog) return;
    const reason = rejectReason.trim();
    if (!reason) {
      toast.error("يرجى اختيار أو كتابة سبب الرفض");
      return;
    }
    rejectMutation.mutate({ requestId: rejectDialog.requestId, reason });
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <Card className="overflow-hidden border border-amber-200 bg-white/95 p-5 shadow-xl shadow-blue-950/5 sm:p-7">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 p-3 text-white">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-950">إدارة طلبات شحن المحفظة</h2>
              {pendingCount > 0 && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-black text-amber-900 border border-amber-300">
                  {pendingCount} بانتظار الموافقة
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-600">
              مراجعة حوالات وسندات العملاء والموافقة الفورية لنزول الرصيد في محافظهم.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-bold">
            <button
              onClick={() => setFilter("pending")}
              className={`rounded-lg px-2.5 py-1 transition ${
                filter === "pending" ? "bg-amber-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              المعلقة
            </button>
            <button
              onClick={() => setFilter("approved")}
              className={`rounded-lg px-2.5 py-1 transition ${
                filter === "approved" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              المقبولة
            </button>
            <button
              onClick={() => setFilter("rejected")}
              className={`rounded-lg px-2.5 py-1 transition ${
                filter === "rejected" ? "bg-rose-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              المرفوضة
            </button>
            <button
              onClick={() => setFilter(undefined)}
              className={`rounded-lg px-2.5 py-1 transition ${
                filter === undefined ? "bg-[#07346d] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              الكل
            </button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-slate-600"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-amber-600" />
          <span className="mr-2 text-xs font-bold text-slate-500">جارٍ جلب طلبات الشحن…</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/40 p-8 text-center">
          <CreditCard className="mx-auto mb-2 h-8 w-8 text-amber-300" />
          <p className="font-black text-slate-700 text-sm">لا توجد طلبات شحن مطابقة حالياً</p>
          <p className="mt-1 text-xs text-slate-500">
            عندما يقوم أي عميل بطلب شحن محفظته من التطبيق، سيظهر طلبه هنا للمراجعة والموافقة بنقرة زر.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border p-4 transition ${
                item.status === "pending"
                  ? "border-amber-300 bg-amber-50/40 shadow-sm"
                  : item.status === "approved"
                  ? "border-emerald-200 bg-white"
                  : "border-slate-200 bg-slate-50 opacity-80"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`rounded-xl p-2.5 shrink-0 ${
                      item.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : item.status === "approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-slate-950 text-base">
                        {item.userName || "عميل"}
                      </p>
                      <span className="text-xs font-bold text-slate-500">
                        ({item.userEmail || "بدون بريد"})
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-black ${
                          item.status === "pending"
                            ? "bg-amber-200 text-amber-900"
                            : item.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {item.status === "pending"
                          ? "⏳ قيد الانتظار"
                          : item.status === "approved"
                          ? "✅ تم الشحن"
                          : "❌ مرفوض"}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                      <p>
                        <span className="font-bold text-slate-800">طريقة التحويل:</span> {item.method}
                      </p>
                      {item.referenceNumber && (
                        <p>
                          <span className="font-bold text-slate-800">رقم السند/الحوالة:</span>{" "}
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                            {item.referenceNumber}
                          </span>
                        </p>
                      )}
                      {item.senderName && (
                        <p>
                          <span className="font-bold text-slate-800">اسم المحول:</span> {item.senderName}
                        </p>
                      )}
                    </div>

                    {item.notes && (
                      <p className="mt-1 text-xs text-slate-500">
                        <span className="font-bold">ملاحظات العميل:</span> {item.notes}
                      </p>
                    )}
                    {item.adminNotes && (
                      <p className="mt-1 text-xs text-rose-700 font-bold">
                        ملاحظات الإدارة: {item.adminNotes}
                      </p>
                    )}

                    <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="h-3 w-3" />
                      {new Date(item.createdAt).toLocaleString("ar-YE")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 sm:shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-500">المبلغ المطلوب:</span>
                    <p className="text-2xl font-black text-amber-700 font-mono">
                      {parseFloat(item.amount).toLocaleString("ar-YE")} <span className="text-xs">ر.ي</span>
                    </p>
                  </div>

                  {item.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(item.id, item.amount, item.userName)}
                        disabled={approveMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700 font-black text-white text-xs h-9 px-3"
                      >
                        <CheckCircle2 className="ml-1 h-4 w-4" />
                        {approveMutation.isPending ? "جارٍ الشحن…" : "موافقة وإضافة الرصيد"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openRejectDialog(item)}
                        disabled={rejectMutation.isPending}
                        className="border-rose-200 text-rose-700 hover:bg-rose-50 text-xs h-9 px-2.5 cursor-pointer font-bold"
                      >
                        <XCircle className="ml-1 h-4 w-4" />
                        رفض
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Reject Dialog for Admin */}
      <Dialog open={Boolean(rejectDialog)} onOpenChange={(open) => !open && setRejectDialog(null)}>
        <DialogContent dir="rtl" className="max-w-md p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-right text-base font-black text-rose-950 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700 text-sm shadow-xs">
                ❌
              </span>
              <span>رفض طلب شحن المحفظة</span>
            </DialogTitle>
            <DialogDescription className="text-right text-xs text-slate-500">
              اختر سبباً سريعاً بنقرة واحدة أو اكتب ملاحظتك. سيصل التنبيه فوراً للعميل مع رقم الواتساب لمراسلتك.
            </DialogDescription>
          </DialogHeader>

          {rejectDialog && (
            <div className="space-y-4 my-2">
              {/* Summary Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">العميل:</span>
                  <span className="font-black text-slate-900">{rejectDialog.userName || "بدون اسم"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">المبلغ المطلوب:</span>
                  <span className="font-black font-mono text-amber-700">{parseFloat(rejectDialog.amount).toLocaleString("ar-YE")} ر.ي</span>
                </div>
                {rejectDialog.referenceNumber && (
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-500">رقم السند/الحوالة:</span>
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">{rejectDialog.referenceNumber}</span>
                  </div>
                )}
                {rejectDialog.method && (
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-500">طريقة التحويل:</span>
                    <span className="font-bold text-slate-800">{rejectDialog.method}</span>
                  </div>
                )}
              </div>

              {/* Quick Reason Pills */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-2">
                  ⚡ اختر سبب الرفض السريع (بلمسة واحدة):
                </label>
                <div className="flex flex-col gap-1.5">
                  {QUICK_REJECTION_REASONS.map((r) => {
                    const isSelected = rejectReason === r.title;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRejectReason(r.title)}
                        className={`text-right px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? "bg-rose-50 border-rose-400 text-rose-900 shadow-xs"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-sm shrink-0">{r.icon}</span>
                        <span className="flex-1 leading-snug">{r.title}</span>
                        {isSelected && <span className="text-rose-600 font-black text-xs shrink-0">✓ محدد</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Editable Reason Textarea */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  نص سبب الرفض الموجه للعميل (يمكنك التعديل عليه):
                </label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="اكتب أو اختر سبب الرفض…"
                  className="text-xs font-bold min-h-[70px] resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2 flex-row sm:justify-start">
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs h-10 cursor-pointer"
            >
              <XCircle className="ml-1.5 h-4 w-4" />
              {rejectMutation.isPending ? "جارٍ إرسال الرفض…" : "تأكيد رفض الطلب وإشعار العميل"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectDialog(null)}
              disabled={rejectMutation.isPending}
              className="text-xs font-bold h-10 cursor-pointer"
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
