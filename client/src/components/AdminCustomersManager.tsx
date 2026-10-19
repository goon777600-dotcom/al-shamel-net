import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  Ban,
  CheckCircle,
  Clock,
  CreditCard,
  Phone,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminCustomersManager() {
  const utils = trpc.useUtils();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked">("all");

  const { data: users = [], isLoading, refetch, isFetching } = trpc.usersAdmin.list.useQuery();

  const deleteMutation = trpc.usersAdmin.delete.useMutation({
    onSuccess: (res) => {
      toast.success(res.message);
      void utils.usersAdmin.list.invalidate();
      void utils.admin.overview.invalidate();
      void utils.notifications.getAdminList.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "تعذر إزالة العميل");
    },
  });

  const blockMutation = trpc.usersAdmin.setBlockStatus.useMutation({
    onSuccess: (res) => {
      toast.success(res.message);
      void utils.usersAdmin.list.invalidate();
      void utils.notifications.getAdminList.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "تعذر تعديل حالة العميل");
    },
  });

  const handleDelete = (id: number, name: string | null) => {
    const confirmed = confirm(
      `⚠️ هل أنت متأكد تماماً من إزالة العميل (${name || "المحدد"}) نهائياً؟\nسيتم حذف حسابه وكافة عملياته وسجلاته من النظام.`
    );
    if (confirmed) {
      deleteMutation.mutate({ userId: id });
    }
  };

  const handleToggleBlock = (id: number, currentStatus: string, name: string | null) => {
    const isCurrentlyBlocked = currentStatus === "blocked";
    const nextStatus = isCurrentlyBlocked ? "active" : "blocked";
    const actionLabel = isCurrentlyBlocked ? "فك الحظر عن" : "حظر";

    const confirmed = confirm(`هل أنت متأكد من ${actionLabel} العميل (${name || "المحدد"})؟`);
    if (confirmed) {
      blockMutation.mutate({ userId: id, status: nextStatus });
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ? true : u.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = users.filter((u) => u.status === "active").length;
  const blockedCount = users.filter((u) => u.status === "blocked").length;

  return (
    <Card className="overflow-hidden border border-blue-200 bg-white/95 p-5 shadow-xl shadow-blue-950/5 sm:p-7">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[#04162f] p-3 text-amber-300">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-950">إدارة ودليل العملاء</h2>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-black text-blue-800">
                {users.length} حساب
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              متابعة جميع حسابات العملاء المسجلين، الرصيد، حظر الحسابات المشبوهة، أو إزالتها نهائياً.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

      {/* Search and Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم العميل أو رقم الهاتف أو البريد…"
            className="h-10 pr-9 text-xs font-bold"
          />
          <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
        </div>

        <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-bold">
          <button
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-3 py-1.5 transition ${
              statusFilter === "all" ? "bg-[#07346d] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            الكل ({users.length})
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`rounded-lg px-3 py-1.5 transition ${
              statusFilter === "active" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            النشطين ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter("blocked")}
            className={`rounded-lg px-3 py-1.5 transition ${
              statusFilter === "blocked" ? "bg-rose-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            المحظورين ({blockedCount})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="mr-2 text-xs font-bold text-slate-500">جارٍ تحميل دليل العملاء…</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />
          <p className="font-black text-slate-700 text-sm">لا يوجد عملاء مطابقين للبحث</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((u) => {
            const isAdmin = u.role === "admin" || u.email === "nabel7720079495@gmail.com";
            const isBlocked = u.status === "blocked";

            return (
              <div
                key={u.id}
                className={`rounded-2xl border p-4 transition ${
                  isBlocked
                    ? "border-rose-200 bg-rose-50/50"
                    : isAdmin
                    ? "border-amber-200 bg-amber-50/30"
                    : "border-slate-200 bg-white hover:border-blue-200"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* User info */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`rounded-2xl p-2.5 shrink-0 ${
                        isBlocked
                          ? "bg-rose-100 text-rose-700"
                          : isAdmin
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {isBlocked ? (
                        <UserX className="h-5 w-5" />
                      ) : isAdmin ? (
                        <ShieldCheck className="h-5 w-5" />
                      ) : (
                        <UserCheck className="h-5 w-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-slate-950 text-base">{u.name || "عميل بدون اسم"}</p>
                        {isAdmin && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-900 border border-amber-300">
                            👑 مدير النظام
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                            isBlocked ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {isBlocked ? "🚫 محظور" : "✅ نشط"}
                        </span>
                      </div>

                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                        {u.email && (
                          <p className="flex items-center gap-1 font-mono text-slate-800 font-bold">
                            {u.email.includes("@") ? "📧 " : "📱 "}
                            {u.email}
                          </p>
                        )}
                        <p>
                          <span className="font-bold">رصيد المحفظة:</span>{" "}
                          <span className="font-black text-emerald-700 font-mono">{u.balance} ر.ي</span>
                        </p>
                        <p>
                          <span className="font-bold">الكروت المشتراة:</span>{" "}
                          <span className="font-bold text-blue-700">{u.totalPurchases} كرت</span>
                        </p>
                        <p className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          انضم: {new Date(u.createdAt).toLocaleDateString("ar-YE")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions (Only for non-admin accounts) */}
                  {!isAdmin ? (
                    <div className="flex items-center gap-2 sm:shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleBlock(u.id, u.status || "active", u.name)}
                        disabled={blockMutation.isPending}
                        className={`h-9 px-3 text-xs font-bold ${
                          isBlocked
                            ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            : "border-amber-300 text-amber-800 hover:bg-amber-50"
                        }`}
                      >
                        {isBlocked ? (
                          <>
                            <CheckCircle className="ml-1 h-3.5 w-3.5 text-emerald-600" /> فك الحظر
                          </>
                        ) : (
                          <>
                            <Ban className="ml-1 h-3.5 w-3.5 text-amber-600" /> حظر العميل
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(u.id, u.name)}
                        disabled={deleteMutation.isPending}
                        className="h-9 px-3 text-xs font-bold border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-400"
                      >
                        <Trash2 className="ml-1 h-3.5 w-3.5 text-rose-600" />
                        إزالة العميل
                      </Button>
                    </div>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400">حساب المدير محمي</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
