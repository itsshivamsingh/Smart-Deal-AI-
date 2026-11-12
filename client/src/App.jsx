import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import api from './api/axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import ComparePrices from './pages/ComparePrices';
import Login from './pages/Login';
import Register from './pages/Register';
import Wishlist from './pages/Wishlist';
import About from './pages/About';
import Contact from './pages/Contact';

function AppShell() {
  const { isAuthenticated } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const loadWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlistItems([]);
      return;
    }
    setWishlistLoading(true);
    try {
      const res = await api.get('/api/wishlist');
      setWishlistItems(res.data.items || []);
    } catch {
      setWishlistItems([]);
    } finally {
      setWishlistLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar wishlistCount={wishlistItems.length} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/compare"
            element={
              <ComparePrices
                wishlistItems={wishlistItems}
                onWishlistChange={loadWishlist}
              />
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist
                  items={wishlistItems}
                  loading={wishlistLoading}
                  onWishlistChange={loadWishlist}
                />
              </ProtectedRoute>
            }
          />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}

