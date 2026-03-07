import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Landing from "./pages/Landing";
import ParentDashboard from "./pages/ParentDashboard";
import ChildDashboard from "./pages/ChildDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { useAuth } from "./hooks/use-auth";

// A small wrapper to handle authenticated root path logic
function RootRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return null; // Avoid flicker
  
  if (isAuthenticated) {
    return <ParentDashboard />;
  }
  
  return <Landing />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRouter} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/child/:id" component={ChildDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
