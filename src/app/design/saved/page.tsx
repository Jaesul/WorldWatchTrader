import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SavedPage() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-4 text-5xl">🔖</div>
      <h1 className="mb-2 text-xl font-semibold text-foreground">No saved listings yet</h1>
      <p className="mb-6 max-w-xs text-sm text-muted-foreground">
        Tap the heart icon on any listing to save it here for later.
      </p>
      <Button asChild>
        <Link href="/design">Browse listings</Link>
      </Button>
    </div>
  );
}
