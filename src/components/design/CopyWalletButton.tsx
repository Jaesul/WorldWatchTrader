'use client';

import { Check, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

function shortAddress(addr: string): string {
  if (!addr) return '';
  if (addr.length <= 9) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-3)}`;
}

export function CopyWalletButton({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Address copied');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Couldn’t copy');
    }
  }
  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label="Copy wallet address"
      title={address}
      className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <span>{shortAddress(address)}</span>
      {copied ? (
        <Check className="size-3 text-emerald-600" strokeWidth={2.5} />
      ) : (
        <Copy className="size-3" strokeWidth={2} />
      )}
    </button>
  );
}
