import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UIToaster } from "@/components/ui/toaster-wrapper";
import { SonnerToaster } from "@/components/ui/sonner-toaster";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { SavedCardsProvider } from "@/contexts/SavedCardsContext";
import { InspectorProfileProvider } from "@/contexts/InspectorProfileContext";
import { SettingsSync } from "@/components/SettingsSync";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { UpdateNotification } from "@/components/UpdateNotification";
import SplashScreen from "./components/SplashScreen";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Standards from "./pages/Standards";
import MyStandards from "./pages/MyStandards";
import NotFound from "./pages/NotFound";
import { GaugeDemo } from "./pages/GaugeDemo";
import TechnicalDrawingTest from "./pages/TechnicalDrawingTest";
import BlockDesigner from "./pages/BlockDesigner";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isOffline } = useServiceWorker();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (isOffline) {
      console.log('App is offline - using cached data');
    }
  }, [isOffline]);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/standards" element={<Standards />} />
        <Route path="/my-standards" element={<MyStandards />} />
        <Route path="/gauge-demo" element={<GaugeDemo />} />
        <Route path="/drawing-test" element={<TechnicalDrawingTest />} />
        <Route path="/block-designer" element={<BlockDesigner />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <UIToaster />
      <SonnerToaster />
      <UpdateNotification />
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SettingsProvider>
      <SettingsSync />
      <SavedCardsProvider>
        <InspectorProfileProvider>
          <OrganizationProvider>
            <AppContent />
          </OrganizationProvider>
        </InspectorProfileProvider>
      </SavedCardsProvider>
    </SettingsProvider>
  </QueryClientProvider>
);

export default App;
