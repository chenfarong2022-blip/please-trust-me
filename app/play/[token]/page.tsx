'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface AnswererData {
  id: string;
  number: number;
  nickname: string;
  hasRealAnswer: boolean;
  answer: string;
  pinyin: string;
  isAlive: boolean;
}

export default function PlayPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [answerer, setAnswerer] = useState<AnswererData | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnswerer = async () => {
      try {
        const res = await fetch(`/api/answerer/${token}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || '获取信息失败 / Fetch failed');
        }

        setAnswerer(data.answerer);
        setRoomId(data.roomId);
        setStatus(data.status);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchAnswerer();
    const interval = setInterval(fetchAnswerer, 3000);
    return () => clearInterval(interval);
  }, [token]);

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">出错了 / Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
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

  if (!answerer) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">加载中... / Loading...</p>
        </div>
      </main>
    );
  }

  if (status !== 'dealt') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-orange-600 mb-4">等待发题 / Waiting</h1>
          <p className="text-gray-600 mb-2">
            你是 / You are <span className="font-bold text-orange-600">#{answerer.number}</span>
          </p>
          <p className="text-gray-500">
            {answerer.nickname}
          </p>
          <div className="mt-6 animate-pulse">
            <div className="h-2 bg-gray-200 rounded-full w-48 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">等待主持人发题... / Waiting for host to deal...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <p className="text-gray-500">你是 / You are</p>
          <p className="text-4xl font-bold text-orange-600">#{answerer.number}</p>
          <p className="text-gray-500">{answerer.nickname}</p>
        </div>

        <div className={`rounded-2xl p-6 mb-6 ${
          answerer.hasRealAnswer
            ? 'bg-green-50 border-2 border-green-400'
            : 'bg-gray-100 border-2 border-gray-300'
        }`}>
          {answerer.hasRealAnswer ? (
            <>
              <p className="text-sm text-green-600 mb-2">你的故事是 / Your story is</p>
              <p className="text-3xl font-bold text-green-700 mb-2">
                {answerer.answer}
              </p>
              {answerer.pinyin && (
                <p className="text-lg text-green-600">{answerer.pinyin}</p>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-2">你的故事是 / Your story is</p>
              <div className="h-12 flex items-center justify-center">
                <p className="text-3xl font-bold text-gray-400">白纸 / Blank</p>
              </div>
              <p className="text-sm text-gray-500 mt-2">你没有真答案，需要临场编造！/ No answer, improvise!</p>
            </>
          )}
        </div>

        <div className="text-sm text-gray-500">
          <p>房间号 / Room: <span className="font-mono font-bold">{roomId}</span></p>
          <p className="mt-2">等待主持人开始游戏... / Waiting for host to start...</p>
        </div>
      </div>
    </main>
  );
}
