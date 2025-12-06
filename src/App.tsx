import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Browse from "./pages/Browse";
import Profile from "./pages/Profile";
import Requests from "./pages/Requests";
import Messages from "./pages/Messages";
import Categories from "./pages/Categories";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Favorites from "./pages/Favorites";
import Matches from "./pages/Matches";
import Insights from "./pages/Insights";
import Map from "./pages/Map";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/signup" element={<Auth />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/categories/:categoryName" element={<Categories />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/map" element={<Map />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
