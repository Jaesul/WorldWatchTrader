/** Opens design DM flow for a listing; ensures thread server-side then lands on thread with composer attachment. */
export function designDmReplyHref(listingId: string): string {
  return `/design/messages/start?listingId=${encodeURIComponent(listingId)}`;
}
