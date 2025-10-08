import { Server as HttpServer } from 'http';
import { Server as IOServer } from 'socket.io';
import { Match } from './models/match.model';
import { Question } from './models/question.model';
import { User } from './models/user.model';
import { updateScore } from './services/leaderboard.redis';
import jwt from 'jsonwebtoken';
import redis from './services/redis.client';
import { scheduleJob, cancelJobs } from './services/scheduler.redis';
import { createMatchState, getMatchState, updateMatchState, deleteMatchState } from './services/match.redis';
import { findOpponentSchema, submitAnswerSchema, createPrivateMatchSchema, joinPrivateMatchSchema } from './validation/socket.schemas';
import { emitSocketError } from './utils/socketError';
import { setSocketUser, deleteSocketUser } from './services/socketmap.redis';
import { eloRatingChange } from './utils/elo';
import { createAdapter } from '@socket.io/redis-adapter';
import logger from './logger';

type QueueEntry = { socketId: string; userId?: string; guestId?: string; username?: string };

// Note: match runtime state is persisted in Redis via match.redis helpers.
// Socket.IO rooms are used to address participants across instances: room `match:{matchId}`.
async function startNextQuestion(matchId: string) {
  logger.info('startNextQuestion called for match %s', matchId);
  // load persisted match state from Redis
  const ms = await getMatchState(matchId);
  if (!ms) {
    logger.warn('no match state found for %s', matchId);
    return;
  }
  // IMPORTANT: do not use `|| -1` because 0 is falsy and would repeat question 0
  const prevIndex = typeof ms.currentQuestionIndex === 'number' ? ms.currentQuestionIndex : -1;
  const qi = prevIndex + 1;
  logger.info('starting question %d for match %s (prevIndex=%d)', qi, matchId, prevIndex);
  // reset frozen map for next question and update currentQuestionIndex in Redis
  const resetFrozen = Object.keys(ms.frozen || {}).reduce((acc: any, k: string) => { acc[k] = false; return acc; }, {});
  await updateMatchState(matchId, { currentQuestionIndex: qi, frozen: resetFrozen });
  try {
    const msAfter = await getMatchState(matchId);
    logger.info('match %s state updated to currentQuestionIndex=%s', matchId, String(msAfter?.currentQuestionIndex));
  } catch {}

  const qEntry = ms.questions?.[qi];
  if (!qEntry) {
    logger.warn('no question at index %d for match %s', qi, matchId);
    return;
  }

  // fetch full question to send sanitized content
  const question = await Question.findById(qEntry.id).lean();
  if (!question) {
    logger.warn('question not found in DB: %s', qEntry.id);
    return;
  }
  
  // schedule individual player timeouts (15s each)
  // First timeout at 15s, second at 30s (if first player times out)
  const firstTimeout = Date.now() + 15000;
  const secondTimeout = Date.now() + 30000;
  
  const q = { matchId, index: qi, question: { id: question._id, text: question.text, choices: question.choices }, questionEndAt: secondTimeout };
  logger.info('emitting questionStarted for match %s question %d', matchId, qi);
  // emit to room so cross-instance delivers to both players
  try {
    (global as any).__io?.to(`match:${matchId}`).emit('questionStarted', q);
  } catch (e) {
    logger.warn('room emit questionStarted failed for match %s: %o', matchId, e);
  }

  // Also send directly to known participant socketIds (fallback if adapter/rooms don't reach all instances)
  try {
    const participants: string[] = Array.isArray(ms.participants) ? ms.participants : [];
    for (const sid of participants) {
      try {
        (global as any).__io?.to(sid).emit('questionStarted', q);
      } catch (err) {
        // best-effort per-socket emit
        logger.debug('direct emit questionStarted to %s failed: %o', sid, err);
      }
    }
  } catch (e) {
    // ignore
  }

  await scheduleJob(matchId, qi, firstTimeout, 'playerTimeout');
  await scheduleJob(matchId, qi, secondTimeout, 'questionEnd');
  try { await updateMatchState(matchId, { questionEndAt: secondTimeout }); } catch {}
}

// Redis-backed queues: queue:{subject}
async function enqueueRedis(subject: string, entry: QueueEntry) {
  const key = `queue:${subject}`;
  // Remove existing entries for this userId to avoid duplicate presence in the queue
  try {
    const all = await redis.lrange(key, 0, -1);
    for (const raw of all) {
      try {
        const e = JSON.parse(raw) as QueueEntry;
        const sameUser = e.userId && entry.userId && String(e.userId) === String(entry.userId);
        const sameGuest = e.guestId && entry.guestId && String(e.guestId) === String(entry.guestId);
        const sameSocket = String(e.socketId) === String(entry.socketId);
        if (sameUser || sameGuest || sameSocket) {
          await redis.lrem(key, 0, raw);
        }
      } catch {}
    }
  } catch {}
  await redis.rpush(key, JSON.stringify(entry));
}

async function tryPopPairRedis(subject: string) {
  const key = `queue:${subject}`;
  const a = await redis.lpop(key);
  if (!a) return null;
  const b = await redis.lpop(key);
  if (!b) {
    // push a back
    await redis.rpush(key, a);
    return null;
  }
  const A = JSON.parse(a) as QueueEntry;
  const B = JSON.parse(b) as QueueEntry;
  // Guard: don't match the same user/socket with themselves
  const sameUser = A.userId && B.userId && String(A.userId) === String(B.userId);
  const sameGuest = A.guestId && B.guestId && String(A.guestId) === String(B.guestId);
  const sameSocket = String(A.socketId) === String(B.socketId);
  if (sameUser || sameGuest || sameSocket) {
    // Requeue both in original order to avoid starvation
    await redis.rpush(key, JSON.stringify(A));
    await redis.rpush(key, JSON.stringify(B));
    return null;
  }
  return [A, B];
}

// Remove any queued entries for a given identity across all subject queues
async function removeFromAllQueues(match: { socketId: string; userId?: string; guestId?: string }) {
  try {
    const keys = await (redis as any).keys('queue:*');
    for (const key of keys || []) {
      try {
        const all = await redis.lrange(key, 0, -1);
        for (const raw of all) {
          try {
            const e = JSON.parse(raw) as QueueEntry;
            const sameSocket = String(e.socketId) === String(match.socketId);
            const sameUser = e.userId && match.userId && String(e.userId) === String(match.userId);
            const sameGuest = e.guestId && match.guestId && String(e.guestId) === String(match.guestId);
            if (sameSocket || sameUser || sameGuest) {
              await redis.lrem(key, 0, raw);
            }
          } catch {}
        }
      } catch {}
    }
  } catch {}
}

async function endMatch(match: any, io: any, forcedWinnerId?: string) {
  const scores: Record<string, number> = {};
  match.players.forEach((p: any) => { scores[String(p.userId)] = p.score || 0; });
  const playerIds = match.players.map((p: any) => String(p.userId));
  const s0 = scores[playerIds[0]] || 0;
  const s1 = scores[playerIds[1]] || 0;
  let winnerId: string | null = null;
  if (forcedWinnerId) {
    winnerId = String(forcedWinnerId);
  } else if (s0 > s1) winnerId = playerIds[0];
  else if (s1 > s0) winnerId = playerIds[1];

  match.status = 'finished';
  match.finishedAt = new Date();
  match.result = { winnerId, scores };
  await match.save();

  // Update DB user stats and Redis leaderboard (only for real users with ObjectId-like ids)
  const isObjectId = (s: string) => /^[a-fA-F0-9]{24}$/.test(String(s));
  for (const p of match.players as any[]) {
    if (!isObjectId(String(p.userId))) continue;
    const u = await User.findById(p.userId);
    if (!u) continue;
    if (String(p.userId) === String(winnerId)) {
      u.wins = (u.wins || 0) + 1;
    } else {
      u.losses = (u.losses || 0) + 1;
    }
    // simple rating update: +10 for win, -5 for loss
    u.rating = (u.rating || 1000) + (String(p.userId) === String(winnerId) ? 10 : -5);
    await u.save();
    await updateScore(String(u._id), u.rating);
  }

  // emit matchEnded with winner and scores to the room
  // Normalize players to include `id` string for frontend
  const normPlayers = (match.players || []).map((p: any) => ({
    id: String(p.userId || p.id || ''),
    userId: String(p.userId || p.id || ''),
    username: p.username,
    score: p.score || 0,
    isFrozen: !!p.isFrozen,
  }));
  io.to(`match:${match._id}`).emit('matchEnded', { matchId: String(match._id), winnerId: winnerId ? String(winnerId) : null, players: normPlayers });
  
  // cleanup persisted match state
  await deleteMatchState(String(match._id));
  // cleanup user-to-match mapping so reconnect doesn't rejoin old matches
  try {
    for (const p of match.players as any[]) {
      if (p.userId) {
        await redis.del(`usermatch:${String(p.userId)}`);
      }
    }
  } catch {}
}

export function initSocket(server: HttpServer) {
  const io = new IOServer(server, {
    cors: { origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => cb(null, true), credentials: true },
  });
  // expose io globally for helper functions
  (global as any).__io = io;

  // attach Redis adapter so emits/rooms work across instances
  let pubClient: ReturnType<typeof redis.duplicate> | null = null;
  let subClientAdapter: ReturnType<typeof redis.duplicate> | null = null;
  (async () => {
    try {
      pubClient = redis.duplicate();
      subClientAdapter = redis.duplicate();
      // connect but tolerate "already connecting/connected" errors from ioredis
      try {
        await pubClient.connect();
      } catch (e: any) {
        const msg = String(e && e.message || e);
        if (!/already connecting|already connected/i.test(msg)) {
          console.warn('pubClient.connect error', e);
        }
      }
      try {
        await subClientAdapter.connect();
      } catch (e: any) {
        const msg = String(e && e.message || e);
        if (!/already connecting|already connected/i.test(msg)) {
          console.warn('subClientAdapter.connect error', e);
        }
      }
      try {
        io.adapter(createAdapter(pubClient as any, subClientAdapter as any));
      } catch (e) {
        console.warn('Failed to set socket.io redis adapter', e);
      }
    } catch (err) {
      console.warn('Failed to attach redis adapter to socket.io', err);
    }
  })();

  // subscribe to scheduler events
  const sub = redis.duplicate();
  let subConnected = false;
  sub.connect().then(async () => {
  subConnected = true;
  await sub.subscribe('match-events', async (message: string) => {
      try {
        if (!message) return;
        let payload: any = null;
        try { payload = JSON.parse(message as unknown as string); } catch (e) { return; }
        
        if (payload && (payload.event === 'questionTick' || payload.eventType === 'playerTimeout' || payload.eventType === 'questionEnd' || payload.eventType === 'unfreeze')) {
          const matchId = String(payload.matchId);
          const qi = Number(payload.questionIndex);
          
          if (payload.eventType === 'unfreeze') {
            // Unfreeze a specific player
            const ms = await getMatchState(matchId);
            if (!ms) return;
            
            const newFrozen: any = { ...(ms.frozen || {}) };
            delete newFrozen[String(payload.playerId)];
            await updateMatchState(matchId, { frozen: newFrozen });
            
            // Notify the match that player is unfrozen
            (global as any).__io?.to(`match:${matchId}`).emit('playerUnfrozen', { matchId, playerId: payload.playerId });
            return;
          }
          
          // load match state from Redis
          const ms = await getMatchState(matchId);
          if (!ms) return;

          if (payload.eventType === 'playerTimeout') {
            // Do not end the question on first timeout. We'll rely on the 30s questionEnd.
            // This allows continued attempts even if both initially answered wrong.
            return;
          }
          
          if (payload.eventType === 'questionEnd' || payload.event === 'questionTick') {
            // Second timeout (30s total) or original single timeout - end the question
            const correctIndex = ms?.questions?.[qi]?.correctIndex;
            // Only act if this job corresponds to the currently active question index
            if (typeof ms.currentQuestionIndex === 'number' && ms.currentQuestionIndex !== qi) {
              logger.info('scheduler: skipping questionEnd for match %s qi=%d because currentQuestionIndex=%d', matchId, qi, ms.currentQuestionIndex);
              return;
            }
            const hadActivity = !!((ms as any).activity && (ms as any).activity[String(qi)]);
            const match = await Match.findById(matchId);
            if (!match) return;
            if (!hadActivity) {
              // No one interacted for 30s → end match for both with no winner
              try {
                (global as any).__io?.to(`match:${matchId}`).emit('matchEnded', { matchId, winnerId: null, players: (match.players || []).map((p:any)=>({ id: String(p.userId || p.id || ''), username: p.username, score: p.score || 0 })) });
              } catch {}
              await deleteMatchState(matchId);
              try {
                for (const p of (match.players as any[])) {
                  if (p.userId) await redis.del(`usermatch:${String(p.userId)}`);
                }
              } catch {}
              match.status = 'finished';
              match.finishedAt = new Date();
              match.result = { winnerId: null, scores: {} as any };
              await match.save();
            } else {
              // End just this question and continue
              (global as any).__io?.to(`match:${matchId}`).emit('questionEnded', { matchId, correctIndex });
              try {
                const cleared: any = {};
                for (const k of Object.keys(ms.frozen || {})) cleared[k] = false;
                await updateMatchState(matchId, { frozen: cleared });
              } catch {}
              if (qi + 1 < (ms.questions || []).length) {
                startNextQuestion(matchId);
              } else {
                const match2 = await Match.findById(matchId);
                if (match2) await endMatch(match2, (global as any).__io);
              }
            }
          }
        }
      } catch (err) {
        logger.error('match-events handler error %o', err);
      }
    });
  }).catch((err: any)=>console.error('redis sub connect err', err));

  io.on('connection', (socket) => {
  logger.info('socket connected %s', socket.id);

    // Authenticate socket using JWT from handshake
  const token = (socket.handshake.auth && socket.handshake.auth.token) || (socket.handshake.query && (socket.handshake.query.token as string));
  const guestIdFromClient = (socket.handshake.auth && (socket.handshake.auth as any).guestId) as string | undefined;
    let socketUser: { sub?: string; username?: string } | null = null;
    if (token) {
      try {
        const payload: any = (jwt.verify as any)(token, process.env.JWT_SECRET || 'secret');
        socketUser = { sub: payload.sub, username: payload.username };
      } catch (err) {
        logger.warn('Invalid socket token %o', err);
      }
    }
    // Fallback guest identity so gameplay works even without JWT
    if (!socketUser || !socketUser.sub) {
      const gid = guestIdFromClient && typeof guestIdFromClient === 'string' ? guestIdFromClient : `guest:${socket.id}`;
      socketUser = { sub: gid, username: socketUser?.username || 'Guest' };
    }
    // persist mapping for cross-instance lookup
    if (socketUser?.sub) setSocketUser(socket.id, String(socketUser.sub)).catch(() => {});

    // If this user is already in a match, ensure this new socket joins the match room
    (async () => {
      try {
        if (socketUser?.sub) {
          const existingMatchId = await redis.get(`usermatch:${String(socketUser.sub)}`);
          if (existingMatchId) {
            try {
              io.in([socket.id]).socketsJoin(`match:${existingMatchId}`);
            } catch (e) {
              try { socket.join(`match:${existingMatchId}`); } catch {}
            }
            // also update participants list to include this socket id
            try {
              const ms = await getMatchState(String(existingMatchId));
              if (ms) {
                const parts = Array.isArray(ms.participants) ? ms.participants : [];
                if (!parts.includes(String(socket.id))) {
                  parts.push(String(socket.id));
                  await updateMatchState(String(existingMatchId), { participants: parts });
                }
              }
            } catch {}
          }
        }
      } catch (e) {}
    })();

    // create or join a private match
    socket.on('createPrivateMatch', async (data: any) => {
  const parsed = createPrivateMatchSchema.safeParse(data || {});
  if (!parsed.success) return emitSocketError(socket, 'INVALID_PAYLOAD', 'Invalid payload', parsed.error.errors);
      const subject = parsed.data.subject || 'any';
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      await redis.setex(`private:${code}`, 60 * 15, JSON.stringify({ socketId: socket.id, userId: socketUser?.sub, username: socketUser?.username, subject }));
      socket.emit('privateCreated', { inviteCode: code });
    });

    socket.on('joinPrivateMatch', async (data: any) => {
  const parsed = joinPrivateMatchSchema.safeParse(data || {});
  if (!parsed.success) return emitSocketError(socket, 'INVALID_PAYLOAD', 'Invalid payload', parsed.error.errors);
      const code = parsed.data.inviteCode;
      if (!code) return socket.emit('error', { message: 'Missing invite code' });
      const raw = await redis.get(`private:${code}`);
      if (!raw) return socket.emit('error', { message: 'Invite not found or expired' });
      const info = JSON.parse(raw);
      await redis.del(`private:${code}`);

  const p1 = { socketId: info.socketId, userId: info.userId, username: info.username };
  const p2 = { socketId: socket.id, userId: socketUser?.sub, username: socketUser?.username || 'Guest' };

      // create match with subject if provided
      const subject = info.subject || 'any';
      const filter: any = {};
      if (subject !== 'any') filter.subject = subject;
      const total = await Question.countDocuments(filter);
      const skip = Math.max(0, Math.floor(Math.random() * Math.max(1, total - 5)));
      const questions = await Question.find(filter).skip(skip).limit(5).lean();

  const match = await Match.create({ players: [ { userId: p1.userId, username: p1.username }, { userId: p2.userId, username: p2.username } ], subject: subject === 'any' ? undefined : subject, questions: questions.map((q:any)=>q._id), status: 'inprogress', startedAt: new Date() });
  // persist match runtime state in Redis (include participant socket IDs)
  await createMatchState(String(match._id), { currentQuestionIndex: -1, frozen: {}, participants: [String(p1.socketId), String(p2.socketId)], userIds: [String(p1.userId || ''), String(p2.userId || '')], questions: questions.map((q:any)=>({ id: q._id, correctIndex: q.correctIndex })) });
      // map users to this match for reconnect handling
      try {
        if (p1.userId) await redis.set(`usermatch:${String(p1.userId)}`, String(match._id));
        if (p2.userId) await redis.set(`usermatch:${String(p2.userId)}`, String(match._id));
      } catch {}
      // make both sockets join the match room (works across instances via redis adapter)
      try {
        // Correct API: target specific socket ids and make them join the room (works across nodes via Redis adapter)
        io.in([p1.socketId, p2.socketId]).socketsJoin(`match:${match._id}`);
      } catch (e) {
        // fallback: attempt to join individually where sockets are local
        const s1 = io.sockets.sockets.get(p1.socketId);
        if (s1) s1.join(`match:${match._id}`);
        const s2 = io.sockets.sockets.get(p2.socketId);
        if (s2) s2.join(`match:${match._id}`);
      }
  io.to(p1.socketId).emit('matchFound', { matchId: match._id, player: { id: String(p1.userId || `guest:${p1.socketId}`), username: p1.username || 'You' }, opponent: { id: String(p2.userId || `guest:${p2.socketId}`), username: p2.username || 'Opponent' }, subject });
  io.to(p2.socketId).emit('matchFound', { matchId: match._id, player: { id: String(p2.userId || `guest:${p2.socketId}`), username: p2.username || 'You' }, opponent: { id: String(p1.userId || `guest:${p1.socketId}`), username: p1.username || 'Opponent' }, subject });
      startNextQuestion(String(match._id));
    });

    socket.on('findOpponent', async (data: any) => {
  logger.info('recv findOpponent from %s handshakeAuth=%o', socket.id, (socket.handshake && socket.handshake.auth) || {});
  const parsed = findOpponentSchema.safeParse(data || {});
  if (!parsed.success) return emitSocketError(socket, 'INVALID_PAYLOAD', 'Invalid payload', parsed.error.errors);
      const subject = parsed.data.subject || 'any';
  const gid = guestIdFromClient && typeof guestIdFromClient === 'string' ? String(guestIdFromClient) : `guest:${socket.id}`;
  const uid = socketUser?.sub || gid;
  const uname = socketUser?.username || data?.username || 'Guest';
      const identity = String(uid || gid);
      // Acquire a short-lived lock per identity to avoid duplicate rapid enqueues/self-pairs under refresh races
      try {
        const ok = await (redis as any).set(`findlock:${identity}`, '1', 'NX', 'PX', 5000);
        if (!ok) {
          logger.info('findOpponent ignored due to active lock for identity=%s', identity);
          return;
        }
      } catch (e) {
        logger.warn('findOpponent lock set failed: %o', e);
      }
      logger.info('findOpponent handler %s subject=%s user=%s username=%s', socket.id, subject, uid || 'guest', uname || 'unknown');
      // premium subject check
      if (subject !== 'any') {
        if (!uid) return socket.emit('error', { message: 'Premium matches require login' });
        const u = await User.findById(uid);
        if (!u || !u.isPremium) return socket.emit('error', { message: 'Premium required for subject-specific matches' });
      }
  await enqueueRedis(subject, { socketId: socket.id, userId: uid, guestId: gid, username: uname });

  logger.info('enqueued %s -> queue:%s', socket.id, subject);

      // Try to find a pair in subject queue first, then any
      let pair = await tryPopPairRedis(subject);
      if (!pair && subject !== 'any') pair = await tryPopPairRedis('any');
  if (!pair) return;

      const [p1, p2] = pair;
      // Safety guard against self-match
      const sameUser2 = p1.userId && p2.userId && String(p1.userId) === String(p2.userId);
      const sameGuest2 = p1.guestId && p2.guestId && String(p1.guestId) === String(p2.guestId);
      const sameSocket2 = String(p1.socketId) === String(p2.socketId);
      if (sameUser2 || sameGuest2 || sameSocket2) {
        // Re-enqueue and wait for a real opponent
        await enqueueRedis(subject, p1);
        await enqueueRedis(subject, p2);
        return;
      }

      // load 5 random questions (subject if provided)
      const filter: any = {};
      if (subject !== 'any') filter.subject = subject;
      const total = await Question.countDocuments(filter);
      const skip = Math.max(0, Math.floor(Math.random() * Math.max(1, total - 5)));
      const questions = await Question.find(filter).skip(skip).limit(5).lean();

      const match = await Match.create({
        players: [ { userId: p1.userId, username: p1.username }, { userId: p2.userId, username: p2.username } ],
        subject: subject === 'any' ? undefined : subject,
        questions: questions.map((q: any) => q._id),
        status: 'inprogress',
        startedAt: new Date(),
      });

  // persist match runtime state in Redis and join room (include participant socket IDs)
      await createMatchState(String(match._id), { currentQuestionIndex: -1, frozen: {}, participants: [String(p1.socketId), String(p2.socketId)], userIds: [String(p1.userId || ''), String(p2.userId || '')], questions: questions.map((q:any)=>({ id: q._id, correctIndex: q.correctIndex })) });
          // map users to this match for reconnect handling
          try {
            if (p1.userId) await redis.set(`usermatch:${String(p1.userId)}`, String(match._id));
            if (p2.userId) await redis.set(`usermatch:${String(p2.userId)}`, String(match._id));
          } catch {}
      try {
        io.in([p1.socketId, p2.socketId]).socketsJoin(`match:${match._id}`);
      } catch (e) {
        const s1 = io.sockets.sockets.get(p1.socketId);
        if (s1) s1.join(`match:${match._id}`);
        const s2 = io.sockets.sockets.get(p2.socketId);
        if (s2) s2.join(`match:${match._id}`);
      }
  logger.info('about to emit matchFound match=%s p1=%s p2=%s', String(match._id), p1.socketId, p2.socketId);
  logger.info('emitting matchFound to p1=%s p2=%s', p1.socketId, p2.socketId);
  io.to(p1.socketId).emit('matchFound', { matchId: match._id, player: { id: String(p1.userId || `guest:${p1.socketId}`), username: p1.username || 'You' }, opponent: { id: String(p2.userId || `guest:${p2.socketId}`), username: p2.username || 'Opponent' }, subject });
  io.to(p2.socketId).emit('matchFound', { matchId: match._id, player: { id: String(p2.userId || `guest:${p2.socketId}`), username: p2.username || 'You' }, opponent: { id: String(p1.userId || `guest:${p1.socketId}`), username: p1.username || 'Opponent' }, subject });
      // start first question
      logger.info('starting first question for match %s', String(match._id));
      startNextQuestion(String(match._id));
    });

    socket.on('submitAnswer', async (payload: any, ack?: (res: any) => void) => {
      logger.info('submitAnswer event received from %s payload=%o', socket.id, payload);
      try {
  const parsed = submitAnswerSchema.safeParse(payload || {});
  if (!parsed.success) return emitSocketError(socket, 'INVALID_PAYLOAD', 'Invalid payload', parsed.error.errors);
        const { matchId, questionIndex, answerIndex } = parsed.data;
        const playerId = socketUser?.sub;
        logger.info('submitAnswer from %s: matchId=%s questionIndex=%d answerIndex=%d playerId=%s', socket.id, matchId, questionIndex, answerIndex, playerId);
        if (!playerId) {
          socket.emit('error', { message: 'Not authenticated' });
          if (typeof ack === 'function') ack({ ok: false, error: 'Not authenticated' });
          return;
        }
        const match = await Match.findById(matchId);
        if (!match) {
          socket.emit('error', { message: 'Match not found' });
          if (typeof ack === 'function') ack({ ok: false, error: 'Match not found' });
          return;
        }

        // Ensure this socket is in the match room for subsequent emits
        try {
          io.in([socket.id]).socketsJoin(`match:${matchId}`);
        } catch (e) {
          try { socket.join(`match:${matchId}`); } catch {}
        }

        const qId = match.questions[questionIndex];
        const question = await Question.findById(qId).lean();
        const correct = question && question.correctIndex === answerIndex;
        logger.info('question %s correct=%s (correctIndex=%d, answerIndex=%d)', qId, correct, question?.correctIndex, answerIndex);

  // check match state in Redis to ensure question is active and player isn't frozen
  const ms = await getMatchState(String(match._id));
  if (!ms) { socket.emit('error', { message: 'Match state not found' }); if (typeof ack === 'function') ack({ ok: false, error: 'Match state not found' }); return; }
  // Proactively clear any expired freezes for all players
  try {
    const now = Date.now();
    const frozenMap: any = ms.frozen || {};
    const toClear: string[] = [];
    for (const [pid, val] of Object.entries(frozenMap)) {
      if (typeof val === 'number' && val <= now) {
        toClear.push(String(pid));
      }
    }
    if (toClear.length > 0) {
      const patched: any = { ...frozenMap };
      for (const pid of toClear) delete patched[pid];
      await updateMatchState(String(match._id), { frozen: patched });
      try {
        for (const pid of toClear) {
          (global as any).__io?.to(`match:${String(match._id)}`).emit('playerUnfrozen', { matchId: String(match._id), playerId: pid });
        }
      } catch {}
      // reflect clean for validation below
      (ms as any).frozen = patched;
    }
  } catch {}
  if (ms.currentQuestionIndex !== questionIndex) { socket.emit('error', { message: 'Question not active' }); if (typeof ack === 'function') ack({ ok: false, error: 'Question not active' }); return; }
  // Mark activity for this question (someone interacted)
  try {
    const act = { ...((ms as any).activity || {}) } as Record<string, boolean>;
    act[String(questionIndex)] = true;
    await updateMatchState(String(match._id), { activity: act });
  } catch {}
  // Respect numeric freeze-until timestamps; clear stale entries
  if (ms.frozen) {
    const fv = (ms.frozen as any)[String(playerId)];
    if (typeof fv === 'number') {
      if (fv > Date.now()) {
        socket.emit('error', { message: 'You are frozen' });
        if (typeof ack === 'function') ack({ ok: false, error: 'You are frozen' });
        return;
      } else {
        // stale freeze, clear it
        try {
          const patched = { ...(ms.frozen as any) };
          delete patched[String(playerId)];
          await updateMatchState(String(match._id), { frozen: patched });
        } catch {}
      }
    } else if (fv) {
      socket.emit('error', { message: 'You are frozen' });
      if (typeof ack === 'function') ack({ ok: false, error: 'You are frozen' });
      return;
    }
  }
        logger.info('match state check passed: currentQuestionIndex=%d frozen=%o', ms.currentQuestionIndex, ms.frozen);

  // Update participants list to include current socket id (handles reconnections)
  try {
    const parts = Array.isArray(ms.participants) ? ms.participants : [];
    if (!parts.includes(String(socket.id))) {
      parts.push(String(socket.id));
      await updateMatchState(String(match._id), { participants: parts });
    }
  } catch {}

  logger.info('About to push answer to match.answers array');
  match.answers.push({ playerId, questionIndex, answerIndex, correct, timeMs: 0 } as any);
        logger.info('Answer pushed to match.answers, finding player...');

        // update score
        const player = match.players.find((p: any) => String(p.userId) === String(playerId));
        logger.info('Player found: %s', player ? 'yes' : 'no');
        logger.info('About to check if answer is correct: %s', correct);
        
        if (correct) {
          logger.info('Answer is correct, updating score and emitting...');
          // CORRECT ANSWER: Increase score and advance to next question immediately
          if (player) player.score = (player.score || 0) + 1;

          // notify both players of correct answer (emit first for immediate UI feedback)
          logger.info('emitting answerResult (correct) to match:%s', match._id);
          logger.info('sockets in room match:%s: %o', match._id, Array.from(io.sockets.adapter.rooms.get(`match:${match._id}`) || []));
          io.to(`match:${match._id}`).emit('answerResult', { matchId: String(match._id), playerId, correct: true, freeze: false, answerIndex, questionIndex });
          try {
            const participants: string[] = Array.isArray(ms.participants) ? ms.participants : [];
            for (const sid of participants) {
              try { io.to(sid).emit('answerResult', { matchId: String(match._id), playerId, correct: true, freeze: false, answerIndex, questionIndex }); } catch {}
            }
          } catch {}

          logger.info('About to save match after correct answer...');
          await match.save();
          logger.info('Match saved successfully after correct answer');
          
          // acknowledge receipt
          if (typeof ack === 'function') ack({ ok: true });
          // Cancel any pending timeouts for this question to avoid duplicate end/advance
          try {
            await cancelJobs(String(match._id), questionIndex);
            logger.info('Cancelled scheduled jobs for match %s question %d after correct answer', String(match._id), questionIndex);
          } catch (e) {
            logger.warn('Failed to cancel scheduled jobs for match %s question %d: %o', String(match._id), questionIndex, e);
          }
          // Show correct answer briefly, then advance
          const correctIndex = question?.correctIndex;
          io.to(`match:${match._id}`).emit('questionEnded', { matchId: String(match._id), correctIndex });
          // Reset frozen state so next question starts with both active
          try {
            const ms2 = await getMatchState(String(match._id));
            if (ms2) {
              const unfrozen: any = {};
              for (const k of Object.keys(ms2.frozen || {})) unfrozen[k] = false;
              await updateMatchState(String(match._id), { frozen: unfrozen });
            }
          } catch {}
          try {
            const participants: string[] = Array.isArray(ms.participants) ? ms.participants : [];
            for (const sid of participants) {
              try { io.to(sid).emit('questionEnded', { matchId: String(match._id), correctIndex }); } catch {}
            }
          } catch {}
          
          // Advance to next question after brief delay
          setTimeout(() => {
            if (questionIndex + 1 < (ms.questions || []).length) {
              startNextQuestion(String(match._id));
            } else {
              // No more questions, end the match
              endMatch(match, io);
            }
          }, 2000); // 2 second delay to show correct answer
          
        } else {
          logger.info('Answer is wrong, freezing player and emitting...');
          // WRONG ANSWER: Freeze player for 15 seconds, let opponent try
          try {
            // notify both players of wrong answer (emit first for immediate UI feedback)
            logger.info('emitting answerResult (wrong) to match:%s', match._id);
            logger.info('sockets in room match:%s: %o', match._id, Array.from(io.sockets.adapter.rooms.get(`match:${match._id}`) || []));
            const now = Date.now();
            let qEnd = now + 30000;
            try {
              const msState = await getMatchState(String(match._id));
              if (msState && (msState as any).questionEndAt) qEnd = (msState as any).questionEndAt;
            } catch {}
            const unfreezeTime = Math.min(now + 15000, qEnd);
            // Inform clients about the freeze timing
            io.to(`match:${match._id}`).emit('answerResult', { matchId: String(match._id), playerId, correct: false, freeze: true, answerIndex, questionIndex, unfreezeTime });
            try {
              const participants: string[] = Array.isArray(ms.participants) ? ms.participants : [];
              for (const sid of participants) {
                try { io.to(sid).emit('answerResult', { matchId: String(match._id), playerId, correct: false, freeze: true, answerIndex, questionIndex, unfreezeTime }); } catch {}
              }
            } catch {}
            logger.info('answerResult emission completed');
            // acknowledge receipt
            if (typeof ack === 'function') ack({ ok: true });

            logger.info('About to save match after wrong answer...');
            await match.save();
            logger.info('Match saved successfully after wrong answer');

            // freeze this player for 15 seconds
            logger.info('About to update match state with frozen player...');
            // Freeze only the wrong-answer player; keep others' frozen states as-is
            const newFrozen = { ...(ms.frozen || {}) } as Record<string, number>;
            newFrozen[String(playerId)] = unfreezeTime;
            await updateMatchState(String(match._id), { frozen: newFrozen });
            logger.info('Match state updated with frozen player');

            // Check if both players are now frozen
            const allPlayerIds = (ms.userIds || []).filter((id: any) => id && String(id).trim());
            const allFrozen = allPlayerIds.length > 0 && allPlayerIds.every((pid: any) => {
              const freezeValue = newFrozen[String(pid)];
              return typeof freezeValue === 'number' && freezeValue > Date.now();
            });
            
            if (allFrozen && allPlayerIds.length === 2) {
              // Both players are frozen - unfreeze both immediately and let them continue
              logger.info('Both players frozen, unfreezing both immediately');
              const unfrozenState: any = {};
              for (const pid of allPlayerIds) {
                unfrozenState[String(pid)] = false;
              }
              await updateMatchState(String(match._id), { frozen: unfrozenState });
              
              // Notify both players they are unfrozen
              for (const pid of allPlayerIds) {
                (global as any).__io?.to(`match:${String(match._id)}`).emit('playerUnfrozen', { matchId: String(match._id), playerId: pid });
              }
            } else {
              // At least one player is still active - schedule individual unfreeze
              await scheduleJob(String(match._id), questionIndex, unfreezeTime, 'unfreeze', { playerId: String(playerId) });
            }

            // Historical double-wrong unfreeze removed — early guard and all-frozen fallback prevent deadlocks
          } catch (wrongAnswerError) {
            logger.error('Error in wrong answer processing: %s', wrongAnswerError);
            logger.error('Wrong answer error stack: %s', (wrongAnswerError as Error).stack);
            throw wrongAnswerError; // Re-throw to be caught by main handler
          }
        }
      } catch (err) {
        logger.error('Error in submitAnswer handler: %s', err);
        logger.error('Error stack: %s', (err as Error).stack);
        console.error('submitAnswer error', err);
        socket.emit('error', { message: 'Internal server error' });
        if (typeof ack === 'function') ack({ ok: false, error: 'Internal server error' });
      }
    });

    // Player voluntarily leaves the match: immediate forfeit and award opponent
    socket.on('leaveMatch', async () => {
      try {
        const uid = socketUser?.sub ? String(socketUser.sub) : undefined;
        if (!uid) return;
        const existingMatchId = await redis.get(`usermatch:${uid}`);
        if (!existingMatchId) return;
        const match = await Match.findById(existingMatchId);
        if (!match || match.status === 'finished') return;
        const me = (match.players as any[]).find((p) => String(p.userId) === uid);
        const opp = (match.players as any[]).find((p) => String(p.userId) !== uid);
        const oppId = opp ? String(opp.userId) : null;
        // Notify the room that a player left so the remaining client can redirect
        try { io.to(`match:${match._id}`).emit('opponentLeft', { matchId: String(match._id) }); } catch {}
        await endMatch(match, io, oppId || undefined);
      } catch (e) {
        logger.warn('leaveMatch handler error: %o', e);
      }
    });

    socket.on('cancelSearch', async () => {
      try {
        const gid = guestIdFromClient && typeof guestIdFromClient === 'string' ? String(guestIdFromClient) : undefined;
        const uid = socketUser?.sub;
        await removeFromAllQueues({ socketId: socket.id, userId: uid, guestId: gid });
        const identity = String(uid || gid || '');
        if (identity) {
          try { await redis.del(`findlock:${identity}`); } catch {}
        }
        logger.info('cancelSearch removed any queued entries for socket %s uid=%s gid=%s', socket.id, uid, gid);
      } catch (e) {
        logger.warn('cancelSearch error: %o', e);
      }
    });

    socket.on('idleTimeout', async (data: any) => {
      try {
        const uid = socketUser?.sub ? String(socketUser.sub) : undefined;
        if (!uid || !data?.matchId) return;
        
        const match = await Match.findById(data.matchId);
        if (!match || match.status === 'finished') return;
        
        logger.info('Idle timeout received for match %s by user %s', data.matchId, uid);
        
        // End the match due to idle timeout (draw)
        await endMatch(match, io);
      } catch (e) {
        logger.warn('idleTimeout handler error: %o', e);
      }
    });

    socket.on('getFreezeState', async (data: any) => {
      try {
        if (!data?.matchId) return;
        
        const ms = await getMatchState(String(data.matchId));
        if (ms && ms.frozen) {
          logger.info('Sending freeze state sync for match %s: %o', data.matchId, ms.frozen);
          socket.emit('freezeStateSync', { matchId: data.matchId, frozen: ms.frozen });
        }
      } catch (e) {
        logger.warn('getFreezeState handler error: %o', e);
      }
    });

    socket.on('disconnect', () => {
      logger.info('socket disconnected %s', socket.id);
      // Remove this socket/user/guest from any queues to prevent ghost entries
      (async () => {
        try {
          const gid = guestIdFromClient && typeof guestIdFromClient === 'string' ? String(guestIdFromClient) : undefined;
          const uid = socketUser?.sub ? String(socketUser.sub) : undefined;
          await removeFromAllQueues({ socketId: socket.id, userId: uid, guestId: gid });
          const identity = String(uid || gid || '');
          if (identity) {
            try { await redis.del(`findlock:${identity}`); } catch {}
          }
          // Immediate forfeit if user disconnects during an active match
          if (uid) {
            const existingMatchId = await redis.get(`usermatch:${uid}`);
            if (existingMatchId) {
              const match = await Match.findById(existingMatchId);
              if (match && match.status !== 'finished') {
                const me = (match.players as any[]).find((p) => String(p.userId) === uid);
                const opp = (match.players as any[]).find((p) => String(p.userId) !== uid);
                const oppId = opp ? String(opp.userId) : null;
                // Notify the room that a player left so the remaining client can redirect
                try { io.to(`match:${match._id}`).emit('opponentLeft', { matchId: String(match._id) }); } catch {}
                await endMatch(match, (global as any).__io, oppId || undefined);
              }
            }
          }
        } catch {}
      })();
    });
  });
  // return cleanup helper so callers can close redis clients and subscriptions
  return {
    io,
    async cleanup() {
      try {
        if (subConnected) await sub.unsubscribe('match-events');
      } catch (e) {}
      try { await sub.quit(); } catch (e) {}
      try { if (pubClient) await pubClient.quit(); } catch (e) {}
      try { if (subClientAdapter) await subClientAdapter.quit(); } catch (e) {}
      try { (global as any).__io = undefined; } catch (e) {}
    },
  };
}
