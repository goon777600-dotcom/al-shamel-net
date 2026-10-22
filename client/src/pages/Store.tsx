import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, Gem, Loader2, Wifi, Zap, ShieldCheck, UserCheck, BarChart3, LogOut, LogIn, ShoppingBag, Settings2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import TopUpModal from "@/components/TopUpModal";
import PurchaseSuccessModal from "@/components/PurchaseSuccessModal";
import LoginCard from "@/components/LoginCard";
import AnnouncementHero from "@/components/AnnouncementHero";
import UserManagerSettings from "@/components/UserManagerSettings";

type PackageSize = "small" | "medium" | "large" | "huge";

const packageStyle = {
  small: {
    card: "from-emerald-50 to-emerald-100 border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
    accent: "bg-emerald-500",
    button: "bg-emerald-600 text-white hover:bg-emerald-700",
    icon: <Wifi className="h-6 w-6 text-emerald-600" />,
    label: "صغيرة",
    meaning: "اقتصادية وذكية",
  },
  medium: {
    card: "from-blue-50 to-blue-100 border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    accent: "bg-blue-500",
    button: "bg-blue-600 text-white hover:bg-blue-700",
    icon: <Zap className="h-6 w-6 text-blue-600" />,
    label: "متوسطة",
    meaning: "توازن وسرعة",
  },
  large: {
    card: "from-purple-50 to-purple-100 border-purple-200",
    badge: "bg-purple-100 text-purple-700",
    accent: "bg-purple-500",
    button: "bg-purple-600 text-white hover:bg-purple-700",
    icon: <Crown className="h-6 w-6 text-purple-600" />,
    label: "كبيرة",
    meaning: "تجربة متقدمة",
  },
  huge: {
    card: "from-amber-50 to-amber-100 border-amber-200",
    badge: "bg-amber-100 text-amber-800",
    accent: "bg-amber-500",
    button: "bg-amber-500 text-slate-950 hover:bg-amber-600",
    icon: <Gem className="h-6 w-6 text-amber-600" />,
    label: "ضخمة",
    meaning: "أقصى سعة",
  },
} as const;

export default function Store() {
  const { user } = useAuth();
  const [adminView, setAdminView] = React.useState<"usermanager" | "store">("store");
  const [category, setCategory] = React.useState<"card" | "subscription">("card");
  const [selectedPackage, setSelectedPackage] = React.useState<number | null>(null);

  React.useEffect(() => {
    const handleAdminLogin = () => setAdminView("usermanager");
    window.addEventListener("admin_logged_in", handleAdminLogin);
    return () => window.removeEventListener("admin_logged_in", handleAdminLogin);
  }, []);
  const [topUpOpen, setTopUpOpen] = React.useState(false);
  const [successOpen, setSuccessOpen] = React.useState(false);
  const [successData, setSuccessData] = React.useState<{
    pinCode: string;
    packageName: string;
    loginUrl?: string;
    syncedToRouter?: boolean;
    routerMessage?: string;
  } | null>(null);
  const utils = trpc.useUtils();

  const { data: packages = [], isLoading: packagesLoading } = trpc.packages.getByCategory.useQuery(category);
  const { data: wallet } = trpc.wallet.getBalance.useQuery(undefined, { enabled: Boolean(user) });

  const buyMutation = trpc.purchases.buyPackage.useMutation({
    onSuccess: data => {
      setSelectedPackage(null);
      setSuccessData({
        pinCode: data.pinCode,
        packageName: data.packageName,
        loginUrl: data.loginUrl,
        syncedToRouter: data.syncedToRouter,
        routerMessage: data.routerMessage,
      });
      setSuccessOpen(true);
      void utils.wallet.getBalance.invalidate();
      void utils.purchases.getUserPurchases.invalidate();
      void utils.transactions.getHistory.invalidate();
    },
    onError: error => {
      setSelectedPackage(null);
      toast.error(error.message || "تعذر إتمام عملية الشراء. حاول مرة أخرى.");
    },
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("تم تسجيل الخروج بنجاح.");
      void utils.auth.me.invalidate();
    },
  });

  const handleBuyClick = (packageId: number) => {
    if (!user) {
      toast.error("سجّل الدخول أولاً لإتمام شراء الباقة.");
      document.querySelector(".shamel-auth-card")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (!wallet || Number(wallet.balance) <= 0) {
      toast.error("رصيد محفظتك غير كافٍ. يرجى شحن المحفظة للمتابعة.");
      setTopUpOpen(true);
      return;
    }

    setSelectedPackage(packageId);
    buyMutation.mutate({ packageId });
  };

  const formatPrice = (price: string) =>
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(price));

  const handleAnnouncementAction = (ctaText: string) => {
    if (ctaText.includes("شحن") || ctaText.includes("رصيد")) {
      setTopUpOpen(true);
      return;
    }
    if (ctaText.includes("كروتي")) {
      window.location.assign("/cards");
      return;
    }
    document.getElementById("packages-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="shamel-premium-shell min-h-screen p-4">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/manus-storage/al-shamel-logo_9fc75833.jpeg" alt="شعار الشامل لخدمات الإنترنت" className="h-16 w-24 rounded-xl border border-amber-200/80 bg-white object-contain p-1 shadow-md shadow-blue-950/10 sm:h-20 sm:w-28" />
            <div>
              <p className="mb-1 text-xs font-black tracking-[0.18em] text-blue-600">AL SHAMEL SERVICES</p>
              <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">الشامل لخدمات الإنترنت</h1>
              <p className="mt-1 text-xs text-slate-600 sm:text-sm">اختر الباقة الأنسب، ثم أكمل الشراء بأمان من محفظتك.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!user ? (
              <Button
                size="sm"
                onClick={() => document.querySelector(".shamel-auth-card")?.scrollIntoView({ behavior: "smooth" })}
                className="bg-blue-700 text-xs font-black text-white hover:bg-blue-800 shadow-md cursor-pointer transition active:scale-95"
              >
                <LogIn className="ml-1.5 h-4 w-4" /> تسجيل الدخول
              </Button>
            ) : (
              <button
                type="button"
                onClick={() => setTopUpOpen(true)}
                className="group flex items-center gap-2 rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-100 via-amber-50 to-white px-3 py-1.5 shadow-sm transition hover:border-amber-400 hover:shadow active:scale-95 cursor-pointer"
                title="اضغط لشحن المحفظة فوراً"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-400 text-xs font-black text-slate-950 shadow-xs">
                  💰
                </span>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-amber-900 leading-none">المحفظة</p>
                  <p className="text-xs font-black text-slate-950 leading-tight">
                    {wallet ? formatPrice(wallet.balance) : "0"} ر.ي
                  </p>
                </div>
                <span className="rounded-lg bg-amber-400 px-1.5 py-0.5 text-[10px] font-black text-slate-950 group-hover:bg-amber-300">
                  + شحن
                </span>
              </button>
            )}
            <div className="hidden items-center gap-1.5 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-3 py-2 text-[11px] font-black text-emerald-800 shadow-xs sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              شبكة الشامل أونلاين
            </div>
          </div>
        </header>

        {/* User / Admin Session Bar */}
        {user && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-white p-3.5 shadow-md shadow-blue-950/5 sm:px-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-900 p-2 text-amber-300 shadow-sm">
                {user.role === "admin" ? <ShieldCheck className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-950">
                    {user.role === "admin" ? "المدير العام" : (user.name || "مستخدم الشامل")}
                  </span>
                  {user.role === "admin" && (
                    <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-black text-slate-950 shadow-sm">
                      صلاحيات كاملة
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {user.role === "admin" ? "إدارة كاملة للنظام واليوزرمانجر" : (user.name || "عميل الشامل نت")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {user.role === "admin" && (
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
                  <Button
                    size="sm"
                    variant={adminView === "usermanager" ? "default" : "ghost"}
                    onClick={() => setAdminView("usermanager")}
                    className={`text-xs font-black transition ${
                      adminView === "usermanager"
                        ? "bg-blue-800 text-white shadow-sm"
                        : "text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    <Settings2 className="ml-1.5 h-3.5 w-3.5" /> إعدادات اليوزرمانجر
                  </Button>
                  <Button
                    size="sm"
                    variant={adminView === "store" ? "default" : "ghost"}
                    onClick={() => setAdminView("store")}
                    className={`text-xs font-black transition ${
                      adminView === "store"
                        ? "bg-blue-800 text-white shadow-sm"
                        : "text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    <ShoppingBag className="ml-1.5 h-3.5 w-3.5" /> تصفح المتجر
                  </Button>
                </div>
              )}
              {user.role === "admin" && (
                <Button
                  size="sm"
                  onClick={() => window.location.assign("/admin")}
                  className="bg-amber-400 font-black text-slate-950 hover:bg-amber-300 shadow-sm"
                >
                  <BarChart3 className="ml-1.5 h-4 w-4" /> لوحة التحكم الكاملة
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="border-slate-300 text-slate-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
              >
                <LogOut className="ml-1.5 h-4 w-4" /> خروج
              </Button>
            </div>
          </div>
        )}

        {/* If user is admin and in usermanager view, display the integration settings */}
        {user?.role === "admin" && adminView === "usermanager" ? (
          <div>
            <UserManagerSettings />
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setAdminView("store")}
                className="border-blue-300 bg-white font-bold text-blue-800 hover:bg-blue-50"
              >
                <ShoppingBag className="ml-2 h-4 w-4" /> الانتقال لتصفح باقات وكروت المتجر
              </Button>
            </div>
          </div>
        ) : (
          <>
            <AnnouncementHero onAction={handleAnnouncementAction} />

            {!user && <LoginCard />}

            {user && (
              <Card className="shamel-wallet mt-6 border-0 text-white shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
                  <div>
                    <p className="text-xs font-bold text-blue-100 sm:text-sm">رصيد محفظتك الحالي</p>
                    <p className="mt-1 text-2xl font-black tabular-nums sm:text-3xl">
                      {wallet ? formatPrice(wallet.balance) : "0"} <span className="text-base font-bold">ر.ي</span>
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => setTopUpOpen(true)}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-lg cursor-pointer text-sm sm:text-base px-6 py-2.5 transition active:scale-95 select-none"
                  >
                    💰 شحن المحفظة
                  </Button>
                </div>
              </Card>
            )}

            <Tabs id="packages-list" value={category} onValueChange={value => setCategory(value as "card" | "subscription")} className="mt-6 scroll-mt-4">
              <TabsList className="shamel-tabs grid w-full grid-cols-2 rounded-2xl p-1.5">
                <TabsTrigger value="card" className="rounded-xl font-bold">الكروت</TabsTrigger>
                <TabsTrigger value="subscription" className="rounded-xl font-bold">الاشتراكات</TabsTrigger>
              </TabsList>

              <p className="shamel-legend mt-4 rounded-xl border px-4 py-3 text-center text-xs font-semibold leading-6 text-slate-600">
                اختر شعورك مع الاستخدام: <span className="text-emerald-700">الأخضر للاقتصادية الذكية</span>، <span className="text-blue-700">الأزرق للتوازن والسرعة</span>، <span className="text-purple-700">البنفسجي للتجربة المتقدمة</span>، و<span className="text-amber-700">الذهبي لأقصى سعة</span>.
              </p>

              <TabsContent value="card" className="mt-5 space-y-4">
                <PackageList
                  packages={packages}
                  isLoading={packagesLoading}
                  selectedPackage={selectedPackage}
                  isBuying={buyMutation.isPending}
                  onBuy={handleBuyClick}
                  formatPrice={formatPrice}
                  actionLabel="شراء الآن"
                />
              </TabsContent>

              <TabsContent value="subscription" className="mt-5 space-y-4">
                <PackageList
                  packages={packages}
                  isLoading={packagesLoading}
                  selectedPackage={selectedPackage}
                  isBuying={buyMutation.isPending}
                  onBuy={handleBuyClick}
                  formatPrice={formatPrice}
                  actionLabel="تفعيل الآن"
                />
              </TabsContent>
            </Tabs>
          </>
        )}

        <TopUpModal open={topUpOpen} onOpenChange={setTopUpOpen} />

        {user && successData && (
          <PurchaseSuccessModal
            open={successOpen}
            onOpenChange={setSuccessOpen}
            pinCode={successData.pinCode}
            packageName={successData.packageName}
            loginUrl={successData.loginUrl}
            syncedToRouter={successData.syncedToRouter}
            routerMessage={successData.routerMessage}
          />
        )}
      </div>
    </div>
  );
}

type PackageListProps = {
  packages: Array<{
    id: number;
    name: string;
    description: string | null;
    price: string;
    size: PackageSize;
  }>;
  isLoading: boolean;
  selectedPackage: number | null;
  isBuying: boolean;
  onBuy: (packageId: number) => void;
  formatPrice: (price: string) => string;
  actionLabel: string;
};

function PackageList({ packages, isLoading, selectedPackage, isBuying, onBuy, formatPrice, actionLabel }: PackageListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-14">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <Card className="p-10 text-center text-slate-600">
        لا توجد باقات متاحة في هذا القسم حالياً.
      </Card>
    );
  }

  return packages.map(pkg => {
    const style = packageStyle[pkg.size];
    const isThisPackageBuying = isBuying && selectedPackage === pkg.id;

    return (
      <Card
        key={pkg.id}
        className={`relative overflow-hidden border-2 bg-gradient-to-br p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${style.card}`}
      >
        <div className={`absolute inset-y-0 right-0 w-1.5 ${style.accent}`} aria-hidden="true" />
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <span className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-black ${style.badge}`}>{style.label} · {style.meaning}</span>
          <div className="flex min-w-0 items-start gap-4">
            <div className="rounded-2xl bg-white p-3 shadow-sm">{style.icon}</div>
            <div className="min-w-0">
              <h2 className="text-xl font-black text-slate-950">{pkg.name}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{pkg.description}</p>
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between gap-4 border-t border-slate-900/5 pt-5">
          <div>
            <p className="mb-1 text-xs font-bold text-slate-500">السعر المعتمد</p>
            <p className="text-3xl font-black tabular-nums text-slate-950">
              {formatPrice(pkg.price)} <span className="text-sm text-slate-600">ر.ي</span>
            </p>
          </div>
          <Button onClick={() => onBuy(pkg.id)} disabled={isThisPackageBuying} className={`min-w-28 shadow-sm ${style.button}`}>
            {isThisPackageBuying ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />جارٍ التنفيذ</> : actionLabel}
          </Button>
        </div>
      </Card>
    );
  });
}
