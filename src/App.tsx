import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ErrorBoundary } from "react-error-boundary";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageTransition } from "@/components/PageTransition";
import { Navbar } from "@/components/Layout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import PropertiesTable from "./pages/PropertiesTable";
import PropertyDetail from "./pages/PropertyDetail";
import Assets from "./pages/Assets";
import AssetDetail from "./pages/AssetDetail";
import LiabilityDetail from "./pages/LiabilityDetail";
import GeneratePFS from "./pages/GeneratePFS";
import Snapshots from "./pages/Snapshots";
import Business from "./pages/Business";
import Personal from "./pages/Personal";
import Documents from "./pages/Documents";
import GenerateRentRoll from "./pages/GenerateRentRoll";
import GenerateW2 from "./pages/GenerateW2";
import GenerateScheduleE from "./pages/GenerateScheduleE";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-destructive mb-4">Something went wrong</h1>
        <pre className="text-sm text-muted-foreground overflow-auto mb-6 p-4 bg-muted rounded-xl">
          {error.message}
        </pre>
        <div className="flex gap-3">
          <button
            onClick={resetErrorBoundary}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <PageTransition>{children}</PageTransition>
    </ProtectedRoute>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route
          path="/login"
          element={
            <PageTransition>
              <Login />
            </PageTransition>
          }
        />

        {/* Protected */}
        <Route path="/" element={<P><Dashboard /></P>} />
        <Route path="/dashboard" element={<P><Dashboard /></P>} />
        <Route path="/properties" element={<P><PropertiesTable /></P>} />
        <Route path="/properties/cards" element={<P><Properties /></P>} />
        <Route path="/properties/:id" element={<P><PropertyDetail /></P>} />
        <Route path="/assets" element={<P><Assets /></P>} />
        <Route path="/assets/asset/:id" element={<P><AssetDetail /></P>} />
        <Route path="/assets/liability/:id" element={<P><LiabilityDetail /></P>} />
        <Route path="/business" element={<P><Business /></P>} />
        <Route path="/personal" element={<P><Personal /></P>} />
        <Route path="/personal/assets" element={<P><Assets /></P>} />
        <Route path="/documents" element={<P><Documents /></P>} />
        <Route path="/documents/rent-roll" element={<P><GenerateRentRoll /></P>} />
        <Route path="/documents/w2" element={<P><GenerateW2 /></P>} />
        <Route path="/documents/schedule-e" element={<P><GenerateScheduleE /></P>} />
        <Route path="/generate" element={<P><GeneratePFS /></P>} />
        <Route path="/snapshots" element={<P><Snapshots /></P>} />
        <Route path="/settings" element={<P><Settings /></P>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Navbar />
              <AnimatedRoutes />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
