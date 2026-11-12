const axios = require('axios');
const { getStorage } = require('../storage');
const { getConfig } = require('../config/env');
const { buildAffiliateLink } = require('../utils/buildAffiliateLink');

const SERPAPI_ENDPOINT = 'https://serpapi.com/search.json';
const EXTERNAL_TIMEOUT_MS = 8000;

const ACCESSORY_KEYWORDS = [
  'case',
  'cover',
  'back cover',
  'flip cover',
  'charger',
  'adapter',
  'cable',
  'screen guard',
  'tempered glass',
  'protector',
  'skin',
  'pouch',
  'strap',
  'watch band',
  'earpads',
  'ear tips',
  'holder',
  'stand',
  'mount',
  'sleeve',
  'keyboard cover',
  'stylus tip',
  'cleaning kit',
];

// Variant modifiers that distinguish distinct product models (e.g., iPhone 15 vs 15 Pro)
const VARIANT_TOKENS = [
  'pro',
  'max',
  'plus',
  'ultra',
  'mini',
  'lite',
  'fe',
  'se',
  'air',
  'fold',
  'flip',
  'neo',
  'm1',
  'm2',
  'm3',
  'm4',
];

const STORE_DOMAINS = {
  Amazon: ['amazon.in', 'amzn.in'],
  Flipkart: ['flipkart.com', 'fkrt.it'],
  Croma: ['croma.com'],
  'Reliance Digital': ['reliancedigital.in'],
  'Vijay Sales': ['vijaysales.com'],
};

/**
 * Normalizes price strings like "₹79,900", "Rs. 79,900.00", "INR 1,299" into a Number.
 */
function normalizePrice(raw) {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return Math.round(raw);
  }
  if (typeof raw !== 'string') return null;

  const match = raw.match(/\d[\d,]*(?:\.\d+)?/);
  if (!match) return null;

  const parsed = parseFloat(match[0].replace(/,/g, ''));
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed);
}

/**
 * Builds fallback store search links when a direct product URL is missing or doesn't match the store.
 */
function getFallbackSearchUrl(store, query) {
  const q = encodeURIComponent(query.trim());
  switch (store) {
    case 'Amazon':
      return buildAffiliateLink(`https://www.amazon.in/s?k=${q}`, 'Amazon');
    case 'Flipkart':
      return buildAffiliateLink(`https://www.flipkart.com/search?q=${q}`, 'Flipkart');
    case 'Croma':
      return buildAffiliateLink(`https://www.croma.com/searchB?q=${q}%3Arelevance`, 'Croma');
    case 'Reliance Digital':
      return buildAffiliateLink(
        `https://www.reliancedigital.in/search?q=${q}:relevance`,
        'Reliance Digital'
      );
    case 'Vijay Sales':
      return buildAffiliateLink(`https://www.vijaysales.com/search/${q}`, 'Vijay Sales');
    default:
      return `https://www.google.co.in/search?q=${q}`;
  }
}

/**
 * Checks if a candidate URL belongs to the given store's domain; otherwise falls back.
 */
function resolveStoreUrl(candidateUrl, store, query) {
  if (candidateUrl && typeof candidateUrl === 'string') {
    try {
      const parsed = new URL(candidateUrl);
      const host = parsed.hostname.toLowerCase();
      const domains = STORE_DOMAINS[store] || [];
      if (domains.some((d) => host.includes(d))) {
        return buildAffiliateLink(candidateUrl, store);
      }
    } catch {
      // Invalid URL, fall back to search URL
    }
  }
  return getFallbackSearchUrl(store, query);
}

/**
 * Identifies normalized store name from SerpApi's `source` field or URL.
 */
function identifyStore(sourceStr = '', linkStr = '') {
  const src = `${sourceStr} ${linkStr}`.toLowerCase();
  if (src.includes('amazon')) return 'Amazon';
  if (src.includes('flipkart')) return 'Flipkart';
  if (src.includes('croma')) return 'Croma';
  if (src.includes('reliance digital') || src.includes('reliancedigital')) {
    return 'Reliance Digital';
  }
  if (src.includes('vijay sales') || src.includes('vijaysales')) return 'Vijay Sales';
  return null;
}

/**
 * Checks whether a listing is an accessory that should be excluded unless requested.
 */
function isUnwantedAccessory(title, query) {
  const lowerTitle = title.toLowerCase();
  const lowerQuery = query.toLowerCase();

  const queryWantsAccessory = ACCESSORY_KEYWORDS.some((kw) => lowerQuery.includes(kw));
  if (queryWantsAccessory) return false;

  return ACCESSORY_KEYWORDS.some((kw) => {
    const regex = new RegExp(`\\b${kw.replace(/\s+/g, '\\s+')}\\b`, 'i');
    return regex.test(lowerTitle);
  });
}

/**
 * Tokenizes a product name for model matching.
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Scores/validates whether a listing title matches the requested product model.
 * Prevents e.g. "iPhone 15 Pro Max" from matching a search for "iPhone 15".
 */
function matchesProductModel(title, query) {
  const queryTokens = tokenize(query);
  const titleTokens = tokenize(title);
  const titleSet = new Set(titleTokens);
  const querySet = new Set(queryTokens);

  if (queryTokens.length === 0 || titleTokens.length === 0) return false;

  // Reject if title includes a major model variant not requested in query
  for (const variant of VARIANT_TOKENS) {
    if (titleSet.has(variant) && !querySet.has(variant)) {
      return false;
    }
  }

  // Require at least 60% of query tokens (and all numeric tokens like 15, 24, 450) to match
  const numericQueryTokens = queryTokens.filter((t) => /\d/.test(t));
  for (const numTok of numericQueryTokens) {
    if (!titleSet.has(numTok) && !title.toLowerCase().includes(numTok)) {
      return false;
    }
  }

  let matchedCount = 0;
  for (const qt of queryTokens) {
    if (titleSet.has(qt) || title.toLowerCase().includes(qt)) {
      matchedCount += 1;
    }
  }

  return matchedCount / queryTokens.length >= 0.6;
}

/**
 * Infers a clean gadget category from query text.
 */
function inferCategory(query) {
  const q = query.toLowerCase();
  if (/(iphone|galaxy|oneplus|pixel|redmi|realme|poco|vivo|oppo|nothing|phone|smartphone)/.test(q)) {
    return 'Smartphones';
  }
  if (/(macbook|laptop|thinkpad|ideapad|vivobook|inspiron|pavilion|rog|victus|zenbook)/.test(q)) {
    return 'Laptops';
  }
  if (/(rockerz|airpods|buds|earphone|headphone|wh-1000|speaker|soundbar|sony|jbl|bose|boat)/.test(q)) {
    return 'Audio';
  }
  if (/(ipad|tab|tablet|kindle)/.test(q)) {
    return 'Tablets';
  }
  if (/(watch|band|fitbit|garmin|smartwatch)/.test(q)) {
    return 'Wearables';
  }
  if (/(tv|oled|qled|monitor|display|bravia)/.test(q)) {
    return 'TV & Monitors';
  }
  if (/(ps5|xbox|playstation|nintendo|console|controller)/.test(q)) {
    return 'Gaming';
  }
  return 'Electronics';
}

/**
 * Generates a deterministic positive integer hash from any query string.
 */
function hashQuery(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Formats query nicely for display titles when not in curated list.
 */
function toTitleCase(str) {
  return str
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (/^(iphone|ipad|macbook)$/i.test(word)) {
        return word[0].toLowerCase() + word[1].toUpperCase() + word.slice(2).toLowerCase();
      }
      if (/^(m[1-4]|s\d+|5g|4g|tv|ps5|rgb|anc|usb|ssd)$/i.test(word)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Curated realistic catalog entries for popular Indian gadget searches in Sample Mode.
 */
const SAMPLE_CATALOG = [
  {
    keywords: ['iphone 15 pro max'],
    title: 'Apple iPhone 15 Pro Max (256 GB) - Natural Titanium',
    category: 'Smartphones',
    basePrice: 134900,
  },
  {
    keywords: ['iphone 15 pro'],
    title: 'Apple iPhone 15 Pro (128 GB) - Natural Titanium',
    category: 'Smartphones',
    basePrice: 119900,
  },
  {
    keywords: ['iphone 15 plus'],
    title: 'Apple iPhone 15 Plus (128 GB) - Blue',
    category: 'Smartphones',
    basePrice: 74900,
  },
  {
    keywords: ['iphone 15'],
    title: 'Apple iPhone 15 (128 GB) - Black',
    category: 'Smartphones',
    basePrice: 65999,
  },
  {
    keywords: ['samsung galaxy s24 ultra', 'galaxy s24 ultra', 's24 ultra'],
    title: 'Samsung Galaxy S24 Ultra 5G (256 GB) - Titanium Gray',
    category: 'Smartphones',
    basePrice: 119999,
  },
  {
    keywords: ['samsung galaxy s24', 'galaxy s24'],
    title: 'Samsung Galaxy S24 5G (256 GB) - Onyx Black',
    category: 'Smartphones',
    basePrice: 62999,
  },
  {
    keywords: ['boat rockerz 450', 'rockerz 450'],
    title: 'boAt Rockerz 450 Bluetooth On-Ear Headphones with Mic (Luscious Black)',
    category: 'Audio',
    basePrice: 1499,
  },
  {
    keywords: ['macbook air m2'],
    title: 'Apple MacBook Air 13.6" (M2 Chip, 8 GB RAM, 256 GB SSD) - Midnight',
    category: 'Laptops',
    basePrice: 85990,
  },
  {
    keywords: ['macbook air m3'],
    title: 'Apple MacBook Air 13.6" (M3 Chip, 8 GB RAM, 256 GB SSD) - Starlight',
    category: 'Laptops',
    basePrice: 104900,
  },
  {
    keywords: ['sony wh-1000xm5', 'wh-1000xm5', 'xm5'],
    title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones (Black)',
    category: 'Audio',
    basePrice: 26990,
  },
  {
    keywords: ['oneplus 12'],
    title: 'OnePlus 12 5G (12 GB RAM, 256 GB Storage) - Flowy Emerald',
    category: 'Smartphones',
    basePrice: 59999,
  },
  {
    keywords: ['airpods pro'],
    title: 'Apple AirPods Pro (2nd Generation) with MagSafe Case (USB-C)',
    category: 'Audio',
    basePrice: 21900,
  },
];

/**
 * Generates an inline SVG data URI product thumbnail keyed to category so
 * sample products always render crisp visuals with zero external image dependencies.
 */
function buildCategoryIllustration(category, title) {
  const palette = {
    Smartphones: ['#4f46e5', '#eef2ff'],
    Laptops: ['#0284c7', '#e0f2fe'],
    Audio: ['#7c3aed', '#f3e8ff'],
    Tablets: ['#2563eb', '#eff6ff'],
    Wearables: ['#059669', '#ecfdf5'],
    'TV & Monitors': ['#0f766e', '#f0fdfa'],
    Gaming: ['#dc2626', '#fef2f2'],
    Electronics: ['#4338ca', '#eef2ff'],
  };
  const [fg, bg] = palette[category] || palette.Electronics;
  const shortLabel = (title || category).slice(0, 22).replace(/[&<>"]/g, '');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
    <rect width="320" height="240" rx="16" fill="${bg}"/>
    <circle cx="160" cy="96" r="46" fill="${fg}" fill-opacity="0.14"/>
    <rect x="132" y="64" width="56" height="64" rx="10" fill="none" stroke="${fg}" stroke-width="3.5"/>
    <circle cx="160" cy="116" r="3" fill="${fg}"/>
    <text x="160" y="176" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" font-weight="600" fill="${fg}">${category}</text>
    <text x="160" y="198" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="#475569">${shortLabel}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Builds deterministic, plausible sample prices across Indian stores for any query.
 */
function generateSampleData(query) {
  const norm = query.trim().toLowerCase();
  const h = hashQuery(norm);

  const curated = SAMPLE_CATALOG.find((item) =>
    item.keywords.some((kw) => norm.includes(kw))
  );

  const category = curated ? curated.category : inferCategory(norm);
  const displayTitle = curated ? curated.title : toTitleCase(query);

  let basePrice;
  if (curated) {
    basePrice = curated.basePrice;
  } else {
    const ranges = {
      Smartphones: [14999, 69999],
      Laptops: [42990, 114990],
      Audio: [1299, 19990],
      Tablets: [18999, 59990],
      Wearables: [2499, 24999],
      'TV & Monitors': [16999, 64990],
      Gaming: [4999, 49990],
      Electronics: [1999, 29999],
    };
    const [minP, maxP] = ranges[category] || [1999, 29999];
    const raw = minP + (h % (maxP - minP));
    basePrice = Math.round(raw / 100) * 100 - 1;
  }

  // Vary price realistically per store (deterministic per query)
  const deltaFlipkart = ((h % 9) - 4) * Math.max(50, Math.round(basePrice * 0.012));
  const deltaAmazon = (((h >>> 4) % 9) - 4) * Math.max(50, Math.round(basePrice * 0.012));
  const deltaCroma = (((h >>> 8) % 7) - 1) * Math.max(100, Math.round(basePrice * 0.015));
  const deltaReliance = (((h >>> 12) % 7) - 2) * Math.max(100, Math.round(basePrice * 0.014));

  const roundIndian = (val) => Math.max(299, Math.round(val / 10) * 10 - (basePrice > 5000 ? 1 : 0));

  const nowIso = new Date().toISOString();
  const image = buildCategoryIllustration(category, displayTitle);

  const storeConfigs = [
    {
      store: 'Amazon',
      price: roundIndian(basePrice + deltaAmazon),
      rating: Number((4.1 + ((h % 7) * 0.1)).toFixed(1)),
      inStock: true,
    },
    {
      store: 'Flipkart',
      price: roundIndian(basePrice + deltaFlipkart),
      rating: Number((4.1 + (((h >>> 3) % 7) * 0.1)).toFixed(1)),
      inStock: true,
    },
    {
      store: 'Croma',
      price: roundIndian(basePrice + deltaCroma),
      rating: Number((4.1 + (((h >>> 5) % 6) * 0.1)).toFixed(1)),
      inStock: (h % 5) !== 0,
    },
    {
      store: 'Reliance Digital',
      price: roundIndian(basePrice + deltaReliance),
      rating: Number((4.0 + (((h >>> 7) % 7) * 0.1)).toFixed(1)),
      inStock: true,
    },
  ];

  // Ensure Amazon & Flipkart are not identical unless coincidental, making savings clear
  if (storeConfigs[0].price === storeConfigs[1].price) {
    storeConfigs[1].price += basePrice > 10000 ? 1000 : 100;
  }

  const prices = storeConfigs.map((cfg) => ({
    store: cfg.store,
    title: displayTitle,
    price: cfg.price,
    currency: 'INR',
    url: getFallbackSearchUrl(cfg.store, query),
    image,
    rating: cfg.rating,
    inStock: cfg.inStock,
    lastUpdated: nowIso,
    source: 'sample',
  }));

  return {
    products: [
      buildProductSummary({
        title: displayTitle,
        image,
        category,
        prices,
      }),
    ],
    warnings: [
      'Showing sample prices. Add SERPAPI_KEY in server/.env for live prices.',
    ],
  };
}

/**
 * Computes cheapestStore and savings for a product's store prices.
 */
function buildProductSummary({ title, image, category, prices }) {
  const validPrices = prices.filter((p) => typeof p.price === 'number' && p.price > 0);
  let cheapestStore = null;
  let savings = 0;

  if (validPrices.length > 0) {
    const sorted = [...validPrices].sort((a, b) => a.price - b.price);
    cheapestStore = sorted[0].store;
    if (sorted.length > 1) {
      savings = sorted[sorted.length - 1].price - sorted[0].price;
    }
  }

  return {
    title,
    image,
    category,
    prices,
    cheapestStore,
    savings,
  };
}

/**
 * Queries SerpApi Google Shopping India with an 8s timeout.
 */
async function fetchSerpApi(searchQuery, apiKey) {
  const response = await axios.get(SERPAPI_ENDPOINT, {
    params: {
      engine: 'google_shopping',
      q: searchQuery,
      gl: 'in',
      hl: 'en',
      api_key: apiKey,
    },
    timeout: EXTERNAL_TIMEOUT_MS,
  });

  return Array.isArray(response.data?.shopping_results)
    ? response.data.shopping_results
    : [];
}

/**
 * Picks the best matching listing for a target store from SerpApi results.
 */
function pickBestListing(results, targetStore, query) {
  const candidates = [];

  for (const item of results) {
    const title = item.title || '';
    const link = item.link || item.product_link || '';
    const detectedStore = identifyStore(item.source || '', link);

    if (targetStore && detectedStore !== targetStore) continue;
    if (!targetStore && (!detectedStore || detectedStore === 'Amazon' || detectedStore === 'Flipkart')) {
      continue;
    }
    if (isUnwantedAccessory(title, query)) continue;
    if (!matchesProductModel(title, query)) continue;

    const price = normalizePrice(item.extracted_price ?? item.price);
    if (!price) continue;

    candidates.push({
      store: targetStore || detectedStore,
      title,
      price,
      currency: 'INR',
      url: resolveStoreUrl(link, targetStore || detectedStore, query),
      image: item.thumbnail || '',
      rating: typeof item.rating === 'number' ? item.rating : null,
      inStock: true,
      lastUpdated: new Date().toISOString(),
      source: 'live',
    });
  }

  if (candidates.length === 0) return null;
  // Pick the lowest valid matching listing for that store
  candidates.sort((a, b) => a.price - b.price);
  return candidates[0];
}

/**
 * Fetches live results from SerpApi for Amazon, Flipkart, and other Indian retailers,
 * falling back cleanly to cached entries or "Price unavailable" placeholders.
 */
async function fetchLiveData(query, apiKey, staleCachedData) {
  const warnings = [];
  const nowIso = new Date().toISOString();

  const [amazonRes, flipkartRes, generalRes] = await Promise.allSettled([
    fetchSerpApi(`${query} amazon.in`, apiKey),
    fetchSerpApi(`${query} flipkart`, apiKey),
    fetchSerpApi(query, apiKey),
  ]);

  const amazonRaw = amazonRes.status === 'fulfilled' ? amazonRes.value : [];
  const flipkartRaw = flipkartRes.status === 'fulfilled' ? flipkartRes.value : [];
  const generalRaw = generalRes.status === 'fulfilled' ? generalRes.value : [];

  if (amazonRes.status === 'rejected') {
    const status = amazonRes.reason?.response?.status;
    warnings.push(
      status === 401
        ? 'SerpApi returned 401 Unauthorized. Please check SERPAPI_KEY in server/.env.'
        : `Amazon search failed: ${amazonRes.reason?.message || 'request error'}`
    );
  }
  if (flipkartRes.status === 'rejected') {
    const status = flipkartRes.reason?.response?.status;
    if (status !== 401) {
      warnings.push(`Flipkart search failed: ${flipkartRes.reason?.message || 'request error'}`);
    } else if (amazonRes.status !== 'rejected') {
      warnings.push('SerpApi returned 401 Unauthorized. Please check SERPAPI_KEY in server/.env.');
    }
  }

  const allFailed =
    amazonRes.status === 'rejected' &&
    flipkartRes.status === 'rejected' &&
    generalRes.status === 'rejected';

  const combinedResults = [...generalRaw, ...amazonRaw, ...flipkartRaw];

  const cachedPricesByStore = new Map();
  if (staleCachedData?.mode === 'live' && staleCachedData?.products?.[0]?.prices) {
    for (const p of staleCachedData.products[0].prices) {
      if (typeof p.price === 'number' && p.price > 0) {
        cachedPricesByStore.set(p.store, p);
      }
    }
  }

  const prices = [];

  for (const store of ['Amazon', 'Flipkart']) {
    const storePool = store === 'Amazon' ? [...amazonRaw, ...generalRaw] : [...flipkartRaw, ...generalRaw];
    const liveMatch = pickBestListing(storePool, store, query);

    if (liveMatch) {
      prices.push(liveMatch);
    } else if (cachedPricesByStore.has(store)) {
      const cached = cachedPricesByStore.get(store);
      prices.push({
        ...cached,
        source: 'cached',
      });
      warnings.push(`Live listing unavailable on ${store}; showing cached price.`);
    } else {
      warnings.push(`No listing found on ${store}`);
      prices.push({
        store,
        title: toTitleCase(query),
        price: null,
        currency: 'INR',
        url: getFallbackSearchUrl(store, query),
        image: '',
        rating: null,
        inStock: false,
        lastUpdated: nowIso,
        source: 'live',
      });
    }
  }

  // Extract other Indian retailers (Croma, Reliance Digital, Vijay Sales)
  for (const otherStore of ['Croma', 'Reliance Digital', 'Vijay Sales']) {
    const otherMatch = pickBestListing(combinedResults, otherStore, query);
    if (otherMatch) {
      prices.push(otherMatch);
    }
  }

  const validMatched = prices.find((p) => typeof p.price === 'number' && p.image);
  const category = inferCategory(query);
  const primaryTitle =
    prices.find((p) => typeof p.price === 'number')?.title || toTitleCase(query);
  const primaryImage =
    validMatched?.image || buildCategoryIllustration(category, primaryTitle);

  for (const p of prices) {
    if (!p.image) p.image = primaryImage;
  }

  return {
    products: [
      buildProductSummary({
        title: primaryTitle,
        image: primaryImage,
        category,
        prices,
      }),
    ],
    warnings,
    shouldCache: !allFailed,
  };
}

/**
 * Applies sort and store filters to the product list without mutating cached data.
 */
function applyFiltersAndSort(products, { sort = 'asc', store = 'all' }) {
  const sortOrder = sort === 'desc' ? 'desc' : 'asc';
  const storeFilter = ['all', 'amazon', 'flipkart', 'other'].includes(store)
    ? store
    : 'all';

  return products
    .map((product) => {
      const filteredPrices = product.prices.filter((entry) => {
        const lower = entry.store.toLowerCase();
        if (storeFilter === 'amazon') return lower === 'amazon';
        if (storeFilter === 'flipkart') return lower === 'flipkart';
        if (storeFilter === 'other') {
          return lower !== 'amazon' && lower !== 'flipkart';
        }
        return true;
      });

      const sortedPrices = [...filteredPrices].sort((a, b) => {
        const aHasPrice = typeof a.price === 'number' && a.price > 0;
        const bHasPrice = typeof b.price === 'number' && b.price > 0;
        if (!aHasPrice && !bHasPrice) return 0;
        if (!aHasPrice) return 1;
        if (!bHasPrice) return -1;
        return sortOrder === 'desc' ? b.price - a.price : a.price - b.price;
      });

      return {
        ...product,
        prices: sortedPrices,
      };
    })
    .filter((product) => product.prices.length > 0);
}

/**
 * Main entry point used by /api/prices.
 */
async function comparePrices({
  query,
  sort = 'asc',
  store = 'all',
  refresh = false,
}) {
  const config = getConfig();
  const storage = getStorage();
  const normalizedKey = `price:${query.trim().toLowerCase().replace(/\s+/g, ' ')}`;
  const mode = config.serpApiKey ? 'live' : 'sample';

  let baseData = null;
  let fromCache = false;

  if (!refresh) {
    const cached = await storage.priceCache.get(normalizedKey);
    if (cached && cached.mode === mode) {
      baseData = cached;
      fromCache = true;
    }
  }

  if (!baseData) {
    let shouldCache = true;
    if (mode === 'live') {
      const previousCached = await storage.priceCache.get(normalizedKey);
      const liveFallback = previousCached?.mode === 'live' ? previousCached : null;
      const liveResult = await fetchLiveData(query, config.serpApiKey, liveFallback);
      shouldCache = liveResult.shouldCache !== false;
      baseData = {
        mode: 'live',
        products: liveResult.products,
        warnings: liveResult.warnings,
        cachedAt: new Date().toISOString(),
      };
    } else {
      const sampleResult = generateSampleData(query);
      baseData = {
        mode: 'sample',
        products: sampleResult.products,
        warnings: sampleResult.warnings,
        cachedAt: new Date().toISOString(),
      };
    }

    if (shouldCache) {
      await storage.priceCache.set(normalizedKey, baseData, config.cacheTtlHours);
    }
  }

  const filteredProducts = applyFiltersAndSort(baseData.products, { sort, store }).map(
    (product) => ({
      ...product,
      prices: product.prices.map((p) =>
        fromCache && baseData.mode === 'live' && typeof p.price === 'number'
          ? { ...p, source: 'cached' }
          : p
      ),
    })
  );

  return {
    query: query.trim(),
    mode: baseData.mode,
    products: filteredProducts,
    warnings: baseData.warnings || [],
    fromCache,
  };
}

module.exports = {
  comparePrices,
  normalizePrice,
  isUnwantedAccessory,
  matchesProductModel,
};
