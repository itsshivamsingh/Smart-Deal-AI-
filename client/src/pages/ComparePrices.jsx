import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  ArrowUpDown,
  AlertTriangle,
  X,
  RotateCcw,
  Clock,
  Sparkles,
  LogIn,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import { getGuestRecentSearches, saveGuestRecentSearch } from '../utils/formatters';

const STORE_FILTERS = [
  { id: 'all', label: 'All Retailers' },
  { id: 'amazon', label: 'Amazon Only' },
  { id: 'flipkart', label: 'Flipkart Only' },
  { id: 'other', label: 'Other Retailers' },
];

const QUICK_SUGGESTIONS = [
  'iPhone 15',
  'Samsung Galaxy S24',
  'Boat Rockerz 450',
  'MacBook Air M2',
];

export default function ComparePrices({ wishlistItems = [], onWishlistChange }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [inputQuery, setInputQuery] = useState(initialQuery);
  const [sort, setSort] = useState('asc');
  const [store, setStore] = useState('all');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dismissedWarnings, setDismissedWarnings] = useState(false);

  const [recentSearches, setRecentSearches] = useState([]);
  const [wishlistNotice, setWishlistNotice] = useState('');
  const [wishlistBusyTitle, setWishlistBusyTitle] = useState('');

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const loadRecentSearches = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const res = await api.get('/api/history');
        setRecentSearches((res.data.history || []).map((h) => h.query).slice(0, 8));
        return;
      } catch {
        // Fallback to localStorage
      }
    }
    setRecentSearches(getGuestRecentSearches().slice(0, 8));
  }, [isAuthenticated]);

  useEffect(() => {
    loadRecentSearches();
  }, [loadRecentSearches]);

  const fetchPrices = useCallback(
    async (queryToFetch, { sortBy = sort, storeBy = store, refresh = false } = {}) => {
      const clean = queryToFetch.trim();
      if (clean.length < 2) return;

      setLoading(true);
      setError('');
      if (refresh) {
        setDismissedWarnings(false);
      }

      try {
        const res = await api.get('/api/prices', {
          params: {
            query: clean,
            sort: sortBy,
            store: storeBy,
            refresh: refresh ? 'true' : 'false',
          },
        });
        setData(res.data);

        if (!isAuthenticated) {
          const updated = saveGuestRecentSearch(clean);
          setRecentSearches(updated.slice(0, 8));
        } else {
          loadRecentSearches();
        }
      } catch (err) {
        const message =
          err.response?.data?.error || 'Could not fetch prices. Please try again.';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [sort, store, isAuthenticated, loadRecentSearches]
  );

  // Run search when URL ?q=, sort, or store changes
  useEffect(() => {
    const q = searchParams.get('q') || '';
    setInputQuery(q);
    if (q.trim().length >= 2) {
      setDismissedWarnings(false);
      fetchPrices(q, { sortBy: sort, storeBy: store, refresh: false });
    } else {
      setData(null);
      setError('');
    }
  }, [searchParams, sort, store, fetchPrices]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputQuery.trim();
    if (trimmed.length < 2) {
      setError('Please enter at least 2 characters to search.');
      return;
    }
    setDismissedWarnings(false);
    setSearchParams({ q: trimmed });
  };

  const handleRefresh = () => {
    const activeQuery = (searchParams.get('q') || inputQuery).trim();
    if (activeQuery.length < 2) return;
    setDismissedWarnings(false);
    fetchPrices(activeQuery, { sortBy: sort, storeBy: store, refresh: true });
  };

  const handleQuickPick = (term) => {
    setInputQuery(term);
    setDismissedWarnings(false);
    setSearchParams({ q: term });
  };

  const findWishlistMatch = (title) =>
    wishlistItems.find(
      (item) => item.title.trim().toLowerCase() === title.trim().toLowerCase()
    );

  const handleToggleWishlist = async (product) => {
    if (!isAuthenticated) {
      setWishlistNotice('Please log in to save gadgets to your wishlist.');
      return;
    }

    setWishlistNotice('');
    setWishlistBusyTitle(product.title);

    try {
      const existing = findWishlistMatch(product.title);
      if (existing) {
        await api.delete(`/api/wishlist/${existing.id}`);
      } else {
        const validOffers = (product.prices || []).filter(
          (p) => typeof p.price === 'number' && p.price > 0
        );
        const bestOffer =
          validOffers.sort((a, b) => a.price - b.price)[0] || product.prices?.[0] || {};

        await api.post('/api/wishlist', {
          title: product.title,
          image: product.image,
          category: product.category,
          store: bestOffer.store || product.cheapestStore || '',
          price: bestOffer.price ?? null,
          url: bestOffer.url || '',
          source: bestOffer.source || data?.mode || 'sample',
        });
      }
      if (onWishlistChange) {
        await onWishlistChange();
      }
    } catch (err) {
      setWishlistNotice(
        err.response?.data?.error || 'Could not update wishlist. Please try again.'
      );
    } finally {
      setWishlistBusyTitle('');
    }
  };

  const activeQuery = searchParams.get('q') || '';
  const warnings = data?.warnings || [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Search & Controls Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Search gadget (e.g. iPhone 15, Samsung Galaxy S24, Boat Rockerz 450)..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              minLength={2}
              maxLength={100}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60 sm:flex-none"
            >
              <Search className="h-4 w-4" />
              <span>Search</span>
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || activeQuery.trim().length < 2}
              title="Bypass cache and fetch fresh prices"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Prices</span>
            </button>
          </div>
        </form>

        {/* Filters + Sort Row */}
        <div className="mt-4 flex flex-col justify-between gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center">
          {/* Retailer Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {STORE_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStore(f.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  store === f.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-slate-400" />
            <label htmlFor="sort-order" className="text-xs font-medium text-slate-500">
              Sort:
            </label>
            <select
              id="sort-order"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="asc">Price: Low to High</option>
              <option value="desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Recent Searches Strip */}
        {recentSearches.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              Recent:
            </span>
            {recentSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => handleQuickPick(term)}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"
              >
                {term}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Wishlist Auth Prompt Notice */}
      {wishlistNotice && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
          <div className="flex items-center gap-2">
            <LogIn className="h-4 w-4 text-indigo-600" />
            <span>{wishlistNotice}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                navigate('/login', { state: { from: `/compare?q=${encodeURIComponent(activeQuery)}` } })
              }
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Log in now
            </button>
            <button
              type="button"
              onClick={() => setWishlistNotice('')}
              aria-label="Dismiss notice"
              className="rounded-lg p-1 text-indigo-500 hover:bg-indigo-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Dismissible Warnings Notice */}
      {!loading && warnings.length > 0 && !dismissedWarnings && (
        <div className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
            <div className="space-y-0.5">
              {warnings.map((w, idx) => (
                <p key={idx}>{w}</p>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDismissedWarnings(true)}
            aria-label="Dismiss warnings"
            className="rounded-lg p-1 text-amber-600 hover:bg-amber-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Results Meta Bar */}
      {!loading && data && !error && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Showing results for <strong className="text-slate-800">&ldquo;{data.query}&rdquo;</strong>
          </span>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">
              Mode: {data.mode === 'live' ? 'Live' : 'Sample'}
            </span>
            {data.fromCache && (
              <span className="rounded-full bg-sky-50 px-2.5 py-0.5 font-medium text-sky-700">
                Served from cache
              </span>
            )}
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="mt-6 space-y-4">
          <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="h-24 w-28 rounded-xl bg-slate-200" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="h-6 w-2/3 rounded bg-slate-200" />
                <div className="h-4 w-1/3 rounded bg-slate-200" />
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="h-44 rounded-xl bg-slate-100" />
              <div className="h-44 rounded-xl bg-slate-100" />
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
          <p className="text-base font-semibold text-rose-800">{error}</p>
          <button
            type="button"
            onClick={() => fetchPrices(activeQuery || inputQuery, { refresh: false })}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            <RotateCcw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}

      {/* Empty State: No query yet */}
      {!loading && !error && !data && (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Search for a gadget to compare prices
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Try one of these popular products in India:
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {QUICK_SUGGESTIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleQuickPick(item)}
                className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State: Filter returned 0 items */}
      {!loading && !error && data && data.products?.length === 0 && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <h3 className="text-lg font-bold text-slate-900">
            No listings matched this store filter
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Try switching to &ldquo;All Retailers&rdquo; or refreshing prices.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setStore('all')}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Show All Retailers
            </button>
            <Link
              to="/"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back Home
            </Link>
          </div>
        </div>
      )}

      {/* Product Comparison Cards */}
      {!loading && !error && data?.products?.length > 0 && (
        <div className="mt-6 space-y-6">
          {data.products.map((product) => (
            <ProductCard
              key={product.title}
              product={product}
              isWishlisted={Boolean(findWishlistMatch(product.title))}
              wishlistBusy={wishlistBusyTitle === product.title}
              onToggleWishlist={handleToggleWishlist}
            />
          ))}
        </div>
      )}
    </div>
  );
}

