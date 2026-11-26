import { useState, useMemo } from "react";
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
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState<number>(20);

  // Available unique methods from data
  const availableMethods = useMemo(() => {
    const set = new Set<string>();
    recentDeposits.forEach((r) => {
      if (r.method) set.add(r.method);
    });
    return Array.from(set);
  }, [recentDeposits]);

  // Filtered deposits
  const filteredDeposits = useMemo(() => {
    return recentDeposits.filter((dep) => {
      if (selectedMethod !== "all" && dep.method !== selectedMethod) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const nameMatch = dep.userName?.toLowerCase().includes(q);
        const phoneMatch = dep.userPhone?.toLowerCase().includes(q);
        const refMatch = dep.referenceNumber?.toLowerCase().includes(q);
        const methodMatch = dep.method?.toLowerCase().includes(q);
        const senderMatch = dep.senderName?.toLowerCase().includes(q);
        if (!nameMatch && !phoneMatch && !refMatch && !methodMatch && !senderMatch) {
          return false;
        }
      }
      return true;
    });
  }, [recentDeposits, selectedMethod, searchQuery]);

  // Total amount of filtered deposits
  const filteredTotal = useMemo(() => {
    return filteredDeposits.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  }, [filteredDeposits]);

  const displayedDeposits = useMemo(() => {
    return filteredDeposits.slice(0, visibleCount);
  }, [filteredDeposits, visibleCount]);

  const exportToCsv = () => {
    if (filteredDeposits.length === 0) {
      toast.error("لا توجد عمليات للتصدير في هذه الفترة");
      return;
    }
    const headers = [
      "م",
      "التاريخ والوقت",
      "اسم العميل",
      "رقم الهاتف",
      "طريقة الدفع",
      "رقم السند/الإشعار",
      "المبلغ المودع (ر.ي)",
    ];
    const rows = filteredDeposits.map((dep, idx) => [
      idx + 1,
      `"${new Date(dep.createdAt).toLocaleString("ar-YE")}"`,
      `"${(dep.userName || "عميل").replace(/"/g, '""')}"`,
      `"${(dep.userPhone || "").replace(/"/g, '""')}"`,
      `"${dep.method.replace(/"/g, '""')}"`,
      `"${(dep.referenceNumber || "").replace(/"/g, '""')}"`,
      dep.amount,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `كشف_إيداعات_الشامل_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("تم تصدير كشف العمليات بنجاح (جاهز لبرنامج Excel)");
  };

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

      {/* Approved Deposits Table Section */}
      <div className="mt-8 border-t border-slate-200/80 pt-6">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="flex items-center gap-2 text-base font-black text-slate-950">
                <Receipt className="h-5 w-5 text-emerald-700" />
                سجل كافة الإيداعات المعتمدة في الصندوق
              </h3>
              <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-xs font-black text-emerald-900">
                تقرير {periodLabel}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              عرض كامل لجميع العمليات المودعة والمعتمدة في حسابك مع البحث والفرز وتصدير كشف Excel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-black text-emerald-900">
              <span>الإجمالي:</span>
              <span className="font-mono text-sm">{formatMoney(filteredTotal)}</span>
              <span>ر.ي</span>
              <span className="text-[11px] font-bold text-emerald-700">({filteredDeposits.length} عملية)</span>
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={exportToCsv}
              className="border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-bold gap-1.5"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              تصدير كشف (Excel)
            </Button>
          </div>
        </div>

        {/* Search & Method Filter Bar */}
        <div className="mb-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث باسم العميل، الهاتف، رقم السند..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-9 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
            <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute left-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">جميع قنوات الدفع ({recentDeposits.length})</option>
              {availableMethods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1 sm:col-span-2 lg:col-span-1">
            <span>
              عرض {displayedDeposits.length} من أصل {filteredDeposits.length} عملية
            </span>
            {filteredDeposits.length > 20 && (
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => (prev >= filteredDeposits.length ? 20 : filteredDeposits.length))}
                className="text-emerald-700 hover:underline font-black cursor-pointer"
              >
                {visibleCount >= filteredDeposits.length ? "عرض أول 20 فقط" : `عرض الكل (${filteredDeposits.length})`}
              </button>
            )}
          </div>
        </div>

        {filteredDeposits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-xs font-bold text-slate-500">
            {searchQuery || selectedMethod !== "all"
              ? "لا توجد عمليات إيداع مطابقة لخيارات البحث المحددة."
              : `لا توجد عمليات إيداع معتمدة مسجلة ضمن (${periodLabel}). ستظهر هنا كل العمليات فور اعتمادها.`}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-slate-200 bg-slate-100/80 text-slate-700 font-black">
                <tr>
                  <th className="p-3 w-10 text-center">#</th>
                  <th className="p-3">تاريخ وتوقيت الإيداع</th>
                  <th className="p-3">العميل</th>
                  <th className="p-3">طريقة الدفع</th>
                  <th className="p-3">رقم السند / الإشعار</th>
                  <th className="p-3 text-left">المبلغ المودع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedDeposits.map((dep, idx) => {
                  const isBank = dep.method.includes("بنك") || dep.method.includes("الشمول");
                  const isCash = dep.method.includes("كاش");
                  return (
                    <tr key={dep.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="p-3 font-mono text-slate-700">
                        {new Date(dep.createdAt).toLocaleString("ar-YE")}
                      </td>
                      <td className="p-3">
                        <p className="font-black text-slate-950">{dep.userName || "عميل"}</p>
                        {dep.userPhone && (
                          <p className="font-mono text-[11px] text-slate-500">{dep.userPhone}</p>
                        )}
                        {dep.senderName && dep.senderName !== dep.userName && (
                          <p className="text-[10px] text-slate-400">المحول: {dep.senderName}</p>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 font-bold ${
                            isBank
                              ? "bg-blue-50 text-blue-900 border border-blue-200"
                              : isCash
                              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          <span>{isBank ? "🏦" : isCash ? "💵" : "🔄"}</span>
                          <span>{dep.method}</span>
                        </span>
                      </td>
                      <td className="p-3">
                        {dep.referenceNumber ? (
                          <button
                            type="button"
                            onClick={() => handleCopy(dep.referenceNumber!)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono font-bold text-slate-700 hover:border-emerald-400 hover:bg-emerald-50/50 cursor-pointer transition"
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Show More / Show All Controls */}
        {filteredDeposits.length > displayedDeposits.length && (
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 border border-slate-200">
            <span className="text-xs font-bold text-slate-600">
              يتم حالياً عرض {displayedDeposits.length} عملية من أصل {filteredDeposits.length} عملية في تقرير ({periodLabel})
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((prev) => prev + 25)}
                className="text-xs font-bold border-slate-300"
              >
                <ChevronDown className="h-3.5 w-3.5 ml-1" />
                عرض المزيد (+25 عملية)
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setVisibleCount(filteredDeposits.length)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black"
              >
                عرض كل العمليات ({filteredDeposits.length})
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
