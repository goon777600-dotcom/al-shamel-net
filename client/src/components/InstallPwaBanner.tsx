import { useState, useEffect } from "react";
import { Download, X, Smartphone, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPwaBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Check if already running in standalone/PWA mode
    if (typeof window !== "undefined") {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;

      setIsStandalone(isStandaloneMode);

      // Check session dismissal
      try {
        if (sessionStorage.getItem("shamel_install_dismissed") === "true") {
          setDismissed(true);
        }
      } catch {}

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }
  }, []);

  if (isStandalone || dismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDismissed(true);
      }
      setDeferredPrompt(null);
    } else {
      // If iOS or browser doesn't support beforeinstallprompt, show the friendly guide
      const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
      if (isIos) {
        setShowIosGuide(true);
      } else {
        alert("لتثبيت التطبيق على جوالك:\nاضغط على قائمة المتصفح (⋮) ثم اختر 'تثبيت التطبيق' أو 'إضافة إلى الشاشة الرئيسية'.");
      }
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("shamel_install_dismissed", "true");
    } catch {}
  };

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-amber-300/80 bg-gradient-to-l from-[#061c3f] via-[#092b5a] to-[#0c4384] p-3.5 text-white shadow-xl shadow-blue-950/20 transition-all sm:p-4">
      <div className="flex items-center justify-between gap-3">
        {/* App Logo & Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <img
              src="/icon-192.png"
              alt="أيقونة تطبيق الشامل"
              className="h-12 w-12 rounded-xl border border-amber-300/60 object-contain shadow-md sm:h-14 sm:w-14"
            />
            <span className="absolute -bottom-1 -left-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white ring-2 ring-[#061c3f]">
              <Sparkles className="h-2.5 w-2.5" />
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-black text-white sm:text-base">
                تطبيق الشامل لخدمات الإنترنت
              </h3>
              <span className="hidden rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-300/30 sm:inline-block">
                تطبيق رسمي
              </span>
            </div>
            <p className="mt-0.5 truncate text-[11px] font-medium text-blue-100/90 sm:text-xs">
              ثبّت التطبيق على شاشة جوالك للوصول السريع لشحن المحفظة وشراء الكروت
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleInstallClick}
            className="h-9 px-3.5 text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-xl shadow-md shadow-amber-500/20 cursor-pointer active:scale-95 transition"
          >
            <Download className="ml-1.5 h-3.5 w-3.5" />
            تثبيت التطبيق
          </Button>

          <button
            type="button"
            onClick={handleDismiss}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-blue-200/70 hover:bg-white/10 hover:text-white transition"
            title="إغلاق التنبيه"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* iOS Instructions Dropdown */}
      {showIosGuide && (
        <div className="mt-3 rounded-xl border border-white/15 bg-black/30 p-3 text-right text-xs leading-relaxed text-amber-100">
          <p className="font-bold text-white mb-1">طريقة التثبيت على الآيفون (Safari):</p>
          <p>1. اضغط على زر المشاركة <span className="inline-block px-1.5 py-0.5 bg-white/20 rounded font-mono">⎋</span> في أسفل المتصفح.</p>
          <p>2. اختر من القائمة <span className="font-bold text-amber-300">«إضافة إلى الصفحة الرئيسية (Add to Home Screen)»</span>.</p>
        </div>
      )}
    </div>
  );
}
