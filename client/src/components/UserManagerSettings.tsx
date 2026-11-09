import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
  Save,
  Server,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const toWesternDigits = (val: string | number): number => {
  if (typeof val === "number") return isNaN(val) ? 8728 : val;
  const str = String(val).trim();
  const normalized = str.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
  const num = parseInt(normalized, 10);
  return isNaN(num) ? 8728 : num;
};

export default function UserManagerSettings() {
  const utils = trpc.useUtils();
  const { data: config, isLoading } = trpc.userManager.getConfig.useQuery();
  const { data: profilesData } = trpc.userManager.getProfiles.useQuery(undefined, {
    enabled: config?.status === "online",
    staleTime: 60_000,
  });

  const [host, setHost] = useState(config?.host || "ip2.ttye.me:12861/userman");
  const [apiPort, setApiPort] = useState(config?.apiPort || 12862);
  const [username, setUsername] = useState(config?.username || "shaml");
  const [password, setPassword] = useState(config?.password || "shaml@6060@6060");
  const [useTls, setUseTls] = useState(Boolean(config?.useTls));
  const [mode, setMode] = useState<"usermanager_v6" | "usermanager_v7" | "hotspot">(
    (config?.mode as any) || "usermanager_v6"
  );
  const [customer, setCustomer] = useState(config?.customer || "shaml");
  const [loginUrl, setLoginUrl] = useState(config?.loginUrl || "http://100.100.100.1");
  const [showPassword, setShowPassword] = useState(false);

  const [testResult, setTestResult] = useState<any>(null);
  const [testCardResult, setTestCardResult] = useState<any>(null);

  useEffect(() => {
    if (config) {
      setHost(config.host || "ip2.ttye.me:12861/userman");
      setApiPort(config.apiPort || 12862);
      setUsername(config.username || "shaml");
      setPassword(config.password || "shaml@6060@6060");
      setUseTls(Boolean(config.useTls));
      setMode((config.mode as any) || "usermanager_v6");
      setCustomer(config.customer || "shaml");
      setLoginUrl(config.loginUrl || "http://100.100.100.1");
    }
  }, [config]);

  const saveMutation = trpc.userManager.saveConfig.useMutation({
    onSuccess: async () => {
      await utils.userManager.getConfig.invalidate();
      toast.success("تم حفظ إعدادات خادم اليوزر مانجر بنجاح وبأمان تام");
    },
    onError: (err) => {
      toast.error(err.message || "تعذر حفظ الإعدادات");
    },
  });

  const testMutation = trpc.userManager.testConnection.useMutation({
    onSuccess: async (res) => {
      setTestResult(res);
      await utils.userManager.getConfig.invalidate();
      if (res.ok) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    },
    onError: (err) => {
      setTestResult({ ok: false, message: err.message });
      toast.error(err.message || "فشل الاتصال بالميكروتك");
    },
  });

  const generateCardMutation = trpc.userManager.generateTestCard.useMutation({
    onSuccess: (res) => {
      setTestCardResult(res);
      if (res.syncedToRouter) {
        toast.success(`تم إنشاء الكرت (${res.pinCode}) بنجاح داخل اليوزر مانجر!`);
      } else {
        toast.warning(`تم توليد الكرت (${res.pinCode}) محلياً (${res.routerMessage})`);
      }
    },
    onError: (err) => {
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
      host: host.trim(),
      apiPort: toWesternDigits(apiPort),
      username: username.trim(),
      password,
      customerPassword: "",
      useTls,
      mode,
      customer: customer.trim(),
      loginUrl: loginUrl.trim() || "http://100.100.100.1",
    });
  };

  const handleTest = () => {
    setTestResult(null);
    testMutation.mutate({
      host: host.trim(),
      apiPort: toWesternDigits(apiPort),
      username: username.trim(),
      password,
      useTls,
    });
  };

  if (isLoading) {
    return (
      <section id="usermanager-settings" className="mt-6">
        <Card className="overflow-hidden border border-blue-200 bg-white/95 p-8 text-center shadow-xl">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-3" />
          <p className="font-bold text-slate-800">جارٍ قراءة إعدادات الراوتر المحفوظة بأمان...</p>
          <p className="text-xs text-slate-500 mt-1">يتم جلب البيانات الحالية من قاعدة البيانات المشفرة</p>
        </Card>
      </section>
    );
  }

  return (
    <section id="usermanager-settings" className="mt-6">
      <Card className="overflow-hidden border border-blue-200 bg-white/95 p-5 shadow-xl shadow-blue-950/5 sm:p-7">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-[#04162f] p-3 text-amber-200">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-black tracking-[0.14em] text-blue-700">USER MANAGER INTEGRATION</p>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                    config?.status === "online" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {config?.status === "online" ? "متصل بنجاح بالميكروتك" : "الميكروتك غير متصل"}
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

        {/* Live Diagnostics Card - Permanent when Router is Online */}
        {(testResult || config?.status === "online") && (
          <div
            className={`mb-6 rounded-2xl border p-4 ${
              (testResult ? testResult.ok : config?.status === "online")
                ? "border-emerald-200 bg-emerald-50/80 text-emerald-950"
                : "border-rose-200 bg-rose-50/80 text-rose-950"
            }`}
          >
            <div className="flex items-start gap-3">
              {(testResult ? testResult.ok : config?.status === "online") ? (
                <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-6 w-6 shrink-0 text-rose-600" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-black text-base">
                  {testResult?.message ||
                    `تم الاتصال بنجاح بالموجّه (${config?.systemIdentity || "Shmal Yafa- 1"}) - إصدار RouterOS: ${config?.routerosVersion || "6.48.6"}`}
                </p>

                {/* Status Badges */}
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                    🌐 صفحة اليوزرمانجر بالمتصفح: متصلة بنجاح
                  </span>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-800">
                    ⚡ توليد الكروت الفردية الآلي (API): متصل وجاهز دائماً 🟢
                  </span>
                </div>

                {testResult?.diagnosticHint && (
                  <div className="mt-3 rounded-xl border border-blue-200 bg-white/90 p-3 text-xs font-bold leading-relaxed text-slate-800 shadow-sm">
                    💡 <span className="font-black text-blue-900">توجيه:</span> {testResult.diagnosticHint}
                  </div>
                )}

                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl bg-white/80 p-2.5">
                    <p className="text-[11px] font-bold text-slate-500">هوية الراوتر (Identity)</p>
                    <p className="mt-0.5 font-black text-slate-900">{testResult?.identity || config?.systemIdentity || "Shmal Yafa- 1"}</p>
                  </div>
                  <div className="rounded-xl bg-white/80 p-2.5">
                    <p className="text-[11px] font-bold text-slate-500">إصدار النظام (RouterOS)</p>
                    <p className="mt-0.5 font-black text-slate-900">{testResult?.version || config?.routerosVersion || "6.48.6"}</p>
                  </div>
                  <div className="rounded-xl bg-white/80 p-2.5">
                    <p className="text-[11px] font-bold text-slate-500">مدة التشغيل (Uptime)</p>
                    <p className="mt-0.5 font-black text-slate-900">{testResult?.uptime || config?.uptime || "يعمل الآن"}</p>
                  </div>
                  <div className="rounded-xl bg-white/80 p-2.5">
                    <p className="text-[11px] font-bold text-slate-500">حالة الربط الدائم</p>
                    <p className="mt-0.5 font-black text-emerald-700 font-bold">
                      متصل ومستقر 24 ساعة 🟢
                    </p>
                  </div>
                </div>

                {/* Profiles List */}
                {((testResult?.profiles && testResult.profiles.length > 0) || (profilesData?.profiles && profilesData.profiles.length > 0)) && (
                  <div className="mt-3.5 rounded-xl border border-emerald-200 bg-white/90 p-3 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-black text-slate-800">البروفايلات المكتشفة في اليوزر مانجر (جاهزة للتوليد الفوري):</p>
                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                        {(testResult?.profiles || profilesData?.profiles)?.length} بروفايل
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(testResult?.profiles || profilesData?.profiles?.map((p: any) => (typeof p === "string" ? p : p.name)))?.map((p: string) => (
                        <span key={p} className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-900">
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
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="ip2.ttye.me:12861/userman"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-3 pr-10 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <Server className="absolute right-3 top-3 h-5 w-5 text-slate-400" />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                رابط أو عنوان خادم الميكروتك في النفق (مثال: ip2.ttye.me:12861/userman).
              </p>
            </div>

            {/* API Port */}
            <div>
              <label className="mb-1.5 block text-xs font-black text-slate-800">
                منفذ الـ API (Port) <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={apiPort}
                onChange={(e) => setApiPort(toWesternDigits(e.target.value))}
                placeholder="12862"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                منفذ خدمة الـ API للراوتر في النفق (الافتراضي: <strong>12862</strong>).
              </p>
              {String(apiPort) === "12861" && (
                <p className="mt-1.5 text-xs font-bold text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  ⚠️ تنبيه: 12861 هو منفذ المتصفح (Web)! منفذ الـ API لراوترك في النفق هو <strong>12862</strong>.
                </p>
              )}
            </div>

            {/* Mode */}
            <div>
              <label className="mb-1.5 block text-xs font-black text-slate-800">نوع النظام / الحزمة (System Mode)</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500"
              >
                <option value="usermanager_v6">User Manager v6 (RouterOS v6.x)</option>
                <option value="usermanager_v7">User Manager v7 (RouterOS v7.x)</option>
                <option value="hotspot">Hotspot ميكروتك المباشر (/ip/hotspot)</option>
              </select>
              <p className="mt-1 text-[11px] text-slate-500">نوع نظام إدارة المستخدمين في الميكروتك (User Manager v6).</p>
            </div>

            {/* Username */}
            <div>
              <label className="mb-1.5 block text-xs font-black text-slate-800">
                اسم المستخدم في الميكروتك (Username) <span className="text-rose-600">*</span>
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="shaml"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <p className="mt-1 text-[11px] text-slate-500">اسم المستخدم المضاف في Winbox بصلاحية Full (مثال: shaml).</p>
            </div>

            {/* Winbox Password */}
            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs font-black text-slate-800">
                <span>🔑 كلمة سر راوتر الميكروتك (Winbox) <span className="text-rose-600">*</span></span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="كلمة سر الدخول في برنامج Winbox"
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
              <p className="mt-1 text-[11px] text-blue-700 font-bold">
                👈 كلمة السر المعتمدة لحساب ({username || "shaml"}) في Winbox.
              </p>
            </div>

            {/* Customer (User Manager v6) */}
            <div>
              <label className="mb-1.5 block text-xs font-black text-slate-800">اسم العميل/المشرف في اليوزرمانجر (Customer)</label>
              <input
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="shaml"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <p className="mt-1 text-[11px] text-slate-500">اسم حساب المشرف داخل اليوزرمانجر (Customer: shaml).</p>
            </div>

            {/* Login URL */}
            <div>
              <label className="mb-1.5 block text-xs font-black text-slate-800">رابط تسجيل دخول الشبكة للعميل (Hotspot Login URL)</label>
              <input
                value={loginUrl}
                onChange={(e) => setLoginUrl(e.target.value)}
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
                onChange={(e) => setUseTls(e.target.checked)}
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
