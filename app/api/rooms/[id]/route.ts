import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export async function GET(
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

    const isHost = request.headers.get('x-host-token') === room.hostToken;

    if (isHost) {
      return NextResponse.json(room);
    }

    return NextResponse.json({
      id: room.id,
      answererCount: room.answererCount,
      realAnswerCount: room.realAnswerCount,
      answerers: room.answerers.map(a => ({
        id: a.id,
        number: a.number,
        nickname: a.nickname,
        isAlive: a.isAlive,
      })),
      status: room.status,
    });
  } catch (error) {
    console.error('Error getting room:', error);
    return NextResponse.json(
      { error: 'Failed to get room' },
      { status: 500 }
    );
  }
}
