import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CreateCharacter from "./pages/CreateCharacter";
import MyCharacters from "./pages/MyCharacters";
import CharacterSheet from "./pages/CharacterSheet";
import CreateSession from "./pages/CreateSession";
import Customization from "./pages/Customization";
import SessionLobby from "./pages/SessionLobby";
import Session from "./pages/Session";
import JoinSession from "./pages/JoinSession";
import MySessions from "./pages/MySessions";
import VampireSession from "./pages/VampireSession";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Main App component with all providers
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth defaultMode="login" />} />
            <Route path="/login" element={<Auth defaultMode="login" />} />
            <Route path="/signup" element={<Auth defaultMode="signup" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/character/create" element={<CreateCharacter />} />
            <Route path="/characters" element={<MyCharacters />} />
            <Route path="/character/:characterId" element={<CharacterSheet />} />
            <Route path="/session/create" element={<CreateSession />} />
            <Route path="/customization" element={<Customization />} />
            <Route path="/marks" element={<Customization />} />
            <Route path="/merits-flaws" element={<Customization />} />
            <Route path="/session/:sessionId/lobby" element={<SessionLobby />} />
            <Route path="/session/:sessionId" element={<Session />} />
            <Route path="/session/vampire/:sessionId" element={<VampireSession />} />
            <Route path="/join" element={<JoinSession />} />
            <Route path="/join/:code" element={<JoinSession />} />
            <Route path="/sessions" element={<MySessions />} />
            <Route path="/profile" element={<Profile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
