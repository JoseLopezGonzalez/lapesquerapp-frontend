export const SUPERADMIN_API_URL = (
  process.env.NEXT_PUBLIC_SUPERADMIN_API_URL || 'http://localhost/api/v2/superadmin'
).replace(/\/$/, '');
