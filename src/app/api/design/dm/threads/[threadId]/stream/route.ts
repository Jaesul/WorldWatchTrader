import { and, eq, gt } from 'drizzle-orm';

import { requireDesignViewer } from '@/app/api/design/dm/_viewer';
import { isUuid } from '@/lib/design/is-uuid';
import {
  assertThreadParticipant,
  getLatestMessageCreatedAt,
  messagesToApi,
} from '@/db/queries/dm-threads';
import { getDb } from '@/db';
import { dmMessages } from '@/db/schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const POLL_MS = 800;

/** Design sandbox SSE — polls Postgres; auth via design viewer cookie. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const v = await requireDesignViewer();
  if (!v.ok) return v.response;

  const { threadId } = await params;
  if (!isUuid(threadId)) {
    return new Response('Invalid thread id', { status: 400 });
  }
  const ok = await assertThreadParticipant(threadId, v.user.id);
  if (!ok) {
    return new Response('Forbidden', { status: 403 });
  }

  const latest = await getLatestMessageCreatedAt(threadId);
  let watermark = latest ?? new Date(0);

  const encoder = new TextEncoder();
  const db = getDb();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      send({ type: 'ready', threadId });

      const tick = async () => {
        try {
          const rows = await db
            .select()
            .from(dmMessages)
            .where(and(eq(dmMessages.threadId, threadId), gt(dmMessages.createdAt, watermark)))
            .orderBy(dmMessages.createdAt);

          const api = await messagesToApi(rows);
          for (let i = 0; i < api.length; i++) {
            send({ type: 'message', message: api[i] });
            const m = rows[i];
            if (m && m.createdAt > watermark) watermark = m.createdAt;
          }
        } catch {
          send({ type: 'error', message: 'poll_failed' });
        }
      };

      const interval = setInterval(tick, POLL_MS);
      void tick();

      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          /* ignore */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
