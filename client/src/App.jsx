import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Navbar  from './components/common/Navbar';

import Home                   from './pages/Home';
import Login                  from './pages/Login';
import Register               from './pages/Register';
import Listings               from './pages/Listings';
import ListingDetail          from './pages/ListingDetail';
import PostTask               from './pages/PostTask';
import BusinessDashboard      from './pages/BusinessDashboard';
import ProfessionalDashboard  from './pages/ProfessionalDashboard';
import OrderDetail            from './pages/OrderDetail';
import Professionals          from './pages/Professionals';
import ProfileEdit            from './pages/ProfileEdit';
import UserProfile            from './pages/UserProfile';
import Messages               from './pages/Messages';

// Routes that have their own sidebar — no top Navbar needed
const SIDEBAR_ROUTES = ['/dashboard/business', '/dashboard/professional', '/messages'];

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
        <Route path="/users/professionals"    element={<Professionals />} />
        <Route path="/users/:id"              element={<UserProfile />} />

        {/* Business only */}
        <Route path="/tasks/new"              element={<PrivateRoute><PostTask /></PrivateRoute>} />
        <Route path="/dashboard/business"     element={<RoleRoute roles={['business','admin']}><BusinessDashboard /></RoleRoute>} />

        {/* Professional only */}
        <Route path="/dashboard/professional" element={<RoleRoute roles={['professional','admin']}><ProfessionalDashboard /></RoleRoute>} />

        {/* Authenticated (any role) */}
        <Route path="/orders/:id"             element={<PrivateRoute><OrderDetail /></PrivateRoute>} />
        <Route path="/profile/edit"           element={<PrivateRoute><ProfileEdit /></PrivateRoute>} />
        <Route path="/messages"               element={<PrivateRoute><Messages /></PrivateRoute>} />

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
