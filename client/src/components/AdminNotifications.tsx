import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  Bell,
  CheckCheck,
  CreditCard,
  RefreshCw,
  ShoppingCart,
  UserPlus,
  Clock,
  ArrowLeft,
  LayoutGrid,
  ListFilter,
  Phone,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminNotifications() {
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<"split" | "topup_request" | "new_user" | "purchase" | "all">("split");

  const { data: notifications = [], isLoading, refetch, isFetching } =
    trpc.notifications.getAdminList.useQuery({ limit: 100 }, {
      refetchInterval: 8000, // poll every 8 seconds for live updates
    });

  const topupNotifications = notifications.filter((n) => n.type === "topup_request");
  const userNotifications = notifications.filter((n) => n.type === "new_user");
  const purchaseNotifications = notifications.filter((n) => n.type === "purchase");
  const otherNotifications = notifications.filter(
    (n) => !["topup_request", "new_user", "purchase"].includes(n.type)
  );

  const topupCount = topupNotifications.length;
  const userCount = userNotifications.length;
  const purchaseCount = purchaseNotifications.length;

  const markAllMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: async () => {
      await utils.notifications.getAdminList.invalidate();
      toast.success("تم تحديد جميع الإشعارات كمقروءة");
    },
  });

  const markOneMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: async () => {
      await utils.notifications.getAdminList.invalidate();
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const unreadTopups = topupNotifications.filter((n) => !n.isRead).length;
  const unreadUsers = userNotifications.filter((n) => !n.isRead).length;
  const unreadPurchases = purchaseNotifications.filter((n) => !n.isRead).length;

  const parseData = (dataStr: string | null) => {
    if (!dataStr) return null;
    try {
      return JSON.parse(dataStr);
    } catch {
      return null;
    }
  };

  const getFilteredList = () => {
    switch (activeTab) {
      case "topup_request":
        return topupNotifications;
      case "new_user":
        return userNotifications;
      case "purchase":
        return purchaseNotifications;
      case "all":
      default:
        return notifications;
    }
  };

  return (
    <Card className="overflow-hidden border border-slate-200 bg-white/95 p-5 shadow-xl shadow-blue-950/5 sm:p-7">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative rounded-2xl bg-[#04162f] p-3 text-amber-300 shadow-md">
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-950">مركز الإشعارات والأنشطة المصنفة</h2>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-black text-rose-800">
                  {unreadCount} جديد
                </span>
              ) : (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800">
                  كل شيء محدث
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-600">
              تم تصنيف إشعارات شحن المحفظة، فتح الحسابات، ومبيعات الكروت في أقسام مستقلة لسهولة المتابعة الفورية.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="text-xs font-bold text-slate-700"
            >
              <CheckCheck className="ml-1 h-3.5 w-3.5 text-blue-600" />
              تحديد الكل كمقروء
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-slate-600"
            title="تحديث فوري"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Category Tabs / Mode Selector */}
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-2 text-xs font-black">
        {/* Split View Mode (Default & User Requested) */}
        <button
          type="button"
          onClick={() => setActiveTab("split")}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition cursor-pointer ${
            activeTab === "split"
              ? "bg-[#04162f] text-white shadow-md"
              : "text-slate-700 hover:bg-white hover:text-slate-950"
          }`}
        >
          <LayoutGrid className="h-4 w-4 text-amber-300" />
          <span>عرض مقسم (كل صنف على جنب)</span>
          <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] text-amber-200">
            موصى به
          </span>
        </button>

        {/* Top-up Requests Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("topup_request")}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition cursor-pointer ${
            activeTab === "topup_request"
              ? "bg-amber-500 text-slate-950 shadow-md font-black"
              : "text-amber-900 hover:bg-amber-100/70"
          }`}
        >
          <CreditCard className="h-4 w-4 text-amber-800" />
          <span>شحن المحفظة فقط</span>
          {topupCount > 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                activeTab === "topup_request"
                  ? "bg-slate-950 text-amber-300"
                  : "bg-amber-200 text-amber-950"
              }`}
            >
              {topupCount}
              {unreadTopups > 0 && ` (${unreadTopups} جديد)`}
            </span>
          )}
        </button>

        {/* New User Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("new_user")}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition cursor-pointer ${
            activeTab === "new_user"
              ? "bg-blue-600 text-white shadow-md font-black"
              : "text-blue-900 hover:bg-blue-100/70"
          }`}
        >
          <UserPlus className="h-4 w-4" />
          <span>فتح الحسابات فقط</span>
          {userCount > 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                activeTab === "new_user"
                  ? "bg-white/20 text-white"
                  : "bg-blue-200 text-blue-950"
              }`}
            >
              {userCount}
              {unreadUsers > 0 && ` (${unreadUsers} جديد)`}
            </span>
          )}
        </button>

        {/* Purchases Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("purchase")}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition cursor-pointer ${
            activeTab === "purchase"
              ? "bg-emerald-600 text-white shadow-md font-black"
              : "text-emerald-900 hover:bg-emerald-100/70"
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          <span>شراء الكروت فقط</span>
          {purchaseCount > 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                activeTab === "purchase"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-200 text-emerald-950"
              }`}
            >
              {purchaseCount}
              {unreadPurchases > 0 && ` (${unreadPurchases} جديد)`}
            </span>
          )}
        </button>

        {/* All Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 transition cursor-pointer mr-auto ${
            activeTab === "all"
              ? "bg-slate-700 text-white shadow-md"
              : "text-slate-600 hover:bg-white"
          }`}
        >
          <ListFilter className="h-4 w-4" />
          <span>سجل الكل ({notifications.length})</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-7 w-7 animate-spin text-blue-600" />
          <span className="mr-3 text-sm font-bold text-slate-600">جارٍ تحميل الإشعارات…</span>
        </div>
      ) : activeTab === "split" ? (
        /* ========================================================
           SPLIT VIEW: 3 DEDICATED COLUMNS (SIDE-BY-SIDE)
           1. Top-Up Requests (Amber)
           2. New User Accounts (Blue)
           3. Card Purchases (Emerald)
           ======================================================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* COLUMN 1: TOP-UP REQUESTS */}
          <div className="flex flex-col rounded-2xl border-2 border-amber-300 bg-amber-50/30 p-4 shadow-sm">
            <div className="mb-3.5 flex items-center justify-between border-b border-amber-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-amber-500 p-2 text-slate-950 shadow-sm">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-amber-950 text-sm">طلبات شحن المحفظة</h3>
                  <p className="text-[11px] font-semibold text-amber-800">حوالات وسندات الشحن</p>
                </div>
              </div>
              <span className="rounded-full bg-amber-200 border border-amber-300 px-2.5 py-0.5 text-xs font-black text-amber-950">
                {topupCount} طلب
              </span>
            </div>

            {topupNotifications.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-amber-200 bg-white/60 p-6 text-center">
                <CreditCard className="h-8 w-8 text-amber-300 mb-2" />
                <p className="text-xs font-bold text-amber-900">لا توجد طلبات شحن معلقة</p>
                <p className="text-[11px] text-amber-700/80 mt-1">ستصلك هنا إشعارات الحوالات والسندات فور إرسالها من الزبون.</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                {topupNotifications.map((item) => {
                  const meta = parseData(item.data);
                  return (
                    <div
                      key={item.id}
                      onClick={() => !item.isRead && markOneMutation.mutate({ id: item.id })}
                      className={`group relative rounded-xl border p-3 transition shadow-xs cursor-pointer ${
                        item.isRead
                          ? "border-amber-200/80 bg-white/90 hover:bg-white"
                          : "border-amber-400 bg-amber-100/60 hover:bg-amber-100/90 shadow-sm ring-1 ring-amber-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-black text-amber-950 text-xs">
                          <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                          <span>{item.title}</span>
                        </div>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                          <Clock className="h-3 w-3" />
                          {new Date(item.createdAt).toLocaleTimeString("ar-YE", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <p className="mt-1.5 text-xs leading-relaxed text-slate-800 font-medium">
                        {item.content}
                      </p>

                      {meta && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                          {meta.amount && (
                            <span className="rounded-lg bg-amber-200 px-2 py-0.5 font-black text-amber-950">
                              💰 {meta.amount} ر.ي
                            </span>
                          )}
                          {meta.method && (
                            <span className="rounded-lg bg-white px-2 py-0.5 font-bold text-slate-700 border border-slate-200">
                              🏦 {meta.method}
                            </span>
                          )}
                          {meta.referenceNumber && (
                            <span className="rounded-lg bg-white px-2 py-0.5 font-bold text-slate-700 border border-slate-200">
                              سند: {meta.referenceNumber}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById("admin-topup-requests")?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 px-2.5 py-1 text-[11px] font-black transition cursor-pointer shadow-xs"
                        >
                          <span>الانتقال لاعتماد الشحن</span>
                          <ArrowLeft className="h-3 w-3" />
                        </button>
                        {!item.isRead && (
                          <span className="text-[10px] font-bold text-amber-800">جديد غير مقروء</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* COLUMN 2: NEW USER ACCOUNTS */}
          <div className="flex flex-col rounded-2xl border-2 border-blue-300 bg-blue-50/30 p-4 shadow-sm">
            <div className="mb-3.5 flex items-center justify-between border-b border-blue-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-blue-600 p-2 text-white shadow-sm">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-blue-950 text-sm">إشعارات فتح الحسابات</h3>
                  <p className="text-[11px] font-semibold text-blue-800">انضمام العملاء الجدد</p>
                </div>
              </div>
              <span className="rounded-full bg-blue-200 border border-blue-300 px-2.5 py-0.5 text-xs font-black text-blue-950">
                {userCount} عميل
              </span>
            </div>

            {userNotifications.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-white/60 p-6 text-center">
                <UserPlus className="h-8 w-8 text-blue-300 mb-2" />
                <p className="text-xs font-bold text-blue-900">لا توجد حسابات جديدة حالياً</p>
                <p className="text-[11px] text-blue-700/80 mt-1">ستظهر هنا تفاصيل أي عميل جديد ينشئ حسابه في التطبيق فوراً.</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                {userNotifications.map((item) => {
                  const meta = parseData(item.data);
                  return (
                    <div
                      key={item.id}
                      onClick={() => !item.isRead && markOneMutation.mutate({ id: item.id })}
                      className={`group relative rounded-xl border p-3 transition shadow-xs cursor-pointer ${
                        item.isRead
                          ? "border-blue-200/80 bg-white/90 hover:bg-white"
                          : "border-blue-400 bg-blue-100/60 hover:bg-blue-100/90 shadow-sm ring-1 ring-blue-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-black text-blue-950 text-xs">
                          <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
                          <span>{item.title}</span>
                        </div>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                          <Clock className="h-3 w-3" />
                          {new Date(item.createdAt).toLocaleTimeString("ar-YE", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <p className="mt-1.5 text-xs leading-relaxed text-slate-800 font-medium">
                        {item.content}
                      </p>

                      {meta && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                          {meta.name && (
                            <span className="rounded-lg bg-blue-200 px-2 py-0.5 font-black text-blue-950">
                              👤 {meta.name}
                            </span>
                          )}
                          {meta.phone && (
                            <span className="rounded-lg bg-white px-2 py-0.5 font-bold text-slate-700 border border-slate-200 flex items-center gap-1">
                              <Phone className="h-3 w-3 text-blue-600" />
                              <span dir="ltr">{meta.phone}</span>
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-2.5 pt-2 border-t border-blue-200/60 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById("admin-customers-manager")?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-900 px-2.5 py-1 text-[11px] font-black transition cursor-pointer"
                        >
                          <span>عرض في دليل العملاء</span>
                          <ArrowLeft className="h-3 w-3" />
                        </button>
                        {!item.isRead && (
                          <span className="text-[10px] font-bold text-blue-800">جديد غير مقروء</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* COLUMN 3: CARD PURCHASES */}
          <div className="flex flex-col rounded-2xl border-2 border-emerald-300 bg-emerald-50/30 p-4 shadow-sm">
            <div className="mb-3.5 flex items-center justify-between border-b border-emerald-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-emerald-600 p-2 text-white shadow-sm">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-emerald-950 text-sm">مبيعات وشراء الكروت</h3>
                  <p className="text-[11px] font-semibold text-emerald-800">كروت الإنترنت المباعة</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-200 border border-emerald-300 px-2.5 py-0.5 text-xs font-black text-emerald-950">
                {purchaseCount} كرت
              </span>
            </div>

            {purchaseNotifications.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-emerald-200 bg-white/60 p-6 text-center">
                <ShoppingCart className="h-8 w-8 text-emerald-300 mb-2" />
                <p className="text-xs font-bold text-emerald-900">لا توجد عمليات شراء كروت حالياً</p>
                <p className="text-[11px] text-emerald-700/80 mt-1">ستظهر هنا تفاصيل أي كرت يتم شراؤه وتوليده فوراً في الميكروتك.</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                {purchaseNotifications.map((item) => {
                  const meta = parseData(item.data);
                  return (
                    <div
                      key={item.id}
                      onClick={() => !item.isRead && markOneMutation.mutate({ id: item.id })}
                      className={`group relative rounded-xl border p-3 transition shadow-xs cursor-pointer ${
                        item.isRead
                          ? "border-emerald-200/80 bg-white/90 hover:bg-white"
                          : "border-emerald-400 bg-emerald-100/60 hover:bg-emerald-100/90 shadow-sm ring-1 ring-emerald-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-black text-emerald-950 text-xs">
                          <span className="inline-block h-2 w-2 rounded-full bg-emerald-600" />
                          <span>{item.title}</span>
                        </div>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                          <Clock className="h-3 w-3" />
                          {new Date(item.createdAt).toLocaleTimeString("ar-YE", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <p className="mt-1.5 text-xs leading-relaxed text-slate-800 font-medium">
                        {item.content}
                      </p>

                      {meta && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                          {meta.packageName && (
                            <span className="rounded-lg bg-emerald-200 px-2 py-0.5 font-black text-emerald-950">
                              📦 {meta.packageName}
                            </span>
                          )}
                          {meta.price && (
                            <span className="rounded-lg bg-white px-2 py-0.5 font-black text-emerald-800 border border-slate-200">
                              💰 {meta.price} ر.ي
                            </span>
                          )}
                          {meta.pinCode && (
                            <span className="rounded-lg bg-slate-900 text-amber-300 px-2 py-0.5 font-mono font-bold tracking-wider">
                              PIN: {meta.pinCode}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          تم التوليد بنجاح
                        </span>
                        {!item.isRead && (
                          <span className="text-[10px] font-bold text-emerald-800">جديد غير مقروء</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================
           FILTERED OR COMBINED LIST VIEW
           ======================================================== */
        <div className="space-y-3">
          {getFilteredList().length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
              <Bell className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p className="font-black text-slate-700 text-sm">
                لا توجد إشعارات في هذا الصنف حالياً
              </p>
            </div>
          ) : (
            getFilteredList().map((item) => {
              const meta = parseData(item.data);
              const isTopup = item.type === "topup_request";
              const isUser = item.type === "new_user";
              const isPurchase = item.type === "purchase";

              return (
                <div
                  key={item.id}
                  onClick={() => !item.isRead && markOneMutation.mutate({ id: item.id })}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 transition cursor-pointer ${
                    item.isRead
                      ? "border-slate-100 bg-slate-50/50 hover:bg-slate-50"
                      : isTopup
                      ? "border-amber-300 bg-amber-50/60 hover:bg-amber-50 shadow-sm ring-1 ring-amber-300"
                      : isUser
                      ? "border-blue-300 bg-blue-50/60 hover:bg-blue-50 shadow-sm ring-1 ring-blue-300"
                      : isPurchase
                      ? "border-emerald-300 bg-emerald-50/60 hover:bg-emerald-50 shadow-sm ring-1 ring-emerald-300"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`rounded-xl border p-2 shrink-0 ${
                        isTopup
                          ? "bg-amber-100 text-amber-900 border-amber-300"
                          : isUser
                          ? "bg-blue-100 text-blue-900 border-blue-300"
                          : isPurchase
                          ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                          : "bg-slate-100 text-slate-800 border-slate-200"
                      }`}
                    >
                      {isTopup ? (
                        <CreditCard className="h-5 w-5" />
                      ) : isUser ? (
                        <UserPlus className="h-5 w-5" />
                      ) : isPurchase ? (
                        <ShoppingCart className="h-5 w-5" />
                      ) : (
                        <Bell className="h-5 w-5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-slate-950 text-sm">{item.title}</p>
                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                          <Clock className="h-3 w-3" />
                          {new Date(item.createdAt).toLocaleTimeString("ar-YE", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          · {new Date(item.createdAt).toLocaleDateString("ar-YE")}
                        </span>
                        {!item.isRead && (
                          <span className="rounded-full bg-rose-500 px-2 py-0.2 text-[10px] font-black text-white">
                            جديد
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-700 font-medium">
                        {item.content}
                      </p>

                      {meta && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          {meta.amount && (
                            <span className="rounded-md bg-amber-100 px-2 py-0.5 font-black text-amber-900">
                              💰 {meta.amount} ر.ي
                            </span>
                          )}
                          {meta.method && (
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-800">
                              🏦 {meta.method}
                            </span>
                          )}
                          {meta.packageName && (
                            <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-black text-emerald-900">
                              📦 {meta.packageName}
                            </span>
                          )}
                          {meta.pinCode && (
                            <span className="rounded-md bg-slate-900 text-amber-300 px-2 py-0.5 font-mono font-bold">
                              PIN: {meta.pinCode}
                            </span>
                          )}
                          {meta.phone && (
                            <span className="rounded-md bg-blue-100 px-2 py-0.5 font-bold text-blue-900" dir="ltr">
                              📞 {meta.phone}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {isTopup && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById("admin-topup-requests")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 text-xs font-black transition cursor-pointer shadow-xs"
                    >
                      <span>الانتقال للاعتماد</span>
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </Card>
  );
}
