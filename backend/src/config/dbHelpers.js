/**
 * Database dialect helpers.
 * Provides cross-dialect compatible operators (SQLite + PostgreSQL).
 */
const { Op } = require('sequelize');
const { sequelize } = require('./database');

/**
 * Returns the correct case-insensitive LIKE operator for the current dialect.
 * PostgreSQL supports Op.iLike; SQLite does not (LIKE is already case-insensitive for ASCII).
 */
function likeOp() {
  return sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
}

/**
 * Wraps a value in a case-insensitive LIKE expression: { [iLikeOrLike]: `%${value}%` }
 */
function iLikeFilter(value) {
  return { [likeOp()]: `%${value}%` };
}

module.exports = { likeOp, iLikeFilter };
