import { io as client } from 'socket.io-client';

async function run() {
  const url = process.env.SOCKET_URL || 'http://localhost:3000';

  const a = client(url, { transports: ['websocket'] });
  const b = client(url, { transports: ['websocket'] });

  a.on('connect', () => console.log('A connected', a.id));
  b.on('connect', () => console.log('B connected', b.id));

  let matchId: string | null = null;
  a.on('matchFound', (m:any) => { console.log('A matchFound', m); matchId = m.matchId; });
  b.on('matchFound', (m:any) => { console.log('B matchFound', m); matchId = matchId || m.matchId; });

  a.on('questionStarted', (q:any) => {
    console.log('A question', q);
    a.emit('submitAnswer', { matchId: matchId || q.matchId, questionIndex: q.index, answerIndex: 0 });
  });
  b.on('questionStarted', (q:any) => {
    console.log('B question', q);
    b.emit('submitAnswer', { matchId: matchId || q.matchId, questionIndex: q.index, answerIndex: 1 });
  });

  a.on('matchEnded', (r:any) => { console.log('A matchEnded', r); process.exit(0); });
  b.on('matchEnded', (r:any) => { console.log('B matchEnded', r); process.exit(0); });

  // start matchmaking
  a.emit('findOpponent', { subject: 'any' });
  b.emit('findOpponent', { subject: 'any' });
}

run().catch((e)=>{console.error(e); process.exit(1);});
