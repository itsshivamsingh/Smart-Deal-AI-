import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Zap,
  Heart,
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ wishlistCount = 0 }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
    }`;

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setMobileOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-sm">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              SmartDeal<span className="text-indigo-600"> AI</span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" className={navLinkClass} end>
            Home
          </NavLink>
          <NavLink to="/compare" className={navLinkClass}>
            Compare Prices
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
          <NavLink to="/contact" className={navLinkClass}>
            Contact
          </NavLink>
        </nav>

        {/* Desktop Right Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="relative flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600"
          >
            <Heart className="h-4 w-4 text-rose-500" />
            <span>Wishlist</span>
            {isAuthenticated && wishlistCount > 0 && (
              <span className="ml-0.5 rounded-full bg-indigo-600 px-1.5 py-0.5 text-xs font-semibold leading-none text-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-200"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
                <span className="max-w-[120px] truncate">{user?.name}</span>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </button>

              {userMenuOpen && (
                <div
                  onMouseLeave={() => setUserMenuOpen(false)}
                  className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
                >
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
                    <p className="truncate text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <Link
                    to="/wishlist"
                    onClick={() => setUserMenuOpen(false)}
                    className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <Heart className="h-4 w-4 text-rose-500" />
                    My Wishlist
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          aria-label="Toggle Menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            <NavLink to="/" className={navLinkClass} onClick={() => setMobileOpen(false)} end>
              Home
            </NavLink>
            <NavLink
              to="/compare"
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              Compare Prices
            </NavLink>
            <NavLink to="/about" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              About
            </NavLink>
            <NavLink
              to="/contact"
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              Contact
            </NavLink>
            <NavLink
              to="/wishlist"
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              Wishlist {isAuthenticated && wishlistCount > 0 ? `(${wishlistCount})` : ''}
            </NavLink>
          </div>

          <div className="mt-3 border-t border-slate-100 pt-3">
            {isAuthenticated ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <User className="h-4 w-4 text-indigo-600" />
                  <span>{user?.name}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-600"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-center text-sm font-medium text-slate-700"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-lg bg-indigo-600 py-2 text-center text-sm font-semibold text-white"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

