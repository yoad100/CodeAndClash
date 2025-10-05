import { io, Socket } from 'socket.io-client';
import { SOCKET_CONFIG } from '../../src/config/socket';

// Simple headless e2e: create two clients, start search and wait for matchFound
async function run() {
  const clients: Socket[] = [];

  function makeClient(name: string) {
    const s = io(SOCKET_CONFIG.URL, { transports: ['websocket'] });
    s.on('connect', () => console.log(`${name} connected ${s.id}`));
    s.on('connect_error', (err) => console.error(`${name} connect error`, err));
    s.on('matchFound', (data: any) => console.log(`${name} matchFound`, data));
    s.on('questionStarted', (q: any) => console.log(`${name} questionStarted`, q));
    s.on('matchEnded', (res: any) => console.log(`${name} matchEnded`, res));
    return s;
  }

  const a = makeClient('A');
  const b = makeClient('B');
  clients.push(a, b);

  // Wait for both to connect
  await new Promise((resolve) => setTimeout(resolve, 1000));

  a.emit('findOpponent');
  b.emit('findOpponent');

  // allow some time for a match to complete
  await new Promise((resolve) => setTimeout(resolve, 20000));

  clients.forEach((c) => c.disconnect());
  console.log('E2E run complete');
}

run().catch((e) => {
  console.error('E2E error', e);
  process.exit(1);
});
