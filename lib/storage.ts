/**
 * 纯内存存储 - 不依赖任何外部服务
 * 适用于本地运行 + ngrok 穿透
 */

import { Room, Answerer } from './types';

const rooms = new Map<string, Room>();
const hostTokens = new Map<string, string>(); // hostToken -> roomId
const answererTokens = new Map<string, { roomId: string; answererId: string }>();

function generateId(length: number = 6): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateToken(): string {
  return generateId(32);
}

export { generateToken, generateId };

export const storage = {
  async createRoom(hostToken: string, answererCount: number, realAnswerCount: number): Promise<Room> {
    let id = generateId();
    while (rooms.has(id)) {
      id = generateId();
    }
    
    const room: Room = {
      id,
      hostToken,
      answererCount,
      realAnswerCount,
      realAnswers: [],
      realAnswersPinyin: [],
      answerers: [],
      status: 'waiting',
      createdAt: Date.now(),
    };

    rooms.set(id, room);
    hostTokens.set(hostToken, id);
    console.log('[MemoryStorage] Room created:', id, '| Total:', rooms.size);
    return room;
  },

  async getRoom(id: string): Promise<Room | null> {
    const room = rooms.get(id);
    console.log('[MemoryStorage] getRoom:', id, room ? '✓' : '✗');
    return room || null;
  },

  async getRoomByHostToken(hostToken: string): Promise<Room | null> {
    const roomId = hostTokens.get(hostToken);
    if (!roomId) return null;
    return rooms.get(roomId) || null;
  },

  async getRoomByAnswererToken(token: string): Promise<Room | null> {
    const mapping = answererTokens.get(token);
    if (!mapping) return null;
    return rooms.get(mapping.roomId) || null;
  },

  async addAnswerer(roomId: string, nickname: string): Promise<Answerer | null> {
    const room = rooms.get(roomId);
    if (!room) {
      console.log('[MemoryStorage] addAnswerer: room not found', roomId);
      return null;
    }

    const answerer: Answerer = {
      id: generateId(8),
      token: generateToken(),
      nickname,
      hasRealAnswer: false,
      answer: '',
      pinyin: '',
      isAlive: true,
      number: room.answerers.length + 1,
    };

    room.answerers.push(answerer);
    answererTokens.set(answerer.token, { roomId, answererId: answerer.id });
    
    console.log('[MemoryStorage] Answerer added:', nickname, '| room:', roomId);
    return answerer;
  },

  async dealCards(
    roomId: string,
    realAnswers: string[],
    realAnswersPinyin: string[],
    realAnswerIndices: number[]
  ): Promise<Room | null> {
    const room = rooms.get(roomId);
    if (!room) return null;

    room.realAnswers = realAnswers;
    room.realAnswersPinyin = realAnswersPinyin;
    room.status = 'dealt';

    const answerIndexMap: Map<number, number> = new Map();
    realAnswerIndices.forEach((idx, i) => {
      answerIndexMap.set(idx, i);
    });

    room.answerers.forEach((answerer, index) => {
      if (answerIndexMap.has(index)) {
        const answerIdx = answerIndexMap.get(index)!;
        answerer.hasRealAnswer = true;
        answerer.answer = realAnswers[answerIdx];
        answerer.pinyin = realAnswersPinyin[answerIdx] || '';
      } else {
        answerer.hasRealAnswer = false;
        answerer.answer = '';
        answerer.pinyin = '';
      }
    });

    console.log('[MemoryStorage] Cards dealt in room:', roomId);
    return room;
  },

  async getAnswererByToken(token: string): Promise<{ room: Room; answerer: Answerer } | null> {
    const mapping = answererTokens.get(token);
    if (!mapping) {
      console.log('[MemoryStorage] Token not found:', token);
      return null;
    }

    const room = rooms.get(mapping.roomId);
    if (!room) {
      console.log('[MemoryStorage] Room from token not found');
      return null;
    }

    const answerer = room.answerers.find(a => a.id === mapping.answererId);
    if (!answerer) {
      console.log('[MemoryStorage] Answerer from token not found');
      return null;
    }

    return { room, answerer };
  },

  async isHost(roomId: string, token: string): Promise<boolean> {
    const room = rooms.get(roomId);
    return room?.hostToken === token;
  },

  async endGame(roomId: string): Promise<Room | null> {
    const room = rooms.get(roomId);
    if (!room) return null;
    room.status = 'ended';
    return room;
  },

  async resetGame(roomId: string): Promise<Room | null> {
    const room = rooms.get(roomId);
    if (!room) return null;
    room.status = 'waiting';
    room.realAnswers = [];
    room.realAnswersPinyin = [];
    room.answerers.forEach(a => {
      a.hasRealAnswer = false;
      a.answer = '';
      a.pinyin = '';
      a.isAlive = true;
    });
    return room;
  },

  debugGetAllRooms(): Room[] {
    return Array.from(rooms.values());
  }
};
