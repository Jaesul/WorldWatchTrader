import { NextResponse } from 'next/server';

import { getNewNonces } from '@/auth/wallet/server-helpers';

export async function GET() {
  const nonces = await getNewNonces();
  return NextResponse.json(nonces);
}

