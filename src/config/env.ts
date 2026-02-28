export function validateRequiredEnv() {
  const isProd = process.env.NODE_ENV === 'production';
  const missing: string[] = [];

  if (isProd) {
    if (!process.env.JWT_ACCESS_SECRET) missing.push('JWT_ACCESS_SECRET');
    if (!process.env.JWT_REFRESH_SECRET) missing.push('JWT_REFRESH_SECRET');
  }

  if (missing.length) {
    throw new Error(`Missing required env in production: ${missing.join(', ')}`);
  }
}
