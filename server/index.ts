import { join } from 'node:path';
import type { ServerWebSocket } from 'bun';
import classicDeckRaw from '../decks/classic.json';
import animalsDeckRaw from '../decks/animals.json';
import { Room, RoomManager } from './game';

const rm = new RoomManager();

interface WSData {
  code: string | null;
  playerId: string | null;
}
type WS = ServerWebSocket<WSData>;

const DIST = join(import.meta.dir, '..', 'client', 'dist');

function safeSend(ws: WS, msg: any) {
  try {
    ws.send(JSON.stringify(msg));
  } catch {
    // Socket disconnected
  }
}

function broadcast(room: Room) {
  const p1 = room.player1;
  const p2 = room.player2;
  if (p1 && p1.connected) {
    try {
      p1.send({ t: 'state', state: room.snapshotFor(p1.id) });
    } catch {}
  }
  if (p2 && p2.connected) {
    try {
      p2.send({ t: 'state', state: room.snapshotFor(p2.id) });
    } catch {}
  }
}

function handle(ws: WS, raw: string) {
  let msg: any;
  try {
    msg = JSON.parse(raw);
  } catch {
    return;
  }

  // Support both compact format (t: "create") and worker format (type: "JOIN")
  const type = msg.t || msg.type;

  // Unauthenticated messages (Join / Create / Rejoin)
  if (type === 'create' || type === 'join' || type === 'rejoin' || type === 'JOIN') {
    let room: Room | undefined;

    if (type === 'create') {
      room = rm.create();
      room.onChange = () => broadcast(room!);
    } else {
      const code = (msg.code || msg.payload?.roomId || '').toUpperCase();
      room = rm.get(code);
      if (!room) {
        return safeSend(ws, { t: 'error', message: `Raum "${code}" nicht gefunden.` });
      }
    }

    let playerId: string, token: string, slot: 1 | 2;
    const playerName = msg.name || msg.payload?.playerName || 'Spieler';

    if (type === 'rejoin') {
      const p = room.reattach(msg.playerId, msg.token, (m) => safeSend(ws, m));
      if (!p) {
        return safeSend(ws, { t: 'error', message: 'Sitzung abgelaufen — bitte neu beitreten.' });
      }
      playerId = p.id;
      token = p.token;
      slot = p.slot;
    } else {
      // If client sent existing playerId/token in payload, check reattach first
      if (msg.payload?.playerId && msg.payload?.token) {
        const reattached = room.reattach(msg.payload.playerId, msg.payload.token, (m) => safeSend(ws, m));
        if (reattached) {
          playerId = reattached.id;
          token = reattached.token;
          slot = reattached.slot;
          ws.data.code = room.code;
          ws.data.playerId = playerId;
          safeSend(ws, { t: 'joined', code: room.code, playerId, token, slot });
          broadcast(room);
          return;
        }
      }

      if (room.isFull()) {
        return safeSend(ws, { t: 'error', message: 'Der Raum ist bereits voll (2/2 Spieler).' });
      }

      const p = room.addPlayer(playerName, (m) => safeSend(ws, m));
      playerId = p.id;
      token = p.token;
      slot = p.slot;
    }

    ws.data.code = room.code;
    ws.data.playerId = playerId;

    safeSend(ws, { t: 'joined', code: room.code, playerId, token, slot });
    broadcast(room);
    return;
  }

  // All other actions require an active session
  const { code, playerId } = ws.data;
  if (!code || !playerId) {
    return safeSend(ws, { t: 'error', message: 'Nicht in einem Raum.' });
  }

  const room = rm.get(code);
  if (!room) {
    return safeSend(ws, { t: 'error', message: 'Raum ist nicht mehr aktiv.' });
  }

  let err: string | null = null;
  switch (type) {
    case 'start':
    case 'START_GAME':
      err = room.start(playerId, msg.deckId || msg.payload?.deckId, msg.customDeck || msg.payload?.customDeck);
      break;
    case 'ask':
    case 'ASK_QUESTION':
      err = room.askQuestion(
        playerId,
        msg.question || msg.payload?.question,
        msg.attributeFilter || msg.payload?.attributeFilter
      );
      break;
    case 'answer':
    case 'ANSWER_QUESTION':
      err = room.answerQuestion(playerId, msg.answer ?? msg.payload?.answer);
      break;
    case 'endElimination':
    case 'END_ELIMINATION':
      err = room.endElimination(playerId);
      break;
    case 'guess':
    case 'GUESS_CHARACTER':
      err = room.guessCharacter(playerId, msg.characterId || msg.payload?.characterId);
      break;
    case 'toggleCard':
    case 'TOGGLE_CARD':
      err = room.toggleCard(
        playerId,
        msg.characterId || msg.payload?.characterId,
        msg.eliminated ?? msg.payload?.eliminated
      );
      break;
    case 'rematch':
    case 'REMATCH_REQUEST':
      err = room.rematch(playerId);
      break;
    case 'settings':
    case 'UPDATE_SETTINGS':
      err = room.updateSettings(playerId, msg.settings || msg.payload);
      break;
    case 'leave':
      room.markDisconnected(playerId);
      ws.data.code = null;
      ws.data.playerId = null;
      break;
    case 'PING':
      safeSend(ws, { type: 'PONG' });
      return;
  }

  if (err) safeSend(ws, { t: 'error', message: err });
  broadcast(room);
  if (room.empty) rm.dispose(room.code);
}

async function serveStatic(pathname: string): Promise<Response> {
  const rel = pathname === '/' ? '/index.html' : pathname;
  let file = Bun.file(join(DIST, rel));
  if (!(await file.exists())) file = Bun.file(join(DIST, 'index.html'));
  if (!(await file.exists())) {
    return new Response("Client-Build fehlt. Bitte 'bun run build' ausführen.", { status: 404 });
  }
  return new Response(file);
}

const port = Number(process.env.PORT ?? 3000);

const server = Bun.serve<WSData>({
  port,
  async fetch(req, srv) {
    const url = new URL(req.url);

    if (url.pathname === '/ws') {
      const ok = srv.upgrade(req, { data: { code: null, playerId: null } });
      return ok ? undefined : new Response('WebSocket-Upgrade fehlgeschlagen', { status: 400 });
    }

    if (url.pathname === '/api/decks') {
      return Response.json([classicDeckRaw, animalsDeckRaw]);
    }

    if (url.pathname === '/api/room/create') {
      const room = rm.create();
      room.onChange = () => broadcast(room);
      return Response.json({ roomId: room.code });
    }

    return serveStatic(url.pathname);
  },
  websocket: {
    message(ws, raw) {
      handle(ws, String(raw));
    },
    close(ws) {
      const { code, playerId } = ws.data;
      if (!code || !playerId) return;
      const room = rm.get(code);
      if (!room) return;
      room.markDisconnected(playerId);
      broadcast(room);
      if (room.empty) rm.dispose(room.code);
    },
  },
});

console.log(`\n🔎 Wer-ist-es? Server läuft auf http://localhost:${server.port}`);
console.log(`   WebSocket:  ws://localhost:${server.port}/ws\n`);
