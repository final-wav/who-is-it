import { GameRoom } from './GameRoom';
import classicDeckRaw from '../decks/classic.json';
import animalsDeckRaw from '../decks/animals.json';

export { GameRoom };

export interface Env {
  GAME_ROOM: DurableObjectNamespace;
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // API Routes
    if (url.pathname === '/api/room/create') {
      const roomId = generateRoomCode();
      return new Response(JSON.stringify({ roomId }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (url.pathname === '/api/decks') {
      return new Response(JSON.stringify([classicDeckRaw, animalsDeckRaw]), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // WebSocket / Durable Object Routing
    // Handles /ws/:roomId or /ws?roomId=...
    if (url.pathname.startsWith('/ws')) {
      let roomId = url.searchParams.get('roomId');
      if (!roomId) {
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
          roomId = parts[1];
        }
      }

      if (!roomId) {
        return new Response('Missing roomId parameter', { status: 400 });
      }

      roomId = roomId.toUpperCase();
      const id = env.GAME_ROOM.idFromName(roomId);
      const stub = env.GAME_ROOM.get(id);

      // Forward request to Durable Object
      return stub.fetch(request);
    }

    // Static Assets Fallback (Cloudflare Workers Static Assets)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Who Is It? Worker running.', { status: 200 });
  },
};
