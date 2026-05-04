import { Room, Answerer } from './types';

function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || 'https://your-upstash-url.upstash.io';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || '';
  return { url, token };
}

async function kvGet(key: string): Promise<string | null> {
  const config = getUpstashConfig();
  if (!config.url || !config.token) {
    console.error('Upstash not configured, URL:', config.url, 'TOKEN:', config.token ? 'defined' : 'undefined');
    return null;
  }
  try {
    const encodedKey = encodeURIComponent(key);
    const res = await fetch(`${config.url}/get/${encodedKey}`, {
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
      cache: 'no-store',
    });
    const data = await res.json();
    return data.result;
  } catch (e) {
    console.error('Upstash get error:', e);
    return null;
  }
}

async function kvSet(key: string, value: string): Promise<void> {
  const config = getUpstashConfig();
  if (!config.url || !config.token) {
    console.error('Upstash not configured for set');
    return;
  }
  try {
    const encodedKey = encodeURIComponent(key);
    await fetch(`${config.url}/set/${encodedKey}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: value,
      cache: 'no-store',
    });
  } catch (e) {
    console.error('Upstash set error:', e);
  }
}

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
    const id = generateId();
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

    await kvSet(`room:${id}`, JSON.stringify(room));
    return room;
  },

  async getRoom(id: string): Promise<Room | null> {
    const data = await kvGet(`room:${id}`);
    if (!data) return null;
    return JSON.parse(data);
  },

  async updateRoom(id: string, updates: Partial<Room>): Promise<Room | null> {
    const room = await this.getRoom(id);
    if (!room) return null;
    Object.assign(room, updates);
    await kvSet(`room:${id}`, JSON.stringify(room));
    return room;
  },

  async addAnswerer(roomId: string, nickname: string): Promise<Answerer | null> {
    const room = await this.getRoom(roomId);
    if (!room) return null;

    if (room.answerers.length >= room.answererCount) {
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
    await kvSet(`room:${roomId}`, JSON.stringify(room));
    await kvSet(`answerer:${answerer.token}`, JSON.stringify({ roomId, answererId: answerer.id }));
    return answerer;
  },

  async getAnswererByToken(token: string): Promise<{ room: Room; answerer: Answerer } | null> {
    const data = await kvGet(`answerer:${token}`);
    if (!data) return null;

    const mapping = JSON.parse(data);
    const room = await this.getRoom(mapping.roomId);
    if (!room) return null;

    const answerer = room.answerers.find(a => a.id === mapping.answererId);
    if (!answerer) return null;

    return { room, answerer };
  },

  async isHost(roomId: string, token: string): Promise<boolean> {
    const room = await this.getRoom(roomId);
    return room?.hostToken === token;
  },

  async dealCards(
    roomId: string,
    realAnswers: string[],
    realAnswersPinyin: string[],
    realAnswerIndices: number[]
  ): Promise<Room | null> {
    const room = await this.getRoom(roomId);
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

    await kvSet(`room:${roomId}`, JSON.stringify(room));
    return room;
  },

  async endGame(roomId: string): Promise<Room | null> {
    const room = await this.getRoom(roomId);
    if (!room) return null;
    room.status = 'ended';
    await kvSet(`room:${roomId}`, JSON.stringify(room));
    return room;
  },

  async resetGame(roomId: string): Promise<Room | null> {
    const room = await this.getRoom(roomId);
    if (!room) return null;
    room.status = 'waiting';
    room.realAnswers = [];
    room.realAnswersPinyin = [];
    room.answerers.forEach(answerer => {
      answerer.hasRealAnswer = false;
      answerer.answer = '';
      answerer.pinyin = '';
      answerer.isAlive = true;
    });
    await kvSet(`room:${roomId}`, JSON.stringify(room));
    return room;
  },
};
