/**
 * Environment variable validation.
 * Validates required and optional env vars at startup.
 * Prevents silent misconfiguration in production.
 */
require('dotenv').config();

function validateEnv() {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors = [];
  const warnings = [];

  // ── Required in production ────────────────────────────
  const requiredInProd = [
    { key: 'DATABASE_URL', hint: 'PostgreSQL connection string' },
    { key: 'JWT_SECRET', hint: 'Secret key for signing JWT tokens' },
    { key: 'CORS_ORIGINS', hint: 'Comma-separated allowed origins' },
  ];

  if (isProduction) {
    for (const { key, hint } of requiredInProd) {
      if (!process.env[key]) {
        errors.push(`Missing required env var: ${key} (${hint})`);
      }
    }
  }

  // ── Warn on missing optional vars ─────────────────────
  const optional = [
    { key: 'FRONTEND_URL', hint: 'Used for CSP and email links' },
    { key: 'NODE_ENV', hint: 'Should be "production" in prod', default: 'development' },
    { key: 'JWT_REFRESH_SECRET', hint: 'Separate secret for refresh tokens (defaults to JWT_SECRET + "-refresh")' },
    { key: 'PORT', hint: 'Server port (defaults to 5000)' },
  ];

  for (const { key, hint } of optional) {
    if (!process.env[key]) {
      warnings.push(`${key} not set — ${hint}`);
    }
  }

  // ── Validate JWT_SECRET strength ──────────────────────
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 16) {
    warnings.push('JWT_SECRET is very short (< 16 chars). Use a strong random string.');
  }

  // ── Validate DATABASE_URL format ──────────────────────
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgres')) {
    warnings.push('DATABASE_URL does not look like a PostgreSQL URL.');
  }

  // ── Print results ─────────────────────────────────────
  if (warnings.length > 0) {
    console.log('⚠️  Environment warnings:');
    warnings.forEach(w => console.log(`   • ${w}`));
  }

  if (errors.length > 0) {
    console.error('\n🔴 FATAL: Environment validation failed:');
    errors.forEach(e => console.error(`   ✕ ${e}`));
    console.error('\nSet the required environment variables and restart.\n');
    process.exit(1);
  }

  console.log(`✅ Environment validated (${isProduction ? 'production' : 'development'} mode)`);
}

module.exports = validateEnv;
