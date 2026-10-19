import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Wifi, History, LifeBuoy, BarChart3 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function BottomNav() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location === path;

  const navItems = [
    { path: "/", label: "المتجر", icon: ShoppingBag },
    { path: "/cards", label: "كروتي", icon: Wifi },
    { path: "/history", label: "السجل", icon: History },
    { path: "/support", label: "الدعم", icon: LifeBuoy },
    ...(user?.role === "admin" ? [{ path: "/admin", label: "الإدارة", icon: BarChart3 }] : []),
  ];

  return (
    <nav aria-label="التنقل الرئيسي" className="shamel-bottom-nav fixed bottom-0 left-0 right-0 z-40 border-t pb-[max(0.35rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-4xl px-1.5 sm:px-4">
        <div className="flex min-h-[3.9rem] items-stretch justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.path}
                variant="ghost"
                onClick={() => navigate(item.path)}
                className={`h-[3.9rem] min-w-0 flex-1 flex-col items-center justify-center gap-0 rounded-none border-b-2 px-0 py-1.5 transition-all ${
                  isActive(item.path)
                    ? "border-b-amber-500 text-blue-800"
                    : "border-b-transparent text-slate-600 hover:text-blue-800"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="mt-0.5 block max-w-full truncate px-0.5 text-[10px] font-bold leading-3 sm:text-xs">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
