/**
 * Bottom nav uses dark "blue energy" chrome on routes that share a deep-blue hero
 * (see Navigation + `bg-blue-energy` in `globals.css` @theme).
 */
export function navUsesBlueEnergy(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return (
    pathname === '/' ||
    pathname === '/home' ||
    pathname.startsWith('/home/')
  );
}
