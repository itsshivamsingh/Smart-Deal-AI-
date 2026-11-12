import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Zap className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-slate-900">SmartDeal AI</span>
          <span className="text-xs text-slate-500">• Smart Gadget Price Comparison (India)</span>
        </div>

        <div className="flex items-center gap-6 text-sm text-slate-500">
          <Link to="/compare" className="hover:text-indigo-600">
            Compare
          </Link>
          <Link to="/about" className="hover:text-indigo-600">
            About
          </Link>
          <Link to="/contact" className="hover:text-indigo-600">
            Contact
          </Link>
        </div>

        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} SmartDeal AI. Prices shown in INR (₹).
        </p>
      </div>
    </footer>
  );
}

