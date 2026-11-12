/**
 * Appends affiliate tracking parameters to store URLs when configured in env.
 * Returns the plain URL unchanged if no affiliate tag/id is set.
 *
 * @param {string} rawUrl
 * @param {string} store
 * @returns {string}
 */
function buildAffiliateLink(rawUrl, store = '') {
  if (!rawUrl || typeof rawUrl !== 'string') return '';

  const amazonTag = (process.env.AMAZON_AFFILIATE_TAG || '').trim();
  const flipkartAffId = (process.env.FLIPKART_AFFILIATE_ID || '').trim();

  if (!amazonTag && !flipkartAffId) {
    return rawUrl;
  }

  try {
    const parsed = new URL(rawUrl);
    const lowerStore = store.toLowerCase();
    const host = parsed.hostname.toLowerCase();

    if ((lowerStore.includes('amazon') || host.includes('amazon.in')) && amazonTag) {
      parsed.searchParams.set('tag', amazonTag);
      return parsed.toString();
    }

    if ((lowerStore.includes('flipkart') || host.includes('flipkart.com')) && flipkartAffId) {
      parsed.searchParams.set('affid', flipkartAffId);
      return parsed.toString();
    }

    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

module.exports = { buildAffiliateLink };

