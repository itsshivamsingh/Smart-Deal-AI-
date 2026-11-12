import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { getGuestRecentSearches } from '../utils/formatters';

const TRENDING_GADGETS = [
  'iPhone 15',
  'Samsung Galaxy S24',
  'Boat Rockerz 450',
  'MacBook Air M2',
  'Sony WH-1000XM5',
  'OnePlus 12',
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Search Any Gadget',
    description:
      'Type the gadget name or model you want to buy — smartphones, laptops, headphones, smartwatches, and more.',
    icon: Search,
  },
  {
    step: '02',
    title: 'Instant Store Comparison',
    description:
      'SmartDeal AI fetches and normalizes prices from Amazon India, Flipkart, Croma, and Reliance Digital.',
    icon: Zap,
  },
  {
    step: '03',
    title: 'Grab the Cheapest Deal',
    description:
      'Results are sorted Low to High with the best price highlighted and direct links to the store.',
    icon: ShieldCheck,
  },
];

export default function Home() {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    let active = true;
    async function loadRecent() {
      if (isAuthenticated) {
        try {
          const res = await api.get('/api/history');
          if (active) {
            setRecentSearches((res.data.history || []).map((h) => h.query).slice(0, 6));
          }
          return;
        } catch {
          // Fall back to guest searches on error
        }
      }
      if (active) {
        setRecentSearches(getGuestRecentSearches().slice(0, 6));
      }
    }
    loadRecent();
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    navigate(`/compare?q=${encodeURIComponent(trimmed)}`);
  };

  const quickSearch = (term) => {
    navigate(`/compare?q=${encodeURIComponent(term)}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-800 py-20 text-white">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/20 px-4 py-1.5 text-xs font-semibold tracking-wide text-indigo-100">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            INDIA&apos;S SMART GADGET PRICE ENGINE
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Stop Overpaying for Gadgets.
            <span className="mt-2 block bg-gradient-to-r from-sky-300 to-indigo-200 bg-clip-text text-transparent">
              Compare Amazon &amp; Flipkart in Seconds.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base text-indigo-100/90 sm:text-lg">
            SmartDeal AI checks top Indian retailers, filters out clutter and accessories,
            and highlights the lowest price in ₹ so you save on every purchase.
          </p>

          {/* Big Search Bar */}
          <form onSubmit={handleSearch} className="mx-auto mt-10 max-w-2xl">
            <div className="flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-3 px-3">
                <Search className="h-5 w-5 flex-shrink-0 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='Search e.g. "iPhone 15", "Boat Rockerz 450", "MacBook Air M2"...'
                  className="w-full py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  minLength={2}
                  maxLength={100}
                  required
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
              >
                <span>Compare Prices</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Trending Searches */}
          <div className="mt-8">
            <div className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-200">
              <TrendingUp className="h-3.5 w-3.5" />
              Trending Gadget Searches
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {TRENDING_GADGETS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => quickSearch(item)}
                  className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-white/20"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="mt-6">
              <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-200">
                <Clock className="h-3.5 w-3.5" />
                Your Recent Searches
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {recentSearches.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => quickSearch(item)}
                    className="rounded-full border border-sky-300/30 bg-sky-400/15 px-3 py-1 text-xs font-medium text-sky-100 transition hover:bg-sky-400/25"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            How SmartDeal AI Works
          </h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Built for Indian shoppers looking for genuine, side-by-side price clarity.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {HOW_IT_WORKS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-indigo-400">STEP {item.step}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

