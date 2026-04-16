import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotFound from "@/pages/not-found";

import Landing from "./pages/Landing";
import ParentDashboard from "./pages/ParentDashboard";
import ChildDashboard from "./pages/ChildDashboard";
import ChildEntryRedirect from "./pages/ChildEntryRedirect";
import AdminDashboard from "./pages/AdminDashboard";
import { useAuth } from "./hooks/use-auth";

/** `/` is always the marketing homepage so browser Back from `/parent` (etc.) can return here. */
function HomeRoute() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <Landing />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRoute} />
      <Route path="/parent" component={ParentDashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/child" component={ChildEntryRedirect} />
      <Route path="/child/:id" component={ChildDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
