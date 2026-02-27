/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import ShopListing from './pages/ShopListing';
import ShopDetails from './pages/ShopDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/Dashboard';
import AdminAreas from './pages/admin/Areas';
import AdminAreaCategories from './pages/admin/AreaCategories';
import AdminShops from './pages/admin/Shops';
import OwnerDashboard from './pages/owner/Dashboard';
import OwnerProfile from './pages/owner/Profile';
import OwnerGallery from './pages/owner/Gallery';
import OwnerProducts from './pages/owner/Products';
import Layout from './components/Layout';

const ProtectedRoute = ({ children, role }: { children: React.ReactNode; role: string }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== role) return <Navigate to="/" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/home" element={<Layout><Home /></Layout>} />
          <Route path="/shops" element={<Layout><ShopListing /></Layout>} />
          <Route path="/shops/:id" element={<Layout><ShopDetails /></Layout>} />
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/register" element={<Layout><Register /></Layout>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute role="admin"><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
          <Route path="/admin/areas" element={<ProtectedRoute role="admin"><Layout><AdminAreas /></Layout></ProtectedRoute>} />
          <Route path="/admin/areas/:id/categories" element={<ProtectedRoute role="admin"><Layout><AdminAreaCategories /></Layout></ProtectedRoute>} />
          <Route path="/admin/shops" element={<ProtectedRoute role="admin"><Layout><AdminShops /></Layout></ProtectedRoute>} />

          {/* Shop Owner Routes */}
          <Route path="/owner" element={<ProtectedRoute role="shop_owner"><Layout><OwnerDashboard /></Layout></ProtectedRoute>} />
          <Route path="/owner/profile" element={<ProtectedRoute role="shop_owner"><Layout><OwnerProfile /></Layout></ProtectedRoute>} />
          <Route path="/owner/gallery" element={<ProtectedRoute role="shop_owner"><Layout><OwnerGallery /></Layout></ProtectedRoute>} />
          <Route path="/owner/products" element={<ProtectedRoute role="shop_owner"><Layout><OwnerProducts /></Layout></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
