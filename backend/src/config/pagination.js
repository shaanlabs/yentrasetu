/**
 * Pagination helpers — enforce safe defaults and max limits.
 */

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Parse and clamp pagination params from req.query.
 * Returns { page, limit, offset }.
 */
function parsePagination(query, { defaultLimit = DEFAULT_PAGE_SIZE, maxLimit = MAX_PAGE_SIZE } = {}) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit) || defaultLimit));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

module.exports = { parsePagination, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE };
