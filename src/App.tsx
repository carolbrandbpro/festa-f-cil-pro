import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [ready, setReady] = useState(false);
  const [logged, setLogged] = useState(false);
  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      if (!supabase) {
        setLogged(true);
        setReady(true);
        return;
      }
      const { data } = await supabase.auth.getSession();
      setLogged(!!data.session);
      setReady(true);
      const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
        setLogged(!!session);
      });
      unsub = () => sub.subscription.unsubscribe();
    })();
    return () => { if (unsub) unsub(); };
  }, []);
  if (!ready) return null;
  if (!logged) return <Navigate to="/login" replace />;
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {!supabase && (
        <div className="fixed bottom-3 right-3 z-50 rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground">
          Modo offline
        </div>
      )}
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/login" element={supabase ? <Login /> : <Navigate to="/" replace />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
