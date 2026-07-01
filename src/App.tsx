import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import CategoryTiers from "./pages/CategoryTiers.tsx";
import SubcategoryList from "./pages/SubcategoryList.tsx";
import ProductList from "./pages/ProductList.tsx";
import ProductDetail from "./pages/ProductDetail.tsx";
import BulkOrder from "./pages/BulkOrder.tsx";
import B2BShop from "./pages/B2BShop.tsx";
import MyOrders from "./pages/MyOrders.tsx";
import Contact from "./pages/Contact.tsx";
import ScrollToTop from "./components/ScrollToTop";
import { VisitTracker } from "./components/VisitTracker";
import Auth from "./pages/Auth";
import AdminApp from "./admin/AdminApp";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <VisitTracker />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          {/* Category navigation: /category/:cat → tier picker (or subcat list when no tiers) */}
          <Route path="/category/:cat" element={<CategoryTiers />} />
          {/* /category/:cat/:tier → subcategories for that tier (regular|premium) */}
          <Route path="/category/:cat/:tier" element={<SubcategoryList />} />
          {/* /category/:cat/:tier/:sub → product listing */}
          <Route path="/category/:cat/:tier/:sub" element={<ProductList />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/bulk-order" element={<BulkOrder />} />
          <Route path="/b2b-shop" element={<B2BShop />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
