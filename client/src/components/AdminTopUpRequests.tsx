import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminTopUpRequests() {
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | undefined>("pending");

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
      toast.info("تم رفض الطلب وإرسال التنبيه للعميل");
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

  const handleReject = (id: number) => {
    const reason = prompt("يرجى كتابة سبب الرفض للعميل (مثلاً: لم تصل الحوالة / رقم السند غير صحيح):");
    if (reason && reason.trim()) {
      rejectMutation.mutate({ requestId: id, reason: reason.trim() });
    }
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
                        onClick={() => handleReject(item.id)}
                        disabled={rejectMutation.isPending}
                        className="border-rose-200 text-rose-700 hover:bg-rose-50 text-xs h-9 px-2.5"
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
    </Card>
  );
}
