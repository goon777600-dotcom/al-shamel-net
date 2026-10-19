import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Store from "./pages/Store";
import MyCards from "./pages/MyCards";
import History from "./pages/History";
import Support from "./pages/Support";
import AdminDashboard from "./pages/AdminDashboard";
import Join from "./pages/Join";
import ClientPreview from "./pages/ClientPreview";
import Settings from "./pages/Settings";
import BottomNav from "./components/BottomNav";

function ScrollToTop({ location }: { location: string }) {
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
    return () => window.cancelAnimationFrame(frame);
  }, [location]);

  return null;
}

function Router() {
  const [location] = useLocation();
  const reduceMotion = useReducedMotion();
  const isClientPreview = location.startsWith("/preview/client") || location.startsWith("/client-preview");
  // make sure to consider if you need authentication for certain routes
  return (
    <div className="pb-[calc(5.75rem+env(safe-area-inset-bottom))]">
      <ScrollToTop location={location} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -7 }}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.23, 1, 0.32, 1] }}
        >
          <Switch>
            <Route path={"/"} component={Store} />
            <Route path={"/cards"} component={MyCards} />
            <Route path={"/history"} component={History} />
            <Route path={"/support"} component={Support} />
            <Route path={"/settings"} component={Settings} />
            <Route path={"/admin"} component={AdminDashboard} />
            <Route path={"/join"} component={Join} />
            <Route path={"/preview/client"} component={ClientPreview} />
            <Route path={"/client-preview"} component={ClientPreview} />
            <Route path={"/404"} component={NotFound} />
            {/* Final fallback route */}
            <Route component={NotFound} />
          </Switch>
        </motion.div>
      </AnimatePresence>
      {!isClientPreview && <BottomNav />}
    </div>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
