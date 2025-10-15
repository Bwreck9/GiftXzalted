import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Landing from "@/pages/Landing";
import Questionnaire from "@/pages/Questionnaire";
import ProfileDetail from "@/pages/ProfileDetail";
import ProfilesList from "@/pages/ProfilesList";
import Chat from "@/pages/Chat";
import Settings from "@/pages/Settings";
import About from "@/pages/About";
import Pricing from "@/pages/Pricing";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsConditions from "@/pages/TermsConditions";
import Checkout from "@/pages/Checkout";
import PaymentSuccess from "@/pages/PaymentSuccess";
import GiftLists from "@/pages/GiftLists";
import GiftListDetail from "@/pages/GiftListDetail";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/questionnaire" component={Questionnaire} />
      <Route path="/profiles" component={ProfilesList} />
      <Route path="/profile/:id" component={ProfileDetail} />
      <Route path="/chat/:id" component={Chat} />
      <Route path="/gift-lists" component={GiftLists} />
      <Route path="/gift-lists/:id" component={GiftListDetail} />
      <Route path="/settings" component={Settings} />
      <Route path="/about" component={About} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsConditions} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
