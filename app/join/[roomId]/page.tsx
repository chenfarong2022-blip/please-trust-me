'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function JoinPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;

  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [roomFull, setRoomFull] = useState(false);

  useEffect(() => {
    const checkRoom = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.answerers && data.answerers.length >= data.answererCount) {
            setRoomFull(true);
          }
        }
      } catch (err) {
        console.error('Failed to check room:', err);
      }
    };

    checkRoom();
  }, [roomId]);

  const handleJoin = async () => {
    setIsJoining(true);
    setError('');

    try {
      const res = await fetch(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '加入房间失败 / Join failed');
      }

      localStorage.setItem('answererToken', data.token);
      router.push(`/play/${data.token}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  if (roomFull) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-orange-600 mb-4">房间已满 / Room Full</h1>
          <p className="text-gray-600 mb-6">抱歉，此房间答题者人数已满 / Sorry, this room is full</p>
          <button
            onClick={() => router.push('/')}
            className="py-3 px-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl"
          >
            返回首页 / Go Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-orange-600 mb-2">加入房间 / Join Room</h1>
        <p className="text-gray-600 mb-6">房间号 / Room: <span className="font-mono font-bold">{roomId}</span></p>

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <button
          onClick={handleJoin}
          disabled={isJoining}
          className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
        >
          {isJoining ? '加入中... / Joining...' : '直接加入 / Join Now'}
        </button>

        <button
          onClick={() => router.push('/')}
          className="w-full py-2 text-gray-500 hover:text-gray-700 mt-2"
        >
          返回首页 / Go Home
        </button>
      </div>
    </main>
  );
}
