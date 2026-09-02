/**
 * Determine if API key authentication is required for this request.
 *
 * On Vercel, API key auth is ALWAYS enforced regardless of the DB setting.
 * The DB setting (requireApiKey) gets overwritten by KV re-sync on every
 * request, reverting any force-seeded value. This function bypasses the DB
 * entirely for the Vercel check.
 *
 * On self-host, it falls back to the DB setting (operator-configurable).
 */
export function isApiKeyRequired(dbSetting) {
  const isVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_REGION);
  return isVercel || dbSetting === true;
}
