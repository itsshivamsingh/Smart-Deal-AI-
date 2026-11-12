const GUEST_HISTORY_KEY = 'smartdeal_recent_searches';

/**
 * Formats a numeric price in Indian Rupees using Intl.NumberFormat("en-IN").
 */
export function formatINR(amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return 'Price unavailable';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats an ISO timestamp into a clean human-readable string.
 */
export function formatLastUpdated(isoString) {
  if (!isoString) return 'Just now';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return 'Just now';

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Guest recent searches in localStorage.
 */
export function getGuestRecentSearches() {
  try {
    const raw = localStorage.getItem(GUEST_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGuestRecentSearch(query) {
  const clean = query.trim();
  if (!clean) return [];
  const current = getGuestRecentSearches().filter(
    (item) => item.toLowerCase() !== clean.toLowerCase()
  );
  const updated = [clean, ...current].slice(0, 10);
  try {
    localStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }
  return updated;
}

