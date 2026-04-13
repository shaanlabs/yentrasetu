/**
 * Sentiment Analyzer — AFINN-165 Lexicon Based
 * Analyzes review text for sentiment score, themes, and trust calculation.
 * Pure JS — no external NLP libraries needed.
 */

// ─── AFINN-165 Word Scores (condensed top 400 words) ──
const AFINN = {
  // Strongly positive (+4 to +5)
  'outstanding': 5, 'superb': 5, 'excellent': 5, 'breathtaking': 5, 'amazing': 4,
  'awesome': 4, 'fantastic': 4, 'wonderful': 4, 'brilliant': 4, 'perfect': 4,
  'love': 3, 'loved': 3, 'great': 3, 'best': 3, 'happy': 3, 'beautiful': 3,
  'impressive': 3, 'recommend': 3, 'recommended': 3, 'reliable': 3, 'efficient': 3,
  'professional': 3, 'trustworthy': 3, 'quality': 3, 'satisfied': 3, 'smooth': 2,
  // Positive (+1 to +2)
  'good': 2, 'nice': 2, 'well': 2, 'fine': 2, 'helpful': 2, 'clean': 2,
  'fast': 2, 'quick': 2, 'decent': 2, 'fair': 2, 'reasonable': 2, 'correct': 1,
  'ok': 1, 'okay': 1, 'adequate': 1, 'acceptable': 1, 'average': 0,
  'working': 1, 'works': 1, 'functional': 1, 'proper': 1, 'genuine': 2,
  'honest': 2, 'punctual': 2, 'responsive': 2, 'timely': 2, 'strong': 1,
  'durable': 2, 'sturdy': 2, 'powerful': 2, 'solid': 2,
  // Negative (-1 to -2)
  'bad': -2, 'poor': -2, 'slow': -2, 'late': -2, 'delay': -2, 'delayed': -2,
  'broken': -2, 'damage': -2, 'damaged': -2, 'dirty': -2, 'issue': -1,
  'problem': -2, 'expensive': -1, 'costly': -1, 'overpriced': -2, 'waste': -3,
  'difficult': -1, 'confusing': -2, 'complicated': -1, 'missing': -2,
  'wrong': -2, 'error': -2, 'fail': -2, 'failed': -2, 'failure': -3,
  'disappointing': -2, 'disappointed': -2, 'mediocre': -1, 'rude': -3,
  'unprofessional': -3, 'unreliable': -3, 'unresponsive': -2, 'ignored': -2,
  // Strongly negative (-3 to -5)
  'terrible': -4, 'horrible': -4, 'awful': -4, 'worst': -5, 'scam': -5,
  'fraud': -5, 'fake': -4, 'cheat': -4, 'liar': -4, 'stolen': -5,
  'dangerous': -3, 'unsafe': -3, 'hate': -4, 'angry': -3, 'furious': -4,
  'disgusting': -4, 'pathetic': -4, 'useless': -3, 'garbage': -4,
  'nightmare': -4, 'avoid': -3, 'never': -1, 'refund': -2, 'complaint': -2,
  // Machinery-specific
  'leaking': -3, 'overheating': -3, 'rust': -2, 'rusted': -3, 'worn': -2,
  'noisy': -2, 'vibration': -1, 'crack': -3, 'cracked': -3, 'dent': -1,
  'maintained': 2, 'serviced': 2, 'certified': 2, 'inspected': 2, 'warranty': 2,
  'original': 1, 'modified': -1, 'repainted': -1, 'refurbished': 1,
};

// ─── Negation words (flip sentiment) ──────────────────
const NEGATORS = new Set(['not', 'no', 'never', 'neither', "don't", "doesn't", "didn't", "wasn't", "weren't", "won't", "wouldn't", "couldn't", "shouldn't", "isn't", "aren't"]);

// ─── Analyze Sentiment ────────────────────────────────
function analyzeSentiment(text) {
  if (!text || typeof text !== 'string') {
    return { score: 0, normalized: 0, label: 'neutral', words: [], themes: [] };
  }

  const words = text.toLowerCase().replace(/[^\w\s'-]/g, '').split(/\s+/).filter(Boolean);
  let totalScore = 0;
  const matchedWords = [];
  let isNegated = false;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Check negation
    if (NEGATORS.has(word)) {
      isNegated = true;
      continue;
    }

    if (AFINN[word] !== undefined) {
      let wordScore = AFINN[word];
      if (isNegated) { wordScore = -wordScore; isNegated = false; }
      totalScore += wordScore;
      matchedWords.push({ word, score: wordScore });
    } else {
      isNegated = false;
    }
  }

  // Normalize to -1 to +1 range
  const maxPossible = Math.max(matchedWords.length * 5, 1);
  const normalized = Math.max(-1, Math.min(1, totalScore / maxPossible));

  // Label
  let label;
  if (normalized > 0.3) label = 'positive';
  else if (normalized > 0.1) label = 'slightly_positive';
  else if (normalized > -0.1) label = 'neutral';
  else if (normalized > -0.3) label = 'slightly_negative';
  else label = 'negative';

  // Extract themes (most frequent non-stopword nouns, 3+ chars)
  const STOPWORDS = new Set(['the', 'is', 'was', 'are', 'were', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'and', 'but', 'or', 'nor', 'for', 'yet', 'so', 'in', 'on', 'at', 'to', 'of', 'with', 'by', 'from', 'up', 'out', 'off', 'over', 'into', 'this', 'that', 'these', 'those', 'it', 'its', 'he', 'she', 'they', 'them', 'their', 'his', 'her', 'my', 'your', 'our', 'very', 'just', 'also', 'too', 'much', 'more', 'most', 'all', 'any', 'some', 'than', 'then', 'when', 'which', 'who', 'what', 'how', 'there', 'here', 'only', 'about']);
  const wordFreq = {};
  words.forEach(w => {
    if (w.length >= 3 && !STOPWORDS.has(w) && !NEGATORS.has(w) && !AFINN[w]) {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    }
  });
  const themes = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }));

  return { score: totalScore, normalized: Math.round(normalized * 100) / 100, label, words: matchedWords, themes };
}

// ─── Trust Score Calculation ──────────────────────────
function calculateTrustScore({ avgRating = 0, reviewCount = 0, avgSentiment = 0, isVerified = false, accountAge = 0 }) {
  let score = 0;

  // Rating component (0-30 points)
  score += Math.min(30, (avgRating / 5) * 30);

  // Review volume (0-20 points, logarithmic)
  score += Math.min(20, Math.log(reviewCount + 1) * 8);

  // Sentiment consistency (0-20 points)
  score += Math.min(20, (avgSentiment + 1) * 10);  // -1 to +1 → 0 to 20

  // Verification (0-15 points)
  if (isVerified) score += 15;

  // Account age bonus (0-15 points, cap at 12 months)
  const monthsOld = accountAge / (30 * 24 * 60 * 60 * 1000);
  score += Math.min(15, monthsOld * 1.25);

  return {
    score: Math.round(Math.min(100, Math.max(0, score))),
    breakdown: {
      rating: Math.round(Math.min(30, (avgRating / 5) * 30)),
      reviews: Math.round(Math.min(20, Math.log(reviewCount + 1) * 8)),
      sentiment: Math.round(Math.min(20, (avgSentiment + 1) * 10)),
      verification: isVerified ? 15 : 0,
      tenure: Math.round(Math.min(15, monthsOld * 1.25)),
    },
    label: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'average' : score >= 20 ? 'low' : 'very_low',
  };
}

module.exports = { analyzeSentiment, calculateTrustScore, AFINN };
