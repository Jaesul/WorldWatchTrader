import type { ReactNode } from 'react';

/**
 * Jae’s browser-only sandbox under /design/jae.
 * Iterate Jae-owned surfaces here first, with no auth or World tunnel required.
 */
export default function DesignJaeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-0 flex-1 bg-background [font-family:Inter,ui-sans-serif,system-ui,sans-serif]">
      {children}
    </div>
  );
}
