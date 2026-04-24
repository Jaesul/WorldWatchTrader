import type { ReactNode } from 'react';
import { DesignLayoutShell } from '@/components/design/DesignLayoutShell';

/**
 * Public UX sandbox for browser-only iteration (no World App / tunnel / sign-in).
 * Jae merges these layouts into (protected) routes when wiring real auth & MiniKit.
 */
export default function DesignLayout({ children }: { children: ReactNode }) {
  return <DesignLayoutShell>{children}</DesignLayoutShell>;
}
