import { and, eq, gt } from 'drizzle-orm';

import { auth } from '@/auth';
import { isUuid } from '@/lib/design/is-uuid';
import { assertThreadParticipant, getLatestMessageCreatedAt, messageToApi } from '@/db/queries/dm-threads';
import { getDb } from '@/db';
import { dmMessages } from '@/db/schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const POLL_MS = 800;

/**
 * SSE stream of new DM rows for a thread. Serverless-friendly: polls Postgres on an interval.
 * Client should reconnect after disconnect (e.g. Vercel max duration).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { threadId } = await params;
  if (!isUuid(threadId)) {
    return new Response('Invalid thread id', { status: 400 });
  }
  const ok = await assertThreadParticipant(threadId, userId);
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

          for (const m of rows) {
            send({
              type: 'message',
              message: messageToApi(m),
            });
            if (m.createdAt > watermark) watermark = m.createdAt;
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
