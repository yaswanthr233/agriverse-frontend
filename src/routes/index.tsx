import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { FloatingAiAssistant } from "@/components/ai/FloatingAiAssistant";
import { RequireAuth, RequireRole } from "./guards";
import { PagePlaceholder as P } from "@/components/PagePlaceholder";
import { Landing } from "@/features/landing/Landing";
import { ProductCatalog } from "@/features/marketplace/ProductCatalog";
import { ProductDetail } from "@/features/marketplace/ProductDetail";
import { Cart } from "@/features/shopping/Cart";
import { Checkout } from "@/features/shopping/Checkout";
import { OrderSuccess } from "@/features/shopping/OrderSuccess";
import { OrderList } from "@/features/orders/OrderList";
import { OrderDetail } from "@/features/orders/OrderDetail";
import { FarmerDashboard } from "@/features/farm/FarmerDashboard";
import { FarmProfile } from "@/features/farm/FarmProfile";
import { CropManagement } from "@/features/farm/CropManagement";
import { Expenses } from "@/features/farm/Expenses";
import { MyLivestock } from "@/features/livestock/MyLivestock";
import { FarmerAnalytics } from "@/features/farm/FarmerAnalytics";
import { LivestockMarketplace } from "@/features/livestock/LivestockMarketplace";
import { LivestockDetail } from "@/features/livestock/LivestockDetail";
import { WeatherPage } from "@/features/weather/WeatherPage";
import { MarketPrices } from "@/features/market/MarketPrices";
import { Schemes } from "@/features/schemes/Schemes";
import { BookVet } from "@/features/vets/BookVet";
import { AiHub } from "@/features/ai/AiHub";
import { SellerDashboard } from "@/features/seller/SellerDashboard";
import { SellerProducts } from "@/features/seller/SellerProducts";
import { ProductForm } from "@/features/seller/ProductForm";
import { SellerOrders } from "@/features/seller/SellerOrders";
import { SellerInventory } from "@/features/seller/SellerInventory";
import { SellerRevenue } from "@/features/seller/SellerRevenue";
import { AdminDashboard } from "@/features/admin/AdminDashboard";
import { AdminAnalytics } from "@/features/admin/AdminAnalytics";
import { AdminUsers } from "@/features/admin/AdminUsers";
import { AdminUserDetail } from "@/features/admin/AdminUserDetail";
import { AdminSellers } from "@/features/admin/AdminSellers";
import { AdminProducts } from "@/features/admin/AdminProducts";
import { AdminOrders } from "@/features/admin/AdminOrders";
import { AdminOrderDetail } from "@/features/admin/AdminOrderDetail";
import { AdminSchemes } from "@/features/admin/AdminSchemes";
import { VetAppointments } from "@/features/vet/VetAppointments";
import { VetDashboard } from "@/features/vet/VetDashboard";
import { VetPatients } from "@/features/vet/VetPatients";
import { VetEarnings } from "@/features/vet/VetEarnings";
import { DeliveryDashboard } from "@/features/delivery/DeliveryDashboard";
import { DeliveryAvailable } from "@/features/delivery/DeliveryAvailable";
import { DeliveryActive } from "@/features/delivery/DeliveryActive";
import { DeliveryHistory } from "@/features/delivery/DeliveryHistory";
import { DeliveryEarnings } from "@/features/delivery/DeliveryEarnings";
import { I18nProvider } from "@/i18n/useTranslation";
import { Login } from "@/features/auth/Login";
import { Register } from "@/features/auth/Register";
import { ForgotPassword } from "@/features/auth/ForgotPassword";
import { VerifyOtp } from "@/features/auth/VerifyOtp";
import { ResetPassword } from "@/features/auth/ResetPassword";
import { Profile } from "@/features/account/Profile";
import { Settings } from "@/features/account/Settings";
import { Notifications } from "@/features/notifications/Notifications";
import { NotFound } from "@/features/errors/NotFound";
import { Unauthorized } from "@/features/errors/Unauthorized";

/** Wraps a role-scoped branch: must be authenticated AND hold one of these roles. */
function RoleBranch({
  roles,
}: {
  roles: Parameters<typeof RequireRole>[0]["roles"];
}) {
  return (
    <RequireAuth>
      <RequireRole roles={roles}>
        <AppLayout />
      </RequireRole>
    </RequireAuth>
  );
}

export function AppRoutes() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public ─────────────────────────────── */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/marketplace" element={<ProductCatalog />} />
            <Route
              path="/marketplace/:category"
              element={<ProductCatalog />}
            />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route
              path="/livestock"
              element={<LivestockMarketplace />}
            />
            <Route
              path="/livestock/:id"
              element={<LivestockDetail />}
            />
            <Route path="/weather" element={<WeatherPage />} />
            <Route path="/market-prices" element={<MarketPrices />} />
            <Route path="/about" element={<P title="About" />} />
            <Route path="/contact" element={<P title="Contact" />} />
          </Route>

          {/* ── Auth ───────────────────────────────── */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* ── Farmer ─────────────────────────────── */}
          <Route path="/app" element={<RoleBranch roles={["FARMER"]} />}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<FarmerDashboard />} />
            <Route path="farm" element={<FarmProfile />} />
            <Route path="crops" element={<CropManagement />} />
            <Route path="livestock" element={<MyLivestock />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="analytics" element={<FarmerAnalytics />} />
            <Route path="orders" element={<OrderList />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="schemes" element={<Schemes />} />
            <Route path="vets" element={<BookVet />} />
            <Route path="ai" element={<AiHub />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="order-success/:id" element={<OrderSuccess />} />
          </Route>

          {/* ── Seller ─────────────────────────────── */}
          <Route path="/seller" element={<RoleBranch roles={["SELLER"]} />}>
            <Route index element={<Navigate to="/seller/dashboard" replace />} />
            <Route path="dashboard" element={<SellerDashboard />} />
            <Route path="products" element={<SellerProducts />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route
              path="products/:id/edit"
              element={<ProductForm />}
            />
            <Route path="orders" element={<SellerOrders />} />
            <Route path="inventory" element={<SellerInventory />} />
            <Route path="revenue" element={<SellerRevenue />} />
          </Route>

          {/* ── Admin ──────────────────────────────── */}
          <Route path="/admin" element={<RoleBranch roles={["ADMIN"]} />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:id" element={<AdminUserDetail />} />
            <Route path="sellers" element={<AdminSellers />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="schemes" element={<AdminSchemes />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>

          {/* ── Vet ────────────────────────────────── */}
          <Route path="/vet" element={<RoleBranch roles={["VETERINARIAN"]} />}>
            <Route index element={<Navigate to="/vet/dashboard" replace />} />
            <Route path="dashboard" element={<VetDashboard />} />
            <Route path="appointments" element={<VetAppointments />} />
            <Route path="patients" element={<VetPatients />} />
            <Route path="earnings" element={<VetEarnings />} />
          </Route>

          {/* ── Delivery ───────────────────────────── */}
          <Route
            path="/delivery"
            element={<RoleBranch roles={["DELIVERY_PARTNER"]} />}
          >
            <Route
              index
              element={<Navigate to="/delivery/dashboard" replace />}
            />
            <Route path="dashboard" element={<DeliveryDashboard />} />
            <Route path="available" element={<DeliveryAvailable />} />
            <Route path="active" element={<DeliveryActive />} />
            <Route path="history" element={<DeliveryHistory />} />
            <Route path="earnings" element={<DeliveryEarnings />} />
          </Route>

          {/* ── Shared authenticated ───────────────── */}
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* ── Errors ─────────────────────────────── */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <FloatingAiAssistant />
      </BrowserRouter>
    </I18nProvider>
  );
}
