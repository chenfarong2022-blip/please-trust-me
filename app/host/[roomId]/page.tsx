'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import QRCode from 'qrcode';

interface Answerer {
  id: string;
  number: number;
  nickname: string;
  hasRealAnswer?: boolean;
  answer?: string;
  pinyin?: string;
  isAlive: boolean;
}

interface RoomData {
  id: string;
  answererCount: number;
  realAnswerCount: number;
  realAnswers?: string[];
  realAnswersPinyin?: string[];
  answerers: Answerer[];
  status: string;
}

export default function HostPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;

  const [hostToken, setHostToken] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [useCustomQuestion, setUseCustomQuestion] = useState(false);
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);
  const [isDealing, setIsDealing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('hostToken');
    if (!token) {
      router.push('/');
      return;
    }
    setHostToken(token);
  }, [router]);

  useEffect(() => {
    if (!roomId) return;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : '');
    const joinUrl = `${baseUrl}/join/${roomId}`;

    QRCode.toDataURL(joinUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#EA580C',
        light: '#FFFFFF',
      },
    }).then(setQrCodeUrl);

    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`, {
          headers: { 'x-host-token': hostToken || '' },
        });
        if (res.ok) {
          const data = await res.json();
          setRoom(data);
        }
      } catch (err) {
        console.error('Failed to fetch room:', err);
      }
    };

    if (hostToken) {
      fetchRoom();
      const interval = setInterval(fetchRoom, 2000);
      return () => clearInterval(interval);
    }
  }, [roomId, hostToken]);

  useEffect(() => {
    if (room?.realAnswerCount && useCustomQuestion) {
      setCustomQuestions(Array(room.realAnswerCount).fill(''));
    }
  }, [room?.realAnswerCount, useCustomQuestion]);

  const handleDealCards = async (useRandom: boolean) => {
    if (!hostToken) return;

    if (!useRandom) {
      const emptyCount = customQuestions.filter(q => !q.trim()).length;
      if (emptyCount > 0) {
        setError(`请填写所有${customQuestions.length}个真答案 / Please fill all ${customQuestions.length} answers`);
        return;
      }
    }

    setIsDealing(true);
    setError('');

    try {
      const res = await fetch(`/api/rooms/${roomId}/deal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostToken,
          useRandom,
          customQuestions: useRandom ? undefined : customQuestions,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '发牌失败 / Deal failed');
      }

      setRoom((prev) => prev ? {
        ...prev,
        status: 'dealt',
        realAnswers: data.realAnswers,
        realAnswersPinyin: data.realAnswersPinyin,
        answerers: data.answerers.map((a: any) => ({
          id: a.id,
          number: a.number,
          nickname: a.nickname,
          hasRealAnswer: a.hasRealAnswer,
          answer: a.answer,
          pinyin: a.pinyin,
          isAlive: true,
        })),
      } : null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDealing(false);
    }
  };

  const handleRestart = async () => {
    if (!hostToken) return;

    try {
      const res = await fetch(`/api/rooms/${roomId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_game',
          hostToken,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRoom((prev) => prev ? {
          ...prev,
          status: 'waiting',
          realAnswers: [],
          realAnswersPinyin: [],
          answerers: prev.answerers.map(a => ({
            ...a,
            hasRealAnswer: false,
            answer: '',
            pinyin: '',
            isAlive: true,
          })),
        } : null);
      }
    } catch (err) {
      console.error('Failed to restart:', err);
    }
  };

  const handleEndGame = async () => {
    if (!hostToken) return;

    try {
      await fetch(`/api/rooms/${roomId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end_game',
          hostToken,
        }),
      });

      router.push('/');
    } catch (err) {
      console.error('Failed to end game:', err);
    }
  };

  if (!hostToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">加载中... / Loading...</p>
      </div>
    );
  }

  const canDeal = room?.status === 'waiting' && (room?.answerers.length || 0) >= 2;

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-orange-600 mb-2">主持人控制台 / Host Console</h1>
          <p className="text-gray-600">房间号 / Room: <span className="font-mono font-bold text-xl">{roomId}</span></p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">扫码加入 / Scan to Join</h2>
            {qrCodeUrl ? (
              <div className="flex justify-center mb-4">
                <img src={qrCodeUrl} alt="QR Code" className="rounded-xl" />
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center bg-gray-100 rounded-xl mb-4">
                <p className="text-gray-500">加载中... / Loading...</p>
              </div>
            )}
            <p className="text-center text-sm text-gray-500">
              或访问 / or visit: /join/{roomId}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">答题者列表 / Players</h2>
            <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
              {room?.answerers.map((answerer) => (
                <div
                  key={answerer.id}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    room.status === 'dealt' && answerer.hasRealAnswer
                      ? 'bg-green-50 border-2 border-green-400'
                      : answerer.isAlive
                      ? 'bg-gray-50'
                      : 'bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-orange-100 text-orange-600">
                      {answerer.number}
                    </span>
                    <span className="font-medium">{answerer.nickname}</span>
                  </span>
                  <span className={`text-sm ${
                    room.status === 'dealt' && answerer.hasRealAnswer
                      ? 'text-green-600 font-bold'
                      : 'text-gray-400'
                  }`}>
                    {room.status === 'dealt'
                      ? answerer.hasRealAnswer
                        ? '真答案 / Real'
                        : '白纸 / Blank'
                      : answerer.isAlive
                      ? '待发题 / Waiting'
                      : '出局 / Out'}
                  </span>
                </div>
              ))}
              {(!room?.answerers || room.answerers.length === 0) && (
                <p className="text-gray-500 text-center py-4">等待答题者加入... / Waiting for players...</p>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {room?.answerers.length || 0} / {room?.answererCount || 0} 人 / players
            </p>
          </div>
        </div>

        {room?.status === 'waiting' && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">设置题目 / Set Questions</h2>

            <div className="mb-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomQuestion}
                  onChange={(e) => setUseCustomQuestion(e.target.checked)}
                  className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                />
                <span className="ml-2 text-gray-700">使用自定义题目 / Custom Questions</span>
              </label>
            </div>

            {useCustomQuestion && (
              <div className="space-y-4 mb-4">
                {customQuestions.map((q, idx) => (
                  <div key={idx}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      真答案 {idx + 1} / Real Answer {idx + 1}
                    </label>
                    <input
                      type="text"
                      value={q}
                      onChange={(e) => {
                        const newQuestions = [...customQuestions];
                        newQuestions[idx] = e.target.value;
                        setCustomQuestions(newQuestions);
                      }}
                      placeholder="例如：世界上最恐怖的东西 / e.g. World's scariest thing"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                ))}
              </div>
            )}

            <p className="text-sm text-gray-500 mb-2">
              房间配置 / Config: {room?.answererCount}人局 / players，{room?.realAnswerCount}张真答案 / real answers
            </p>

            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => handleDealCards(true)}
                disabled={!canDeal || isDealing}
                className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDealing ? '发牌中... / Dealing...' : '随机发题 / Random Deal'}
              </button>
              {useCustomQuestion && (
                <button
                  onClick={() => handleDealCards(false)}
                  disabled={!canDeal || isDealing}
                  className="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  使用自定义题 / Use Custom
                </button>
              )}
            </div>

            {!canDeal && (
              <p className="text-sm text-gray-500 mt-2">至少需要2名答题者才能发题 / Need at least 2 players</p>
            )}
          </div>
        )}

        {room?.status === 'dealt' && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">发题完成 / Cards Dealt</h2>

            <div className="bg-green-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-600 mb-2">正确答案 / Correct Answers</p>
              {room.realAnswers?.map((answer, idx) => (
                <div key={idx} className="mb-2">
                  <p className="text-xl font-bold text-green-600">{answer}</p>
                  {room.realAnswersPinyin?.[idx] && (
                    <p className="text-sm text-gray-500">{room.realAnswersPinyin[idx]}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
              >
                重新发题 / Re-deal
              </button>
              <button
                onClick={handleEndGame}
                className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
              >
                结束游戏 / End Game
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">主持人须知 / Host Guide</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• 1. 答题者扫码加入房间 / Players scan to join</li>
            <li>• 2. 点击"发题"分配题目 / Click to deal questions</li>
            <li>• 3. 绿色标记的答题者持有真答案 / Green = Real Answer</li>
            <li>• 4. 主持人可查看所有人身份 / Host can see all identities</li>
            <li>• 5. 观众通过答题者描述猜测真凶 / Audience guesses by answers</li>
            <li>• 6. 游戏正式开始！ / Game starts!</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
