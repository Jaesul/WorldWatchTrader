/** Hostnames used by UploadThing for delivered assets (defense-in-depth on listing create). */
export function isAllowedUploadthingPhotoUrl(href: string): boolean {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;
  const { hostname } = url;
  if (hostname === 'utfs.io') return true;
  if (hostname.endsWith('.utfs.io')) return true;
  if (hostname === 'ufs.sh') return true;
  if (hostname.endsWith('.ufs.sh')) return true;
  return false;
}
