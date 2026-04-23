import type { Session } from 'next-auth';

import type { AppViewer } from './types';

/**
 * Map a real NextAuth session to `AppViewer` when `/design` is merged into the authenticated app.
 * Stub: returns null until session user fields are wired to match `users` (or join DB by id).
 */
export function sessionUserToAppViewer(session: Session | null): AppViewer | null {
  void session;
  return null;
}
