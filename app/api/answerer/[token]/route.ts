import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const result = await storage.getAnswererByToken(params.token);

    if (!result) {
      return NextResponse.json(
        { error: 'Answerer not found' },
        { status: 404 }
      );
    }

    const { room, answerer } = result;

    return NextResponse.json({
      roomId: room.id,
      answerer: {
        id: answerer.id,
        number: answerer.number,
        nickname: answerer.nickname,
        hasRealAnswer: answerer.hasRealAnswer,
        answer: answerer.answer,
        pinyin: answerer.pinyin,
        isAlive: answerer.isAlive,
      },
      status: room.status,
    });
  } catch (error) {
    console.error('Error getting answerer:', error);
    return NextResponse.json(
      { error: 'Failed to get answerer' },
      { status: 500 }
    );
  }
}
