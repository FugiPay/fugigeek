import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Navbar  from './components/common/Navbar';

import Home                   from './pages/Home';
import Login                  from './pages/Login';
import Register               from './pages/Register';
import ForgotPassword         from './pages/ForgotPassword';
import ResetPassword          from './pages/ResetPassword';
import PaymentSuccess         from './pages/PaymentSuccess';
import PaymentCancel          from './pages/PaymentCancel';
import Listings               from './pages/Listings';
import ListingDetail          from './pages/ListingDetail';
import PostTask               from './pages/PostTask';
import BusinessDashboard      from './pages/BusinessDashboard';
import ProfessionalDashboard  from './pages/ProfessionalDashboard';
import AdminDashboard         from './pages/AdminDashboard';
import Proposals              from './pages/Proposals';
import OrderDetail            from './pages/OrderDetail';
import Professionals          from './pages/Professionals';
import ProfileEdit            from './pages/ProfileEdit';
import UserProfile            from './pages/UserProfile';
import Messages               from './pages/Messages';
import ViewProfile            from './pages/ViewProfile';

// Routes that have their own sidebar — no top Navbar needed
const SIDEBAR_ROUTES = ['/dashboard/business', '/dashboard/professional', '/dashboard/admin', '/messages', '/payment/'];

// ── Route guards ─────────────────────────────────────────────────────────────
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const RoleRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated)            return <Navigate to="/login" replace />;
  if (!roles.includes(user?.role)) return <Navigate to="/"      replace />;
  return children;
};

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const location = useLocation();
  const showNavbar = !SIDEBAR_ROUTES.some(r => location.pathname.startsWith(r));

  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        {/* Public */}
        <Route path="/"                       element={<Home />} />
        <Route path="/login"                  element={<Login />} />
        <Route path="/register"               element={<Register />} />
        <Route path="/listings"               element={<Listings />} />
        <Route path="/listings/:id"           element={<ListingDetail />} />
        <Route path="/listings/:id/proposals" element={<PrivateRoute><Proposals /></PrivateRoute>} />
        <Route path="/users/professionals"    element={<Professionals />} />
        <Route path="/users/:id"              element={<UserProfile />} />

        {/* Business + Individual */}
        <Route path="/tasks/new"              element={<PrivateRoute><PostTask /></PrivateRoute>} />
        <Route path="/dashboard/business"     element={<RoleRoute roles={['business','individual','admin']}><BusinessDashboard /></RoleRoute>} />

        {/* Professional only */}
        <Route path="/dashboard/professional" element={<RoleRoute roles={['professional']}><ProfessionalDashboard /></RoleRoute>} />

        {/* Admin only */}
        <Route path="/dashboard/admin"        element={<RoleRoute roles={['admin']}><AdminDashboard /></RoleRoute>} />

        {/* Authenticated (any role) */}
        <Route path="/orders/:id"             element={<PrivateRoute><OrderDetail /></PrivateRoute>} />
        <Route path="/profile/edit"           element={<PrivateRoute><ProfileEdit /></PrivateRoute>} />
        <Route path="/profile/view"           element={<PrivateRoute><ViewProfile /></PrivateRoute>} />
        <Route path="/messages"               element={<PrivateRoute><Messages /></PrivateRoute>} />

        {/* Auth */}
        <Route path="/forgot-password"       element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Payment results — public, DPO redirects here */}
        <Route path="/payment/success"       element={<PaymentSuccess />} />
        <Route path="/payment/cancel"        element={<PaymentCancel />} />

        {/* Catch-all */}
        <Route path="*" element={
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:16 }}>
            <h1 style={{ fontSize:32, fontWeight:700 }}>404</h1>
            <p style={{ color:'#6b7280' }}>Page not found</p>
            <a href="/" style={{ color:'#2563eb', fontSize:14 }}>← Back to home</a>
          </div>
        } />
      </Routes>
    </>
  );
}
