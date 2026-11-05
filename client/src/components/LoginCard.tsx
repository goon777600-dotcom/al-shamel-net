import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  BadgeCheck,
  LockKeyhole,
  LogIn,
  Mail,
  ShieldCheck,
  UserRoundPlus,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { COOKIE_NAME } from "@shared/const";

type AuthMode = "login" | "register";

const logoUrl = "/images/al-shamel-logo.png";

export default function LoginCard() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneOrEmail, setPhoneOrEmail] = useState("");

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
      void utils.wallet.getBalance.invalidate();

      if (data.user?.role === "admin") {
        toast.success("مرحباً بك يا مدير! تم تفعيل صلاحيات الإدارة وظهور قسم الإعدادات فوراً.");
        window.dispatchEvent(new Event("admin_logged_in"));
      } else {
        toast.success(`مرحباً بك ${data.user?.name || ""}! تم تسجيل الدخول بنجاح.`);
      }
    },
    onError: (error) => {
      toast.error(error.message || "فشل تسجيل الدخول. تأكد من صحة البيانات.");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
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
      void utils.wallet.getBalance.invalidate();

      if (data.user?.role === "admin") {
        toast.success("مرحباً بك يا مدير! تم إنشاء الحساب وتفعيل لوحة الإعدادات فوراً.");
        window.dispatchEvent(new Event("admin_logged_in"));
      } else {
        toast.success(`تم إنشاء حسابك بنجاح! مرحباً بك ${data.user?.name || ""}.`);
      }
    },
    onError: (error) => {
      toast.error(error.message || "تعذر إنشاء الحساب. تأكد من البيانات المدخلة.");
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      toast.error("يرجى إدخال البريد الإلكتروني أو رقم الهاتف وكلمة المرور.");
      return;
    }
    loginMutation.mutate({
      identifier: identifier.trim(),
      password,
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 3) {
      toast.error("يرجى كتابة الاسم كاملاً.");
      return;
    }
    if (!phoneOrEmail.trim() || phoneOrEmail.trim().length < 5) {
      toast.error("يرجى إدخال رقم هاتف أو بريد إلكتروني صحيح.");
      return;
    }
    if (!password || password.length < 4) {
      toast.error("كلمة المرور يجب أن لا تقل عن 4 خانات.");
      return;
    }
    registerMutation.mutate({
      name: fullName.trim(),
      phone: phoneOrEmail.trim(),
      password,
    });
  };

  return (
    <Card className="shamel-auth-card mt-6 mx-auto max-w-lg overflow-hidden bg-white shadow-xl border border-blue-100 rounded-3xl p-6 sm:p-8">
      {/* الشعار الرسمي في المنتصف */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="mb-3 flex justify-center rounded-2xl border border-amber-200/80 bg-white/95 p-3 shadow-md">
          <img
            src={logoUrl}
            alt="شعار الشامل لخدمات الإنترنت"
            className="h-14 sm:h-16 w-auto object-contain block select-none"
          />
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> نظام آمن وموثوق
        </span>
        <h3 className="mt-2 text-xl font-black text-slate-950">
          بوابة الشامل نت لخدمات الإنترنت
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          سجل دخولك أو أنشئ حسابك للاستفادة من باقات وكروت الإنترنت وشحن المحفظة
        </p>
      </div>

      {/* التبديل بين تسجيل الدخول وحساب جديد */}
      <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1.5">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-lg px-3 py-2.5 text-sm font-black transition ${
            mode === "login" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          تسجيل الدخول
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`rounded-lg px-3 py-2.5 text-sm font-black transition ${
            mode === "register" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          حساب جديد
        </button>
      </div>

      {mode === "login" ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-2 flex items-center gap-2 text-xs sm:text-sm font-black text-slate-700">
              <Mail className="h-4 w-4 text-blue-600" />
              البريد الإلكتروني أو رقم الهاتف
            </label>
            <Input
              placeholder="أدخل البريد الإلكتروني أو رقم الهاتف"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="h-12 text-right font-medium"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-xs sm:text-sm font-black text-slate-700">
              <LockKeyhole className="h-4 w-4 text-blue-600" />
              كلمة المرور
            </label>
            <Input
              type="password"
              placeholder="أدخل كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12"
            />
          </div>

          <Button
            type="submit"
            disabled={loginMutation.isPending}
            className="h-12 w-full bg-blue-600 font-black text-white hover:bg-blue-700 shadow-md cursor-pointer transition active:scale-95 text-sm sm:text-base"
          >
            <LogIn className="ml-2 h-5 w-5" />
            {loginMutation.isPending ? "جارٍ تسجيل الدخول…" : "دخول الحساب"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="mb-2 flex items-center gap-2 text-xs sm:text-sm font-black text-slate-700">
              <UserRoundPlus className="h-4 w-4 text-blue-600" />
              الاسم الرباعي
            </label>
            <Input
              placeholder="مثال: محمد أحمد صالح علي"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-12"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-xs sm:text-sm font-black text-slate-700">
              <Mail className="h-4 w-4 text-blue-600" />
              رقم الهاتف أو البريد الإلكتروني
            </label>
            <Input
              placeholder="أدخل رقم الهاتف أو البريد الإلكتروني"
              value={phoneOrEmail}
              onChange={(e) => setPhoneOrEmail(e.target.value)}
              className="h-12 text-right"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-xs sm:text-sm font-black text-slate-700">
              <LockKeyhole className="h-4 w-4 text-blue-600" />
              كلمة المرور
            </label>
            <Input
              type="password"
              placeholder="كلمة مرور مكونة من 4 خانات على الأقل"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12"
            />
          </div>

          <Button
            type="submit"
            disabled={registerMutation.isPending}
            className="h-12 w-full bg-emerald-600 font-black text-white hover:bg-emerald-700 shadow-md cursor-pointer transition active:scale-95 text-sm sm:text-base"
          >
            <BadgeCheck className="ml-2 h-5 w-5" />
            {registerMutation.isPending ? "جارٍ إنشاء الحساب…" : "تأكيد التسجيل والدخول"}
          </Button>
        </form>
      )}

      {/* ميزات سريعة خفيفة أسفل النموذج */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 border-t border-slate-100 pt-4 text-[11px] font-bold text-slate-500">
        <span className="rounded-lg bg-slate-50 px-2.5 py-1">📶 باقات متنوعة</span>
        <span className="rounded-lg bg-slate-50 px-2.5 py-1">⚡ شحن سريع</span>
        <span className="rounded-lg bg-slate-50 px-2.5 py-1">📍 من أي مكان</span>
        <span className="rounded-lg bg-slate-50 px-2.5 py-1">🛡️ حماية وأمان</span>
      </div>
    </Card>
  );
}
