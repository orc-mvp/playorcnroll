import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CreateCharacter from "./pages/CreateCharacter";
import CreateSession from "./pages/CreateSession";
import SessionLobby from "./pages/SessionLobby";
import JoinSession from "./pages/JoinSession";
import MySessions from "./pages/MySessions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/character/create" element={<CreateCharacter />} />
              <Route path="/session/create" element={<CreateSession />} />
              <Route path="/session/:sessionId/lobby" element={<SessionLobby />} />
              <Route path="/session/:sessionId" element={<SessionLobby />} />
              <Route path="/join" element={<JoinSession />} />
              <Route path="/join/:code" element={<JoinSession />} />
              <Route path="/sessions" element={<MySessions />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
