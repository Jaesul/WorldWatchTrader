import { NextResponse } from 'next/server';

import { listUsersForPicker } from '@/db/queries/users';
import { dbUserRowToAppViewer } from '@/lib/viewer/from-db-user';

/** Picker list for the design viewer — off the RSC layout so `/design` can paint before this finishes. */
export async function GET() {
  const rows = await listUsersForPicker();
  return NextResponse.json(rows.map(dbUserRowToAppViewer));
}
