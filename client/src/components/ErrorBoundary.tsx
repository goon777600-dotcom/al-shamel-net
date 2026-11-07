import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    try {
      sessionStorage.clear();
      localStorage.removeItem("auth_token");
      localStorage.removeItem("manus-cookie");
      localStorage.removeItem("manus-runtime-user-info");
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-6 bg-gradient-to-br from-[#061c3f] to-[#041026] text-white" dir="rtl">
          <div className="flex flex-col items-center w-full max-w-lg p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 text-center shadow-2xl">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30">
              <AlertTriangle size={36} />
            </div>

            <h2 className="text-xl font-black mb-2">تعذر تحميل الصفحة مؤقتاً</h2>
            <p className="text-xs text-blue-100/80 mb-6 leading-relaxed">
              حدث خطأ غير متوقع أثناء تهيئة المتجر. يرجى الضغط على زر التحديث أدناه لإعادة التحميل والمتابعة بشكل طبيعي.
            </p>

            <button
              onClick={this.handleReset}
              className={cn(
                "flex items-center justify-center gap-2 px-6 py-3 rounded-2xl",
                "bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black",
                "shadow-lg shadow-amber-500/20 cursor-pointer text-sm w-full transition"
              )}
            >
              <RotateCcw size={18} />
              إعادة تحميل الصفحة الآن
            </button>

            {this.state.error?.message && (
              <details className="mt-5 w-full text-right">
                <summary className="text-[11px] text-blue-200/60 cursor-pointer hover:text-blue-100">
                  تفاصيل تقنية للمدير
                </summary>
                <div className="mt-2 p-3 w-full rounded-xl bg-black/40 text-[10px] font-mono text-amber-200/80 overflow-auto max-h-36 text-left dir-ltr">
                  {this.state.error.message}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
