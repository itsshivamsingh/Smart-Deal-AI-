import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ExternalLink, Search, Tag } from 'lucide-react';
import api from '../api/axios';
import { formatINR } from '../utils/formatters';

export default function Wishlist({ items = [], loading = false, onWishlistChange }) {
  const [removingId, setRemovingId] = useState('');
  const [error, setError] = useState('');

  const handleRemove = async (id) => {
    setError('');
    setRemovingId(id);
    try {
      await api.delete(`/api/wishlist/${id}`);
      if (onWishlistChange) {
        await onWishlistChange();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not remove item.');
    } finally {
      setRemovingId('');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-slate-900 sm:text-3xl">
            <Heart className="h-7 w-7 fill-rose-500 text-rose-500" />
            My Saved Wishlist
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gadgets you&apos;ve bookmarked for quick price checks.
          </p>
        </div>

        <Link
          to="/compare"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <Search className="h-4 w-4" />
          Compare More Gadgets
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Heart className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-4 text-lg font-bold text-slate-900">Your wishlist is empty</h2>
          <p className="mt-1 text-sm text-slate-500">
            Tap the heart icon on any product in Compare Prices to save it here.
          </p>
          <Link
            to="/compare?q=iPhone%2015"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Explore Deals
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div>
                <div className="mb-4 flex h-40 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-2">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs font-medium text-slate-400">
                      {item.category || 'Gadget'}
                    </span>
                  )}
                </div>

                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                  <Tag className="h-3 w-3" />
                  {item.category || 'Electronics'}
                </span>

                <h3 className="mt-2 line-clamp-2 text-base font-bold text-slate-900">
                  {item.title}
                </h3>

                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-xl font-extrabold text-slate-900">
                    {formatINR(item.price)}
                  </span>
                  {item.store && (
                    <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      Best on {item.store}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">
                <Link
                  to={`/compare?q=${encodeURIComponent(item.title)}`}
                  className="flex-1 rounded-xl bg-indigo-600 py-2 text-center text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Re-check Prices
                </Link>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-700 hover:border-indigo-300 hover:text-indigo-600"
                    title={`View on ${item.store || 'store'}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  disabled={removingId === item.id}
                  className="inline-flex items-center justify-center rounded-xl border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                  title="Remove from wishlist"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

