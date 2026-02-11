// backend/src/auth/role.utils.ts

export type CanonicalRole = 'worker' | 'venue' | 'admin';

// Il DB/JWT oggi usa 'horeca'. Canonico Morphema vuole 'venue'.
// Non rifacciamo dati: normalizziamo a runtime.
export function normalizeRole(role: unknown): CanonicalRole | null {
  if (role === 'admin') return 'admin';
  if (role === 'worker') return 'worker';
  if (role === 'venue') return 'venue';
  if (role === 'horeca') return 'venue';
  return null;
}

export function isRoleAllowed(
  userRole: unknown,
  allowed: CanonicalRole[],
): boolean {
  const r = normalizeRole(userRole);
  if (!r) return false;
  if (r === 'admin') return true; // admin bypass
  return allowed.includes(r);
}
