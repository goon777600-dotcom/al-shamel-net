import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Wifi, ExternalLink, Share2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PurchaseSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pinCode: string;
  packageName: string;
  loginUrl?: string;
  syncedToRouter?: boolean;
  routerMessage?: string;
}

export default function PurchaseSuccessModal({
  open,
  onOpenChange,
  pinCode,
  packageName,
  loginUrl = "http://100.100.100.1",
  syncedToRouter = true,
  routerMessage,
}: PurchaseSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    try {
      navigator.clipboard?.writeText(pinCode);
    } catch {}
    setCopied(true);
    toast.success("تم نسخ رمز الدخول بنجاح");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaWhatsApp = () => {
    const text = `كرت الشامل نت 🌐\nالباقة: ${packageName}\nرمز الدخول (PIN): ${pinCode}\nرابط تسجيل الدخول: ${loginUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleLoginNow = () => {
    try {
      navigator.clipboard?.writeText(pinCode);
      setCopied(true);
    } catch {}
    toast.success("تم نسخ كود الدخول تلقائياً، جاري فتح بوابة الشبكة...");
    const base = loginUrl && !loginUrl.includes("logout") ? loginUrl : "http://100.100.100.1";
    // Directly target hotspot login with PIN
    const target = `${base.replace(/\/+$/, "")}/login?username=${encodeURIComponent(pinCode)}&password=${encodeURIComponent(pinCode)}`;
    window.open(target, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <div className="text-center">
          {/* Success Badge */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-xl shadow-emerald-500/25">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <h3 className="text-2xl font-black text-slate-950">تم إصدار الكرت بنجاح!</h3>
          <p className="mt-1 text-sm font-semibold text-slate-600">باقة: {packageName}</p>

          {syncedToRouter && (
            <div className="mx-auto mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              مفعّل في سيرفر اليوزر مانجر
            </div>
          )}

          {/* PIN Display */}
          <div className="mt-5 rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50/90 to-slate-50 p-4 shadow-sm">
            <p className="text-xs font-black tracking-wider text-blue-700">رمز الدخول الخاص بك (PIN CODE)</p>
            <div className="mt-2.5 flex items-center justify-between rounded-xl border border-blue-100 bg-white p-3.5 shadow-sm">
              <span className="font-mono text-2xl font-black tracking-[0.22em] text-slate-900 sm:text-3xl">
                {pinCode}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 font-black text-blue-700 hover:bg-blue-100"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                <span className="text-xs">{copied ? "تم النسخ" : "نسخ"}</span>
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 space-y-2.5">
            <Button
              onClick={handleLoginNow}
              className="h-11 w-full bg-gradient-to-r from-blue-700 to-blue-900 font-black text-white shadow-lg shadow-blue-900/20 hover:from-blue-800 hover:to-blue-950"
            >
              <Wifi className="ml-2 h-4 w-4" /> تسجيل الدخول في الشبكة الآن
              <ExternalLink className="mr-1.5 h-3.5 w-3.5 opacity-70" />
            </Button>

            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="outline"
                onClick={shareViaWhatsApp}
                className="h-10 border-emerald-200 bg-emerald-50/70 font-black text-emerald-800 hover:bg-emerald-100"
              >
                <Share2 className="ml-1.5 h-4 w-4" /> مشاركة الكرت
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-10 border-slate-200 bg-white font-black text-slate-700 hover:bg-slate-50"
              >
                تم، إغلاق النافذة
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-right text-xs leading-5 text-amber-900">
            <p className="font-black">💡 تلميح سريع:</p>
            <p className="mt-0.5">
              يمكنك الرجوع لكرتك في أي وقت من قائمة <b>«كروتي»</b>، ولن تضيع تفاصيله أبداً.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
