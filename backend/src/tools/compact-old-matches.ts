import dotenv from 'dotenv';
dotenv.config();
import { connectDB, disconnectDB } from '../db';
import { Match } from '../models/match.model';

/**
 * Compact finished matches older than the configured retention period.
 * Default retention: 90 days.
 * Behavior: replace heavy arrays (answers, questions) with a small summary
 * and mark doc with meta.compactedAt. Operates in batches to avoid memory spikes.
 */
async function run() {
  await connectDB();
  try {
    const days = Number(process.env.MATCH_RETENTION_DAYS || '90');
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    console.info('Compaction: cutoff', cutoff.toISOString());

    const batchSize = 200;
    let processed = 0;

    const cursor = Match.find({ finishedAt: { $lte: cutoff } }).cursor();
    for await (const doc of cursor) {
      try {
        const summary: any = {
          players: Array.isArray((doc as any).players)
            ? (doc as any).players.map((p: any) => ({ userId: p.userId ? String(p.userId) : undefined, username: p.username, score: p.score || 0 }))
            : [],
          result: (doc as any).result || undefined,
          subject: (doc as any).subject || undefined,
          startedAt: (doc as any).startedAt,
          finishedAt: (doc as any).finishedAt,
          totalQuestions: Array.isArray((doc as any).questions) ? (doc as any).questions.length : undefined,
        };

        await Match.updateOne(
          { _id: (doc as any)._id },
          {
            $set: { 'meta.compactedAt': new Date(), 'meta.summary': summary },
            $unset: { answers: '', questions: '' },
          }
        );

        processed += 1;
        if (processed % batchSize === 0) {
          console.info('Compaction processed', processed);
        }
      } catch (err) {
        console.warn('Compaction failed for', (doc as any)._id, err);
      }
    }

    console.info('Compaction complete, total processed:', processed);
  } catch (err) {
    console.error('Compaction job failed', err);
  } finally {
    await disconnectDB();
  }
}

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export default run;
