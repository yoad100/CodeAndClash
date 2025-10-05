import { io as client } from 'socket.io-client';

async function run() {
  const url = process.env.SOCKET_URL || 'http://localhost:3000';
  const concurrency = Number(process.env.LOAD_CONCURRENCY || 50);
  const clients: any[] = [];

  for (let i = 0; i < concurrency; i++) {
    const s = client(url, { transports: ['websocket'] });
    s.on('connect', () => console.log('client connected', s.id));
    s.on('matchFound', (m:any) => {
      console.log('matchFound', m);
      // join and answer first question if starts
    });
    s.on('questionStarted', (q:any) => {
      s.emit('submitAnswer', { matchId: q.matchId || q.matchId, questionIndex: q.index, answerIndex: 0 });
    });
    clients.push(s);
  }
}

run().catch((e)=>{console.error(e); process.exit(1);});
