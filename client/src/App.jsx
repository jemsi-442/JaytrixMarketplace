import { Suspense, lazy } from "react";
import { Navigate, Routes, Route, useParams } from "react-router-dom";

/* Layouts */
import UserLayout from "./components/UserLayout";
import AdminLayout from "./admin/pages/AdminLayout";
import RiderLayout from "./rider/RiderLayout";
import VendorLayout from "./vendor/VendorLayout";
import CustomerLayout from "./customer/CustomerLayout";

/* Route guards */
import ProtectedRoute from "./components/ProtectedRoute";

/* Pages */
const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/Shop"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Storefront = lazy(() => import("./pages/Storefront"));

const AdminDashboard = lazy(() => import("./admin/pages/AdminDashboard"));
const AdminOrders = lazy(() => import("./admin/pages/AdminOrders"));
const AdminDeliveryIssues = lazy(() => import("./admin/pages/AdminDeliveryIssues"));
const AdminProducts = lazy(() => import("./admin/pages/AdminProducts"));
const AdminUsers = lazy(() => import("./admin/pages/AdminUsers"));
const AdminNotifications = lazy(() => import("./admin/pages/AdminNotifications"));
const AdminPayouts = lazy(() => import("./admin/pages/AdminPayouts"));

const RiderDashboard = lazy(() => import("./rider/RiderDashboard"));
const RiderOrders = lazy(() => import("./rider/RiderOrders"));
const RiderHistory = lazy(() => import("./rider/RiderHistory"));
const RiderProfile = lazy(() => import("./rider/RiderProfile"));
const VendorDashboard = lazy(() => import("./vendor/VendorDashboard"));
const VendorProducts = lazy(() => import("./vendor/VendorProducts"));
const VendorOrders = lazy(() => import("./vendor/VendorOrders"));
const VendorDeliveryIssues = lazy(() => import("./vendor/VendorDeliveryIssues"));
const VendorProfile = lazy(() => import("./vendor/VendorProfile"));
const VendorPayouts = lazy(() => import("./vendor/VendorPayouts"));
const VendorRiders = lazy(() => import("./vendor/VendorRiders"));

const NotFound = lazy(() => import("./pages/NotFound"));

function AccountProductRedirect() {
  const { id } = useParams();
  return <Navigate to={id ? `/account/product/${id}` : "/account/shop"} replace />;
}

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-500">
          Loading...
        </div>
      }
    >
      <Routes>
        {/* USER */}
        <Route element={<UserLayout />}>
          <Route index element={<Home />} />

          {/* Shopping area requires login */}
          <Route
            path="shop"
            element={<Navigate to="/account/shop" replace />}
          />
          <Route
            path="product/:id"
            element={<AccountProductRedirect />}
          />
          <Route
            path="cart"
            element={<Navigate to="/account/cart" replace />}
          />
          <Route
            path="checkout"
            element={<Navigate to="/account/checkout" replace />}
          />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="stores/:slug" element={<Storefront />} />
        </Route>

        {/* CUSTOMER DASHBOARD */}
        <Route
          path="account"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Orders view="overview" />} />
          <Route path="shop" element={<Shop />} />
          <Route path="product/:id" element={<ProductDetails />} />
          <Route path="stores/:slug" element={<Storefront />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="orders" element={<Orders view="orders" />} />
          <Route path="wishlist" element={<Orders view="wishlist" />} />
          <Route path="updates" element={<Orders view="updates" />} />
          <Route path="profile" element={<Orders view="profile" />} />
          <Route path="support" element={<Orders view="support" />} />
        </Route>
        <Route
          path="orders"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Orders view="orders" />} />
        </Route>

        {/* ADMIN */}
        <Route
          path="admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="delivery-issues" element={<AdminDeliveryIssues />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="payouts" element={<AdminPayouts />} />
        </Route>


        {/* VENDOR */}
        <Route
          path="vendor"
          element={
            <ProtectedRoute allowedRoles={["vendor"]}>
              <VendorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<VendorDashboard />} />
          <Route path="products" element={<VendorProducts />} />
          <Route path="orders" element={<VendorOrders />} />
          <Route path="delivery-issues" element={<VendorDeliveryIssues />} />
          <Route path="riders" element={<VendorRiders />} />
          <Route path="profile" element={<VendorProfile />} />
          <Route path="payouts" element={<VendorPayouts />} />
        </Route>

        {/* RIDER */}
        <Route
          path="rider"
          element={
            <ProtectedRoute allowedRoles={["rider"]}>
              <RiderLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<RiderDashboard />} />
          <Route path="orders" element={<RiderOrders />} />
          <Route path="history" element={<RiderHistory />} />
          <Route path="profile" element={<RiderProfile />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
        <Route path="/product/:id" element={<AccountProductRedirect />} />
        <Route path="/products/:id" element={<AccountProductRedirect />} />
      </Routes>
    </Suspense>
  );
}
