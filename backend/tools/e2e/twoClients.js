// Simple reproducible script: connect two clients and call findOpponent
const { io } = require('socket.io-client');

function makeClient(name, url, token) {
  const socket = io(url, { auth: { token }, transports: ['websocket'], reconnection: false });
  socket.on('connect', () => {
    console.log(`${name} connected`, socket.id);
    socket.emit('findOpponent', { subject: 'any' });
  });
  socket.on('matchFound', (m) => console.log(`${name} matchFound`, m));
  socket.on('connect_error', (e) => console.error(`${name} connect_error`, e && e.message));
  socket.on('disconnect', (r) => console.log(`${name} disconnected`, r));
  socket.on('error', (e) => console.error(`${name} error`, e));
  return socket;
}

async function run() {
  const url = process.env.SOCKET_URL || 'http://localhost:3000';
  console.log('Using socket url', url);
  // start two clients
  const c1 = makeClient('c1', url, process.env.TOKEN1);
  const c2 = makeClient('c2', url, process.env.TOKEN2);

  // run for 20s then exit
  setTimeout(() => {
    c1.close();
    c2.close();
    process.exit(0);
  }, 20000);
}

run().catch((e) => { console.error(e); process.exit(1); });
