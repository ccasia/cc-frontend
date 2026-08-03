/**
 * Brief-role helpers — single source of truth on the frontend for classifying an
 * admin against the Campaign Brief lifecycle roles.
 *
 * Mirrors the backend `classifyBriefRole` (@utils/briefRoles) and the
 * `isBdOrSuperadmin` middleware. Note the CSM label differs from the backend
 * (`'CSM'` here vs `'CS'` server-side) — kept for compatibility with existing
 * frontend consumers.
 */

export function classifyBriefRole(user) {
  if (!user) return 'other';
  if (user.role === 'superadmin' || ['god', 'advanced'].includes(user?.admin?.mode || '')) {
    return 'superadmin';
  }
  const name = (user?.admin?.role?.name || '').toLowerCase();
  if (name === 'bd' || name.includes('business development') || name.includes('sales and marketing')) {
    return 'BD';
  }
  if (name === 'csl' || name.includes('cs lead')) return 'CSL';
  if (name === 'csm' || name.includes('customer success')) return 'CSM';
  return 'other';
}

// True for admins who land on the BD sales dashboard: BD/sales role by name, or
// the sales_and_marketing role slug (the app's canonical BD slug).
export function isBdAdmin(user) {
  if (!user) return false;
  if (user?.admin?.role?.slug === 'sales_and_marketing') return true;
  return classifyBriefRole(user) === 'BD';
}
