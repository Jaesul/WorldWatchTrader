import { redirect } from 'next/navigation';

/**
 * Legacy path from older wallet-auth redirectTo. The marketplace feed lives at `/`.
 */
export default function HomeRedirectPage() {
  redirect('/');
}
