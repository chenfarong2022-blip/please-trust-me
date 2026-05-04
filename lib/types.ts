export interface Answerer {
  id: string;
  token: string;
  nickname: string;
  hasRealAnswer: boolean;
  answer: string;
  pinyin: string;
  isAlive: boolean;
  number: number;
}

export interface Room {
  id: string;
  hostToken: string;
  answererCount: number;
  realAnswerCount: number;
  realAnswers: string[];
  realAnswersPinyin: string[];
  answerers: Answerer[];
  status: 'waiting' | 'dealt' | 'ended';
  createdAt: number;
}

export interface GameAction {
  type: 'answerer_joined' | 'answerer_left' | 'cards_dealt' | 'game_ended';
  roomId: string;
  data?: any;
  timestamp: number;
}
