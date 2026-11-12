import {
  ExternalLink,
  Heart,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Tag,
  TrendingDown,
} from 'lucide-react';
import { formatINR, formatLastUpdated } from '../utils/formatters';

function getSourceBadge(source) {
  if (source === 'live') {
    return {
      label: 'Live',
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }
  if (source === 'cached') {
    return {
      label: 'Cached',
      classes: 'bg-sky-50 text-sky-700 border-sky-200',
    };
  }
  return {
    label: 'Sample data',
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
  };
}

function getStoreAccent(store) {
  const lower = store.toLowerCase();
  if (lower === 'amazon') {
    return 'bg-amber-100 text-amber-900 border-amber-200';
  }
  if (lower === 'flipkart') {
    return 'bg-blue-100 text-blue-900 border-blue-200';
  }
  return 'bg-indigo-50 text-indigo-800 border-indigo-200';
}

export default function ProductCard({
  product,
  isWishlisted = false,
  onToggleWishlist,
  wishlistBusy = false,
}) {
  const { title, image, category, prices = [], cheapestStore, savings } = product;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      {/* Product Header */}
      <div className="flex flex-col gap-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-indigo-50/40 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-24 w-28 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5">
            {image ? (
              <img
                src={image}
                alt={title}
                className="h-full w-full object-contain"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-lg bg-indigo-50 text-xs font-medium text-indigo-600">
                {category || 'Gadget'}
              </div>
            )}
          </div>

          <div>
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                <Tag className="h-3 w-3" />
                {category || 'Electronics'}
              </span>
              {cheapestStore && savings > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  <TrendingDown className="h-3.5 w-3.5" />
                  You save {formatINR(savings)}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h2>
            {cheapestStore && (
              <p className="mt-1 text-sm text-slate-600">
                Lowest price found on{' '}
                <span className="font-semibold text-emerald-700">{cheapestStore}</span>
              </p>
            )}
          </div>
        </div>

        {/* Wishlist Heart */}
        <button
          type="button"
          onClick={() => onToggleWishlist && onToggleWishlist(product)}
          disabled={wishlistBusy}
          title={isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
          className={`inline-flex items-center gap-2 self-start rounded-xl border px-4 py-2.5 text-sm font-semibold transition sm:self-center ${
            isWishlisted
              ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
              : 'border-slate-200 bg-white text-slate-700 hover:border-rose-300 hover:text-rose-600'
          }`}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
          <span>{isWishlisted ? 'Saved' : 'Save'}</span>
        </button>
      </div>

      {/* Store Price Cards Grid */}
      <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-2">
        {prices.map((offer) => {
          const hasPrice = typeof offer.price === 'number' && offer.price > 0;
          const isBest = Boolean(cheapestStore && offer.store === cheapestStore && hasPrice);
          const sourceBadge = getSourceBadge(offer.source);

          return (
            <div
              key={`${offer.store}-${offer.url}`}
              className={`relative flex flex-col justify-between rounded-xl border p-4 transition ${
                isBest
                  ? 'border-emerald-400 bg-emerald-50/30 ring-1 ring-emerald-400/50'
                  : 'border-slate-200 bg-white hover:border-indigo-200'
              }`}
            >
              {/* Top Row: Store & Badges */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${getStoreAccent(
                      offer.store
                    )}`}
                  >
                    {offer.store}
                  </span>

                  {isBest && (
                    <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                      Best Price
                    </span>
                  )}
                </div>

                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${sourceBadge.classes}`}
                >
                  {sourceBadge.label}
                </span>
              </div>

              {/* Price + Rating */}
              <div className="my-4 flex items-baseline justify-between gap-2">
                <div>
                  <p
                    className={`text-2xl font-extrabold tracking-tight ${
                      hasPrice ? 'text-slate-900' : 'text-base font-semibold text-slate-500'
                    }`}
                  >
                    {hasPrice ? formatINR(offer.price) : 'Price unavailable'}
                  </p>
                  {isBest && savings > 0 && (
                    <p className="mt-0.5 text-xs font-semibold text-emerald-700">
                      Save {formatINR(savings)} compared to highest listing
                    </p>
                  )}
                </div>

                {typeof offer.rating === 'number' && (
                  <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span>{offer.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Meta: Stock & Last Updated */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span
                  className={`inline-flex items-center gap-1 font-medium ${
                    offer.inStock ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {offer.inStock ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      In Stock
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5" />
                      Out of Stock
                    </>
                  )}
                </span>

                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Last updated: {formatLastUpdated(offer.lastUpdated)}
                </span>
              </div>

              {/* Store Redirect Button */}
              <a
                href={offer.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  isBest
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                <span>View on {offer.store}</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

