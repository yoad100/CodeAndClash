#!/usr/bin/env ts-node
// Simple script to report Match documents with missing or null answers.playerId entries.
// Usage: from backend folder run: npx ts-node tools/report_missing_answer_ids.ts

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Match } from '../src/models/match.model';

dotenv.config({ path: process.cwd() + '/.env' });

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/codingwar';
  console.log('Connecting to', uri);
  await mongoose.connect(uri, {} as any);

  try {
    const totalMatches = await Match.countDocuments({});
    console.log('Total matches:', totalMatches);

    // Matches with at least one answer with missing playerId
    const bad = await Match.aggregate([
      { $match: { 'answers.playerId': { $in: [null, '', undefined] } } },
      { $project: { _id: 1, subject: 1, players: 1, answers: 1 } },
      { $limit: 50 }
    ]).allowDiskUse(true);

    const badCount = await Match.countDocuments({ 'answers.playerId': { $in: [null, '', undefined] } });
    console.log('Matches with missing answer.playerId (sample up to 50):', bad.length, 'total:', badCount);
    for (const m of bad) {
      console.log('Match', m._id, 'subject', m.subject, 'players', (m.players||[]).map((p:any)=>p.userId));
    }

    // Matches where answers exist but none have playerId matching any player.userId (type mismatch)
    const mismatchSample = await Match.aggregate([
      { $match: { answers: { $exists: true, $ne: [] } } },
      { $project: { _id: 1, players: 1, answers: 1 } },
      { $limit: 200 }
    ]).allowDiskUse(true);

    let mismatchCount = 0;
    for (const m of mismatchSample) {
      const playerIds = new Set((m.players||[]).map((p:any)=>String(p.userId)));
      const anyMatch = (m.answers||[]).some((a:any) => a && a.playerId && playerIds.has(String(a.playerId)) );
      if (!anyMatch) mismatchCount++;
    }
    console.log('Sampled', mismatchSample.length, 'matches and found', mismatchCount, 'with mismatched answer.playerId vs players.userId');

  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err)=>{ console.error(err); process.exit(1); });
