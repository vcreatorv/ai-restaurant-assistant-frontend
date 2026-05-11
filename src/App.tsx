import { useEffect } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme";
import { AppProvider, useApp } from "@/state/store";
import { MobileFrame } from "@/components/MobileFrame";
import { BottomNav } from "@/components/BottomNav";
import Chat from "@/pages/Chat";
import Menu from "@/pages/Menu";
import Cart from "@/pages/Cart";
import Profile from "@/pages/Profile";
import OrderDetail from "@/pages/OrderDetail";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import { AdminLayout } from "@/admin/AdminLayout";
import Dashboard from "@/admin/pages/Dashboard";
import AdminMenu from "@/admin/pages/AdminMenu";
import AdminCategories from "@/admin/pages/AdminCategories";
import AdminTags from "@/admin/pages/AdminTags";
import AdminOrders from "@/admin/pages/AdminOrders";
import AdminAnalytics from "@/admin/pages/AdminAnalytics";
import AdminProfile from "@/admin/pages/AdminProfile";
import AdminPrompts from "@/admin/pages/AdminPrompts";
import { ClientViewBanner } from "@/admin/ClientViewBanner";
import { ConfirmProvider } from "@/admin/components/ConfirmDialog";

function SessionInit() {
  const { initSession } = useApp();
  useEffect(() => {
    void initSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function AppLayout() {
  const { sessionLoading } = useApp();

  if (sessionLoading) {
    return (
      <MobileFrame>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-brand)] border-t-transparent animate-spin" />
        </div>
      </MobileFrame>
    );
  }

  return (
    <MobileFrame>
      <ClientViewBanner />
      <main className="flex-1 min-h-0 flex flex-col">
        <Outlet />
      </main>
      <BottomNav />
    </MobileFrame>
  );
}

function AuthLayout() {
  return (
    <MobileFrame>
      <Outlet />
    </MobileFrame>
  );
}

function ProtectedRoute() {
  const { session } = useApp();
  if (!session || session.is_guest) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function AdminRoute() {
  const { isAdmin, sessionLoading } = useApp();
  if (sessionLoading) return null;
  if (!isAdmin) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <ConfirmProvider>
        <BrowserRouter>
          <SessionInit />
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/chat" replace />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/cart" element={<Cart />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/orders/:id" element={<OrderDetail />} />
              </Route>
              <Route path="*" element={<Navigate to="/chat" replace />} />
            </Route>
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<Dashboard />} />
                <Route path="/admin/menu" element={<AdminMenu />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route path="/admin/tags" element={<AdminTags />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/prompts" element={<AdminPrompts />} />
                <Route path="/admin/profile" element={<AdminProfile />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
        </ConfirmProvider>
      </AppProvider>
    </ThemeProvider>
  );
}
