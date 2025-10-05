export type SocketErrorPayload = {
  code: string;
  message: string;
  details?: any;
};

export function emitSocketError(socket: any, code: string, message: string, details?: any) {
  const payload: SocketErrorPayload = { code, message, details };
  try {
    socket.emit('socketError', payload);
  } catch (e) {
    // best-effort
  }
}
