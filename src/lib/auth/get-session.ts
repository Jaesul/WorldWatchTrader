import { auth } from '@/auth';
import { cache } from 'react';

/**
 * Deduplicate `auth()` work across nested server components during a single request.
 */
export const getCachedSession = cache(() => auth());
