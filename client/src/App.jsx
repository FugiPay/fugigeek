import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

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

// ── Route guards ─────────────────────────────────────────────────────────────
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const RoleRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated)            return <Navigate to="/login"    replace />;
  if (!roles.includes(user?.role)) return <Navigate to="/"         replace />;
  return children;
};

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"                       element={<Home />} />
      <Route path="/login"                  element={<Login />} />
      <Route path="/register"               element={<Register />} />
      <Route path="/listings"               element={<Listings />} />
      <Route path="/listings/:id"           element={<ListingDetail />} />
      <Route path="/users/professionals"    element={<Professionals />} />

      {/* Business only */}
      <Route path="/tasks/new"              element={<RoleRoute roles={['business','admin']}><PostTask /></RoleRoute>} />
      <Route path="/dashboard/business"     element={<RoleRoute roles={['business','admin']}><BusinessDashboard /></RoleRoute>} />

      {/* Professional only */}
      <Route path="/dashboard/professional" element={<RoleRoute roles={['professional','admin']}><ProfessionalDashboard /></RoleRoute>} />

      {/* Authenticated (any role) */}
      <Route path="/orders/:id"             element={<PrivateRoute><OrderDetail /></PrivateRoute>} />

      {/* Catch-all */}
      <Route path="*" element={
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:16 }}>
          <h1 style={{ fontSize:32, fontWeight:700 }}>404</h1>
          <p style={{ color:'#6b7280' }}>Page not found</p>
          <a href="/" style={{ color:'#2563eb', fontSize:14 }}>← Back to home</a>
        </div>
      } />
    </Routes>
  );
}
