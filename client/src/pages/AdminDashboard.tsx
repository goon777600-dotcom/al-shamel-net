import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { COOKIE_NAME } from "@shared/const";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  AlertCircle,
  ArrowUpLeft,
  BarChart3,
  Boxes,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Copy,
  Cpu,
  Eye,
  EyeOff,
  ImagePlus,
  KeyRound,
  Layers,
  LogOut,
  Megaphone,
  PackageCheck,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Save,
  Send,
  Server,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Users,
  Wifi,
  WifiOff,
  X,
  Zap,
  Bell,
  CreditCard,
  Landmark,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import AdminNotifications from "@/components/AdminNotifications";
import AdminTopUpRequests from "@/components/AdminTopUpRequests";
import AdminCustomersManager from "@/components/AdminCustomersManager";
import AdminPaymentMethodsManager from "@/components/AdminPaymentMethodsManager";

const logoUrl = "/manus-storage/al-shamel-logo_9fc75833.jpeg";
const periodLabel = {
  today: "اليوم",
  week: "آخر 7 أيام",
  month: "هذا الشهر",
  all: "كل الفترات",
} as const;

function AdminGate({ onBack }: { onBack: () => void }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      if (data.sessionToken) {
        try {
          sessionStorage.setItem("auth_token", data.sessionToken);
          localStorage.setItem("auth_token", data.sessionToken);
          sessionStorage.setItem("manus-cookie", `${COOKIE_NAME}=${data.sessionToken}`);
          localStorage.setItem("manus-cookie", `${COOKIE_NAME}=${data.sessionToken}`);
        } catch {}
      }
      utils.auth.me.setData(undefined, data.user);
      void utils.auth.me.invalidate();

      if (data.user?.role === "admin") {
        toast.success("تم فتح لوحة تحكم المدير بنجاح!");
        setTimeout(() => {
          window.location.reload();
        }, 300);
      } else {
        toast.error("هذا الحساب ليس لديه صلاحيات مدير.");
      }
    },
    onError: (err) => {
      toast.error(err.message || "بيانات الدخول غير صحيحة.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      toast.error("يرجى إدخال البريد الإلكتروني أو رقم الهاتف وكلمة المرور.");
      return;
    }
    loginMutation.mutate({ identifier: identifier.trim(), password });
  };

  return (
    <div className="shamel-premium-shell flex min-h-screen items-center justify-center p-4 pb-24">
      <Card className="w-full max-w-md border-amber-200 bg-white/95 p-8 shadow-xl shadow-blue-950/10">
        <div className="text-center">
          <ShieldCheck className="mx-auto mb-3 h-14 w-14 text-amber-600" />
          <h2 className="text-2xl font-black text-slate-950">منطقة الإدارة والتحكم</h2>
          <p className="mt-1 text-sm text-slate-600">
            أدخل بيانات حساب المدير للوصول إلى لوحة التحكم وإعدادات اليوزرمانجر.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-black text-slate-700">
              البريد الإلكتروني أو رقم الهاتف
            </label>
            <Input
              placeholder="أدخل البريد أو رقم الهاتف"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="h-11 text-right font-medium"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-black text-slate-700">كلمة المرور</label>
            <Input
              type="password"
              placeholder="أدخل كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
            />
          </div>

          <Button
            type="submit"
            disabled={loginMutation.isPending}
            className="h-11 w-full bg-blue-700 font-black text-white hover:bg-blue-800"
          >
            {loginMutation.isPending ? "جارٍ التحقق…" : "دخول لوحة التحكم"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="w-full text-xs font-bold text-slate-500 hover:text-slate-900"
          >
            العودة إلى المتجر
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("today");
  const { data: overview, isLoading, refetch, isFetching } = trpc.admin.overview.useQuery(period, {
    enabled: user?.role === "admin",
  });
  const { data: routerConfig } = trpc.userManager.getConfig.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => navigate("/"),
  });

  if (loading) {
    return (
      <div className="shamel-premium-shell flex min-h-screen items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-700" />
          <p className="text-sm font-bold text-slate-600">جارٍ التحقق من صلاحيات المدير…</p>
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return <AdminGate onBack={() => navigate("/")} />;
  }

  const formatNumber = (value: number | string) =>
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(value));

  const metrics = [
    {
      label: "إجمالي المبيعات",
      value: `${formatNumber(overview?.totalSales ?? 0)} ر.ي`,
      note: `ضمن ${periodLabel[period]}`,
      icon: CircleDollarSign,
      tint: "from-blue-950 via-blue-800 to-blue-600",
      iconClass: "bg-blue-100 text-blue-700",
    },
    {
      label: "الطلبات المنفذة",
      value: formatNumber(overview?.totalOrders ?? 0),
      note: `طلبات ${periodLabel[period]}`,
      icon: ClipboardList,
      tint: "from-emerald-950 via-emerald-800 to-emerald-600",
      iconClass: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "الحسابات المسجلة",
      value: formatNumber(overview?.totalUsers ?? 0),
      note: "حسابات العملاء",
      icon: Users,
      tint: "from-violet-950 via-violet-800 to-violet-600",
      iconClass: "bg-violet-100 text-violet-700",
    },
    {
      label: "الباقات المتاحة",
      value: formatNumber(overview?.totalPackages ?? 0),
      note: "باقات مفعّلة حالياً",
      icon: PackageCheck,
      tint: "from-amber-950 via-amber-800 to-amber-600",
      iconClass: "bg-amber-100 text-amber-700",
    },
  ];

  return (
    <div className="shamel-premium-shell min-h-screen p-4 pb-28">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 flex flex-col gap-5 rounded-3xl border border-white/15 bg-gradient-to-l from-[#04162f] via-[#07346d] to-[#1069bf] p-5 text-white shadow-2xl shadow-blue-950/25 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-center gap-4">
            <img
              src={logoUrl}
              alt="شعار الشامل نت"
              className="h-16 w-24 rounded-xl border border-amber-200/70 bg-white object-contain p-1.5 shadow-lg"
            />
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-black text-amber-200">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> منطقة المدير المحمية
                </span>
                {routerConfig && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      routerConfig.status === "online"
                        ? "border border-emerald-400/40 bg-emerald-500/20 text-emerald-300"
                        : "border border-rose-400/40 bg-rose-500/20 text-rose-300"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        routerConfig.status === "online" ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                      }`}
                    />
                    {routerConfig.status === "online"
                      ? `متصل بالميكروتك (${routerConfig.systemIdentity || "User Manager"})`
                      : "الميكروتك غير متصل"}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black sm:text-3xl">لوحة تحكم الشامل نت</h1>
              <p className="mt-1 text-sm text-blue-100">مرحباً {user.name || "مدير الشبكة"}، إدارة المتجر واليوزرمانجر المباشر.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => window.location.assign("/")}
              className="bg-amber-400 font-black text-slate-950 hover:bg-amber-300 shadow-sm"
            >
              <ShoppingBag className="ml-1.5 h-4 w-4" /> الانتقال إلى المتجر
            </Button>
            <Button
              variant="secondary"
              onClick={() => refetch()}
              disabled={isFetching}
              className="bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <RefreshCw className={`ml-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> تحديث
            </Button>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="border-white/25 bg-white/10 text-white hover:bg-rose-500 hover:text-white"
            >
              <LogOut className="ml-2 h-4 w-4" /> خروج
            </Button>
          </div>
        </header>

        {/* User Manager Status Banner */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-900 to-[#07346d] p-4 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-2.5 text-amber-300">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <p className="font-black text-white">الربط المباشر مع ميكروتك User Manager</p>
              <p className="mt-0.5 text-xs text-blue-100">
                السيرفر الحالي: <span className="font-mono text-amber-200">{routerConfig?.host || "لم يُحدد بعد"}</span> · المنفذ:{" "}
                <span className="font-mono text-amber-200">{routerConfig?.apiPort || 8728}</span>
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => document.getElementById("usermanager-settings")?.scrollIntoView({ behavior: "smooth" })}
            className="shrink-0 bg-amber-400 font-black text-slate-950 hover:bg-amber-300"
          >
            <Settings2 className="ml-2 h-4 w-4" /> إعدادات الربط
          </Button>
        </div>

        <section className="mb-5 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-white/85 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-black text-slate-800">
            <span className="rounded-xl bg-blue-50 p-2 text-blue-700">
              <CalendarDays className="h-4 w-4" />
            </span>{" "}
            عرض الأداء حسب الفترة
          </div>
          <div className="grid grid-cols-4 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-black">
            {(["today", "week", "month", "all"] as const).map(value => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={`rounded-lg px-2 py-2 transition ${
                  period === value ? "bg-[#07346d] text-white shadow-sm" : "text-slate-600 hover:bg-white"
                }`}
              >
                {periodLabel[value]}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(metric => {
            const Icon = metric.icon;
            return (
              <Card
                key={metric.label}
                className={`overflow-hidden border-0 bg-gradient-to-br p-5 text-white shadow-lg shadow-blue-950/10 ${metric.tint}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white/75">{metric.label}</p>
                    <p className="mt-3 text-3xl font-black tabular-nums">{isLoading ? "—" : metric.value}</p>
                    <p className="mt-2 text-xs text-white/70">{metric.note}</p>
                  </div>
                  <div className={`rounded-2xl p-3 shadow-sm ${metric.iconClass}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
          <Card className="border-blue-950/10 bg-white/90 p-5 shadow-xl shadow-blue-950/5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black tracking-[0.16em] text-amber-700">OPERATIONS</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">آخر عمليات الشراء المباشرة</h2>
              </div>
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            {isLoading ? (
              <div className="py-12 text-center text-slate-500">جاري تحميل العمليات…</div>
            ) : overview?.recentOrders.length ? (
              <div className="divide-y divide-slate-100">
                {overview.recentOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between gap-4 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                        <ArrowUpLeft className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-900">{order.packageName}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(order.createdAt).toLocaleString("ar-YE")}
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 font-black text-emerald-700">{formatNumber(order.amount)} ر.ي</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/70 px-5 py-12 text-center">
                <Boxes className="mx-auto mb-3 h-9 w-9 text-blue-500" />
                <p className="font-black text-slate-800">لا توجد عمليات شراء مسجلة بعد</p>
                <p className="mt-1 text-sm text-slate-500">ستظهر هنا المشتريات الحقيقية فور تنفيذها من العملاء.</p>
              </div>
            )}
          </Card>

          <Card className="border-amber-200/70 bg-gradient-to-b from-amber-50 via-white to-blue-50 p-5 shadow-xl shadow-blue-950/5 sm:p-6">
            <div className="rounded-2xl bg-[#071f43] p-4 text-white shadow-lg">
              <BarChart3 className="mb-4 h-8 w-8 text-amber-300" />
              <p className="text-sm font-bold text-blue-100">مركز الإدارة والتحكم</p>
              <h2 className="mt-1 text-xl font-black">ربط مباشر وسريع</h2>
              <p className="mt-3 text-sm leading-7 text-blue-100">
                التطبيق يخاطب اليوزر مانجر مباشرة لإصدار الكروت وإدارتها فورياً.
              </p>
            </div>
            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => document.getElementById("usermanager-settings")?.scrollIntoView({ behavior: "smooth" })}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white/80 p-3 text-right transition hover:border-blue-400 hover:bg-white"
              >
                <span className="rounded-xl bg-blue-50 p-2 text-blue-700">
                  <Server className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-black text-slate-900">إعدادات اليوزرمانجر والميكروتك</span>
                  <span className="mt-1 block text-xs text-slate-500">الرابط، كلمة السر، وفحص الاتصال الحي</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => document.getElementById("package-manager")?.scrollIntoView({ behavior: "smooth" })}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white/80 p-3 text-right transition hover:border-blue-400 hover:bg-white"
              >
                <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                  <PackageCheck className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-black text-slate-900">إدارة الباقات والبروفايلات</span>
                  <span className="mt-1 block text-xs text-slate-500">ربط باقات المتجر ببروفايلات الميكروتك</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => document.getElementById("announcement-manager")?.scrollIntoView({ behavior: "smooth" })}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white/80 p-3 text-right transition hover:border-blue-400 hover:bg-white"
              >
                <span className="rounded-xl bg-amber-50 p-2 text-amber-700">
                  <Megaphone className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-black text-slate-900">رسائل المتجر والإعلانات</span>
                  <span className="mt-1 block text-xs text-slate-500">نشر عروض وتنبيهات الشبكة للعملاء</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => document.getElementById("admin-notifications")?.scrollIntoView({ behavior: "smooth" })}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white/80 p-3 text-right transition hover:border-blue-400 hover:bg-white"
              >
                <span className="rounded-xl bg-blue-50 p-2 text-blue-700">
                  <Bell className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-black text-slate-900">مركز الإشعارات الحية</span>
                  <span className="mt-1 block text-xs text-slate-500">متابعة تسجيل العملاء وعمليات الشراء فورياً</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => document.getElementById("admin-topup-requests")?.scrollIntoView({ behavior: "smooth" })}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white/80 p-3 text-right transition hover:border-amber-400 hover:bg-white"
              >
                <span className="rounded-xl bg-amber-50 p-2 text-amber-700">
                  <CreditCard className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-black text-slate-900">طلبات شحن المحفظة</span>
                  <span className="mt-1 block text-xs text-slate-500">مراجعة الحوالات وتنزيل الرصيد للعملاء</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => document.getElementById("admin-payment-methods")?.scrollIntoView({ behavior: "smooth" })}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white/80 p-3 text-right transition hover:border-emerald-400 hover:bg-white"
              >
                <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                  <Landmark className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-black text-slate-900">إدارة البنوك وطرق الدفع</span>
                  <span className="mt-1 block text-xs text-slate-500">إضافة بنك الشمول، القطيبي، وتعديل الحسابات</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => document.getElementById("admin-customers-manager")?.scrollIntoView({ behavior: "smooth" })}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white/80 p-3 text-right transition hover:border-violet-400 hover:bg-white"
              >
                <span className="rounded-xl bg-violet-50 p-2 text-violet-700">
                  <Users className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-black text-slate-900">دليل وإدارة العملاء</span>
                  <span className="mt-1 block text-xs text-slate-500">متابعة حسابات العملاء، الحظر، والإزالة</span>
                </span>
              </button>
            </div>
          </Card>
        </section>

        {/* Live Categorized Notifications (Split Side-by-Side: Top-ups, New Accounts, Purchases) */}
        <section className="mb-7" id="admin-notifications">
          <AdminNotifications />
        </section>

        {/* Top-Up Requests Approval Table */}
        <section className="mb-7" id="admin-topup-requests">
          <AdminTopUpRequests />
        </section>

        {/* Payment Methods & Bank Accounts Manager */}
        <section className="mb-7" id="admin-payment-methods">
          <AdminPaymentMethodsManager />
        </section>

        {/* Customers Management Directory */}
        <section className="mb-7" id="admin-customers-manager">
          <AdminCustomersManager />
        </section>

        {/* User Manager Integration Section */}
        <UserManagerSettings />

        {/* Announcement Manager */}
        <div id="announcement-manager">
          <AnnouncementManager />
        </div>

        {/* Package Manager */}
        <div id="package-manager">
          <PackageManager />
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          لوحة الإدارة محمية بصلاحية المدير · الشامل لخدمات الإنترنت © 2026
        </p>
      </div>
    </div>
  );
}

/**
 * User Manager Settings Component
 */
function UserManagerSettings() {
  const utils = trpc.useUtils();
  const { data: config, isLoading } = trpc.userManager.getConfig.useQuery();

  const [host, setHost] = useState("");
  const [apiPort, setApiPort] = useState(8728);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [useTls, setUseTls] = useState(false);
  const [mode, setMode] = useState<"usermanager_v6" | "usermanager_v7" | "hotspot">("usermanager_v6");
  const [customer, setCustomer] = useState("admin");
  const [loginUrl, setLoginUrl] = useState("http://100.100.100.1");
  const [showPassword, setShowPassword] = useState(false);

  const [testResult, setTestResult] = useState<any>(null);
  const [testCardResult, setTestCardResult] = useState<any>(null);

  useEffect(() => {
    if (config) {
      setHost(config.host || "https://shaml.wifimanage.co");
      setApiPort(config.apiPort || 8728);
      setUsername(config.username || "admin");
      setPassword(config.password || "");
      setUseTls(Boolean(config.useTls));
      setMode((config.mode as any) || "usermanager_v6");
      setCustomer(config.customer || "admin");
      setLoginUrl(config.loginUrl || "http://100.100.100.1");
    }
  }, [config]);

  const saveMutation = trpc.userManager.saveConfig.useMutation({
    onSuccess: async () => {
      await utils.userManager.getConfig.invalidate();
      toast.success("تم حفظ إعدادات خادم اليوزر مانجر بنجاح");
    },
    onError: err => {
      toast.error(err.message || "تعذر حفظ الإعدادات");
    },
  });

  const testMutation = trpc.userManager.testConnection.useMutation({
    onSuccess: async res => {
      setTestResult(res);
      await utils.userManager.getConfig.invalidate();
      if (res.ok) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    },
    onError: err => {
      setTestResult({ ok: false, message: err.message });
      toast.error(err.message || "فشل الاتصال بالميكروتك");
    },
  });

  const generateCardMutation = trpc.userManager.generateTestCard.useMutation({
    onSuccess: res => {
      setTestCardResult(res);
      if (res.syncedToRouter) {
        toast.success(`تم إنشاء الكرت (${res.pinCode}) بنجاح داخل اليوزر مانجر!`);
      } else {
        toast.warning(`تم توليد الكرت (${res.pinCode}) محلياً (${res.routerMessage})`);
      }
    },
    onError: err => {
      toast.error(err.message || "تعذر إنشاء الكرت التجريبي");
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!host.trim()) {
      toast.error("يرجى إدخال رابط أو عنوان خادم اليوزر مانجر");
      return;
    }
    saveMutation.mutate({
      host,
      apiPort: Number(apiPort) || 8728,
      username,
      password,
      useTls,
      mode,
      customer,
      loginUrl,
    });
  };

  const handleTest = () => {
    setTestResult(null);
    testMutation.mutate({
      host,
      apiPort: Number(apiPort) || 8728,
      username,
      password,
      useTls,
    });
  };

  return (
    <section id="usermanager-settings" className="mt-7">
      <Card className="overflow-hidden border border-blue-950/10 bg-white/95 p-5 shadow-xl shadow-blue-950/5 sm:p-7">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-[#04162f] p-3 text-amber-200">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-black tracking-[0.14em] text-blue-700">USER MANAGER INTEGRATION</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                    config?.status === "online" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {config?.status === "online" ? "متصل بنجاح" : "غير متصل"}
                </span>
              </div>
              <h2 className="mt-1 text-xl font-black text-slate-950">إعدادات الربط المباشر مع اليوزر مانجر</h2>
              <p className="mt-1 text-sm text-slate-600">
                أدخل رابط اليوزر مانجر وكلمة السر ليخاطب التطبيق السيرفر مباشرة وينشئ كروت الشبكة تلقائياً.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={testMutation.isPending}
              className="border-blue-300 bg-blue-50 font-black text-blue-800 hover:bg-blue-100"
            >
              <RefreshCw className={`ml-2 h-4 w-4 ${testMutation.isPending ? "animate-spin" : ""}`} />
              {testMutation.isPending ? "جارٍ الفحص…" : "فحص الاتصال"}
            </Button>
          </div>
        </div>

        {/* Live Diagnostics Card */}
        {testResult && (
          <div
            className={`mb-6 rounded-2xl border p-4 ${
              testResult.ok ? "border-emerald-200 bg-emerald-50/80 text-emerald-950" : "border-rose-200 bg-rose-50/80 text-rose-950"
            }`}
          >
            <div className="flex items-start gap-3">
              {testResult.ok ? (
                <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-6 w-6 shrink-0 text-rose-600" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-black text-base">{testResult.message}</p>
                {testResult.ok && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl bg-white/80 p-2.5">
                      <p className="text-[11px] font-bold text-slate-500">هوية الراوتر (Identity)</p>
                      <p className="mt-0.5 font-black text-slate-900">{testResult.identity || "MikroTik"}</p>
                    </div>
                    <div className="rounded-xl bg-white/80 p-2.5">
                      <p className="text-[11px] font-bold text-slate-500">إصدار النظام (RouterOS)</p>
                      <p className="mt-0.5 font-black text-slate-900">{testResult.version || "—"}</p>
                    </div>
                    <div className="rounded-xl bg-white/80 p-2.5">
                      <p className="text-[11px] font-bold text-slate-500">مدة التشغيل (Uptime)</p>
                      <p className="mt-0.5 font-black text-slate-900">{testResult.uptime || "—"}</p>
                    </div>
                    <div className="rounded-xl bg-white/80 p-2.5">
                      <p className="text-[11px] font-bold text-slate-500">المعالج والذاكرة</p>
                      <p className="mt-0.5 font-black text-slate-900">
                        {testResult.cpuLoad || "0%"} · {testResult.freeMemoryMb ? `${testResult.freeMemoryMb} MB متاح` : "—"}
                      </p>
                    </div>
                  </div>
                )}
                {testResult.profiles && testResult.profiles.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-black text-slate-700">البروفايلات المكتشفة في اليوزر مانجر:</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {testResult.profiles.map((p: string) => (
                        <span key={p} className="rounded-lg border border-emerald-200 bg-white px-2 py-1 text-xs font-bold text-emerald-800">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Host or URL */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-black text-slate-800">
                رابط أو عنوان خادم اليوزر مانجر (Host / URL) <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  value={host}
                  onChange={e => setHost(e.target.value)}
                  placeholder="مثال: https://shaml.wifimanage.co أو 192.168.88.1 أو 3.3.3.3"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-3 pr-10 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <Server className="absolute right-3 top-3 h-5 w-5 text-slate-400" />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                يقبل رابط الموقع مباشرة (مثل: https://shaml.wifimanage.co) أو عنوان IP المباشر للموجّه.
              </p>
            </div>

            {/* API Port */}
            <div>
              <label className="mb-1.5 block text-xs font-black text-slate-800">
                منفذ الـ API (Port) <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                value={apiPort}
                onChange={e => setApiPort(Number(e.target.value))}
                placeholder="8728"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <p className="mt-1 text-[11px] text-slate-500">الافتراضي 8728 (أو 8729 عند تشغيل تشفير SSL/TLS).</p>
            </div>

            {/* Mode */}
            <div>
              <label className="mb-1.5 block text-xs font-black text-slate-800">نوع النظام / الحزمة (System Mode)</label>
              <select
                value={mode}
                onChange={e => setMode(e.target.value as any)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500"
              >
                <option value="usermanager_v6">User Manager v6 (RouterOS v6.x)</option>
                <option value="usermanager_v7">User Manager v7 (RouterOS v7.x)</option>
                <option value="hotspot">Hotspot ميكروتك المباشر (/ip/hotspot)</option>
              </select>
              <p className="mt-1 text-[11px] text-slate-500">اختر نوع نظام إدارة المستخدمين المفعّل في الميكروتك.</p>
            </div>

            {/* Username */}
            <div>
              <label className="mb-1.5 block text-xs font-black text-slate-800">
                اسم المستخدم في الميكروتك (Username) <span className="text-rose-600">*</span>
              </label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-xs font-black text-slate-800">كلمة المرور (Password)</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="كلمة سر حساب المدير في الميكروتك"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Customer (User Manager v6) */}
            <div>
              <label className="mb-1.5 block text-xs font-black text-slate-800">اسم العميل/المشرف في اليوزرمانجر (Customer)</label>
              <input
                value={customer}
                onChange={e => setCustomer(e.target.value)}
                placeholder="admin"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <p className="mt-1 text-[11px] text-slate-500">خاص بـ User Manager v6 (الافتراضي: admin).</p>
            </div>

            {/* Login URL */}
            <div>
              <label className="mb-1.5 block text-xs font-black text-slate-800">رابط تسجيل دخول الشبكة للعميل (Hotspot Login URL)</label>
              <input
                value={loginUrl}
                onChange={e => setLoginUrl(e.target.value)}
                placeholder="http://100.100.100.1 أو http://100.100.100.1/login"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <p className="mt-1 text-[11px] text-slate-500">يظهر للعميل في الكرت ليضغط عليه ويسجل الدخول فورياً للشبكة.</p>
            </div>
          </div>

          {/* TLS Checkbox */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useTls}
                onChange={e => setUseTls(e.target.checked)}
                className="h-4 w-4 rounded accent-blue-700"
              />
              <div>
                <p className="text-sm font-black text-slate-900">تفعيل تشفير SSL/TLS للاتصال (Port 8729)</p>
                <p className="text-xs text-slate-500">فعّل هذا الخيار إذا كان الميكروتك يعمل بشهادة SSL أو عبر منفذ API-SSL.</p>
              </div>
            </label>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="h-11 flex-1 bg-blue-700 font-black text-white hover:bg-blue-800"
            >
              {saveMutation.isPending ? (
                "جارٍ حفظ الإعدادات…"
              ) : (
                <>
                  <Save className="ml-2 h-4 w-4" /> حفظ إعدادات اليوزرمانجر
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={testMutation.isPending}
              className="h-11 border-blue-200 bg-white font-black text-blue-800 hover:bg-blue-50"
            >
              <RefreshCw className={`ml-2 h-4 w-4 ${testMutation.isPending ? "animate-spin" : ""}`} />
              فحص الاتصال بالميكروتك
            </Button>
          </div>
        </form>

        {/* Test Card Generator */}
        <div className="mt-7 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-700 p-2 text-white">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-950">توليد كرت تجريبي فوري</h3>
                <p className="text-xs text-slate-600">
                  اختبر إنشاء كرت فعلي ونزوله في الميكروتك بضغطة زر للتأكد من نجاح الربط بنسبة 100%.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => generateCardMutation.mutate({})}
              disabled={generateCardMutation.isPending}
              className="bg-emerald-600 font-black text-white hover:bg-emerald-700"
            >
              <Zap className="ml-2 h-4 w-4" />
              {generateCardMutation.isPending ? "جارٍ التوليد…" : "توليد كرت اختبار الآن"}
            </Button>
          </div>

          {testCardResult && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-500">رمز الكرت المولّد (PIN):</span>
                  <p className="font-mono text-2xl font-black text-emerald-700 tracking-[0.18em]">
                    {testCardResult.pinCode}
                  </p>
                </div>
                <div className="text-left">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      testCardResult.syncedToRouter ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {testCardResult.syncedToRouter ? "تم النزول في الميكروتك بنجاح" : "تم التوليد محلياً"}
                  </span>
                  <p className="mt-1 text-xs text-slate-500">{testCardResult.routerMessage}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </section>
  );
}

/**
 * Announcement Manager Component
 */
function AnnouncementManager() {
  const utils = trpc.useUtils();
  const { data: announcements = [], isLoading } = trpc.announcements.list.useQuery();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [label, setLabel] = useState("عرض من الشامل نت");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ctaText, setCtaText] = useState("استكشف الباقات");
  const [tone, setTone] = useState<"gold" | "azure" | "emerald">("gold");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState("");

  const resetForm = () => {
    setEditingId(null);
    setLabel("عرض من الشامل نت");
    setTitle("");
    setDescription("");
    setCtaText("استكشف الباقات");
    setTone("gold");
    setImageDataUrl(null);
    setImageFileName("");
  };

  const uploadMutation = trpc.announcements.uploadImage.useMutation({
    onError: error => toast.error(error.message || "تعذر رفع صورة الإعلان."),
  });

  const createMutation = trpc.announcements.create.useMutation({
    onSuccess: async () => {
      await utils.announcements.list.invalidate();
      await utils.announcements.active.invalidate();
      resetForm();
      toast.success("تمت إضافة الرسالة الإعلانية بنجاح وستظهر في مقدمة المتجر.");
    },
    onError: error => toast.error(error.message || "تعذر حفظ الرسالة."),
  });

  const updateMutation = trpc.announcements.update.useMutation({
    onSuccess: async () => {
      await utils.announcements.list.invalidate();
      await utils.announcements.active.invalidate();
      resetForm();
      toast.success("تم تحديث الإعلان وحفظ الإعدادات والصورة بنجاح في قاعدة البيانات.");
    },
    onError: error => toast.error(error.message || "تعذر تحديث الإعلان."),
  });

  const deleteMutation = trpc.announcements.delete.useMutation({
    onSuccess: async () => {
      await utils.announcements.list.invalidate();
      await utils.announcements.active.invalidate();
      if (editingId) resetForm();
      toast.success("تم حذف الإعلان بنجاح.");
    },
    onError: error => toast.error(error.message || "تعذر حذف الإعلان."),
  });

  const activeMutation = trpc.announcements.setActive.useMutation({
    onSuccess: async () => {
      await utils.announcements.list.invalidate();
      await utils.announcements.active.invalidate();
    },
    onError: error => toast.error(error.message || "تعذر تحديث حالة الرسالة."),
  });

  const handleEdit = (announcement: typeof announcements[0]) => {
    setEditingId(announcement.id);
    setLabel(announcement.label);
    setTitle(announcement.title);
    setDescription(announcement.description);
    setCtaText(announcement.ctaText);
    setTone(announcement.tone as any);
    setImageDataUrl(announcement.imageUrl || null);
    setImageFileName(announcement.imageUrl ? "الصورة المحفوظة الحالية" : "");
    document.getElementById("announcement-manager")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("اكتب عنوان الرسالة ووصفها أولاً.");
      return;
    }
    try {
      let finalImageUrl = imageDataUrl || undefined;

      // If user uploaded a new dataUrl
      if (imageDataUrl && imageDataUrl.startsWith("data:") && imageFileName !== "الصورة المحفوظة الحالية") {
        const uploadRes = await uploadMutation.mutateAsync({
          fileName: imageFileName || "announcement",
          dataUrl: imageDataUrl,
        });
        finalImageUrl = uploadRes.url;
      }

      if (editingId) {
        updateMutation.mutate({
          id: editingId,
          label,
          title,
          description,
          ctaText,
          tone,
          imageUrl: finalImageUrl,
        });
      } else {
        createMutation.mutate({
          label,
          title,
          description,
          ctaText,
          tone,
          imageUrl: finalImageUrl,
        });
      }
    } catch {
      // Handled in onError
    }
  };

  // Client-side image compression: max 1200px, JPEG quality 0.85
  const handleImageChange = (file?: File) => {
    if (!file) return;
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    const allowedExtensions = /\.(png|jpe?g|webp)$/i;
    if (!allowedTypes.includes(file.type) && !allowedExtensions.test(file.name)) {
      toast.error("اختر صورة PNG أو JPEG أو WebP.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("يجب ألا يتجاوز حجم الصورة 8 ميغابايت.");
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.85);
          setImageDataUrl(compressed);
          setImageFileName(file.name);
        } else {
          setImageDataUrl(String(reader.result));
          setImageFileName(file.name);
        }
      };
      img.src = String(e.target?.result);
    };
    reader.readAsDataURL(file);
  };

  const toneLabel = { gold: "ذهبي", azure: "أزرق", emerald: "أخضر" } as const;
  const toneClass = {
    gold: "bg-amber-100 text-amber-800",
    azure: "bg-blue-100 text-blue-800",
    emerald: "bg-emerald-100 text-emerald-800",
  } as const;
  const previewTone = {
    gold: "from-[#061a37] via-[#0a3f80] to-[#156fca]",
    azure: "from-[#05234d] via-[#0f58a6] to-[#258ee0]",
    emerald: "from-[#063d43] via-[#0b756d] to-[#129d85]",
  } as const;

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
      <Card className="border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-blue-50 p-5 shadow-xl shadow-blue-950/5 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-2xl bg-[#071f43] p-3 text-amber-200">
            <Megaphone className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-black tracking-[0.14em] text-amber-700">STORE CONTENT</p>
            <div className="flex items-center justify-between">
              <h2 className="mt-1 text-xl font-black text-slate-950">
                {editingId ? "تعديل الإعلان وحفظه" : "أضف إعلاناً جديداً"}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  إلغاء التعديل
                </button>
              )}
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {editingId
                ? "يمكنك تعديل النصوص أو استبدال الصورة أو الاحتفاظ بها مع حفظ الإعدادات بأمان."
                : "سيظهر أعلى الباقات للعميل مع عروض الشبكة الحالية."}
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block cursor-pointer rounded-2xl border border-dashed border-blue-300 bg-blue-50/70 p-3 transition hover:border-blue-500 hover:bg-blue-50">
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="sr-only"
              onChange={event => handleImageChange(event.target.files?.[0])}
            />
            {imageDataUrl ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <img
                    src={imageDataUrl}
                    alt="معاينة الإعلان"
                    className="h-16 w-24 shrink-0 rounded-xl border border-blue-100 object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black text-slate-900">{imageFileName || "صورة الإعلان"}</span>
                    <span className="mt-1 block text-xs text-slate-500">الصورة محفوظة في قاعدة البيانات. اضغط لتغييرها.</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setImageDataUrl(null);
                    setImageFileName("");
                  }}
                  className="shrink-0 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100"
                >
                  إلغاء الصورة
                </button>
              </div>
            ) : (
              <span className="flex items-center gap-3">
                <span className="rounded-xl bg-blue-700 p-2.5 text-white">
                  <ImagePlus className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-black text-slate-900">أضف صورة اختيارية للإعلان</span>
                  <span className="mt-1 block text-xs text-slate-500">PNG أو JPEG أو WebP - تُحفظ مباشرة في قاعدة البيانات ولن تختفي أبداً.</span>
                </span>
              </span>
            )}
          </label>
          <input
            value={label}
            onChange={event => setLabel(event.target.value)}
            maxLength={60}
            placeholder="وسم الرسالة، مثال: عرض اليوم"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          <input
            value={title}
            onChange={event => setTitle(event.target.value)}
            maxLength={140}
            placeholder="عنوان الإعلان"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          <textarea
            value={description}
            onChange={event => setDescription(event.target.value)}
            maxLength={280}
            placeholder="اكتب الرسالة التي تريد أن يراها العميل…"
            className="min-h-24 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={ctaText}
              onChange={event => setCtaText(event.target.value)}
              maxLength={50}
              placeholder="نص الزر"
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <select
              value={tone}
              onChange={event => setTone(event.target.value as "gold" | "azure" | "emerald")}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-500"
            >
              <option value="gold">ذهبي فاخر</option>
              <option value="azure">أزرق شبكي</option>
              <option value="emerald">أخضر خدمي</option>
            </select>
          </div>
          <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-l p-4 text-white shadow-lg ${previewTone[tone]}`}>
            <div className="absolute -left-5 -bottom-7 h-24 w-24 rounded-full border border-white/20" />
            {imageDataUrl ? (
              <img
                src={imageDataUrl}
                alt="معاينة الإعلان"
                className="absolute bottom-3 left-3 h-20 w-24 rounded-xl border border-white/30 object-cover shadow-lg"
              />
            ) : (
              <div className="absolute bottom-4 left-4 rounded-xl bg-white/10 p-3 text-amber-100">
                <ImagePlus className="h-5 w-5" />
              </div>
            )}
            <div className={`relative ${imageDataUrl ? "pl-28" : "pl-12"}`}>
              <p className="text-[10px] font-black text-amber-100">معاينة قبل النشر · {label || "عرض من الشامل نت"}</p>
              <p className="mt-2 text-base font-black leading-6">{title || "عنوان إعلانك سيظهر هنا"}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/80">
                {description || "أضف وصفاً واضحاً ليعرف العميل تفاصيل العرض أو تنبيه الشبكة."}
              </p>
              <span className="mt-3 inline-flex rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-black text-blue-900">
                {ctaText || "استكشف الباقات"}
              </span>
            </div>
          </div>
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending || uploadMutation.isPending}
            className="h-11 w-full bg-blue-700 font-black hover:bg-blue-800"
          >
            {createMutation.isPending || updateMutation.isPending || uploadMutation.isPending ? (
              "جارٍ الحفظ…"
            ) : editingId ? (
              <>
                <Save className="ml-2 h-4 w-4" /> حفظ التعديلات
              </>
            ) : (
              <>
                <Plus className="ml-2 h-4 w-4" /> نشر الرسالة في المتجر
              </>
            )}
          </Button>
        </form>
      </Card>

      <Card className="border-blue-950/10 bg-white/90 p-5 shadow-xl shadow-blue-950/5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-black tracking-[0.14em] text-blue-700">LIVE ANNOUNCEMENTS</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">رسائل المتجر</h2>
          </div>
          <Send className="h-6 w-6 text-blue-700" />
        </div>
        {isLoading ? (
          <p className="py-10 text-center text-slate-500">جاري تحميل الرسائل…</p>
        ) : announcements.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">لا توجد رسائل بعد. أضف أول رسالة من النموذج.</p>
        ) : (
          <div className="space-y-3">
            {announcements.map(announcement => (
              <div
                key={announcement.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {announcement.imageUrl && (
                    <img
                      src={announcement.imageUrl}
                      alt="صورة الإعلان"
                      className="h-14 w-20 shrink-0 rounded-xl border border-slate-200 object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${toneClass[announcement.tone]}`}>
                        {toneLabel[announcement.tone]}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                          announcement.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {announcement.isActive ? "ظاهر للعميل" : "موقوف"}
                      </span>
                    </div>
                    <p className="truncate font-black text-slate-900">{announcement.title}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-500">{announcement.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(announcement)}
                    className="border-amber-200 bg-amber-50/70 text-amber-900 hover:bg-amber-100"
                  >
                    <Pencil className="ml-1.5 h-3.5 w-3.5" />
                    تعديل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => activeMutation.mutate({ id: announcement.id, isActive: !announcement.isActive })}
                    disabled={activeMutation.isPending}
                    className="border-blue-200 bg-white text-blue-800 hover:bg-blue-50"
                  >
                    <Power className="ml-1.5 h-3.5 w-3.5" />
                    {announcement.isActive ? "إيقاف" : "تفعيل"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm("هل تريد بالتأكيد حذف هذا الإعلان نهائياً؟")) {
                        deleteMutation.mutate({ id: announcement.id });
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="border-rose-200 bg-rose-50/70 text-rose-700 hover:bg-rose-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}

type PackageDraft = {
  id: number;
  name: string;
  description: string;
  price: string;
  category: "card" | "subscription";
  size: "small" | "medium" | "large" | "huge";
  color: "green" | "blue" | "purple" | "gold";
  routerProfileName?: string | null;
  timeLimit?: string | null;
  dataLimit?: string | null;
  isActive: boolean;
};

type NewPackageDraft = Omit<PackageDraft, "id">;

/**
 * Package Manager Component with User Manager Profile Mapping
 */
function PackageManager() {
  const utils = trpc.useUtils();
  const { data: packages = [], isLoading } = trpc.packages.listAdmin.useQuery();
  const [draft, setDraft] = useState<PackageDraft | null>(null);
  const [newDraft, setNewDraft] = useState<NewPackageDraft | null>(null);

  const colorStyle = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    purple: "border-violet-200 bg-violet-50 text-violet-800",
    gold: "border-amber-200 bg-amber-50 text-amber-800",
  } as const;
  const colorLabel = { green: "أخضر", blue: "أزرق", purple: "بنفسجي", gold: "ذهبي" } as const;
  const sizeLabel = { small: "صغيرة", medium: "متوسطة", large: "كبيرة", huge: "ضخمة" } as const;

  const refreshPackageViews = async () => {
    await Promise.all([
      utils.packages.listAdmin.invalidate(),
      utils.packages.getAll.invalidate(),
      utils.packages.getByCategory.invalidate(),
      utils.admin.overview.invalidate(),
    ]);
  };

  const toDraft = (pkg: typeof packages[number]): PackageDraft => ({
    id: pkg.id,
    name: pkg.name,
    description: pkg.description || "",
    price: String(pkg.price),
    category: pkg.category,
    size: pkg.size,
    color: pkg.color as PackageDraft["color"],
    routerProfileName: pkg.routerProfileName || "",
    timeLimit: pkg.timeLimit || "",
    dataLimit: pkg.dataLimit || "",
    isActive: pkg.isActive === 1,
  });

  const updateMutation = trpc.packages.update.useMutation({
    onSuccess: async () => {
      await refreshPackageViews();
      setDraft(null);
      toast.success("تم حفظ تعديل الباقة بنجاح.");
    },
    onError: error => toast.error(error.message || "تعذر حفظ تعديل الباقة."),
  });

  const createMutation = trpc.packages.create.useMutation({
    onSuccess: async () => {
      await refreshPackageViews();
      setNewDraft(null);
      toast.success("تمت إضافة الباقة الجديدة وهي جاهزة للعرض.");
    },
    onError: error => toast.error(error.message || "تعذر إضافة الباقة الجديدة."),
  });

  const cloneMutation = trpc.packages.clone.useMutation({
    onSuccess: async result => {
      await refreshPackageViews();
      if (result.package) setDraft(toDraft(result.package));
      toast.success("تم نسخ الباقة. عدّل النصوص والبروفايل ثم احفظها.");
    },
    onError: error => toast.error(error.message || "تعذر نسخ الباقة."),
  });

  const beginEdit = (pkg: typeof packages[number]) => {
    setDraft(toDraft(pkg));
  };

  const saveDraft = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    updateMutation.mutate({
      ...draft,
      price: Number(draft.price),
      routerProfileName: draft.routerProfileName || null,
      timeLimit: draft.timeLimit || null,
      dataLimit: draft.dataLimit || null,
    });
  };

  const createPackage = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newDraft) return;
    createMutation.mutate({
      ...newDraft,
      price: Number(newDraft.price),
      routerProfileName: newDraft.routerProfileName || null,
      timeLimit: newDraft.timeLimit || null,
      dataLimit: newDraft.dataLimit || null,
    });
  };

  const startNewPackage = () => {
    setDraft(null);
    setNewDraft({
      name: "باقة جديدة",
      description: "اكتب وصفاً واضحاً ومميزاً لهذه الباقة.",
      price: "1000",
      category: "card",
      size: "small",
      color: "green",
      routerProfileName: "profile-1000",
      timeLimit: "7d",
      dataLimit: "4GB",
      isActive: false,
    });
  };

  return (
    <section className="mt-6">
      <Card className="overflow-hidden border border-blue-950/10 bg-white/90 p-5 shadow-xl shadow-blue-950/5 sm:p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-[#071f43] p-3 text-amber-200">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black tracking-[0.14em] text-amber-700">PACKAGE SETTINGS</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">إدارة الباقات والربط مع البروفايل</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                اربط كل باقة باسم البروفايل المقابل لها في الميكروتك / اليوزرمانجر ليتم تفعيل الكرت فوراً.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={startNewPackage} size="sm" className="bg-blue-700 font-black hover:bg-blue-800">
              <Plus className="ml-2 h-4 w-4" /> باقة جديدة
            </Button>
          </div>
        </div>

        {newDraft && (
          <form onSubmit={createPackage} className="mb-5 space-y-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-black text-blue-950">إضافة باقة جديدة</p>
                <p className="mt-1 text-xs text-slate-500">لن تظهر للعميل إلا إذا فعّلت خيار الظهور.</p>
              </div>
              <button type="button" onClick={() => setNewDraft(null)} className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={newDraft.name}
                onChange={event => setNewDraft(current => (current ? { ...current, name: event.target.value } : current))}
                maxLength={120}
                placeholder="اسم الباقة"
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <input
                value={newDraft.price}
                onChange={event => setNewDraft(current => (current ? { ...current, price: event.target.value } : current))}
                type="number"
                min="1"
                step="0.01"
                placeholder="السعر بالريال"
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <textarea
              value={newDraft.description}
              onChange={event => setNewDraft(current => (current ? { ...current, description: event.target.value } : current))}
              maxLength={280}
              placeholder="وصف الباقة"
              className="min-h-20 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            {/* Router Profile Mapping */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">بروفايل اليوزرمانجر (Profile Name)</label>
                <input
                  value={newDraft.routerProfileName || ""}
                  onChange={event =>
                    setNewDraft(current => (current ? { ...current, routerProfileName: event.target.value } : current))
                  }
                  placeholder="مثال: profile-200"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">مدة الصلاحية (Time Limit)</label>
                <input
                  value={newDraft.timeLimit || ""}
                  onChange={event =>
                    setNewDraft(current => (current ? { ...current, timeLimit: event.target.value } : current))
                  }
                  placeholder="مثال: 3h أو 24h"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">حجم الرصيد (Data Limit)</label>
                <input
                  value={newDraft.dataLimit || ""}
                  onChange={event =>
                    setNewDraft(current => (current ? { ...current, dataLimit: event.target.value } : current))
                  }
                  placeholder="مثال: 500MB أو 4GB"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <select
                value={newDraft.category}
                onChange={event =>
                  setNewDraft(current => (current ? { ...current, category: event.target.value as any } : current))
                }
                className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-sm font-bold"
              >
                <option value="card">كرت</option>
                <option value="subscription">اشتراك</option>
              </select>
              <select
                value={newDraft.size}
                onChange={event =>
                  setNewDraft(current => (current ? { ...current, size: event.target.value as any } : current))
                }
                className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-sm font-bold"
              >
                <option value="small">صغيرة</option>
                <option value="medium">متوسطة</option>
                <option value="large">كبيرة</option>
                <option value="huge">ضخمة</option>
              </select>
              <select
                value={newDraft.color}
                onChange={event =>
                  setNewDraft(current => (current ? { ...current, color: event.target.value as any } : current))
                }
                className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-sm font-bold"
              >
                <option value="green">أخضر</option>
                <option value="blue">أزرق</option>
                <option value="purple">بنفسجي</option>
                <option value="gold">ذهبي</option>
              </select>
              <label className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2 text-sm font-black text-slate-700">
                <input
                  checked={newDraft.isActive}
                  onChange={event =>
                    setNewDraft(current => (current ? { ...current, isActive: event.target.checked } : current))
                  }
                  type="checkbox"
                  className="h-4 w-4 accent-emerald-600"
                />{" "}
                ظاهرة
              </label>
            </div>
            <Button type="submit" disabled={createMutation.isPending} className="h-10 w-full bg-blue-700 font-black hover:bg-blue-800">
              {createMutation.isPending ? "جارٍ الإضافة…" : (
                <>
                  <Plus className="ml-2 h-4 w-4" /> إضافة الباقة
                </>
              )}
            </Button>
          </form>
        )}

        {isLoading ? (
          <p className="py-10 text-center text-slate-500">جاري تحميل الباقات…</p>
        ) : (
          <div className="space-y-3">
            {packages.map(pkg => (
              <div key={pkg.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                {draft?.id === pkg.id ? (
                  <form onSubmit={saveDraft} className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-black text-slate-950">تعديل {pkg.name}</p>
                      <button type="button" onClick={() => setDraft(null)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        value={draft.name}
                        onChange={event => setDraft(current => (current ? { ...current, name: event.target.value } : current))}
                        maxLength={120}
                        placeholder="اسم الباقة"
                        className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                      <input
                        value={draft.price}
                        onChange={event => setDraft(current => (current ? { ...current, price: event.target.value } : current))}
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="السعر بالريال"
                        className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                    <textarea
                      value={draft.description}
                      onChange={event => setDraft(current => (current ? { ...current, description: event.target.value } : current))}
                      maxLength={280}
                      placeholder="وصف الباقة"
                      className="min-h-20 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                    {/* Router Profile Mapping in Edit Form */}
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-600">بروفايل اليوزرمانجر</label>
                        <input
                          value={draft.routerProfileName || ""}
                          onChange={event =>
                            setDraft(current => (current ? { ...current, routerProfileName: event.target.value } : current))
                          }
                          placeholder="مثال: profile-200"
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-600">مدة الصلاحية</label>
                        <input
                          value={draft.timeLimit || ""}
                          onChange={event =>
                            setDraft(current => (current ? { ...current, timeLimit: event.target.value } : current))
                          }
                          placeholder="مثال: 3h"
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-600">حجم الرصيد</label>
                        <input
                          value={draft.dataLimit || ""}
                          onChange={event =>
                            setDraft(current => (current ? { ...current, dataLimit: event.target.value } : current))
                          }
                          placeholder="مثال: 500MB"
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <select
                        value={draft.category}
                        onChange={event =>
                          setDraft(current => (current ? { ...current, category: event.target.value as any } : current))
                        }
                        className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-sm font-bold"
                      >
                        <option value="card">كروت</option>
                        <option value="subscription">اشتراكات</option>
                      </select>
                      <select
                        value={draft.size}
                        onChange={event =>
                          setDraft(current => (current ? { ...current, size: event.target.value as any } : current))
                        }
                        className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-sm font-bold"
                      >
                        <option value="small">صغيرة</option>
                        <option value="medium">متوسطة</option>
                        <option value="large">كبيرة</option>
                        <option value="huge">ضخمة</option>
                      </select>
                      <select
                        value={draft.color}
                        onChange={event =>
                          setDraft(current => (current ? { ...current, color: event.target.value as any } : current))
                        }
                        className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-sm font-bold"
                      >
                        <option value="green">أخضر</option>
                        <option value="blue">أزرق</option>
                        <option value="purple">بنفسجي</option>
                        <option value="gold">ذهبي</option>
                      </select>
                      <label className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2 text-sm font-black text-slate-700">
                        <input
                          checked={draft.isActive}
                          onChange={event =>
                            setDraft(current => (current ? { ...current, isActive: event.target.checked } : current))
                          }
                          type="checkbox"
                          className="h-4 w-4 accent-emerald-600"
                        />{" "}
                        ظاهرة
                      </label>
                    </div>
                    <Button type="submit" disabled={updateMutation.isPending} className="h-10 w-full bg-blue-700 font-black hover:bg-blue-800">
                      {updateMutation.isPending ? "جارٍ الحفظ…" : (
                        <>
                          <Save className="ml-2 h-4 w-4" /> حفظ التعديل
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${colorStyle[pkg.color as PackageDraft["color"]]}`}>
                          {colorLabel[pkg.color as PackageDraft["color"]]} · {sizeLabel[pkg.size]}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                            pkg.category === "card" ? "bg-sky-100 text-sky-800" : "bg-violet-100 text-violet-800"
                          }`}
                        >
                          {pkg.category === "card" ? "كرت" : "اشتراك"}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                            pkg.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {pkg.isActive ? "ظاهر للعميل" : "مخفي"}
                        </span>
                        {pkg.routerProfileName && (
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-800">
                            بروفايل: {pkg.routerProfileName}
                          </span>
                        )}
                      </div>
                      <p className="font-black text-slate-950">{pkg.name}</p>
                      <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                        {pkg.description || "لا يوجد وصف لهذه الباقة."}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                      <p className="text-lg font-black text-blue-800">
                        {new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(pkg.price))} ر.ي
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cloneMutation.mutate({ sourceId: pkg.id })}
                        disabled={cloneMutation.isPending}
                        className="border-amber-200 bg-white text-amber-800 hover:bg-amber-50"
                      >
                        <Copy className="ml-2 h-4 w-4" /> نسخ
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => beginEdit(pkg)}
                        className="border-blue-200 bg-white text-blue-800 hover:bg-blue-50"
                      >
                        <Pencil className="ml-2 h-4 w-4" /> تعديل
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}
