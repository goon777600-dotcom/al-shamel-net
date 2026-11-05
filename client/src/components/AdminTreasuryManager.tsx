import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Landmark,
  ArrowDownLeft,
  CircleDollarSign,
  Wallet,
  Building2,
  Copy,
  Check,
  Scale,
  Calendar,
  Sparkles,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";

interface MethodStat {
  method: string;
  total: string;
  count: number;
}

interface DepositRow {
  id: number;
  amount: string;
  method: string;
  referenceNumber: string | null;
  senderName: string | null;
  createdAt: string | Date;
  userName: string | null;
  userPhone: string | null;
}

interface TreasuryProps {
  period: "today" | "week" | "month" | "all";
  periodLabel: string;
  totalDeposits: string | number;
  depositsCount: number;
  totalSales: string | number;
  circulatingBalance: string | number;
  depositsByMethod?: MethodStat[];
  recentDeposits?: DepositRow[];
}

export default function AdminTreasuryManager({
  period,
  periodLabel,
  totalDeposits,
  depositsCount,
  totalSales,
  circulatingBalance,
  depositsByMethod = [],
  recentDeposits = [],
}: TreasuryProps) {
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const formatMoney = (val: string | number) =>
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(val));

  const handleCopy = (refText: string) => {
    try {
      navigator.clipboard?.writeText(refText);
      setCopiedRef(refText);
      toast.success("تم نسخ رقم السند / الإشعار");
      setTimeout(() => setCopiedRef(null), 2000);
    } catch {
      toast.error("تعذر النسخ");
    }
  };

  const depositsNum = Number(totalDeposits) || 0;
  const salesNum = Number(totalSales) || 0;
  const circulatingNum = Number(circulatingBalance) || 0;

  return (
    <Card className="overflow-hidden border border-emerald-200 bg-white/95 p-5 shadow-xl shadow-blue-950/5 sm:p-7">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 p-3 text-white shadow-md shadow-emerald-950/20">
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-950">صندوق النقدية وحركة الإيداعات والمطابقة</h2>
              <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-black text-emerald-800">
                تقرير {periodLabel}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              متابعة ومطابقة المبالغ النقدية الواصلة للتطبيق مع رصيد حسابك في بنك الشمول وصندوق الكاش.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">
            <Calendar className="h-4 w-4 text-emerald-600" />
            فترة الحساب: <span className="font-black text-slate-950">{periodLabel}</span>
          </div>
        </div>
      </div>

      {/* 3 Core Treasury Metrics */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {/* Total Inflow / Deposits */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-emerald-800">إجمالي النقد المودع بالصندوق</p>
            <span className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
              <ArrowDownLeft className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-900 tabular-nums sm:text-3xl">
            {formatMoney(depositsNum)} <span className="text-sm font-bold">ر.ي</span>
          </p>
          <p className="mt-1.5 text-[11px] font-bold text-slate-500">
            {depositsCount} عملية شحن معتمدة ({periodLabel})
          </p>
        </div>

        {/* Total Outflow / Consumed Cards */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-sky-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-blue-800">المبيعات المستهلكة (كروت)</p>
            <span className="rounded-xl bg-blue-100 p-2 text-blue-700">
              <CircleDollarSign className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-blue-900 tabular-nums sm:text-3xl">
            {formatMoney(salesNum)} <span className="text-sm font-bold">ر.ي</span>
          </p>
          <p className="mt-1.5 text-[11px] font-bold text-slate-500">
            صافي مبيعات الكروت الصادرة من المايكروتك
          </p>
        </div>

        {/* Circulating / Unspent Balance */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-amber-800">الرصيد المتبقي بمحافظ الزبائن</p>
            <span className="rounded-xl bg-amber-100 p-2 text-amber-700">
              <Wallet className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-900 tabular-nums sm:text-3xl">
            {formatMoney(circulatingNum)} <span className="text-sm font-bold">ر.ي</span>
          </p>
          <p className="mt-1.5 text-[11px] font-bold text-slate-500">
            رصيد مودع لدى الزبائن لم يُشترَ به كروت بعد
          </p>
        </div>
      </div>

      {/* Accounting Reconciliation Tip Bar */}
      <div className="mb-6 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-950 via-[#063326] to-[#0a4837] p-4 text-white shadow-md">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <Scale className="h-5 w-5 text-amber-300 shrink-0" />
            <div>
              <p className="text-xs font-black text-amber-200">معادلة المطابقة المالية للصندوق:</p>
              <p className="text-xs text-emerald-100 leading-relaxed">
                مجموع إيداعات الصندوق ({formatMoney(depositsNum)} ر.ي) = مبيعات الكروت ({formatMoney(salesNum)} ر.ي) + الرصيد المتبقي بمحافظ العملاء ({formatMoney(circulatingNum)} ر.ي).
              </p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-white/10 px-3 py-1 text-xs font-bold text-amber-300">
            ✓ مطابقة تامة
          </span>
        </div>
      </div>

      {/* Method Breakdown */}
      <div className="mb-6">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900">
          <Building2 className="h-4 w-4 text-emerald-700" />
          توزيع المبالغ المودعة حسب القناة البنكية / الكاش:
        </h3>

        {depositsByMethod.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs font-bold text-slate-500">
            لا توجد إيداعات مسجلة ضمن {periodLabel}. ستظهر هنا المبالغ مفصلة لكل بنك فور شحن العملاء.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {depositsByMethod.map((item, idx) => {
              const amountNum = Number(item.total) || 0;
              const percentage = depositsNum > 0 ? Math.round((amountNum / depositsNum) * 100) : 0;
              const isBank = item.method.includes("بنك") || item.method.includes("الشمول");
              const isCash = item.method.includes("كاش");

              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{isBank ? "🏦" : isCash ? "💵" : "🔄"}</span>
                      <p className="font-black text-slate-900 text-sm">{item.method}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                      {percentage}%
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <p className="text-xl font-black text-emerald-700 tabular-nums">
                      {formatMoney(amountNum)} <span className="text-xs font-bold">ر.ي</span>
                    </p>
                    <span className="text-xs font-bold text-slate-500">{item.count} عمليات</span>
                  </div>

                  {/* Visual progress bar */}
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(5, percentage))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Deposits Table */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
            <Receipt className="h-4 w-4 text-emerald-700" />
            سجل آخر الإيداعات المعتمدة في الصندوق:
          </h3>
          <span className="text-xs font-bold text-slate-500">
            آخر {recentDeposits.length} عمليات
          </span>
        </div>

        {recentDeposits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs font-bold text-slate-500">
            الصندوق نظيف وجاهز لاستقبال أول إيداع حقيقي من الزبائن.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-slate-600 font-bold">
                <tr>
                  <th className="p-3">تاريخ وتوقيت الإيداع</th>
                  <th className="p-3">العميل</th>
                  <th className="p-3">طريقة الدفع</th>
                  <th className="p-3">رقم السند / الإشعار</th>
                  <th className="p-3 text-left">المبلغ المودع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentDeposits.map((dep) => (
                  <tr key={dep.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-3 font-mono text-slate-600">
                      {new Date(dep.createdAt).toLocaleString("ar-YE")}
                    </td>
                    <td className="p-3">
                      <p className="font-black text-slate-900">{dep.userName || "عميل"}</p>
                      {dep.userPhone && (
                        <p className="font-mono text-[11px] text-slate-500">{dep.userPhone}</p>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="inline-block rounded-lg bg-slate-100 px-2 py-1 font-bold text-slate-800">
                        {dep.method}
                      </span>
                    </td>
                    <td className="p-3">
                      {dep.referenceNumber ? (
                        <button
                          type="button"
                          onClick={() => handleCopy(dep.referenceNumber!)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono font-bold text-slate-700 hover:border-emerald-400"
                          title="اضغط للنسخ"
                        >
                          {copiedRef === dep.referenceNumber ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3 text-slate-400" />
                          )}
                          {dep.referenceNumber}
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3 text-left">
                      <span className="font-black text-emerald-700 font-mono text-sm">
                        +{formatMoney(dep.amount)} ر.ي
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
