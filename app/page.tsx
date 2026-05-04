'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [answererCount, setAnswererCount] = useState(4);
  const [realAnswerCount, setRealAnswerCount] = useState(1);
  const [error, setError] = useState('');

  const handleCreateRoom = async () => {
    if (realAnswerCount < 1 || realAnswerCount >= answererCount) {
      setError('真答案数量必须大于0且小于答题者人数 / Real answers must be > 0 and < players');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answererCount, realAnswerCount }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '创建房间失败 / Create failed');
      }

      localStorage.setItem('hostToken', data.hostToken);
      router.push(`/host/${data.roomId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      setError('请输入房间号 / Enter room code');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      const res = await fetch(`/api/rooms/${roomId.trim().toUpperCase()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '房间不存在 / Room not found');
      }

      router.push(`/join/${roomId.trim().toUpperCase()}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  const maxRealAnswer = answererCount - 1;

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-orange-600 mb-2">请相信我</h1>
          <p className="text-gray-600">一人猜、四人辩、找真凶 / Trust Me - Find the Impostor</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">创建房间 / Create Room</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                答题者人数 / Players
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="3"
                  max="12"
                  value={answererCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setAnswererCount(val);
                    if (realAnswerCount >= val) {
                      setRealAnswerCount(val - 1);
                    }
                  }}
                  className="flex-1"
                />
                <span className="w-12 text-center font-bold text-lg text-orange-600">
                  {answererCount}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                真答案数量 / Real Answers
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max={maxRealAnswer}
                  value={realAnswerCount}
                  onChange={(e) => setRealAnswerCount(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="w-12 text-center font-bold text-lg text-green-600">
                  {realAnswerCount}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                白纸数量 / Blank cards: {answererCount - realAnswerCount}
              </p>
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              onClick={handleCreateRoom}
              disabled={isCreating}
              className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {isCreating ? '创建中... / Creating...' : '创建房间 / Create Room'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">加入房间 / Join Room</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                房间号 / Room Code
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="输入房间号 / Enter code"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 uppercase"
                maxLength={6}
              />
            </div>

            {error && !error.includes('真答案') && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              onClick={handleJoinRoom}
              disabled={isJoining}
              className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {isJoining ? '加入中... / Joining...' : '加入房间 / Join Room'}
            </button>
          </div>
        </div>

        <div className="mt-6 bg-orange-50 rounded-xl p-4">
          <h3 className="font-semibold text-orange-800 mb-2">游戏规则 / How to Play</h3>
          <ul className="text-sm text-orange-700 space-y-1">
            <li>• 房主创建房间，设置答题者人数和真答案数量 / Host creates room, set players & answers</li>
            <li>• 答题者扫码加入房间 / Players scan to join</li>
            <li>• 发题后，每人获得题目：真答案或空白 / Deal: each gets real answer or blank</li>
            <li>• 主持人查看所有人的真实身份 / Host sees all identities</li>
            <li>• 观众通过答题者的回答猜测谁拿真答案 / Audience guesses by answers</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
