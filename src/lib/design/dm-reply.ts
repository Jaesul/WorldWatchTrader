/**
 * Opens the DM flow for a listing; ensures the thread server-side then lands
 * on the thread with the composer attachment.
 *
 * `basePath` selects the route surface — `/design` for the cookie-picker
 * sandbox (default for back-compat with existing callers) or `''` for the
 * NextAuth-gated base routes.
 */
export function designDmReplyHref(
  listingId: string,
  basePath: '' | '/design' = '/design',
): string {
  return `${basePath}/messages/start?listingId=${encodeURIComponent(listingId)}`;
}
