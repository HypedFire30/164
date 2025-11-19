import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import PropertiesTable from "./pages/PropertiesTable";
import PropertyDetail from "./pages/PropertyDetail";
import Assets from "./pages/Assets";
import AssetDetail from "./pages/AssetDetail";
import LiabilityDetail from "./pages/LiabilityDetail";
import GeneratePFS from "./pages/GeneratePFS";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "react-error-boundary";

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
      <div className="max-w-md w-full bg-card border border-border rounded-lg p-6">
        <h1 className="text-2xl font-bold text-destructive mb-4">Something went wrong</h1>
        <pre className="text-sm text-muted-foreground overflow-auto mb-4 p-4 bg-muted rounded">
          {error.message}
          {error.stack && (
            <details className="mt-2">
              <summary className="cursor-pointer">Stack trace</summary>
              <pre className="mt-2 text-xs">{error.stack}</pre>
            </details>
          )}
        </pre>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 mr-2"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}

const App = () => {
  console.log("App component rendering...");
  
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/properties" element={<PropertiesTable />} />
              <Route path="/properties/cards" element={<Properties />} />
              <Route path="/properties/:id" element={<PropertyDetail />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/assets/asset/:id" element={<AssetDetail />} />
              <Route path="/assets/liability/:id" element={<LiabilityDetail />} />
              <Route path="/generate" element={<GeneratePFS />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
