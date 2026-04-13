/**
 * SEO Scorer — Assess listing quality for search engine optimization.
 * Generates structured data (JSON-LD), sitemap entries, and quality scores.
 */

// ─── Score a listing's SEO quality (0-100) ────────────
function scoreListing(listing) {
  let score = 0;
  const tips = [];

  // Title quality (make + model = searchable title) — 15 pts
  if (listing.make && listing.model) {
    score += 15;
  } else {
    tips.push('Add both make and model for better search visibility');
  }

  // Description quality — 25 pts
  const desc = listing.description || '';
  if (desc.length >= 200) { score += 25; }
  else if (desc.length >= 100) { score += 18; tips.push('Extend description to 200+ characters for better ranking'); }
  else if (desc.length >= 30) { score += 8; tips.push('A detailed description (200+ chars) significantly improves discoverability'); }
  else { tips.push('Add a detailed description (200+ characters) — this is critical for SEO'); }

  // Images — 20 pts
  const imageCount = listing.images?.length || 0;
  if (imageCount >= 4) score += 20;
  else if (imageCount >= 2) { score += 12; tips.push(`Add ${4 - imageCount} more photos to increase engagement by 60%`); }
  else if (imageCount >= 1) { score += 5; tips.push('Listings with 4+ images get 3x more views'); }
  else { tips.push('Add photos! Listings without images get 90% fewer views'); }

  // Location data — 15 pts
  if (listing.city && listing.state) score += 10;
  else tips.push('Add city and state for location-based search');
  if (listing.latitude && listing.longitude) score += 5;
  else tips.push('Adding GPS coordinates enables nearby search');

  // Category & sub-category — 10 pts
  if (listing.category) score += 5;
  if (listing.subCategory) score += 5;
  else tips.push('Select a sub-category for more precise search matching');

  // Price — 5 pts
  if (listing.price && Number(listing.price) > 0) score += 5;
  else tips.push('Set a price — listings without prices get ignored');

  // Year & condition — 5 pts
  if (listing.year) score += 3;
  if (listing.condition) score += 2;

  // Verification bonus — 5 pts
  if (listing.isVerified) score += 5;

  return {
    score: Math.min(100, score),
    grade: score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : score >= 30 ? 'D' : 'F',
    tips,
    improvements: 100 - score,
  };
}

// ─── Generate JSON-LD Product Schema ──────────────────
function generateProductSchema(listing, baseUrl = 'https://yantrasetu.com') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${listing.make} ${listing.model}${listing.year ? ` (${listing.year})` : ''}`,
    description: listing.description || `${listing.make} ${listing.model} — ${listing.condition} ${listing.category} equipment`,
    brand: { '@type': 'Brand', name: listing.make },
    model: listing.model,
    productionDate: listing.year ? `${listing.year}` : undefined,
    itemCondition: listing.condition === 'new' ? 'https://schema.org/NewCondition' : listing.condition === 'refurbished' ? 'https://schema.org/RefurbishedCondition' : 'https://schema.org/UsedCondition',
    image: listing.images?.[0] || undefined,
    offers: {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: 'INR',
      availability: listing.status === 'approved' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${baseUrl}/listing/${listing.id}`,
      seller: listing.owner ? {
        '@type': 'Organization',
        name: `${listing.owner.firstName} ${listing.owner.lastName}`,
      } : undefined,
    },
    category: listing.category,
    additionalProperty: [
      listing.hoursUsed ? { '@type': 'PropertyValue', name: 'Hours Used', value: listing.hoursUsed } : null,
      listing.city ? { '@type': 'PropertyValue', name: 'Location', value: `${listing.city}, ${listing.state}` } : null,
    ].filter(Boolean),
  };
}

// ─── Generate Sitemap Entry ───────────────────────────
function generateSitemapEntry(listing, baseUrl = 'https://yantrasetu.com') {
  return {
    loc: `${baseUrl}/listing/${listing.id}`,
    lastmod: listing.updatedAt || listing.createdAt,
    changefreq: 'weekly',
    priority: listing.isFeatured ? '0.9' : listing.isVerified ? '0.8' : '0.6',
  };
}

// ─── Generate page meta tags ──────────────────────────
function generateMetaTags(listing) {
  const title = `${listing.make} ${listing.model}${listing.year ? ` (${listing.year})` : ''} — ${listing.listingType === 'rent' ? 'For Rent' : 'For Sale'} | YantraSetu`;
  const description = listing.description
    ? listing.description.substring(0, 160)
    : `${listing.condition} ${listing.make} ${listing.model} ${listing.category} equipment ${listing.listingType === 'rent' ? 'available for rent' : 'for sale'} in ${listing.city || 'India'}. View details and price on YantraSetu.`;

  return {
    title,
    description,
    keywords: [listing.make, listing.model, listing.category, listing.subCategory, listing.city, listing.condition, listing.listingType === 'rent' ? 'rental' : 'sale', 'heavy equipment', 'machinery'].filter(Boolean).join(', '),
    ogTitle: title,
    ogDescription: description,
    ogImage: listing.images?.[0] || null,
    ogType: 'product',
  };
}

module.exports = { scoreListing, generateProductSchema, generateSitemapEntry, generateMetaTags };
