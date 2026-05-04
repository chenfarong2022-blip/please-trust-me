import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const room = await storage.getRoom(params.id);

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    if (room.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Game has already started' },
        { status: 400 }
      );
    }

    if (room.answerers.length >= room.answererCount) {
      return NextResponse.json(
        { error: 'Room is full' },
        { status: 400 }
      );
    }

    // 用时间戳+随机数确保唯一，避免昵称冲突
    const randomNum = Math.floor(Math.random() * 1000);
    const nickname = `${Date.now().toString().slice(-4)}${randomNum}`;

    // 或者用序号+时间戳
    // const nickname = `${room.answerers.length + 1}号${Date.now().toString().slice(-2)}`;
    const answerer = await storage.addAnswerer(params.id, nickname);

    if (!answerer) {
      return NextResponse.json(
        { error: 'Failed to join room' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      token: answerer.token,
      number: answerer.number,
    });
  } catch (error) {
    console.error('Error joining room:', error);
    return NextResponse.json(
      { error: 'Failed to join room' },
      { status: 500 }
    );
  }
}
