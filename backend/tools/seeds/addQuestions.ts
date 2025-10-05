import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Question } from '../../src/models/question.model';

function genQuestion(i: number, subject: string) {
  // simple generated question text and 5 choices
  const text = `Sample question #${i}: What is the correct answer for item ${i}?`;
  const choices = [
    `Option A for ${i}`,
    `Option B for ${i}`,
    `Option C for ${i}`,
    `Option D for ${i}`,
    `Option E for ${i}`,
  ];
  const correctIndex = i % 5; // deterministic distribution
  return { text, choices, correctIndex, subject } as any;
}

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/codingwars';
  console.log('Connecting to', uri);
  await mongoose.connect(uri, {} as any);

  // how many to create
  const desired = Number(process.env.SEED_COUNT || process.argv[2] || 1000);
  const batchSize = 200;
  console.log(`Will generate ${desired} questions (batchSize=${batchSize})`);

  const subjects = ['any', 'web', 'cs', 'algorithms', 'db', 'math', 'misc'];

  let created = 0;
  for (let start = 0; start < desired; start += batchSize) {
    const batch: any[] = [];
    const end = Math.min(desired, start + batchSize);
    for (let i = start; i < end; i++) {
      const subject = subjects[i % subjects.length];
      batch.push(genQuestion(i + 1, subject));
    }
    // insertMany is faster than individual creates
    const res = await Question.insertMany(batch, { ordered: false }).catch((err) => {
      // some duplicates may error; log and continue
      console.warn('insertMany warning', err && err.message ? err.message : err);
      return null;
    });
    const added = Array.isArray(res) ? res.length : 0;
    created += added;
    console.log(`Inserted batch ${start}-${end - 1}, added ${added} (total ${created})`);
  }

  await mongoose.disconnect();
  console.log('Done, total added (approx):', created);
}

main().catch((err) => { console.error(err); process.exit(1); });
